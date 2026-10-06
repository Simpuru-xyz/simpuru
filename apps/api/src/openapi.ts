// OpenAPI 3.1 description of every Simpuru backend endpoint, served at /openapi.json and rendered
// at /docs. openapi.test.ts fails if an API route is missing here.
import { CATEGORIES } from "@simpuru/core";

const json = (schema: object) => ({ "application/json": { schema } });
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const error = (description: string) => ({ description, content: json(ref("Error")) });
const lovelace = {
  type: "string",
  pattern: "^[0-9]+$",
  description: "Amount in lovelace (1 tADA = 1,000,000).",
};
const txHash = {
  type: "string",
  pattern: "^[0-9a-f]{64}$",
  description: "Cardano transaction hash.",
};
const hash = { type: "string", pattern: "^[0-9a-f]{64}$", description: "Lowercase hex SHA-256." };
const idParam = (description: string) => ({
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string" },
  description,
});

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Simpuru API",
    version: "0.1.0",
    summary: "Buyer protection for AI agents paying with x402 on Cardano (preprod).",
    description: [
      "Sellers list design prompts; each listing commits to the SHA-256 of its content.",
      "Buyers (people or agents) pay over **x402** on Cardano preprod, either **instant** (pay the seller)",
      "or **protected** (lock into our `vested_pay` escrow, released only if delivery checks out).",
      "",
      "Consumers: the web app (`apps/web`), the buyer agent and protection watcher (`apps/agent`), the MCP",
      "server (`apps/mcp`, hosted at `/mcp`), and the arbiter service (`apps/arbiter`, internal).",
      "",
      "Every on-chain claim can be checked on `https://preprod.cardanoscan.io/transaction/<hash>`.",
    ].join("\n"),
    license: { name: "MIT" },
  },
  servers: [
    { url: "https://api.simpuru.xyz", description: "Production (Cardano preprod)" },
    { url: "http://localhost:4021", description: "Local `bun run dev` in apps/api" },
  ],
  tags: [
    { name: "Catalogue", description: "Free listing data." },
    { name: "Paid content", description: "The x402 paywall: instant or escrow-protected." },
    {
      name: "Purchases",
      description: "Purchase timelines, derived from chain by the seller agent.",
    },
    {
      name: "MCP",
      description: "Model Context Protocol endpoint for agents (Claude Code, Cursor, ...).",
    },
    {
      name: "Arbiter (internal)",
      description: "Dispute settlement service, `apps/arbiter`, port 4023. Not public.",
    },
    { name: "System" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "Liveness",
        operationId: "health",
        responses: {
          200: {
            description: "Up",
            content: json({
              type: "object",
              properties: { ok: { const: true }, network: { const: "preprod" } },
              required: ["ok", "network"],
            }),
          },
        },
      },
    },
    "/listings": {
      get: {
        tags: ["Catalogue"],
        summary: "List the catalogue",
        description:
          "All listings with sales and seller reputation. Never includes the paid content.",
        operationId: "listListings",
        responses: {
          200: { description: "Listings", content: json({ type: "array", items: ref("Listing") }) },
        },
      },
      post: {
        tags: ["Catalogue"],
        summary: "Create a listing",
        description:
          "The API stores the content and returns its SHA-256 as `contentHash`; protected quotes commit to it. No seller auth yet.",
        operationId: "createListing",
        requestBody: { required: true, content: json(ref("NewListing")) },
        responses: {
          201: { description: "Created", content: json(ref("Listing")) },
          400: error("Invalid input; `error` says which field"),
        },
      },
    },
    "/listings/{id}": {
      get: {
        tags: ["Catalogue"],
        summary: "Get one listing",
        operationId: "getListing",
        parameters: [idParam("Listing id")],
        responses: {
          200: { description: "Listing", content: json(ref("Listing")) },
          404: error("Unknown listing"),
        },
      },
    },
    "/listings/{id}/unlock": {
      get: {
        tags: ["Paid content"],
        summary: "Get the content (x402 paywall)",
        description: [
          "**Unpaid:** `402` with a base64 JSON `PAYMENT-REQUIRED` header listing up to two options:",
          "- `default` (**instant**): pay `listing.sellerAddress` directly.",
          "- `masumi` (**protected**): lock into our escrow under a seller-signed quote whose `input_hash` commits to",
          "  `{ listingId, contentHash }`. Deadlines: refund ≥ ~16 min, seller paid ≥ ~31 min, arbiter ≥ ~46 min.",
          "",
          "**Paid retry:** send the signed Cardano transaction in `PAYMENT-SIGNATURE` (an x402 client such as",
          "`@x402/fetch` + `@x402/cardano` does this). The in-process facilitator verifies, the content is returned,",
          "then the tx is broadcast; `PAYMENT-RESPONSE` carries the settlement (tx hash). Takes ~20-60 s.",
          "",
          "**Returning buyer:** send `X-Simpuru-Proof` instead to get content already paid for, without paying again.",
        ].join("\n"),
        operationId: "unlockListing",
        parameters: [
          idParam("Listing id"),
          {
            name: "PAYMENT-SIGNATURE",
            in: "header",
            required: false,
            schema: { type: "string" },
            description: "x402 payment payload (base64), on the paid retry.",
          },
          {
            name: "X-Simpuru-Proof",
            in: "header",
            required: false,
            schema: { type: "string" },
            description: "Base64 JSON `UnlockProof` (see schema): proves the caller already paid.",
          },
        ],
        responses: {
          200: {
            description: "The content",
            headers: {
              "PAYMENT-RESPONSE": {
                schema: { type: "string" },
                description:
                  "Base64 JSON x402 settlement response (`transaction` = tx hash). Absent on a returning-buyer redelivery.",
              },
              "X-Simpuru-Purchase": {
                schema: txHash,
                description: "On a returning-buyer redelivery: the original purchase tx.",
              },
            },
            content: { "text/plain": { schema: { type: "string" } } },
          },
          402: {
            description:
              "Payment required, or the payment was rejected (`error` in the header payload)",
            headers: {
              "PAYMENT-REQUIRED": {
                schema: { type: "string" },
                description: "Base64 JSON x402 `PaymentRequired` with `accepts`.",
              },
            },
          },
          404: error("Unknown listing"),
        },
      },
    },
    "/purchases": {
      get: {
        tags: ["Purchases"],
        summary: "Sales of a seller",
        operationId: "listSales",
        parameters: [
          {
            name: "seller",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Seller's preprod address",
          },
        ],
        responses: {
          200: {
            description: "Newest first",
            content: json({ type: "array", items: ref("Purchase") }),
          },
          400: error("`seller` missing"),
        },
      },
    },
    "/purchases/{id}": {
      get: {
        tags: ["Purchases"],
        summary: "One purchase with its on-chain timeline",
        description:
          "Events are derived from chain by the seller agent (lock, result, refund request, dispute, final spend).",
        operationId: "getPurchase",
        parameters: [idParam("Payment tx (instant) or lock tx (protected)")],
        responses: {
          200: { description: "Purchase", content: json(ref("Purchase")) },
          404: error("Unknown purchase"),
        },
      },
    },
    "/purchases/{id}/verification": {
      post: {
        tags: ["Purchases"],
        summary: "Report the buyer's verdict on the delivery",
        description:
          "Buyer only: `X-Simpuru-Proof` must be signed by the purchase's payer for its listing.",
        operationId: "reportVerification",
        parameters: [
          idParam("Purchase id"),
          {
            name: "X-Simpuru-Proof",
            in: "header",
            required: true,
            schema: { type: "string" },
            description: "Base64 JSON `UnlockProof` from the payer.",
          },
        ],
        requestBody: {
          required: true,
          content: json({
            type: "object",
            properties: { verification: ref("Verification") },
            required: ["verification"],
          }),
        },
        responses: {
          200: { description: "Updated purchase", content: json(ref("Purchase")) },
          400: error("Unknown verdict"),
          403: error("Not signed by the buyer"),
          404: error("Unknown purchase"),
        },
      },
    },
    "/mcp": {
      post: {
        tags: ["MCP"],
        summary: "MCP over streamable HTTP (JSON-RPC)",
        description: [
          "Stateless MCP endpoint. Add it to an agent: `claude mcp add --transport http simpuru https://api.simpuru.xyz/mcp`.",
          "",
          "| Tool | Cost | Input |",
          "|---|---|---|",
          "| `search_listings` | free | `{ query? }` |",
          "| `get_listing` | free | `{ id }` |",
          '| `buy_listing` | listing price | `{ id, mode: "instant" \\| "protected" }` |',
          "| `my_purchases` | free | `{}` |",
          "| `get_purchase_status` | free | `{ tx }` |",
          "",
          "Hosted purchases are paid from a shared preprod demo wallet (≤ 10 tADA each, ≤ 30 tADA a day).",
          "Run `apps/mcp` locally (stdio) to pay from your own wallet.",
        ].join("\n"),
        operationId: "mcp",
        requestBody: {
          required: true,
          content: json({
            type: "object",
            description:
              "A JSON-RPC 2.0 MCP message, e.g. `initialize`, `tools/list`, `tools/call`.",
            properties: {
              jsonrpc: { const: "2.0" },
              id: {},
              method: { type: "string" },
              params: { type: "object" },
            },
            required: ["jsonrpc", "method"],
          }),
        },
        responses: { 200: { description: "JSON-RPC response", content: json({ type: "object" }) } },
      },
    },
    "/disputes/resolve": {
      servers: [{ url: "http://localhost:4023", description: "Arbiter service (internal)" }],
      post: {
        tags: ["Arbiter (internal)"],
        summary: "Settle a disputed escrow from evidence",
        description: [
          "Called by the protection watcher. The verdict rests on three facts the seller can't change after the lock:",
          'the escrow\'s `input_hash` commits to this listing; `result_hash` = `sha256(lockTx + ";" + output)`;',
          "`sha256(output)` = the listing's `contentHash`. Seller wins only if all three hold. Each escrow is paid once.",
        ].join("\n"),
        operationId: "resolveDispute",
        security: [{ arbiterToken: [] }],
        requestBody: {
          required: true,
          content: json({
            type: "object",
            properties: {
              ref: {
                type: "string",
                pattern: "^[0-9a-f]{64}#[0-9]+$",
                description: "Disputed escrow UTxO `txHash#index`.",
              },
              listing: {
                type: "object",
                properties: { id: { type: "string" }, contentHash: hash },
                required: ["id", "contentHash"],
              },
              output: { type: "string", description: "The delivered content, as received." },
            },
            required: ["ref", "listing", "output"],
          }),
        },
        responses: {
          200: { description: "Verdict and payout", content: json(ref("ResolveResult")) },
          400: error("Malformed request"),
          401: error("Missing or wrong bearer token"),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      arbiterToken: {
        type: "http",
        scheme: "bearer",
        description: "`ARBITER_TOKEN` shared with the watcher (24+ chars).",
      },
    },
    schemas: {
      Error: { type: "object", properties: { error: { type: "string" } }, required: ["error"] },
      DeliveryMode: { type: "string", enum: ["instant", "protected"] },
      Category: { type: "string", enum: [...CATEGORIES] },
      Listing: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          priceLovelace: lovelace,
          sellerAddress: {
            type: "string",
            description: "Preprod address that sells (and, instant, gets paid).",
          },
          modes: { type: "array", items: ref("DeliveryMode") },
          contentHash: { ...hash, description: "SHA-256 of the content the buyer receives." },
          previewMedia: {
            type: "string",
            format: "uri",
            description: "Free https recording of what the prompt builds.",
          },
          category: ref("Category"),
          createdAt: { type: "string", description: "Unix ms." },
          sales: { type: "integer", description: "Purchases that were not refunded." },
          sellerReputation: {
            type: "object",
            description:
              "From the seller's closed escrows: 100 × withdrawn / (withdrawn + refunded). Absent until one.",
            properties: {
              score: { type: "integer", minimum: 0, maximum: 100 },
              basis: { type: "integer" },
            },
            required: ["score", "basis"],
          },
        },
        required: [
          "id",
          "title",
          "description",
          "priceLovelace",
          "sellerAddress",
          "modes",
          "contentHash",
        ],
      },
      NewListing: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1, maxLength: 120 },
          description: { type: "string", minLength: 1, maxLength: 2000 },
          priceLovelace: {
            ...lovelace,
            description: "≥ 1,000,000 instant; ≥ 5,000,000 when `protected` is offered.",
          },
          sellerAddress: { type: "string", pattern: "^addr_test1" },
          modes: { type: "array", items: ref("DeliveryMode"), minItems: 1 },
          content: {
            type: "string",
            description: "What is sold (max 1 MiB). Hashed; never returned by the catalogue.",
          },
          previewMedia: {
            type: "string",
            description: "https URL ending in .mp4, .webm, .webp or .gif.",
          },
          category: ref("Category"),
        },
        required: ["title", "description", "priceLovelace", "sellerAddress", "modes", "content"],
      },
      EscrowDeadlines: {
        type: "object",
        description: "Unix ms strings.",
        properties: {
          payBy: { type: "string" },
          submitResult: { type: "string" },
          unlock: { type: "string" },
          externalDisputeUnlock: { type: "string" },
        },
      },
      PurchaseEvent: {
        type: "object",
        properties: {
          status: { type: "string" },
          txHash,
          at: { type: "string", description: "Unix ms." },
        },
        required: ["status", "txHash", "at"],
      },
      Verification: { type: "string", enum: ["ok", "mismatch", "no_result_yet"] },
      Purchase: {
        type: "object",
        properties: {
          id: { ...txHash, description: "Payment tx (instant) or lock tx (protected)." },
          listingId: { type: "string" },
          mode: ref("DeliveryMode"),
          buyerAddress: { type: "string" },
          txHash,
          status: {
            type: "string",
            description:
              "Escrow state (FundsLocked, ResultSubmitted, RefundRequested, Disputed, WithdrawAuthorized, RefundAuthorized) or a final state (settled, withdrawn, refunded, closed). `withdrawing` while the seller agent collects.",
          },
          escrow: {
            type: "object",
            properties: {
              address: { type: "string" },
              inputHash: hash,
              resultHash: hash,
              identifierFromPurchaser: {
                ...txHash,
                description: "Team convention: the lock tx hash.",
              },
              deadlines: ref("EscrowDeadlines"),
            },
          },
          events: { type: "array", items: ref("PurchaseEvent") },
          verification: ref("Verification"),
        },
        required: ["id", "listingId", "mode", "buyerAddress", "txHash", "status", "events"],
      },
      UnlockProof: {
        type: "object",
        description:
          'CIP-8 signature by the buyer\'s payment key over `sha256("simpuru:unlock:v1\\n" + listingId + "\\n" + address + "\\n" + timestamp)`, at most 5 min old. Sent base64-encoded.',
        properties: {
          address: { type: "string" },
          timestamp: { type: "integer", description: "Unix ms." },
          key: { type: "string", description: "COSE_Key, hex." },
          signature: { type: "string", description: "COSE_Sign1, hex." },
        },
        required: ["address", "timestamp", "key", "signature"],
      },
      ResolveResult: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["paid", "signed", "no_verdict"],
            description: "`signed` = decided, waiting for the dispute window (`opensAt`).",
          },
          verdict: {
            type: "object",
            properties: {
              winner: { type: ["string", "null"], enum: ["buyer", "seller", null] },
              reason: { type: "string" },
              evidenceDeadline: { type: "string" },
              checks: {
                type: "object",
                properties: {
                  escrowIsForListing: { type: "boolean" },
                  outputIsWhatSellerPosted: { type: "boolean" },
                  outputMatchesListing: { type: "boolean" },
                },
              },
            },
          },
          payout: {
            type: "object",
            properties: { buyerLovelace: lovelace, sellerLovelace: lovelace },
          },
          tx: txHash,
          opensAt: { type: "string", format: "date-time" },
        },
        required: ["status", "verdict"],
      },
    },
  },
} as const;

/** Swagger UI for the spec (assets from jsDelivr, no dependency). */
export const docsHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Simpuru API</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>body { margin: 0; background: #fff; }</style>
</head>
<body>
  <div id="ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({ url: "/openapi.json", dom_id: "#ui", deepLinking: true, tryItOutEnabled: true });
  </script>
</body>
</html>`;
