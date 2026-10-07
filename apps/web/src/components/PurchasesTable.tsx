"use client";

import type { Listing } from "@simpuru/core";
import Link from "next/link";
import { useEffect, useState } from "react";
import ContentModal from "@/components/ContentModal";
import ModeBadge from "@/components/ModeBadge";
import { useSession } from "@/components/SessionProvider";
import StatusBadge from "@/components/StatusBadge";
import { fetchListings, formatAda } from "@/lib/api";
import type { PurchaseView } from "@/lib/purchases";

const time = (ms: string) =>
  new Date(Number(ms)).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
/** "14:03" today, "8 Oct 14:03" on another day. */
const clock = (ms: string) => {
  const d = new Date(Number(ms));
  const t = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return d.toDateString() === new Date().toDateString()
    ? t
    : `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} ${t}`;
};

/** The deadline a protected purchase is waiting on, in words (spec #86, J4); "now" once it passed. */
export function nextDeadline(p: PurchaseView, now = Date.now()) {
  const d = p.escrow?.deadlines;
  if (!d) return null;
  const past = (ms: string) => Number(ms) <= now;
  switch (p.status) {
    case "FundsLocked":
      if (!d.submitResult) return null;
      return past(d.submitResult)
        ? "no delivery in time: refund due"
        : `refund if no delivery by ${clock(d.submitResult)}`;
    case "ResultSubmitted":
      if (!d.unlock) return null;
      return past(d.unlock) ? "seller can collect now" : `seller paid from ${clock(d.unlock)}`;
    case "RefundRequested":
      if (!d.submitResult) return null;
      return past(d.submitResult) ? "refund due" : `refund from ${clock(d.submitResult)}`;
    case "Disputed":
      if (!d.externalDisputeUnlock) return null;
      return past(d.externalDisputeUnlock)
        ? "arbiter can rule now"
        : `arbiter rules from ${clock(d.externalDisputeUnlock)}`;
    default:
      return null;
  }
}

/** My purchases (spec #86, J4). */
export default function PurchasesTable() {
  const { me } = useSession();
  const [listings, setListings] = useState<Map<string, Listing>>(new Map());
  const [open, setOpen] = useState<PurchaseView | null>(null);

  useEffect(() => {
    fetchListings()
      .then((ls) => setListings(new Map(ls.map((l) => [l.id, l]))))
      .catch(() => {});
  }, []);

  if (!me) return <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />;
  if (me.purchases.length === 0)
    return (
      <p className="rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-600">
        No purchases yet.{" "}
        <Link href="/listings" className="font-medium text-black underline underline-offset-4">
          Browse the catalogue
        </Link>
        .
      </p>
    );

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-gray-200">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-gray-200 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Listing</th>
              <th className="px-4 py-3 font-medium">Mode</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {me.purchases.map((p) => {
              const l = listings.get(p.listingId);
              const next = nextDeadline(p);
              const first = p.events[0]?.at;
              return (
                <tr key={p.id} className="border-b border-gray-100 last:border-0">
                  <td className="max-w-[220px] px-4 py-3">
                    <Link
                      href={`/listings/${p.listingId}`}
                      className="block truncate font-medium hover:underline"
                    >
                      {l?.title ?? p.listingId}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <ModeBadge mode={p.mode} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {l ? `${formatAda(l.priceLovelace)} tADA` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                    {next && <span className="mt-1 block text-xs text-gray-500">{next}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-gray-500">
                    {first ? time(first) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {p.status !== "refunded" && (
                      <button
                        type="button"
                        onClick={() => setOpen(p)}
                        className="mr-3 font-medium hover:underline"
                      >
                        Open
                      </button>
                    )}
                    <Link href={`/purchases/${p.id}`} className="font-medium hover:underline">
                      Timeline
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ContentModal
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open ? (listings.get(open.listingId)?.title ?? "Your prompt") : ""}
        purchaseId={open?.id}
      />
    </>
  );
}
