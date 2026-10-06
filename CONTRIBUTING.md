# Contributing to Simpuru

Four people, 36 hours, one `main` that always works. These rules keep it that way.

## Team and ownership

| Area | Path | Owner |
|---|---|---|
| Backend: contracts, escrow, arbiter, buyer protection | `contracts/`, `packages/escrow`, `apps/arbiter`, `apps/agent` | @ghozzza |
| Backend: API, MCP, shared core | `apps/api`, `apps/mcp`, `packages/core` | @yeheskieltame |
| Frontend: app | `apps/web` | @Lexirieru |
| Frontend: landing page | `apps/landing` | @AdityaWisnuu |

`CODEOWNERS` asks the owner to review every PR that touches their area.

## Required setup (everyone)

1. Install [Bun](https://bun.sh) 1.4+, then run `bun install` at the repo root.
2. Install the Cardano developer skills so your AI assistant knows the Cardano ecosystem
   ([guide](https://developers.cardano.org/docs/developers/curriculum/start-building/ai-assisted-development/)):

   **Claude Code**
   ```
   /plugin marketplace add cardano-foundation/cardano-dev-skills
   /plugin install cardano-dev-skills@cardano-dev-skills
   /plugin list
   ```

   **Claude Cowork:** Customize → Plugins → add marketplace
   `https://github.com/cardano-foundation/cardano-dev-skills` → install `cardano-dev-skills`.

   **Other agents (Cursor, Codex, ...):**
   ```bash
   git clone https://github.com/cardano-foundation/cardano-dev-skills.git ../cardano-dev-skills
   mkdir -p .agents && ln -s ../../cardano-dev-skills/skills .agents/skills
   ```
   Optional: [Mesh AI](https://meshjs.dev/ai) and the Masumi skills if you work on those parts.
3. Copy `.env.example` to `.env` and fill it in. Never commit `.env`.

## Talk in issues

- Every piece of work has an issue. No issue, no PR. Open one first if it is missing.
- Questions, decisions, blockers and progress go in the issue comments, not in private chat,
  so the whole team (and future us) can see why something was done.
- Blocked by someone? Comment on the issue and @mention them.
- Assign yourself before you start so nobody does the same work twice.

## Branches, PRs, merge

`main` is protected: **no direct pushes. Every change goes through a pull request.**

1. Branch from the latest `main`: `<type>/<issue-number>-<short-name>`,
   e.g. `feat/12-refund-watcher`, `fix/20-quote-expiry`.
2. Commit with [Conventional Commits](https://www.conventionalcommits.org): `feat(agent): auto refund after deadline`.
3. Open a PR, fill in the template, and link the issue with `Closes #12`.
4. CI must be green (lint, typecheck, commit check).
5. Merge with **squash and merge**, then delete the branch.

Keep PRs small. A PR you can review in five minutes gets merged in five minutes.

## Commit and PR rules

- **No AI co-author lines.** Do not add `Co-Authored-By: Claude …` (or any AI assistant), and no
  "Generated with …" footers in commits or PR descriptions. If your tool adds them, remove them.
  CI rejects commits that contain them.
- No secrets, mnemonics or API keys in code, commits, issues or PRs. The repo is public.
- Cardano **preprod only**. Never build or sign a mainnet transaction.
- Every on-chain claim in a PR (it refunds, it settles) comes with the preprod tx hash.

## Commands

```bash
bun run dev        # all apps
bun run lint       # biome
bun run format     # biome --write
bun run typecheck  # tsc in every workspace
```
