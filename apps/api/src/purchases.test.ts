import { expect, test } from "bun:test";
import { unlockProofDigest } from "@simpuru/core/hash";
import { toMasumiSellerSigner } from "@x402/cardano";
import { createApp } from "./app";
import { openDb } from "./db";
import { encodeProof, PROOF_HEADER } from "./owned";
import { addEvent, insertPurchase, type PurchaseView } from "./purchases";
import { addListing } from "./test-helpers";

const alice = toMasumiSellerSigner({
  mnemonic: `${"abandon ".repeat(23)}art`,
  network: "cardano:preprod",
});
const bob = toMasumiSellerSigner({
  mnemonic: `${"zoo ".repeat(23)}vote`,
  network: "cardano:preprod",
});
const SELLER = `addr_test1${"q".repeat(98)}`;
const LOCK = "ab".repeat(32);
const terms = JSON.stringify({
  extra: {
    terms: {
      inputHash: "11".repeat(32),
      payByTime: "1",
      submitResultTime: "2",
      unlockTime: "3",
      externalDisputeUnlockTime: "4",
    },
  },
});

const setup = () => {
  const db = openDb(":memory:");
  addListing(db, "lumen-aurora-hero", { sellerAddress: SELLER });
  insertPurchase(db, {
    txHash: LOCK,
    listingId: "lumen-aurora-hero",
    mode: "protected",
    payer: alice.sellerAddress,
    status: "FundsLocked",
    terms,
  });
  addEvent(db, LOCK, "ResultSubmitted", "cd".repeat(32));
  return createApp(db);
};
const proofFrom = async (signer: typeof alice) => {
  const timestamp = Date.now();
  const address = signer.sellerAddress;
  const { key, signature } = await signer.signTerms(
    address,
    unlockProofDigest("lumen-aurora-hero", address, timestamp),
  );
  return encodeProof({ address, timestamp, key, signature });
};
const postVerdict = async (app: ReturnType<typeof setup>, proof: string, verification: string) =>
  app.request(`/purchases/${LOCK}/verification`, {
    method: "POST",
    headers: { "content-type": "application/json", [PROOF_HEADER]: proof },
    body: JSON.stringify({ verification }),
  });

test("purchase view has the shape the web reads", async () => {
  const v = (await (await setup().request(`/purchases/${LOCK}`)).json()) as PurchaseView;
  expect(v.id).toBe(LOCK);
  expect(v.buyerAddress).toBe(alice.sellerAddress);
  expect(v.escrow?.identifierFromPurchaser).toBe(LOCK);
  expect(v.escrow?.deadlines).toEqual({
    payBy: "1",
    submitResult: "2",
    unlock: "3",
    externalDisputeUnlock: "4",
  });
  expect(v.events.map((e) => e.status)).toEqual(["FundsLocked", "ResultSubmitted"]);
});

test("unknown purchase is 404", async () => {
  expect((await setup().request("/purchases/nope")).status).toBe(404);
});

test("seller list filters by the listing's seller", async () => {
  const app = setup();
  expect(
    ((await (await app.request(`/purchases?seller=${SELLER}`)).json()) as unknown[]).length,
  ).toBe(1);
  expect(
    ((await (await app.request("/purchases?seller=addr_test1other")).json()) as unknown[]).length,
  ).toBe(0);
  expect((await app.request("/purchases")).status).toBe(400);
});

test("only the buyer can report a verdict", async () => {
  const app = setup();
  expect((await postVerdict(app, await proofFrom(bob), "mismatch")).status).toBe(403);
  expect((await postVerdict(app, "garbage", "mismatch")).status).toBe(403);
  expect((await postVerdict(app, await proofFrom(alice), "maybe")).status).toBe(400);
  const ok = await postVerdict(app, await proofFrom(alice), "mismatch");
  expect(ok.status).toBe(200);
  expect(((await ok.json()) as { verification: string }).verification).toBe("mismatch");
});
