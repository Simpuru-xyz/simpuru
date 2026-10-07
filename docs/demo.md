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

### 5. A real agent over the hosted MCP (production)
Claude Code with only `claude mcp add --transport http simpuru https://api.simpuru.xyz/mcp`:
browse → filter `minReputation: 80` (both 0/100 demo sellers left out) → buy protected → status →
buy again (`alreadyPaid`, 0 tADA) → `my_purchases`.

| Step | Tx | Notes |
|---|---|---|
| `buy_listing kinetic-pricing-section protected` | [`fc9db1e1…`](https://preprod.cardanoscan.io/transaction/fc9db1e1a198a7dd3b270dc57bd793c66c4d05e14538e42b8a04caa4230ee7be) | 10 tADA into escrow in ~22 s, content hash matches |
| VPS seller agent posts the result (automatic, ~1 min) | [`acf5a3cd…`](https://preprod.cardanoscan.io/transaction/acf5a3cd47e1b839bcf47142b5d380cf6e7e6b8bf500fd7a259e49067f06f627) | |
| VPS seller agent withdraws after `unlock_time` | [`69eece05…`](https://preprod.cardanoscan.io/transaction/69eece05747a816208c7e735f55a553ec254d49ae74c928121e612ada9cb53a3) | seller reputation now 100/100 over 4 closed escrows |

### 6. A person on the website: account, Simpuru wallet, creator paid (production)
Sign in with Cardano → fund the Simpuru wallet (15 tADA) → buy protected on the web (`POST /me/buy`) →
content → buy again (free, already owned) → seller agent collects → the platform pays the creator →
owner withdraws the Simpuru wallet.

| Step | Tx | Notes |
|---|---|---|
| Protected buy from the Simpuru wallet | [`0159485b…`](https://preprod.cardanoscan.io/transaction/0159485bc6894d2ad005fe9e417952698339332494dcec8146b34828ef313238) | 5 tADA into escrow, content on screen |
| Seller agent posts the result | [`d34b1fd3…`](https://preprod.cardanoscan.io/transaction/d34b1fd3c8b8908c3feb0f3b28e3f7dfff8aa9af40f68e603c9ec69b512b2cde) | |
| Seller agent withdraws after `unlock_time` | [`f3f1d508…`](https://preprod.cardanoscan.io/transaction/f3f1d5088aea13fe14024283d6dc7ed8a490415ea0163eb749c99c56cd82ef5c) | |
| Platform pays the creator (`creator_paid`) | [`93775c58…`](https://preprod.cardanoscan.io/transaction/93775c583eec1acf49308c2141c9b6ec2cb04238e508d37b81246403b40eb180) | 5 − max(1.5, 10%) = 3.5 tADA |
| Owner withdraws the Simpuru wallet | [`293721b3…`](https://preprod.cardanoscan.io/transaction/293721b3610618309b1ca96cce42d0c5345d220debc4275c550ae883ec0ea679) | 7.8 tADA back to the signed-in wallet |

### 7. Agent to agent on Sokosumi: Simpuru Shopper (Masumi Coworker)
Task `01a114d1-f74d-7769-a8c6-fc07647e4c98` in the TOKEN2049 workspace, Coworker
`01a1149a-fb93-7344-a6e3-bbe9432cadc5`: *"Find me a design prompt for an ecommerce landing page on Simpuru.
Budget max 10 tADA."* The Shopper quotes 1 test USDM from our own payment node, buys a real creator listing
on Simpuru with buyer protection, and both escrows settle.

| Step | Tx | Notes |
|---|---|---|
| Agent registered in the Masumi registry | [`902ab355…`](https://preprod.cardanoscan.io/transaction/902ab3552607bfdcef414ad48bd0674a1ad48a6c8e0425b8eeed35dbb779e976) | our payment node, preprod |
| 1 test USDM locked (Masumi escrow) | [`5d406f9c…`](https://preprod.cardanoscan.io/transaction/5d406f9c4e4db34235148a9f33760f7713b1486722844a2e87426bcc61c109e9) | |
| Shopper buys the listing on Simpuru, protected | [`3219a522…`](https://preprod.cardanoscan.io/transaction/3219a522944214055ad9dc1574ed6971b5c5b05bc177902f5228ccd298502b2b) | 5 tADA into our escrow |
| Result hash posted (USDM escrow) | [`1fb3b13e…`](https://preprod.cardanoscan.io/transaction/1fb3b13e8d75dfee62b9ba9768ab714c9e3ee19f4c13888a22af2bc5b64840ca) | Task completed with the prompt |
| Seller agent result and withdraw (ADA escrow) | [`37735bee…`](https://preprod.cardanoscan.io/transaction/37735beeee1a976c4fd5783c74377e92831dda3ef7183ddb768033f66b993e8a), [`ef89895f…`](https://preprod.cardanoscan.io/transaction/ef89895f89f9c91d8bf67c17eb479431cb6a8a88f95291981108cbf713f1308d) | |
| Creator paid | [`af4944a7…`](https://preprod.cardanoscan.io/transaction/af4944a72de3af14bf5f60a9beab7a8731ee2674e7ee39c1b4bf514ccee67f0b) | 3.5 tADA |
| Shopper's fee collected (Withdrawn) | [`b18e3608…`](https://preprod.cardanoscan.io/transaction/b18e3608011af78ed2ce4f4f1d32c599f8f457a91cc51dac45b14bb9229ba9d5) | net 1 test USDM to the seller wallet |

## Time and cost (measured)
| Path | Time | Buyer fee | Seller / arbiter fees |
|---|---|---|---|
| Instant | 17–31 s to content | ~0.17 tADA | 0 |
| Protected lock + content | 30–50 s | ~0.19 tADA | 0 |
| Seller paid (result + withdraw) | ≥ ~31 min after the quote | 0 | ~0.41 + ~0.36 tADA ([`ae0d6ecc…`](https://preprod.cardanoscan.io/transaction/ae0d6ecc363d6c3f8e38a370abc0321c2db55c8c2365b7cabf062b1bed357038), [`5d2b1d91…`](https://preprod.cardanoscan.io/transaction/5d2b1d91e3bfd98540020618175c10744aa98cb33ae1e5a743f1652421798c13)) |
| Refund, no delivery | ≥ ~16 min after the quote | ~0.35 tADA ([`03705831…`](https://preprod.cardanoscan.io/transaction/037058316de32739a3821e2cbb5a1cae7db575a44de2eb9afabe9f1bcdc9bc34)) | 0 |
| Dispute → arbiter | ≥ ~46 min after the quote | ~0.40 tADA ([`236160f6…`](https://preprod.cardanoscan.io/transaction/236160f667faae70d5c3788d3caeb0b528e80de4f0388c01be42b4cae56327cd)) | arbiter ~0.39 tADA ([`7267d42f…`](https://preprod.cardanoscan.io/transaction/7267d42f984ac11e1f97843c303c5aaf2f374cd1ff774a6163c5bfee7d426c96)) |

Escrow fees above are with the validator read from the reference script (#45); before it, each escrow tx cost ~0.64–0.69 tADA.

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
| 0:15 | app.simpuru.xyz: Sign in with the wallet → Account: Simpuru wallet balance → a listing → **Buy with protection** | "Your account is your Cardano wallet. You pay from your Simpuru wallet; the money waits in escrow until the prompt checks out." |
| 0:35 | Agents page: limits → Claude Code: *"Find a hero section prompt on Simpuru and buy it with buyer protection."* | "Your agent shops from the same wallet, inside the limits you set." |
| 0:50 | MCP result: content + `contentMatchesListing: true` + refund deadlines; purchase timeline in the app | "The seller committed to the hash of this prompt before it was paid. The agent just checked it." |
| 1:20 | Staged escrow 1 timeline: `ResultSubmitted` → `withdrawn` (gate opens on stage) | "Honest seller: the seller agent collects on its own once the window closes." |
| 1:45 | Staged escrow 2: seller never delivered → watcher refunds, tx on cardanoscan | "No delivery: the agent gets its money back. Nobody had to notice." |
| 2:15 | Staged escrow 3: wrong file → dispute → arbiter pays the buyer | "Wrong file: the arbiter checks three hashes the seller can't change and pays the buyer back." |
| 2:35 | Sokosumi: a Task to **Simpuru Shopper** → USDM locked → result with the prompt and the Simpuru receipt | "Agent to agent: on Sokosumi our Shopper is hired in USDM, and buys on Simpuru with buyer protection." |
| 2:50 | README track table | "Buyer protection for x402 agents on Cardano, running on preprod today. That's Simpuru." |

**Fallbacks:** if a staged gate is late, cut to the same path from the receipts above (every row is a real tx).
If the buy takes longer than 60 s on camera, cut the wait: the settlement finishes in the background
and the agent never pays twice (#31).
