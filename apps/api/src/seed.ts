import { contentHash } from "@simpuru/core/hash";
import { type Db, insertListing, listListings } from "./db";

// Design prompts: paste one into a coding agent and it builds the page. The prompt text is what
// is sold (and hashed); `previewMedia` is a free recording of the result, set by the seller.
const SEED = [
  {
    id: "aurora-saas-hero",
    previewMedia: "https://app.simpuru.xyz/mock/aurora-saas.webm",
    category: "Hero" as const,
    title: "Aurora SaaS hero with a slow gradient sky",
    description:
      "A dark landing hero: drifting aurora gradient, a glass nav, one headline, two CTAs. Built for a dev-tool launch.",
    priceLovelace: "6000000",
    modes: ["instant", "protected"] as const,
    content: `Build a landing page hero section for a developer tool called "Northwind".

Stack: one HTML file, Tailwind via CDN, no JavaScript framework. Must work at 375px and 1440px.

Background: near-black (#07080c). Behind everything, three large blurred blobs (teal #2dd4bf, violet #8b5cf6, blue #3b82f6) at 35% opacity, filter blur(120px), drifting on separate 18-26 s CSS keyframe loops (translate and scale only, ease-in-out, alternate). Respect prefers-reduced-motion: no drift.

Nav: sticky, 64px tall, glass effect (white/5 background, backdrop-blur-md, a 1px white/10 bottom border). Wordmark left, four links center (Docs, Pricing, Changelog, Blog), "Sign in" ghost button right.

Hero copy, centered, max-width 760px:
- small pill above the headline: "v2.0 is live" with a pulsing teal dot
- headline, 64px desktop / 40px mobile, tight leading, white: "Ship the boring parts faster"
- subline, 18px, white/60: "Northwind writes the glue code between your services so your team can work on the product."
- two buttons: primary white with black text "Start free", secondary white/10 with a border "Read the docs"

Below the buttons, a 1200px wide product screenshot placeholder: rounded-2xl, 1px white/10 border, a soft teal glow underneath (box-shadow), tilted 8 degrees on the X axis with perspective, straightening to 0 on scroll into view (IntersectionObserver, 600 ms ease-out).

Typography: Inter from Google Fonts. Contrast must pass WCAG AA for all text.
`,
  },
  {
    id: "editorial-portfolio-grid",
    previewMedia: "https://app.simpuru.xyz/mock/editorial-portfolio-grid.webm",
    category: "Portfolio" as const,
    title: "Editorial portfolio grid with hover reveals",
    description:
      "A magazine-style work grid for a designer: oversized serif titles, image cards that reveal the project on hover.",
    priceLovelace: "2000000",
    modes: ["instant"] as const,
    content: `Build a portfolio "Selected work" section for an independent designer.

Stack: one HTML file, plain CSS (no framework), a few lines of vanilla JS at most.

Layout: warm off-white page (#f4f1ea), ink text (#151412). A 12-column grid with 24px gutters, max-width 1320px. The section title "Selected work, 2021-2026" is set in Fraunces at 96px desktop / 48px mobile, weight 300, letter-spacing -0.02em, spanning all 12 columns.

Six project cards in an asymmetric rhythm: row 1 spans 7 + 5 columns, row 2 spans 4 + 4 + 4, row 3 spans 12 (wide). Each card:
- an image area with a fixed aspect ratio (4:5 for narrow cards, 16:9 for the wide one), using a solid color placeholder per project
- below it: project name in Fraunces 28px, then client and year in a 13px uppercase mono (JetBrains Mono), letter-spacing 0.08em

Hover (pointer devices only, @media (hover: hover)): the image scales to 1.04 over 500 ms with a cubic-bezier(.2,.7,.2,1); a caption panel slides up from the bottom of the image with a one-line project summary; the cursor becomes a 72px black circle with the word "View" (a custom cursor div that follows the pointer with a slight lag).

On touch devices the caption is always visible under the image instead.

Focus states must be visible for keyboard users; every card is a link with a meaningful accessible name.
`,
  },
  {
    id: "kinetic-pricing-section",
    previewMedia: "https://app.simpuru.xyz/mock/kinetic-pricing-section.webm",
    category: "SaaS" as const,
    title: "Kinetic pricing section with a monthly/yearly toggle",
    description:
      "Three pricing tiers, an animated billing toggle, numbers that roll when the price changes, a highlighted middle plan.",
    priceLovelace: "10000000",
    modes: ["protected"] as const,
    content: `Build a pricing section with three tiers and a monthly / yearly toggle.

Stack: React + TypeScript + Tailwind, a single component file "Pricing.tsx" with no extra dependencies.

Toggle: a pill switch centered above the cards, labels "Monthly" and "Yearly (save 20%)". The active background is a sliding thumb that moves with a spring-like transition (CSS transition 350 ms, cubic-bezier(.34,1.56,.64,1)). It is a real radio group: arrow keys switch, the state is announced to screen readers.

Tiers (monthly / yearly per month):
- Starter: $0 / $0 — 1 project, community support
- Team: $24 / $19 — unlimited projects, 10 seats, priority support (highlighted)
- Scale: $79 / $63 — SSO, audit log, 99.9% SLA, dedicated support

Cards: equal height, rounded-3xl, 1px border. The highlighted Team card is lifted 12px, has a 2px gradient border (indigo to fuchsia, done with a background-clip trick, not an image) and a "Most popular" badge.

Price animation: when the billing period changes, each price rolls to its new value digit by digit like an odometer (each digit is a vertical strip of 0-9 translated with transform, 400 ms, digits staggered by 40 ms). With prefers-reduced-motion the value just swaps.

Each card ends with a full-width button; feature lists use check icons drawn as inline SVG. Mobile: cards stack, the highlighted card comes first.
`,
  },
];

// Two deliberately bad sellers, so the protection paths can be shown on preprod.
// The listing commits to the real content; what happens at delivery is the fault.
export const DEMO_FAULTS: Record<string, "no_delivery" | "wrong_file"> = {
  "demo-no-delivery": "no_delivery",
  "demo-wrong-file": "wrong_file",
};
const DEMO = [
  {
    id: "demo-no-delivery",
    category: "Landing Page" as const,
    title: "Demo: a seller who never delivers",
    description:
      "Protected only. The seller takes the order and never posts a result, so the buyer is refunded.",
    priceLovelace: "5000000",
    modes: ["protected"] as const,
    content: "The file you would have received.\n",
  },
  {
    id: "demo-wrong-file",
    category: "Landing Page" as const,
    title: "Demo: a seller who delivers the wrong file",
    description:
      "Protected only. The seller delivers something else than it listed, so the buyer disputes.",
    priceLovelace: "5000000",
    modes: ["protected"] as const,
    content: "The file that was listed.\n",
  },
];

/** What the seller actually hands over: the content, unless the listing is a demo fault. */
export function deliveredContent(listing: { id: string; content: string }) {
  const fault = DEMO_FAULTS[listing.id];
  if (fault === "no_delivery") return "";
  if (fault === "wrong_file") return "Not the file that was listed.\n";
  return listing.content;
}

/** Inserts every seed and demo listing that is missing, owned by `sellerAddress`. */
export function seed(db: Db, sellerAddress: string) {
  const existing = new Set(listListings(db).map((l) => l.id));
  // Listings seeded before categories existed get theirs once.
  for (const s of [...SEED, ...DEMO])
    db.query("UPDATE listings SET category = ? WHERE id = ? AND category IS NULL").run(
      s.category,
      s.id,
    );
  // Previews arrived after the first seed too.
  for (const s of SEED)
    db.query("UPDATE listings SET preview_media = ? WHERE id = ? AND preview_media IS NULL").run(
      s.previewMedia,
      s.id,
    );
  const rows = [...SEED, ...DEMO].filter((d) => !existing.has(d.id));
  for (const s of rows) {
    insertListing(db, {
      ...s,
      modes: [...s.modes],
      sellerAddress,
      contentHash: contentHash(s.content),
    });
  }
}
