// Resolve one disputed escrow: read it from chain, decide from evidence, sign the
// payout with the arbiter key, and submit it once the dispute window is open.
//
// The caller supplies evidence, never the split: the split follows from the verdict,
// and the signature covers that exact split for that exact UTxO. Evidence that
// matches the seller's posted result hash is remembered (store.ts), so a later
// caller cannot replace it, and each escrow is paid out once.
import { PrivateKey } from "@evolution-sdk/evolution";
import { resultHash } from "@simpuru/core/hash";
import {
  findEscrowUtxo,
  lockTxOf,
  mnemonicFor,
  payoutIntent,
  signIntent,
  viewOf,
  withdrawDisputed,
} from "@simpuru/escrow";
import { type DisputeEvidence, decide, type Verdict } from "./evidence";
import type { Store } from "./store";

export interface ResolveRequest {
  /** Disputed escrow UTxO, `txHash#index`. */
  ref: string;
  listing: DisputeEvidence["listing"];
  output: string;
}

/** How long after the dispute window opens the seller has to show its delivered output. */
export const EVIDENCE_GRACE_MS = 10n * 60_000n;

export type ResolveResult =
  | { status: "paid"; verdict: Verdict; payout: Payout; tx: string }
  | { status: "signed"; verdict: Verdict; payout: Payout; opensAt: string }
  | { status: "no_verdict"; verdict: Verdict };

interface Payout {
  buyerLovelace: string;
  sellerLovelace: string;
}

export function resolve(req: ResolveRequest, store: Store): Promise<ResolveResult> {
  return store.exclusive(req.ref, () => resolveOnce(req, store));
}

async function resolveOnce(req: ResolveRequest, store: Store): Promise<ResolveResult> {
  const paid = store.payoutFor(req.ref);
  if (paid) throw new Error(`escrow ${req.ref} was already paid out in ${paid}`);
  const utxo = await findEscrowUtxo(req.ref);
  const view = viewOf(utxo);
  if (view.state !== 3n) throw new Error(`escrow ${req.ref} is not Disputed`);

  const lockTx = await lockTxOf(req.ref);
  if (resultHash(lockTx, req.output) === view.resultHash) {
    store.recordEvidence(lockTx, view.resultHash, req.output);
  }
  // Once evidence for the result now on chain exists, it is the evidence, whatever this caller sent.
  const output = store.evidenceFor(lockTx, view.resultHash) ?? req.output;

  const verdict = decide({
    escrow: { inputHash: view.inputHash, resultHash: view.resultHash },
    listing: req.listing,
    output,
    identifierFromPurchaser: lockTx,
    evidenceDeadlineMs: view.externalDisputeUnlockTime + EVIDENCE_GRACE_MS,
    nowMs: BigInt(Date.now()),
  });
  if (verdict.winner === null) return { status: "no_verdict", verdict };

  // Buyer wins: everything back. Seller wins: everything but the buyer's collateral.
  const total = utxo.assets.lovelace;
  const buyerLovelace = verdict.winner === "buyer" ? total : view.collateralReturnLovelace;
  const sellerLovelace = total - buyerLovelace;
  const payout = {
    buyerLovelace: buyerLovelace.toString(),
    sellerLovelace: sellerLovelace.toString(),
  };

  const arbiterKey = PrivateKey.fromMnemonicCardano(mnemonicFor("arbiter"));
  const signature = signIntent(arbiterKey, payoutIntent(utxo, buyerLovelace, sellerLovelace));

  const opensAt = view.externalDisputeUnlockTime + 1_000n;
  if (BigInt(Date.now()) <= opensAt) {
    return { status: "signed", verdict, payout, opensAt: new Date(Number(opensAt)).toISOString() };
  }
  const tx = await withdrawDisputed(req.ref, {
    buyerLovelace,
    sellerLovelace,
    signatures: [signature],
  });
  store.recordPayout(req.ref, tx);
  return { status: "paid", verdict, payout, tx };
}
