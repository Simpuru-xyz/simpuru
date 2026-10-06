# packages/core

Shared types, constants and hash helpers used by every app. Owner: @yeheskieltame. Issue #2.

- Listing, quote, purchase and escrow-state types that API, MCP, agent and web all import.
- One hashing implementation for `contentHash`, `input_hash`, `result_hash`, so every side
  computes the same value.
- No runtime dependencies on apps; apps depend on this, never the reverse.

## Original work only

No code, names, assets, links or wording copied from other projects, and no other project's name
in code, comments, file names or commit messages. Check `git diff --cached` before every commit.
See the root `CLAUDE.md`.
