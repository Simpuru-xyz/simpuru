# Simpuru Shopper (Sokosumi Coworker)

A Sokosumi Task asks for a design prompt. The Shopper finds it on Simpuru, quotes **1 test USDM** through
our own Masumi Payment Service (Masumi escrow), waits until the buyer's funds are locked, then buys the
prompt on Simpuru **with buyer protection** (ADA, our escrow) from its own Simpuru account. The Task result
is the prompt plus the purchase receipt. Cardano **preprod** only.

```
Sokosumi Task ──► Shopper ──quote──► our payment node ──► masumiPayment event ──► USDM locked
                     │                                                            │
                     └──── buy (protected) on Simpuru ◄───────── FundsLocked ─────┘
                     └──── submit result hash ──► complete Task ──► fee collected after unlock
```

- Coworker: `01a1149a-fb93-7344-a6e3-bbe9432cadc5` (vendor `simpuru`), registered agent on preprod.
- Proof of a paid Task, both escrows settled: [`docs/demo.md`](../../docs/demo.md) path 7.

## Run it

1. **Sokosumi** (CLI `@masumi_network/sokosumi`): create a Vendor and a Coworker with the `tasks`
   capability, connect it to your workspace, and mint its runtime key:
   ```bash
   sokosumi --preprod vendors create --name "<name>" --slug <slug> --json
   sokosumi --preprod coworkers provision --vendor-id <VENDOR_ID> --name "Simpuru Shopper" --capability tasks --json
   sokosumi --preprod coworkers connect <COWORKER_ID> --vendor-id <VENDOR_ID> --workspace-id <ORG_ID> --json
   sokosumi --preprod coworkers api-key <COWORKER_ID> --json   # store the coworker_… key, never print it
   ```
2. **Masumi Payment Service** (own Postgres, preprod): seed it, fund its Selling wallet with a few tADA,
   register the agent (`POST /api/v1/registry`, `pricing: { pricingType: "Dynamic" }`) and wait for
   `RegistrationConfirmed`. Create a scoped key (`canPay`, Preprod, selling wallet only) for the worker.
3. **Simpuru account for the Shopper**: any preprod mnemonic; on first run it signs in and gets a Simpuru
   wallet. Fund that wallet with tADA so it can buy.
4. **Env** (`coworker.env` next to `docker-compose.yml`, never committed):

   | Var | What |
   |---|---|
   | `COWORKER_ID`, `SOKOSUMI_COWORKER_KEY` | Coworker and its runtime key |
   | `MPS_URL`, `MPS_TOKEN`, `MPS_AGENT_ID` | payment node, scoped key, `agentIdentifier` (omit all three to run unpaid) |
   | `SHOPPER_MNEMONIC` | the Shopper's Simpuru account |
   | `SIMPURU_API` | default `http://127.0.0.1:4021` |

5. Start: `docker compose --profile coworker up -d` (or `bun src/index.ts` here). It polls Sokosumi every
   10 s; per-Task state lives in `STATE_PATH`.

## Try it

Create a Task for the Coworker, e.g. *"Find me a design prompt for an ecommerce landing page on Simpuru.
Budget max 10 tADA."* It picks a listing by keywords within the budget (or a listing id in the text),
asks 1 test USDM, and completes the Task with the prompt and the Simpuru receipt. No match: it completes
without charging.
