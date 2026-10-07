"use client";

import type { DeliveryMode } from "@simpuru/core";
import { Loader2, ShieldCheck, Zap } from "lucide-react";
import { useState } from "react";
import ContentModal from "@/components/ContentModal";
import Modal from "@/components/Modal";
import { useSession } from "@/components/SessionProvider";
import WalletCard from "@/components/WalletCard";
import { buy, ownedPurchase } from "@/lib/account";
import { formatAda, type ListingView } from "@/lib/api";

const COPY: Record<DeliveryMode, { label: string; line: string }> = {
  instant: { label: "Buy instant", line: "Paid to the seller now." },
  protected: {
    label: "Buy with protection",
    line: "Held in escrow until the delivery is checked; refunded if it fails.",
  },
};

type Step =
  | { kind: "idle" }
  | { kind: "fund"; mode: DeliveryMode }
  | { kind: "confirm"; mode: DeliveryMode }
  | { kind: "paying"; mode: DeliveryMode }
  | { kind: "error"; mode: DeliveryMode; message: string }
  | { kind: "done"; content: string; purchaseId?: string };

/** Buying on the website from the Simpuru wallet (spec #86, J3). */
export default function BuyPanel({ listing }: { listing: ListingView }) {
  const { session, me, openSignIn, guard, refresh } = useSession();
  const [step, setStep] = useState<Step>({ kind: "idle" });
  const [openOwned, setOpenOwned] = useState(false);
  const price = BigInt(listing.priceLovelace);
  const owned = ownedPurchase(me, listing.id);
  const ada = formatAda(listing.priceLovelace);

  const start = (mode: DeliveryMode) => {
    if (!session) return openSignIn();
    if (me && BigInt(me.wallet.balanceLovelace) < price) return setStep({ kind: "fund", mode });
    setStep({ kind: "confirm", mode });
  };

  const pay = async (mode: DeliveryMode) => {
    setStep({ kind: "paying", mode });
    try {
      const r = await guard((t) => buy(t, listing.id, mode));
      setStep({ kind: "done", content: r.content, purchaseId: r.purchase?.id });
      refresh();
    } catch (err) {
      setStep({
        kind: "error",
        mode,
        message: err instanceof Error ? err.message : "Payment failed.",
      });
    }
  };

  // Only switch to "Open" when no purchase flow is on screen: the /me refresh right after paying
  // already lists the purchase, and must not unmount the content the buyer just paid for.
  if (owned && step.kind === "idle")
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setOpenOwned(true)}
          className="w-full rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Open
        </button>
        <p className="text-center text-xs text-gray-500">
          You own this prompt. Opening it is free.
        </p>
        <ContentModal
          open={openOwned}
          onClose={() => setOpenOwned(false)}
          title={listing.title}
          purchaseId={owned.id}
        />
      </div>
    );

  const mode = "mode" in step ? step.mode : "instant";
  const balance = me ? BigInt(me.wallet.balanceLovelace) : BigInt(0);
  const missing = price > balance ? price - balance : BigInt(0);

  return (
    <div className="space-y-3">
      {listing.modes.map((m) => {
        const Icon = m === "protected" ? ShieldCheck : Zap;
        return (
          <div key={m}>
            <button
              type="button"
              onClick={() => start(m)}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-colors ${
                m === "protected"
                  ? "bg-black text-white hover:bg-gray-800"
                  : "border border-gray-300 text-black hover:border-black"
              }`}
            >
              <Icon aria-hidden className="h-4 w-4" />
              {COPY[m].label} · {ada} tADA
            </button>
            <p className="mt-1.5 text-center text-xs text-gray-500">{COPY[m].line}</p>
          </div>
        );
      })}
      {!session && (
        <p className="text-center text-xs text-gray-500">
          You&apos;ll sign in with your Cardano wallet first.
        </p>
      )}

      <Modal
        open={step.kind === "fund"}
        onClose={() => setStep({ kind: "idle" })}
        title="Add tADA to buy this"
      >
        <p className="text-sm text-gray-700">
          Your Simpuru wallet has {formatAda(balance.toString())} tADA. Add at least{" "}
          {formatAda(missing.toString())} tADA, then buy.
        </p>
        <WalletCard compact />
      </Modal>

      <Modal
        open={step.kind === "confirm" || step.kind === "paying" || step.kind === "error"}
        onClose={() => setStep({ kind: "idle" })}
        title={COPY[mode].label}
        locked={step.kind === "paying"}
      >
        <dl className="space-y-2 rounded-xl bg-gray-50 p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Prompt</dt>
            <dd className="truncate font-medium">{listing.title}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Price</dt>
            <dd className="font-medium">{ada} tADA</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Paid from</dt>
            <dd>Your Simpuru wallet ({formatAda(balance.toString())} tADA)</dd>
          </div>
        </dl>
        <p className="text-xs text-gray-500">{COPY[mode].line}</p>
        {step.kind === "error" && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800"
          >
            {step.message}
          </p>
        )}
        <button
          type="button"
          onClick={() => pay(mode)}
          disabled={step.kind === "paying"}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-medium text-white disabled:opacity-70"
        >
          {step.kind === "paying" && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
          {step.kind === "paying"
            ? "Paying on Cardano… (20–60 s)"
            : step.kind === "error"
              ? "Try again"
              : `Pay ${ada} tADA`}
        </button>
      </Modal>

      <ContentModal
        open={step.kind === "done"}
        onClose={() => setStep({ kind: "idle" })}
        title={`Yours: ${listing.title}`}
        content={step.kind === "done" ? step.content : undefined}
        purchaseId={step.kind === "done" ? step.purchaseId : undefined}
      />
    </div>
  );
}
