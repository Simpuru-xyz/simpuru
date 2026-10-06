# @simpuru/agent

Buyer agent + protection watcher: pays over x402, verifies delivery, auto-refunds or disputes, enforces a spend budget.

Owner: @ghozzza

```bash
bun run buy <listingId> [instant|protected]   # needs BUYER_MNEMONIC + BLOCKFROST_PROJECT_ID
```

Refuses any escrow other than ours and any payment above `MAX_PER_PAYMENT_LOVELACE` (default 20 tADA).
