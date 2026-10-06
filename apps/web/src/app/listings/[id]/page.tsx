"use client";

import type { DeliveryMode, Listing } from "@simpuru/core";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import CopyButton from "@/components/CopyButton";
import ModeBadge from "@/components/ModeBadge";
import Nav from "@/components/Nav";
import Skeleton, { SkeletonRegion } from "@/components/Skeleton";
import { ApiError, ENDPOINTS, fetchListing, formatAda } from "@/lib/api";

type LoadState =
  | { phase: "pending" }
  | { phase: "missing" }
  | { phase: "error" }
  | { phase: "ready"; listing: Listing };

// Timings from apps/api (paywall.ts): pay-by 5 min, then the escrow deadlines after it.
const HOW: Record<DeliveryMode, { title: string; points: string[] }> = {
  instant: {
    title: "Pay the seller directly",
    points: [
      "x402 `default`: the payment goes straight to the seller.",
      "Content arrives once the payment is in a block, about 30 seconds.",
      "No escrow, so no refund path.",
    ],
  },
  protected: {
    title: "Pay into escrow",
    points: [
      "x402 `masumi`: the payment is locked in our escrow on preprod.",
      "No delivery in time: the buyer gets a full refund, about 16 minutes after the quote.",
      "Delivery that does not match the hash: the buyer disputes and the arbiter decides.",
      "Otherwise the seller collects, about 31 minutes after the quote.",
    ],
  },
};

/** Renders `code` spans in the copy above without pulling in a markdown parser. */
const withCode = (text: string) =>
  text.split("`").map((part, i) =>
    i % 2 ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: static split of a constant string
      <code key={i} className="rounded bg-gray-100 px-1 font-mono text-[12px] text-black">
        {part}
      </code>
    ) : (
      part
    ),
  );

function Field({ label, value, copy }: { label: string; value: string; copy?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-2xl border border-gray-200 p-4">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center justify-between gap-3">
        {/* min-w-0 lets a long address truncate instead of widening the page. */}
        <code className="min-w-0 truncate font-mono text-sm text-black" title={value}>
          {value}
        </code>
        {copy && (
          <span className="shrink-0">
            <CopyButton text={value} label={label} />
          </span>
        )}
      </div>
    </div>
  );
}

export default function ListingPage({ params }: PageProps<"/listings/[id]">) {
  const { id } = use(params);
  const [load, setLoad] = useState<LoadState>({ phase: "pending" });

  // Reset during render, not in the effect, so moving between listings shows pending again.
  const [loadedId, setLoadedId] = useState(id);
  if (loadedId !== id) {
    setLoadedId(id);
    setLoad({ phase: "pending" });
  }

  useEffect(() => {
    let cancelled = false;
    fetchListing(id)
      .then((listing) => {
        if (!cancelled) setLoad({ phase: "ready", listing });
      })
      .catch((err) => {
        if (cancelled) return;
        setLoad({ phase: err instanceof ApiError && err.status === 404 ? "missing" : "error" });
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
          <SkeletonRegion label="Loading the listing…" className="mt-8 space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </SkeletonRegion>
        )}

        {load.phase === "missing" && (
          <p
            role="alert"
            className="mt-8 rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-600"
          >
            No listing with the id <code className="font-mono break-all">{id}</code> is in the
            catalogue.
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
          <article className="animate-fade-in-up mt-8 space-y-6">
            <header className="space-y-3">
              <ul className="flex flex-wrap gap-1.5">
                {load.listing.modes.map((mode) => (
                  <li key={mode}>
                    <ModeBadge mode={mode} />
                  </li>
                ))}
              </ul>
              <h1 className="text-3xl font-normal tracking-tight break-words sm:text-4xl">
                {load.listing.title}
              </h1>
              <p className="text-base leading-relaxed text-gray-600">{load.listing.description}</p>
            </header>

            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight text-black">
                {formatAda(load.listing.priceLovelace)} ADA
              </span>
              <span className="text-sm text-gray-500">
                {BigInt(load.listing.priceLovelace).toLocaleString("en-US")} lovelace
              </span>
            </div>

            <div className="grid gap-3">
              <Field label="Seller" value={load.listing.sellerAddress} copy />
              <Field label="Content hash (SHA-256)" value={load.listing.contentHash} copy />
            </div>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-black">How to buy</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {load.listing.modes.map((mode) => (
                  <div key={mode} className="space-y-3 rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-black">{HOW[mode].title}</span>
                      <ModeBadge mode={mode} />
                    </div>
                    <ul className="space-y-1.5 text-sm leading-relaxed text-gray-600">
                      {HOW[mode].points.map((point) => (
                        <li key={point}>{withCode(point)}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <Field label="Paid endpoint for agents (x402)" value={ENDPOINTS.unlock(id)} copy />
            </section>
          </article>
        )}
      </main>
    </div>
  );
}
