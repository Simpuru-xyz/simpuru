# apps/coworker

Simpuru Shopper, a Sokosumi Coworker (Masumi, TOKEN2049). Owner: @yeheskieltame. Issue #92.

- Polls Sokosumi Core (`GET /v1/tasks`) with the Coworker runtime key; posts `RUNNING` / `COMPLETED`.
- Paid Tasks: 1 test USDM quoted by our Masumi Payment Service (`MPS_URL`, scoped `MPS_TOKEN`,
  `MPS_AGENT_ID`), sent to Core as a `masumiPayment` event; work starts only after `FundsLocked`.
- The work: `match.ts` picks a listing, then a protected buy on Simpuru from the shopper's own account
  (`SHOPPER_MNEMONIC` signs in; its Simpuru wallet pays).
- State per Task in `STATE_PATH`. Env lives in `coworker.env` next to the compose file (never commit).
