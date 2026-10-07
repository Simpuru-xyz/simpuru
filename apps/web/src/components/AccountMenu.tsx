"use client";

import { ChevronDown, Info } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { PREPROD_FAUCET } from "@/lib/account";
import { formatAda, shorten } from "@/lib/api";

/** Close a popover on outside click or Esc. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

/** Always visible: everything here is Cardano preprod (testnet) money. */
export function TestnetBadge() {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-900"
      >
        Testnet · preprod
        <Info aria-hidden className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-72 space-y-2 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-xl">
          <p className="font-medium text-black">What&apos;s preprod?</p>
          <p>
            Cardano&apos;s test network. Test ADA (tADA) has no value, so you can buy, sell and get
            refunds here without risking real money.
          </p>
          <a
            href={PREPROD_FAUCET}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-full bg-black px-3.5 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
          >
            Get test ADA
          </a>
        </div>
      )}
    </div>
  );
}

export const ACCOUNT_LINKS = [
  { label: "Account", href: "/account" },
  { label: "Selling", href: "/account?tab=selling" },
  { label: "Connect an agent", href: "/agents" },
];

/** Sign in, or the signed-in chip (short address + Simpuru wallet balance) with its menu. */
export function AccountMenu() {
  const { session, me, restoring, openSignIn, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));

  if (restoring)
    return <span className="inline-block h-8 w-24 animate-pulse rounded-full bg-gray-100" />;
  if (!session)
    return (
      <button
        type="button"
        onClick={openSignIn}
        className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
      >
        Sign in
      </button>
    );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full border border-gray-200 py-1 pr-2.5 pl-1 text-sm transition-colors hover:border-gray-400"
      >
        <span
          aria-hidden
          className="h-6 w-6 rounded-full"
          style={{ background: avatarGradient(session.owner) }}
        />
        <span className="font-mono text-xs text-gray-700">{shorten(session.owner, 10, 4)}</span>
        <span className="font-medium text-black">
          {me ? `${formatAda(me.wallet.balanceLovelace)} tADA` : "…"}
        </span>
        <ChevronDown aria-hidden className="h-3.5 w-3.5 text-gray-500" />
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-52 overflow-hidden rounded-2xl border border-gray-200 bg-white py-1 shadow-xl">
          {ACCOUNT_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black"
            >
              {l.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="block w-full border-t border-gray-100 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-black"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/** A stable two-colour gradient per address, so each account has its own avatar. */
export function avatarGradient(address: string) {
  let h = 0;
  for (const ch of address) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `linear-gradient(135deg, hsl(${h} 70% 60%), hsl(${(h + 60) % 360} 70% 45%))`;
}
