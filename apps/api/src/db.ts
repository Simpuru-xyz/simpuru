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
  db.run(`CREATE TABLE IF NOT EXISTS purchases (
    tx_hash TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL REFERENCES listings(id),
    mode TEXT NOT NULL,
    payer TEXT NOT NULL,
    status TEXT NOT NULL,
    terms TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`);
  // Seller-agent progress on protected purchases (added after the first release, hence ALTER).
  for (const col of ["result_tx TEXT", "closing_tx TEXT", "updated_at INTEGER"]) {
    try {
      db.run(`ALTER TABLE purchases ADD COLUMN ${col}`);
    } catch {
      // column already there
    }
  }
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

export type PurchaseRow = {
  txHash: string;
  listingId: string;
  mode: DeliveryMode;
  payer: string;
  status: string;
  /** The accepted PaymentRequirements as JSON (the seller-signed quote on the protected path). */
  terms: string;
};

export const insertPurchase = (db: Db, p: PurchaseRow) =>
  db
    .query(
      `INSERT OR IGNORE INTO purchases (tx_hash, listing_id, mode, payer, status, terms, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(p.txHash, p.listingId, p.mode, p.payer, p.status, p.terms, Date.now());

/** A purchase that still entitles the payer to the content (refunded ones don't). */
export const findPurchase = (db: Db, listingId: string, payer: string) =>
  db
    .query<{ tx_hash: string }, [string, string]>(
      `SELECT tx_hash FROM purchases WHERE listing_id = ? AND payer = ? AND status != 'refunded'
       ORDER BY created_at LIMIT 1`,
    )
    .get(listingId, payer)?.tx_hash ?? null;

export type OpenPurchase = {
  tx_hash: string;
  listing_id: string;
  status: string;
  terms: string;
  result_tx: string | null;
  updated_at: number | null;
  created_at: number;
};

/** Protected purchases the seller agent still has to act on or watch. */
export const openProtectedPurchases = (db: Db) =>
  db
    .query<OpenPurchase, []>(
      `SELECT tx_hash, listing_id, status, terms, result_tx, updated_at, created_at FROM purchases
       WHERE mode = 'protected' AND status NOT IN ('withdrawn', 'closed')`,
    )
    .all();

export const updatePurchase = (
  db: Db,
  txHash: string,
  fields: { status: string; resultTx?: string; closingTx?: string },
) =>
  db
    .query(
      `UPDATE purchases SET status = ?, result_tx = COALESCE(?, result_tx),
       closing_tx = COALESCE(?, closing_tx), updated_at = ? WHERE tx_hash = ?`,
    )
    .run(fields.status, fields.resultTx ?? null, fields.closingTx ?? null, Date.now(), txHash);

export type PurchaseView = {
  txHash: string;
  listingId: string;
  mode: DeliveryMode;
  payer: string;
  status: string;
  resultTx: string | null;
  closingTx: string | null;
  deadlines: {
    payBy: string;
    submitResult: string;
    unlock: string;
    externalDisputeUnlock: string;
  } | null;
  createdAt: number;
};

export const getPurchase = (db: Db, txHash: string): PurchaseView | null => {
  const r = db
    .query<
      {
        tx_hash: string;
        listing_id: string;
        mode: DeliveryMode;
        payer: string;
        status: string;
        terms: string;
        result_tx: string | null;
        closing_tx: string | null;
        created_at: number;
      },
      [string]
    >("SELECT * FROM purchases WHERE tx_hash = ?")
    .get(txHash);
  if (!r) return null;
  const t = (JSON.parse(r.terms) as { extra?: { terms?: Record<string, string> } }).extra?.terms;
  return {
    txHash: r.tx_hash,
    listingId: r.listing_id,
    mode: r.mode,
    payer: r.payer,
    status: r.status,
    resultTx: r.result_tx,
    closingTx: r.closing_tx,
    deadlines: t
      ? {
          payBy: t.payByTime ?? "",
          submitResult: t.submitResultTime ?? "",
          unlock: t.unlockTime ?? "",
          externalDisputeUnlock: t.externalDisputeUnlockTime ?? "",
        }
      : null,
    createdAt: r.created_at,
  };
};
