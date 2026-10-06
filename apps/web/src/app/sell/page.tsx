"use client";

import type { Listing } from "@simpuru/core";
import { useEffect, useState } from "react";
import CreateListingForm from "@/components/CreateListingForm";
import Nav from "@/components/Nav";
import SalesList from "@/components/SalesList";
import Skeleton, { SkeletonRegion } from "@/components/Skeleton";
import { fetchListings, RULES } from "@/lib/api";
import { fetchSales, isDispute, type PurchaseView } from "@/lib/purchases";

const STORAGE_KEY = "simpuru:seller-address";

// Storage can be blocked (private mode, previews); the page works without it.
const readSaved = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
};
const save = (value: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {}
};

type SalesState =
  | { phase: "idle" }
  | { phase: "pending" }
  | { phase: "error" }
  | { phase: "ready"; sales: PurchaseView[]; listings: Listing[] };

/**
 * Seller dashboard. The seller is identified by the address they type: the API
 * has no seller auth yet, so a wallet connection would prove nothing extra here.
 */
export default function SellPage() {
  const [address, setAddress] = useState("");
  const [sales, setSales] = useState<SalesState>({ phase: "idle" });
  // Bumped after a new listing so the sales list re-reads the catalogue.
  const [version, setVersion] = useState(0);
  const valid = RULES.address.test(address);

  useEffect(() => {
    const saved = readSaved();
    if (saved) setAddress(saved);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `version` is the refresh trigger
  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    setSales({ phase: "pending" });
    fetchListings()
      .then(async (listings) => {
        const mine = await fetchSales(address);
        if (!cancelled) setSales({ phase: "ready", sales: mine, listings });
      })
      .catch(() => {
        if (!cancelled) setSales({ phase: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [address, valid, version]);

  const disputes = sales.phase === "ready" ? sales.sales.filter((s) => isDispute(s.status)) : [];

  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <header className="py-8">
          <h1 className="mb-3 text-3xl font-normal tracking-tight sm:text-4xl">Sell</h1>
          <p className="max-w-2xl text-base text-gray-600">
            List something agents can buy, and follow what happens to each sale.
          </p>
        </header>

        <label className="mb-8 block max-w-2xl space-y-1.5">
          <span className="text-sm font-medium text-black">Your preprod address</span>
          <input
            value={address}
            onChange={(e) => {
              const next = e.target.value.trim();
              setAddress(next);
              if (RULES.address.test(next)) save(next);
            }}
            placeholder="addr_test1…"
            spellCheck={false}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 font-mono text-sm text-black placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none"
          />
          <span className={`block text-xs ${address && !valid ? "text-red-700" : "text-gray-500"}`}>
            {address && !valid
              ? "That is not a preprod addr_test1… address."
              : "Buyers pay this address. Preprod only."}
          </span>
        </label>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-black">New listing</h2>
            <CreateListingForm sellerAddress={address} onCreated={() => setVersion((n) => n + 1)} />
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-black">Sales</h2>
              {disputes.length > 0 && (
                <span className="rounded-full bg-red-700 px-2.5 py-0.5 text-[11px] font-medium text-white">
                  {disputes.length} in dispute
                </span>
              )}
            </div>

            {!valid && (
              <p className="rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-600">
                Enter your address to see your sales.
              </p>
            )}
            {valid && sales.phase === "pending" && (
              <SkeletonRegion label="Loading your sales…" className="space-y-3">
                {["a", "b", "c"].map((key) => (
                  <Skeleton key={key} className="h-28 rounded-2xl" />
                ))}
              </SkeletonRegion>
            )}
            {valid && sales.phase === "error" && (
              <p
                role="alert"
                className="rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-600"
              >
                The Simpuru API isn&apos;t reachable right now. Try again in a moment.
              </p>
            )}
            {valid && sales.phase === "ready" && sales.sales.length === 0 && (
              <p className="rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-600">
                No sales yet.
              </p>
            )}
            {valid && sales.phase === "ready" && sales.sales.length > 0 && (
              <SalesList sales={sales.sales} listings={sales.listings} />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
