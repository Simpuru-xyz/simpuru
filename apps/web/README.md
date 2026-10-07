# @simpuru/web

Web app for the spec in #86: catalogue, listing pages with buying, purchase timeline, account
(Simpuru wallet, purchases, selling), creator pages and agent setup. Marketing is `apps/landing`.

| Route | |
|---|---|
| `/listings`, `/listings/[id]` | Catalogue and a listing (Buy instant / Buy with protection, J3) |
| `/account` | Simpuru wallet (J2), `?tab=purchases` (J4), `?tab=selling` (J5) |
| `/sell` | Anyone can sell: list as the signed-in account (J5) |
| `/agents` | Agent spending limits and MCP setup for Claude Code / Desktop / Cursor (J6) |
| `/creators/[address]` | A creator's listings, sales and reputation (J7) |
| `/purchases/[id]` | Escrow timeline of one purchase |

Sign in with Cardano (J1): a CIP-30 wallet signs the API's challenge; the session token lives in
`localStorage` (`simpuru.session`) and goes out as `Authorization: Bearer`. A 401 signs out.

API base URL from `NEXT_PUBLIC_API_URL` (default `http://localhost:4021`).

Owner: @AdityaWisnuu

```bash
bun run dev   # http://localhost:3000
```
