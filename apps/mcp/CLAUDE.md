# apps/mcp

MCP server for agents. Owner: @yeheskieltame. Issue #7.

- Runs next to the agent over **stdio** and holds the agent's own wallet: a generic MCP host
  cannot pay an x402 402 by itself, so this server pays inside the spend limits of `@simpuru/agent`.
- Tools: `search_listings`, `get_listing` (free), `buy_listing` (`protected` default or `instant`),
  `my_purchases` (log and budget left).
- A client-side timeout does not mean the payment failed: return a purchase id to poll.
- Setup steps for Claude Code and other clients go in `README.md`; the landing page (`apps/landing`) mirrors those snippets, so update both together.

## Original work only

No code, names, assets, links or wording copied from other projects, and no other project's name
in code, comments, file names or commit messages. Check `git diff --cached` before every commit.
See the root `CLAUDE.md`.
