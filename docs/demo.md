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
| Seller agent withdraws after `unlock_time` (automatic) | [`61eb7ffd…`](https://preprod.cardanoscan.io/transaction/61eb7ffd37c64c79b68950bde150f31ad761c5f900278ec87ff0e33422e714e9) | seller paid, via Blockfrost |

### 3. Protected, seller never delivers: buyer refunded
| Step | Tx | Notes |
|---|---|---|
| Lock (`demo-no-delivery`) | [`8c6d1572…`](https://preprod.cardanoscan.io/transaction/8c6d1572790cfbdd152f7ac1bc84cdfc89b3fe6e850506b9eb18fd4ebd220259) | seller posts nothing |
| Protection watcher refunds the buyer on its own (`watch.ts`) | [`9b789223…`](https://preprod.cardanoscan.io/transaction/9b78922320d2be04be4742a24610eb569f38788421c0d77d57d6628103853091) | same pass also refunded [`d17c506c…`](https://preprod.cardanoscan.io/transaction/d17c506c32e16fdaa9387a0c018ddab4c6de5752e1e090b1ea340065fbd123f6) and [`dae0b846…`](https://preprod.cardanoscan.io/transaction/dae0b846e820fa5b9811b1fc3f265dba31d54a3aa52d757a404b6eab412f0f00) |
| Earlier refund of an expired lock, detected by the API as `refunded` | [`0b320b8d…`](https://preprod.cardanoscan.io/transaction/0b320b8dd8bbc0dbbc54534883bd3749e3255586fc6b55c5255a5347654d3020) | 10 tADA lock `8068f7fe…` |

### 4. Protected, wrong file: dispute, arbiter pays the buyer
| Step | Tx | Notes |
|---|---|---|
| Lock (`demo-wrong-file`) | [`d7485072…`](https://preprod.cardanoscan.io/transaction/d7485072b936998df2cafe22fb003731ac8396f9f7e91fe7d4244dd62ff0ef7f) | listing commits to `990cf6bb…` |
| Seller posts the hash of the wrong file | [`ff8b418a…`](https://preprod.cardanoscan.io/transaction/ff8b418a9921a2755793fe7c5dfdc8e3f885239a0a060221170e07919371bba1) | |
| Buyer `verifyDelivery` → `mismatch` (`da7bd341…` ≠ `990cf6bb…`), `setRefundRequested` | [`c1e28c30…`](https://preprod.cardanoscan.io/transaction/c1e28c303d20e9107c56d423fec7bebfa2c09b1c85d0bf666e607cb8c3abe909) | Disputed |
| Arbiter decides **buyer** from evidence (#43) and pays out after the dispute window | [`7132086b…`](https://preprod.cardanoscan.io/transaction/7132086b6142a805e0018458800d4053eae7a865f9f58d1eb924fc6ad1ca3d1b) | earlier proof: [`074da4b5…`](https://preprod.cardanoscan.io/transaction/074da4b5eda0a23af5513f9d4115f0d74f70c12e109a8353ca256bcf15ba90ec), 5.0 tADA to the buyer |

## Time and cost (measured)
| Path | Time | Buyer fee | Seller / arbiter fees |
|---|---|---|---|
| Instant | 17–31 s to content | ~0.17 tADA | 0 |
| Protected lock + content | 30–50 s | ~0.19 tADA | 0 |
| Seller paid (result + withdraw) | ≥ ~31 min after the quote | 0 | ~0.64 tADA per escrow tx |
| Refund, no delivery | ≥ ~16 min after the quote | ~0.64 tADA | 0 |
| Dispute → arbiter | ≥ ~46 min after the quote | ~0.64 tADA | arbiter ~0.67 tADA |

## Demo video script (3 min)

The submission is a **3-minute video**. Refund, seller payout and arbiter payout are gated by escrow
deadlines (≥ 16 / 31 / 46 min after the quote), so those escrows are **staged before recording** with
Ghoza's script (#49), using the recording start time as the slot, so each gate opens while we record.
The purchase itself is recorded as it happens.

**T − 50 min:** `stage run --slot <recording start>`: buys the staged escrows against `https://api.simpuru.xyz`.
**T − 5 min:** `stage check`: every staged escrow shows its state and seconds until its gate opens.
Watcher and arbiter running (Blockfrost key). Screen: Claude Code with the Simpuru MCP, the app open on
the catalogue, cardanoscan open. Record in one take where possible; cut between scenes otherwise.

| Time | On screen | Said |
|---|---|---|
| 0:00 | Landing | (voice-over) "An AI agent can pay on Cardano with x402. But once it has paid, nobody makes sure it gets what it paid for. x402 ends at the lock." |
| 0:20 | Claude Code: *"Find a hero section prompt on Simpuru and buy it with buyer protection."* | "It searches, picks a prompt, and pays into escrow. No card, no account." |
| 0:50 | MCP result: content + `contentMatchesListing: true` + refund deadlines; purchase timeline in the app | "The seller committed to the hash of this prompt before it was paid. The agent just checked it." |
| 1:20 | Staged escrow 1 timeline: `ResultSubmitted` → `withdrawn` (gate opens on stage) | "Honest seller: the seller agent collects on its own once the window closes." |
| 1:45 | Staged escrow 2: seller never delivered → watcher refunds, tx on cardanoscan | "No delivery: the agent gets its money back. Nobody had to notice." |
| 2:15 | Staged escrow 3: wrong file → dispute → arbiter pays the buyer | "Wrong file: the arbiter checks three hashes the seller can't change and pays the buyer back." |
| 2:45 | README track table | "Buyer protection for x402 agents on Cardano, running on preprod today. That's Simpuru." |

**Fallbacks:** if a staged gate is late, cut to the same path from the receipts above (every row is a real tx).
If the buy takes longer than 60 s on camera, cut the wait: the settlement finishes in the background
and the agent never pays twice (#31).
