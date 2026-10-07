# @simpuru/docs

The documentation site for Simpuru, built with [Mintlify](https://mintlify.com): `docs.json` plus MDX pages. Live at `docs.simpuru.xyz`.

Owner: @AdityaWisnuu

```bash
bun run preview   # http://localhost:3333 (Mintlify CLI through npx, Node 20+)
bun run check     # broken links
```

## Layout

| Path | What |
|---|---|
| `docs.json` | Site config and navigation |
| `index.mdx`, `overview/` | What Simpuru is, how it works, fees and timings, roadmap, FAQ |
| `guides/` | For people (sign in, fund, buy, sell, get paid, withdraw) and agents (connect, limits, tools) |
| `learn/` | How the protection works: commitment, escrow, deadlines, watcher, arbiter, reputation, trust, risks |
| `developers/` | Architecture, quickstart, authentication, x402, selling, purchases, MCP, run locally |
| `resources/` | Deployment, proof on preprod, glossary |
| `images/screens/` | Screenshots of app.simpuru.xyz (from `docs/screenshots`) |

The API reference tab is generated from `https://api.simpuru.xyz/openapi.json`, so it follows the live API.

## Hosting

Mintlify's GitHub app watches this repo with `apps/docs` as the docs directory and deploys every merge to `main`. Custom domain: a `CNAME` for `docs` at the DNS provider, pointing where Mintlify's dashboard says.

## Rules

- Facts come from the code, `README.md`, `docs/demo.md` and `docs/writeup.md`. Every on-chain claim links its preprod transaction.
- Always say preprod and test ADA. Never claim mainnet or real money.
- Original work only: no other project's names, assets, links or wording (see the root `CLAUDE.md`).
