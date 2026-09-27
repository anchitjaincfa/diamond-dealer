export const DAY_MS = 86_400_000;
export const DEFAULT_VALIDITY_MS = 7 * DAY_MS;

export type ReportLifecycle = {
  issuedAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  voidedAt?: Date;
  supersededAt?: Date;
};

export type ReportStatus = "revoked" | "voided" | "superseded" | "expired" | "issued";
export type RevokeReason = "fraud" | "material-error" | "duplicate" | "legal-request";
export const REVOKE_REASONS: readonly RevokeReason[] = [
  "fraud", "material-error", "duplicate", "legal-request",
];

export type ListingIdentity = {
  sellerDomain: string;
  listingId: string;
  certificateLab?: string;
  certificateNumber?: string;
  currency: string;
  priceMinor: number;
  caratMilli?: number;
};

export type FindingSeverity = "positive" | "caution" | "critical";
export type Finding = Readonly<{
  id: string;
  severity: FindingSeverity;
  summary: string;
}>;

export type Evidence = Readonly<{
  certificateMatch: boolean | null;
  specificationsMatch: boolean | null;
  priceDeltaPercent: number | null;
  sellerEstablished: boolean | null;
}>;

export type ReviewPhase = "preliminary" | "verdict";

export type VersionPayload = Readonly<{
  phase: ReviewPhase;
  fingerprint: string;
  findings: readonly Finding[];
  note?: string;
}>;

export type ReportVersion = Readonly<{
  version: number;
  createdAt: string;
  payload: VersionPayload;
}>;

export type ReportChain = Readonly<{
  chainId: string;
  issuedAt: string;
  expiresAt: string;
  extensionUsed: boolean;
  appealUsed: boolean;
  revoked?: Readonly<{ at: string; reason: RevokeReason }>;
  versions: readonly ReportVersion[];
}>;