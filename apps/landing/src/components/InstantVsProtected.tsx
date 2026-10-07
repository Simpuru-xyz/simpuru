import { ArrowRight } from "lucide-react";
import { APP_URL } from "@/lib/links";

/**
 * The two payment paths every listing offers (apps/api: `masumi` and
 * `default`). Layout follows the MotionSites "Halo Benefits" section: heading
 * and one line on top, then a wide image card next to a video card. Protected
 * gets the image because it is the default and the reason Simpuru exists.
 */
export default function InstantVsProtected() {
  return (
    <section id="instant-vs-protected" className="w-full bg-[#F5F5F5] px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div
          data-reveal-group
          className="mb-12 grid grid-cols-1 items-start gap-8 md:mb-16 md:grid-cols-2 md:gap-12"
        >
          <div>
            <h2 className="mb-8 text-4xl leading-tight font-medium tracking-[-0.03em] text-black md:text-5xl">
              Two ways to pay.
            </h2>
            <a
              href={`${APP_URL}/listings`}
              className="inline-flex items-center gap-3 rounded-full bg-black py-2 pr-2 pl-8 text-base font-medium text-white transition-colors duration-200 hover:bg-gray-800"
            >
              Open the shop
              <span className="flex items-center justify-center rounded-full bg-white p-2">
                <ArrowRight aria-hidden className="h-5 w-5 text-black" />
              </span>
            </a>
          </div>
          <p className="text-2xl leading-relaxed font-normal text-black/70 md:text-3xl">
            Creators offer instant, protected, or both.
          </p>
        </div>

        <div data-reveal-group className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div
            className="relative flex min-h-80 flex-col justify-between overflow-hidden rounded-2xl bg-cover bg-center p-7 lg:col-span-2"
            style={{ backgroundImage: "url('/media/protected.webp')" }}
          >
            <p className="relative z-10 text-2xl leading-snug font-medium tracking-[-0.02em] text-black">
              Protected
            </p>
            <p className="relative z-10 max-w-[60%] text-base leading-relaxed text-black/70 sm:max-w-xs">
              The money waits until the prompt arrives. No prompt, money back.
            </p>
          </div>

          {/* Video from the MotionSites "Nexora Features" prompt: a fast glowing
              stream through the dunes, for the path where money moves at once. */}
          <div className="relative flex min-h-80 flex-col justify-between overflow-hidden rounded-2xl bg-[#2B2644] p-7">
            <video
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              poster="/media/instant.jpg"
              aria-hidden
            >
              <source src="/media/instant.mp4" type="video/mp4" />
            </video>
            {/* Darkens top and bottom so the white text stays readable on the
                light dunes, while the glowing stream shows through the middle. */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#2B2644]/80 via-[#2B2644]/10 to-[#2B2644]/85" />
            <p className="relative z-10 text-2xl leading-snug font-medium tracking-[-0.02em] text-white">
              Instant
            </p>
            <p className="relative z-10 text-base leading-relaxed text-white/80">
              Paid straight to the seller. Fast, but final.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
