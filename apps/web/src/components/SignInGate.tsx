"use client";

import type { ReactNode } from "react";
import { useSession } from "@/components/SessionProvider";
import Skeleton from "@/components/Skeleton";

/** Renders `children` only when signed in; otherwise a short reason and a Sign in button. */
export default function SignInGate({ why, children }: { why: string; children: ReactNode }) {
  const { session, restoring, openSignIn } = useSession();
  if (restoring) return <Skeleton className="h-40 rounded-2xl" />;
  if (session) return <>{children}</>;
  return (
    <div className="flex flex-col items-start gap-4 rounded-2xl border border-gray-200 p-8 sm:items-center sm:text-center">
      <p className="max-w-md text-sm text-gray-600">{why}</p>
      <button
        type="button"
        onClick={openSignIn}
        className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
      >
        Sign in with your Cardano wallet
      </button>
    </div>
  );
}
