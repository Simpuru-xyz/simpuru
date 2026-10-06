"use client";

import type { Listing } from "@simpuru/core";
import { RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import ListingCard from "@/components/ListingCard";
import Nav from "@/components/Nav";
import Skeleton, { SkeletonRegion } from "@/components/Skeleton";
import { fetchListings } from "@/lib/api";

type LoadState =
  | { phase: "pending" }
  | { phase: "error" }
  | { phase: "ready"; listings: Listing[] };

export default function CataloguePage() {
  const [load, setLoad] = useState<LoadState>({ phase: "pending" });
  // Bumped by the retry control; the effect refetches on every bump.
  const [attempt, setAttempt] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `attempt` is the retry trigger
  useEffect(() => {
    let cancelled = false;
    fetchListings()
      .then((listings) => {
        if (!cancelled) setLoad({ phase: "ready", listings });
      })
      .catch(() => {
        if (!cancelled) setLoad({ phase: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <header className="py-8">
          <h1 className="mb-3 text-3xl font-normal tracking-tight sm:text-4xl">Catalogue</h1>
          <p className="max-w-2xl text-base text-gray-600">
            Digital goods an agent can buy over x402 on Cardano. Every listing commits to the hash
            of its content, so the buyer can prove what was delivered. Pick{" "}
            <span className="font-medium text-black">protected</span> and the payment waits in
            escrow until it is.
          </p>
        </header>

        {load.phase === "pending" && (
          <SkeletonRegion
            label="Loading the catalogue…"
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {["a", "b", "c"].map((key) => (
              <Skeleton key={key} className="h-64 rounded-2xl" />
            ))}
          </SkeletonRegion>
        )}

        {load.phase === "error" && (
          <div role="alert" className="rounded-2xl border border-gray-200 p-8 text-center">
            <p className="mb-1 text-sm font-medium text-black">The catalogue didn&apos;t load</p>
            <p className="mb-5 text-sm text-gray-600">
              The Simpuru API isn&apos;t reachable right now. Nothing is lost, so try again.
            </p>
            <button
              type="button"
              onClick={() => {
                setLoad({ phase: "pending" });
                setAttempt((n) => n + 1);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-4 py-2 text-xs font-medium text-black transition-colors hover:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <RotateCcw aria-hidden className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        )}

        {load.phase === "ready" && load.listings.length === 0 && (
          <p className="rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-600">
            The catalogue is empty.
          </p>
        )}

        {load.phase === "ready" && load.listings.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {load.listings.map((listing, i) => (
              <ListingCard key={listing.id} listing={listing} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
