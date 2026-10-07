"use client";

import { ThumbsUp } from "lucide-react";
import { use, useEffect, useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import CopyButton from "@/components/CopyButton";
import ListingCard from "@/components/ListingCard";
import Skeleton, { SkeletonRegion } from "@/components/Skeleton";
import { ApiError, type Creator, fetchCreator, shorten } from "@/lib/api";
import { compact } from "@/lib/format";

type LoadState =
  | { phase: "pending" }
  | { phase: "invalid" }
  | { phase: "error" }
  | { phase: "ready"; creator: Creator };

/** A creator's public page: who they are on chain, how buyers fared, and what they sell. */
export default function CreatorPage({ params }: PageProps<"/creators/[address]">) {
  const { address } = use(params);
  const [load, setLoad] = useState<LoadState>({ phase: "pending" });

  const [loaded, setLoaded] = useState(address);
  if (loaded !== address) {
    setLoaded(address);
    setLoad({ phase: "pending" });
  }

  useEffect(() => {
    let cancelled = false;
    fetchCreator(address)
      .then((creator) => {
        if (!cancelled) setLoad({ phase: "ready", creator });
      })
      .catch((err) => {
        if (cancelled) return;
        setLoad({ phase: err instanceof ApiError && err.status === 400 ? "invalid" : "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  return (
    <div className="min-h-screen bg-white">
      <main className="px-4 pt-6 pb-24 sm:px-6 lg:px-10 lg:pt-8">
        <Breadcrumbs items={[{ label: "Catalogue", href: "/listings" }, { label: "Creator" }]} />

        {load.phase === "pending" && (
          <SkeletonRegion label="Loading the creator…" className="mt-6 space-y-6">
            <Skeleton className="h-28 rounded-2xl" />
            <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {["a", "b", "c", "d"].map((k) => (
                <Skeleton key={k} className="aspect-[4/3] rounded-xl" />
              ))}
            </div>
          </SkeletonRegion>
        )}

        {(load.phase === "invalid" || load.phase === "error") && (
          <p
            role="alert"
            className="mx-auto mt-6 max-w-xl rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-600"
          >
            {load.phase === "invalid" ? (
              <>
                <code className="font-mono break-all">{address}</code> is not a preprod address.
              </>
            ) : (
              <>The Simpuru API isn&apos;t reachable right now. Try again in a moment.</>
            )}
          </p>
        )}

        {load.phase === "ready" && (
          <div className="animate-fade-in-up mt-6 space-y-8">
            <header className="flex flex-wrap items-end justify-between gap-6 rounded-2xl border border-gray-200 p-6">
              <div className="min-w-0 space-y-2">
                <p className="text-xs text-gray-500">Creator</p>
                <div className="flex items-center gap-2">
                  <h1
                    className="truncate font-mono text-xl font-semibold text-black sm:text-2xl"
                    title={load.creator.address}
                  >
                    {shorten(load.creator.address, 14, 8)}
                  </h1>
                  <CopyButton text={load.creator.address} label="creator address" />
                </div>
              </div>
              <dl className="flex gap-8 text-sm">
                <div>
                  <dt className="text-xs text-gray-500">Listings</dt>
                  <dd className="text-xl font-semibold text-black">
                    {load.creator.listings.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Sold</dt>
                  <dd className="text-xl font-semibold text-black">
                    {compact(load.creator.sales)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Reputation</dt>
                  <dd className="text-xl font-semibold text-black">
                    {load.creator.sellerReputation ? (
                      <span
                        className="inline-flex items-center gap-1.5"
                        title={`From ${load.creator.sellerReputation.basis} settled protected sales`}
                      >
                        <ThumbsUp aria-hidden className="h-4 w-4" />
                        {load.creator.sellerReputation.score}%
                      </span>
                    ) : (
                      <span className="text-base font-normal text-gray-500">New seller</span>
                    )}
                  </dd>
                </div>
              </dl>
            </header>

            {load.creator.listings.length === 0 ? (
              <p className="rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-600">
                Nothing listed yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {load.creator.listings.map((l, i) => (
                  <ListingCard key={l.id} listing={l} index={i} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
