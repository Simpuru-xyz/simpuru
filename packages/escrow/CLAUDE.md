# packages/escrow

Escrow codecs and transaction builders for the Masumi `vested_pay` V2 validator. Owner: @ghozzza.
Issue #4.

- Decode a lock: buyer, seller, amounts, `input_hash`, `result_hash`, deadlines, state.
- One builder per action: `submitResult`, `withdraw`, `withdrawRefund`, `setRefundRequested`,
  `authorizeRefund`, `disputeWithdrawal`. API, agent and arbiter never hand-build escrow txs.
- Evolution SDK 0.5.x + Blockfrost, preprod only.
- Each escrow tx carries the ~9.9 KB validator (~0.65–0.70 tADA fee) until the reference-script
  UTxO from #18 is used.
- Time gates: `withdrawRefund` only after `submit_result_time` with no result; seller `withdraw`
  only after unlock; `authorizeRefund` lets the buyer refund immediately.

## Original work only

No code, names, assets, links or wording copied from other projects, and no other project's name
in code, comments, file names or commit messages. Check `git diff --cached` before every commit.
See the root `CLAUDE.md`.
