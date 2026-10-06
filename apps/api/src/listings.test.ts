import { describe, expect, test } from "bun:test";
import { contentHash } from "@simpuru/core/hash";
import { createApp } from "./app";
import { insertListing, openDb } from "./db";
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
    expect(body.length).toBe(12);
    for (const l of body) {
      expect(l.content).toBeUndefined();
      expect(l.contentHash).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  test("seed is idempotent", () => {
    const db = openDb(":memory:");
    seed(db, SELLER);
    seed(db, SELLER);
    expect(db.query("SELECT count(*) AS n FROM listings").get()).toEqual({ n: 12 });
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
    expect((await get("lumen-aurora-hero")).previewMedia).toBe(
      "https://app.simpuru.xyz/mock/aurora-saas.webm",
    );
    expect("previewMedia" in (await get("demo-no-delivery"))).toBe(false);
  });
});

describe("catalogue stats", () => {
  test("seeded listings carry category and createdAt, sales start at 0, no reputation yet", async () => {
    const l = (await (await fresh().request("/listings/lumen-aurora-hero")).json()) as Record<
      string,
      unknown
    >;
    expect(l.category).toBe("SaaS");
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
        listingId: "lumen-aurora-hero",
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
    const l = (await (await createApp(db).request("/listings/lumen-aurora-hero")).json()) as Record<
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
    expect(db.query("SELECT count(*) AS n FROM listings").get()).toEqual({ n: 12 });
  });
});

describe("demo seller", () => {
  const DEMO_SELLER = `addr_test1${"z".repeat(98)}`;

  test("bad demo listings belong to their own seller, and their refunds don't touch the honest one", async () => {
    const db = openDb(":memory:");
    seed(db, SELLER, DEMO_SELLER);
    const { insertPurchase } = await import("./purchases");
    const buy = (tx: string, listingId: string, status: string) =>
      insertPurchase(db, {
        txHash: tx.repeat(64),
        listingId,
        mode: "protected",
        payer: "addr_test1b",
        status,
        terms: "{}",
      });
    buy("a", "lumen-aurora-hero", "withdrawn");
    buy("b", "demo-no-delivery", "refunded");
    buy("c", "demo-wrong-file", "refunded");
    const app = createApp(db);
    const get = async (id: string) =>
      (await (await app.request(`/listings/${id}`)).json()) as Record<string, unknown>;
    expect((await get("demo-no-delivery")).sellerAddress).toBe(DEMO_SELLER);
    expect((await get("lumen-aurora-hero")).sellerReputation).toEqual({ score: 100, basis: 1 });
    expect((await get("demo-wrong-file")).sellerReputation).toEqual({ score: 0, basis: 2 });
  });

  test("demo listings seeded under the honest seller move to the demo seller", () => {
    const db = openDb(":memory:");
    seed(db, SELLER);
    seed(db, SELLER, DEMO_SELLER);
    const row = db
      .query("SELECT seller_address AS s FROM listings WHERE id = 'demo-wrong-file'")
      .get() as { s: string };
    expect(row.s).toBe(DEMO_SELLER);
  });
});

describe("retired listings", () => {
  test("are left out of the catalogue but still unlock for past buyers", async () => {
    const db = openDb(":memory:");
    seed(db, SELLER);
    insertListing(db, {
      id: "aurora-saas-hero",
      title: "old",
      description: "old",
      priceLovelace: "6000000",
      sellerAddress: SELLER,
      modes: ["instant"],
      content: "old prompt",
      contentHash: contentHash("old prompt"),
    });
    seed(db, SELLER);
    const app = createApp(db);
    const ids = ((await (await app.request("/listings")).json()) as { id: string }[]).map(
      (l) => l.id,
    );
    expect(ids).not.toContain("aurora-saas-hero");
    expect(ids).toContain("lumen-aurora-hero");
    expect((await app.request("/listings/aurora-saas-hero")).status).toBe(200);
  });

  test("every pro prompt is a real spec with its recording", async () => {
    const all = (await (await fresh().request("/listings")).json()) as {
      id: string;
      previewMedia?: string;
    }[];
    const db = openDb(":memory:");
    seed(db, SELLER);
    const pro = all.filter((l) => !l.id.startsWith("demo-"));
    expect(pro.length).toBe(10);
    for (const l of pro) {
      expect(l.previewMedia).toMatch(/^https:\/\/app\.simpuru\.xyz\/mock\/.+\.webm$/);
      const row = db.query("SELECT content FROM listings WHERE id = ?").get(l.id) as {
        content: string;
      };
      expect(row.content.split(/\s+/).length).toBeGreaterThan(250);
    }
  });
});

test("seed refreshes a seed listing whose stored text is out of date", async () => {
  const db = openDb(":memory:");
  seed(db, SELLER);
  db.run(
    "UPDATE listings SET content = 'old', content_hash = 'x' WHERE id = 'kinetic-pricing-section'",
  );
  seed(db, SELLER);
  const row = db
    .query("SELECT content, content_hash AS h FROM listings WHERE id = 'kinetic-pricing-section'")
    .get() as {
    content: string;
    h: string;
  };
  expect(row.content).toStartWith("Build a pricing section");
  expect(row.h).toBe(contentHash(row.content));
});
