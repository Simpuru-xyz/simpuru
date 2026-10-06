import { afterAll, describe, expect, test } from "bun:test";
import { createHash, randomBytes } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createAccounts } from "./accounts";
import { createApp } from "./app";
import { openDb } from "./db";
import { connectDigest, createOAuth } from "./oauth";
import { addListing, alice } from "./test-helpers";

// Public BIP-39 test vector as the demo wallet; these tests never pay.
const DEMO = `${"abandon ".repeat(23)}art`;
const db = openDb(":memory:");
addListing(db, "kinetic-pricing-section", { title: "Kinetic pricing section", category: "SaaS" });
addListing(db, "lumen-aurora-hero", { title: "Lumen aurora hero", category: "SaaS" });

let app: ReturnType<typeof createApp> | undefined;
const server = Bun.serve({
  port: 0,
  fetch: (req) => (app as ReturnType<typeof createApp>).fetch(req),
});
const base = `http://localhost:${server.port}`;
const accounts = createAccounts(db, {
  secret: "test-secret",
  blockfrostProjectId: "unused",
  apiUrl: base,
  dataDir: mkdtempSync(join(tmpdir(), "acct-")),
  demoMnemonic: DEMO,
});
const oauth = createOAuth(db, accounts, base);
app = createApp(db, undefined, {
  oauth,
  optionsFor: (owner) => ({
    buyer: accounts.buyerFor(owner),
    api: base,
    dailyBudgetLovelace: 1n,
  }),
});
afterAll(() => server.stop(true));

const REDIRECT = "http://localhost:33418/callback";
const json = async (r: Response) => (await r.json()) as Record<string, string>;

/** Runs the OAuth flow the way an MCP client does; returns the access token. */
async function signIn(approve: Record<string, unknown>) {
  const reg = await json(
    await fetch(`${base}/oauth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ redirect_uris: [REDIRECT], client_name: "Test agent" }),
    }),
  );
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const page = await fetch(
    `${base}/oauth/authorize?response_type=code&client_id=${reg.client_id}&redirect_uri=${encodeURIComponent(REDIRECT)}&code_challenge=${challenge}&code_challenge_method=S256&state=xyz`,
  );
  const request = (await page.text()).match(/const request = "([^"]+)"/)?.[1] ?? "";
  const ok = await fetch(`${base}/oauth/approve`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ request, maxPerPaymentAda: 10, dailyBudgetAda: 30, ...approve }),
  });
  const out = await json(ok);
  if (!ok.ok) return { ok: false as const, error: out.error, status: ok.status };
  const redirect = new URL(out.redirect ?? "");
  expect(redirect.searchParams.get("state")).toBe("xyz");
  const exchange = (code_verifier: string) =>
    fetch(`${base}/oauth/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: redirect.searchParams.get("code") ?? "",
        code_verifier,
        client_id: reg.client_id ?? "",
        redirect_uri: REDIRECT,
      }),
    });
  return { ok: true as const, exchange, verifier, out };
}

const mcpClient = async (token: string) => {
  const client = new Client({ name: "test", version: "0" });
  await client.connect(
    new StreamableHTTPClientTransport(new URL(`${base}/mcp`), {
      requestInit: { headers: { Authorization: `Bearer ${token}` } },
    }),
  );
  return client;
};

describe("MCP sign-in (OAuth 2.1)", () => {
  test("without a token /mcp says where to sign in", async () => {
    const res = await fetch(`${base}/mcp`, { method: "POST" });
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toContain("/.well-known/oauth-protected-resource");
    const meta = await json(await fetch(`${base}/.well-known/oauth-authorization-server`));
    expect(meta.token_endpoint).toBe(`${base}/oauth/token`);
  });

  test("demo sign-in → token → the agent can browse and has a wallet", async () => {
    const s = await signIn({ mode: "demo" });
    if (!s.ok) throw new Error(String(s.error));
    const tok = await json(await s.exchange(s.verifier));
    const client = await mcpClient(tok.access_token ?? "");
    const names = (await client.listTools()).tools.map((t) => t.name).sort();
    expect(names).toEqual([
      "buy_listing",
      "get_listing",
      "get_purchase_status",
      "my_purchases",
      "search_listings",
    ]);
    const r = (await client.callTool({
      name: "search_listings",
      arguments: { query: "pricing" },
    })) as {
      content: { text: string }[];
    };
    expect((JSON.parse(r.content[0]?.text ?? "[]") as { id: string }[]).map((h) => h.id)).toEqual([
      "kinetic-pricing-section",
    ]);
    await client.close();
  });

  test("a wrong PKCE verifier gets no token", async () => {
    const s = await signIn({ mode: "demo" });
    if (!s.ok) throw new Error(String(s.error));
    expect((await s.exchange("not-the-verifier")).status).toBe(400);
  });

  test("wallet sign-in with a valid CIP-8 signature creates the owner's own agent wallet", async () => {
    // The page asks /oauth/challenge for the digest; here we sign the same digest directly.
    const s1 = await signIn({
      mode: "wallet",
      owner: alice.sellerAddress,
      key: "x",
      signature: "x",
    });
    expect(s1.ok ? 200 : s1.status).toBe(401);
    const reg = await json(
      await fetch(`${base}/oauth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ redirect_uris: [REDIRECT] }),
      }),
    );
    const page = await fetch(
      `${base}/oauth/authorize?response_type=code&client_id=${reg.client_id}&redirect_uri=${encodeURIComponent(REDIRECT)}&code_challenge=abc&code_challenge_method=S256`,
    );
    const request = (await page.text()).match(/const request = "([^"]+)"/)?.[1] ?? "";
    const nonce = (
      db.query("SELECT nonce FROM oauth_requests WHERE id = ?").get(request) as { nonce: string }
    ).nonce;
    const { key, signature } = await alice.signTerms(
      alice.sellerAddress,
      connectDigest(alice.sellerAddress, nonce),
    );
    const res = await fetch(`${base}/oauth/approve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        request,
        mode: "wallet",
        owner: alice.sellerAddress,
        key,
        signature,
        maxPerPaymentAda: 5,
        dailyBudgetAda: 20,
      }),
    });
    const out = await json(res);
    expect(res.status).toBe(200);
    expect(out.owner).toBe(alice.sellerAddress);
    const account = accounts.get(alice.sellerAddress);
    expect(account?.agentAddress).toBe(out.agentAddress);
    expect(account?.agentAddress).not.toBe(alice.sellerAddress);
    expect(account?.maxPerPaymentLovelace).toBe(5_000_000n);
  });

  test("agent mnemonics are stored encrypted", () => {
    const row = db.query("SELECT agent_secret FROM accounts LIMIT 1").get() as {
      agent_secret: string;
    };
    expect(row.agent_secret).not.toContain("abandon");
  });
});
