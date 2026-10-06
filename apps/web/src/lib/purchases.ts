import type { Listing, Purchase, PurchaseStatus } from "@simpuru/core";

/** Watcher verdict on a delivery (#9, #10). */
export type Verification = "ok" | "mismatch" | "no_result_yet";

/** What the web reads per purchase: the core `Purchase` plus the watcher's verdict. */
export type PurchaseView = Purchase & { verification?: Verification };

/**
 * vested_pay: a refund request with no result yet is `RefundRequested` (buyer just waits out
 * submit_result_time); with a result it becomes `Disputed`, the only state the arbiter settles.
 */
export const isDispute = (status: PurchaseStatus) => status === "Disputed";

export const STATUS_LABEL: Record<PurchaseStatus, string> = {
  FundsLocked: "Locked in escrow",
  ResultSubmitted: "Result submitted",
  RefundRequested: "Refund requested",
  Disputed: "Disputed by buyer",
  WithdrawAuthorized: "Withdraw authorized",
  RefundAuthorized: "Refund authorized",
  withdrawn: "Seller paid",
  refunded: "Buyer refunded",
  settled: "Paid",
};

// ponytail: sample data until the API serves purchases (shape proposed on #14).
// Swap the bodies of fetchPurchase / fetchSales for real calls; nothing else changes.

const MIN = 60_000;
const hex = (seed: number) => {
  let out = "";
  let x = Math.imul(seed, 2654435761) >>> 0;
  while (out.length < 64) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0;
    out += x.toString(16).padStart(8, "0");
  }
  return out.slice(0, 64);
};
const BUYER = "addr_test1vz0q6a8kgfh7ux4v0w0v2c7cc6x6m5qk8l6xzr0yq9w8hlqf3e2rm";

/** Deadlines as the API quotes them (paywall.ts): pay-by +5 min, then +11/+26/+41 after it. */
const deadlinesFrom = (quotedAt: number) => {
  const payBy = quotedAt + 5 * MIN;
  return {
    payBy: String(payBy),
    submitResult: String(payBy + 11 * MIN),
    unlock: String(payBy + 26 * MIN),
    externalDisputeUnlock: String(payBy + 41 * MIN),
  };
};

type Step = { status: PurchaseStatus; afterMin: number };

function sample(
  n: number,
  listingId: string,
  mode: Purchase["mode"],
  quotedMinAgo: number,
  steps: Step[],
  verification?: Verification,
): PurchaseView {
  const quotedAt = Date.now() - quotedMinAgo * MIN;
  const events = steps.map((s, i) => ({
    status: s.status,
    txHash: hex(n * 10 + i),
    at: String(quotedAt + s.afterMin * MIN),
  }));
  const first = events[0];
  const last = events[events.length - 1];
  if (!first || !last) throw new Error("sample needs at least one event");
  return {
    id: first.txHash,
    listingId,
    mode,
    buyerAddress: BUYER,
    txHash: first.txHash,
    status: last.status,
    escrow:
      mode === "protected"
        ? {
            address: "addr_test1wzy842psthjj2llfv06tc38dtuqey8ve55n6gm6acprk9ksc7d963",
            // Own seed range per field, so no sample hash shows up twice.
            inputHash: hex(1000 + n * 10 + 1),
            resultHash: steps.some((s) => s.status === "ResultSubmitted")
              ? hex(1000 + n * 10 + 2)
              : undefined,
            identifierFromPurchaser: hex(1000 + n * 10 + 3).slice(0, 26),
            deadlines: deadlinesFrom(quotedAt),
          }
        : undefined,
    events,
    verification,
  };
}

/** Samples hang off the API's seed listings only, so a listing made today shows no fake sales. */
const SEED_IDS = new Set(["orders-dataset-100", "landing-copy-pack", "cardano-address-regex"]);

function samples(all: Listing[]): PurchaseView[] {
  const listings = all.filter((l) => SEED_IDS.has(l.id));
  const prot = listings.filter((l) => l.modes.includes("protected"));
  const inst = listings.filter((l) => l.modes.includes("instant"));
  const p = (i: number) => prot[i % Math.max(prot.length, 1)]?.id;
  const q = (i: number) => inst[i % Math.max(inst.length, 1)]?.id;
  const out: (PurchaseView | null)[] = [
    // Waiting for the seller to deliver.
    p(0)
      ? sample(1, p(0) as string, "protected", 3, [{ status: "FundsLocked", afterMin: 1 }])
      : null,
    // Delivered and checked, waiting for unlock.
    p(1)
      ? sample(
          2,
          p(1) as string,
          "protected",
          12,
          [
            { status: "FundsLocked", afterMin: 1 },
            { status: "ResultSubmitted", afterMin: 4 },
          ],
          "ok",
        )
      : null,
    // Bad delivery, the watcher disputed it.
    p(2)
      ? sample(
          3,
          p(2) as string,
          "protected",
          20,
          [
            { status: "FundsLocked", afterMin: 1 },
            { status: "ResultSubmitted", afterMin: 5 },
            { status: "Disputed", afterMin: 6 },
          ],
          "mismatch",
        )
      : null,
    // Happy path, seller collected.
    p(3)
      ? sample(
          4,
          p(3) as string,
          "protected",
          45,
          [
            { status: "FundsLocked", afterMin: 1 },
            { status: "ResultSubmitted", afterMin: 3 },
            { status: "withdrawn", afterMin: 32 },
          ],
          "ok",
        )
      : null,
    // No delivery, auto refund.
    p(4)
      ? sample(
          5,
          p(4) as string,
          "protected",
          30,
          [
            { status: "FundsLocked", afterMin: 1 },
            { status: "refunded", afterMin: 17 },
          ],
          "no_result_yet",
        )
      : null,
    // Instant purchase.
    q(0) ? sample(6, q(0) as string, "instant", 8, [{ status: "settled", afterMin: 1 }]) : null,
  ];
  return out.filter((x): x is PurchaseView => x !== null);
}

/** Sales for listings this address sells. */
export async function fetchSales(seller: string, listings: Listing[]): Promise<PurchaseView[]> {
  const mine = new Set(listings.filter((l) => l.sellerAddress === seller).map((l) => l.id));
  return samples(listings).filter((p) => mine.has(p.listingId));
}

/** One purchase by id (its payment or lock tx hash). */
export async function fetchPurchase(id: string, listings: Listing[]): Promise<PurchaseView | null> {
  return samples(listings).find((p) => p.id === id) ?? null;
}
