import { describe, expect, test } from "bun:test";
import { contentHash, purchaseResultHash } from "@simpuru/core/hash";
import { commitmentPartDigest, computeInputHash } from "@x402/cardano";
import type { PurchaseRecord } from "./buyer";
import { verifyDelivery } from "./verify";

const CONTENT = "order_id,city\n1,Jakarta\n";
const LOCK_TX = "ab".repeat(32);

const commitmentFor = (committedHash: string) => {
  const part = {
    name: "listing",
    canonicalization: "jcs" as const,
    mediaType: "application/json",
    content: { listingId: "x", contentHash: committedHash },
  };
  const c = {
    version: "1",
    algorithm: "sha256",
    parts: [{ ...part, digest: commitmentPartDigest(part) }],
    digest: "",
  };
  return { ...c, digest: computeInputHash(c) };
};

const record = (
  over: Partial<PurchaseRecord> = {},
  committed = contentHash(CONTENT),
): PurchaseRecord => {
  const commitment = commitmentFor(committed);
  return {
    at: new Date().toISOString(),
    listingId: "x",
    mode: "protected",
    priceLovelace: "6000000",
    txHash: LOCK_TX,
    receivedContentHash: contentHash(CONTENT),
    listingContentHash: contentHash(CONTENT),
    escrow: {
      address: "addr_test1w",
      blockchainIdentifier: "",
      inputHash: commitment.digest,
      inputCommitment: commitment,
      deadlines: { payBy: "0", submitResult: "0", unlock: "0", externalDisputeUnlock: "0" },
    },
    ...over,
  };
};

describe("verifyDelivery", () => {
  const r = record();
  const inputHash = r.escrow?.inputHash ?? "";

  test("ok when content, commitment and on-chain result all match", () => {
    expect(
      verifyDelivery(r, CONTENT, { inputHash, resultHash: purchaseResultHash(LOCK_TX, CONTENT) }),
    ).toEqual({ status: "ok" });
  });

  test("no_result_yet while the seller has not submitted", () => {
    expect(verifyDelivery(r, CONTENT, { inputHash, resultHash: "" }).status).toBe("no_result_yet");
  });

  test("mismatch on tampered content", () => {
    const v = verifyDelivery(r, `${CONTENT}x`, {
      inputHash,
      resultHash: purchaseResultHash(LOCK_TX, `${CONTENT}x`),
    });
    expect(v.status).toBe("mismatch");
  });

  test("mismatch when the on-chain result is for other content", () => {
    expect(
      verifyDelivery(r, CONTENT, { inputHash, resultHash: purchaseResultHash(LOCK_TX, "other") })
        .status,
    ).toBe("mismatch");
  });

  test("mismatch when the signed quote committed to a different content hash", () => {
    expect(verifyDelivery(record({}, "0".repeat(64)), CONTENT).status).toBe("mismatch");
  });

  test("mismatch when the escrow binds another input", () => {
    expect(verifyDelivery(r, CONTENT, { inputHash: "1".repeat(64), resultHash: "" }).status).toBe(
      "mismatch",
    );
  });

  test("instant purchase only checks the listing commitment", () => {
    const instant = record({ mode: "instant", escrow: undefined });
    expect(verifyDelivery(instant, CONTENT).status).toBe("ok");
    expect(verifyDelivery(instant, "tampered").status).toBe("mismatch");
  });
});
