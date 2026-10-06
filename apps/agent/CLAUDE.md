# apps/agent

Buyer agent and protection watcher. Owner: @ghozzza.

- CLI (#8): `bun run buy <listingId> [instant|protected]`, needs `BUYER_MNEMONIC` + `BLOCKFROST_PROJECT_ID`. Before signing: `payTo` must be our approved escrow
  deployment, per-payment cap, daily cumulative budget.
- Verification (#9): recompute `input_hash` / `result_hash`, compare with the datum and the
  listing's `contentHash`. Result: `ok` | `mismatch` | `no_result_yet`.
- Watcher (#10): no result by `submit_result_time` → `withdrawRefund`; `mismatch` →
  `setRefundRequested`. Poll every 20–30 s, log every action with its tx hash, expose status for
  the web timeline (#14).
- End-to-end preprod runs and demo plan (#19).

## Original work only

No code, names, assets, links or wording copied from other projects, and no other project's name
in code, comments, file names or commit messages. Check `git diff --cached` before every commit.
See the root `CLAUDE.md`.
