# Simpuru

Buyer protection for AI agents paying with x402 on Cardano.

An agent buys digital goods over MCP, pays into an on-chain escrow, checks what was delivered,
and gets its money back automatically when delivery fails.

Status: work in progress (TOKEN2049 Origins Hackathon, Cardano preprod).

## Repo layout

| Path | What | Owner |
|---|---|---|
| `apps/landing` | Landing page | @AdityaWisnuu |
| `apps/web` | Web app (Next.js) | @Lexirieru |
| `apps/api` | HTTP API, x402 paywall, facilitator, seller agent (Hono on Bun) | @yeheskieltame |
| `apps/mcp` | MCP server with paid tools | @yeheskieltame |
| `apps/agent` | Buyer agent and protection watcher | @ghozzza |
| `apps/arbiter` | Dispute arbiter service | @ghozzza |
| `packages/escrow` | Escrow codecs and transaction builders | @ghozzza |
| `packages/core` | Shared types and helpers | @yeheskieltame |
| `contracts` | Escrow deployment (validator, parameters, addresses) | @ghozzza |

## Getting started

```bash
bun install
cp .env.example .env   # preprod keys, never commit
bun run dev
```

Read [CONTRIBUTING.md](CONTRIBUTING.md) before your first PR.
