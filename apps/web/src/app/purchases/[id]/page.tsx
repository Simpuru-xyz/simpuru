"use client";

import { explorerTx, type Listing } from "@simpuru/core";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import Countdown from "@/components/Countdown";
import ModeBadge from "@/components/ModeBadge";
import Nav from "@/components/Nav";
import Skeleton, { SkeletonRegion } from "@/components/Skeleton";
import StatusBadge from "@/components/StatusBadge";
import Timeline from "@/components/Timeline";
import VerificationCard from "@/components/VerificationCard";
import { fetchListings, formatAda, shorten } from "@/lib/api";
import { fetchPurchase, type PurchaseView } from "@/lib/purchases";

type LoadState =
  | { phase: "pending" }
  | { phase: "missing" }
  | { phase: "error" }
  | { phase: "ready"; purchase: PurchaseView; listing?: Listing };

export default function PurchasePage({ params }: PageProps<"/purchases/[id]">) {
  const { id } = use(params);
  const [load, setLoad] = useState<LoadState>({ phase: "pending" });

  const [loadedId, setLoadedId] = useState(id);
  if (loadedId !== id) {
    setLoadedId(id);
    setLoad({ phase: "pending" });
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchListings(), fetchPurchase(id)])
      .then(([listings, purchase]) => {
        if (cancelled) return;
        if (!purchase) return setLoad({ phase: "missing" });
        setLoad({
          phase: "ready",
          purchase,
          listing: listings.find((l) => l.id === purchase.listingId),
        });
      })
      .catch(() => {
        if (!cancelled) setLoad({ phase: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <main className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
        <Link
          href="/listings"
          className="mt-6 inline-block text-sm text-gray-500 transition-colors hover:text-black"
        >
          ← Back to the catalogue
        </Link>

        {load.phase === "pending" && (
          <SkeletonRegion label="Loading the purchase…" className="mt-8 space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </SkeletonRegion>
        )}

        {load.phase === "missing" && (
          <p
            role="alert"
            className="mt-8 rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-600"
          >
            No purchase with the id <code className="font-mono break-all">{id}</code>.
          </p>
        )}

        {load.phase === "error" && (
          <p
            role="alert"
            className="mt-8 rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-600"
          >
            The Simpuru API isn&apos;t reachable right now. Try again in a moment.
          </p>
        )}

        {load.phase === "ready" && (
          <article className="mt-8 space-y-6">
            <header className="space-y-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <ModeBadge mode={load.purchase.mode} />
                <StatusBadge status={load.purchase.status} />
              </div>
              <h1 className="text-3xl font-normal tracking-tight break-words sm:text-4xl">
                {load.listing ? (
                  <Link href={`/listings/${load.listing.id}`} className="hover:text-gray-600">
                    {load.listing.title}
                  </Link>
                ) : (
                  load.purchase.listingId
                )}
              </h1>
              <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                {load.listing && (
                  <div className="flex gap-1.5">
                    <dt>Paid</dt>
                    <dd className="font-semibold text-black">
                      {formatAda(load.listing.priceLovelace)} ADA
                    </dd>
                  </div>
                )}
                <div className="flex min-w-0 gap-1.5">
                  <dt>Buyer</dt>
                  <dd className="truncate font-mono text-black">
                    {shorten(load.purchase.buyerAddress)}
                  </dd>
                </div>
                <div className="flex gap-1.5">
                  <dt>{load.purchase.mode === "protected" ? "Lock tx" : "Payment tx"}</dt>
                  <dd>
                    <a
                      href={explorerTx(load.purchase.txHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-0.5 font-mono text-black hover:underline"
                    >
                      {shorten(load.purchase.txHash, 8, 6)}
                      <ArrowUpRight aria-hidden className="h-3 w-3" />
                    </a>
                  </dd>
                </div>
              </dl>
            </header>

            <Countdown purchase={load.purchase} />
            <VerificationCard purchase={load.purchase} />

            <section className="space-y-4 rounded-2xl border border-gray-200 p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-black">Timeline</h2>
              <Timeline purchase={load.purchase} />
            </section>
          </article>
        )}
      </main>
    </div>
  );
}
