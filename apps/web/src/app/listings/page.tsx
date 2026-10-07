"use client";

import { ChevronDown, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import ListingCard from "@/components/ListingCard";
import ListingPreview from "@/components/ListingPreview";
import Skeleton, { SkeletonRegion } from "@/components/Skeleton";
import { CATEGORIES, fetchListings, type ListingView } from "@/lib/api";

type L = ListingView;
const SORTS = {
  popular: { label: "Popular", by: (a: L, b: L) => (b.sales ?? 0) - (a.sales ?? 0) },
  newest: {
    label: "Newest",
    by: (a: L, b: L) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0),
  },
  price: {
    label: "Price: low to high",
    by: (a: L, b: L) => Number(BigInt(a.priceLovelace) - BigInt(b.priceLovelace)),
  },
} as const;
type Sort = keyof typeof SORTS;

type LoadState = { phase: "pending" } | { phase: "error" } | { phase: "ready"; listings: L[] };

const pill = (active: boolean) =>
  `shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none ${
    active ? "bg-black text-white" : "text-gray-600 hover:bg-black/[0.05] hover:text-black"
  }`;

export default function CataloguePage() {
  const [load, setLoad] = useState<LoadState>({ phase: "pending" });
  const [attempt, setAttempt] = useState(0);
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("popular");

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

  const listings = load.phase === "ready" ? load.listings : [];
  // Only categories that have something in them, in the canonical order.
  const categories = CATEGORIES.filter((c) => listings.some((l) => l.category === c));
  const shown = listings.filter((l) => !category || l.category === category).sort(SORTS[sort].by);

  return (
    <div className="min-h-screen bg-white">
      <main className="px-4 pb-24 sm:px-6 lg:px-10">
        <section className="relative mt-4 overflow-hidden rounded-2xl bg-black text-white">
          <ListingPreview
            src="/media/particle-ai.webm"
            title="Simpuru"
            className="absolute inset-0 h-full w-full opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="relative flex flex-col gap-4 px-6 py-10 sm:px-10 sm:py-14">
            <h1 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-5xl">
              Design prompts you and your agents can buy.
            </h1>
            <p className="max-w-lg text-sm text-white/75 sm:text-base">
              Pay once in tADA on Cardano and reuse it forever. Anyone can sell, every seller
              carries a reputation, and protected buys wait in escrow until delivery checks out.
            </p>
            <span className="w-fit rounded-full border border-white/25 px-2.5 py-0.5 text-[11px] font-medium text-white/80">
              Preprod testnet · test ADA has no value
            </span>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/sell"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-gray-200"
              >
                Sell a prompt
              </Link>
            </div>
          </div>
        </section>

        {/* An empty catalogue has nothing to filter or sort, so the bar only shows with listings. */}
        <div
          hidden={load.phase === "ready" && listings.length === 0}
          className="sticky top-[65px] z-20 -mx-4 mt-6 mb-6 flex items-center justify-between gap-4 bg-white/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10"
        >
          <fieldset className="flex min-w-0 gap-1 overflow-x-auto [scrollbar-width:none]">
            <legend className="sr-only">Filter by category</legend>
            <button
              type="button"
              aria-pressed={category === null}
              onClick={() => setCategory(null)}
              className={pill(category === null)}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(category === c ? null : c)}
                className={pill(category === c)}
              >
                {c}
              </button>
            ))}
          </fieldset>
          <label className="relative shrink-0">
            <span className="sr-only">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="appearance-none rounded-full border border-gray-200 bg-white py-1.5 pr-8 pl-3.5 text-sm text-black focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none"
            >
              {Object.entries(SORTS).map(([key, s]) => (
                <option key={key} value={key}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-gray-500"
            />
          </label>
        </div>

        {load.phase === "pending" && (
          <SkeletonRegion
            label="Loading the catalogue…"
            className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
          >
            {["a", "b", "c", "d"].map((key) => (
              <Skeleton key={key} className="aspect-[4/3] rounded-xl" />
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
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-4 py-2 text-xs font-medium text-black transition-colors hover:border-black"
            >
              <RotateCcw aria-hidden className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        )}

        {load.phase === "ready" && listings.length === 0 && (
          <section className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-300 px-6 py-16 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              No prompts yet. Be the first to sell one.
            </h2>
            <p className="max-w-md text-sm text-gray-600">
              Creators list design prompts; people and agents buy them in tADA on Cardano preprod.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href="/sell"
                className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                Sell a prompt
              </Link>
              <Link
                href="/agents"
                className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium hover:border-black"
              >
                Connect an agent
              </Link>
            </div>
          </section>
        )}

        {load.phase === "ready" && listings.length > 0 && shown.length === 0 && (
          <p className="rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-600">
            Nothing in {category} yet.
          </p>
        )}

        {shown.length > 0 && (
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {shown.map((l, i) => (
              <ListingCard key={l.id} listing={l} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
