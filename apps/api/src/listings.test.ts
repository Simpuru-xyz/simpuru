import { describe, expect, test } from "bun:test";
import { contentHash } from "@simpuru/core/hash";
import { createApp } from "./app";
import { openDb } from "./db";
import { seed } from "./seed";

const SELLER = `addr_test1${"q".repeat(98)}`;
const fresh = () => {
  const db = openDb(":memory:");
  seed(db, SELLER);
  return createApp(db);
};
const post = (app: ReturnType<typeof createApp>, body: unknown) =>
  app.request("/listings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
const valid = {
  title: "Thing",
  description: "A thing",
  priceLovelace: "5000000",
  sellerAddress: SELLER,
  modes: ["instant", "protected"],
  content: "secret bytes",
};

describe("listings", () => {
  test("catalogue is public and never leaks content", async () => {
    const res = await fresh().request("/listings");
    const body = (await res.json()) as Record<string, unknown>[];
    expect(body.length).toBe(5);
    for (const l of body) {
      expect(l.content).toBeUndefined();
      expect(l.contentHash).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  test("seed is idempotent", () => {
    const db = openDb(":memory:");
    seed(db, SELLER);
    seed(db, SELLER);
    expect(db.query("SELECT count(*) AS n FROM listings").get()).toEqual({ n: 5 });
  });

  test("unknown id is 404", async () => {
    expect((await fresh().request("/listings/nope")).status).toBe(404);
  });

  test("create commits to the content hash", async () => {
    const app = fresh();
    const res = await post(app, valid);
    expect(res.status).toBe(201);
    const l = (await res.json()) as { id: string; contentHash: string; content?: string };
    expect(l.contentHash).toBe(contentHash("secret bytes"));
    expect(l.content).toBeUndefined();
    expect((await app.request(`/listings/${l.id}`)).status).toBe(200);
  });

  test.each([
    ["protected below 5 tADA", { ...valid, priceLovelace: "4999999" }],
    ["instant below 1 tADA", { ...valid, modes: ["instant"], priceLovelace: "999999" }],
    ["mainnet address", { ...valid, sellerAddress: `addr1${"q".repeat(98)}` }],
    ["unknown mode", { ...valid, modes: ["cheap"] }],
    ["empty content", { ...valid, content: "" }],
    ["price not a string", { ...valid, priceLovelace: 5000000 }],
    ["preview over http", { ...valid, previewMedia: "http://cdn.example.com/a.mp4" }],
    ["preview that is not media", { ...valid, previewMedia: "https://cdn.example.com/a.html" }],
    ["preview that is not a URL", { ...valid, previewMedia: "a.mp4" }],
    ["unknown category", { ...valid, category: "Crypto" }],
  ])("rejects %s", async (_, body) => {
    expect((await post(fresh(), body)).status).toBe(400);
  });
});

describe("preview media", () => {
  test("an https recording is stored and returned, never the content", async () => {
    const app = fresh();
    const previewMedia = "https://cdn.example.com/previews/hero.webm?v=2";
    const res = await post(app, { ...valid, previewMedia });
    expect(res.status).toBe(201);
    const { id } = (await res.json()) as { id: string };
    const l = (await (await app.request(`/listings/${id}`)).json()) as Record<string, unknown>;
    expect(l.previewMedia).toBe(previewMedia);
    expect(l.content).toBeUndefined();
  });

  test("seed prompts carry their recordings; demo listings have none", async () => {
    const app = fresh();
    const get = async (id: string) =>
      (await (await app.request(`/listings/${id}`)).json()) as Record<string, unknown>;
    expect((await get("aurora-saas-hero")).previewMedia).toBe(
      "https://app.simpuru.xyz/mock/aurora-saas.webm",
    );
    expect("previewMedia" in (await get("demo-no-delivery"))).toBe(false);
  });
});

describe("catalogue stats", () => {
  test("seeded listings carry category and createdAt, sales start at 0, no reputation yet", async () => {
    const l = (await (await fresh().request("/listings/aurora-saas-hero")).json()) as Record<
      string,
      unknown
    >;
    expect(l.category).toBe("Hero");
    expect(Number(l.createdAt)).toBeGreaterThan(0);
    expect(l.sales).toBe(0);
    expect("sellerReputation" in l).toBe(false);
  });

  test("sales skip refunds; reputation = withdrawn / (withdrawn + refunded)", async () => {
    const db = openDb(":memory:");
    seed(db, SELLER);
    const { insertPurchase } = await import("./purchases");
    const buy = (tx: string, status: string) =>
      insertPurchase(db, {
        txHash: tx.repeat(64),
        listingId: "aurora-saas-hero",
        mode: "protected",
        payer: "addr_test1b",
        status,
        terms: "{}",
      });
    buy("a", "withdrawn");
    buy("b", "withdrawn");
    buy("c", "withdrawn");
    buy("d", "refunded");
    buy("e", "FundsLocked");
    const l = (await (await createApp(db).request("/listings/aurora-saas-hero")).json()) as Record<
      string,
      unknown
    >;
    expect(l.sales).toBe(4);
    expect(l.sellerReputation).toEqual({ score: 75, basis: 4 });
  });
});

describe("demo faults", () => {
  test("honest listings deliver their content, faulty ones don't", async () => {
    const { deliveredContent } = await import("./seed");
    expect(deliveredContent({ id: "orders-dataset-100", content: "x" })).toBe("x");
    expect(deliveredContent({ id: "demo-no-delivery", content: "x" })).toBe("");
    expect(deliveredContent({ id: "demo-wrong-file", content: "x" })).not.toBe("x");
  });

  test("demo listings are added to an existing catalogue", () => {
    const db = openDb(":memory:");
    seed(db, SELLER);
    db.run("DELETE FROM listings WHERE id LIKE 'demo-%'");
    seed(db, SELLER);
    expect(db.query("SELECT count(*) AS n FROM listings").get()).toEqual({ n: 5 });
  });
});
