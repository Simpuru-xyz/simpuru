import { Database } from "bun:sqlite";
import type { Category, DeliveryMode, Listing } from "@simpuru/core";

export type ListingRow = Listing & { content: string };

export function openDb(path = process.env.DB_PATH ?? "data/simpuru.db") {
  const db = new Database(path, { create: true });
  db.run("PRAGMA journal_mode = WAL");
  db.run(`CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price_lovelace TEXT NOT NULL,
    seller_address TEXT NOT NULL,
    modes TEXT NOT NULL,
    content TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS purchases (
    tx_hash TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL REFERENCES listings(id),
    mode TEXT NOT NULL,
    payer TEXT NOT NULL,
    status TEXT NOT NULL,
    terms TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`);
  for (const col of ["preview_media TEXT", "category TEXT", "hidden INTEGER NOT NULL DEFAULT 0"]) {
    try {
      db.run(`ALTER TABLE listings ADD COLUMN ${col}`);
    } catch {
      // already there
    }
  }
  // Columns added after the first release, hence ALTER (a no-op once they exist).
  for (const col of [
    "result_tx TEXT",
    "result_hash TEXT",
    "closing_tx TEXT",
    "last_ref TEXT",
    "verification TEXT",
    "updated_at INTEGER",
  ]) {
    try {
      db.run(`ALTER TABLE purchases ADD COLUMN ${col}`);
    } catch {
      // already there
    }
  }
  // One row per on-chain tx in a purchase's life, derived from chain by the seller agent.
  db.run(`CREATE TABLE IF NOT EXISTS purchase_events (
    purchase_tx TEXT NOT NULL REFERENCES purchases(tx_hash),
    status TEXT NOT NULL,
    tx_hash TEXT NOT NULL,
    at INTEGER NOT NULL,
    UNIQUE (purchase_tx, status, tx_hash)
  )`);
  return db;
}

export type Db = ReturnType<typeof openDb>;

type Row = {
  id: string;
  title: string;
  description: string;
  price_lovelace: string;
  seller_address: string;
  modes: string;
  content: string;
  content_hash: string;
  preview_media: string | null;
  category: string | null;
  created_at: number;
};

const toListing = (r: Row): ListingRow => ({
  id: r.id,
  title: r.title,
  description: r.description,
  priceLovelace: r.price_lovelace,
  sellerAddress: r.seller_address,
  modes: JSON.parse(r.modes) as DeliveryMode[],
  contentHash: r.content_hash,
  ...(r.preview_media ? { previewMedia: r.preview_media } : {}),
  ...(r.category ? { category: r.category as Category } : {}),
  createdAt: String(r.created_at),
  content: r.content,
});

/** Every listing, retired ones included (seeding and lookups need them). */
export const listListings = (db: Db) =>
  db.query<Row, []>("SELECT * FROM listings ORDER BY created_at").all().map(toListing);

/** What the catalogue shows: listings still for sale. */
export const listCatalogue = (db: Db) =>
  db
    .query<Row, []>("SELECT * FROM listings WHERE hidden = 0 ORDER BY created_at")
    .all()
    .map(toListing);

export const setHidden = (db: Db, id: string, hidden: boolean) =>
  db.query("UPDATE listings SET hidden = ? WHERE id = ?").run(hidden ? 1 : 0, id);

export const getListing = (db: Db, id: string) => {
  const r = db.query<Row, [string]>("SELECT * FROM listings WHERE id = ?").get(id);
  return r ? toListing(r) : null;
};

export const insertListing = (db: Db, l: ListingRow) =>
  db
    .query(
      `INSERT INTO listings (id, title, description, price_lovelace, seller_address, modes, content, content_hash, preview_media, category, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      l.id,
      l.title,
      l.description,
      l.priceLovelace,
      l.sellerAddress,
      JSON.stringify(l.modes),
      l.content,
      l.contentHash,
      l.previewMedia ?? null,
      l.category ?? null,
      Date.now(),
    );

/** Public view: never leak the paid content. */
export const publicListing = ({ content: _, ...listing }: ListingRow): Listing => listing;

/** Sales count and seller reputation, both derived from purchases (see `Listing` in core). */
export function withStats(db: Db, listing: Listing): Listing {
  const sales =
    db
      .query<{ n: number }, [string]>(
        "SELECT count(*) AS n FROM purchases WHERE listing_id = ? AND status != 'refunded'",
      )
      .get(listing.id)?.n ?? 0;
  const outcome = db
    .query<{ withdrawn: number | null; refunded: number | null }, [string]>(
      `SELECT sum(p.status = 'withdrawn') AS withdrawn, sum(p.status = 'refunded') AS refunded
       FROM purchases p JOIN listings l ON l.id = p.listing_id
       WHERE l.seller_address = ? AND p.mode = 'protected'`,
    )
    .get(listing.sellerAddress);
  const withdrawn = outcome?.withdrawn ?? 0;
  const basis = withdrawn + (outcome?.refunded ?? 0);
  return {
    ...listing,
    sales,
    ...(basis > 0
      ? { sellerReputation: { score: Math.round((100 * withdrawn) / basis), basis } }
      : {}),
  };
}
