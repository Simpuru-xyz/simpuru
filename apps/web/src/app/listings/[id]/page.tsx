"use client";

import type { DeliveryMode } from "@simpuru/core";
import { use, useEffect, useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import CopyButton from "@/components/CopyButton";
import ListingPreview from "@/components/ListingPreview";
import ModeBadge from "@/components/ModeBadge";
import Nav from "@/components/Nav";
import Skeleton, { SkeletonRegion } from "@/components/Skeleton";
import { ENDPOINTS, formatAda, type ListingView } from "@/lib/api";
import { compact, fetchCatalogueItem } from "@/lib/mock-prompts";

type LoadState =
  | { phase: "pending" }
  | { phase: "missing" }
  | { phase: "error" }
  | { phase: "ready"; listing: ListingView };

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
    fetchCatalogueItem(id)
      .then((listing) => {
        if (!cancelled) setLoad(listing ? { phase: "ready", listing } : { phase: "missing" });
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

      <main className="px-4 pt-6 pb-24 sm:px-6 lg:px-10 lg:pt-8">
        {load.phase === "pending" && (
          <SkeletonRegion
            label="Loading the listing…"
            className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-12"
          >
            <Skeleton className="aspect-[4/3] rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
            </div>
          </SkeletonRegion>
        )}

        {(load.phase === "missing" || load.phase === "error") && (
          <div className="mx-auto max-w-xl space-y-4">
            <Breadcrumbs items={[{ label: "Catalogue", href: "/listings" }]} />
            <p
              role="alert"
              className="rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-600"
            >
              {load.phase === "missing" ? (
                <>
                  No listing with the id <code className="font-mono break-all">{id}</code> is in the
                  catalogue.
                </>
              ) : (
                <>The Simpuru API isn&apos;t reachable right now. Try again in a moment.</>
              )}
            </p>
          </div>
        )}

        {load.phase === "ready" && (
          // Product layout: the preview is what's being judged, so it gets the wide column and
          // stays in view while the details scroll beside it.
          <article className="animate-fade-in-up mx-auto grid max-w-[1400px] grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start lg:gap-12">
            <div className="lg:sticky lg:top-[89px]">
              <ListingPreview
                src={load.listing.previewMedia}
                title={load.listing.title}
                className="aspect-[4/3] w-full rounded-2xl"
                fallback={
                  <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-400">
                    No preview yet
                  </div>
                }
              />
            </div>

            <div className="space-y-6">
              <header className="space-y-3">
                <Breadcrumbs
                  items={[
                    { label: "Catalogue", href: "/listings" },
                    ...(load.listing.category ? [{ label: load.listing.category }] : []),
                  ]}
                />
                <h1 className="text-3xl font-semibold tracking-tight break-words sm:text-4xl">
                  {load.listing.title}
                </h1>
                <p className="text-base leading-relaxed text-gray-600">
                  {load.listing.description}
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {load.listing.modes.map((mode) => (
                    <li key={mode}>
                      <ModeBadge mode={mode} />
                    </li>
                  ))}
                </ul>
              </header>

              <div className="space-y-1 border-y border-gray-100 py-5">
                <span className="text-3xl font-semibold tracking-tight text-black">
                  {formatAda(load.listing.priceLovelace)} ADA
                </span>
                <p className="text-sm text-gray-500">Pay once over x402, reuse it after.</p>
              </div>

              <dl className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-gray-500">Sold</dt>
                  <dd className="font-medium text-black">
                    {load.listing.sales !== undefined ? compact(load.listing.sales) : "—"}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-gray-500">Seller reputation</dt>
                  <dd className="font-medium text-black">
                    {load.listing.sellerReputation ? (
                      <>
                        {load.listing.sellerReputation.score}%{" "}
                        <span className="font-normal text-gray-500">
                          from {load.listing.sellerReputation.basis} settled sales
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-500">New seller</span>
                    )}
                  </dd>
                </div>
              </dl>

              <div className="grid gap-3">
                <Field label="Seller" value={load.listing.sellerAddress} copy />
                <Field label="Content hash (SHA-256)" value={load.listing.contentHash} copy />
              </div>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-black">How to buy</h2>
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
                <Field label="Paid endpoint for agents (x402)" value={ENDPOINTS.unlock(id)} copy />
              </section>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
