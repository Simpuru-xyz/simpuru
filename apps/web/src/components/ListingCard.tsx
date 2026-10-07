import { ImageOff, ShieldCheck, ThumbsUp } from "lucide-react";
import Link from "next/link";
import ListingPreview from "@/components/ListingPreview";
import { formatAda, type ListingView, shorten } from "@/lib/api";
import { compact } from "@/lib/format";

/**
 * One catalogue card: the recording of what the prompt
 * builds is the card. Under it what a buyer scans for: name, price, category,
 * seller and their reputation. Fields the API doesn't send yet are skipped.
 */
export default function ListingCard({
  listing,
  index = 0,
}: {
  listing: ListingView;
  index?: number;
}) {
  const media = "absolute inset-0 h-full w-full";
  const rep = listing.sellerReputation;
  const seller = shorten(listing.sellerAddress, 10, 4);
  return (
    <article
      aria-label={`${listing.title} by ${listing.sellerAddress}`}
      className="animate-fade-in-up group"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* The preview repeats the title link; hidden from keyboard and screen readers. */}
      <Link href={`/listings/${listing.id}`} tabIndex={-1} aria-hidden className="block">
        <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
          <ListingPreview
            src={listing.previewMedia}
            title={listing.title}
            className={`${media} transition-transform duration-500 group-hover:scale-[1.03]`}
            fallback={
              <div
                className={`${media} flex flex-col items-center justify-center gap-2 text-gray-400`}
              >
                <ImageOff aria-hidden className="h-5 w-5" />
                <span className="text-xs">No preview yet</span>
              </div>
            }
          />
          {listing.modes.includes("protected") && (
            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
              <ShieldCheck aria-hidden className="h-3 w-3" />
              Protected
            </span>
          )}
        </div>
      </Link>

      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 truncate text-sm font-semibold text-black">
          <Link
            href={`/listings/${listing.id}`}
            className="rounded hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {listing.title}
          </Link>
        </h3>
        <span className="shrink-0 text-sm font-semibold text-black">
          {formatAda(listing.priceLovelace)} tADA
        </span>
      </div>
      <div className="mt-0.5 flex items-center justify-between gap-3 text-xs text-gray-500">
        <span className="min-w-0 truncate">
          {listing.category && `${listing.category} · `}
          <Link
            href={`/creators/${listing.sellerAddress}`}
            className="rounded font-mono text-gray-700 hover:text-black hover:underline focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none"
          >
            {seller}
          </Link>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1">
          {rep ? (
            <span
              className="inline-flex items-center gap-1"
              title={`Reputation ${rep.score}/100 from ${rep.basis} settled sales`}
            >
              <ThumbsUp aria-hidden className="h-3 w-3" />
              {rep.score}%
            </span>
          ) : (
            <span className="text-gray-400">New seller</span>
          )}
          {listing.sales !== undefined && (
            <span className="text-gray-400">· {compact(listing.sales)} sold</span>
          )}
        </span>
      </div>
    </article>
  );
}
