import type { DeliveryMode, Purchase, PurchaseStatus } from "@simpuru/core";
import { ESCROW } from "@simpuru/core/escrow";
import { Hono } from "hono";
import type { Db } from "./db";
import { getListing } from "./db";
import { PROOF_HEADER, verifyProof } from "./owned";

export type Verification = "ok" | "mismatch" | "no_result_yet";
export type PurchaseView = Purchase & { verification?: Verification };

export type PurchaseRow = {
  txHash: string;
  listingId: string;
  mode: DeliveryMode;
  payer: string;
  status: string;
  /** The accepted PaymentRequirements as JSON (the seller-signed quote on the protected path). */
  terms: string;
};

type Row = {
  tx_hash: string;
  listing_id: string;
  mode: DeliveryMode;
  payer: string;
  status: string;
  terms: string;
  result_tx: string | null;
  result_hash: string | null;
  closing_tx: string | null;
  last_ref: string | null;
  verification: Verification | null;
  updated_at: number | null;
  created_at: number;
};

export function addEvent(
  db: Db,
  purchaseTx: string,
  status: string,
  txHash: string,
  at = Date.now(),
) {
  db.query(
    "INSERT OR IGNORE INTO purchase_events (purchase_tx, status, tx_hash, at) VALUES (?, ?, ?, ?)",
  ).run(purchaseTx, status, txHash, at);
}

export function insertPurchase(db: Db, p: PurchaseRow) {
  const now = Date.now();
  db.query(
    `INSERT OR IGNORE INTO purchases (tx_hash, listing_id, mode, payer, status, terms, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(p.txHash, p.listingId, p.mode, p.payer, p.status, p.terms, now);
  addEvent(db, p.txHash, p.status, p.txHash, now);
}

/** A purchase that still entitles the payer to the content (refunded ones don't). */
export const findPurchase = (db: Db, listingId: string, payer: string) =>
  db
    .query<{ tx_hash: string }, [string, string]>(
      `SELECT tx_hash FROM purchases WHERE listing_id = ? AND payer = ? AND status != 'refunded'
       ORDER BY created_at LIMIT 1`,
    )
    .get(listingId, payer)?.tx_hash ?? null;

/** Protected purchases the seller agent still has to act on or watch. */
export const openProtectedPurchases = (db: Db) =>
  db
    .query<Row, []>(
      `SELECT * FROM purchases WHERE mode = 'protected'
       AND status NOT IN ('withdrawn', 'refunded', 'closed')`,
    )
    .all();
export type OpenPurchase = Row;

export function updatePurchase(
  db: Db,
  txHash: string,
  f: {
    status?: string;
    resultTx?: string;
    resultHash?: string;
    closingTx?: string;
    lastRef?: string;
  },
) {
  db.query(
    `UPDATE purchases SET status = COALESCE(?, status), result_tx = COALESCE(?, result_tx),
     result_hash = COALESCE(?, result_hash), closing_tx = COALESCE(?, closing_tx),
     last_ref = COALESCE(?, last_ref), updated_at = ? WHERE tx_hash = ?`,
  ).run(
    f.status ?? null,
    f.resultTx ?? null,
    f.resultHash ?? null,
    f.closingTx ?? null,
    f.lastRef ?? null,
    Date.now(),
    txHash,
  );
}

function toView(db: Db, r: Row): PurchaseView {
  const t = (JSON.parse(r.terms) as { extra?: { terms?: Record<string, string> } }).extra?.terms;
  const events = db
    .query<{ status: string; tx_hash: string; at: number }, [string]>(
      "SELECT status, tx_hash, at FROM purchase_events WHERE purchase_tx = ? ORDER BY at, rowid",
    )
    .all(r.tx_hash)
    .map((e) => ({ status: e.status as PurchaseStatus, txHash: e.tx_hash, at: String(e.at) }));
  return {
    id: r.tx_hash,
    listingId: r.listing_id,
    mode: r.mode,
    buyerAddress: r.payer,
    txHash: r.tx_hash,
    status: r.status as PurchaseStatus,
    ...(r.mode === "protected" && t
      ? {
          escrow: {
            address: ESCROW.address,
            inputHash: t.inputHash ?? "",
            ...(r.result_hash ? { resultHash: r.result_hash } : {}),
            // Team convention: the lock tx hash stands in for identifier_from_purchaser.
            identifierFromPurchaser: r.tx_hash,
            deadlines: {
              payBy: t.payByTime ?? "",
              submitResult: t.submitResultTime ?? "",
              unlock: t.unlockTime ?? "",
              externalDisputeUnlock: t.externalDisputeUnlockTime ?? "",
            },
          },
        }
      : {}),
    events,
    ...(r.verification ? { verification: r.verification } : {}),
  };
}

export const getPurchaseView = (db: Db, id: string) => {
  const r = db.query<Row, [string]>("SELECT * FROM purchases WHERE tx_hash = ?").get(id);
  return r ? toView(db, r) : null;
};

const VERDICTS: Verification[] = ["ok", "mismatch", "no_result_yet"];

export function purchasesRoutes(db: Db) {
  const app = new Hono();

  app.get("/", (c) => {
    const seller = c.req.query("seller");
    if (!seller) return c.json({ error: "seller query parameter is required" }, 400);
    const rows = db
      .query<Row, [string]>(
        `SELECT p.* FROM purchases p JOIN listings l ON l.id = p.listing_id
         WHERE l.seller_address = ? ORDER BY p.created_at DESC`,
      )
      .all(seller);
    return c.json(rows.map((r) => toView(db, r)));
  });

  app.get("/:id", (c) => {
    const view = getPurchaseView(db, c.req.param("id"));
    return view ? c.json(view) : c.json({ error: "not found" }, 404);
  });

  // The buyer's own verdict on what it received. Only the payer may set it (signed proof, as in #17).
  app.post("/:id/verification", async (c) => {
    const view = getPurchaseView(db, c.req.param("id"));
    if (!view) return c.json({ error: "not found" }, 404);
    const listing = getListing(db, view.listingId);
    const signer = listing ? verifyProof(c.req.header(PROOF_HEADER) ?? "", listing.id) : null;
    if (signer !== view.buyerAddress)
      return c.json({ error: "only the buyer can report a verdict" }, 403);
    const body = (await c.req.json().catch(() => null)) as { verification?: Verification } | null;
    if (!body?.verification || !VERDICTS.includes(body.verification))
      return c.json({ error: `verification: one of ${VERDICTS.join(", ")}` }, 400);
    db.query("UPDATE purchases SET verification = ? WHERE tx_hash = ?").run(
      body.verification,
      view.id,
    );
    return c.json(getPurchaseView(db, view.id));
  });

  return app;
}

/** Protected sales of creator listings the platform has collected but not yet paid out. */
export const pendingCreatorPayouts = (db: Db, platformAddresses: string[]) =>
  db
    .query<{ tx_hash: string; seller_address: string; price_lovelace: string }, string[]>(
      `SELECT p.tx_hash, l.seller_address, l.price_lovelace FROM purchases p
       JOIN listings l ON l.id = p.listing_id
       WHERE p.mode = 'protected' AND p.status = 'withdrawn' AND p.payout_tx IS NULL
       AND l.seller_address NOT IN (${platformAddresses.map(() => "?").join(",") || "''"})`,
    )
    .all(...platformAddresses);

export const setPayout = (db: Db, txHash: string, payoutTx: string) =>
  db.query("UPDATE purchases SET payout_tx = ? WHERE tx_hash = ?").run(payoutTx, txHash);
