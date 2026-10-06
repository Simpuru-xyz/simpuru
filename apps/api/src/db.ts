import { Database } from "bun:sqlite";
import type { DeliveryMode, Listing } from "@simpuru/core";

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
};

const toListing = (r: Row): ListingRow => ({
  id: r.id,
  title: r.title,
  description: r.description,
  priceLovelace: r.price_lovelace,
  sellerAddress: r.seller_address,
  modes: JSON.parse(r.modes) as DeliveryMode[],
  contentHash: r.content_hash,
  content: r.content,
});

export const listListings = (db: Db) =>
  db.query<Row, []>("SELECT * FROM listings ORDER BY created_at").all().map(toListing);

export const getListing = (db: Db, id: string) => {
  const r = db.query<Row, [string]>("SELECT * FROM listings WHERE id = ?").get(id);
  return r ? toListing(r) : null;
};

export const insertListing = (db: Db, l: ListingRow) =>
  db
    .query(
      `INSERT INTO listings (id, title, description, price_lovelace, seller_address, modes, content, content_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      Date.now(),
    );

/** Public view: never leak the paid content. */
export const publicListing = ({ content: _, ...listing }: ListingRow): Listing => listing;
