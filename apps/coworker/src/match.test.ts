import { expect, test } from "bun:test";
import type { Listing } from "@simpuru/core";
import { budgetOf, pickListing } from "./match";

const l = (id: string, title: string, price: number, over: Partial<Listing> = {}): Listing => ({
  id,
  title,
  description: "",
  priceLovelace: String(price * 1_000_000),
  sellerAddress: "addr_test1x",
  modes: ["instant", "protected"],
  contentHash: "0".repeat(64),
  ...over,
});
const shop = [
  l("id-aurora", "Aurora SaaS hero", 6),
  l("id-grid", "Editorial portfolio grid", 5),
  l("id-luxury", "Luxury SaaS hero with video", 25),
  l("id-pricing", "Pricing table", 5, { modes: ["instant"] }),
];

test("budget", () => {
  expect(budgetOf("max 8 tADA")).toBe(8_000_000n);
  expect(budgetOf("Budget: 12.5 ADA")).toBe(12_500_000n);
  expect(budgetOf("a hero please")).toBe(10_000_000n);
});

test("best keyword match within budget", () => {
  expect(pickListing("I need a SaaS landing hero, max 10 tADA", shop)?.id).toBe("id-aurora");
  expect(pickListing("portfolio grid for a photographer", shop)?.id).toBe("id-grid");
});

test("explicit id, protected only, nothing found", () => {
  expect(pickListing("buy listing id-grid please", shop)?.id).toBe("id-grid");
  expect(pickListing("a pricing table", shop)).toBeNull();
  expect(pickListing("luxury hero with video", shop)?.id).not.toBe("id-luxury");
  expect(pickListing("a wedding invitation", shop)).toBeNull();
});
