# Simpuru

Buyer protection for AI agents paying with x402 on Cardano.

An agent buys digital goods over MCP, pays into an on-chain escrow, checks what was delivered,
and gets its money back automatically when delivery fails.

Built for the TOKEN2049 Origins Hackathon, Cardano track (Agentic Commerce). Runs on Cardano preprod;
every claim below links a preprod transaction.

## Try it

```bash
claude mcp add --transport http simpuru https://api.simpuru.xyz/mcp
```

Then ask Claude: *"Find a hero section prompt on Simpuru and buy it with buyer protection."*
The hosted MCP pays from a shared preprod demo wallet.

**API docs (Swagger):** [api.simpuru.xyz/docs](https://api.simpuru.xyz/docs) · OpenAPI 3.1: [`/openapi.json`](https://api.simpuru.xyz/openapi.json)

## The problem

x402 lets an agent pay for a resource per request, and on Cardano the `masumi` method locks the
payment in an escrow (`vested_pay`) instead of paying the seller outright. But the x402 Cardano spec
is explicit that **x402 ends at the lock**: *"A settled `masumi` payment means the funds are locked in
the escrow under terms both parties signed — not delivered to the seller. Releasing them runs the
ordinary Masumi V2 lifecycle, which this scheme neither drives nor constrains"* ([spec](https://github.com/x402-foundation/x402/blob/main/specs/schemes/exact/scheme_exact_cardano.md)).

So once an agent has paid, someone still has to notice the seller never delivered, or delivered the
wrong thing, and act before the deadlines pass. A human won't be watching. Simpuru is that someone.

## What Simpuru does

1. **The seller commits to the content before it is paid.** Every listing carries the SHA-256 of what
   it sells, and the x402 quote binds the escrow's `input_hash` to that listing and hash.
2. **The buyer agent pays into escrow over x402** (or instantly, for cheap goods), from the CLI or
   through MCP, inside a spend budget.
3. **A protection watcher checks every delivery against the commitment** and acts on chain on its own:
   no result by the deadline → refund; a result that doesn't match → dispute.
4. **An arbiter settles disputes from evidence, not opinion.** It pays the seller only if the escrow
   was locked for this listing, the delivered output is the one the seller posted on chain, and that
   output is the listed content. Otherwise the buyer gets the money back.

The escrow is Masumi's `vested_pay` V2 validator, unchanged, deployed with our arbiter key
instead of Masumi's admins ([`contracts/`](contracts/README.md)).

## Cardano Agentic Commerce: how the track's scope maps to Simpuru

The track asks builders to *"write the future of agentic commerce on Cardano using the x402 open
standard"* and lists what is in scope. Each line, and where Simpuru answers it:

| Track scope | Simpuru | Proof on preprod |
|---|---|---|
| using the x402 open standard | x402 paywall with an in-process facilitator: `default` (instant) and `masumi` (escrow) | instant [`49659f72…`](https://preprod.cardanoscan.io/transaction/49659f72decf393d04dcb4ad9d3f18f489656b9dce0a078143275dd4448ec89b), escrow lock [`50a6adc6…`](https://preprod.cardanoscan.io/transaction/50a6adc66d0451fc2ca1709b9bd518a862108d2dc5b2532098085ab2dc9a29fd) |
| agents autonomously pay for services | buyer agent (CLI + MCP server) pays from its own wallet with a per-payment and daily budget | MCP buy [`37edbd55…`](https://preprod.cardanoscan.io/transaction/37edbd55bc8ba8f19ba540e34cb2645c945873f39a3d4bcdb7a7e3ec2abfc565) |
| monetize endpoints, APIs, content per request | catalogue of listings, each sold per request through the paywall | see [`docs/demo.md`](docs/demo.md) |
| agent-to-agent flows | buyer agent ↔ seller agent through the escrow: the seller agent posts its result and withdraws on its own | result [`11e25013…`](https://preprod.cardanoscan.io/transaction/11e25013f909aaea9e306adcf410c70980a02d3a60b2de6af45573d314a5968d), seller paid [`61eb7ffd…`](https://preprod.cardanoscan.io/transaction/61eb7ffd37c64c79b68950bde150f31ad761c5f900278ec87ff0e33422e714e9) |
| their unique innovation | **buyer protection**: automatic refund and dispute, and an arbiter that decides from on-chain evidence | auto-refund [`66879ef7…`](https://preprod.cardanoscan.io/transaction/66879ef7bd7845105e4a0f6706c09abe3c6a362cb1e19f07a784dd834650353b), auto-dispute [`41f584f8…`](https://preprod.cardanoscan.io/transaction/41f584f8d5ab8feee0b5c460ca4ad0eb5236dc45d92d72912e0824e280f2cb4b) → arbiter pays the buyer [`c966f98c…`](https://preprod.cardanoscan.io/transaction/c966f98cb4162f2a1b63c14d0d69b94d674e4d18277b2b5836c9a563c65d33d5) |
| anything that advances agentic commerce on Cardano | makes the step after an x402 escrow lock automatic and safe for an agent that never has a human watching | arbiter pays the **seller** when the delivery was right [`763b27fe…`](https://preprod.cardanoscan.io/transaction/763b27fee81803c91507747be3dce4ae4796181ea42bcc6a93f9b498b639aa15) |

All four paths (instant; honest seller paid; no delivery → refund; wrong file → dispute → arbiter)
with every transaction and its timing: [`docs/demo.md`](docs/demo.md).

## Numbers (measured on preprod)

| | |
|---|---|
| Instant purchase, pay → content | 17–31 s |
| Protected purchase, pay → content | 30–50 s |
| Escrow tx fee, validator attached → referenced (#45) | 0.689 → 0.402 tADA |
| Earliest refund / seller payout / arbiter payout after the quote | ~16 / ~31 / ~46 min (escrow deadlines the x402 issuer enforces) |

## Repo layout

| Path | What | Owner |
|---|---|---|
| `apps/landing` | Landing page | @Lexirieru |
| `apps/web` | Web app (Next.js) | @AdityaWisnuu |
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
