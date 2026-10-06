import { CircleCheck, CircleDashed, CircleX } from "lucide-react";
import type { PurchaseView, Verification } from "@/lib/purchases";

const COPY: Record<
  Verification,
  { title: string; body: string; tone: string; Icon: typeof CircleCheck }
> = {
  ok: {
    title: "Delivery matches",
    body: "The watcher recomputed the hashes from what was delivered. They match the escrow and the listing.",
    tone: "border-gray-200",
    Icon: CircleCheck,
  },
  mismatch: {
    title: "Delivery does not match",
    body: "The delivered content hashes to something else than what was committed. The watcher disputed it.",
    tone: "border-red-300 bg-red-50/50 text-red-900",
    Icon: CircleX,
  },
  no_result_yet: {
    title: "Nothing delivered yet",
    body: "No result has been submitted, so there is nothing to check.",
    tone: "border-gray-200",
    Icon: CircleDashed,
  },
};

/** The watcher's verdict (#10), with the hashes it compared. */
export default function VerificationCard({ purchase }: { purchase: PurchaseView }) {
  if (!purchase.verification) return null;
  const { title, body, tone, Icon } = COPY[purchase.verification];
  return (
    <div className={`space-y-3 rounded-2xl border p-5 ${tone}`}>
      <p className="inline-flex items-center gap-2 text-sm font-semibold">
        <Icon aria-hidden className="h-4 w-4" />
        {title}
      </p>
      <p className="text-sm leading-relaxed opacity-80">{body}</p>
      {purchase.escrow && (
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs">
          <dt className="opacity-60">input_hash</dt>
          <dd className="min-w-0 truncate font-mono">{purchase.escrow.inputHash}</dd>
          <dt className="opacity-60">result_hash</dt>
          <dd className="min-w-0 truncate font-mono">{purchase.escrow.resultHash ?? "none yet"}</dd>
        </dl>
      )}
    </div>
  );
}
