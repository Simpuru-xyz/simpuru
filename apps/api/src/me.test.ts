import { describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createAccounts } from "./accounts";
import { createApp } from "./app";
import { openDb } from "./db";
import { createMe } from "./me";
import { insertPurchase } from "./purchases";
import { addListing, alice, bob } from "./test-helpers";

// Blockfrost stand-in: every wallet holds 12 tADA. These tests never pay.
const bf = async () => ({ amount: [{ unit: "lovelace", quantity: "12000000" }] });

const setup = () => {
  const db = openDb(":memory:");
  addListing(db, "hero", { content: "the prompt" });
  const accounts = createAccounts(db, {
    secret: "test-secret",
    blockfrostProjectId: "unused",
    apiUrl: "http://127.0.0.1:1",
    dataDir: mkdtempSync(join(tmpdir(), "me-")),
  });
  const me = createMe(db, accounts, bf);
  return { db, accounts, app: createApp(db, undefined, undefined, me) };
};
// biome-ignore lint/suspicious/noExplicitAny: response bodies in assertions
type Json = any;
type App = ReturnType<typeof setup>["app"];
const post = (app: App, path: string, body: unknown, token?: string) =>
  app.request(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

/** Sign in as `signer` (claiming `address`), the way the web app does with CIP-30. */
async function signIn(app: App, signer = alice, address = alice.sellerAddress) {
  const ch = (await (await post(app, "/auth/challenge", { address })).json()) as {
    owner: string;
    digest: string;
  };
  const { key, signature } = await signer.signTerms(ch.owner, ch.digest);
  return post(app, "/auth/verify", { owner: ch.owner, key, signature });
}
const tokenOf = async (app: App) => ((await (await signIn(app)).json()) as { token: string }).token;
const get = (app: App, path: string, token?: string) =>
  app.request(path, token ? { headers: { authorization: `Bearer ${token}` } } : {});

describe("sign in with Cardano", () => {
  test("the wallet's signature gets a session and a Simpuru wallet", async () => {
    const { app } = setup();
    const res = await signIn(app);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      token: string;
      account: { owner: string; walletAddress: string };
    };
    expect(body.account.owner).toBe(alice.sellerAddress);
    expect(body.account.walletAddress).toStartWith("addr_test1");
    expect(body.account.walletAddress).not.toBe(alice.sellerAddress);

    const me = (await (await get(app, "/me", body.token)).json()) as Json;
    expect(me.owner).toBe(alice.sellerAddress);
    expect(me.wallet).toEqual({ address: body.account.walletAddress, balanceLovelace: "12000000" });
    expect(me.limits).toEqual({
      maxPerPaymentLovelace: "10000000",
      dailyBudgetLovelace: "30000000",
      spentTodayLovelace: "0",
    });
    expect(me.purchases).toEqual([]);
  });

  test("signing in again keeps the same Simpuru wallet", async () => {
    const { app } = setup();
    const a = (await (await signIn(app)).json()) as Json;
    const b = (await (await signIn(app)).json()) as Json;
    expect(b.account.walletAddress).toBe(a.account.walletAddress);
    expect(b.token).not.toBe(a.token);
  });

  test("someone else's key can't sign in as alice", async () => {
    expect((await signIn(setup().app, bob, alice.sellerAddress)).status).toBe(401);
  });

  test("a challenge works once", async () => {
    const { app } = setup();
    const ch = (await (
      await post(app, "/auth/challenge", { address: alice.sellerAddress })
    ).json()) as Json;
    const { key, signature } = await alice.signTerms(ch.owner, ch.digest);
    expect((await post(app, "/auth/verify", { owner: ch.owner, key, signature })).status).toBe(200);
    expect((await post(app, "/auth/verify", { owner: ch.owner, key, signature })).status).toBe(401);
  });

  test("mainnet and junk addresses are refused", async () => {
    const { app } = setup();
    expect((await post(app, "/auth/challenge", { address: `addr1${"q".repeat(98)}` })).status).toBe(
      400,
    );
    expect((await post(app, "/auth/challenge", { address: "nope" })).status).toBe(400);
  });

  test("/me needs a session, and logout ends it", async () => {
    const { app } = setup();
    expect((await get(app, "/me")).status).toBe(401);
    expect((await get(app, "/me", "made-up")).status).toBe(401);
    const token = await tokenOf(app);
    expect((await get(app, "/me", token)).status).toBe(200);
    expect((await post(app, "/auth/logout", {}, token)).status).toBe(204);
    expect((await get(app, "/me", token)).status).toBe(401);
  });
});

describe("my account", () => {
  test("agent limits are bounded", async () => {
    const { app } = setup();
    const token = await tokenOf(app);
    const put = (body: unknown) =>
      app.request("/me/agent-limits", {
        method: "PUT",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
    expect((await put({ maxPerPaymentAda: 5, dailyBudgetAda: 20 })).status).toBe(200);
    expect((await put({ maxPerPaymentAda: 50, dailyBudgetAda: 20 })).status).toBe(400);
    expect((await put({ maxPerPaymentAda: 0, dailyBudgetAda: 20 })).status).toBe(400);
    const me = (await (await get(app, "/me", token)).json()) as Json;
    expect(me.limits.maxPerPaymentLovelace).toBe("5000000");
  });

  test("a purchase made from my Simpuru wallet shows up, and only I can read its content", async () => {
    const { app, db, accounts } = setup();
    const token = await tokenOf(app);
    const wallet = accounts.get(alice.sellerAddress)?.agentAddress ?? "";
    insertPurchase(db, {
      txHash: "ab".repeat(32),
      listingId: "hero",
      mode: "instant",
      payer: wallet,
      status: "settled",
      terms: "{}",
    });
    const me = (await (await get(app, "/me", token)).json()) as Json;
    expect(me.purchases.map((p: Json) => p.txHash ?? p.id)).toEqual(["ab".repeat(32)]);
    const content = await get(app, `/me/purchases/${"ab".repeat(32)}/content`, token);
    expect(await content.text()).toBe("the prompt");

    const bobToken = (await (await signIn(app, bob, bob.sellerAddress)).json()) as Json;
    expect(
      (await get(app, `/me/purchases/${"ab".repeat(32)}/content`, bobToken.token)).status,
    ).toBe(404);
  });

  test("buying needs a listing and a mode", async () => {
    const { app } = setup();
    expect(
      (await post(app, "/me/buy", { listingId: "hero", mode: "cheap" }, await tokenOf(app))).status,
    ).toBe(400);
  });

  test("a signed-in creator lists as themselves without a signature header", async () => {
    const { app } = setup();
    const token = await tokenOf(app);
    const res = await post(
      app,
      "/listings",
      {
        title: "Mine",
        description: "d",
        priceLovelace: "5000000",
        modes: ["instant", "protected"],
        content: "x",
        sellerAddress: bob.sellerAddress,
      },
      token,
    );
    expect(res.status).toBe(201);
    expect(((await res.json()) as Json).sellerAddress).toBe(alice.sellerAddress);
    const me = (await (await get(app, "/me", token)).json()) as Json;
    expect(me.listings.map((l: Json) => l.title)).toEqual(["Mine"]);
  });
});
