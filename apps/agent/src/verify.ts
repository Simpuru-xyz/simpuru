import { contentHash, purchaseResultHash } from "@simpuru/core/hash";
import { computeInputHash, type MasumiInputCommitment } from "@x402/cardano";
import type { PurchaseRecord } from "./buyer";

/** The datum fields verification needs; any vested_pay datum parser provides them. */
export interface LockHashes {
  inputHash: string;
  /** Empty until the seller submits a result. */
  resultHash: string;
}

export type Verdict =
  /** Delivery matches everything the seller committed to. */
  | { status: "ok" }
  /** Something does not match: dispute it (or refund, if no result is on chain). */
  | { status: "mismatch"; reasons: string[] }
  /** Content checks out so far, but the seller has not put a result on chain yet. */
  | { status: "no_result_yet" };

/**
 * Checks a delivery against the listing commitment, the seller-signed input commitment and,
 * for protected purchases, the escrow datum. Pure: the caller reads the datum from chain.
 */
export function verifyDelivery(
  record: PurchaseRecord,
  content: string,
  lock?: LockHashes,
): Verdict {
  const reasons: string[] = [];
  const received = contentHash(content);
  if (received !== record.listingContentHash)
    reasons.push(`content hash ${received} != listing commitment ${record.listingContentHash}`);

  if (!record.escrow) return reasons.length ? { status: "mismatch", reasons } : { status: "ok" };

  const commitment = record.escrow.inputCommitment as MasumiInputCommitment | null;
  const listingPart = commitment?.parts.find((p) => p.name === "listing");
  const committed = (listingPart?.content as { contentHash?: string } | undefined)?.contentHash;
  if (!commitment) reasons.push("no input commitment recorded");
  else {
    if (committed !== record.listingContentHash)
      reasons.push(
        `signed quote commits to content ${committed}, listing says ${record.listingContentHash}`,
      );
    const recomputed = computeInputHash(commitment);
    if (recomputed !== record.escrow.inputHash)
      reasons.push(
        `input commitment hashes to ${recomputed}, quote says ${record.escrow.inputHash}`,
      );
  }
  if (lock && lock.inputHash !== record.escrow.inputHash)
    reasons.push(`escrow input_hash ${lock.inputHash} != quote ${record.escrow.inputHash}`);

  if (reasons.length) return { status: "mismatch", reasons };
  if (!lock || lock.resultHash === "") return { status: "no_result_yet" };
  const expected = purchaseResultHash(record.txHash, content);
  return lock.resultHash === expected
    ? { status: "ok" }
    : {
        status: "mismatch",
        reasons: [`escrow result_hash ${lock.resultHash} != ${expected} for what we received`],
      };
}
