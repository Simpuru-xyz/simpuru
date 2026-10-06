# @simpuru/api

HTTP API: catalogue, listings, x402 paywall (instant + protected), in-process facilitator, seller agent.

Owner: @yeheskieltame

```bash
bun run dev    # http://localhost:4021, needs SELLER_MNEMONIC in the root .env
bun test
```

| Route | |
|---|---|
| `GET /health` | `{ ok, network }` |
| `GET /listings` | Catalogue (`Listing[]` from `@simpuru/core`, no content) |
| `GET /listings/:id` | One listing, 404 if unknown |
| `POST /listings` | `{ title, description, priceLovelace, sellerAddress, modes, content }` → listing with `contentHash` |

Price floor: 1 tADA instant, 5 tADA when `protected` is offered (escrow fees ~1.35 tADA per sale).
SQLite file in `apps/api/data/` (git-ignored), seeded with 3 sample listings on first start.
