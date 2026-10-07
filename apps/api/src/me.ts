// Sign in with Cardano and the signed-in account (spec #86). An account is a Cardano wallet: the
// owner signs a one-time challenge with CIP-30 `signData`, and gets a session token. Every account
// has a Simpuru wallet (the platform-held wallet the owner and their agents spend from).
import { createHash, randomBytes } from "node:crypto";
import { Address } from "@evolution-sdk/evolution";
import type { DeliveryMode } from "@simpuru/core";
import { sha256Hex } from "@simpuru/core/hash";
import { verifySellerTermsSignature } from "@x402/cardano";
import { Hono } from "hono";
import type { Accounts } from "./accounts";
import { lovelaceAt, sendAllTo } from "./agents";
import { type Db, getListing, listListings, publicListing, withStats } from "./db";
import { getPurchaseView, type PurchaseView } from "./purchases";
import { deliveredContent } from "./seed";

const SESSION_TTL_MS = 7 * 24 * 3600_000;
const CHALLENGE_TTL_MS = 5 * 60_000;
const ADA = 1_000_000n;
/** New accounts start with these agent limits; the owner changes them on /agents. */
export const DEFAULT_LIMITS = { maxPerPaymentLovelace: 10n * ADA, dailyBudgetLovelace: 30n * ADA };

const hash = (s: string) => createHash("sha256").update(s).digest("hex");

/** What the wallet signs to sign in. */
export const signInDigest = (owner: string, nonce: string) =>
  sha256Hex(`simpuru:signin:v1\n${owner}\n${nonce}`);

export function migrateSessions(db: Db) {
  db.run(`CREATE TABLE IF NOT EXISTS auth_challenges (
    owner TEXT NOT NULL, nonce TEXT NOT NULL, expires_at INTEGER NOT NULL)`);
  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY, owner TEXT NOT NULL, expires_at INTEGER NOT NULL)`);
}

/** A CIP-30 hex address or a bech32 one → bech32 preprod address, or null. */
export function toOwner(address: unknown): string | null {
  if (typeof address !== "string") return null;
  try {
    const bech = address.startsWith("addr") ? address : Address.toBech32(Address.fromHex(address));
    return bech.startsWith("addr_test1") ? bech : null;
  } catch {
    return null;
  }
}

type Blockfrost = (path: string) => Promise<unknown>;

export function createMe(db: Db, accounts: Accounts, bf: Blockfrost) {
  migrateSessions(db);

  const sessionOwner = (authorization: string | undefined) => {
    const t = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!t) return null;
    const row = db
      .query<{ owner: string; expires_at: number }, [string]>(
        "SELECT owner, expires_at FROM sessions WHERE token_hash = ?",
      )
      .get(hash(t));
    return row && row.expires_at > Date.now() ? row.owner : null;
  };

  /** The account behind a session, created with default limits the first time. */
  const accountOf = (owner: string) =>
    accounts.get(owner) ?? accounts.upsert(owner, DEFAULT_LIMITS);

  const app = new Hono<{ Variables: { owner: string } }>();

  app.post("/auth/challenge", async (c) => {
    const body = (await c.req.json().catch(() => null)) as { address?: unknown } | null;
    const owner = toOwner(body?.address);
    if (!owner)
      return c.json(
        { error: "address: a Cardano preprod address (hex from CIP-30, or bech32 addr_test1…)" },
        400,
      );
    const nonce = randomBytes(24).toString("base64url");
    const expiresAt = Date.now() + CHALLENGE_TTL_MS;
    db.query("DELETE FROM auth_challenges WHERE expires_at < ?").run(Date.now());
    db.query("INSERT INTO auth_challenges (owner, nonce, expires_at) VALUES (?, ?, ?)").run(
      owner,
      nonce,
      expiresAt,
    );
    return c.json({ owner, digest: signInDigest(owner, nonce), expiresAt });
  });

  app.post("/auth/verify", async (c) => {
    const body = (await c.req.json().catch(() => null)) as {
      owner?: string;
      key?: string;
      signature?: string;
    } | null;
    const owner = toOwner(body?.owner);
    if (!owner) return c.json({ error: "owner: the address from /auth/challenge" }, 400);
    const challenges = db
      .query<{ nonce: string; expires_at: number }, [string, number]>(
        "SELECT nonce, expires_at FROM auth_challenges WHERE owner = ? AND expires_at > ? ORDER BY expires_at DESC",
      )
      .all(owner, Date.now());
    const match = challenges.find((ch) =>
      verifySellerTermsSignature(
        body?.key ?? "",
        body?.signature ?? "",
        owner,
        signInDigest(owner, ch.nonce),
      ),
    );
    if (!match)
      return c.json(
        { error: "The wallet signature didn't check out (or the challenge expired)" },
        401,
      );
    db.query("DELETE FROM auth_challenges WHERE owner = ? AND nonce = ?").run(owner, match.nonce); // single use
    const token = randomBytes(32).toString("base64url");
    const expiresAt = Date.now() + SESSION_TTL_MS;
    db.query("INSERT INTO sessions (token_hash, owner, expires_at) VALUES (?, ?, ?)").run(
      hash(token),
      owner,
      expiresAt,
    );
    const account = accountOf(owner);
    return c.json({ token, expiresAt, account: { owner, walletAddress: account.agentAddress } });
  });

  app.post("/auth/logout", (c) => {
    const t = c.req.header("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (t) db.query("DELETE FROM sessions WHERE token_hash = ?").run(hash(t));
    return c.body(null, 204);
  });

  // Everything under /me needs a session.
  app.use("/me", async (c, next) => {
    const owner = sessionOwner(c.req.header("authorization"));
    if (!owner) return c.json({ error: "Sign in first" }, 401);
    c.set("owner", owner);
    await next();
  });
  app.use("/me/*", async (c, next) => {
    const owner = sessionOwner(c.req.header("authorization"));
    if (!owner) return c.json({ error: "Sign in first" }, 401);
    c.set("owner", owner);
    await next();
  });

  const myPurchases = (owner: string, walletAddress: string) =>
    db
      .query<{ tx_hash: string }, [string, string]>(
        "SELECT tx_hash FROM purchases WHERE payer IN (?, ?) ORDER BY created_at DESC",
      )
      .all(owner, walletAddress)
      .map((r) => getPurchaseView(db, r.tx_hash))
      .filter((p): p is PurchaseView => p !== null);

  app.get("/me", async (c) => {
    const owner = c.get("owner");
    const account = accountOf(owner);
    const buyer = accounts.buyerFor(owner);
    const listings = listListings(db)
      .filter((l) => l.sellerAddress === owner)
      .map((l) => withStats(db, publicListing(l)));
    const reputation = listings.find((l) => l.sellerReputation)?.sellerReputation;
    return c.json({
      owner,
      wallet: {
        address: account.agentAddress,
        balanceLovelace: String(await lovelaceAt(bf, account.agentAddress)),
      },
      limits: {
        maxPerPaymentLovelace: String(account.maxPerPaymentLovelace),
        dailyBudgetLovelace: String(account.dailyBudgetLovelace),
        spentTodayLovelace: String(buyer.spentToday()),
      },
      purchases: myPurchases(owner, account.agentAddress),
      listings,
      sales: listings.reduce((n, l) => n + (l.sales ?? 0), 0),
      ...(reputation ? { sellerReputation: reputation } : {}),
    });
  });

  app.post("/me/buy", async (c) => {
    const owner = c.get("owner");
    const body = (await c.req.json().catch(() => null)) as {
      listingId?: string;
      mode?: DeliveryMode;
    } | null;
    if (!body?.listingId || (body.mode !== "instant" && body.mode !== "protected"))
      return c.json({ error: "Need { listingId, mode: 'instant' | 'protected' }" }, 400);
    accountOf(owner);
    const r = await accounts.buyerFor(owner).buy(body.listingId, body.mode);
    if (!r.ok) return c.json({ error: r.error }, 400);
    const tx = r.redelivered ? r.txHash : r.record.txHash;
    return c.json({
      purchase: getPurchaseView(db, tx),
      content: r.content,
      alreadyOwned: Boolean(r.redelivered),
    });
  });

  app.get("/me/purchases/:id/content", (c) => {
    const owner = c.get("owner");
    const account = accountOf(owner);
    const p = getPurchaseView(db, c.req.param("id"));
    if (!p || (p.buyerAddress !== owner && p.buyerAddress !== account.agentAddress))
      return c.json({ error: "Not your purchase" }, 404);
    if (p.status === "refunded") return c.json({ error: "This purchase was refunded" }, 410);
    const listing = getListing(db, p.listingId);
    return listing ? c.text(deliveredContent(listing)) : c.json({ error: "Listing gone" }, 404);
  });

  app.put("/me/agent-limits", async (c) => {
    const owner = c.get("owner");
    const body = (await c.req.json().catch(() => null)) as {
      maxPerPaymentAda?: number;
      dailyBudgetAda?: number;
    } | null;
    const per = Math.round(Number(body?.maxPerPaymentAda));
    const day = Math.round(Number(body?.dailyBudgetAda));
    if (!(per >= 1 && per <= 100 && day >= per && day <= 500))
      return c.json(
        { error: "1-100 ADA per purchase, and a daily budget of at least that, up to 500 ADA" },
        400,
      );
    const a = accounts.upsert(owner, {
      maxPerPaymentLovelace: BigInt(per) * ADA,
      dailyBudgetLovelace: BigInt(day) * ADA,
    });
    return c.json({
      maxPerPaymentLovelace: String(a.maxPerPaymentLovelace),
      dailyBudgetLovelace: String(a.dailyBudgetLovelace),
    });
  });

  app.post("/me/wallet/withdraw", async (c) => {
    const owner = c.get("owner");
    accountOf(owner);
    try {
      const r = await sendAllTo(accounts.signerFor(owner), owner);
      return c.json({ tx: r.tx, lovelace: String(r.lovelace) });
    } catch (error) {
      return c.json(
        {
          error: String(error)
            .replace(/^Error: /, "")
            .slice(0, 200),
        },
        400,
      );
    }
  });

  return { routes: app, sessionOwner };
}

export type Me = ReturnType<typeof createMe>;
