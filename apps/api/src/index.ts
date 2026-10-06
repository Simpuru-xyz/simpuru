import { createAccounts, DEMO_OWNER } from "./accounts";
import { lovelaceAt, sendAllTo, startAgentWatchers } from "./agents";
import { createApp } from "./app";
import { openDb } from "./db";
import { createOAuth } from "./oauth";
import { createPaywall } from "./paywall";
import { seed } from "./seed";
import { blockfrost, startSellerAgent } from "./seller";

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

// Hosted MCP: owners sign in with their Cardano wallet (OAuth 2.1) and get an agent wallet the
// agent spends from, inside their limits. Off unless AGENT_WALLET_KEY is set.
const dataDir = process.env.DATA_DIR ?? "data";
const self = `http://127.0.0.1:${port}`;
const hosted = process.env.AGENT_WALLET_KEY
  ? (() => {
      const accounts = createAccounts(db, {
        secret: process.env.AGENT_WALLET_KEY as string,
        blockfrostProjectId: need("BLOCKFROST_PROJECT_ID"),
        apiUrl: self,
        dataDir,
        demoMnemonic: process.env.MCP_BUYER_MNEMONIC,
      });
      const oauth = createOAuth(db, accounts, process.env.PUBLIC_URL ?? "https://api.simpuru.xyz");
      const bf = blockfrost(need("BLOCKFROST_PROJECT_ID"));
      startAgentWatchers(accounts, dataDir);
      return {
        oauth,
        optionsFor: (owner: string) => {
          const account = accounts.get(owner);
          if (!account) throw new Error(`no account for ${owner}`);
          return {
            buyer: accounts.buyerFor(owner),
            api: self,
            dailyBudgetLovelace: account.dailyBudgetLovelace,
            ...(owner === DEMO_OWNER
              ? {
                  walletNote:
                    "Paid from the shared preprod demo wallet. Sign in with your own wallet to use your own agent wallet.",
                }
              : {}),
            account: {
              owner,
              agentAddress: account.agentAddress,
              maxPerPaymentLovelace: account.maxPerPaymentLovelace,
              balance: () => lovelaceAt(bf, account.agentAddress),
              ...(owner === DEMO_OWNER
                ? {}
                : { withdrawToOwner: () => sendAllTo(accounts.signerFor(owner), owner) }),
            },
          };
        },
      };
    })()
  : undefined;

export default {
  port,
  fetch: createApp(db, paywall, hosted).fetch,
  // A paid request waits for the chain (settlement takes 20-60 s); Bun's default would cut it at 10 s.
  idleTimeout: 255,
};
