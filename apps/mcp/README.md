# @simpuru/mcp

MCP server that lets any agent shop on Simpuru. It runs **next to the agent (stdio) and holds the
agent's own wallet**: a generic MCP host (Claude Code, Claude Desktop, Cursor) cannot pay an x402
`402` by itself, so this server pays the API over x402 on the agent's behalf, inside the spend limits
of `@simpuru/agent`.

Owner: @yeheskieltame

| Tool | Cost | |
|---|---|---|
| `search_listings` | free | catalogue with filters: `query`, `category`, `mode`, `maxPriceAda`, `minReputation` (0-100), `sort` |
| `get_listing` | free | one listing with its committed content hash |
| `buy_listing` | listing price | `id`, `mode` (`protected` default, or `instant`); returns content, tx, hash check, refund deadlines |
| `my_purchases` | free | purchase log, spent today vs budget |
| `get_purchase_status` | free | escrow state, every on-chain step, deadlines |
| `my_wallet` | free | your agent wallet: address to fund, balance, limits (hosted) |
| `withdraw_to_owner` | fee only | send what's left back to your own wallet (hosted) |

## Use the hosted server

```bash
claude mcp add --transport http simpuru https://api.simpuru.xyz/mcp
```

Your MCP client opens a Simpuru sign-in page (OAuth 2.1, the MCP auth spec):

1. **Connect your Cardano wallet** (Eternl, Lace, … on preprod) and sign a one-time message. It proves
   the wallet is yours and moves no funds.
2. **Set limits**: max per purchase and a daily budget.
3. Simpuru creates **your agent wallet**. Fund it with tADA; your agent buys from it, only inside your
   limits. `my_wallet` shows its address and balance, `withdraw_to_owner` sends what's left back to you.
4. Every protected purchase is watched server-side: refunded if the seller never delivers, disputed if
   the delivery doesn't match.

No preprod wallet? Pick **"use the shared demo wallet"** on the sign-in page.

Then ask: *"Find a hero section prompt on Simpuru and buy it with buyer protection."*

## Run it locally with your own wallet

```bash
# from the repo root with .env filled (BUYER_MNEMONIC, BLOCKFROST_PROJECT_ID).
# It buys from the live API, https://api.simpuru.xyz, unless SIMPURU_API_URL says otherwise.
claude mcp add simpuru -- bun --env-file="$PWD/.env" "$PWD/apps/mcp/src/index.ts"
```

Then ask: *"Find a CSV dataset on Simpuru and buy it with buyer protection."*

Claude Desktop / Cursor: same command and args in their MCP config (`command: "bun"`,
`args: ["--env-file=<repo>/.env", "<repo>/apps/mcp/src/index.ts"]`).
