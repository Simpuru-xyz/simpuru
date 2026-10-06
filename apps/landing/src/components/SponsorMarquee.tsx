"use client";

import Image from "next/image";
import { useState } from "react";

type Sponsor = { name: string; src: string; href: string; wordmark?: boolean };

/**
 * What Simpuru is built on, and the event it was built for.
 *
 * Every entry starts as its name set in the hero's serif, so nothing here
 * depends on someone else's trademark file. Drop an official mark into
 * `public/` and point `src` at it; the name stays as the fallback.
 */
const SPONSORS: Sponsor[] = [
  { name: "Cardano", src: "", href: "https://cardano.org" },
  { name: "x402", src: "", href: "https://x402.org" },
  { name: "Masumi", src: "", href: "https://masumi.network" },
  { name: "Blockfrost", src: "", href: "https://blockfrost.io" },
  { name: "TOKEN2049", src: "", href: "https://www.token2049.com" },
];

/**
 * One mark, or its name if the file is not there.
 *
 * The fallback is not a placeholder to be embarrassed about: the wordmark is
 * set in the same face as the rest of the hero, so a missing file reads as a
 * design choice rather than a broken image.
 */
function Mark({ sponsor }: { sponsor: Sponsor }) {
  const [failed, setFailed] = useState(!sponsor.src);

  return (
    <a
      href={sponsor.href}
      target="_blank"
      rel="noreferrer"
      aria-label={sponsor.name}
      className="flex shrink-0 items-center opacity-80 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
    >
      {failed ? (
        <span
          className="text-lg whitespace-nowrap text-white italic sm:text-2xl md:text-3xl"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {sponsor.name}
        </span>
      ) : (
        <Image
          src={sponsor.src}
          alt={sponsor.name}
          width={sponsor.wordmark ? 320 : 96}
          height={96}
          onError={() => setFailed(true)}
          className={
            sponsor.wordmark
              ? "h-6 w-auto sm:h-8"
              : // Square marks with the brand's own colour baked in; the circle
                // crop removes white corners without touching their colours.
                "h-9 w-9 rounded-full object-cover sm:h-11 sm:w-11"
          }
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
      className="flex min-w-full shrink-0 items-center justify-around gap-10 px-5 sm:gap-16 md:gap-20"
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
 * `min-w-full`: a few marks and their gaps are narrower than a desktop screen,
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
