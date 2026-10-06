import { CATEGORIES, type Category, type DeliveryMode } from "@simpuru/core";
import { contentHash, listingProofDigest } from "@simpuru/core/hash";
import { Hono } from "hono";
import { type Db, getListing, insertListing, listCatalogue, publicListing, withStats } from "./db";
import { PROOF_HEADER, verifySignedProof } from "./owned";

// Ledger min-UTxO is ~0.97 tADA. The protected path costs the seller ~1.35 tADA in escrow fees,
// so below ~5 tADA it makes no sense.
export const MIN_PRICE_INSTANT = 1_000_000n;
export const MIN_PRICE_PROTECTED = 5_000_000n;
const MAX_CONTENT_BYTES = 1024 * 1024;
const MODES: DeliveryMode[] = ["instant", "protected"];

type NewListing = {
  title: string;
  description: string;
  priceLovelace: string;
  sellerAddress: string;
  modes: DeliveryMode[];
  content: string;
  previewMedia?: string;
  category?: Category;
};

export function validateNewListing(
  body: unknown,
): { ok: true; value: NewListing } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null)
    return { ok: false, error: "body must be a JSON object" };
  const b = body as Record<string, unknown>;
  const str = (k: string, max: number) =>
    typeof b[k] === "string" &&
    (b[k] as string).trim().length > 0 &&
    (b[k] as string).length <= max;
  if (!str("title", 120)) return { ok: false, error: "title: 1-120 chars" };
  if (!str("description", 2000)) return { ok: false, error: "description: 1-2000 chars" };
  if (
    typeof b.content !== "string" ||
    b.content.length === 0 ||
    Buffer.byteLength(b.content) > MAX_CONTENT_BYTES
  )
    return { ok: false, error: "content: non-empty string, max 1 MiB" };
  if (typeof b.sellerAddress !== "string" || !/^addr_test1[0-9a-z]{50,110}$/.test(b.sellerAddress))
    return { ok: false, error: "sellerAddress: a preprod addr_test1… address" };
  const modes = b.modes;
  if (!Array.isArray(modes) || modes.length === 0 || !modes.every((m) => MODES.includes(m)))
    return { ok: false, error: `modes: non-empty subset of ${MODES.join(", ")}` };
  if (typeof b.priceLovelace !== "string" || !/^[1-9][0-9]{0,15}$/.test(b.priceLovelace))
    return { ok: false, error: "priceLovelace: positive integer string" };
  if (
    b.previewMedia !== undefined &&
    (typeof b.previewMedia !== "string" || !isPreviewUrl(b.previewMedia))
  )
    return { ok: false, error: "previewMedia: an https URL ending in .mp4, .webm, .webp or .gif" };
  if (b.category !== undefined && !CATEGORIES.includes(b.category as Category))
    return { ok: false, error: `category: one of ${CATEGORIES.join(", ")}` };
  const price = BigInt(b.priceLovelace);
  const min = modes.includes("protected") ? MIN_PRICE_PROTECTED : MIN_PRICE_INSTANT;
  if (price < min) return { ok: false, error: `priceLovelace: at least ${min} for these modes` };
  return {
    ok: true,
    value: {
      title: (b.title as string).trim(),
      description: (b.description as string).trim(),
      priceLovelace: b.priceLovelace,
      sellerAddress: b.sellerAddress,
      modes: [...new Set(modes as DeliveryMode[])],
      content: b.content,
      ...(typeof b.previewMedia === "string" ? { previewMedia: b.previewMedia } : {}),
      ...(b.category !== undefined ? { category: b.category as Category } : {}),
    },
  };
}

/** A recording the browser can play inline: https, a media extension, sane length. */
export function isPreviewUrl(value: string) {
  if (value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /\.(mp4|webm|webp|gif)$/i.test(url.pathname);
  } catch {
    return false;
  }
}

export function listingsRoutes(db: Db) {
  const app = new Hono();

  app.get("/", (c) => c.json(listCatalogue(db).map((l) => withStats(db, publicListing(l)))));

  app.get("/:id", (c) => {
    const listing = getListing(db, c.req.param("id"));
    return listing
      ? c.json(withStats(db, publicListing(listing)))
      : c.json({ error: "not found" }, 404);
  });

  app.post("/", async (c) => {
    const body = await c.req.json().catch(() => null);
    const v = validateNewListing(body);
    if (!v.ok) return c.json({ error: v.error }, 400);
    const hash = contentHash(v.value.content);
    // The creator proves the seller address is theirs by signing this exact listing.
    const signer = verifySignedProof(c.req.header(PROOF_HEADER) ?? "", (address, ts) =>
      listingProofDigest(address, hash, v.value.priceLovelace, ts),
    );
    if (signer !== v.value.sellerAddress)
      return c.json(
        {
          error:
            "X-Simpuru-Proof must be a CIP-8 signature by sellerAddress over listingProofDigest(sellerAddress, sha256(content), priceLovelace, timestamp)",
        },
        401,
      );
    const row = { id: crypto.randomUUID(), ...v.value, contentHash: hash };
    insertListing(db, row);
    return c.json(publicListing(row), 201);
  });

  return app;
}

/** A creator's public page: what they sell, how much, and their on-chain reputation. */
export function creatorsRoutes(db: Db) {
  const app = new Hono();
  app.get("/:address", (c) => {
    const address = c.req.param("address");
    const listings = listCatalogue(db)
      .filter((l) => l.sellerAddress === address)
      .map((l) => withStats(db, publicListing(l)));
    if (listings.length === 0 && !/^addr_test1[0-9a-z]{50,110}$/.test(address))
      return c.json({ error: "not a preprod address" }, 400);
    const sales = listings.reduce((n, l) => n + (l.sales ?? 0), 0);
    const reputation = listings.find((l) => l.sellerReputation)?.sellerReputation;
    return c.json({
      address,
      listings,
      sales,
      ...(reputation ? { sellerReputation: reputation } : {}),
    });
  });
  return app;
}
