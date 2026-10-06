import { createApp } from "./app";
import { openDb } from "./db";
import { createPaywall } from "./paywall";
import { seed } from "./seed";

const need = (k: string) => {
  const v = process.env[k];
  if (!v) throw new Error(`${k} is not set (see .env.example)`);
  return v;
};

const db = openDb();
const paywall = createPaywall(db, {
  sellerMnemonic: need("SELLER_MNEMONIC"),
  blockfrostProjectId: need("BLOCKFROST_PROJECT_ID"),
});
seed(db, paywall.sellerAddress);

export default {
  port: Number(process.env.PORT ?? 4021),
  fetch: createApp(db, paywall).fetch,
  // A paid request waits for the chain (settlement takes 20-60 s); Bun's default would cut it at 10 s.
  idleTimeout: 255,
};
