"use client";

import { Clock } from "lucide-react";
import type { PurchaseView } from "@/lib/purchases";
import { formatLeft, useNow } from "@/lib/useNow";

type Gate = { at: string; before: string; after: string };

/** The deadline that decides what happens next, per escrow state. */
function gateFor(p: PurchaseView): Gate | null {
  const d = p.escrow?.deadlines;
  if (!d) return null;
  switch (p.status) {
    case "FundsLocked":
      return {
        at: d.submitResult,
        before: "Seller must deliver within",
        after: "No result in time. The buyer can take a full refund.",
      };
    case "ResultSubmitted":
      return {
        at: d.unlock,
        before: "Seller can collect in",
        after: "Unlocked. The seller can collect.",
      };
    case "RefundRequested":
      return {
        at: d.submitResult,
        before: "Buyer can take the refund in",
        after: "No result in time. The buyer can take a full refund.",
      };
    case "Disputed":
      return {
        at: d.externalDisputeUnlock,
        before: "Arbiter can rule in",
        after: "Dispute window over. The arbiter can pay out.",
      };
    default:
      return null;
  }
}

export default function Countdown({ purchase }: { purchase: PurchaseView }) {
  const now = useNow();
  const gate = gateFor(purchase);
  // The API sends "" when a quote carried no deadline; nothing to count down to then.
  if (!gate?.at) return null;
  const left = Number(gate.at) - now;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white">
        <Clock aria-hidden className="h-5 w-5" />
      </span>
      {left > 0 ? (
        <div className="min-w-0">
          <p className="text-xs text-gray-500">{gate.before}</p>
          <p
            className="font-mono text-2xl font-semibold tracking-tight text-black tabular-nums"
            aria-live="off"
          >
            {formatLeft(left)}
          </p>
        </div>
      ) : (
        <p className="text-sm font-medium text-black">{gate.after}</p>
      )}
    </div>
  );
}
