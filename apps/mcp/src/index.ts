// Simpuru MCP server (stdio). Runs next to the agent and holds the agent's own wallet, because a
// generic MCP host (Claude Code, Claude Desktop, Cursor) cannot pay an x402 402 by itself.
// Never write to stdout here: it is the MCP transport.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buyerFromEnv } from "@simpuru/agent";
import { explorerTx, type Listing } from "@simpuru/core";
import { z } from "zod";

const buyer = buyerFromEnv();
const api = process.env.SIMPURU_API_URL ?? "http://localhost:4021";
const ada = (lovelace: string | bigint) => `${Number(lovelace) / 1_000_000} tADA`;
const when = (ms: string) => new Date(Number(ms)).toISOString();
const text = (value: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
    },
  ],
});
const fail = (message: string) => ({ ...text(message), isError: true });

const summary = (l: Listing) => ({
  id: l.id,
  title: l.title,
  description: l.description,
  price: ada(l.priceLovelace),
  modes: l.modes,
  contentHash: l.contentHash,
});

const mcp = new McpServer({ name: "simpuru", version: "0.1.0" });

mcp.registerTool(
  "search_listings",
  {
    title: "Search the Simpuru catalogue",
    description:
      "Free. Lists digital goods for sale on Simpuru (Cardano preprod), optionally filtered by a search term.",
    inputSchema: {
      query: z.string().optional().describe("Words to match in title or description"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ query }) => {
    const res = await fetch(`${api}/listings`);
    if (!res.ok) return fail(`catalogue unavailable (HTTP ${res.status})`);
    const q = query?.toLowerCase().trim();
    const all = (await res.json()) as Listing[];
    const hits = q
      ? all.filter((l) => `${l.title} ${l.description}`.toLowerCase().includes(q))
      : all;
    return text(hits.map(summary));
  },
);

mcp.registerTool(
  "get_listing",
  {
    title: "Get one listing",
    description:
      "Free. Details of one listing, including the content hash the seller committed to.",
    inputSchema: { id: z.string().describe("Listing id from search_listings") },
    annotations: { readOnlyHint: true },
  },
  async ({ id }) => {
    const l = await buyer.getListing(id);
    return l ? text(summary(l)) : fail(`listing ${id} not found`);
  },
);

mcp.registerTool(
  "buy_listing",
  {
    title: "Buy a listing",
    description: [
      "Spends real (test) ADA from the agent's wallet. Pays over x402 and returns the content.",
      "mode 'protected' pays into an escrow: the money only reaches the seller if delivery checks out,",
      "otherwise it is refunded. mode 'instant' pays the seller directly (cheaper, no refund).",
      "Refused if it would exceed the per-payment cap or today's budget.",
    ].join(" "),
    inputSchema: {
      id: z.string().describe("Listing id from search_listings"),
      mode: z.enum(["instant", "protected"]).default("protected"),
    },
    annotations: { destructiveHint: false, idempotentHint: false },
  },
  async ({ id, mode }) => {
    const r = await buyer.buy(id, mode);
    if (!r.ok) return fail(`Not paid: ${r.error}`);
    const { record } = r;
    return text({
      paid: ada(record.priceLovelace),
      mode,
      tx: explorerTx(record.txHash),
      seconds: r.seconds,
      contentMatchesListing: record.receivedContentHash === record.listingContentHash,
      ...(record.escrow
        ? {
            protection: {
              escrow: record.escrow.address,
              sellerMustDeliverBy: when(record.escrow.deadlines.submitResult),
              refundIfNoDeliveryAfter: when(record.escrow.deadlines.submitResult),
              disputeWindowEnds: when(record.escrow.deadlines.unlock),
            },
          }
        : {}),
      content: r.content,
    });
  },
);

mcp.registerTool(
  "my_purchases",
  {
    title: "My purchases and budget",
    description: "Free. What this agent has bought, and how much of today's budget is left.",
    annotations: { readOnlyHint: true },
  },
  async () =>
    text({
      wallet: buyer.address,
      spentToday: ada(buyer.spentToday()),
      dailyBudget: ada(process.env.DAILY_BUDGET_LOVELACE ?? "50000000"),
      purchases: buyer.purchases().map((p) => ({
        at: p.at,
        listingId: p.listingId,
        mode: p.mode,
        paid: ada(p.priceLovelace),
        tx: explorerTx(p.txHash),
        contentMatchesListing: p.receivedContentHash === p.listingContentHash,
      })),
    }),
);

await mcp.connect(new StdioServerTransport());
