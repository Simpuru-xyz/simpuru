@AGENTS.md

# Simpuru

A shop where people and agents buy digital goods (the landing page leads with design prompts) one
at a time, paid in ADA over x402 on Cardano. A protected purchase pays into an on-chain escrow; the buyer checks the delivery
against the hash the seller committed to and is refunded automatically when it does not arrive or
does not match.

Hackathon project (TOKEN2049 Origins). **Cardano preprod only.**

## Layout

| Path | What | Owner |
|---|---|---|
| `apps/landing` | Landing page: what Simpuru is, how it works, connect an agent | @Lexirieru |
| `apps/web` | App: catalogue, purchase timeline, seller dashboard | @AdityaWisnuu |
| `apps/api` | Hono API: listings, x402 paywall, in-process facilitator, seller agent | @yeheskieltame |
| `apps/mcp` | stdio MCP server that shops with the agent's own wallet | @yeheskieltame |
| `apps/agent` | Buyer agent CLI, delivery verification, protection watcher | @ghozzza |
| `apps/arbiter` | Resolves disputes, signs escrow payouts | @ghozzza |
| `packages/core` | Shared types, constants, hashing | @yeheskieltame |
| `packages/escrow` | Escrow datum codecs and tx builders | @ghozzza |
| `packages/tsconfig` | Shared TypeScript config | — |
| `contracts` | Escrow deployment records (validator, params, addresses) | @ghozzza |

Each folder has its own `CLAUDE.md` with the details for that area.

## Stack

- Bun workspaces + Turborepo, TypeScript everywhere, Biome for lint/format.
- Cardano preprod, Blockfrost, Evolution SDK (`@evolution-sdk/evolution`).
- x402: `@x402/cardano`, `@x402/hono`, `@x402/fetch`, `@x402/mcp`. Two payment paths: `default`
  (instant) and `masumi` (protected, escrow).
- Escrow: Masumi `vested_pay` V2 validator, our own deployment with our arbiter key.

## Rules

- Work from an issue. Branch `<type>/<issue>-<short-name>`, Conventional Commits, PR with
  `Closes #N`, squash merge. No direct pushes to `main`. See `CONTRIBUTING.md`.
- **No AI co-author lines** and no "Generated with" footers in commits or PRs. CI rejects them.
- No secrets, mnemonics or API keys anywhere. The repo is public.
- Never build or sign a mainnet transaction.
- Small commits: one change per commit, so each can be reviewed and reverted on its own.

## Original work only

- Do not copy code, names, assets, links or wording from other projects into this repo. Anything
  adapted must be rewritten for Simpuru (Cardano, ADA, x402, escrow).
- No other project's name in code, comments, file names, URLs, commit messages, PRs or issues.
- Check regularly, and always before committing: read `git diff --cached` and `git grep` for
  names or hosts that do not belong to Simpuru.

## Commands

```bash
bun install
bun run dev        # all apps
bun run lint       # biome
bun run format     # biome --write
bun run typecheck  # tsc in every workspace
```
