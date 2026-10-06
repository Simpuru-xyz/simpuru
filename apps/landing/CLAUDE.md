@AGENTS.md

# apps/landing

Marketing landing page, separate from the app. Next.js 16 (App Router, Turbopack), React 19,
Tailwind v4, React Compiler, `lucide-react`. Port 3001. Owner: @Lexirieru. Issues #25, #16.

## Sections

Hero → how it works (`#how-it-works`, also states the problem) → instant vs protected
(`#instant-vs-protected`) → connect your agent (`#for-agents`) → chat demo → footer.
Still to build for #25: preprod proof links (from #19), dark mode.

## Copy

- Plain words. Say "agent", not "AI". Prices are "a few cents", not "ADA". No "escrow",
  "on-chain" or "hash" in the hero; the developer section may be technical.
- Credit the stack accurately: x402 on Cardano, escrow from Masumi (`vested_pay`). Do not claim a
  Sokosumi listing; our locks are not visible there.
- Few words per block. Section visuals come from the MotionSites library (owner's licence); keep
  the assets in `public/` (videos re-encoded to 720p, no audio) instead of hotlinking.
- Agent setup snippets mirror `apps/mcp/README.md` and `apps/agent/README.md`. Change them together.

## Notes

- App routes go through `APP_URL` (`NEXT_PUBLIC_APP_URL`) in `src/lib/links.ts`; explorer links
  only to `preprod.cardanoscan.io` (`explorerTx`).
- Staggered entrances start at `opacity: 0`; keep the reduced-motion rules in `globals.css`.
- `AGENTS.md` is managed by `next dev`; leave its marked block alone.
- Verify with `bun run lint`, `bun run typecheck` and `bun run build` before committing.

## Original work only

No code, names, assets, links or wording copied from other projects, and no other project's name
in code, comments, file names or commit messages. Check `git diff --cached` before every commit.
See the root `CLAUDE.md`.
