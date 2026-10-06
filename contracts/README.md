# contracts

Owner: @ghozzza

On-chain side of Simpuru on Cardano preprod: the escrow deployment we use (validator, parameters,
arbiter keys) and the addresses it lives at. Deployment records go in `deployments/<network>.json`.

## Escrow: our own `vested_pay` deployment

We use Masumi's `vested_pay` V2 escrow validator unchanged, applied with **our** parameters instead
of Masumi's canonical ones. The three validator parameters are baked into the script hash, so our
escrow lives at its own address and our arbiter, not Masumi's admins, settles disputes.

| Parameter | Ours | Masumi canonical |
|---|---|---|
| `requiredAdmins` | `1` | `2` |
| `adminVkeys` | our arbiter key hash | 3 Masumi admin keys |
| `cooldownPeriod` | `60000` ms (1 min) | `420000` ms (7 min) |

The current values, script hash and address are in [`deployments/preprod.json`](deployments/preprod.json).

- **Validator:** `vested_pay.vested_pay.spend`, Plutus V3, from
  [`masumi-payment-service@d74b2c3`](https://github.com/masumi-network/masumi-payment-service/tree/d74b2c319228bcbef36632de37875c388dcee7ce/smart-contracts/payment-v2)
  (MIT). This is the blueprint the x402 Cardano spec pins.
- **Derivation:** `masumiEscrowAddress` / `masumiEscrowScriptHash` from `@x402/cardano` 2.28.0. That is
  the same code the x402 client and facilitator run to check `payTo`, so the recorded address is the one
  they will accept, as long as they are told to allow it (`validateCustomMasumiDeployment`).
- **No deployment transaction.** A parameterised spending validator needs no on-chain registration:
  funds are locked by paying to the address.
- **Reference script (#18).** The validator also sits in a reference-script UTxO
  (`referenceScript` in `deployments/preprod.json`), so escrow txs reference it instead of
  carrying ~9.9 KB each. Measured on preprod for the same `submitResult`: **0.689425 → 0.402252
  tADA** fee, 11,029 → 1,121 bytes. The UTxO sits at the native script "any of nothing"
  (`referenceScriptAddress`), which no one can ever spend, so no wallet can consume it by
  accident; its 43.75 tADA min-ADA is locked for good. Fine on preprod; on mainnet a key-locked
  address that can be reclaimed would be the better trade. Builders check that the UTxO carries
  exactly our validator before using it; `ESCROW_INLINE_SCRIPT=1` attaches the script instead.
- **Not visible to Masumi tooling.** Locks at our address do not show up in Sokosumi or the Masumi
  Payment Service. That is expected.

## Reproduce

```bash
cp .env.example .env            # fill ARBITER_MNEMONIC (fresh preprod-only wallet)
bun install
bun packages/escrow/scripts/derive-deployment.ts
bun packages/escrow/scripts/deploy-reference-script.ts   # once per deployment
```

Run it from the repo root so Bun loads `.env`. The script first checks itself: the canonical Masumi
parameters must derive to Masumi's published preprod escrow
(`addr_test1wzs4e6wc95hkwezlccjw9mdvq0r0rsgx6zk34avptga3ftgn37w4g`), otherwise it stops. It then
writes `deployments/preprod.json`. A different `ARBITER_MNEMONIC` gives a different address, so
whoever runs the arbiter must hold the key behind `arbiter.keyHash`.

## Time rules worth knowing

From the validator and the x402 Cardano spec:

- The buyer can take a refund alone only while **no result hash** is on chain, and only after
  `submit_result_time`.
- Once the seller has posted a result, the buyer's way back is a dispute; the arbiter can pay it out
  only after `external_dispute_unlock_time`.
- `@x402/cardano` 2.28.0 enforces deadline gaps in two places, and they differ:
  - **Facilitator verify** (`masumiDeadlineIntervalsHold`): `submit_result_time` ≥ `pay_by_time` + 5 min,
    `unlock_time` ≥ `submit_result_time` + 15 min, `external_dispute_unlock_time` ≥ `unlock_time` + 15 min.
  - **Quote issuer** (`MasumiQuoteIssuer`) adds one more: `submit_result_time` ≥ now + 15 min.

  So the earliest arbiter payout is about 45 min after a quote made with the official issuer, or about
  37 min if the API builds the quote itself and only the facilitator's gaps apply (asked in #21).
  Our cooldown parameter changes none of these.
