import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createBuyer } from "./buyer";

// Public BIP-39 test vector, never funded. Budget refusals happen before any signing.
const MNEMONIC = `${"abandon ".repeat(23)}art`;
const listing = {
  id: "x",
  title: "x",
  description: "x",
  priceLovelace: "6000000",
  sellerAddress: `addr_test1${"q".repeat(98)}`,
  modes: ["instant"],
  contentHash: "0".repeat(64),
};
let listingHits = 0;
const api = Bun.serve({
  port: 0,
  fetch: (req) => {
    if (new URL(req.url).pathname !== "/listings/x")
      return new Response("unexpected", { status: 500 });
    listingHits++;
    return Response.json(listing);
  },
});
afterAll(() => api.stop());

const buyer = (over: { max?: bigint; daily?: bigint; log?: string } = {}) =>
  createBuyer({
    mnemonic: MNEMONIC,
    blockfrostProjectId: "unused",
    apiUrl: `http://localhost:${api.port}`,
    maxPerPaymentLovelace: over.max ?? 20_000_000n,
    dailyBudgetLovelace: over.daily ?? 50_000_000n,
    logPath: over.log ?? join(mkdtempSync(join(tmpdir(), "buyer-")), "log.jsonl"),
  });

test("refuses a listing above the per-payment cap", async () => {
  const r = await buyer({ max: 5_000_000n }).buy("x", "instant");
  expect(r).toMatchObject({ ok: false, paid: false });
  if (!r.ok) expect(r.error).toContain("per-payment cap");
});

test("refuses when today's spending would pass the daily budget", async () => {
  const log = join(mkdtempSync(join(tmpdir(), "buyer-")), "log.jsonl");
  const today = new Date().toISOString();
  writeFileSync(log, `${JSON.stringify({ at: today, priceLovelace: "45000000" })}\n`);
  const b = buyer({ log });
  expect(b.spentToday()).toBe(45_000_000n);
  const r = await b.buy("x", "instant");
  if (!r.ok) expect(r.error).toContain("daily budget");
  else throw new Error("should have refused");
});

test("yesterday's spending does not count", () => {
  const log = join(mkdtempSync(join(tmpdir(), "buyer-")), "log.jsonl");
  writeFileSync(
    log,
    `${JSON.stringify({ at: "2000-01-01T00:00:00Z", priceLovelace: "45000000" })}\n`,
  );
  expect(buyer({ log }).spentToday()).toBe(0n);
});

test("refuses a mode the listing does not offer", async () => {
  const r = await buyer().buy("x", "protected");
  if (!r.ok) expect(r.error).toContain("does not offer");
  else throw new Error("should have refused");
});

test("unknown listing", async () => {
  const r = await buyer().buy("nope", "instant");
  expect(r.ok).toBe(false);
});

test("a retry while the first buy is still running doesn't start a second payment", async () => {
  const b = buyer({ max: 5_000_000n });
  listingHits = 0;
  const [first, second] = await Promise.all([b.buy("x", "instant"), b.buy("x", "instant")]);
  expect(second).toBe(first);
  expect(listingHits).toBe(1);
});

test("the next buy after one finished runs again", async () => {
  const b = buyer({ max: 5_000_000n });
  listingHits = 0;
  await b.buy("x", "instant");
  await b.buy("x", "instant");
  expect(listingHits).toBe(2);
});
