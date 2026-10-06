// Locks funds at our escrow through the real x402 Masumi path:
//   seller issues a signed quote  ->  buyer's x402 client builds and signs the lock
//   ->  we broadcast it  ->  we read the escrow UTxO back and decode its datum.
//
//   bun packages/escrow/scripts/preprod-lock.ts [submitAfterMin=30] [amountTada=5]
//
// Deadlines are minutes from now: pay-by 10, submit-result `submitAfterMin`,
// unlock +15 after that, external dispute +15 after that.
import { Address, Transaction } from "@evolution-sdk/evolution";
import {
  issueMasumiRequirements,
  parseMasumiLockDatum,
  toClientCardanoSigner,
  toMasumiSellerSigner,
} from "@x402/cardano";
import { KOIOS_PREPROD, mnemonicFor, readClient } from "../src/chain";
import { isOurDeployment, loadDeployment } from "../src/deployment";

const NETWORK = "cardano:preprod";
const submitAfterMin = BigInt(process.argv[2] ?? "30");
const amount = BigInt(process.argv[3] ?? "5") * 1_000_000n;
const MIN = 60_000n;

const ours = loadDeployment();
const now = BigInt(Date.now());
const seller = toMasumiSellerSigner({ mnemonic: mnemonicFor("seller"), network: NETWORK });

const requirements = await issueMasumiRequirements({
  network: NETWORK,
  asset: "lovelace",
  amount: amount.toString(),
  maxTimeoutSeconds: 900,
  sellerAddress: seller.sellerAddress,
  signTerms: seller.signTerms,
  commitment: [
    {
      name: "body",
      canonicalization: "jcs",
      mediaType: "application/json",
      content: { item: "preprod-proof", issue: 3 },
    },
  ],
  payByTime: (now + 10n * MIN).toString(),
  submitResultTime: (now + submitAfterMin * MIN).toString(),
  unlockTime: (now + (submitAfterMin + 15n) * MIN).toString(),
  externalDisputeUnlockTime: (now + (submitAfterMin + 30n) * MIN).toString(),
  deployment: ours.deployment,
});
if (requirements.payTo !== ours.escrowAddress) {
  throw new Error(`quote pays ${requirements.payTo}, not our escrow ${ours.escrowAddress}`);
}

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

const client = readClient();
const tx = Transaction.fromCBORBytes(Buffer.from(signed.transaction, "base64"));
const txHash = Buffer.from((await client.submitTx(tx)).hash).toString("hex");
console.error(`submitted ${txHash}, waiting for the escrow UTxO...`);

// Proof is the escrow UTxO on chain, not the hash: poll until it appears, then decode it.
const deadline = Date.now() + 240_000;
for (;;) {
  const utxos = await client.getUtxos(Address.fromBech32(ours.escrowAddress));
  const mine = utxos.find((u) => Buffer.from(u.transactionId.hash).toString("hex") === txHash);
  if (mine) {
    const datum = mine.datumOption?._tag === "InlineDatum" ? mine.datumOption.data : undefined;
    const view = datum ? parseMasumiLockDatum(datum) : null;
    if (!view) throw new Error("escrow UTxO found but its datum does not decode as a Masumi lock");
    console.log(
      JSON.stringify(
        {
          utxo: `${txHash}#${Number(mine.index)}`,
          escrow: ours.escrowAddress,
          lockedLovelace: mine.assets.lovelace.toString(),
          state: view.state.toString(),
          collateralReturnLovelace: view.collateralReturnLovelace.toString(),
          inputHash: view.inputHash,
          payByTime: new Date(Number(view.payByTime)).toISOString(),
          submitResultTime: new Date(Number(view.submitResultTime)).toISOString(),
          unlockTime: new Date(Number(view.unlockTime)).toISOString(),
          externalDisputeUnlockTime: new Date(Number(view.externalDisputeUnlockTime)).toISOString(),
          buyerNonceInput: signed.nonce,
        },
        null,
        2,
      ),
    );
    break;
  }
  if (Date.now() > deadline) throw new Error(`no escrow UTxO for ${txHash} after 240 s`);
  await Bun.sleep(10_000);
}
