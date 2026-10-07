# apps/docs

Mintlify documentation site (`docs.json` + MDX), served at docs.simpuru.xyz. Owner: @AdityaWisnuu.

- Run with `bun run preview` (npx `mint@4`, port 3333); `bun run check` for broken links. The script is
  `preview`, not `dev`, so `turbo run dev` at the root does not start it.
- Facts and numbers only from the code, `README.md`, `docs/demo.md`, `docs/writeup.md`; on-chain claims
  link their preprod tx. Keep pages in step with the API and app when they change.
- The API reference tab reads the live OpenAPI; do not copy endpoints into MDX by hand.

## Original work only

No code, names, assets, links or wording copied from other projects, and no other project's name
in code, comments, file names or commit messages. Check `git diff --cached` before every commit.
See the root `CLAUDE.md`.
