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
const proofHeader = {
  type: "string",
  contentEncoding: "base64",
  contentMediaType: "application/json",
  contentSchema: { $ref: "#/components/schemas/UnlockProof" },
};
const idParam = (description: string) => ({
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string" },
  description,
});

const session = [{ session: [] }];
const signedIn = (description: string) => ({ description, content: json(ref("Error")) });

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
    license: { name: "MIT", identifier: "MIT" },
  },
  // Public by default; the arbiter operation declares its own bearer token.
  security: [],
  servers: [
    { url: "https://api.simpuru.xyz", description: "Production (Cardano preprod)" },
    { url: "http://localhost:4021", description: "Local `bun run dev` in apps/api" },
  ],
  tags: [
    {
      name: "Account",
      description:
        "Sign in with a Cardano wallet (CIP-30 `signData`), then use the session as `Authorization: Bearer <token>`. Every account has a Simpuru wallet: a preprod wallet the platform holds for the owner, funded with tADA, that web purchases and the owner's agents spend from.",
    },
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
    { name: "System", description: "Health." },
  ],
  paths: {
    "/auth/challenge": {
      post: {
        tags: ["Account"],
        summary: "Start signing in",
        description:
          "Returns the digest the wallet signs. Pass the address CIP-30 gives you (`getChangeAddress()` / `getUsedAddresses()[0]`, hex) or a bech32 `addr_test1…`. The challenge expires in 5 minutes.",
        operationId: "authChallenge",
        requestBody: {
          required: true,
          content: json({
            type: "object",
            properties: {
              address: { type: "string", description: "Hex (CIP-30) or bech32 preprod address." },
            },
            required: ["address"],
          }),
        },
        responses: {
          200: {
            description: "Sign `digest` with `api.signData(address, digest)`",
            content: json({
              type: "object",
              properties: {
                owner: {
                  type: "string",
                  description: "The address as bech32; send it back to /auth/verify.",
                },
                digest: hash,
                expiresAt: { type: "integer", description: "Unix ms." },
              },
              required: ["owner", "digest", "expiresAt"],
            }),
          },
          400: error("Not a preprod address"),
        },
      },
    },
    "/auth/verify": {
      post: {
        tags: ["Account"],
        summary: "Finish signing in",
        description:
          "Send the `{ key, signature }` from `signData`. On the first sign-in the account and its Simpuru wallet are created (limits 10 tADA per purchase, 30 tADA a day). The session lasts 7 days.",
        operationId: "authVerify",
        requestBody: {
          required: true,
          content: json({
            type: "object",
            properties: {
              owner: { type: "string" },
              key: { type: "string", description: "COSE_Key hex from signData." },
              signature: { type: "string", description: "COSE_Sign1 hex from signData." },
            },
            required: ["owner", "key", "signature"],
          }),
        },
        responses: {
          200: {
            description: "Signed in",
            content: json({
              type: "object",
              properties: {
                token: { type: "string", description: "Send as `Authorization: Bearer <token>`." },
                expiresAt: { type: "integer", description: "Unix ms." },
                account: {
                  type: "object",
                  properties: {
                    owner: { type: "string" },
                    walletAddress: {
                      type: "string",
                      description: "The Simpuru wallet; send tADA here to shop.",
                    },
                  },
                  required: ["owner", "walletAddress"],
                },
              },
              required: ["token", "expiresAt", "account"],
            }),
          },
          400: error("Missing owner"),
          401: error("Bad signature, or no live challenge for this address"),
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Account"],
        summary: "Sign out",
        operationId: "authLogout",
        security: session,
        responses: { 204: { description: "Session ended" } },
      },
    },
    "/me": {
      get: {
        tags: ["Account"],
        summary: "My account",
        description:
          "Wallet balance, agent limits, what I bought (from my wallet or my Simpuru wallet), what I sell, and my seller reputation.",
        operationId: "getMe",
        security: session,
        responses: {
          200: { description: "Account", content: json(ref("Me")) },
          401: signedIn("Not signed in"),
        },
      },
    },
    "/me/buy": {
      post: {
        tags: ["Account"],
        summary: "Buy with my Simpuru wallet",
        description:
          "The API pays over x402 from the account's Simpuru wallet, within its limits, and returns the content. Protected purchases are watched and refunded automatically if delivery fails. Buying something already owned returns it again for free (`alreadyOwned`). Takes 20–60 s (waits for the chain).",
        operationId: "buy",
        security: session,
        requestBody: {
          required: true,
          content: json({
            type: "object",
            properties: { listingId: { type: "string" }, mode: ref("DeliveryMode") },
            required: ["listingId", "mode"],
          }),
        },
        responses: {
          200: {
            description: "Paid and delivered",
            content: json({
              type: "object",
              properties: {
                purchase: ref("Purchase"),
                content: { type: "string" },
                alreadyOwned: { type: "boolean" },
              },
              required: ["purchase", "content", "alreadyOwned"],
            }),
          },
          400: error(
            "Bad input, not enough tADA, over a limit, or the payment failed; `error` says which",
          ),
          401: signedIn("Not signed in"),
        },
      },
    },
    "/me/purchases/{id}/content": {
      get: {
        tags: ["Account"],
        summary: "Read something I bought",
        operationId: "myPurchaseContent",
        security: session,
        parameters: [idParam("Purchase id (payment tx hash)")],
        responses: {
          200: {
            description: "The content",
            content: { "text/plain": { schema: { type: "string" } } },
          },
          401: signedIn("Not signed in"),
          404: error("Not my purchase"),
          410: error("Refunded"),
        },
      },
    },
    "/me/agent-limits": {
      put: {
        tags: ["Account"],
        summary: "Set agent limits",
        description: "What my agents (and web purchases) may spend from the Simpuru wallet.",
        operationId: "setAgentLimits",
        security: session,
        requestBody: {
          required: true,
          content: json({
            type: "object",
            properties: {
              maxPerPaymentAda: { type: "integer", minimum: 1, maximum: 100 },
              dailyBudgetAda: { type: "integer", description: "≥ maxPerPaymentAda, ≤ 500." },
            },
            required: ["maxPerPaymentAda", "dailyBudgetAda"],
          }),
        },
        responses: {
          200: {
            description: "Saved",
            content: json({
              type: "object",
              properties: { maxPerPaymentLovelace: lovelace, dailyBudgetLovelace: lovelace },
            }),
          },
          400: error("Out of range"),
          401: signedIn("Not signed in"),
        },
      },
    },
    "/me/wallet/withdraw": {
      post: {
        tags: ["Account"],
        summary: "Withdraw my Simpuru wallet",
        description:
          "Sends everything (minus ~2 tADA kept for fees) back to the wallet I signed in with.",
        operationId: "withdraw",
        security: session,
        responses: {
          200: {
            description: "Sent",
            content: json({
              type: "object",
              properties: { tx: txHash, lovelace },
              required: ["tx", "lovelace"],
            }),
          },
          400: error("Nothing to withdraw, or the transaction failed"),
          401: signedIn("Not signed in"),
        },
      },
    },
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
          "Anyone can sell. Signed in (`Authorization: Bearer`), the listing is sold by the account and `sellerAddress` is ignored. Without a session (scripts), the creator signs the listing with the wallet of `sellerAddress`. The API stores the content and returns its SHA-256 as `contentHash`; protected quotes commit to it. Instant sales pay the creator directly; protected sales lock into the escrow with the platform as seller of record, which pays the creator `price − max(1.5 tADA, 10%)` once the escrow releases.",
        operationId: "createListing",
        parameters: [
          {
            name: "X-Simpuru-Proof",
            in: "header",
            required: false,
            schema: proofHeader,
            description:
              'Base64 JSON `UnlockProof` signed by `sellerAddress` (CIP-30 `signData`) over `sha256("simpuru:listing:v1\\n" + sellerAddress + "\\n" + sha256(content) + "\\n" + priceLovelace + "\\n" + timestamp)`, at most 5 min old.',
          },
        ],
        requestBody: { required: true, content: json(ref("NewListing")) },
        responses: {
          201: { description: "Created", content: json(ref("Listing")) },
          400: error("Invalid input; `error` says which field"),
          401: error("No session and no valid signature"),
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
            schema: proofHeader,
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
    "/creators/{address}": {
      get: {
        tags: ["Catalogue"],
        summary: "A creator's page",
        description: "Their listings for sale, total sales and on-chain reputation.",
        operationId: "getCreator",
        parameters: [
          {
            name: "address",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Creator's preprod address",
          },
        ],
        responses: {
          200: {
            description: "Creator",
            content: json({
              type: "object",
              properties: {
                address: { type: "string" },
                listings: { type: "array", items: ref("Listing") },
                sales: { type: "integer" },
                sellerReputation: {
                  type: "object",
                  properties: { score: { type: "integer" }, basis: { type: "integer" } },
                },
              },
              required: ["address", "listings", "sales"],
            }),
          },
          400: error("Not a preprod address"),
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
            required: false,
            schema: proofHeader,
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
          "| `search_listings` | free | `{ query?, category?, mode?, maxPriceAda?, minReputation?, sort? }` (sort: popular, newest, price_asc, price_desc, reputation) |",
          "| `get_listing` | free | `{ id }` |",
          '| `buy_listing` | listing price | `{ id, mode: "instant" \\| "protected" }` |',
          "| `my_purchases` | free | `{}` |",
          "| `get_purchase_status` | free | `{ tx }` |",
          "| `my_wallet` | free | `{}`: agent wallet address to fund, balance, limits |",
          "| `withdraw_to_owner` | fee only | `{}`: send what's left back to the owner |",
          "",
          "Sign-in first (OAuth, see MCP sign-in): the agent then spends from the owner's own agent wallet within their limits, or from the shared demo wallet (≤ 10 tADA each, ≤ 30 tADA a day).",
          "Run `apps/mcp` locally (stdio) to pay from your own wallet.",
        ].join("\n"),
        operationId: "mcp",
        security: [{ mcpOAuth: [] }],
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
    "/.well-known/oauth-protected-resource": {
      get: {
        tags: ["MCP sign-in"],
        summary: "Protected resource metadata (RFC 9728)",
        operationId: "resourceMetadata",
        responses: {
          200: {
            description: "Which authorization server protects /mcp",
            content: json({ type: "object" }),
          },
        },
      },
    },
    "/.well-known/oauth-protected-resource/mcp": {
      get: {
        tags: ["MCP sign-in"],
        summary: "Same metadata, path-suffixed form",
        operationId: "resourceMetadataMcp",
        responses: { 200: { description: "Metadata", content: json({ type: "object" }) } },
      },
    },
    "/.well-known/oauth-authorization-server": {
      get: {
        tags: ["MCP sign-in"],
        summary: "Authorization server metadata (RFC 8414)",
        operationId: "authServerMetadata",
        responses: {
          200: {
            description: "Endpoints, PKCE S256, public clients",
            content: json({ type: "object" }),
          },
        },
      },
    },
    "/oauth/register": {
      post: {
        tags: ["MCP sign-in"],
        summary: "Dynamic client registration (RFC 7591)",
        operationId: "registerClient",
        requestBody: {
          required: true,
          content: json({
            type: "object",
            properties: {
              redirect_uris: { type: "array", items: { type: "string" } },
              client_name: { type: "string" },
            },
            required: ["redirect_uris"],
          }),
        },
        responses: {
          201: {
            description: "client_id (public client, no secret)",
            content: json({ type: "object" }),
          },
          400: error("Redirect URIs must be https or loopback"),
        },
      },
    },
    "/oauth/authorize": {
      get: {
        tags: ["MCP sign-in"],
        summary: "Consent page",
        description:
          "The owner connects a Cardano wallet (CIP-30) and signs a one-time challenge, or picks the shared demo wallet, and sets limits (per purchase, per day). Simpuru creates the owner's agent wallet on first sign-in.",
        operationId: "authorize",
        parameters: [
          "response_type",
          "client_id",
          "redirect_uri",
          "code_challenge",
          "code_challenge_method",
          "state",
        ].map((name) => ({
          name,
          in: "query",
          required: name !== "state",
          schema: { type: "string" },
        })),
        responses: {
          200: {
            description: "HTML consent page",
            content: { "text/html": { schema: { type: "string" } } },
          },
          400: { description: "Bad request" },
        },
      },
    },
    "/oauth/challenge": {
      get: {
        tags: ["MCP sign-in"],
        summary: "The digest the wallet signs",
        description:
          '`sha256("simpuru:connect:v1\\n" + owner + "\\n" + nonce)` for this request; also turns the wallet\'s hex address into bech32.',
        operationId: "challenge",
        parameters: [
          { name: "request", in: "query", required: true, schema: { type: "string" } },
          {
            name: "address",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Hex address from CIP-30 getChangeAddress()",
          },
        ],
        responses: {
          200: { description: "{ owner, digest }", content: json({ type: "object" }) },
          400: error("Expired request or not a preprod address"),
        },
      },
    },
    "/oauth/approve": {
      post: {
        tags: ["MCP sign-in"],
        summary: "Finish the sign-in",
        operationId: "approve",
        requestBody: {
          required: true,
          content: json({
            type: "object",
            properties: {
              request: { type: "string" },
              mode: { type: "string", enum: ["wallet", "demo"] },
              owner: { type: "string" },
              key: { type: "string", description: "COSE_Key from CIP-30 signData" },
              signature: { type: "string", description: "COSE_Sign1 from CIP-30 signData" },
              maxPerPaymentAda: { type: "integer", minimum: 1, maximum: 100 },
              dailyBudgetAda: { type: "integer", minimum: 1, maximum: 500 },
            },
            required: ["request", "mode", "maxPerPaymentAda", "dailyBudgetAda"],
          }),
        },
        responses: {
          200: {
            description: "{ redirect, agentAddress, owner }: go back to the MCP client",
            content: json({ type: "object" }),
          },
          400: error("Expired request or bad limits"),
          401: error("The wallet signature didn't check out"),
        },
      },
    },
    "/oauth/token": {
      post: {
        tags: ["MCP sign-in"],
        summary: "Token endpoint",
        description:
          "`authorization_code` (with the PKCE `code_verifier`) or `refresh_token` (rotated). Access tokens last 7 days.",
        operationId: "token",
        requestBody: {
          required: true,
          content: { "application/x-www-form-urlencoded": { schema: { type: "object" } } },
        },
        responses: {
          200: { description: "access_token, refresh_token", content: json({ type: "object" }) },
          400: error("invalid_grant"),
        },
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
      session: {
        type: "http",
        scheme: "bearer",
        description: "Session token from `POST /auth/verify` (7 days).",
      },
      mcpOAuth: {
        type: "oauth2",
        description: "OAuth 2.1 with PKCE; MCP clients handle it.",
        flows: {
          authorizationCode: {
            authorizationUrl: "https://api.simpuru.xyz/oauth/authorize",
            tokenUrl: "https://api.simpuru.xyz/oauth/token",
            scopes: { mcp: "Shop on Simpuru with the owner's agent wallet" },
          },
        },
      },
      arbiterToken: {
        type: "http",
        scheme: "bearer",
        description: "`ARBITER_TOKEN` shared with the watcher (24+ chars).",
      },
    },
    schemas: {
      Me: {
        type: "object",
        properties: {
          owner: { type: "string", description: "The wallet I signed in with." },
          wallet: {
            type: "object",
            description: "My Simpuru wallet.",
            properties: { address: { type: "string" }, balanceLovelace: lovelace },
            required: ["address", "balanceLovelace"],
          },
          limits: {
            type: "object",
            properties: {
              maxPerPaymentLovelace: lovelace,
              dailyBudgetLovelace: lovelace,
              spentTodayLovelace: lovelace,
            },
            required: ["maxPerPaymentLovelace", "dailyBudgetLovelace", "spentTodayLovelace"],
          },
          purchases: { type: "array", items: ref("Purchase") },
          listings: { type: "array", items: ref("Listing") },
          sales: { type: "integer" },
          sellerReputation: {
            type: "object",
            properties: { score: { type: "integer" }, basis: { type: "integer" } },
          },
        },
        required: ["owner", "wallet", "limits", "purchases", "listings", "sales"],
      },
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
