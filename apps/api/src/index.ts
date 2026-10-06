import { createBuyer } from "@simpuru/agent";
import { createApp } from "./app";
import { openDb } from "./db";
import { createPaywall } from "./paywall";
import { seed } from "./seed";
import { startSellerAgent } from "./seller";

const need = (k: string) => {
  const v = process.env[k];
  if (!v) throw new Error(`${k} is not set (see .env.example)`);
  return v;
};

const db = openDb();
const paywall = createPaywall(db, {
  // The second wallet sells the deliberately bad demo listings (optional).
  sellerMnemonics: [need("SELLER_MNEMONIC"), process.env.DEMO_SELLER_MNEMONIC].filter(
    (m): m is string => Boolean(m),
  ),
  blockfrostProjectId: need("BLOCKFROST_PROJECT_ID"),
});
seed(db, paywall.sellerAddresses[1] ?? paywall.sellerAddress);
startSellerAgent(db, need("BLOCKFROST_PROJECT_ID"), {
  keys: new Map(
    [process.env.SELLER_MNEMONIC, process.env.DEMO_SELLER_MNEMONIC]
      .filter((m): m is string => Boolean(m))
      .map((mnemonic, i) => [paywall.sellerAddresses[i] ?? "", { mnemonic }]),
  ),
  main: paywall.sellerAddress,
});

const port = Number(process.env.PORT ?? 4021);

// Hosted MCP pays from a separate demo wallet with tight limits (preprod tADA only), so an agent
// can shop by adding one URL. Off unless MCP_BUYER_MNEMONIC is set.
const MCP_DAILY_BUDGET = 30_000_000n;
const mcp = process.env.MCP_BUYER_MNEMONIC
  ? {
      buyer: createBuyer({
        mnemonic: process.env.MCP_BUYER_MNEMONIC,
        blockfrostProjectId: need("BLOCKFROST_PROJECT_ID"),
        apiUrl: `http://127.0.0.1:${port}`,
        maxPerPaymentLovelace: 10_000_000n,
        dailyBudgetLovelace: MCP_DAILY_BUDGET,
        logPath: `${process.env.DATA_DIR ?? "data"}/mcp-purchases.jsonl`,
      }),
      api: `http://127.0.0.1:${port}`,
      dailyBudgetLovelace: MCP_DAILY_BUDGET,
      walletNote:
        "Hosted Simpuru MCP: purchases are paid from a shared preprod demo wallet. Run the MCP locally to pay from your own wallet.",
    }
  : undefined;

export default {
  port,
  fetch: createApp(db, paywall, mcp).fetch,
  // A paid request waits for the chain (settlement takes 20-60 s); Bun's default would cut it at 10 s.
  idleTimeout: 255,
};
