import { expect, test } from "bun:test";
import type { Listing } from "@simpuru/core";
import { filterListings } from "./server";

const l = (id: string, over: Partial<Listing>): Listing => ({
  id,
  title: id,
  description: "",
  priceLovelace: "5000000",
  sellerAddress: "addr_test1x",
  modes: ["instant"],
  contentHash: "0".repeat(64),
  ...over,
});
const all = [
  l("trusted", {
    category: "Hero",
    sales: 9,
    priceLovelace: "8000000",
    sellerReputation: { score: 95, basis: 20 },
    modes: ["instant", "protected"],
    createdAt: "1",
  }),
  l("shaky", {
    category: "Hero",
    sales: 30,
    priceLovelace: "3000000",
    sellerReputation: { score: 40, basis: 5 },
    createdAt: "3",
  }),
  l("newbie", { category: "SaaS", sales: 0, priceLovelace: "2000000", createdAt: "2" }),
];
const ids = (xs: Listing[]) => xs.map((x) => x.id);

test("min reputation drops low and unrated sellers", () => {
  expect(ids(filterListings(all, { minReputation: 80 }))).toEqual(["trusted"]);
});

test("category, mode and max price combine", () => {
  expect(ids(filterListings(all, { category: "Hero", maxPriceAda: 5 }))).toEqual(["shaky"]);
  expect(ids(filterListings(all, { mode: "protected" }))).toEqual(["trusted"]);
});

test("sorts", () => {
  expect(ids(filterListings(all, { sort: "popular" }))).toEqual(["shaky", "trusted", "newbie"]);
  expect(ids(filterListings(all, { sort: "price_asc" }))).toEqual(["newbie", "shaky", "trusted"]);
  expect(ids(filterListings(all, { sort: "reputation" }))).toEqual(["trusted", "shaky", "newbie"]);
  expect(ids(filterListings(all, { sort: "newest" }))).toEqual(["shaky", "newbie", "trusted"]);
});

test("query matches category too", () => {
  expect(ids(filterListings(all, { query: "saas" }))).toEqual(["newbie"]);
});
