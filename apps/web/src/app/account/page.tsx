"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Nav from "@/components/Nav";
import PurchasesTable from "@/components/PurchasesTable";
import SellingPanel from "@/components/SellingPanel";
import { useSession } from "@/components/SessionProvider";
import SignInGate from "@/components/SignInGate";
import WalletCard from "@/components/WalletCard";
import { shorten } from "@/lib/api";

const TABS = [
  { key: "wallet", label: "Wallet" },
  { key: "purchases", label: "Purchases" },
  { key: "selling", label: "Selling" },
] as const;
type Tab = (typeof TABS)[number]["key"];

function AccountTabs() {
  const params = useSearchParams();
  const raw = params.get("tab");
  const tab: Tab = TABS.some((t) => t.key === raw) ? (raw as Tab) : "wallet";
  const { session } = useSession();

  return (
    <SignInGate why="Sign in with your Cardano wallet to see your Simpuru wallet, purchases and sales.">
      <p className="-mt-4 mb-6 font-mono text-xs text-gray-500">
        {shorten(session?.owner ?? "", 16, 8)}
      </p>
      <div role="tablist" aria-label="Account" className="mb-6 flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <Link
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            href={t.key === "wallet" ? "/account" : `/account?tab=${t.key}`}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm transition-colors ${
              tab === t.key
                ? "border-black font-medium text-black"
                : "border-transparent text-gray-500 hover:text-black"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>
      {tab === "wallet" && <WalletCard />}
      {tab === "purchases" && <PurchasesTable />}
      {tab === "selling" && <SellingPanel />}
    </SignInGate>
  );
}

/** Your account (spec #86): Simpuru wallet, purchases, selling. */
export default function AccountPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <header className="py-8">
          <h1 className="text-3xl font-normal tracking-tight sm:text-4xl">Account</h1>
        </header>
        <Suspense>
          <AccountTabs />
        </Suspense>
      </main>
    </div>
  );
}
