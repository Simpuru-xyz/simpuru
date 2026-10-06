// The Simpuru MCP tools. A generic MCP host (Claude Code, Claude Desktop, Cursor) cannot pay an
// x402 402 by itself, so the server pays on the agent's behalf from the wallet it is given, inside
// that buyer's spend limits.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Buyer } from "@simpuru/agent";
import { explorerTx, type Listing } from "@simpuru/core";
import { z } from "zod";

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
  ...(l.previewMedia ? { preview: l.previewMedia } : {}),
});

export interface SimpuruMcpOptions {
  buyer: Buyer;
  /** Where listings and purchases are read from. */
  api: string;
  dailyBudgetLovelace: bigint;
  /** Shown by my_purchases, e.g. that a hosted server pays from a shared demo wallet. */
  walletNote?: string;
}

/** The Simpuru tools on a fresh MCP server; the caller picks the transport (stdio or HTTP). */
export function createSimpuruMcp({
  buyer,
  api,
  dailyBudgetLovelace,
  walletNote,
}: SimpuruMcpOptions) {
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
        "Refused if it would exceed the per-payment cap or today's budget. Never pays twice for the same listing.",
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
      if (r.redelivered)
        return text({
          alreadyPaid: true,
          tx: explorerTx(r.txHash),
          paidNow: "0 tADA",
          content: r.content,
        });
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
        dailyBudget: ada(dailyBudgetLovelace),
        ...(walletNote ? { note: walletNote } : {}),
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

  mcp.registerTool(
    "get_purchase_status",
    {
      title: "Purchase status",
      description:
        "Free. Where a purchase is now: escrow state, every on-chain step with its tx, and the next deadline.",
      inputSchema: { tx: z.string().describe("The payment or lock tx hash from buy_listing") },
      annotations: { readOnlyHint: true },
    },
    async ({ tx }) => {
      const id = tx.replace(/^.*\/transaction\//, "");
      const res = await fetch(`${api}/purchases/${encodeURIComponent(id)}`);
      if (res.status === 404) return fail(`no purchase ${id} on record`);
      if (!res.ok) return fail(`purchase lookup failed (HTTP ${res.status})`);
      const p = (await res.json()) as {
        status: string;
        events: { status: string; txHash: string }[];
        escrow?: { deadlines: Record<string, string> };
      };
      return text({
        status: p.status,
        steps: p.events.map((e) => ({ status: e.status, tx: explorerTx(e.txHash) })),
        ...(p.escrow
          ? {
              deadlines: Object.fromEntries(
                Object.entries(p.escrow.deadlines).map(([k, v]) => [k, v ? when(v) : ""]),
              ),
            }
          : {}),
      });
    },
  );

  return mcp;
}
