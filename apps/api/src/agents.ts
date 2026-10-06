// Server-side care for hosted agent wallets: balances, sending funds home, and the buyer
// protection watcher that refunds or disputes their protected purchases on the owner's behalf.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Address, Assets } from "@evolution-sdk/evolution";
import { createWatcher } from "@simpuru/agent";
import { type Actor, walletClient } from "@simpuru/escrow";
import type { Accounts } from "./accounts";

type Blockfrost = (path: string) => Promise<unknown>;

export async function lovelaceAt(bf: Blockfrost, address: string) {
  try {
    const a = (await bf(`/addresses/${address}`)) as {
      amount: { unit: string; quantity: string }[];
    };
    return BigInt(a.amount.find((x) => x.unit === "lovelace")?.quantity ?? "0");
  } catch {
    return 0n; // a fresh address is unknown to Blockfrost (404) until it receives funds
  }
}

// Left behind for the network fee and so change never falls under min-UTxO.
const RESERVE = 2_000_000n;

/** Sends everything the wallet holds, minus a fee reserve, to `to`. */
export async function sendAllTo(signer: Actor, to: string) {
  const wallet = walletClient(signer);
  const utxos = await wallet.getWalletUtxos();
  const total = utxos.reduce((n, u) => n + u.assets.lovelace, 0n);
  if (total <= RESERVE + 1_000_000n) throw new Error("nothing to send back yet");
  const lovelace = total - RESERVE;
  const tx = await wallet
    .newTx()
    .payToAddress({ address: Address.fromBech32(to), assets: Assets.fromLovelace(lovelace) })
    .build({ changeAddress: await wallet.address() });
  const hash = await (await tx.sign()).submit();
  return { tx: Buffer.from(hash.hash).toString("hex"), lovelace };
}

/** One protection watcher per owner, ticking every 30 s over that owner's purchases. */
export function startAgentWatchers(accounts: Accounts, dataDir: string, intervalMs = 30_000) {
  const watchers = new Map<string, ReturnType<typeof createWatcher>>();
  const deliveries = join(dataDir, "agents", "deliveries");
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      for (const owner of accounts.owners()) {
        let w = watchers.get(owner);
        if (!w) {
          const buyer = accounts.buyerFor(owner);
          w = createWatcher({
            purchases: () => buyer.purchases(),
            delivery: (lockTx) => {
              const path = join(deliveries, lockTx);
              return /^[0-9a-f]{64}$/.test(lockTx) && existsSync(path)
                ? readFileSync(path, "utf8")
                : undefined;
            },
            statusPath: join(dataDir, "agents", `${owner.slice(-16)}.watch.json`),
            buyer: accounts.signerFor(owner),
            ...(process.env.ARBITER_URL
              ? {
                  arbiter: { url: process.env.ARBITER_URL, token: process.env.ARBITER_TOKEN ?? "" },
                }
              : {}),
          });
          watchers.set(owner, w);
        }
        await w
          .tick()
          .catch((e) => console.warn(`[watch] ${owner.slice(-8)} ${String(e).slice(0, 160)}`));
      }
    } finally {
      running = false;
    }
  };
  void tick();
  return setInterval(tick, intervalMs);
}
