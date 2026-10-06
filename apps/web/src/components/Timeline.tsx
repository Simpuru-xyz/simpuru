import { explorerTx, type PurchaseStatus } from "@simpuru/core";
import { ArrowUpRight } from "lucide-react";
import { shorten } from "@/lib/api";
import { isDispute, type PurchaseView, STATUS_LABEL } from "@/lib/purchases";

/** `by` is a deadline the step must beat; `from` is the earliest it can happen. */
type Upcoming = { label: string; note?: string; at?: string; when?: "by" | "from" };

/** What can still happen from here, so the timeline shows the road, not only the past. */
function upcoming(p: PurchaseView): Upcoming[] {
  const d = p.escrow?.deadlines;
  switch (p.status) {
    case "FundsLocked":
      return [
        {
          label: "Result submitted",
          note: "No result by the deadline and the buyer is refunded in full.",
          at: d?.submitResult,
          when: "by",
        },
        { label: "Seller paid", at: d?.unlock, when: "from" },
      ];
    case "ResultSubmitted":
      return [
        {
          label: "Seller paid",
          note: "Until then the buyer can dispute a delivery that does not match.",
          at: d?.unlock,
          when: "from",
        },
      ];
    case "RefundRequested":
      return [
        {
          label: "Buyer refunded",
          note: "A result submitted before then turns this into a dispute.",
          at: d?.submitResult,
          when: "from",
        },
      ];
    case "Disputed":
      return [
        {
          label: "Resolved by the arbiter",
          note: "Seller paid or buyer refunded, decided from the committed hashes.",
          at: d?.externalDisputeUnlock,
          when: "from",
        },
      ];
    case "RefundAuthorized":
      return [
        { label: "Buyer refunded", note: "The seller conceded. The buyer can withdraw now." },
      ];
    case "WithdrawAuthorized":
      return [{ label: "Seller paid" }];
    default:
      return [];
  }
}

/** Ending a dispute reads as a resolution, not as an ordinary payout. */
function labelFor(status: PurchaseStatus, disputed: boolean) {
  if (disputed && status === "withdrawn") return "Resolved: seller paid";
  if (disputed && status === "refunded") return "Resolved: buyer refunded";
  return STATUS_LABEL[status];
}

const time = (ms: string) =>
  new Date(Number(ms)).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "medium" });

export default function Timeline({ purchase }: { purchase: PurchaseView }) {
  const disputed = purchase.events.some((e) => isDispute(e.status));
  const next = upcoming(purchase);

  return (
    <ol className="relative space-y-0">
      {purchase.events.map((event, i) => {
        const last = i === purchase.events.length - 1 && next.length === 0;
        const bad = isDispute(event.status);
        return (
          <li
            key={event.txHash}
            className="animate-fade-in-up relative flex gap-4 pb-6"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {!last && (
              <span aria-hidden className="absolute top-4 bottom-0 left-[7px] w-px bg-black" />
            )}
            <span
              aria-hidden
              className={`relative mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-2 ${
                bad ? "border-red-700 bg-red-700" : "border-black bg-black"
              }`}
            />
            <div className="min-w-0 flex-1 space-y-1">
              <p className={`text-sm font-semibold ${bad ? "text-red-800" : "text-black"}`}>
                {labelFor(event.status, disputed)}
              </p>
              <p className="text-xs text-gray-500">{time(event.at)}</p>
              <a
                href={explorerTx(event.txHash)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono text-xs text-black underline-offset-4 hover:underline"
              >
                {shorten(event.txHash, 10, 8)}
                <ArrowUpRight aria-hidden className="h-3 w-3" />
                <span className="sr-only">View transaction on Cardanoscan</span>
              </a>
            </div>
          </li>
        );
      })}

      {next.map((step, i) => (
        <li key={step.label} className="relative flex gap-4 pb-6 last:pb-0">
          {i < next.length - 1 && (
            <span
              aria-hidden
              className="absolute top-4 bottom-0 left-[7px] w-px border-l border-dashed border-gray-300"
            />
          )}
          <span
            aria-hidden
            className="relative mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-2 border-dashed border-gray-400 bg-white"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium text-gray-500">{step.label}</p>
            {step.at && (
              <p className="text-xs text-gray-400">
                {step.when ?? "from"} {time(step.at)}
              </p>
            )}
            {step.note && <p className="text-xs text-gray-500">{step.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
