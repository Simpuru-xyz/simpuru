// Makes a protected purchase on preprod without the API and records it the way
// buyer.ts does (purchase log + delivery), so the watcher can be shown on real escrows.
//
//   bun apps/agent/scripts/preprod-protected-purchase.ts <received content> [submitAfterMin=16]
//
// The listing is "lst_demo" committing to sha256("the real report"). Pass that text as the
// received content for an honest delivery, anything else for a bad one.
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Transaction } from "@evolution-sdk/evolution";
import { contentHash } from "@simpuru/core/hash";
import {
  findEscrowUtxo,
  isOurDeployment,
  KOIOS_PREPROD,
  loadDeployment,
  mnemonicFor,
  readClient,
} from "@simpuru/escrow";
import {
  issueMasumiRequirements,
  toClientCardanoSigner,
  toMasumiSellerSigner,
} from "@x402/cardano";
import type { PurchaseRecord } from "../src/buyer";

const NETWORK = "cardano:preprod";
const received = process.argv[2];
if (received === undefined) throw new Error("usage: <received content> [submitAfterMin]");
const submitAfterMin = BigInt(process.argv[3] ?? "16");
const listing = {
  id: "lst_demo",
  contentHash: contentHash("the real report"),
  priceLovelace: "5000000",
};
const MIN = 60_000n;
const now = BigInt(Date.now());
const ours = loadDeployment();

const seller = toMasumiSellerSigner({ mnemonic: mnemonicFor("seller"), network: NETWORK });
const requirements = await issueMasumiRequirements({
  network: NETWORK,
  asset: "lovelace",
  amount: listing.priceLovelace,
  maxTimeoutSeconds: 900,
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
  payByTime: (now + 10n * MIN).toString(),
  submitResultTime: (now + submitAfterMin * MIN).toString(),
  unlockTime: (now + (submitAfterMin + 15n) * MIN).toString(),
  externalDisputeUnlockTime: (now + (submitAfterMin + 30n) * MIN).toString(),
  deployment: ours.deployment,
});

const buyer = toClientCardanoSigner({
  mnemonic: mnemonicFor("buyer"),
  network: NETWORK,
  provider: { koios: { baseUrl: KOIOS_PREPROD } },
  validateCustomMasumiDeployment: isOurDeployment,
});
const signed = await buyer.buildAndSignPaymentTransaction({
  network: NETWORK,
  payTo: requirements.payTo,
  asset: requirements.asset,
  amount: requirements.amount,
  maxTimeoutSeconds: requirements.maxTimeoutSeconds,
  extra: requirements.extra,
});
const tx = Transaction.fromCBORBytes(Buffer.from(signed.transaction, "base64"));
const txHash = Buffer.from((await readClient().submitTx(tx)).hash).toString("hex");

// Proof first: the escrow UTxO must be on chain before we record a purchase.
for (let i = 0; ; i++) {
  try {
    await findEscrowUtxo(`${txHash}#0`);
    break;
  } catch (error) {
    if (i >= 20) throw error;
    await Bun.sleep(10_000);
  }
}

const extra = requirements.extra as {
  terms: Record<string, string>;
  inputCommitment: unknown;
  blockchainIdentifier: string;
};
const record: PurchaseRecord = {
  at: new Date().toISOString(),
  listingId: listing.id,
  mode: "protected",
  priceLovelace: listing.priceLovelace,
  txHash,
  receivedContentHash: contentHash(received),
  listingContentHash: listing.contentHash,
  escrow: {
    address: ours.escrowAddress,
    blockchainIdentifier: extra.blockchainIdentifier,
    inputHash: extra.terms.inputHash ?? "",
    inputCommitment: extra.inputCommitment,
    deadlines: {
      payBy: extra.terms.payByTime ?? "",
      submitResult: extra.terms.submitResultTime ?? "",
      unlock: extra.terms.unlockTime ?? "",
      externalDisputeUnlock: extra.terms.externalDisputeUnlockTime ?? "",
    },
  },
};
const dataDir = new URL("../data", import.meta.url).pathname;
mkdirSync(join(dataDir, "deliveries"), { recursive: true });
appendFileSync(join(dataDir, "purchases.jsonl"), `${JSON.stringify(record)}\n`);
writeFileSync(join(dataDir, "deliveries", txHash), received);
console.log(
  JSON.stringify(
    { lockTx: txHash, escrow: `${txHash}#0`, received, deadlines: record.escrow?.deadlines },
    null,
    2,
  ),
);
