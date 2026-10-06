// Chain access for scripts and services: a preprod client per role, read from .env.
//
// Wallets use **base** addresses, the same derivation @x402/cardano's client signer uses,
// so a wallet funded here is the wallet x402 pays from.
import { Address, Client, preprod } from "@evolution-sdk/evolution";

export const KOIOS_PREPROD = "https://preprod.koios.rest/api/v1";

export type Role = "buyer" | "seller" | "arbiter";

export function mnemonicFor(role: Role): string {
  const key = `${role.toUpperCase()}_MNEMONIC`;
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not set (run from the repo root with a filled .env)`);
  return value;
}

export const BLOCKFROST_PREPROD = "https://cardano-preprod.blockfrost.io/api/v0";

/**
 * Blockfrost when `BLOCKFROST_PROJECT_ID` is set, public Koios otherwise. Public Koios was seen
 * returning empty address lists, lagging minutes behind and dropping submits (see actions.ts);
 * the builders still retry those cases on either provider.
 */
export function readClient() {
  const projectId = process.env.BLOCKFROST_PROJECT_ID;
  return projectId
    ? Client.make(preprod).withBlockfrost({ baseUrl: BLOCKFROST_PREPROD, projectId })
    : Client.make(preprod).withKoios({ baseUrl: KOIOS_PREPROD });
}

export function walletClient(role: Role, addressType: "Base" | "Enterprise" = "Base") {
  return readClient().withSeed({ mnemonic: mnemonicFor(role), addressType });
}

export async function walletAddress(role: Role, addressType: "Base" | "Enterprise" = "Base") {
  return Address.toBech32(await walletClient(role, addressType).address());
}
