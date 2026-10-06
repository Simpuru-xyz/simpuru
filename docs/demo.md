# Simpuru on preprod: receipts and demo plan

Every row is a real Cardano preprod transaction. Explorer: `https://preprod.cardanoscan.io/transaction/<tx>`.

## The four paths

### 1. Instant: pay the seller, get the file
| Step | Tx | Notes |
|---|---|---|
| `bun run buy landing-copy-pack instant` | [`49659f72…`](https://preprod.cardanoscan.io/transaction/49659f72decf393d04dcb4ad9d3f18f489656b9dce0a078143275dd4448ec89b) | 2 tADA, content after 30.5 s |
| Same through MCP `buy_listing` | [`37edbd55…`](https://preprod.cardanoscan.io/transaction/37edbd55bc8ba8f19ba540e34cb2645c945873f39a3d4bcdb7a7e3ec2abfc565) | 17 s, content hash matches |
| Paid, connection dropped, recovered without paying again | [`fd0ce727…`](https://preprod.cardanoscan.io/transaction/fd0ce7278de23dff249f3919ebc9d3624e4ea8038b27d9b9b87b652b3f34e5cc) | signed proof, #31 |

### 2. Protected, honest seller: escrow, result, seller paid
| Step | Tx | Notes |
|---|---|---|
| Lock into our escrow | [`50a6adc6…`](https://preprod.cardanoscan.io/transaction/50a6adc66d0451fc2ca1709b9bd518a862108d2dc5b2532098085ab2dc9a29fd) | 5 tADA, quote commits to the content hash |
| Seller agent posts `result_hash` (automatic, ~1 min) | [`11e25013…`](https://preprod.cardanoscan.io/transaction/11e25013f909aaea9e306adcf410c70980a02d3a60b2de6af45573d314a5968d) | ResultSubmitted |
| Seller agent withdraws after `unlock_time` | pending (~08:15 UTC) | |

### 3. Protected, seller never delivers: buyer refunded
| Step | Tx | Notes |
|---|---|---|
| Lock (`demo-no-delivery`) | [`8c6d1572…`](https://preprod.cardanoscan.io/transaction/8c6d1572790cfbdd152f7ac1bc84cdfc89b3fe6e850506b9eb18fd4ebd220259) | seller posts nothing |
| Buyer `withdrawRefund` after `submit_result_time` | pending (after 08:15 UTC) | |
| Earlier refund of an expired lock, detected by the API as `refunded` | [`0b320b8d…`](https://preprod.cardanoscan.io/transaction/0b320b8dd8bbc0dbbc54534883bd3749e3255586fc6b55c5255a5347654d3020) | 10 tADA lock `8068f7fe…` |

### 4. Protected, wrong file: dispute, arbiter pays the buyer
| Step | Tx | Notes |
|---|---|---|
| Lock (`demo-wrong-file`) | [`d7485072…`](https://preprod.cardanoscan.io/transaction/d7485072b936998df2cafe22fb003731ac8396f9f7e91fe7d4244dd62ff0ef7f) | listing commits to `990cf6bb…` |
| Seller posts the hash of the wrong file | [`ff8b418a…`](https://preprod.cardanoscan.io/transaction/ff8b418a9921a2755793fe7c5dfdc8e3f885239a0a060221170e07919371bba1) | |
| Buyer `verifyDelivery` → `mismatch` (`da7bd341…` ≠ `990cf6bb…`), `setRefundRequested` | [`c1e28c30…`](https://preprod.cardanoscan.io/transaction/c1e28c303d20e9107c56d423fec7bebfa2c09b1c85d0bf666e607cb8c3abe909) | Disputed |
| Arbiter payout to the buyer | pending (after 08:45 UTC) | earlier proof: [`074da4b5…`](https://preprod.cardanoscan.io/transaction/074da4b5eda0a23af5513f9d4115f0d74f70c12e109a8353ca256bcf15ba90ec), 5.0 tADA to the buyer |

## Time and cost (measured)
| Path | Time | Buyer fee | Seller / arbiter fees |
|---|---|---|---|
| Instant | 17–31 s to content | ~0.17 tADA | 0 |
| Protected lock + content | 30–50 s | ~0.19 tADA | 0 |
| Seller paid (result + withdraw) | ≥ ~31 min after the quote | 0 | ~0.64 tADA per escrow tx |
| Refund, no delivery | ≥ ~16 min after the quote | ~0.64 tADA | 0 |
| Dispute → arbiter | ≥ ~46 min after the quote | ~0.64 tADA | arbiter ~0.67 tADA |

## Demo video plan (3 min)
The escrow time rules (refund ≥ 16 min, arbiter ≥ 46 min) don't fit in a video, so:

1. **Live (≈1:30):** Claude Code with the Simpuru MCP. *"Find a CSV dataset and buy it with buyer protection."* → `search_listings` → `buy_listing` protected → content + hash check + refund deadlines. Open the purchase timeline in the web app.
2. **Pre-run (≈1:00):** the receipts above, path 3 (refund) and path 4 (wrong file → dispute → arbiter pays the buyer) on the timeline and the explorer.
3. **Close (≈0:30):** "On Cardano today an x402 buyer has no refund path. Simpuru gives agents one."

Start the slow paths at least an hour before recording.
