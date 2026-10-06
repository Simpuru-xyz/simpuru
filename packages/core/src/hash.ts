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

/**
 * What a creator signs (CIP-8 / CIP-30 `signData`, with the payment key of `sellerAddress`) to
 * publish a listing: binds the address to the exact content, price and time, so nobody can list
 * under someone else's address.
 */
export const listingProofDigest = (
  sellerAddress: string,
  contentHashHex: string,
  priceLovelace: string,
  timestampMs: number,
) =>
  sha256Hex(
    `simpuru:listing:v1\n${sellerAddress}\n${contentHashHex}\n${priceLovelace}\n${timestampMs}`,
  );

/**
 * Team convention for Simpuru escrow purchases: the seller's `result_hash` is the MIP-004 result
 * hash with the **lock tx hash** as `identifier_from_purchaser` (x402 locks carry none of their own,
 * and the lock tx hash is unique and known to buyer, seller and arbiter).
 */
export const purchaseResultHash = (lockTxHash: string, content: string) =>
  resultHash(lockTxHash, content);
