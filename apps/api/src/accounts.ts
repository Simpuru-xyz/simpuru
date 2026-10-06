// Owners and their agent wallets. An owner is a Cardano address that proved itself with a CIP-8
// signature; each owner gets one platform-held agent wallet the agent spends from, inside the
// owner's limits. The agent wallet's mnemonic is encrypted at rest and never leaves the server.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { generateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { type Buyer, createBuyer } from "@simpuru/agent";
import { X402_NETWORK } from "@simpuru/core";
import { toClientCardanoSigner } from "@x402/cardano";
import type { Db } from "./db";

/** The shared demo wallet (hosted MCP without a sign-in) counts as one owner. */
export const DEMO_OWNER = "demo";

export interface Account {
  owner: string;
  agentAddress: string;
  maxPerPaymentLovelace: bigint;
  dailyBudgetLovelace: bigint;
}

export function migrateAccounts(db: Db) {
  db.run(`CREATE TABLE IF NOT EXISTS accounts (
    owner TEXT PRIMARY KEY,
    agent_address TEXT NOT NULL,
    agent_secret TEXT NOT NULL,
    max_per_payment TEXT NOT NULL,
    daily_budget TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`);
}

/** AES-256-GCM with a key derived from AGENT_WALLET_KEY. Stored as base64(iv | tag | ciphertext). */
const sealer = (secret: string) => {
  const key = createHash("sha256").update(secret).digest();
  return {
    seal(plain: string) {
      const iv = randomBytes(12);
      const c = createCipheriv("aes-256-gcm", key, iv);
      const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
      return Buffer.concat([iv, c.getAuthTag(), ct]).toString("base64");
    },
    open(sealed: string) {
      const b = Buffer.from(sealed, "base64");
      const d = createDecipheriv("aes-256-gcm", key, b.subarray(0, 12));
      d.setAuthTag(b.subarray(12, 28));
      return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8");
    },
  };
};

type Row = {
  owner: string;
  agent_address: string;
  agent_secret: string;
  max_per_payment: string;
  daily_budget: string;
};

export interface AccountsConfig {
  /** AGENT_WALLET_KEY: encrypts agent mnemonics at rest. */
  secret: string;
  blockfrostProjectId: string;
  /** Where agents buy from (this API). */
  apiUrl: string;
  dataDir: string;
  /** MCP_BUYER_MNEMONIC: the shared demo wallet, if offered. */
  demoMnemonic?: string;
}

export function createAccounts(db: Db, cfg: AccountsConfig) {
  migrateAccounts(db);
  const box = sealer(cfg.secret);
  const buyers = new Map<string, Buyer>();
  mkdirSync(`${cfg.dataDir}/agents`, { recursive: true });

  const addressOf = (mnemonic: string) =>
    toClientCardanoSigner({
      mnemonic,
      network: X402_NETWORK,
      provider: { koios: { baseUrl: "https://preprod.koios.rest/api/v1" } },
    }).getAddress();

  const get = (owner: string): Account | null => {
    const r = db.query<Row, [string]>("SELECT * FROM accounts WHERE owner = ?").get(owner);
    return r
      ? {
          owner: r.owner,
          agentAddress: r.agent_address,
          maxPerPaymentLovelace: BigInt(r.max_per_payment),
          dailyBudgetLovelace: BigInt(r.daily_budget),
        }
      : null;
  };

  const mnemonicOf = (owner: string) => {
    const r = db.query<Row, [string]>("SELECT * FROM accounts WHERE owner = ?").get(owner);
    if (!r) throw new Error(`no account for ${owner}`);
    return box.open(r.agent_secret);
  };

  return {
    get,
    demoAvailable: Boolean(cfg.demoMnemonic),

    /** Creates the owner's agent wallet on first sign-in, or updates their limits. */
    upsert(owner: string, limits: { maxPerPaymentLovelace: bigint; dailyBudgetLovelace: bigint }) {
      const existing = get(owner);
      if (existing) {
        db.query("UPDATE accounts SET max_per_payment = ?, daily_budget = ? WHERE owner = ?").run(
          String(limits.maxPerPaymentLovelace),
          String(limits.dailyBudgetLovelace),
          owner,
        );
      } else {
        const mnemonic =
          owner === DEMO_OWNER && cfg.demoMnemonic
            ? cfg.demoMnemonic
            : generateMnemonic(wordlist, 256);
        db.query(
          `INSERT INTO accounts (owner, agent_address, agent_secret, max_per_payment, daily_budget, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        ).run(
          owner,
          addressOf(mnemonic),
          box.seal(mnemonic),
          String(limits.maxPerPaymentLovelace),
          String(limits.dailyBudgetLovelace),
          Date.now(),
        );
      }
      buyers.delete(owner); // limits may have changed
      return get(owner) as Account;
    },

    /** The buyer that spends from this owner's agent wallet, with this owner's limits. */
    buyerFor(owner: string): Buyer {
      const cached = buyers.get(owner);
      if (cached) return cached;
      const account = get(owner);
      if (!account) throw new Error(`no account for ${owner}`);
      const buyer = createBuyer({
        mnemonic: mnemonicOf(owner),
        blockfrostProjectId: cfg.blockfrostProjectId,
        apiUrl: cfg.apiUrl,
        maxPerPaymentLovelace: account.maxPerPaymentLovelace,
        dailyBudgetLovelace: account.dailyBudgetLovelace,
        logPath: `${cfg.dataDir}/agents/${owner === DEMO_OWNER ? DEMO_OWNER : account.agentAddress}.jsonl`,
      });
      buyers.set(owner, buyer);
      return buyer;
    },

    /** The agent wallet's key, as an escrow signer (refunds and disputes on the owner's behalf). */
    signerFor: (owner: string) => ({ mnemonic: mnemonicOf(owner) }),

    owners: () =>
      db
        .query<{ owner: string }, []>("SELECT owner FROM accounts")
        .all()
        .map((r) => r.owner),
  };
}

export type Accounts = ReturnType<typeof createAccounts>;
