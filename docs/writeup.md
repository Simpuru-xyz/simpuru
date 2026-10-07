# Simpuru: project write-up

**Buyer protection for people and AI agents paying with x402 on Cardano.** Live on preprod:
[simpuru.xyz](https://simpuru.xyz) · [app.simpuru.xyz](https://app.simpuru.xyz) · [API docs](https://api.simpuru.xyz/docs)

## The problem

x402 lets an agent pay per request, and on Cardano the `masumi` method locks the payment in an escrow
instead of paying the seller outright. But the spec is explicit that **x402 ends at the lock**: releasing,
refunding or disputing the funds is left to someone else. An agent that pays for a file and gets nothing,
or the wrong file, has no one watching the deadlines for it. Without that, agents can only buy from sellers
they already trust, which defeats open agentic commerce.

## What we built

A shop where people and agents buy digital goods (design prompts) one at a time, with protection by default.

1. **Sellers commit first.** Every listing carries the SHA-256 of its content; the x402 quote binds the
   escrow's input hash to that listing and hash.
2. **Buyers pay over x402**, instantly or into escrow, from a web account (sign in with a Cardano wallet,
   pay from a Simpuru wallet) or through an agent over MCP, inside limits the owner sets.
3. **A protection watcher checks every delivery** against the commitment and acts on chain on its own:
   no result by the deadline → refund; wrong result → dispute.
4. **An arbiter decides from evidence, not opinion**: it pays the seller only if the escrow was locked for
   this listing, the delivered output is what the seller posted on chain, and that output is the listed
   content. Otherwise the buyer is paid back.
5. **Agent to agent:** *Simpuru Shopper*, a Masumi Coworker on Sokosumi, is hired in USDM (Masumi escrow,
   our own payment node) and buys on Simpuru with buyer protection (ADA, our escrow).

Every path is proven with preprod transactions: instant, honest seller paid, no delivery refunded, wrong
file disputed and refunded by the arbiter, a web account purchase with the creator paid, a real agent over
MCP, and a paid Sokosumi Task with both escrows settled ([receipts](demo.md)).

## Technical approach

- **Payments:** x402 v2 (`@x402/cardano`, `@x402/hono`, `@x402/fetch`, `@x402/mcp`) with an in-process
  facilitator; two paths, `default` (instant) and `masumi` (escrow).
- **Escrow:** Masumi `vested_pay` V2 validator, unchanged, deployed with **our own arbiter key**;
  reference-script UTxO cuts escrow fees from 0.689 to 0.402 tADA.
- **Cardano infrastructure:** preprod, Blockfrost, Evolution SDK for transactions, CIP-30 wallets and
  CIP-8 `signData` for sign-in and listing signatures; Masumi Payment Service and registry for the Coworker.
- **Services:** Hono API on Bun (SQLite), seller agent that posts results, withdraws and pays creators,
  per-account protection watchers, arbiter service, hosted MCP server with OAuth 2.1 sign-in, Sokosumi worker.
- **Frontends:** Next.js app and landing page on Vercel; Swagger/OpenAPI 3.1 for every endpoint.

## Deploying and scaling it

- **Today:** one VPS runs the API, seller agent, watchers, arbiter, payment node and Coworker in Docker;
  frontends on Vercel. Measured: instant 17–31 s to content, protected 30–50 s.
- **Real world:** the protection layer is not tied to prompts. Any x402 seller (APIs, datasets, files,
  agent work) can list with a content commitment and inherit refunds and evidence-based disputes. Agents
  get one MCP endpoint and spending limits their owner controls.
- **Path to mainnet:** independent audit of the deployment and the arbiter, a multi-key arbiter
  (the validator already supports several admin keys), Hydra or batching for high-volume small payments,
  and stablecoin pricing (USDM) next to ADA. No mainnet transaction is built until then.
