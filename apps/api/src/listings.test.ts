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
    expect(body.length).toBe(3);
    for (const l of body) {
      expect(l.content).toBeUndefined();
      expect(l.contentHash).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  test("seed is idempotent", () => {
    const db = openDb(":memory:");
    seed(db, SELLER);
    seed(db, SELLER);
    expect(db.query("SELECT count(*) AS n FROM listings").get()).toEqual({ n: 3 });
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
  ])("rejects %s", async (_, body) => {
    expect((await post(fresh(), body)).status).toBe(400);
  });
});
