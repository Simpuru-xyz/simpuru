// The vested_pay validator with our parameters applied, built the same way
// @x402/cardano derives the escrow address, and checked against the recorded
// script hash so a spend can never attach a different script than the one
// that owns the funds.
import { readFileSync } from "node:fs";
import {
  Address,
  Data,
  NativeScripts,
  PlutusV3,
  ScriptHash,
  TransactionHash,
  TransactionInput,
  UPLC,
  type UTxO,
} from "@evolution-sdk/evolution";
import type { MasumiDeployment } from "@x402/cardano";
import { readClient } from "./chain";
import { loadDeployment } from "./deployment";

const BLUEPRINT = new URL("../../../contracts/vested_pay/plutus.json", import.meta.url).pathname;
const TITLE = "vested_pay.vested_pay.spend";

function unwrapCborByteString(hex: string): Uint8Array {
  const bytes = Buffer.from(hex, "hex");
  if (bytes.length === 0 || bytes.readUInt8(0) >> 5 !== 2) {
    throw new Error("expected a CBOR byte string");
  }
  const info = bytes.readUInt8(0) & 0x1f;
  let length: number;
  let offset: number;
  if (info < 24) [length, offset] = [info, 1];
  else if (info === 24) [length, offset] = [bytes.readUInt8(1), 2];
  else if (info === 25) [length, offset] = [bytes.readUInt16BE(1), 3];
  else if (info === 26) [length, offset] = [bytes.readUInt32BE(1), 5];
  else throw new Error("unsupported CBOR byte-string length");
  return bytes.subarray(offset, offset + length);
}

export function appliedValidator(deployment: MasumiDeployment): PlutusV3.PlutusV3 {
  const blueprint = JSON.parse(readFileSync(BLUEPRINT, "utf8")) as {
    validators: { title: string; compiledCode: string }[];
  };
  const validator = blueprint.validators.find((v) => v.title === TITLE);
  if (!validator) throw new Error(`${TITLE} not in blueprint`);
  const applied = UPLC.applyParamsToScript(validator.compiledCode, [
    Data.int(BigInt(deployment.requiredAdmins)),
    Data.list(deployment.adminVkeys.map((vkey) => Data.bytearray(vkey))),
    Data.int(BigInt(deployment.cooldownPeriod)),
  ]);
  return new PlutusV3.PlutusV3({ bytes: unwrapCborByteString(applied) });
}

/** Our escrow validator, refusing to return a script whose hash is not the recorded one. */
export function escrowValidator(): PlutusV3.PlutusV3 {
  const ours = loadDeployment();
  const script = appliedValidator(ours.deployment);
  const hash = ScriptHash.toHex(ScriptHash.fromScript(script)).toLowerCase();
  if (hash !== ours.scriptHash) {
    throw new Error(`applied validator hashes to ${hash}, deployment says ${ours.scriptHash}`);
  }
  return script;
}

// ---------------------------------------------------------------------------
// Reference script (#18). The ~9.9 KB validator rides in every escrow tx unless a
// UTxO already carries it as a reference script; then txs only reference it.

/**
 * Native script "any of nothing", which can never be satisfied: an address nobody can
 * spend from. The reference-script UTxO lives here so no wallet's coin selection can
 * ever consume it, and the escrow address stays free of datum-less UTxOs.
 */
export const NEVER = NativeScripts.makeScriptAny([]);

export function unspendableAddress(): string {
  return Address.toBech32(
    new Address.Address({ networkId: 0, paymentCredential: ScriptHash.fromScript(NEVER) }),
  );
}

let referenceUtxo: Promise<UTxO.UTxO | undefined> | undefined;

/** The recorded reference-script UTxO, refused unless it carries exactly our validator. */
export function referenceScriptUtxo(): Promise<UTxO.UTxO | undefined> {
  referenceUtxo ??= (async () => {
    const ours = loadDeployment();
    if (!ours.referenceScript) return undefined;
    const [txHash, index] = ours.referenceScript.split("#");
    const input = new TransactionInput.TransactionInput({
      transactionId: TransactionHash.fromHex(txHash ?? ""),
      index: BigInt(index ?? "0"),
    });
    const [utxo] = await readClient().getUtxosByOutRef([input]);
    if (!utxo?.scriptRef) throw new Error(`reference script ${ours.referenceScript} not found`);
    const hash = ScriptHash.toHex(ScriptHash.fromScript(utxo.scriptRef)).toLowerCase();
    if (hash !== ours.scriptHash) {
      throw new Error(`reference script hashes to ${hash}, deployment says ${ours.scriptHash}`);
    }
    return utxo;
  })();
  // A failed lookup (e.g. not on chain yet) must not stick: forget it so the next call retries.
  referenceUtxo.catch(() => {
    referenceUtxo = undefined;
  });
  return referenceUtxo;
}

interface ScriptCapable<B> {
  readFrom(params: { referenceInputs: ReadonlyArray<UTxO.UTxO> }): B;
  attachScript(params: { script: PlutusV3.PlutusV3 }): B;
}

/**
 * How a tx gets the escrow validator: reference it when a reference-script UTxO is
 * recorded, otherwise attach it. `ESCROW_INLINE_SCRIPT=1` forces attaching (fee comparisons).
 */
export async function escrowScriptStep(): Promise<<B extends ScriptCapable<B>>(builder: B) => B> {
  const ref = process.env.ESCROW_INLINE_SCRIPT === "1" ? undefined : await referenceScriptUtxo();
  if (ref) return (builder) => builder.readFrom({ referenceInputs: [ref] });
  const script = escrowValidator();
  return (builder) => builder.attachScript({ script });
}
