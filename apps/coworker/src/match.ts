// Picks the listing a Task asks for: an explicit listing id wins, otherwise the best keyword match
// within the budget the Task states ("max 8 tADA", "budget 10 ADA"; 10 tADA when it says nothing).
import type { Listing } from "@simpuru/core";

const ADA = 1_000_000n;
const STOP = new Set(
  "a an and any are as at be but by can do find for from get give i in is it me my need of on or please prompt some that the this to use want with you your buy".split(
    " ",
  ),
);
const words = (s: string) =>
  s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP.has(w));

export function budgetOf(text: string): bigint {
  const m = text.match(/(?:max|budget|under|up to|below)\D{0,12}(\d+(?:\.\d+)?)\s*t?ada/i);
  return m ? BigInt(Math.round(Number(m[1]) * 1_000_000)) : 10n * ADA;
}

export function pickListing(text: string, listings: Listing[]): Listing | null {
  const budget = budgetOf(text);
  const affordable = listings.filter(
    (l) => BigInt(l.priceLovelace) <= budget && l.modes.includes("protected"),
  );
  const tokens = new Set(text.split(/[\s/?#=,;:]+/));
  const byId = affordable.find((l) => tokens.has(l.id));
  if (byId) return byId;
  const want = new Set(words(text));
  let best: { l: Listing; score: number } | null = null;
  for (const l of affordable) {
    const score = words(`${l.title} ${l.description} ${l.category ?? ""}`).filter((w) =>
      want.has(w),
    ).length;
    if (score > 0 && (!best || score > best.score)) best = { l, score };
  }
  return best?.l ?? null;
}
