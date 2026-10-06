# @simpuru/agent

Buyer agent + protection watcher: pays over x402, verifies delivery, auto-refunds or disputes, enforces a spend budget.

Owner: @ghozzza

```bash
bun run buy <listingId> [instant|protected]   # needs BUYER_MNEMONIC + BLOCKFROST_PROJECT_ID
```

Before anything is signed it refuses: an escrow other than ours, a `payTo` other than the listed
seller (instant), an amount other than the listed price, more than `MAX_PER_PAYMENT_LOVELACE`
(default 20 tADA) per payment, and more than `DAILY_BUDGET_LOVELACE` (default 50 tADA) per UTC day.

Every purchase is appended to `data/purchases.jsonl` (git-ignored): tx hash, received vs committed
content hash, and for protected buys the escrow deadlines and identifier the watcher (#10) needs.
Library use: `import { createBuyer, buyerFromEnv } from "@simpuru/agent"`.
