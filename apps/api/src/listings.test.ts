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

  test("listings without a preview omit the field", async () => {
    const l = (await (await fresh().request("/listings/aurora-saas-hero")).json()) as Record<
      string,
      unknown
    >;
    expect("previewMedia" in l).toBe(false);
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
