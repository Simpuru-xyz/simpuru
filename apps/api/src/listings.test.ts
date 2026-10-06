import { describe, expect, test } from "bun:test";
import { contentHash } from "@simpuru/core/hash";
import { createApp } from "./app";
import { openDb } from "./db";
import { insertPurchase } from "./purchases";
import { deliveredContent, seed } from "./seed";
import { creatorPayout, escrowSeller } from "./seller";
import { addListing, alice, bob, DEMO_SELLER, listingProof, SELLER } from "./test-helpers";

const fresh = () => {
  const db = openDb(":memory:");
  seed(db, DEMO_SELLER);
  return { db, app: createApp(db) };
};
type Body = Record<string, unknown>;
/** POST /listings, signed by `signer` (alice by default) unless `proof` is given. */
const post = async (app: ReturnType<typeof createApp>, body: Body, proof?: string) =>
  app.request("/listings", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Simpuru-Proof":
        proof ??
        (await listingProof(alice, {
          sellerAddress: String(body.sellerAddress),
          content: String(body.content),
          priceLovelace: String(body.priceLovelace),
        })),
    },
    body: JSON.stringify(body),
  });
const valid = {
  title: "Thing",
  description: "A thing",
  priceLovelace: "5000000",
  sellerAddress: alice.sellerAddress,
  modes: ["instant", "protected"],
  content: "secret bytes",
};
const list = async (app: ReturnType<typeof createApp>) =>
  (await (await app.request("/listings")).json()) as Record<string, unknown>[];

describe("catalogue", () => {
  test("starts empty: creators fill it", async () => {
    expect(await list(fresh().app)).toEqual([]);
  });

  test("shows creator listings and never leaks content", async () => {
    const { db, app } = fresh();
    addListing(db, "a");
    addListing(db, "b");
    const body = await list(app);
    expect(body.map((l) => l.id)).toEqual(["a", "b"]);
    for (const l of body) {
      expect(l.content).toBeUndefined();
      expect(l.contentHash).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  test("seed is idempotent and only keeps the hidden demo listings", () => {
    const db = openDb(":memory:");
    seed(db, DEMO_SELLER);
    seed(db, DEMO_SELLER);
    expect(db.query("SELECT count(*) AS n FROM listings").get()).toEqual({ n: 2 });
    expect(db.query("SELECT count(*) AS n FROM listings WHERE hidden = 0").get()).toEqual({ n: 0 });
  });

  test("retired platform listings leave the catalogue but still unlock for past buyers", async () => {
    const db = openDb(":memory:");
    addListing(db, "aurora-saas-hero", { content: "old prompt" });
    seed(db, DEMO_SELLER);
    const app = createApp(db);
    expect(await list(app)).toEqual([]);
    expect((await app.request("/listings/aurora-saas-hero")).status).toBe(200);
  });

  test("unknown id is 404", async () => {
    expect((await fresh().app.request("/listings/nope")).status).toBe(404);
  });
});

describe("creating a listing", () => {
  test("commits to the content hash", async () => {
    const { app } = fresh();
    const res = await post(app, valid);
    expect(res.status).toBe(201);
    const l = (await res.json()) as { id: string; contentHash: string; content?: string };
    expect(l.contentHash).toBe(contentHash("secret bytes"));
    expect(l.content).toBeUndefined();
    expect((await app.request(`/listings/${l.id}`)).status).toBe(200);
  });

  test("stores an https preview recording and a category", async () => {
    const { app } = fresh();
    const previewMedia = "https://cdn.example.com/previews/hero.webm?v=2";
    const res = await post(app, { ...valid, previewMedia, category: "Hero" });
    const { id } = (await res.json()) as { id: string };
    const l = (await (await app.request(`/listings/${id}`)).json()) as Record<string, unknown>;
    expect(l.previewMedia).toBe(previewMedia);
    expect(l.category).toBe("Hero");
    expect(Number(l.createdAt)).toBeGreaterThan(0);
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
    // Input is validated before the signature, so no real proof is needed here.
    expect((await post(fresh().app, body, "unsigned")).status).toBe(400);
  });
});

describe("creator signature", () => {
  test("an unsigned listing is refused", async () => {
    expect((await post(fresh().app, valid, "")).status).toBe(401);
  });

  test("a listing signed by someone else is refused", async () => {
    const proof = await listingProof(bob, valid);
    expect((await post(fresh().app, valid, proof)).status).toBe(401);
  });

  test("a signature for another price can't be reused", async () => {
    const proof = await listingProof(alice, { ...valid, priceLovelace: "9000000" });
    expect((await post(fresh().app, valid, proof)).status).toBe(401);
  });

  test("an old signature is refused", async () => {
    const proof = await listingProof(alice, valid, Date.now() - 10 * 60_000);
    expect((await post(fresh().app, valid, proof)).status).toBe(401);
  });
});

describe("creators", () => {
  test("a creator page lists their listings, sales and reputation", async () => {
    const { db, app } = fresh();
    await post(app, valid);
    await post(app, { ...valid, title: "Second", content: "other bytes" });
    addListing(db, "not-mine", { sellerAddress: SELLER });
    const page = (await (await app.request(`/creators/${alice.sellerAddress}`)).json()) as {
      listings: { title: string }[];
      sales: number;
    };
    expect(page.listings.map((l) => l.title)).toEqual(["Thing", "Second"]);
    expect(page.sales).toBe(0);
    expect((await app.request("/creators/not-an-address")).status).toBe(400);
  });

  test("protected creator sales pay price minus max(1.5 tADA, 10%)", () => {
    expect(creatorPayout(5_000_000n)).toBe(3_500_000n);
    expect(creatorPayout(15_000_000n)).toBe(13_500_000n);
    expect(creatorPayout(30_000_000n)).toBe(27_000_000n);
  });

  test("the platform stands in as escrow seller for creators", () => {
    const sellers = {
      keys: new Map([["addr_platform", "seller" as const]]),
      main: "addr_platform",
    };
    expect(escrowSeller(sellers, "addr_platform")).toBe("addr_platform");
    expect(escrowSeller(sellers, alice.sellerAddress)).toBe("addr_platform");
  });
});

describe("catalogue stats", () => {
  test("a new listing has 0 sales and no reputation", async () => {
    const { db, app } = fresh();
    addListing(db, "a");
    const [l] = await list(app);
    expect(l?.sales).toBe(0);
    expect(l && "sellerReputation" in l).toBe(false);
  });

  test("sales skip refunds; reputation = withdrawn / (withdrawn + refunded) per seller", async () => {
    const { db, app } = fresh();
    addListing(db, "a");
    const buy = (tx: string, status: string) =>
      insertPurchase(db, {
        txHash: tx.repeat(64),
        listingId: "a",
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
    const [l] = await list(app);
    expect(l?.sales).toBe(4);
    expect(l?.sellerReputation).toEqual({ score: 75, basis: 4 });
  });
});

describe("demo sellers", () => {
  test("bad demo listings belong to the demo seller, so their refunds don't touch other sellers", async () => {
    const { db, app } = fresh();
    addListing(db, "honest");
    const buy = (tx: string, listingId: string, status: string) =>
      insertPurchase(db, {
        txHash: tx.repeat(64),
        listingId,
        mode: "protected",
        payer: "addr_test1b",
        status,
        terms: "{}",
      });
    buy("a", "honest", "withdrawn");
    buy("b", "demo-no-delivery", "refunded");
    buy("c", "demo-wrong-file", "refunded");
    const get = async (id: string) =>
      (await (await app.request(`/listings/${id}`)).json()) as Record<string, unknown>;
    expect((await get("demo-no-delivery")).sellerAddress).toBe(DEMO_SELLER);
    expect((await get("honest")).sellerReputation).toEqual({ score: 100, basis: 1 });
    expect((await get("demo-wrong-file")).sellerReputation).toEqual({ score: 0, basis: 2 });
  });

  test("demo listings created under another seller move to the demo seller", () => {
    const db = openDb(":memory:");
    seed(db, SELLER);
    seed(db, DEMO_SELLER);
    const row = db
      .query("SELECT seller_address AS s FROM listings WHERE id = 'demo-wrong-file'")
      .get() as { s: string };
    expect(row.s).toBe(DEMO_SELLER);
  });

  test("honest listings deliver their content, faulty ones don't", () => {
    expect(deliveredContent({ id: "a", content: "x" })).toBe("x");
    expect(deliveredContent({ id: "demo-no-delivery", content: "x" })).toBe("");
    expect(deliveredContent({ id: "demo-wrong-file", content: "x" })).not.toBe("x");
  });
});
