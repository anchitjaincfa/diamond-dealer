import { describe, expect, it } from "vitest";
import {
  DAY_MS,
  appealChain,
  appendVersion,
  assertChainInvariants,
  canonicalizeListing,
  createReportChain,
  deriveFindings,
  deriveStatus,
  expiresSevenDaysAfter,
  extendChain,
  revokeChain,
  type Evidence,
  type VersionPayload,
} from "../../src/domain";

const at = (value: string) => () => new Date(value);
const fingerprint = canonicalizeListing({
  sellerDomain: "EXAMPLE.TEST",
  listingId: "SYNTHETIC-1",
  certificateLab: "LAB",
  certificateNumber: "AB-12 34",
  currency: "usd",
  priceMinor: 500_000,
  caratMilli: 1000,
});
const evidence: Evidence = {
  certificateMatch: true,
  specificationsMatch: true,
  priceDeltaPercent: 2,
  sellerEstablished: true,
};
const payload = (phase: "preliminary" | "verdict" = "preliminary", note?: string): VersionPayload => ({
  phase,
  fingerprint,
  findings: deriveFindings(phase, evidence),
  ...(note ? { note } : {}),
});
const newChain = () => createReportChain({
  chainId: "chain-synthetic-001",
  payload: payload(),
  clock: at("2030-01-01T00:00:00.000Z"),
});

describe("deriveStatus", () => {
  const base = {
    issuedAt: new Date("2030-01-01T00:00:00Z"),
    expiresAt: new Date("2030-01-08T00:00:00Z"),
  };

  it("uses revoked > voided > superseded > expired > issued precedence", () => {
    const now = new Date("2030-02-01T00:00:00Z");
    expect(deriveStatus({ ...base, supersededAt: now }, now)).toBe("superseded");
    expect(deriveStatus({ ...base, supersededAt: now, voidedAt: now }, now)).toBe("voided");
    expect(deriveStatus({ ...base, supersededAt: now, voidedAt: now, revokedAt: now }, now)).toBe("revoked");
  });

  it("expires exactly at the boundary", () => {
    expect(deriveStatus(base, new Date("2030-01-07T23:59:59.999Z"))).toBe("issued");
    expect(deriveStatus(base, new Date("2030-01-08T00:00:00.000Z"))).toBe("expired");
  });
});

describe("listing identity", () => {
  it("canonicalizes cosmetic variations deterministically", () => {
    const variant = canonicalizeListing({
      sellerDomain: " https://example.test/ ",
      listingId: " synthetic-1 ",
      certificateLab: " lab ",
      certificateNumber: "ab1234",
      currency: " USD ",
      priceMinor: 500_000,
      caratMilli: 1000,
    });
    expect(variant).toBe(fingerprint);
    expect(variant).toContain("listing:v1|seller=example.test");
  });

  it("rejects invalid money and missing identity", () => {
    expect(() => canonicalizeListing({ sellerDomain: "x.test", listingId: "x", currency: "USD", priceMinor: -1 })).toThrow();
    expect(() => canonicalizeListing({ sellerDomain: "", listingId: "x", currency: "USD", priceMinor: 1 })).toThrow();
  });
});

describe("expiry and chain quotas", () => {
  it("sets an exact seven-day expiry", () => {
    const issued = new Date("2030-03-08T12:30:00Z");
    expect(expiresSevenDaysAfter(issued).getTime() - issued.getTime()).toBe(7 * DAY_MS);
    expect(newChain().expiresAt).toBe("2030-01-08T00:00:00.000Z");
  });

  it("allows exactly one seven-day extension per chain", () => {
    const extended = extendChain(newChain());
    expect(extended.expiresAt).toBe("2030-01-15T00:00:00.000Z");
    expect(extended.extensionUsed).toBe(true);
    expect(() => extendChain(extended)).toThrow(/already been extended/);
    assertChainInvariants(extended);
  });

  it("allows one appeal and requires a verdict", () => {
    expect(() => appealChain(newChain(), payload("preliminary"))).toThrow(/must produce a verdict/);
    const appealed = appealChain(newChain(), payload("verdict", "Synthetic appeal"), at("2030-01-02T00:00:00Z"));
    expect(appealed.appealUsed).toBe(true);
    expect(appealed.versions).toHaveLength(2);
    expect(() => appealChain(appealed, payload("verdict"))).toThrow(/already been appealed/);
  });
});

describe("append-only report versions", () => {
  it("an upgrade keeps v1 byte-identical and does not mutate its input", () => {
    const original = newChain();
    const v1Bytes = JSON.stringify(original.versions[0]);
    const originalBytes = JSON.stringify(original);
    const upgraded = appendVersion(original, payload("verdict"), at("2030-01-02T00:00:00Z"));

    expect(JSON.stringify(upgraded.versions[0])).toBe(v1Bytes);
    expect(JSON.stringify(original)).toBe(originalBytes);
    expect(upgraded.versions.map((item) => item.version)).toEqual([1, 2]);
    assertChainInvariants(upgraded);
  });

  it("defensively clones payloads at ingestion", () => {
    const mutable = payload("verdict") as { note?: string };
    const upgraded = appendVersion(newChain(), mutable as VersionPayload, at("2030-01-02T00:00:00Z"));
    mutable.note = "changed outside";
    expect(upgraded.versions[1]?.payload.note).toBeUndefined();
  });

  it("rejects non-contiguous, backwards, and malformed chains", () => {
    const chain = newChain();
    expect(() => assertChainInvariants({ ...chain, versions: [{ ...chain.versions[0]!, version: 2 }] })).toThrow(/contiguous/);
    expect(() => appendVersion(chain, payload("verdict"), at("2029-12-31T00:00:00Z"))).toThrow(/backwards/);
    expect(() => assertChainInvariants({ ...chain, expiresAt: "2030-01-09T00:00:00Z" })).toThrow(/expiry/);
  });
});

describe("revocation", () => {
  it.each(["fraud", "material-error", "duplicate", "legal-request"] as const)("accepts %s", (reason) => {
    const revoked = revokeChain(newChain(), reason, at("2030-01-03T00:00:00Z"));
    expect(revoked.revoked).toEqual({ at: "2030-01-03T00:00:00.000Z", reason });
    expect(() => appendVersion(revoked, payload("verdict"))).toThrow(/revoked/);
    expect(() => extendChain(revoked)).toThrow(/revoked/);
  });

  it("rejects unknown and repeated revocations", () => {
    expect(() => revokeChain(newChain(), "other" as never)).toThrow(/Unsupported/);
    expect(() => revokeChain(revokeChain(newChain(), "fraud"), "fraud")).toThrow(/already revoked/);
  });
});

describe("deterministic findings", () => {
  it("is stable regardless of repeated evaluation", () => {
    expect(deriveFindings("verdict", evidence)).toEqual(deriveFindings("verdict", { ...evidence }));
    expect(deriveFindings("verdict", evidence).map((finding) => finding.id)).toEqual([
      "certificate-match", "price-fair", "seller-established", "specifications-match",
    ]);
  });

  it("surfaces critical mismatches and distinguishes preliminary output", () => {
    const risk: Evidence = {
      certificateMatch: false,
      specificationsMatch: false,
      priceDeltaPercent: 30,
      sellerEstablished: false,
    };
    expect(deriveFindings("verdict", risk).every((finding) => finding.severity === "critical")).toBe(true);
    expect(deriveFindings("preliminary", risk).some((finding) => finding.id === "preliminary")).toBe(true);
    expect(deriveFindings("verdict", risk).some((finding) => finding.id === "preliminary")).toBe(false);
  });
});