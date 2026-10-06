# @simpuru/api

HTTP API: catalogue, listings, x402 paywall (instant + protected), in-process facilitator, seller agent.

Owner: @yeheskieltame

```bash
bun run dev    # http://localhost:4021, needs SELLER_MNEMONIC in the root .env
bun test
```

Full reference: **[/docs](https://api.simpuru.xyz/docs)** (Swagger UI) and `/openapi.json` (OpenAPI 3.1, `src/openapi.ts`). `openapi.test.ts` fails if a route is added without documenting it.

| Route | |
|---|---|
| `GET /health` | `{ ok, network }` |
| `GET /listings` | Catalogue (`Listing[]` from `@simpuru/core`, no content) |
| `GET /listings/:id` | One listing, 404 if unknown |
| `POST /listings` | `{ title, description, priceLovelace, sellerAddress, modes, content }` → listing with `contentHash` |

Price floor: 1 tADA instant, 5 tADA when `protected` is offered (escrow fees ~1.35 tADA per sale).
SQLite file in `apps/api/data/` (git-ignored), seeded with 3 sample listings on first start.

### Paid route (x402)

`GET /listings/:id/unlock` answers `402` with up to two options, then the content once paid:

- **instant** (`default`): pay the seller directly, content after block inclusion (~30 s)
- **protected** (`masumi`): lock into our escrow (`contracts/deployments/preprod.json`), seller-signed
  quote whose `input_hash` commits to `{ listingId, contentHash }`. Only offered for listings the
  platform wallet sells. Deadlines: refund ~16 min, seller paid ~31 min, arbiter ~46 min after the quote.

The facilitator runs in-process (Blockfrost, no keys). Every settled payment lands in the
`purchases` table (protected ones as `FundsLocked`, with the signed quote in `terms`).

### Returning buyers

A buyer who already paid sends `X-Simpuru-Proof` (base64 JSON `{ address, timestamp, key, signature }`):
a CIP-8 signature over `unlockProofDigest(listingId, address, timestamp)` from `@simpuru/core/hash`,
made with its payment key, at most 5 min old. If `purchases` has a non-refunded purchase of that
listing by that address, the content comes back with `X-Simpuru-Purchase: <tx>` and no 402.
Anything else falls through to the gate. `@simpuru/agent` does this automatically before paying.

### Seller agent (protected purchases)

Runs inside the API every 30 s (`src/seller.ts`). For each open protected purchase it finds the lock
by its seller nonce (the lock moves to a new UTxO on every action) and:

- posts `result_hash = purchaseResultHash(lockTx, content)` right after delivery (`submitResult`)
- collects after `unlock_time` (`withdraw`)
- never concedes by itself; a dispute waits for the arbiter
- records every on-chain step as a purchase event, and when the lock is spent by someone else, finds the
  spending tx (Blockfrost `consumed_by_tx`) and marks it `refunded` or `withdrawn`

### Purchases (for the web)

| Route | |
|---|---|
| `GET /purchases/:id` | `PurchaseView` = `Purchase` from `@simpuru/core` + `verification?` (`id` = payment/lock tx) |
| `GET /purchases?seller=addr` | purchases of listings that address sells, newest first |
| `POST /purchases/:id/verification` | `{ verification: "ok" \| "mismatch" \| "no_result_yet" }`, buyer only (`X-Simpuru-Proof`) |

### Deploy (VPS)

`Dockerfile` + `docker-compose.yml` at the repo root. On the VPS: clone to `/opt/simpuru`, put a `.env`
with only `SELLER_MNEMONIC` and `BLOCKFROST_PROJECT_ID` next to the compose file, then
`docker compose up -d --build`. The API binds `127.0.0.1:4021`; the host's reverse proxy serves
`https://api.simpuru.xyz`. SQLite lives in `./data` on the host.
