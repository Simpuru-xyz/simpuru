// Seller agent for protected purchases: after delivery it posts the result hash, after the
// unlock time it collects. It never concedes on its own (a dispute goes to the arbiter).
// Each pass also turns what it sees on chain into purchase events for the web timeline.

import { Address, Assets } from "@evolution-sdk/evolution";
import { ESCROW_STATES } from "@simpuru/core";
import { ESCROW } from "@simpuru/core/escrow";
import { purchaseResultHash } from "@simpuru/core/hash";
import {
  type Actor,
  readClient,
  roomyUtxos,
  submitResult,
  viewOf,
  walletClient,
  withdraw,
} from "@simpuru/escrow";
import { type Db, getListing } from "./db";
import {
  addEvent,
  type OpenPurchase,
  openProtectedPurchases,
  pendingCreatorPayouts,
  setPayout,
  updatePurchase,
} from "./purchases";
import { DEMO_FAULTS, deliveredContent } from "./seed";

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
  /** The lock is gone and we did not collect it: refunded, or paid out by the arbiter. */
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

type Blockfrost = (path: string) => Promise<unknown>;

type TxOutput = { address: string; amount: { unit: string; quantity: string }[] };

/**
 * Who got the escrow's money in the tx that closed it. Only buyer and seller outputs count: the
 * tx submitter's change (an arbiter paying the fee, say) is neither party's win.
 */
export function classifyClosing(outputs: TxOutput[], buyer: string, seller: string) {
  const lovelaceTo = (address: string) =>
    outputs
      .filter((o) => o.address === address)
      .reduce(
        (n, o) => n + BigInt(o.amount.find((a) => a.unit === "lovelace")?.quantity ?? "0"),
        0n,
      );
  return lovelaceTo(buyer) > lovelaceTo(seller) ? "refunded" : "withdrawn";
}

/** The tx that spent `ref`, and whether it refunded the buyer or paid the seller. */
async function closingOf(bf: Blockfrost, ref: string, buyer: string, seller: string) {
  const [txHash, index] = ref.split("#");
  const spent = (await bf(`/txs/${txHash}/utxos`)) as {
    outputs: { output_index: number; consumed_by_tx?: string | null }[];
  };
  const closingTx = spent.outputs.find((o) => String(o.output_index) === index)?.consumed_by_tx;
  if (!closingTx) return null;
  const closing = (await bf(`/txs/${closingTx}/utxos`)) as { outputs: TxOutput[] };
  return { closingTx, status: classifyClosing(closing.outputs, buyer, seller) };
}

/** One pass over open protected purchases. Errors are logged and retried on the next pass. */
/** Seller address → the key that signs for it. Listings by any other address are only watched. */
export type SellerKeys = Map<string, Actor>;

/** Platform keys by address, and the main seller that stands in for creators. */
export interface Sellers {
  keys: SellerKeys;
  main: string;
}

/** Who sits in the escrow as seller: the listing's own platform wallet, else the main seller. */
export const escrowSeller = (s: Sellers, listingSeller: string) =>
  s.keys.has(listingSeller) ? listingSeller : s.main;

// What a creator receives for a protected sale: the price minus the escrow's cost (two escrow txs
// and the payout, ~1.5 tADA) or 10%, whichever is larger. Instant sales pay the creator in full.
const CREATOR_FEE_FLOOR = 1_500_000n;
export const creatorPayout = (priceLovelace: bigint) => {
  const tenth = priceLovelace / 10n;
  return priceLovelace - (tenth > CREATOR_FEE_FLOOR ? tenth : CREATOR_FEE_FLOOR);
};

/** Pays creators whose protected sales the platform has collected. */
async function payCreators(db: Db, s: Sellers) {
  const main = s.keys.get(s.main);
  if (!main) return;
  for (const p of pendingCreatorPayouts(db, [...s.keys.keys()])) {
    try {
      const amount = creatorPayout(BigInt(p.price_lovelace));
      const wallet = walletClient(main);
      const tx = await wallet
        .newTx()
        .payToAddress({
          address: Address.fromBech32(p.seller_address),
          assets: Assets.fromLovelace(amount),
        })
        .build({ changeAddress: await wallet.address(), availableUtxos: await roomyUtxos(wallet) });
      const hash = Buffer.from((await (await tx.sign()).submit()).hash).toString("hex");
      setPayout(db, p.tx_hash, hash);
      addEvent(db, p.tx_hash, "creator_paid", hash);
      console.log(`[seller] ${p.tx_hash.slice(0, 8)} creator paid ${amount} lovelace ${hash}`);
    } catch (error) {
      console.warn(
        `[seller] ${p.tx_hash.slice(0, 8)} creator payout failed: ${String(error).slice(0, 200)}`,
      );
    }
  }
}

export async function sellerTick(db: Db, bf: Blockfrost, sellers: Sellers, now = Date.now()) {
  await payCreators(db, sellers);
  const keys = sellers.keys;
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
      // not a vested_pay datum
    }
  }

  for (const p of open) {
    const lock = locks.get(sellerNonceOf(p) ?? "") ?? null;
    const action = nextSellerAction(lock?.view ?? null, p, now);
    try {
      if (lock) {
        // Every new UTxO of this lock is one step in its life.
        const stateName = ESCROW_STATES[Number(lock.view.state)] ?? "unknown";
        addEvent(db, p.tx_hash, stateName, lock.ref.split("#")[0] ?? "");
        if (lock.ref !== p.last_ref) updatePurchase(db, p.tx_hash, { lastRef: lock.ref });
      }
      if (action.kind === "submit" && lock) {
        const listing = getListing(db, p.listing_id);
        const key = listing && keys.get(escrowSeller(sellers, listing.sellerAddress));
        // A seller who never delivers never posts a result (demo fault).
        if (!listing || !key || DEMO_FAULTS[listing.id] === "no_delivery") continue;
        const resultHash = purchaseResultHash(p.tx_hash, deliveredContent(listing));
        const resultTx = await submitResult(lock.ref, resultHash, key);
        updatePurchase(db, p.tx_hash, { resultTx, resultHash });
        console.log(`[seller] ${p.tx_hash.slice(0, 8)} result submitted ${resultTx}`);
      } else if (action.kind === "withdraw" && lock) {
        const key = keys.get(
          escrowSeller(sellers, getListing(db, p.listing_id)?.sellerAddress ?? ""),
        );
        if (!key) continue;
        updatePurchase(db, p.tx_hash, { status: "withdrawing" });
        const closingTx = await withdraw(lock.ref, key);
        updatePurchase(db, p.tx_hash, { status: "withdrawn", closingTx });
        addEvent(db, p.tx_hash, "withdrawn", closingTx);
        console.log(`[seller] ${p.tx_hash.slice(0, 8)} withdrawn ${closingTx}`);
      } else if (action.kind === "closed" && p.last_ref) {
        // The escrow pays its seller of record (a platform wallet for creators), not the creator.
        const seller = escrowSeller(sellers, getListing(db, p.listing_id)?.sellerAddress ?? "");
        const closed = await closingOf(bf, p.last_ref, p.payer, seller);
        if (closed) {
          updatePurchase(db, p.tx_hash, { status: closed.status, closingTx: closed.closingTx });
          addEvent(db, p.tx_hash, closed.status, closed.closingTx);
          console.log(`[seller] ${p.tx_hash.slice(0, 8)} ${closed.status} by ${closed.closingTx}`);
        }
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

export const blockfrost =
  (projectId: string): Blockfrost =>
  async (path) => {
    const res = await fetch(`https://cardano-preprod.blockfrost.io/api/v0${path}`, {
      headers: { project_id: projectId },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`blockfrost ${path}: HTTP ${res.status}`);
    return res.json();
  };

/** Runs `sellerTick` every `intervalMs`, one pass at a time. */
export function startSellerAgent(
  db: Db,
  blockfrostProjectId: string,
  sellers: Sellers,
  intervalMs = 30_000,
) {
  const bf = blockfrost(blockfrostProjectId);
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await sellerTick(db, bf, sellers);
    } catch (error) {
      console.warn(`[seller] tick failed: ${String(error).slice(0, 200)}`);
    } finally {
      running = false;
    }
  };
  void tick();
  return setInterval(tick, intervalMs);
}
