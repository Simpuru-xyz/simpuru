// The vested_pay validator with our parameters applied, built the same way
// @x402/cardano derives the escrow address, and checked against the recorded
// script hash so a spend can never attach a different script than the one
// that owns the funds.
import { readFileSync } from "node:fs";
import { Data, PlutusV3, ScriptHash, UPLC } from "@evolution-sdk/evolution";
import type { MasumiDeployment } from "@x402/cardano";
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
