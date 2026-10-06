import { readFileSync } from "node:fs";
import { contentHash } from "@simpuru/core/hash";
import { type Db, insertListing, listListings, setHidden } from "./db";

// Design prompts: paste one into a coding agent and it builds the page. The prompt text is what
// is sold (and hashed); `previewMedia` is a free recording of the result, set by the seller.
// Pro-grade prompts (#76). Bodies live in catalog/*.md; each one builds the page in its preview
// recording (apps/web/public/mock), so the card shows exactly what the buyer gets.
const prompt = (file: string) =>
  readFileSync(new URL(`./catalog/${file}.md`, import.meta.url), "utf8");
const preview = (file: string) => `https://app.simpuru.xyz/mock/${file}.webm`;

const PRO = [
  {
    id: "lumen-aurora-hero",
    category: "SaaS" as const,
    title: "Lumen: aurora SaaS hero",
    description:
      "Dark analytics hero lit by a live canvas aurora, gradient headline that slowly pans, glass pills. One HTML file, no images.",
    priceLovelace: "6000000",
    modes: ["instant", "protected"] as const,
    previewMedia: preview("aurora-saas"),
    content: prompt("lumen-aurora-hero"),
  },
  {
    id: "neura-particle-sphere",
    category: "AI" as const,
    title: "NEURA: breathing particle sphere",
    description:
      "4,200-point WebGL sphere that rotates, breathes and tilts to the cursor beside a two-line statement. Raw WebGL, no three.js.",
    priceLovelace: "8000000",
    modes: ["instant", "protected"] as const,
    previewMedia: preview("particle-ai"),
    content: prompt("neura-particle-sphere"),
  },
  {
    id: "orbital-infra-3d",
    category: "3D" as const,
    title: "ORBITAL: planet with three live orbits",
    description:
      "Glowing CSS planet, three tilted SVG orbits whose lights pass behind and in front of it, pointer tilt. No WebGL.",
    priceLovelace: "7000000",
    modes: ["instant", "protected"] as const,
    previewMedia: preview("orbit-3d"),
    content: prompt("orbital-infra-3d"),
  },
  {
    id: "noa-kinetic-type",
    category: "Portfolio" as const,
    title: "Noa Martens: kinetic type portfolio",
    description:
      "Four giant marquee rows (solid, outline, orange) that speed up and skew with your scroll, plus a rotating scroll badge.",
    priceLovelace: "5000000",
    modes: ["instant", "protected"] as const,
    previewMedia: preview("kinetic-type"),
    content: prompt("noa-kinetic-type"),
  },
  {
    id: "studio-hard-brutalist",
    category: "Landing Page" as const,
    title: "Studio Hard: brutalist swap grid",
    description:
      "Flat yellow / black / blue / red grid whose cells hard-cut to new colors and glyphs, over a huge 'WE MAKE LOUD BRANDS'.",
    priceLovelace: "4000000",
    modes: ["instant"] as const,
    previewMedia: preview("brutalist-agency"),
    content: prompt("studio-hard-brutalist"),
  },
  {
    id: "ledgerly-fintech-dashboard",
    category: "Fintech" as const,
    title: "Ledgerly: live fintech dashboard hero",
    description:
      "Light bento of money cards with a live SVG area chart that ticks and morphs, count-up figures, savings bar, FX card.",
    priceLovelace: "6000000",
    modes: ["instant", "protected"] as const,
    previewMedia: preview("fintech-dash"),
    content: prompt("ledgerly-fintech-dashboard"),
  },
  {
    id: "wander-journal-editorial",
    category: "Editorial" as const,
    title: "Wander Journal: sunset magazine cover",
    description:
      "Layered flat-color mountains under a sinking sun, serif headline with an italic line, pointer parallax, film grain.",
    priceLovelace: "3000000",
    modes: ["instant"] as const,
    previewMedia: preview("editorial-travel"),
    content: prompt("wander-journal-editorial"),
  },
  {
    id: "still-breathing-wellness",
    category: "Wellness" as const,
    title: "still.: 4-7-8 breathing circle",
    description:
      "Three sage rings that breathe in a real 4-7-8 rhythm with a guided cue, hold progress ring and pause on Space.",
    priceLovelace: "5000000",
    modes: ["instant", "protected"] as const,
    previewMedia: preview("wellness-calm"),
    content: prompt("still-breathing-wellness"),
  },
];

/** Listings no longer sold (still unlockable for people who bought them). */
export const RETIRED = ["aurora-saas-hero"];

const SEED = [
  ...PRO,
  {
    id: "editorial-portfolio-grid",
    previewMedia: "https://app.simpuru.xyz/mock/editorial-portfolio-grid.webm",
    category: "Portfolio" as const,
    title: "Editorial portfolio grid with hover reveals",
    description:
      "A magazine-style work grid for a designer: oversized serif titles, image cards that reveal the project on hover.",
    priceLovelace: "2000000",
    modes: ["instant"] as const,
    content: prompt("editorial-portfolio-grid"),
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
    content: prompt("kinetic-pricing-section"),
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

/**
 * Inserts every seed and demo listing that is missing. Seed prompts belong to `sellerAddress`;
 * the deliberately bad demo listings to `demoSellerAddress`, so their refunds count against that
 * seller's reputation, not the honest one's.
 */
export function seed(db: Db, sellerAddress: string, demoSellerAddress = sellerAddress) {
  // Demo listings created before they had their own seller move to it once.
  for (const d of DEMO)
    db.query("UPDATE listings SET seller_address = ? WHERE id = ? AND seller_address != ?").run(
      demoSellerAddress,
      d.id,
      demoSellerAddress,
    );
  const existing = new Set(listListings(db).map((l) => l.id));
  for (const id of RETIRED) setHidden(db, id, true);
  // Seed prompts are ours: keep stored text, hash, title and description in step with the source
  // (the two first prompts were rewritten as full specs in #76; their escrows are all closed).
  for (const l of SEED)
    db.query(
      `UPDATE listings SET content = ?, content_hash = ?, title = ?, description = ?
       WHERE id = ? AND content_hash != ?`,
    ).run(l.content, contentHash(l.content), l.title, l.description, l.id, contentHash(l.content));
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
      sellerAddress: s.id in DEMO_FAULTS ? demoSellerAddress : sellerAddress,
      contentHash: contentHash(s.content),
    });
  }
}
