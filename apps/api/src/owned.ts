import { UNLOCK_PROOF_MAX_AGE_MS, unlockProofDigest } from "@simpuru/core/hash";
import { verifySellerTermsSignature } from "@x402/cardano";
import type { MiddlewareHandler } from "hono";
import { type Db, findPurchase, getListing } from "./db";

/** Headers a returning buyer sends; see `unlockProofDigest`. */
export const PROOF_HEADER = "X-Simpuru-Proof";
export const PURCHASE_HEADER = "X-Simpuru-Purchase";

export type UnlockProof = { address: string; timestamp: number; key: string; signature: string };

export const encodeProof = (p: UnlockProof) => Buffer.from(JSON.stringify(p)).toString("base64");

/** Returns the address the proof was signed by, or null. Never throws. */
export function verifyProof(header: string, listingId: string, now = Date.now()): string | null {
  try {
    const p = JSON.parse(Buffer.from(header, "base64").toString()) as UnlockProof;
    if (typeof p.timestamp !== "number" || Math.abs(now - p.timestamp) > UNLOCK_PROOF_MAX_AGE_MS)
      return null;
    const digest = unlockProofDigest(listingId, p.address, p.timestamp);
    // Same CIP-8 check x402 uses for the seller's terms: the key must belong to `address`.
    return verifySellerTermsSignature(p.key, p.signature, p.address, digest) ? p.address : null;
  } catch {
    return null;
  }
}

/**
 * Serves content to a buyer who proves they already paid for it, before the x402 gate.
 * No proof, a bad proof or no purchase: falls through to the gate (402).
 */
export const ownedContent =
  (db: Db): MiddlewareHandler =>
  async (c, next) => {
    const header = c.req.header(PROOF_HEADER);
    const listing = header ? getListing(db, c.req.param("id") ?? "") : null;
    const buyer = header && listing ? verifyProof(header, listing.id) : null;
    const tx = listing && buyer ? findPurchase(db, listing.id, buyer) : null;
    if (!listing || !tx) return next();
    c.header(PURCHASE_HEADER, tx);
    return c.text(listing.content);
  };
