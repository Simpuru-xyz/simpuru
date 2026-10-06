import { contentHash } from "@simpuru/core/hash";
import { type Db, insertListing, listListings } from "./db";

// Deterministic sample dataset, so its hash is stable across machines.
const ordersCsv = () => {
  const rows = ["order_id,city,item,qty,price_ada"];
  const cities = ["Jakarta", "Singapore", "Bandung", "Surabaya", "Yogyakarta"];
  const items = ["sticker", "tote", "poster", "mug", "tee"];
  for (let i = 1; i <= 100; i++) {
    rows.push(`${i},${cities[i % 5]},${items[(i * 3) % 5]},${(i % 4) + 1},${(i % 7) + 2}`);
  }
  return `${rows.join("\n")}\n`;
};

const SEED = [
  {
    id: "orders-dataset-100",
    title: "Sample dataset: 100 synthetic shop orders (CSV)",
    description:
      "Clean CSV for testing analytics agents. Same bytes every time, so the hash proves you got it.",
    priceLovelace: "6000000",
    modes: ["instant", "protected"] as const,
    content: ordersCsv(),
  },
  {
    id: "landing-copy-pack",
    title: "Landing page copy pack: developer tool",
    description: "Hero, three feature blocks and a CTA, ready to paste.",
    priceLovelace: "2000000",
    modes: ["instant"] as const,
    content: [
      "# Ship the boring parts faster",
      "Your stack, minus the glue code.",
      "",
      "## One command setup",
      "From clone to running in under a minute.",
      "## Types end to end",
      "Change the API, see every caller that breaks.",
      "## Logs you can read",
      "Structured, searchable, and quiet until something is wrong.",
      "",
      "[Start building]",
      "",
    ].join("\n"),
  },
  {
    id: "cardano-address-regex",
    title: "Cardano bech32 address checker (TypeScript)",
    description: "A small, tested function that tells mainnet, preprod and stake addresses apart.",
    priceLovelace: "10000000",
    modes: ["protected"] as const,
    content: `export type CardanoAddressKind = "mainnet" | "testnet" | "stake_mainnet" | "stake_testnet" | "invalid";

const BECH32 = "[02-9ac-hj-np-z]";

export function cardanoAddressKind(addr: string): CardanoAddressKind {
  if (new RegExp(\`^addr1\${BECH32}{50,110}$\`).test(addr)) return "mainnet";
  if (new RegExp(\`^addr_test1\${BECH32}{50,110}$\`).test(addr)) return "testnet";
  if (new RegExp(\`^stake1\${BECH32}{50,60}$\`).test(addr)) return "stake_mainnet";
  if (new RegExp(\`^stake_test1\${BECH32}{50,60}$\`).test(addr)) return "stake_testnet";
  return "invalid";
}
`,
  },
];

/** Inserts the sample listings once, owned by `sellerAddress`. */
export function seed(db: Db, sellerAddress: string) {
  if (listListings(db).length > 0) return;
  for (const s of SEED) {
    insertListing(db, {
      ...s,
      modes: [...s.modes],
      sellerAddress,
      contentHash: contentHash(s.content),
    });
  }
}
