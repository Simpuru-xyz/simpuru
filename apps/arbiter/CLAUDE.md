# apps/arbiter

Dispute resolution. Owner: @ghozzza. Issue #11.

- Input: a disputed lock. Re-checks the delivery against the committed hashes (same logic as #9).
- Decides buyer or seller, builds `disputeWithdrawal` (`@simpuru/escrow`), signs with the arbiter
  key (CIP-8 ed25519).
- Rejects tampered or early payouts. Arbiter payout is only possible after the dispute window
  (~37 min with short deadlines, ~47 min with defaults).
- Exposed as a small HTTP endpoint or CLI for the watcher and API.
- The arbiter key never goes in the repo.

## Original work only

No code, names, assets, links or wording copied from other projects, and no other project's name
in code, comments, file names or commit messages. Check `git diff --cached` before every commit.
See the root `CLAUDE.md`.
