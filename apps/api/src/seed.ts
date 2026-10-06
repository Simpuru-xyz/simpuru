import { contentHash } from "@simpuru/core/hash";
import { type Db, insertListing, listListings, setHidden } from "./db";

// The catalogue starts empty: creators list what they sell. The platform only keeps the two
// deliberately bad demo sellers below, hidden from the catalogue, so the refund and dispute paths
// can still be staged for the demo (they stay buyable by id).

/**
 * Listings the platform seeded earlier (sample prompts, the first catalogue). They stay in the
 * database for past buyers (unlock still works) but are no longer for sale.
 */
const RETIRED_SEEDS = [
  "orders-dataset-100",
  "landing-copy-pack",
  "cardano-address-regex",
  "aurora-saas-hero",
  "editorial-portfolio-grid",
  "kinetic-pricing-section",
  "lumen-aurora-hero",
  "neura-particle-sphere",
  "orbital-infra-3d",
  "noa-kinetic-type",
  "studio-hard-brutalist",
  "ledgerly-fintech-dashboard",
  "wander-journal-editorial",
  "still-breathing-wellness",
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

/** Hidden from the catalogue: retired seeds and the demo fault listings. */
export const HIDDEN = [...RETIRED_SEEDS, ...Object.keys(DEMO_FAULTS)];

/**
 * Inserts the demo fault listings if missing (owned by `demoSellerAddress`, so their refunds count
 * against that seller's reputation) and hides every platform listing from the catalogue.
 */
export function seed(db: Db, demoSellerAddress: string) {
  // Demo listings created before they had their own seller move to it once.
  for (const d of DEMO)
    db.query("UPDATE listings SET seller_address = ? WHERE id = ? AND seller_address != ?").run(
      demoSellerAddress,
      d.id,
      demoSellerAddress,
    );
  const existing = new Set(listListings(db).map((l) => l.id));
  for (const d of DEMO.filter((x) => !existing.has(x.id))) {
    insertListing(db, {
      ...d,
      modes: [...d.modes],
      sellerAddress: demoSellerAddress,
      contentHash: contentHash(d.content),
    });
  }
  for (const id of HIDDEN) setHidden(db, id, true);
}
