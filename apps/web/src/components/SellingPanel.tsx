"use client";

import type { Listing } from "@simpuru/core";
import { ArrowUpRight, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import CreateListingForm from "@/components/CreateListingForm";
import ListingCard from "@/components/ListingCard";
import SalesList from "@/components/SalesList";
import { useSession } from "@/components/SessionProvider";
import Skeleton, { SkeletonRegion } from "@/components/Skeleton";
import { fetchListingsIncluding } from "@/lib/api";
import { compact } from "@/lib/format";
import { fetchSales, isDispute, type PurchaseView } from "@/lib/purchases";

type SalesState =
  | { phase: "pending" }
  | { phase: "error" }
  | { phase: "ready"; sales: PurchaseView[]; listings: Listing[] };

export const PAYOUT_COPY =
  "Instant sales pay your wallet the full price straight away. Protected sales wait in escrow until the buyer's delivery check passes, then pay your wallet the price minus 10% or 1.5 tADA, whichever is more (that's what the escrow costs to run).";

/** The signed-in creator's selling view (spec #86, J5): list, my listings, sales, reputation. */
export default function SellingPanel() {
  const { session, me, refresh } = useSession();
  const owner = session?.owner ?? "";
  const [sales, setSales] = useState<SalesState>({ phase: "pending" });
  // Bumped after a new listing so listings and sales are read again.
  const [version, setVersion] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `version` is the refresh trigger
  useEffect(() => {
    if (!owner) return;
    let cancelled = false;
    fetchSales(owner)
      .then(
        async (mine) => [await fetchListingsIncluding(mine.map((s) => s.listingId)), mine] as const,
      )
      .then(([listings, mine]) => {
        if (!cancelled) setSales({ phase: "ready", sales: mine, listings });
      })
      .catch(() => {
        if (!cancelled) setSales({ phase: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [owner, version]);

  const disputes = sales.phase === "ready" ? sales.sales.filter((s) => isDispute(s.status)) : [];

  return (
    <div className="space-y-8">
      <dl className="flex flex-wrap items-end gap-x-10 gap-y-4 rounded-2xl border border-gray-200 p-5">
        <div>
          <dt className="text-xs text-gray-500">Listings</dt>
          <dd className="text-xl font-semibold">{me ? me.listings.length : "…"}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Sold</dt>
          <dd className="text-xl font-semibold">{me ? compact(me.sales) : "…"}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Reputation</dt>
          <dd className="text-xl font-semibold">
            {me?.sellerReputation ? (
              <span className="inline-flex items-center gap-1.5">
                <ThumbsUp aria-hidden className="h-4 w-4" />
                {me.sellerReputation.score}%
                <span className="text-sm font-normal text-gray-500">
                  from {me.sellerReputation.basis} settled sales
                </span>
              </span>
            ) : (
              <span className="text-base font-normal text-gray-500">New seller</span>
            )}
          </dd>
        </div>
        <Link
          href={`/creators/${owner}`}
          className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-black hover:underline"
        >
          Your public creator page
          <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
        </Link>
      </dl>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-black">New listing</h2>
          <CreateListingForm
            onCreated={() => {
              setVersion((n) => n + 1);
              refresh();
            }}
          />
        </section>

        <section className="space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-black">Sales</h2>
              {disputes.length > 0 && (
                <span className="rounded-full bg-red-700 px-2.5 py-0.5 text-[11px] font-medium text-white">
                  {disputes.length} in dispute
                </span>
              )}
            </div>
            {sales.phase === "pending" && (
              <SkeletonRegion label="Loading your sales…" className="space-y-3">
                {["a", "b"].map((key) => (
                  <Skeleton key={key} className="h-28 rounded-2xl" />
                ))}
              </SkeletonRegion>
            )}
            {sales.phase === "error" && (
              <p
                role="alert"
                className="rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-600"
              >
                The Simpuru API isn&apos;t reachable right now. Try again in a moment.
              </p>
            )}
            {sales.phase === "ready" && sales.sales.length === 0 && (
              <p className="rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-600">
                No sales yet. Each sale shows here with its escrow timeline and payout.
              </p>
            )}
            {sales.phase === "ready" && sales.sales.length > 0 && (
              <SalesList sales={sales.sales} listings={sales.listings} />
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-black">Your listings</h2>
            {me && me.listings.length === 0 && (
              <p className="rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-600">
                Nothing listed yet.
              </p>
            )}
            {me && me.listings.length > 0 && (
              <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                {me.listings.map((l, i) => (
                  <ListingCard key={l.id} listing={l} index={i} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
