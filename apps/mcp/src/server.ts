// The Simpuru MCP tools. A generic MCP host (Claude Code, Claude Desktop, Cursor) cannot pay an
// x402 402 by itself, so the server pays on the agent's behalf from the wallet it is given, inside
// that buyer's spend limits.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Buyer } from "@simpuru/agent";
import { CATEGORIES, explorerTx, type Listing } from "@simpuru/core";
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
  ...(l.category ? { category: l.category } : {}),
  sales: l.sales ?? 0,
  seller: l.sellerAddress,
  sellerReputation: l.sellerReputation
    ? `${l.sellerReputation.score}/100 from ${l.sellerReputation.basis} closed escrow(s)`
    : "new seller (no closed escrow yet)",
  ...(l.previewMedia ? { preview: l.previewMedia } : {}),
});

export interface ListingFilter {
  query?: string;
  category?: string;
  mode?: "instant" | "protected";
  maxPriceAda?: number;
  /** 0-100; sellers without a closed escrow are left out when set. */
  minReputation?: number;
  sort?: "popular" | "newest" | "price_asc" | "price_desc" | "reputation";
}

/** Catalogue filter + sort behind search_listings. Pure, so it is tested without a server. */
export function filterListings(all: Listing[], f: ListingFilter): Listing[] {
  const q = f.query?.toLowerCase().trim();
  const hits = all.filter(
    (l) =>
      (!q || `${l.title} ${l.description} ${l.category ?? ""}`.toLowerCase().includes(q)) &&
      (!f.category || l.category === f.category) &&
      (!f.mode || l.modes.includes(f.mode)) &&
      (f.maxPriceAda === undefined || Number(l.priceLovelace) <= f.maxPriceAda * 1_000_000) &&
      (f.minReputation === undefined || (l.sellerReputation?.score ?? -1) >= f.minReputation),
  );
  const price = (l: Listing) => Number(l.priceLovelace);
  const by: Record<NonNullable<ListingFilter["sort"]>, (a: Listing, b: Listing) => number> = {
    popular: (a, b) => (b.sales ?? 0) - (a.sales ?? 0),
    newest: (a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0),
    price_asc: (a, b) => price(a) - price(b),
    price_desc: (a, b) => price(b) - price(a),
    reputation: (a, b) => (b.sellerReputation?.score ?? -1) - (a.sellerReputation?.score ?? -1),
  };
  return f.sort ? [...hits].sort(by[f.sort]) : hits;
}

export interface SimpuruMcpOptions {
  buyer: Buyer;
  /** Where listings and purchases are read from. */
  api: string;
  dailyBudgetLovelace: bigint;
  /** Shown by my_purchases, e.g. that a hosted server pays from a shared demo wallet. */
  walletNote?: string;
  /** Hosted, signed-in owner: their agent wallet (my_wallet, withdraw_to_owner). */
  account?: {
    owner: string;
    agentAddress: string;
    maxPerPaymentLovelace: bigint;
    balance: () => Promise<bigint>;
    /** Sends what's left back to the owner; absent for the shared demo wallet. */
    withdrawToOwner?: () => Promise<{ tx: string; lovelace: bigint }>;
  };
}

/** The Simpuru tools on a fresh MCP server; the caller picks the transport (stdio or HTTP). */
export function createSimpuruMcp({
  buyer,
  api,
  dailyBudgetLovelace,
  walletNote,
  account,
}: SimpuruMcpOptions) {
  const mcp = new McpServer({ name: "simpuru", version: "0.1.0" });

  mcp.registerTool(
    "search_listings",
    {
      title: "Search the Simpuru catalogue",
      description:
        "Free. Design prompts for sale on Simpuru (Cardano preprod). Filter by words, category, delivery mode, max price or seller reputation (0-100, from on-chain escrow outcomes: share of the seller's closed escrows where the buyer was not refunded), and sort.",
      inputSchema: {
        query: z.string().optional().describe("Words to match in title, description or category"),
        category: z.enum(CATEGORIES).optional(),
        mode: z
          .enum(["instant", "protected"])
          .optional()
          .describe("Only listings offering this mode"),
        maxPriceAda: z.number().positive().optional().describe("Highest price in ADA"),
        minReputation: z
          .number()
          .min(0)
          .max(100)
          .optional()
          .describe("Lowest seller reputation; new sellers are excluded when set"),
        sort: z.enum(["popular", "newest", "price_asc", "price_desc", "reputation"]).optional(),
      },
      annotations: { readOnlyHint: true },
    },
    async (filter) => {
      const res = await fetch(`${api}/listings`);
      if (!res.ok) return fail(`catalogue unavailable (HTTP ${res.status})`);
      const hits = filterListings((await res.json()) as Listing[], filter);
      return text(hits.length ? hits.map(summary) : "No listing matches these filters.");
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

  if (account) {
    mcp.registerTool(
      "my_wallet",
      {
        title: "My agent wallet",
        description:
          "Free. The wallet this agent spends from: its address (send tADA here to fund it), balance, limits and owner.",
        annotations: { readOnlyHint: true },
      },
      async () =>
        text({
          owner: account.owner,
          agentWallet: account.agentAddress,
          balance: ada(await account.balance()),
          maxPerPurchase: ada(account.maxPerPaymentLovelace),
          dailyBudget: ada(dailyBudgetLovelace),
          spentToday: ada(buyer.spentToday()),
          fund: "Send preprod tADA to agentWallet from your own wallet or the Cardano preprod faucet.",
        }),
    );
    if (account.withdrawToOwner) {
      const withdraw = account.withdrawToOwner;
      mcp.registerTool(
        "withdraw_to_owner",
        {
          title: "Send the agent wallet back to its owner",
          description:
            "Moves everything left in the agent wallet (minus a small fee reserve) back to the owner's own wallet.",
          annotations: { destructiveHint: false, idempotentHint: false },
        },
        async () => {
          try {
            const r = await withdraw();
            return text({ sent: ada(r.lovelace), to: account.owner, tx: explorerTx(r.tx) });
          } catch (error) {
            return fail(`Withdraw failed: ${String(error).slice(0, 200)}`);
          }
        },
      );
    }
  }

  return mcp;
}
