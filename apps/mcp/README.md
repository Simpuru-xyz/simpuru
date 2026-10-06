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

## Add it to Claude Code

```bash
# from the repo root, with the API running (bun run dev in apps/api) and .env filled
claude mcp add simpuru -- bun --env-file="$PWD/.env" "$PWD/apps/mcp/src/index.ts"
```

Then ask: *"Find a CSV dataset on Simpuru and buy it with buyer protection."*

Claude Desktop / Cursor: same command and args in their MCP config (`command: "bun"`,
`args: ["--env-file=<repo>/.env", "<repo>/apps/mcp/src/index.ts"]`).
