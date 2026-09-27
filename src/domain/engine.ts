import {
  DAY_MS,
  DEFAULT_VALIDITY_MS,
  type Evidence,
  type Finding,
  type ListingIdentity,
  type ReportChain,
  type ReportLifecycle,
  type ReportStatus,
  REVOKE_REASONS,
  type RevokeReason,
  type VersionPayload,
} from "./types";

export type Clock = () => Date;
export const systemClock: Clock = () => new Date();

const clean = (value: string): string => value.normalize("NFKC").trim().replace(/\s+/g, " ");
const token = (value: string): string => encodeURIComponent(value);
const iso = (date: Date): string => {
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date");
  return date.toISOString();
};
const date = (value: string): Date => {
  const result = new Date(value);
  if (Number.isNaN(result.getTime())) throw new Error("Invalid stored date");
  return result;
};
const assertNonNegativeInteger = (value: number, field: string): void => {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${field} must be a non-negative safe integer`);
};

/** Status precedence is intentional and independent of timestamp order. */
export function deriveStatus(state: ReportLifecycle, now: Date): ReportStatus {
  if (state.revokedAt) return "revoked";
  if (state.voidedAt) return "voided";
  if (state.supersededAt) return "superseded";
  if (now.getTime() >= state.expiresAt.getTime()) return "expired";
  return "issued";
}

/** Canonical, versioned identity; safe for equality checks (not a cryptographic hash). */
export function canonicalizeListing(input: ListingIdentity): string {
  assertNonNegativeInteger(input.priceMinor, "priceMinor");
  if (input.caratMilli !== undefined) assertNonNegativeInteger(input.caratMilli, "caratMilli");
  const domain = clean(input.sellerDomain).toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  const listing = clean(input.listingId).toLowerCase();
  const lab = clean(input.certificateLab ?? "").toUpperCase();
  const certificate = clean(input.certificateNumber ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const currency = clean(input.currency).toUpperCase();
  if (!domain || !listing || !currency) throw new Error("sellerDomain, listingId, and currency are required");
  return [
    "listing:v1",
    `seller=${token(domain)}`,
    `id=${token(listing)}`,
    `lab=${token(lab)}`,
    `certificate=${token(certificate)}`,
    `currency=${token(currency)}`,
    `priceMinor=${input.priceMinor}`,
    `caratMilli=${input.caratMilli ?? ""}`,
  ].join("|");
}

export const listingFingerprint = canonicalizeListing;

export function expiresSevenDaysAfter(issuedAt: Date): Date {
  return new Date(issuedAt.getTime() + DEFAULT_VALIDITY_MS);
}

export function createReportChain(args: {
  chainId: string;
  payload: VersionPayload;
  clock?: Clock;
}): ReportChain {
  const now = (args.clock ?? systemClock)();
  if (!args.chainId.trim()) throw new Error("chainId is required");
  const createdAt = iso(now);
  return {
    chainId: args.chainId,
    issuedAt: createdAt,
    expiresAt: iso(expiresSevenDaysAfter(now)),
    extensionUsed: false,
    appealUsed: false,
    versions: [{ version: 1, createdAt, payload: structuredClone(args.payload) }],
  };
}

/** Returns a new chain. Existing versions and their payloads are never mutated. */
export function appendVersion(chain: ReportChain, payload: VersionPayload, clock: Clock = systemClock): ReportChain {
  assertChainInvariants(chain);
  if (chain.revoked) throw new Error("Cannot append to a revoked chain");
  const previous = chain.versions.at(-1)!;
  const createdAt = iso(clock());
  if (Date.parse(createdAt) < Date.parse(previous.createdAt)) throw new Error("Version time cannot move backwards");
  return {
    ...chain,
    versions: [...chain.versions, { version: previous.version + 1, createdAt, payload: structuredClone(payload) }],
  };
}

export function extendChain(chain: ReportChain): ReportChain {
  assertChainInvariants(chain);
  if (chain.extensionUsed) throw new Error("This chain has already been extended");
  if (chain.revoked) throw new Error("Cannot extend a revoked chain");
  return { ...chain, extensionUsed: true, expiresAt: iso(new Date(date(chain.expiresAt).getTime() + 7 * DAY_MS)) };
}

/** An appeal consumes the chain-wide allowance and appends a verdict version. */
export function appealChain(chain: ReportChain, payload: VersionPayload, clock: Clock = systemClock): ReportChain {
  if (chain.appealUsed) throw new Error("This chain has already been appealed");
  if (payload.phase !== "verdict") throw new Error("An appeal must produce a verdict");
  const updated = appendVersion(chain, payload, clock);
  return { ...updated, appealUsed: true };
}

export function revokeChain(chain: ReportChain, reason: RevokeReason, clock: Clock = systemClock): ReportChain {
  assertChainInvariants(chain);
  if (!REVOKE_REASONS.includes(reason)) throw new Error("Unsupported revoke reason");
  if (chain.revoked) throw new Error("Chain is already revoked");
  return { ...chain, revoked: { at: iso(clock()), reason } };
}

export function deriveFindings(phase: "preliminary" | "verdict", evidence: Evidence): readonly Finding[] {
  const findings: Finding[] = [];
  const add = (id: string, severity: Finding["severity"], summary: string) => findings.push({ id, severity, summary });
  if (evidence.certificateMatch === true) add("certificate-match", "positive", "Certificate details match the submitted listing.");
  if (evidence.certificateMatch === false) add("certificate-mismatch", "critical", "Certificate details conflict with the submitted listing.");
  if (evidence.certificateMatch === null) add("certificate-unverified", "caution", "Certificate details could not be verified.");
  if (evidence.specificationsMatch === true) add("specifications-match", "positive", "Submitted specifications are internally consistent.");
  if (evidence.specificationsMatch === false) add("specifications-mismatch", "critical", "Submitted specifications contain material inconsistencies.");
  if (evidence.specificationsMatch === null) add("specifications-unverified", "caution", "Specifications require additional evidence.");
  if (evidence.priceDeltaPercent === null) add("price-unavailable", "caution", "Pricing fairness could not be assessed.");
  else if (evidence.priceDeltaPercent > 20) add("price-high", "critical", "Price is materially above the comparison benchmark.");
  else if (evidence.priceDeltaPercent < -20) add("price-low", "caution", "Price is materially below benchmark and warrants added verification.");
  else add("price-fair", "positive", "Price is within the comparison benchmark range.");
  if (evidence.sellerEstablished === true) add("seller-established", "positive", "Seller evidence indicates an established operating history.");
  if (evidence.sellerEstablished === false) add("seller-risk", "critical", "Seller evidence indicates elevated credibility risk.");
  if (evidence.sellerEstablished === null) add("seller-unverified", "caution", "Seller credibility could not be established.");
  if (phase === "preliminary") add("preliminary", "caution", "This preliminary review is not the final verdict.");
  return findings.sort((a, b) => a.id.localeCompare(b.id));
}

export function assertChainInvariants(chain: ReportChain): void {
  if (!chain.chainId.trim()) throw new Error("chainId is required");
  const issuedAt = date(chain.issuedAt).getTime();
  const expiresAt = date(chain.expiresAt).getTime();
  const expectedLifetime = DEFAULT_VALIDITY_MS + (chain.extensionUsed ? 7 * DAY_MS : 0);
  if (expiresAt - issuedAt !== expectedLifetime) throw new Error("Invalid chain expiry");
  if (chain.versions.length === 0) throw new Error("A chain needs at least one version");
  chain.versions.forEach((version, index) => {
    if (version.version !== index + 1) throw new Error("Versions must be contiguous and start at one");
    date(version.createdAt);
    if (index > 0 && Date.parse(version.createdAt) < Date.parse(chain.versions[index - 1]!.createdAt)) {
      throw new Error("Version timestamps must be monotonic");
    }
  });
  if (chain.revoked) {
    date(chain.revoked.at);
    if (!REVOKE_REASONS.includes(chain.revoked.reason)) throw new Error("Unsupported revoke reason");
  }
}