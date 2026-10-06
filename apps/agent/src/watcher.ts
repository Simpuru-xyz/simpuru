// Protection watcher: looks after every protected purchase in the buyer's log,
// with no human in the loop.
//
//   no result by submit_result_time      → withdrawRefund (full amount back)
//   seller conceded (RefundAuthorized)   → withdrawRefund
//   result on chain that fails #9 checks → setRefundRequested (dispute)
//   disputed and the window is open      → ask the arbiter to settle
//
// Every action is logged with its tx hash in a status file the web timeline (#14) reads.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { Address, type UTxO } from "@evolution-sdk/evolution";
import {
  errorText,
  loadDeployment,
  lockTxOf,
  readClient,
  setRefundRequested,
  viewOf,
  withdrawRefund,
} from "@simpuru/escrow";
import type { PurchaseRecord } from "./buyer";
import { nextAction } from "./protection";
import { type Verdict, verifyDelivery } from "./verify";

export interface WatcherConfig {
  purchases: () => PurchaseRecord[];
  /** What we received for a purchase (by lock tx hash), if we kept it. */
  delivery: (lockTx: string) => string | undefined;
  statusPath: string;
  arbiter?: { url: string; token: string };
}

export interface WatchEvent {
  at: string;
  action: "refund" | "dispute" | "arbitrate" | "closed" | "error";
  why: string;
  tx?: string;
}

interface PurchaseStatus {
  listingId: string;
  /** Current escrow UTxO, or null once the escrow is spent. */
  escrowRef: string | null;
  state: string;
  lastCheck: string;
  closed: boolean;
  events: WatchEvent[];
}

type Status = Record<string, PurchaseStatus>;

const STATE_NAMES = [
  "FundsLocked",
  "ResultSubmitted",
  "RefundRequested",
  "Disputed",
  "WithdrawAuthorized",
  "RefundAuthorized",
];
/** An escrow must be missing this many polls in a row before it counts as closed (Koios can answer empty). */
const MISSES_TO_CLOSE = 3;
/** After acting, give the tx this long to land before deciding again. */
const SETTLE_MS = 120_000;

export function createWatcher(cfg: WatcherConfig) {
  const lineage = new Map<string, string>(); // escrow ref → lock tx
  const misses = new Map<string, number>();
  const pendingUntil = new Map<string, number>();

  const load = (): Status =>
    existsSync(cfg.statusPath) ? JSON.parse(readFileSync(cfg.statusPath, "utf8")) : {};
  const save = (status: Status) => {
    mkdirSync(dirname(cfg.statusPath), { recursive: true });
    writeFileSync(`${cfg.statusPath}.tmp`, JSON.stringify(status, null, 2));
    renameSync(`${cfg.statusPath}.tmp`, cfg.statusPath);
  };

  /** lock tx → its current escrow UTxO, for every escrow at our address. */
  async function escrowsByLock(): Promise<Map<string, UTxO.UTxO>> {
    const utxos = await readClient().getUtxos(Address.fromBech32(loadDeployment().escrowAddress));
    const out = new Map<string, UTxO.UTxO>();
    for (const utxo of utxos) {
      const ref = `${Buffer.from(utxo.transactionId.hash).toString("hex")}#${utxo.index}`;
      let lock = lineage.get(ref);
      if (!lock) {
        lock = await lockTxOf(ref).catch(() => undefined);
        if (!lock) continue;
        lineage.set(ref, lock);
      }
      out.set(lock, utxo);
    }
    return out;
  }

  async function arbitrate(ref: string, record: PurchaseRecord, content: string) {
    if (!cfg.arbiter) throw new Error("no arbiter configured (ARBITER_URL, ARBITER_TOKEN)");
    const res = await fetch(`${cfg.arbiter.url}/disputes/resolve`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${cfg.arbiter.token}` },
      body: JSON.stringify({
        ref,
        listing: { id: record.listingId, contentHash: record.listingContentHash },
        output: content,
      }),
    });
    const body = (await res.json()) as { status?: string; tx?: string; error?: string };
    if (!res.ok) throw new Error(`arbiter ${res.status}: ${body.error ?? "unknown"}`);
    return body;
  }

  async function tick(): Promise<Status> {
    const status = load();
    const escrows = await escrowsByLock();
    const now = Date.now();

    for (const record of cfg.purchases()) {
      if (!record.escrow) continue;
      const lockTx = record.txHash;
      const entry: PurchaseStatus = status[lockTx] ?? {
        listingId: record.listingId,
        escrowRef: null,
        state: "unknown",
        lastCheck: "",
        closed: false,
        events: [],
      };
      status[lockTx] = entry;
      if (entry.closed) continue;
      entry.lastCheck = new Date(now).toISOString();
      const log = (e: Omit<WatchEvent, "at">) =>
        entry.events.push({ at: new Date().toISOString(), ...e });

      const utxo = escrows.get(lockTx);
      if (!utxo) {
        const n = (misses.get(lockTx) ?? 0) + 1;
        misses.set(lockTx, n);
        if (n >= MISSES_TO_CLOSE && entry.escrowRef !== null) {
          entry.closed = true;
          entry.escrowRef = null;
          log({ action: "closed", why: "escrow spent: refunded, withdrawn or settled" });
        }
        continue;
      }
      misses.delete(lockTx);
      const view = viewOf(utxo);
      const ref = `${Buffer.from(utxo.transactionId.hash).toString("hex")}#${utxo.index}`;
      entry.escrowRef = ref;
      entry.state = STATE_NAMES[Number(view.state)] ?? String(view.state);
      if ((pendingUntil.get(lockTx) ?? 0) > now) continue;

      const content = cfg.delivery(lockTx);
      const verdict: Verdict =
        content === undefined
          ? { status: "no_result_yet" } // without what we received we never accuse the seller
          : verifyDelivery(record, content, {
              inputHash: view.inputHash,
              resultHash: view.resultHash,
            });
      const next = nextAction(view, verdict, BigInt(now));
      if (next.kind === "wait") continue;

      try {
        if (next.kind === "refund") {
          log({ action: "refund", why: next.why, tx: await withdrawRefund(ref) });
        } else if (next.kind === "dispute") {
          log({ action: "dispute", why: next.why, tx: await setRefundRequested(ref) });
        } else if (content !== undefined) {
          const res = await arbitrate(ref, record, content);
          if (res.status === "paid") log({ action: "arbitrate", why: next.why, tx: res.tx });
          else log({ action: "arbitrate", why: `arbiter: ${res.status}` });
        }
        pendingUntil.set(lockTx, now + SETTLE_MS);
      } catch (error) {
        log({ action: "error", why: `${next.kind} failed: ${errorText(error).slice(0, 600)}` });
        pendingUntil.set(lockTx, now + SETTLE_MS);
      }
    }
    save(status);
    return status;
  }

  return { tick };
}
