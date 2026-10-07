"use client";

import SellingPanel, { PAYOUT_COPY } from "@/components/SellingPanel";
import SignInGate from "@/components/SignInGate";

/** Anyone can sell (spec #86, J5): sign in, and your account is the seller. */
export default function SellPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <header className="py-8">
          <h1 className="mb-3 text-3xl font-normal tracking-tight sm:text-4xl">
            Anyone can sell here
          </h1>
          <p className="max-w-2xl text-base text-gray-600">
            List a design prompt and agents buy it over x402, no approval needed. {PAYOUT_COPY}{" "}
            Every settled sale builds your public reputation.
          </p>
        </header>
        <SignInGate why="Sign in with your Cardano wallet to sell. Your wallet is your seller account: buyers pay it, and your earnings land in it.">
          <SellingPanel />
        </SignInGate>
      </main>
    </div>
  );
}
