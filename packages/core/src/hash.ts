import { createHash } from "node:crypto";

export const sha256Hex = (data: string | Uint8Array) =>
  createHash("sha256").update(data).digest("hex");

/** Listing commitment: SHA-256 of the exact bytes the buyer will receive. */
export const contentHash = (content: string | Uint8Array) => sha256Hex(content);

/**
 * MIP-004 result hash, the value the seller writes to the escrow's `result_hash`:
 * `sha256(identifier_from_purchaser + ";" + output)`.
 *
 * `input_hash` is not here: for x402 locks it is the commitment-manifest digest,
 * use `computeInputHash` from `@x402/cardano`.
 */
export const resultHash = (identifierFromPurchaser: string, output: string) =>
  sha256Hex(`${identifierFromPurchaser};${output}`);

/** Max age of a returning-buyer proof. */
export const UNLOCK_PROOF_MAX_AGE_MS = 5 * 60_000;

/**
 * What a returning buyer signs (CIP-8, with its payment key) to get content it already paid for
 * without paying again. Binds listing, address and time, so a proof can't be reused elsewhere.
 */
export const unlockProofDigest = (listingId: string, address: string, timestampMs: number) =>
  sha256Hex(`simpuru:unlock:v1\n${listingId}\n${address}\n${timestampMs}`);
