import type { ListingView } from "@/lib/api";

const day = 86_400_000;
const at = (daysAgo: number) => String(Date.UTC(2026, 9, 6) - daysAgo * day);
const hash = (n: number) => n.toString(16).padStart(2, "0").repeat(32);
const seller = (seed: string) => `addr_test1q${seed.repeat(60).slice(0, 98)}`;
const NOA = seller("n0a");
const KAI = seller("ka1");
const MIRA = seller("m1ra");
const DEX = seller("d3x");
const SOL = seller("s0l");

type Draft = Omit<ListingView, "contentHash" | "previewMedia">;

// ponytail: mock catalogue in the exact shape proposed for GET /listings on #46. Previews are our
// own recordings of each prompt's output, in public/mock.
const DRAFTS: Draft[] = [
  {
    id: "aurora-saas",
    title: "Aurora SaaS",
    description:
      "Dark SaaS hero with drifting aurora blobs, gradient headline, glass nav and a two-button CTA.",
    category: "SaaS",
    sellerAddress: NOA,
    priceLovelace: "5000000",
    modes: ["instant", "protected"],
    sales: 1240,
    createdAt: at(12),
    sellerReputation: { score: 98, basis: 212 },
  },
  {
    id: "kinetic-type",
    title: "Kinetic Portfolio",
    description:
      "Four rows of oversized type marqueeing in opposite directions, outline and accent rows, rotating scroll badge.",
    category: "Portfolio",
    sellerAddress: MIRA,
    priceLovelace: "3000000",
    modes: ["instant"],
    sales: 860,
    createdAt: at(4),
    sellerReputation: { score: 100, basis: 34 },
  },
  {
    id: "orbit-3d",
    title: "Orbital",
    description:
      "A glowing core with three tilted rings orbiting in 3D, each carrying a light. Pure CSS, no WebGL.",
    category: "3D",
    sellerAddress: KAI,
    priceLovelace: "6000000",
    modes: ["instant", "protected"],
    sales: 532,
    createdAt: at(20),
    sellerReputation: { score: 95, basis: 87 },
  },
  {
    id: "fintech-dash",
    title: "Ledgerly Fintech",
    description:
      "Light fintech hero: balance card with a chart that draws itself, savings bar, card and FX tiles staggering in.",
    category: "Fintech",
    sellerAddress: DEX,
    priceLovelace: "5000000",
    modes: ["protected"],
    sales: 418,
    createdAt: at(2),
    sellerReputation: { score: 88, basis: 151 },
  },
  {
    id: "particle-ai",
    title: "Neura Particles",
    description:
      "Black AI hero with a 1,400-point particle sphere rotating on canvas, depth-shaded in blue to violet.",
    category: "AI",
    sellerAddress: KAI,
    priceLovelace: "8000000",
    modes: ["instant", "protected"],
    sales: 1903,
    createdAt: at(30),
    sellerReputation: { score: 95, basis: 87 },
  },
  {
    id: "editorial-travel",
    title: "Wander Editorial",
    description:
      "Sunset sky, parallax mountain layers and a serif headline that settles in. Built for long-form travel stories.",
    category: "Editorial",
    sellerAddress: SOL,
    priceLovelace: "2000000",
    modes: ["instant"],
    sales: 77,
    createdAt: at(1),
    // A new seller with no settled sale yet: the API leaves reputation out.
  },
  {
    id: "brutalist-agency",
    title: "Studio Hard",
    description:
      "Yellow brutalist grid with blocks flipping colour on a beat, mono labels and a jittering headline.",
    category: "Landing Page",
    sellerAddress: NOA,
    priceLovelace: "4000000",
    modes: ["instant"],
    sales: 655,
    createdAt: at(8),
    sellerReputation: { score: 98, basis: 212 },
  },
  {
    id: "wellness-calm",
    title: "Still Breathing",
    description:
      "Three soft circles breathing in sequence behind a calm serif title, timed to a four-second inhale.",
    category: "Wellness",
    sellerAddress: MIRA,
    priceLovelace: "2000000",
    modes: ["instant"],
    sales: 291,
    createdAt: at(15),
    sellerReputation: { score: 100, basis: 34 },
  },
];

const MOCK: ListingView[] = DRAFTS.map((d, i) => ({
  ...d,
  contentHash: hash(i + 1),
  previewMedia: `/mock/${d.id}.webm`,
}));

/** Same contract as `fetchListings`. Swap the body for it once the API ships #46. */
export const fetchCatalogue = async (): Promise<ListingView[]> => MOCK;

/** Same contract as `fetchListing`: null for an unknown id (the API answers 404). */
export const fetchCatalogueItem = async (id: string): Promise<ListingView | null> =>
  MOCK.find((l) => l.id === id) ?? null;

/** 1903 → "1.9k". */
export const compact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);
