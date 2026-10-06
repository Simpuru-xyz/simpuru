import { ArrowRight } from "lucide-react";
import { APP_URL } from "@/lib/links";

/**
 * The two payment paths every listing offers (apps/api: `masumi` and
 * `default`). Layout follows the MotionSites "Halo Benefits" section: heading
 * and one line on top, then a wide image card next to a dark one. Protected
 * gets the image because it is the default and the reason Simpuru exists.
 */
export default function InstantVsProtected() {
  return (
    <section id="instant-vs-protected" className="w-full bg-[#F5F5F5] px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 grid grid-cols-1 items-start gap-8 md:mb-16 md:grid-cols-2 md:gap-12">
          <div>
            <h2 className="mb-8 text-4xl leading-tight font-medium tracking-[-0.03em] text-black md:text-5xl">
              Two ways to pay.
            </h2>
            <a
              href={`${APP_URL}/listings`}
              className="inline-flex items-center gap-3 rounded-full bg-black py-2 pr-2 pl-8 text-base font-medium text-white transition-colors duration-200 hover:bg-gray-800"
            >
              Explore the gallery
              <span className="flex items-center justify-center rounded-full bg-white p-2">
                <ArrowRight aria-hidden className="h-5 w-5 text-black" />
              </span>
            </a>
          </div>
          <p className="text-2xl leading-relaxed font-normal text-black/70 md:text-3xl">
            Every prompt offers both. Pick the one that fits.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div
            className="relative flex min-h-80 flex-col justify-between overflow-hidden rounded-2xl bg-cover bg-center p-7 lg:col-span-2"
            style={{ backgroundImage: "url('/media/protected.webp')" }}
          >
            <p className="text-2xl leading-snug font-medium tracking-[-0.02em] text-black">
              Protected
            </p>
            <p className="max-w-xs text-base leading-relaxed text-black/70">
              The money waits until the prompt arrives. No prompt, money back.
            </p>
          </div>

          <div className="flex min-h-80 flex-col justify-between rounded-2xl bg-[#2B2644] p-7">
            <p className="text-2xl leading-snug font-medium tracking-[-0.02em] text-white">
              Instant
            </p>
            <p className="text-base leading-relaxed text-white/60">
              Paid straight to the seller. Fast, but final.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
