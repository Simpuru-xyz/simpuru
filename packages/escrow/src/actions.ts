// One builder per vested_pay escrow action. Each spends one escrow UTxO with our
// applied validator, signs as the acting party, and (for non-terminal actions)
// pays the same value back to the escrow with a continuation datum.
//
// Timing follows the validator: "now" is the tx validity upper bound, and a new
// cooldown must be at least that plus the deployment's cooldown period.
import { Address, Assets, Data, KeyHash, PrivateKey, type UTxO } from "@evolution-sdk/evolution";
import { inlineDatum, parseMasumiLockDatum } from "@x402/cardano";
import { type Actor, mnemonicFor, type Role, readClient, walletClient } from "./chain";
import { redeemer, stateData, withFields } from "./datum";
import { loadDeployment } from "./deployment";
import {
  type AdminSignature,
  assetValueData,
  disputeIntentHash,
  outputReferenceData,
  verifyAdminSignature,
  withdrawDisputedRedeemer,
} from "./dispute";
import { escrowScriptStep } from "./script";

const TX_WINDOW_MS = 5 * 60_000;

/**
 * The wallet UTxOs an escrow tx may use: the ones holding >= 10 ADA when there are any. The SDK
 * takes 5 ADA of collateral from the smallest UTxO that covers it, so a UTxO just above 5 ADA leaves
 * a collateral return under min-UTxO and the build fails (seen on preprod, 6 Oct 2026: the seller
 * agent could not submit results while its wallet held a 5.64 ADA UTxO). Tokens on a roomy UTxO
 * are fine: they go back in the collateral return and the change.
 */
const ROOMY_LOVELACE = 10_000_000n;
async function roomyUtxos(wallet: ReturnType<typeof walletClient>) {
  const utxos = await wallet.getWalletUtxos();
  const roomy = utxos.filter((u) => u.assets.lovelace >= ROOMY_LOVELACE);
  return roomy.length > 0 ? roomy : utxos;
}

export function keyHashOf(role: Actor) {
  return KeyHash.fromPrivateKey(PrivateKey.fromMnemonicCardano(mnemonicFor(role)));
}

/**
 * Finds an escrow UTxO by `txHash#index`.
 *
 * Public Koios intermittently answers an address query with an empty list
 * (observed on preprod, 6 Oct 2026: 1 of 6 identical queries came back empty).
 * "Not found" is therefore only reported after several misses in a row, never
 * from a single empty answer.
 */
export async function findEscrowUtxo(ref: string, attempts = 4): Promise<UTxO.UTxO> {
  const [txHash, index] = ref.split("#");
  const escrow = Address.fromBech32(loadDeployment().escrowAddress);
  for (let i = 0; i < attempts; i++) {
    const utxos = await readClient().getUtxos(escrow);
    const utxo = utxos.find(
      (u) =>
        Buffer.from(u.transactionId.hash).toString("hex") === txHash && String(u.index) === index,
    );
    if (utxo) return utxo;
    if (i < attempts - 1) await Bun.sleep(2_000);
  }
  throw new Error(
    `escrow UTxO ${ref} not found in ${attempts} queries (spent, or not yet on chain)`,
  );
}

export function datumOf(utxo: UTxO.UTxO): Data.Data {
  if (utxo.datumOption?._tag !== "InlineDatum") throw new Error("escrow UTxO has no inline datum");
  return utxo.datumOption.data;
}

export function viewOf(utxo: UTxO.UTxO) {
  const view = parseMasumiLockDatum(datumOf(utxo));
  if (!view) throw new Error("escrow datum does not decode as vested_pay V2");
  return view;
}

interface Continuation {
  role: Actor;
  utxo: UTxO.UTxO;
  action: "SubmitResult" | "SetRefundRequested" | "AuthorizeRefund" | "AuthorizeWithdrawal";
  next: (datum: Data.Data, nowMs: bigint, cooldownMs: bigint) => Data.Data;
  /** Validity upper bound must stay before this (POSIX ms), when the action has a deadline. */
  before?: bigint;
  /** Validity lower bound must be after this (POSIX ms), e.g. the actor's cooldown. */
  after?: bigint;
}

/** Spends an escrow UTxO and re-locks the same value with the next datum. Returns the tx hash. */
async function continueEscrow(c: Continuation): Promise<string> {
  const ours = loadDeployment();
  const utxo = c.utxo;
  const wallet = walletClient(c.role);

  const now = BigInt(Date.now());
  const from = c.after !== undefined && c.after > now - 60_000n ? c.after + 1_000n : now - 60_000n;
  let to = now + BigInt(TX_WINDOW_MS);
  if (c.before !== undefined && to >= c.before) to = c.before - 1_000n;
  if (to <= from) throw new Error(`no valid time window for ${c.action} (from ${from}, to ${to})`);

  const nextDatum = c.next(datumOf(utxo), to, BigInt(ours.deployment.cooldownPeriod));
  const useScript = await escrowScriptStep();
  return withStaleUtxoRetry(async () => {
    const tx = await useScript(
      wallet.newTx().collectFrom({ inputs: [utxo], redeemer: redeemer(c.action) }),
    )
      .addSigner({ keyHash: keyHashOf(c.role) })
      .setValidity({ from, to })
      .payToAddress({
        address: Address.fromBech32(ours.escrowAddress),
        assets: utxo.assets,
        datum: inlineDatum(nextDatum),
      })
      .build({ changeAddress: await wallet.address(), availableUtxos: await roomyUtxos(wallet) });
    const hash = await (await tx.sign()).submit();
    return Buffer.from(hash.hash).toString("hex");
  });
}

/**
 * The whole error, causes included. SDK errors wrap the provider's answer several
 * levels down (TransactionBuilderError → ProviderError → HttpResponseError), and
 * `String(error)` keeps only the top message, which hides why a tx was rejected.
 */
export function errorText(error: unknown): string {
  const parts: string[] = [];
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current && !seen.has(current) && parts.length < 10) {
    seen.add(current);
    parts.push(current instanceof Error ? current.message : String(current));
    current = (current as { cause?: unknown }).cause;
  }
  return parts.join(" <- ");
}

/**
 * Public Koios is load-balanced and one backend can lag minutes behind
 * (observed on preprod, 6 Oct 2026: 2 of 6 queries still showed the buyer's
 * pre-lock UTxO). Coin selection then picks an already-spent input and the
 * node rejects it as missing from the UTxO set. Rebuilding usually lands on a
 * fresh backend, so retry that rejection, plus plain transport failures
 * (connection resets, 5xx) which say nothing about the transaction.
 */
async function withStaleUtxoRetry<T>(build: () => Promise<T>, attempts = 5): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await build();
    } catch (error) {
      const text = errorText(error);
      const stale = /missing from UTxO set|Unknown transaction input|BadInputsUTxO/.test(text);
      // Transport failures, not verdicts: a script that really fails comes back as an
      // evaluation error with a reason and is never retried.
      const transient =
        /ECONNRESET|ETIMEDOUT|socket hang up|HttpRequestError|TxSubmitConnectionError|non 2xx status code : (5\d\d|<)/.test(
          text,
        );
      if (!(stale || transient) || i >= attempts) throw error;
      console.error(
        `${stale ? "stale UTxO view" : "provider transport error"}, rebuilding (${i}/${attempts - 1})`,
      );
      await Bun.sleep(3_000);
    }
  }
}

/** Seller posts the hash of what it delivered. FundsLocked/ResultSubmitted → ResultSubmitted. */
export async function submitResult(
  ref: string,
  resultHashHex: string,
  seller: Actor = "seller",
): Promise<string> {
  if (!/^[0-9a-f]{64}$/.test(resultHashHex)) throw new Error("result hash must be 32 bytes hex");
  const utxo = await findEscrowUtxo(ref);
  const view = viewOf(utxo);
  const disputed = view.state === 2n || view.state === 3n;
  return continueEscrow({
    role: seller,
    utxo,
    action: "SubmitResult",
    after: view.sellerCooldownTime,
    before: view.resultHash === "" ? view.submitResultTime : view.externalDisputeUnlockTime,
    next: (datum, nowMs, cooldownMs) =>
      withFields(datum, {
        resultHash: Data.bytearray(resultHashHex),
        sellerCooldownTime: Data.int(nowMs + cooldownMs),
        buyerCooldownTime: Data.int(0n),
        state: stateData(disputed ? "Disputed" : "ResultSubmitted"),
      }),
  });
}

/**
 * Buyer rejects. With no result yet: → RefundRequested. With a result: → Disputed,
 * which only the seller (AuthorizeRefund) or the arbiter (after the dispute unlock) can end.
 */
export async function setRefundRequested(ref: string): Promise<string> {
  const utxo = await findEscrowUtxo(ref);
  const view = viewOf(utxo);
  return continueEscrow({
    role: "buyer",
    utxo,
    action: "SetRefundRequested",
    after: view.buyerCooldownTime,
    before: view.unlockTime,
    next: (datum, nowMs, cooldownMs) =>
      withFields(datum, {
        sellerCooldownTime: Data.int(0n),
        buyerCooldownTime: Data.int(nowMs + cooldownMs),
        state: stateData(view.resultHash === "" ? "RefundRequested" : "Disputed"),
      }),
  });
}

// ---------------------------------------------------------------------------
// Terminal actions: spend the escrow without a continuation, paying tagged
// outputs (inline datum = own_ref) to the parties.

function credentialAddress(creds: { payment: { hash: string }; stake?: { hash: string } }) {
  return new Address.Address({
    networkId: 0,
    paymentCredential: KeyHash.fromHex(creds.payment.hash),
    ...(creds.stake ? { stakingCredential: KeyHash.fromHex(creds.stake.hash) } : {}),
  });
}

/** Where the validator expects each party's payout: its return address, else its own. */
export function payoutAddresses(utxo: UTxO.UTxO) {
  const v = viewOf(utxo);
  return {
    buyer: credentialAddress(v.buyerReturnAddress ?? v.buyer),
    seller: credentialAddress(v.sellerReturnAddress ?? v.seller),
  };
}

export function refOf(utxo: UTxO.UTxO): { txHash: string; index: bigint } {
  return {
    txHash: Buffer.from(utxo.transactionId.hash).toString("hex"),
    index: BigInt(utxo.index),
  };
}

export interface DisputePayout {
  /** Lovelace the buyer must receive (at least). */
  buyerLovelace: bigint;
  /** Lovelace the seller must receive (at least). */
  sellerLovelace: bigint;
  signatures: AdminSignature[];
}

/** The intent an arbiter signs for a payout of `buyerLovelace` / `sellerLovelace` from this UTxO. */
export function payoutIntent(utxo: UTxO.UTxO, buyerLovelace: bigint, sellerLovelace: bigint) {
  const { txHash, index } = refOf(utxo);
  return disputeIntentHash(
    outputReferenceData(txHash, index),
    assetValueData({ lovelace: buyerLovelace }),
    assetValueData({ lovelace: sellerLovelace }),
  );
}

/**
 * Settles a Disputed escrow with arbiter signatures (`WithdrawDisputed`). Only
 * valid after `external_dispute_unlock_time`. Anyone can submit; `submitter`
 * pays the fee.
 */
export async function withdrawDisputed(
  ref: string,
  payout: DisputePayout,
  submitter: Role = "arbiter",
): Promise<string> {
  const utxo = await findEscrowUtxo(ref);
  const view = viewOf(utxo);
  if (view.state !== 3n) throw new Error(`escrow is ${view.state}, not Disputed`);
  if (payout.buyerLovelace + payout.sellerLovelace > utxo.assets.lovelace) {
    throw new Error("payout exceeds the escrow value");
  }
  const now = BigInt(Date.now());
  const from = view.externalDisputeUnlockTime + 1_000n;
  if (now <= from) {
    throw new Error(`dispute window opens at ${new Date(Number(from)).toISOString()}`);
  }
  const { txHash, index } = refOf(utxo);
  const ownRef = outputReferenceData(txHash, index);
  const intent = payoutIntent(utxo, payout.buyerLovelace, payout.sellerLovelace);
  for (const sig of payout.signatures) {
    if (!verifyAdminSignature(sig, intent))
      throw new Error("an admin signature does not cover this payout");
  }
  const { buyer, seller } = payoutAddresses(utxo);
  const wallet = walletClient(submitter);
  const useScript = await escrowScriptStep();

  return withStaleUtxoRetry(async () => {
    let builder = useScript(
      wallet.newTx().collectFrom({
        inputs: [utxo],
        redeemer: withdrawDisputedRedeemer(
          assetValueData({ lovelace: payout.buyerLovelace }),
          assetValueData({ lovelace: payout.sellerLovelace }),
          payout.signatures,
        ),
      }),
    ).setValidity({ from, to: now + BigInt(TX_WINDOW_MS) });
    for (const [address, lovelace] of [
      [buyer, payout.buyerLovelace],
      [seller, payout.sellerLovelace],
    ] as const) {
      if (lovelace > 0n) {
        builder = builder.payToAddress({
          address,
          assets: Assets.fromLovelace(lovelace),
          datum: inlineDatum(ownRef),
        });
      }
    }
    const tx = await builder.build({
      changeAddress: await wallet.address(),
      availableUtxos: await roomyUtxos(wallet),
    });
    const hash = await (await tx.sign()).submit();
    return Buffer.from(hash.hash).toString("hex");
  });
}

/** Seller concedes: any non-terminal state → RefundAuthorized; the buyer can then refund at once. */
export async function authorizeRefund(ref: string, seller: Actor = "seller"): Promise<string> {
  const utxo = await findEscrowUtxo(ref);
  const view = viewOf(utxo);
  return continueEscrow({
    role: seller,
    utxo,
    action: "AuthorizeRefund",
    after: view.sellerCooldownTime,
    next: (datum, nowMs, cooldownMs) =>
      withFields(datum, {
        resultHash: Data.bytearray(""),
        sellerCooldownTime: Data.int(nowMs + cooldownMs),
        buyerCooldownTime: Data.int(0n),
        state: stateData("RefundAuthorized"),
      }),
  });
}

interface Terminal {
  role: Actor;
  utxo: UTxO.UTxO;
  action: "Withdraw" | "WithdrawRefund";
  /** Validity lower bound must be after this (POSIX ms). */
  after?: bigint;
  /** Tagged outputs the validator requires (inline datum = own_ref). */
  tagged: { address: Address.Address; lovelace: bigint }[];
}

/** Spends an escrow UTxO for good; untagged value goes to the acting party's wallet as change. */
async function closeEscrow(t: Terminal): Promise<string> {
  const wallet = walletClient(t.role);
  const now = BigInt(Date.now());
  const from = t.after !== undefined && t.after >= now - 60_000n ? t.after + 1_000n : now - 60_000n;
  if (from >= now) throw new Error(`${t.action} opens at ${new Date(Number(from)).toISOString()}`);
  const { txHash, index } = refOf(t.utxo);
  const ownRef = outputReferenceData(txHash, index);
  const useScript = await escrowScriptStep();

  return withStaleUtxoRetry(async () => {
    let builder = useScript(
      wallet.newTx().collectFrom({ inputs: [t.utxo], redeemer: redeemer(t.action) }),
    )
      .addSigner({ keyHash: keyHashOf(t.role) })
      .setValidity({ from, to: now + BigInt(TX_WINDOW_MS) });
    for (const out of t.tagged) {
      if (out.lovelace > 0n) {
        builder = builder.payToAddress({
          address: out.address,
          assets: Assets.fromLovelace(out.lovelace),
          datum: inlineDatum(ownRef),
        });
      }
    }
    const tx = await builder.build({
      changeAddress: await wallet.address(),
      availableUtxos: await roomyUtxos(wallet),
    });
    const hash = await (await tx.sign()).submit();
    return Buffer.from(hash.hash).toString("hex");
  });
}

/**
 * Seller collects. ResultSubmitted after `unlock_time`, or WithdrawAuthorized at once.
 * The buyer's collateral goes back in an output tagged with the escrow's own reference.
 */
export async function withdraw(ref: string, signer: Actor = "seller"): Promise<string> {
  const utxo = await findEscrowUtxo(ref);
  const view = viewOf(utxo);
  if (view.state !== 1n && view.state !== 4n)
    throw new Error(`escrow is ${view.state}, not ResultSubmitted or WithdrawAuthorized`);
  const { buyer, seller } = payoutAddresses(utxo);
  const tagged = [{ address: buyer, lovelace: view.collateralReturnLovelace }];
  if (view.sellerReturnAddress) {
    tagged.push({
      address: seller,
      lovelace: utxo.assets.lovelace - view.collateralReturnLovelace,
    });
  }
  return closeEscrow({
    role: signer,
    utxo,
    action: "Withdraw",
    after: view.state === 1n ? view.unlockTime : undefined,
    tagged,
  });
}

/**
 * Buyer takes the money back. FundsLocked / RefundRequested after `submit_result_time`
 * (only while no result hash is on chain), or RefundAuthorized at once.
 */
export async function withdrawRefund(ref: string): Promise<string> {
  const utxo = await findEscrowUtxo(ref);
  const view = viewOf(utxo);
  if (view.resultHash !== "")
    throw new Error("a result hash is on chain; the buyer's way back is a dispute");
  if (![0n, 2n, 5n].includes(view.state))
    throw new Error(`escrow is ${view.state}, not refundable`);
  const { buyer } = payoutAddresses(utxo);
  return closeEscrow({
    role: "buyer",
    utxo,
    action: "WithdrawRefund",
    after: view.state === 5n ? undefined : view.submitResultTime,
    tagged: view.buyerReturnAddress ? [{ address: buyer, lovelace: utxo.assets.lovelace }] : [],
  });
}
