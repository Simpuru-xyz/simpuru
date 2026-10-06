// Arbiter authorization for vested_pay `WithdrawDisputed`.
//
// The validator recomputes
//   intent = blake2b_224(cbor.serialise(DisputeWithdrawal { own_ref, buyer_value, seller_value }))
// and accepts an admin signature over the CIP-8 Sig_structure
//   ["Signature1", protected_headers, h'', intent]
// (or over blake2b_224(intent), the hashed mode). Anyone may then submit the
// payout transaction; the signature binds it to one UTxO through `own_ref`.
import { Data, PrivateKey, VKey } from "@evolution-sdk/evolution";
import { blake2b } from "@noble/hashes/blake2.js";

/** `{1: -8}`: alg EdDSA, the bare protected-header map key-in-hand tooling uses. */
export const RAW_PROTECTED_HEADERS = "a10127";

/** Lovelace-and-tokens value as the validator's `AssetValue` (Pairs<policy, Pairs<name, qty>>). */
export type AssetValue = { lovelace?: bigint; tokens?: Record<string, Record<string, bigint>> };

export function assetValueData(value: AssetValue): Data.Data {
  const entries: [Data.Data, Data.Data][] = [];
  if (value.lovelace && value.lovelace > 0n) {
    entries.push([Data.bytearray(""), Data.map([[Data.bytearray(""), Data.int(value.lovelace)]])]);
  }
  for (const [policy, names] of Object.entries(value.tokens ?? {})) {
    const assets = Object.entries(names).map(
      ([name, qty]) => [Data.bytearray(name), Data.int(qty)] as [Data.Data, Data.Data],
    );
    entries.push([Data.bytearray(policy), Data.map(assets)]);
  }
  return Data.map(entries);
}

export function outputReferenceData(txHashHex: string, index: bigint): Data.Data {
  return Data.constr(0n, [Data.bytearray(txHashHex), Data.int(index)]);
}

const blake2b224 = (bytes: Uint8Array) => blake2b(bytes, { dkLen: 28 });

export function disputeIntentHash(
  ownRef: Data.Data,
  buyerValue: Data.Data,
  sellerValue: Data.Data,
): Uint8Array {
  const withdrawal = Data.constr(0n, [ownRef, buyerValue, sellerValue]);
  return blake2b224(Buffer.from(Data.toCBORHex(withdrawal), "hex"));
}

function cborByteString(bytes: Uint8Array): Buffer {
  const n = bytes.length;
  if (n < 24) return Buffer.concat([Buffer.from([0x40 + n]), bytes]);
  if (n < 256) return Buffer.concat([Buffer.from([0x58, n]), bytes]);
  if (n < 65536) return Buffer.concat([Buffer.from([0x59, n >> 8, n & 0xff]), bytes]);
  throw new Error("byte string too long");
}

export function cip8SigStructure(protectedHeadersHex: string, payload: Uint8Array): Buffer {
  return Buffer.concat([
    Buffer.from("846a5369676e617475726531", "hex"),
    cborByteString(Buffer.from(protectedHeadersHex, "hex")),
    Buffer.from("40", "hex"),
    cborByteString(payload),
  ]);
}

export interface AdminSignature {
  verificationKey: string;
  protectedHeaders: string;
  signature: string;
}

export function adminSignatureData(sig: AdminSignature): Data.Data {
  return Data.constr(0n, [
    Data.bytearray(sig.verificationKey),
    Data.bytearray(sig.protectedHeaders),
    Data.bytearray(sig.signature),
  ]);
}

/** Signs a dispute intent with a raw admin key (non-hashed CIP-8 mode). */
export function signIntent(adminKey: PrivateKey.PrivateKey, intent: Uint8Array): AdminSignature {
  const sigStructure = cip8SigStructure(RAW_PROTECTED_HEADERS, intent);
  const signature = PrivateKey.sign(adminKey, sigStructure);
  return {
    verificationKey: VKey.toHex(VKey.fromPrivateKey(adminKey)),
    protectedHeaders: RAW_PROTECTED_HEADERS,
    signature: Buffer.from(signature.bytes).toString("hex"),
  };
}

/** Same check the validator runs: the signature covers the intent or its blake2b_224. */
export function verifyAdminSignature(sig: AdminSignature, intent: Uint8Array): boolean {
  const vk = VKey.fromHex(sig.verificationKey);
  const signature = Buffer.from(sig.signature, "hex");
  return [intent, blake2b224(intent)].some((payload) =>
    VKey.verify(vk, cip8SigStructure(sig.protectedHeaders, payload), signature),
  );
}

export function withdrawDisputedRedeemer(
  buyerValue: Data.Data,
  sellerValue: Data.Data,
  signatures: AdminSignature[],
): Data.Data {
  return Data.constr(4n, [buyerValue, sellerValue, Data.list(signatures.map(adminSignatureData))]);
}
