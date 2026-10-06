// Trace an escrow UTxO back to the transaction that first locked it.
//
// Every escrow action spends the previous escrow UTxO and re-locks it, so the
// chain of txs is: lock → (submit / dispute / ...) → current. The lock tx is the
// first one with no escrow input. Team convention (packages/core/src/hash.ts):
// the lock tx hash is the `identifier_from_purchaser` in the seller's result hash,
// so whoever verifies a result needs it, and must not take it from a caller.
import { KOIOS_PREPROD } from "./chain";
import { loadDeployment } from "./deployment";

interface TxInput {
  tx_hash: string;
  tx_index: number;
  payment_addr: { bech32: string };
}

async function txInputs(txHash: string): Promise<TxInput[]> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${KOIOS_PREPROD}/tx_info`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ _tx_hashes: [txHash], _inputs: true }),
      });
      if (!res.ok) throw new Error(`Koios tx_info ${res.status}`);
      const [tx] = (await res.json()) as { inputs: TxInput[] }[];
      // An unknown tx comes back as an empty list; on public Koios that can also be a
      // lagging backend, so it is retried before being believed.
      if (!tx) throw new Error(`tx ${txHash} not found`);
      return tx.inputs;
    } catch (error) {
      if (attempt >= 4) throw error;
      await Bun.sleep(2_000);
    }
  }
}

/** Hash of the tx that locked the funds now sitting at escrow UTxO `ref`. */
export async function lockTxOf(ref: string, maxHops = 32): Promise<string> {
  const escrow = loadDeployment().escrowAddress;
  let txHash = ref.split("#")[0] ?? "";
  for (let hop = 0; hop < maxHops; hop++) {
    const previous = (await txInputs(txHash)).find((i) => i.payment_addr.bech32 === escrow);
    if (!previous) return txHash;
    txHash = previous.tx_hash;
  }
  throw new Error(`no lock tx within ${maxHops} hops of ${ref}`);
}
