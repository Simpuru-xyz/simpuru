// Buy one listing over x402.
//   bun run buy <listingId> [instant|protected]
import { X402_NETWORK } from "@simpuru/core";
import { ESCROW, isOurDeployment } from "@simpuru/core/escrow";
import { toClientCardanoSigner } from "@x402/cardano";
import { ExactCardanoScheme } from "@x402/cardano/exact/client";
import { decodePaymentResponseHeader, wrapFetchWithPayment, x402Client } from "@x402/fetch";

const need = (k: string) => {
  const v = process.env[k];
  if (!v) throw new Error(`${k} is not set (see .env.example)`);
  return v;
};

const [listingId, mode = "protected"] = process.argv.slice(2);
if (!listingId || (mode !== "instant" && mode !== "protected")) {
  console.error("usage: bun run buy <listingId> [instant|protected]");
  process.exit(1);
}
const api = process.env.SIMPURU_API_URL ?? "http://localhost:4021";
// Per-payment ceiling, checked before anything is signed.
const maxPerPayment = process.env.MAX_PER_PAYMENT_LOVELACE ?? "20000000";

const signer = toClientCardanoSigner({
  mnemonic: need("BUYER_MNEMONIC"),
  network: X402_NETWORK,
  provider: {
    blockfrost: {
      baseUrl: "https://cardano-preprod.blockfrost.io/api/v0",
      projectId: need("BLOCKFROST_PROJECT_ID"),
    },
  },
  validateCustomMasumiDeployment: isOurDeployment,
});

const client = x402Client.fromConfig({
  schemes: [{ network: X402_NETWORK, client: new ExactCardanoScheme(signer) }],
  policies: [
    // Pick the path we asked for. Protected only ever pays into our own escrow.
    (_v, reqs) =>
      reqs.filter((r) =>
        mode === "protected"
          ? r.extra?.assetTransferMethod === "masumi" && r.payTo === ESCROW.address
          : (r.extra?.assetTransferMethod ?? "default") === "default",
      ),
  ],
  spendControls: {
    allowedAssets: [
      { network: X402_NETWORK, asset: "lovelace", maxAmountPerPayment: maxPerPayment },
    ],
  },
});

const pay = wrapFetchWithPayment(fetch, client);
const started = Date.now();
const res = await pay(`${api}/listings/${listingId}/unlock`);
const body = await res.text();
const header = res.headers.get("PAYMENT-RESPONSE");
const settlement = header ? decodePaymentResponseHeader(header) : undefined;

console.log(
  JSON.stringify(
    {
      status: res.status,
      mode,
      seconds: (Date.now() - started) / 1000,
      tx: settlement?.transaction,
      buyer: signer.getAddress(),
    },
    null,
    2,
  ),
);
if (res.ok) console.log(`--- content ---\n${body}`);
else {
  const required = res.headers.get("PAYMENT-REQUIRED");
  const why = required ? JSON.parse(Buffer.from(required, "base64").toString()).error : undefined;
  console.error(why ?? body);
}
if (!res.ok) process.exit(1);
