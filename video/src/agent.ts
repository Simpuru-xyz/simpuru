// The Claude Code conversation shown in the film (a replay of a real MCP purchase).
import { short, TX } from "./theme";
import type { Line } from "./ui";

export const AGENT: Line[] = [
  {
    text: "Find me a landing page prompt on Simpuru. Only from sellers with a reputation of 80 or more, under 10 tADA, and buy it with buyer protection.",
    kind: "prompt",
  },
  {
    text: '● simpuru · search_listings  query: "landing"  minReputation: 80  maxPriceAda: 10',
    kind: "tool",
  },
  {
    text: "  OYLA · Landing Page · 5 tADA · instant, protected · seller 100/100 from 3 closed escrows",
    kind: "out",
  },
  { text: "  sellers under 80 filtered out", kind: "dim" },
  {
    text: "OYLA fits: its seller was paid out on 3 escrows and refunded none. Checking it before paying.",
    kind: "agent",
  },
  { text: '● simpuru · get_listing  id: "2c913748…"', kind: "tool" },
  {
    text: "  content hash c0ee84f5…001fc · protected path: escrow, refund if not delivered",
    kind: "out",
  },
  { text: "● simpuru · my_wallet", kind: "tool" },
  { text: "  Simpuru wallet 15.8 tADA · limit 10 tADA per purchase, 30 tADA a day", kind: "out" },
  { text: '● simpuru · buy_listing  id: "2c913748…"  mode: "protected"', kind: "tool" },
  { text: `  paid 5 tADA into escrow · tx ${short(TX.oylaLock)}`, kind: "out" },
  { text: "  content matches the hash the seller committed to ✓", kind: "ok" },
  { text: '● simpuru · get_purchase_status  tx: "3219a522…"', kind: "tool" },
  {
    text: "  FundsLocked · the seller must post the result within 11 min, or the refund is automatic",
    kind: "out",
  },
  {
    text: 'Bought OYLA with buyer protection. Your prompt: "Build a luxury handcrafted jewelry landing page…"',
    kind: "agent",
  },
  { text: "Buy it again.", kind: "prompt" },
  { text: '● simpuru · buy_listing  id: "2c913748…"', kind: "tool" },
  { text: "  alreadyPaid: true · paidNow: 0 tADA", kind: "ok" },
];
