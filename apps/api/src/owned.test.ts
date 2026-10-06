import { expect, test } from "bun:test";
import { unlockProofDigest } from "@simpuru/core/hash";
import { toMasumiSellerSigner } from "@x402/cardano";
import { createApp } from "./app";
import { openDb } from "./db";
import { encodeProof, PROOF_HEADER, PURCHASE_HEADER } from "./owned";
import { insertPurchase } from "./purchases";
import { addListing } from "./test-helpers";

// Public BIP-39 test vectors, never funded.
const alice = toMasumiSellerSigner({
  mnemonic: `${"abandon ".repeat(23)}art`,
  network: "cardano:preprod",
});
const bob = toMasumiSellerSigner({
  mnemonic: `${"zoo ".repeat(23)}vote`,
  network: "cardano:preprod",
});
const LISTING = "hero-prompt";

const setup = (status = "settled") => {
  const db = openDb(":memory:");
  addListing(db, LISTING, { content: "Build ONE standalone HTML file for a hero." });
  addListing(db, "other-listing");
  insertPurchase(db, {
    txHash: "ab".repeat(32),
    listingId: LISTING,
    mode: "instant",
    payer: alice.sellerAddress,
    status,
    terms: "{}",
  });
  return createApp(db);
};

const proof = async (
  signer = alice,
  address = signer.sellerAddress,
  listingId = LISTING,
  timestamp = Date.now(),
) => {
  const { key, signature } = await signer.signTerms(
    address,
    unlockProofDigest(listingId, address, timestamp),
  );
  return encodeProof({ address, timestamp, key, signature });
};

const unlock = async (app: ReturnType<typeof createApp>, header?: string) =>
  app.request(`/listings/${LISTING}/unlock`, header ? { headers: { [PROOF_HEADER]: header } } : {});

test("a buyer who paid gets the content again without paying", async () => {
  const res = await unlock(setup(), await proof());
  expect(res.status).toBe(200);
  expect(res.headers.get(PURCHASE_HEADER)).toBe("ab".repeat(32));
  expect(await res.text()).toStartWith("Build ONE standalone HTML file");
});

test.each([
  ["no proof", async () => undefined],
  ["someone who never paid", async () => proof(bob)],
  ["a proof for another listing", async () => proof(alice, alice.sellerAddress, "other-listing")],
  [
    "an expired proof",
    async () => proof(alice, alice.sellerAddress, LISTING, Date.now() - 10 * 60_000),
  ],
  ["bob claiming alice's address", async () => proof(bob, alice.sellerAddress)],
  ["garbage", async () => "not-base64-json"],
])("falls through to the gate for %s", async (_, make) => {
  const res = await unlock(setup(), await make());
  expect(res.status).not.toBe(200);
});

test("a refunded purchase no longer unlocks", async () => {
  expect((await unlock(setup("refunded"), await proof())).status).not.toBe(200);
});
