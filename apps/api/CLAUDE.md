# apps/api

Hono API on Bun. Owner: @yeheskieltame.

- Catalogue and listings with a content-hash commitment (#5): `GET /listings`, `GET /listings/:id`,
  `POST /listings` returns `contentHash`.
- x402 paywall (#6): `GET /listings/:id/unlock` answers 402 with two `accepts`: `default` (instant)
  and `masumi` (protected, our escrow deployment from #3).
- In-process `@x402/cardano` facilitator. The hosted preprod one can time out and does not recover
  a payment that was already broadcast.
- Seller agent (#12): `submitResult`, `withdraw`, optional `authorizeRefund`.
- Returning buyer lookup and issued-quote log (#17).
- Protected path only makes sense from ~5 tADA; the seller pays ~1.35 tADA in escrow fees per sale.
- Response shapes come from `@simpuru/core` (#2).
- Accounts (#86, #87): sign in with Cardano (`/auth/*`), session bearer, `/me` routes; every
  account has a Simpuru wallet (`accounts.ts`) that web purchases and agents spend from.

## Original work only

No code, names, assets, links or wording copied from other projects, and no other project's name
in code, comments, file names or commit messages. Check `git diff --cached` before every commit.
See the root `CLAUDE.md`.
