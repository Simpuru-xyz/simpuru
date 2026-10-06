// OAuth 2.1 authorization server for the MCP endpoint (MCP authorization spec: protected-resource
// metadata, dynamic client registration, PKCE S256). The owner signs in on a consent page by
// connecting a Cardano wallet (CIP-30) and signing a one-time challenge (CIP-8), or picks the
// shared demo wallet. Tokens are random, stored only as SHA-256 hashes.
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Address } from "@evolution-sdk/evolution";
import { sha256Hex } from "@simpuru/core/hash";
import { verifySellerTermsSignature } from "@x402/cardano";
import { Hono } from "hono";
import { type Accounts, DEMO_OWNER } from "./accounts";
import { consentHtml } from "./consent";
import type { Db } from "./db";

const ACCESS_TTL_MS = 7 * 24 * 3600_000;
const REFRESH_TTL_MS = 60 * 24 * 3600_000;
const CODE_TTL_MS = 5 * 60_000;
const REQUEST_TTL_MS = 15 * 60_000;
const ADA = 1_000_000n;

const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const token = () => randomBytes(32).toString("base64url");
const b64urlSha256 = (s: string) => createHash("sha256").update(s).digest("base64url");

/** What an owner signs to prove their wallet on the consent page. */
export const connectDigest = (owner: string, nonce: string) =>
  sha256Hex(`simpuru:connect:v1\n${owner}\n${nonce}`);

export function migrateOAuth(db: Db) {
  db.run(`CREATE TABLE IF NOT EXISTS oauth_clients (
    client_id TEXT PRIMARY KEY, name TEXT, redirect_uris TEXT NOT NULL, created_at INTEGER NOT NULL)`);
  db.run(`CREATE TABLE IF NOT EXISTS oauth_requests (
    id TEXT PRIMARY KEY, client_id TEXT NOT NULL, redirect_uri TEXT NOT NULL, challenge TEXT NOT NULL,
    state TEXT, nonce TEXT NOT NULL, expires_at INTEGER NOT NULL)`);
  db.run(`CREATE TABLE IF NOT EXISTS oauth_codes (
    code_hash TEXT PRIMARY KEY, client_id TEXT NOT NULL, redirect_uri TEXT NOT NULL,
    challenge TEXT NOT NULL, owner TEXT NOT NULL, expires_at INTEGER NOT NULL)`);
  db.run(`CREATE TABLE IF NOT EXISTS oauth_tokens (
    token_hash TEXT PRIMARY KEY, kind TEXT NOT NULL, client_id TEXT NOT NULL, owner TEXT NOT NULL,
    expires_at INTEGER NOT NULL)`);
}

/** Loopback or https only (what MCP clients register). */
const okRedirect = (uri: unknown) => {
  if (typeof uri !== "string") return false;
  try {
    const u = new URL(uri);
    return (
      u.protocol === "https:" ||
      (u.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname))
    );
  } catch {
    return false;
  }
};

export function createOAuth(db: Db, accounts: Accounts, publicUrl: string) {
  migrateOAuth(db);
  const issuer = publicUrl.replace(/\/+$/, "");
  const resource = `${issuer}/mcp`;

  const issueTokens = (clientId: string, owner: string) => {
    const access = token();
    const refresh = token();
    const now = Date.now();
    const put = db.query(
      "INSERT INTO oauth_tokens (token_hash, kind, client_id, owner, expires_at) VALUES (?, ?, ?, ?, ?)",
    );
    put.run(hash(access), "access", clientId, owner, now + ACCESS_TTL_MS);
    put.run(hash(refresh), "refresh", clientId, owner, now + REFRESH_TTL_MS);
    return {
      access_token: access,
      token_type: "Bearer",
      expires_in: ACCESS_TTL_MS / 1000,
      refresh_token: refresh,
      scope: "mcp",
    };
  };

  const app = new Hono();

  app.get("/.well-known/oauth-protected-resource", (c) =>
    c.json({
      resource,
      authorization_servers: [issuer],
      bearer_methods_supported: ["header"],
      scopes_supported: ["mcp"],
    }),
  );
  app.get("/.well-known/oauth-protected-resource/mcp", (c) =>
    c.json({
      resource,
      authorization_servers: [issuer],
      bearer_methods_supported: ["header"],
      scopes_supported: ["mcp"],
    }),
  );
  app.get("/.well-known/oauth-authorization-server", (c) =>
    c.json({
      issuer,
      authorization_endpoint: `${issuer}/oauth/authorize`,
      token_endpoint: `${issuer}/oauth/token`,
      registration_endpoint: `${issuer}/oauth/register`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
      scopes_supported: ["mcp"],
    }),
  );

  // Dynamic client registration (RFC 7591), public clients only.
  app.post("/oauth/register", async (c) => {
    const body = (await c.req.json().catch(() => null)) as {
      redirect_uris?: unknown;
      client_name?: unknown;
    } | null;
    const uris = body?.redirect_uris;
    if (!Array.isArray(uris) || uris.length === 0 || !uris.every(okRedirect))
      return c.json({ error: "invalid_redirect_uri" }, 400);
    const clientId = randomUUID();
    const name =
      typeof body?.client_name === "string" ? body.client_name.slice(0, 80) : "MCP client";
    db.query(
      "INSERT INTO oauth_clients (client_id, name, redirect_uris, created_at) VALUES (?, ?, ?, ?)",
    ).run(clientId, name, JSON.stringify(uris), Date.now());
    return c.json(
      {
        client_id: clientId,
        client_id_issued_at: Math.floor(Date.now() / 1000),
        client_name: name,
        redirect_uris: uris,
        token_endpoint_auth_method: "none",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
      },
      201,
    );
  });

  // The consent page: connect a wallet (or pick the demo wallet), set limits, approve.
  app.get("/oauth/authorize", (c) => {
    const q = c.req.query();
    const client = db
      .query<{ name: string; redirect_uris: string }, [string]>(
        "SELECT name, redirect_uris FROM oauth_clients WHERE client_id = ?",
      )
      .get(q.client_id ?? "");
    if (!client) return c.text("Unknown client", 400);
    if (!(JSON.parse(client.redirect_uris) as string[]).includes(q.redirect_uri ?? ""))
      return c.text("redirect_uri was not registered", 400);
    if (q.response_type !== "code" || !q.code_challenge || q.code_challenge_method !== "S256")
      return c.text("Need response_type=code and a PKCE S256 code_challenge", 400);
    const id = randomUUID();
    const nonce = token();
    db.query(
      "INSERT INTO oauth_requests (id, client_id, redirect_uri, challenge, state, nonce, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(
      id,
      q.client_id ?? "",
      q.redirect_uri ?? "",
      q.code_challenge,
      q.state ?? null,
      nonce,
      Date.now() + REQUEST_TTL_MS,
    );
    return c.html(
      consentHtml({ request: id, clientName: client.name, demo: accounts.demoAvailable }),
    );
  });

  const pending = (id: string) =>
    db
      .query<
        {
          id: string;
          client_id: string;
          redirect_uri: string;
          challenge: string;
          state: string | null;
          nonce: string;
          expires_at: number;
        },
        [string]
      >("SELECT * FROM oauth_requests WHERE id = ?")
      .get(id);

  // The digest the wallet must sign for this request and address (the page can't do bech32).
  app.get("/oauth/challenge", (c) => {
    const req = pending(c.req.query("request") ?? "");
    if (!req || req.expires_at < Date.now()) return c.json({ error: "expired" }, 400);
    try {
      const owner = Address.toBech32(Address.fromHex(c.req.query("address") ?? ""));
      if (!owner.startsWith("addr_test1")) return c.json({ error: "Use a preprod wallet" }, 400);
      return c.json({ owner, digest: connectDigest(owner, req.nonce) });
    } catch {
      return c.json({ error: "bad address" }, 400);
    }
  });

  app.post("/oauth/approve", async (c) => {
    const body = (await c.req.json().catch(() => null)) as {
      request?: string;
      mode?: "wallet" | "demo";
      owner?: string;
      key?: string;
      signature?: string;
      maxPerPaymentAda?: number;
      dailyBudgetAda?: number;
    } | null;
    const req = pending(body?.request ?? "");
    if (!req || req.expires_at < Date.now())
      return c.json({ error: "This sign-in expired. Start again from your agent." }, 400);
    const per = Math.round(Number(body?.maxPerPaymentAda));
    const day = Math.round(Number(body?.dailyBudgetAda));
    if (!(per >= 1 && per <= 100 && day >= per && day <= 500))
      return c.json(
        { error: "Limits: 1-100 ADA per purchase, a daily budget of at least that, up to 500 ADA" },
        400,
      );

    let owner: string;
    if (body?.mode === "demo") {
      if (!accounts.demoAvailable) return c.json({ error: "No demo wallet here" }, 400);
      owner = DEMO_OWNER;
    } else {
      owner = body?.owner ?? "";
      const ok =
        owner.startsWith("addr_test1") &&
        verifySellerTermsSignature(
          body?.key ?? "",
          body?.signature ?? "",
          owner,
          connectDigest(owner, req.nonce),
        );
      if (!ok) return c.json({ error: "The wallet signature didn't check out" }, 401);
    }
    // The demo wallet keeps its fixed limits; an owner sets theirs.
    const account =
      owner === DEMO_OWNER
        ? (accounts.get(DEMO_OWNER) ??
          accounts.upsert(DEMO_OWNER, {
            maxPerPaymentLovelace: 10n * ADA,
            dailyBudgetLovelace: 30n * ADA,
          }))
        : accounts.upsert(owner, {
            maxPerPaymentLovelace: BigInt(per) * ADA,
            dailyBudgetLovelace: BigInt(day) * ADA,
          });

    const code = token();
    db.query(
      "INSERT INTO oauth_codes (code_hash, client_id, redirect_uri, challenge, owner, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(
      hash(code),
      req.client_id,
      req.redirect_uri,
      req.challenge,
      owner,
      Date.now() + CODE_TTL_MS,
    );
    db.query("DELETE FROM oauth_requests WHERE id = ?").run(req.id);
    const redirect = new URL(req.redirect_uri);
    redirect.searchParams.set("code", code);
    if (req.state) redirect.searchParams.set("state", req.state);
    return c.json({ redirect: redirect.toString(), agentAddress: account.agentAddress, owner });
  });

  app.post("/oauth/token", async (c) => {
    const type = c.req.header("content-type") ?? "";
    const f = (
      type.includes("application/json")
        ? await c.req.json().catch(() => ({}))
        : await c.req.parseBody()
    ) as Record<string, string>;
    if (f.grant_type === "authorization_code") {
      const row = db
        .query<
          {
            client_id: string;
            redirect_uri: string;
            challenge: string;
            owner: string;
            expires_at: number;
          },
          [string]
        >("SELECT * FROM oauth_codes WHERE code_hash = ?")
        .get(hash(f.code ?? ""));
      db.query("DELETE FROM oauth_codes WHERE code_hash = ?").run(hash(f.code ?? "")); // single use
      if (!row || row.expires_at < Date.now()) return c.json({ error: "invalid_grant" }, 400);
      if (row.client_id !== f.client_id || row.redirect_uri !== f.redirect_uri)
        return c.json({ error: "invalid_grant" }, 400);
      if (b64urlSha256(f.code_verifier ?? "") !== row.challenge)
        return c.json({ error: "invalid_grant" }, 400);
      return c.json(issueTokens(row.client_id, row.owner));
    }
    if (f.grant_type === "refresh_token") {
      const row = db
        .query<{ client_id: string; owner: string; expires_at: number; kind: string }, [string]>(
          "SELECT * FROM oauth_tokens WHERE token_hash = ?",
        )
        .get(hash(f.refresh_token ?? ""));
      if (!row || row.kind !== "refresh" || row.expires_at < Date.now())
        return c.json({ error: "invalid_grant" }, 400);
      db.query("DELETE FROM oauth_tokens WHERE token_hash = ?").run(hash(f.refresh_token ?? "")); // rotate
      return c.json(issueTokens(row.client_id, row.owner));
    }
    return c.json({ error: "unsupported_grant_type" }, 400);
  });

  return {
    routes: app,
    resourceMetadataUrl: `${issuer}/.well-known/oauth-protected-resource`,
    /** The owner behind a bearer access token, or null. */
    ownerOf(authorization: string | undefined) {
      const t = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
      if (!t) return null;
      const row = db
        .query<{ owner: string; expires_at: number; kind: string }, [string]>(
          "SELECT owner, expires_at, kind FROM oauth_tokens WHERE token_hash = ?",
        )
        .get(hash(t));
      return row && row.kind === "access" && row.expires_at > Date.now() ? row.owner : null;
    },
  };
}

export type OAuth = ReturnType<typeof createOAuth>;
