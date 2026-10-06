// Seller agent for protected purchases: after delivery it posts the result hash, after the
// unlock time it collects. It never concedes on its own (a dispute goes to the arbiter).

import { Address } from "@evolution-sdk/evolution";
import { ESCROW_STATES } from "@simpuru/core";
import { ESCROW } from "@simpuru/core/escrow";
import { purchaseResultHash } from "@simpuru/core/hash";
import { readClient, submitResult, viewOf, withdraw } from "@simpuru/escrow";
import {
  type Db,
  getListing,
  type OpenPurchase,
  openProtectedPurchases,
  updatePurchase,
} from "./db";

/** The datum fields the decision needs. */
export interface LockView {
  state: bigint;
  resultHash: string;
  submitResultTime: bigint;
  unlockTime: bigint;
  sellerCooldownTime: bigint;
}

export type SellerAction =
  | { kind: "submit" }
  | { kind: "withdraw" }
  | { kind: "wait"; status: string }
  /** The lock is gone and we did not collect it: refunded or settled by the arbiter. */
  | { kind: "closed" };

// A tx we sent may take a minute to show up; don't send another for the same step meanwhile.
const IN_FLIGHT_MS = 3 * 60_000;
// Chain time trails the wall clock; stay clear of the deadlines on both sides.
const MARGIN_MS = 60_000n;

export function nextSellerAction(
  lock: LockView | null,
  p: OpenPurchase,
  now: number,
): SellerAction {
  if (!lock) return { kind: "closed" };
  const t = BigInt(now);
  const state = ESCROW_STATES[Number(lock.state)] ?? `state ${lock.state}`;
  const recentlySent = p.updated_at !== null && now - p.updated_at < IN_FLIGHT_MS;
  if (state === "FundsLocked" && lock.resultHash === "") {
    if (t + MARGIN_MS >= lock.submitResultTime) return { kind: "wait", status: "FundsLocked" }; // too late, buyer refunds
    return recentlySent && p.result_tx
      ? { kind: "wait", status: "FundsLocked" }
      : { kind: "submit" };
  }
  if (
    state === "ResultSubmitted" &&
    t > lock.unlockTime + MARGIN_MS &&
    t > lock.sellerCooldownTime
  ) {
    return recentlySent && p.status === "withdrawing"
      ? { kind: "wait", status: "withdrawing" }
      : { kind: "withdraw" };
  }
  return { kind: "wait", status: state };
}

const sellerNonceOf = (p: OpenPurchase) =>
  (JSON.parse(p.terms) as { extra?: { terms?: { sellerNonce?: string } } }).extra?.terms
    ?.sellerNonce;

/** One pass over open protected purchases. Errors are logged and retried on the next pass. */
export async function sellerTick(db: Db, now = Date.now()) {
  const open = openProtectedPurchases(db);
  if (open.length === 0) return;
  // A lock moves to a new UTxO on every action; the seller nonce in its datum stays the same.
  const utxos = await readClient().getUtxos(Address.fromBech32(ESCROW.address));
  const locks = new Map<string, { ref: string; view: ReturnType<typeof viewOf> }>();
  for (const u of utxos) {
    try {
      const view = viewOf(u);
      locks.set(view.sellerNonce, {
        ref: `${Buffer.from(u.transactionId.hash).toString("hex")}#${u.index}`,
        view,
      });
    } catch {
      // not one of ours
    }
  }

  for (const p of open) {
    const lock = locks.get(sellerNonceOf(p) ?? "") ?? null;
    const action = nextSellerAction(lock?.view ?? null, p, now);
    try {
      if (action.kind === "submit" && lock) {
        const listing = getListing(db, p.listing_id);
        if (!listing) continue;
        const resultTx = await submitResult(
          lock.ref,
          purchaseResultHash(p.tx_hash, listing.content),
        );
        updatePurchase(db, p.tx_hash, { status: "FundsLocked", resultTx });
        console.log(`[seller] ${p.tx_hash.slice(0, 8)} result submitted ${resultTx}`);
      } else if (action.kind === "withdraw" && lock) {
        updatePurchase(db, p.tx_hash, { status: "withdrawing" });
        const closingTx = await withdraw(lock.ref);
        updatePurchase(db, p.tx_hash, { status: "withdrawn", closingTx });
        console.log(`[seller] ${p.tx_hash.slice(0, 8)} withdrawn ${closingTx}`);
      } else if (action.kind === "closed") {
        // Only trust "gone" once the lock should be visible (a fresh lock can lag the indexer).
        if (now - Math.max(p.created_at, p.updated_at ?? 0) > IN_FLIGHT_MS)
          updatePurchase(db, p.tx_hash, { status: "closed" });
      } else if (
        action.kind === "wait" &&
        action.status !== p.status &&
        p.status !== "withdrawing"
      ) {
        updatePurchase(db, p.tx_hash, { status: action.status });
      }
    } catch (error) {
      console.warn(
        `[seller] ${p.tx_hash.slice(0, 8)} ${action.kind} failed: ${String(error).slice(0, 200)}`,
      );
    }
  }
}

/** Runs `sellerTick` every `intervalMs`, one pass at a time. */
export function startSellerAgent(db: Db, intervalMs = 30_000) {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await sellerTick(db);
    } catch (error) {
      console.warn(`[seller] tick failed: ${String(error).slice(0, 200)}`);
    } finally {
      running = false;
    }
  };
  void tick();
  return setInterval(tick, intervalMs);
}
