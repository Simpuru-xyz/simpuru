import type { Category, DeliveryMode } from "@simpuru/core";
import { contentHash } from "@simpuru/core/hash";
import { type Db, insertListing } from "./db";

export const SELLER = `addr_test1${"q".repeat(98)}`;
export const DEMO_SELLER = `addr_test1${"z".repeat(98)}`;

/** A creator's listing, inserted directly (tests only). */
export function addListing(
  db: Db,
  id: string,
  over: Partial<{
    title: string;
    description: string;
    priceLovelace: string;
    sellerAddress: string;
    modes: DeliveryMode[];
    content: string;
    category: Category;
    previewMedia: string;
  }> = {},
) {
  const content = over.content ?? `prompt body of ${id}`;
  insertListing(db, {
    id,
    title: over.title ?? id,
    description: over.description ?? `about ${id}`,
    priceLovelace: over.priceLovelace ?? "6000000",
    sellerAddress: over.sellerAddress ?? SELLER,
    modes: over.modes ?? ["instant", "protected"],
    content,
    contentHash: contentHash(content),
    ...(over.category ? { category: over.category } : {}),
    ...(over.previewMedia ? { previewMedia: over.previewMedia } : {}),
  });
}

import { listingProofDigest } from "@simpuru/core/hash";
import { toMasumiSellerSigner } from "@x402/cardano";
import { encodeProof } from "./owned";

// Public BIP-39 test vectors, never funded.
export const alice = toMasumiSellerSigner({
  mnemonic: `${"abandon ".repeat(23)}art`,
  network: "cardano:preprod",
});
export const bob = toMasumiSellerSigner({
  mnemonic: `${"zoo ".repeat(23)}vote`,
  network: "cardano:preprod",
});

/** The X-Simpuru-Proof a creator sends with a new listing. */
export async function listingProof(
  signer: typeof alice,
  body: { sellerAddress: string; content: string; priceLovelace: string },
  timestamp = Date.now(),
) {
  const digest = listingProofDigest(
    body.sellerAddress,
    contentHash(body.content),
    body.priceLovelace,
    timestamp,
  );
  const { key, signature } = await signer.signTerms(body.sellerAddress, digest);
  return encodeProof({ address: body.sellerAddress, timestamp, key, signature });
}
