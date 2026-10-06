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
