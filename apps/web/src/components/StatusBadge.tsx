import type { PurchaseStatus } from "@simpuru/core";
import { isDispute, statusLabel } from "@/lib/purchases";

const DONE: PurchaseStatus[] = ["withdrawn", "refunded", "settled"];

/** Disputes are the one state a seller must act on, so they are the only coloured badge. */
export default function StatusBadge({ status }: { status: PurchaseStatus }) {
  const tone = isDispute(status)
    ? "bg-red-50 text-red-800 border-red-200"
    : DONE.includes(status)
      ? "bg-gray-100 text-gray-700 border-gray-100"
      : "bg-white text-black border-gray-300";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap ${tone}`}
    >
      {statusLabel(status)}
    </span>
  );
}
