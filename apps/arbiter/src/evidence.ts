// Dispute decision from evidence, never by hand.
//
// Three facts are checked, each against something the seller cannot change after the lock:
//   1. the escrow's `input_hash` is the commitment to { listingId, contentHash } the
//      paywall issued, so this escrow paid for this listing;
//   2. the escrow's `result_hash` is sha256(identifierFromPurchaser + ";" + output), so
//      `output` is what the seller put its name to on chain;
//   3. sha256(output) is the listing's `contentHash`, so what was delivered is what was sold.
//
// The seller wins only if all three hold. If nobody can show an output matching the
// on-chain result hash, the seller cannot prove delivery and the buyer wins.
import { contentHash, resultHash } from "@simpuru/core/hash";
import { commitmentPartDigest, computeInputHash } from "@x402/cardano";

export interface DisputeEvidence {
  /** From the escrow datum on chain. */
  escrow: { inputHash: string; resultHash: string };
  /** The listing the buyer says it paid for. */
  listing: { id: string; contentHash: string };
  /** What was delivered, as received. */
  output: string;
  identifierFromPurchaser: string;
}

export type Verdict =
  | { winner: "seller"; checks: Checks }
  | { winner: "buyer"; checks: Checks; reason: string };

interface Checks {
  escrowIsForListing: boolean;
  outputIsWhatSellerPosted: boolean;
  outputMatchesListing: boolean;
}

/** The `input_hash` the paywall's listing commitment produces (apps/api/src/paywall.ts). */
export function listingInputHash(listing: { id: string; contentHash: string }): string {
  const content = { listingId: listing.id, contentHash: listing.contentHash };
  return computeInputHash({
    version: "1",
    algorithm: "sha256",
    parts: [
      {
        name: "listing",
        canonicalization: "jcs",
        mediaType: "application/json",
        content,
        digest: commitmentPartDigest({ canonicalization: "jcs", content }),
      },
    ],
    digest: "",
  });
}

export function decide(e: DisputeEvidence): Verdict {
  const checks: Checks = {
    escrowIsForListing: listingInputHash(e.listing) === e.escrow.inputHash,
    outputIsWhatSellerPosted:
      resultHash(e.identifierFromPurchaser, e.output) === e.escrow.resultHash,
    outputMatchesListing: contentHash(e.output) === e.listing.contentHash,
  };
  if (!checks.escrowIsForListing) {
    return { winner: "buyer", checks, reason: "the escrow was not locked for this listing" };
  }
  if (!checks.outputIsWhatSellerPosted) {
    return {
      winner: "buyer",
      checks,
      reason: "no output matching the seller's on-chain result hash was shown",
    };
  }
  if (!checks.outputMatchesListing) {
    return { winner: "buyer", checks, reason: "the delivered content does not match the listing" };
  }
  return { winner: "seller", checks };
}
