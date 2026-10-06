import type { Listing } from "@simpuru/core";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import ModeBadge from "@/components/ModeBadge";
import StatusBadge from "@/components/StatusBadge";
import { formatAda, shorten } from "@/lib/api";
import { isDispute, type PurchaseView } from "@/lib/purchases";

/** Sales, disputes first: they are the only rows that need the seller. */
export default function SalesList({
  sales,
  listings,
}: {
  sales: PurchaseView[];
  listings: Listing[];
}) {
  const byId = new Map(listings.map((l) => [l.id, l]));
  const sorted = [...sales].sort(
    (a, b) =>
      Number(isDispute(b.status)) - Number(isDispute(a.status)) ||
      Number(b.events.at(-1)?.at ?? 0) - Number(a.events.at(-1)?.at ?? 0),
  );

  return (
    <ul className="space-y-3">
      {sorted.map((sale, i) => {
        const listing = byId.get(sale.listingId);
        const dispute = isDispute(sale.status);
        const at = sale.events.at(-1)?.at;
        return (
          <li
            key={sale.id}
            className={`animate-fade-in-up rounded-2xl border p-4 ${
              dispute ? "border-red-300 bg-red-50/50" : "border-gray-200 bg-white"
            }`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1.5">
                <p className="text-sm font-semibold break-words text-black">
                  {listing?.title ?? sale.listingId}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <ModeBadge mode={sale.mode} />
                  <StatusBadge status={sale.status} />
                </div>
              </div>
              {listing && (
                <span className="shrink-0 rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                  {formatAda(listing.priceLovelace)} ADA
                </span>
              )}
            </div>

            {dispute && (
              <p className="mt-3 inline-flex items-start gap-1.5 text-xs text-red-800">
                <AlertTriangle aria-hidden className="mt-px h-3.5 w-3.5 shrink-0" />
                The buyer disputed this delivery. The arbiter checks it against the committed hash
                once the dispute window ends.
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
              <span className="font-mono">
                buyer {shorten(sale.buyerAddress)}
                {at &&
                  ` · ${new Date(Number(at)).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`}
              </span>
              <Link
                href={`/purchases/${sale.id}`}
                className="inline-flex items-center gap-1 font-medium text-black hover:underline"
              >
                Timeline
                <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
