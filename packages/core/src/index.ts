// Isomorphic: types and constants only, safe to import from the browser.
// Hash helpers live in "@simpuru/core/hash" (node:crypto, server side).

// ponytail: preprod only until the team decides otherwise.
export const NETWORK = "preprod" as const;
export const X402_NETWORK = "cardano:preprod" as const;

/** `instant` = x402 `default` (pay, get content). `protected` = x402 `masumi` (pay into escrow). */
export type DeliveryMode = "instant" | "protected";

/** Fixed list a listing's category must come from (the catalogue filter). */
export const CATEGORIES = [
  "Landing Page",
  "Hero",
  "Portfolio",
  "SaaS",
  "Fintech",
  "3D",
  "AI",
  "Editorial",
  "Wellness",
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Listing {
  id: string;
  title: string;
  description: string;
  /** Price in lovelace, as a string to survive JSON. */
  priceLovelace: string;
  sellerAddress: string;
  modes: DeliveryMode[];
  /** Lowercase hex SHA-256 of the content the buyer receives. */
  contentHash: string;
  /** Optional https URL of a recording of what the content produces (mp4, webm, webp, gif). Free to view. */
  previewMedia?: string;
  category?: Category;
  /** Unix ms, as a string. */
  createdAt?: string;
  /** Purchases that were not refunded. */
  sales?: number;
  /**
   * From the seller's closed escrows: score = 100 * withdrawn / (withdrawn + refunded), where a
   * dispute the seller lost counts as refunded. `basis` = how many closed escrows. Absent until one.
   */
  sellerReputation?: { score: number; basis: number };
}

/** vested_pay datum `state`, in constructor order (index = on-chain value). */
export const ESCROW_STATES = [
  "FundsLocked",
  "ResultSubmitted",
  "RefundRequested",
  "Disputed",
  "WithdrawAuthorized",
  "RefundAuthorized",
] as const;
export type EscrowState = (typeof ESCROW_STATES)[number];

/** Where a purchase is from the buyer's point of view. `withdrawn` / `refunded` mean the lock is spent. */
export type PurchaseStatus = EscrowState | "withdrawn" | "refunded" | "settled";

/** Unix milliseconds, as strings to survive JSON. */
export interface EscrowDeadlines {
  payBy: string;
  submitResult: string;
  unlock: string;
  externalDisputeUnlock: string;
}

export interface PurchaseEvent {
  status: PurchaseStatus;
  txHash: string;
  at: string;
}

export interface Purchase {
  id: string;
  listingId: string;
  mode: DeliveryMode;
  buyerAddress: string;
  /** Payment tx (instant) or lock tx (protected). */
  txHash: string;
  status: PurchaseStatus;
  /** Protected path only. */
  escrow?: {
    address: string;
    inputHash: string;
    resultHash?: string;
    identifierFromPurchaser: string;
    deadlines: EscrowDeadlines;
  };
  events: PurchaseEvent[];
}

export const explorerTx = (txHash: string) =>
  `https://preprod.cardanoscan.io/transaction/${txHash}`;
