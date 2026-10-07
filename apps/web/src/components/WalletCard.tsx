"use client";

import { explorerTx } from "@simpuru/core";
import { ArrowUpRight, Droplets, Loader2 } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import CopyButton from "@/components/CopyButton";
import Modal from "@/components/Modal";
import { useSession } from "@/components/SessionProvider";
import { PREPROD_FAUCET, withdraw } from "@/lib/account";
import { formatAda, shorten } from "@/lib/api";

/** The Simpuru wallet (spec #86, J2): balance, address to fund, faucet, withdraw. */
export default function WalletCard({ compact = false }: { compact?: boolean }) {
  const { me, guard, refresh } = useSession();
  const [qr, setQr] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tx: string; lovelace: string } | null>(null);
  const [error, setError] = useState("");
  const address = me?.wallet.address ?? "";

  useEffect(() => {
    if (!address) return;
    QRCode.toDataURL(address, { margin: 1, width: 240 })
      .then(setQr)
      .catch(() => setQr(""));
  }, [address]);

  if (!me) return <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />;
  const balance = BigInt(me.wallet.balanceLovelace);
  // apps/api agents.ts sendAllTo: keeps 2 tADA for the fee and change, refuses at 3 tADA or less.
  const reserve = BigInt(2_000_000);
  const canWithdraw = balance > reserve + BigInt(1_000_000);
  const withdrawable = canWithdraw ? balance - reserve : BigInt(0);

  const getTestAda = () => {
    // Open first, while the click still counts as a user gesture (Safari blocks it after an await).
    window.open(PREPROD_FAUCET, "_blank", "noopener");
    navigator.clipboard.writeText(address).catch(() => {});
  };

  const doWithdraw = async () => {
    setBusy(true);
    setError("");
    try {
      setResult(await guard((t) => withdraw(t)));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdraw failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 space-y-4">
          <div>
            <p className="text-xs text-gray-500">Your Simpuru wallet</p>
            <p className="text-4xl font-semibold tracking-tight">
              {formatAda(me.wallet.balanceLovelace)} <span className="text-xl">tADA</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Updates every 20 s. You and your agents spend from it.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm text-gray-700">Send tADA here from your wallet:</p>
            <div className="flex max-w-full items-center gap-2">
              <code
                className="min-w-0 truncate rounded-lg bg-gray-50 px-2.5 py-1.5 font-mono text-xs"
                title={address}
              >
                {compact ? shorten(address, 16, 8) : address}
              </code>
              <span className="shrink-0">
                <CopyButton text={address} label="Simpuru wallet address" />
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={getTestAda}
              className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              <Droplets aria-hidden className="h-4 w-4" />
              Get test ADA
            </button>
            {!compact && (
              <button
                type="button"
                disabled={!canWithdraw}
                title={
                  canWithdraw
                    ? undefined
                    : "Needs more than 3 tADA (2 stay back for the network fee)"
                }
                onClick={() => {
                  setResult(null);
                  setError("");
                  setConfirm(true);
                }}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:border-black disabled:opacity-50"
              >
                Withdraw to my wallet
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Get test ADA copies this address and opens the preprod faucet. Paste it there.
          </p>
        </div>
        {qr && !compact && (
          // biome-ignore lint/performance/noImgElement: a generated data URI
          <img
            src={qr}
            alt="QR code of your Simpuru wallet address"
            className="h-36 w-36 rounded-xl border border-gray-200"
          />
        )}
      </div>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Withdraw to your wallet"
        locked={busy}
      >
        {result ? (
          <div className="space-y-3 text-sm">
            <p>
              Sent {formatAda(result.lovelace)} tADA to {shorten(me.owner, 10, 6)}.
            </p>
            <a
              href={explorerTx(result.tx)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium underline underline-offset-4"
            >
              View the transaction
              <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
            </a>
          </div>
        ) : (
          <div className="space-y-4 text-sm text-gray-700">
            <p>
              {formatAda(withdrawable.toString())} tADA goes to the wallet you signed in with. 2
              tADA stay in your Simpuru wallet to cover the network fee.
            </p>
            <code className="block truncate rounded-lg bg-gray-50 px-2.5 py-1.5 font-mono text-xs">
              {me.owner}
            </code>
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800"
              >
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={doWithdraw}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 font-medium text-white disabled:opacity-60"
            >
              {busy && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
              {busy ? "Sending on Cardano…" : "Withdraw everything"}
            </button>
          </div>
        )}
      </Modal>
    </section>
  );
}
