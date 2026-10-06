// Trace an escrow UTxO back to the transaction that first locked it.
//
// Every escrow action spends the previous escrow UTxO and re-locks it, so the
// chain of txs is: lock → (submit / dispute / ...) → current. The lock tx is the
// first one with no input from this escrow. Team convention (packages/core/src/hash.ts):
// the lock tx hash is the `identifier_from_purchaser` in the seller's result hash,
// so whoever verifies a result needs it, and must not take it from a caller.
//
// One tx may spend several escrow UTxOs at once (the validator allows it), so
// "the escrow input" is ambiguous. Each escrow keeps its `reference_signature`
// across every step, and the validator rejects two inputs or two outputs sharing
// one, so the previous step is the escrow input carrying the same signature.
import { parseMasumiLockDatum } from "@x402/cardano";
import { KOIOS_PREPROD } from "./chain";
import { loadDeployment } from "./deployment";

async function koios<T>(path: string, body: unknown): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${KOIOS_PREPROD}/${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Koios ${path} ${res.status}`);
      const rows = (await res.json()) as T;
      // Public Koios can answer from a lagging backend with an empty list; retry before believing it.
      if (Array.isArray(rows) && rows.length === 0) throw new Error(`Koios ${path}: empty answer`);
      return rows;
    } catch (error) {
      if (attempt >= 4) throw error;
      await Bun.sleep(2_000);
    }
  }
}

interface TxInput {
  tx_hash: string;
  tx_index: number;
  payment_addr: { bech32: string };
}

interface TxOutput {
  tx_index: number;
  payment_addr: { bech32: string };
}

interface UtxoInfo {
  tx_hash: string;
  tx_index: number;
  inline_datum: { bytes: string | null } | null;
}

type DatumView = NonNullable<ReturnType<typeof parseMasumiLockDatum>>;

async function datums(refs: string[]): Promise<Map<string, DatumView>> {
  const rows = await koios<UtxoInfo[]>("utxo_info", { _utxo_refs: refs, _extended: true });
  const out = new Map<string, DatumView>();
  for (const row of rows) {
    const bytes = row.inline_datum?.bytes;
    const view = bytes ? parseMasumiLockDatum(bytes) : null;
    if (view) out.set(`${row.tx_hash}#${row.tx_index}`, view);
  }
  return out;
}

/**
 * Anyone can create a UTxO at a script address with any datum, so the root of a
 * lineage is only accepted as a lock if the escrow output it created for this
 * reference signature is a fresh lock: FundsLocked, no result hash.
 */
async function assertFreshLock(
  txHash: string,
  outputs: TxOutput[],
  escrow: string,
  signature: string,
) {
  const refs = outputs
    .filter((o) => o.payment_addr.bech32 === escrow)
    .map((o) => `${txHash}#${o.tx_index}`);
  const views = refs.length ? await datums(refs) : new Map<string, DatumView>();
  const mine = [...views.values()].filter((v) => v.referenceSignature === signature);
  if (mine.length !== 1 || mine[0]?.state !== 0n || mine[0]?.resultHash !== "") {
    throw new Error(`${txHash} is not a fresh vested_pay lock for this escrow`);
  }
}

/** Hash of the tx that locked the funds now sitting at escrow UTxO `ref`. */
export async function lockTxOf(ref: string, maxHops = 32): Promise<string> {
  const escrow = loadDeployment().escrowAddress;
  const signature = (await datums([ref])).get(ref)?.referenceSignature;
  if (!signature) throw new Error(`${ref} does not carry a vested_pay datum`);

  let txHash = ref.split("#")[0] ?? "";
  for (let hop = 0; hop < maxHops; hop++) {
    const [tx] = await koios<{ inputs: TxInput[]; outputs: TxOutput[] }[]>("tx_info", {
      _tx_hashes: [txHash],
      _inputs: true,
    });
    const escrowInputs = (tx?.inputs ?? [])
      .filter((i) => i.payment_addr.bech32 === escrow)
      .map((i) => `${i.tx_hash}#${i.tx_index}`);
    const inputViews = escrowInputs.length
      ? await datums(escrowInputs)
      : new Map<string, DatumView>();
    const previous = escrowInputs.filter(
      (r) => inputViews.get(r)?.referenceSignature === signature,
    );
    if (previous.length === 0) {
      // No earlier step for this escrow: this tx must be where it was locked.
      await assertFreshLock(txHash, tx?.outputs ?? [], escrow, signature);
      return txHash;
    }
    if (previous.length > 1)
      throw new Error(`${txHash} spends two escrow inputs with one reference signature`);
    txHash = previous[0]?.split("#")[0] ?? "";
  }
  throw new Error(`no lock tx within ${maxHops} hops of ${ref}`);
}
