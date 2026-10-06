# @simpuru/mcp

MCP server that lets any agent shop on Simpuru. It runs **next to the agent (stdio) and holds the
agent's own wallet**: a generic MCP host (Claude Code, Claude Desktop, Cursor) cannot pay an x402
`402` by itself, so this server pays the API over x402 on the agent's behalf, inside the spend limits
of `@simpuru/agent`.

Owner: @yeheskieltame

| Tool | Cost | |
|---|---|---|
| `search_listings` | free | catalogue, optional `query` |
| `get_listing` | free | one listing with its committed content hash |
| `buy_listing` | listing price | `id`, `mode` (`protected` default, or `instant`); returns content, tx, hash check, refund deadlines |
| `my_purchases` | free | purchase log, spent today vs budget |
| `get_purchase_status` | free | escrow state, every on-chain step, deadlines |

## Use the hosted server (no setup)

```bash
claude mcp add --transport http simpuru https://api.simpuru.xyz/mcp
```

Then ask: *"Find a hero section prompt on Simpuru and buy it with buyer protection."* The hosted
server pays from a shared **preprod demo wallet** (max 10 tADA per purchase, 30 tADA per day), so it
works without a wallet of your own. Cursor / Claude Desktop: add `https://api.simpuru.xyz/mcp` as a
streamable HTTP MCP server.

## Run it locally with your own wallet

```bash
# from the repo root with .env filled (BUYER_MNEMONIC, BLOCKFROST_PROJECT_ID).
# It buys from the live API, https://api.simpuru.xyz, unless SIMPURU_API_URL says otherwise.
claude mcp add simpuru -- bun --env-file="$PWD/.env" "$PWD/apps/mcp/src/index.ts"
```

Then ask: *"Find a CSV dataset on Simpuru and buy it with buyer protection."*

Claude Desktop / Cursor: same command and args in their MCP config (`command: "bun"`,
`args: ["--env-file=<repo>/.env", "<repo>/apps/mcp/src/index.ts"]`).
