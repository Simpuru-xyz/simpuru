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
