import { describe, expect, test } from "bun:test";
import { PrivateKey } from "@evolution-sdk/evolution";
import { contentHash, resultHash } from "@simpuru/core/hash";
import { issueMasumiRequirements, toMasumiSellerSigner } from "@x402/cardano";
import { decide, listingInputHash } from "./evidence";

const listing = { id: "lst_1", contentHash: contentHash("the real report") };
const identifierFromPurchaser = "buyer-nonce-1";

describe("listingInputHash", () => {
  // Oracle: the x402 issuer the paywall runs must produce the same input_hash for the
  // same commitment. If the two ever drift, the arbiter would judge every escrow as
  // "not for this listing".
  test("equals the input hash the x402 issuer puts on the escrow", async () => {
    const seller = toMasumiSellerSigner({
      mnemonic: PrivateKey.generateMnemonic(256),
      network: "cardano:preprod",
    });
    const now = Date.now();
    const req = await issueMasumiRequirements({
      network: "cardano:preprod",
      asset: "lovelace",
      amount: "5000000",
      maxTimeoutSeconds: 600,
      sellerAddress: seller.sellerAddress,
      signTerms: seller.signTerms,
      commitment: [
        {
          name: "listing",
          canonicalization: "jcs",
          mediaType: "application/json",
          content: { listingId: listing.id, contentHash: listing.contentHash },
        },
      ],
      payByTime: String(now + 5 * 60_000),
      submitResultTime: String(now + 20 * 60_000),
      unlockTime: String(now + 35 * 60_000),
      externalDisputeUnlockTime: String(now + 50 * 60_000),
    });
    const extra = req.extra as { inputCommitment: { digest: string } };
    expect(listingInputHash(listing)).toBe(extra.inputCommitment.digest);
  });
});

describe("decide", () => {
  const deadline = 1_000_000n;
  const before = { evidenceDeadlineMs: deadline, nowMs: deadline - 1n };
  const after = { evidenceDeadlineMs: deadline, nowMs: deadline + 1n };
  const escrowFor = (output: string, l = listing) => ({
    inputHash: listingInputHash(l),
    resultHash: resultHash(identifierFromPurchaser, output),
  });
  const real = "the real report";

  test("seller wins when the posted output is the listed content", () => {
    const v = decide({
      escrow: escrowFor(real),
      listing,
      output: real,
      identifierFromPurchaser,
      ...before,
    });
    expect(v.winner).toBe("seller");
  });

  test("buyer wins when the seller posted a hash of the wrong content", () => {
    const v = decide({
      escrow: escrowFor("junk"),
      listing,
      output: "junk",
      identifierFromPurchaser,
      ...before,
    });
    expect(v).toMatchObject({
      winner: "buyer",
      checks: { outputIsWhatSellerPosted: true, outputMatchesListing: false },
    });
  });

  test("a buyer withholding the real delivery gets no verdict before the evidence deadline", () => {
    // The seller delivered the listed content; the caller sends something else.
    const v = decide({
      escrow: escrowFor(real),
      listing,
      output: "made up",
      identifierFromPurchaser,
      ...before,
    });
    expect(v).toMatchObject({ winner: null, checks: { outputIsWhatSellerPosted: false } });
  });

  test("after the deadline, a seller that never showed its posted output loses", () => {
    const v = decide({
      escrow: escrowFor("never shown"),
      listing,
      output: real,
      identifierFromPurchaser,
      ...after,
    });
    expect(v).toMatchObject({ winner: "buyer", checks: { outputIsWhatSellerPosted: false } });
  });

  test("buyer wins when the escrow was locked for a different listing", () => {
    const other = { id: "lst_2", contentHash: listing.contentHash };
    const v = decide({
      escrow: escrowFor(real, other),
      listing,
      output: real,
      identifierFromPurchaser,
      ...before,
    });
    expect(v).toMatchObject({ winner: "buyer", checks: { escrowIsForListing: false } });
  });
});
