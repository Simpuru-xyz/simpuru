// Buy one listing over x402.
//   bun run buy <listingId> [instant|protected]
import { explorerTx } from "@simpuru/core";
import { buyerFromEnv } from "./buyer";

const [listingId, mode = "protected"] = process.argv.slice(2);
if (!listingId || (mode !== "instant" && mode !== "protected")) {
  console.error("usage: bun run buy <listingId> [instant|protected]");
  process.exit(1);
}

const buyer = buyerFromEnv();
const r = await buyer.buy(listingId, mode);
if (!r.ok) {
  console.error(`not paid: ${r.error}`);
  process.exit(1);
}
if (r.redelivered) {
  console.log(`already paid (${explorerTx(r.txHash)}), content delivered again for free`);
  console.log(`--- content ---\n${r.content}`);
  process.exit(0);
}
const { record } = r;
console.log(
  JSON.stringify({ ...record, explorer: explorerTx(record.txHash), seconds: r.seconds }, null, 2),
);
console.log(
  record.receivedContentHash === record.listingContentHash
    ? "content matches the listing's committed hash"
    : "WARNING: content does NOT match the listing's committed hash",
);
console.log(`--- content ---\n${r.content}`);
