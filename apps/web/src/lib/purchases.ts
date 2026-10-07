import type { Purchase, PurchaseStatus } from "@simpuru/core";
import { API_BASE, ApiError } from "@/lib/api";

/** Watcher verdict on a delivery (#9, #10). */
export type Verification = "ok" | "mismatch" | "no_result_yet";

/** What the web reads per purchase: the core `Purchase` plus the watcher's verdict (agreed on #14). */
export type PurchaseView = Purchase & { verification?: Verification };

/**
 * vested_pay: a refund request with no result yet is `RefundRequested` (buyer just waits out
 * submit_result_time); with a result it becomes `Disputed`, the only state the arbiter settles.
 */
export const isDispute = (status: PurchaseStatus) => status === "Disputed";

const STATUS_LABEL: Record<string, string> = {
  FundsLocked: "Locked in escrow",
  ResultSubmitted: "Result submitted",
  RefundRequested: "Refund requested",
  Disputed: "Disputed by buyer",
  WithdrawAuthorized: "Withdraw authorized",
  RefundAuthorized: "Refund authorized",
  withdrawn: "Seller paid",
  refunded: "Buyer refunded",
  settled: "Paid",
  // The seller agent's in-flight state while its withdraw tx confirms.
  withdrawing: "Seller collecting",
  // After a protected sale the platform forwards the creator's share (apps/api seller.ts).
  creator_paid: "Creator paid",
};

/** The API may add states the core type doesn't list yet; show those as they come. */
export const statusLabel = (status: string) => STATUS_LABEL[status] ?? status;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new ApiError(res.status, `${res.status} for ${url}`);
  return (await res.json()) as T;
}

/** Sales of listings this address sells, newest first. */
export const fetchSales = (seller: string) =>
  getJson<PurchaseView[]>(`${API_BASE}/purchases?seller=${encodeURIComponent(seller)}`);

/** One purchase by id (its payment or lock tx hash); null when the API doesn't know it. */
export async function fetchPurchase(id: string): Promise<PurchaseView | null> {
  try {
    return await getJson<PurchaseView>(`${API_BASE}/purchases/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
