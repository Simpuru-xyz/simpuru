import type { Listing } from "@simpuru/core";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import ModeBadge from "@/components/ModeBadge";
import { formatAda, shorten } from "@/lib/api";

/** One catalogue card. The action row is always in the layout, never hover-revealed. */
export default function ListingCard({ listing, index = 0 }: { listing: Listing; index?: number }) {
  const ada = formatAda(listing.priceLovelace);
  return (
    <article
      aria-label={listing.title}
      className="animate-fade-in-up flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition-shadow focus-within:shadow-md hover:shadow-md"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <ul className="flex flex-wrap gap-1.5">
        {listing.modes.map((mode) => (
          <li key={mode}>
            <ModeBadge mode={mode} />
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        <h3 className="text-base font-semibold break-words text-black">
          <Link
            href={`/listings/${listing.id}`}
            className="rounded transition-colors hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {listing.title}
          </Link>
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-gray-600">{listing.description}</p>
      </div>

      <dl className="grid gap-2 text-xs">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-gray-500">Seller</dt>
          <dd className="min-w-0 truncate font-mono text-gray-800" title={listing.sellerAddress}>
            {shorten(listing.sellerAddress)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-gray-500">Content hash</dt>
          <dd className="min-w-0 truncate font-mono text-gray-800" title={listing.contentHash}>
            {shorten(listing.contentHash, 8, 8)}
          </dd>
        </div>
      </dl>

      {/* Wraps instead of squeezing, so at 375px the action drops under the price. */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
        <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
          {ada} ADA
        </span>
        <Link
          href={`/listings/${listing.id}`}
          aria-label={`View ${listing.title}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-4 py-2 text-xs font-medium text-black transition-colors hover:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          View
          <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
