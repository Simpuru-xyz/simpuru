"use client";

import { useState } from "react";

type Sponsor = { name: string; src: string; href: string; height: string };

/**
 * What Simpuru is built on, and the event it was built for.
 *
 * Wordmarks are the brands' own files, downloaded from their sites into
 * public/logos. They come in different colours (and TOKEN2049's is white), so
 * every mark is flattened to one dark tone: legible on the light hero and
 * nobody's colours clash with the page. `height` evens out their proportions.
 */
const SPONSORS: Sponsor[] = [
  { name: "Cardano", src: "/logos/cardano.svg", href: "https://cardano.org", height: "h-6 sm:h-7" },
  { name: "x402", src: "/logos/x402.svg", href: "https://x402.org", height: "h-8 sm:h-10" },
  {
    name: "Masumi",
    src: "/logos/masumi.webp",
    href: "https://masumi.network",
    height: "h-5 sm:h-6",
  },
  {
    name: "Blockfrost",
    src: "/logos/blockfrost.svg",
    href: "https://blockfrost.io",
    height: "h-6 sm:h-7",
  },
  {
    name: "TOKEN2049",
    src: "/logos/token2049.png",
    href: "https://www.token2049.com",
    height: "h-4 sm:h-5",
  },
];

/** One mark, or its name in the same dark tone if the file fails to load. */
function Mark({ sponsor }: { sponsor: Sponsor }) {
  const [failed, setFailed] = useState(false);

  return (
    <a
      href={sponsor.href}
      target="_blank"
      rel="noreferrer"
      aria-label={sponsor.name}
      className="flex shrink-0 items-center opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
    >
      {failed ? (
        <span className="text-lg font-medium whitespace-nowrap text-[#141414] sm:text-2xl">
          {sponsor.name}
        </span>
      ) : (
        // A plain img on purpose: SVG and WebP marks need no optimizer, and
        // w-auto keeps each one at its own aspect ratio.
        // biome-ignore lint/performance/noImgElement: static wordmarks, see above
        <img
          src={sponsor.src}
          alt={sponsor.name}
          onError={() => setFailed(true)}
          className={`${sponsor.height} w-auto brightness-0`}
        />
      )}
    </a>
  );
}

/** One pass of the marks, spread across at least the full width of the screen. */
function Half({ hidden }: { hidden: boolean }) {
  return (
    <div
      aria-hidden={hidden || undefined}
      className="flex min-w-[100vw] shrink-0 items-center justify-around gap-8 px-4 sm:gap-16 md:gap-20"
    >
      {SPONSORS.map((sponsor) => (
        <Mark key={sponsor.name} sponsor={sponsor} />
      ))}
    </div>
  );
}

/**
 * A row that never ends, and never leaves a gap.
 *
 * Two identical halves translated by exactly half the track, so the seam
 * between the last mark and the first is invisible. Each half carries
 * `min-w-[100vw]` (not `min-w-full`, which resolves against the content-sized track): a few marks and their gaps are narrower than a desktop screen,
 * so without it the right side of the row would sit empty.
 *
 * The copy is `aria-hidden`, so a screen reader hears each name once.
 */
export default function SponsorMarquee() {
  return (
    <div className="w-full overflow-hidden">
      <div className="animate-marquee flex w-max items-center">
        <Half hidden={false} />
        <Half hidden />
      </div>
    </div>
  );
}
