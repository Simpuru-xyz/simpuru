import { bech32 } from "bech32";

/** The slice of a CIP-30 wallet API we use. */
export interface Cip30Api {
  getNetworkId(): Promise<number>;
  getChangeAddress(): Promise<string>;
  signData(addressHex: string, payloadHex: string): Promise<{ key: string; signature: string }>;
}

interface Cip30Wallet {
  name?: string;
  icon?: string;
  enable(): Promise<Cip30Api>;
  isEnabled?(): Promise<boolean>;
}

declare global {
  interface Window {
    cardano?: Record<string, Cip30Wallet | undefined>;
  }
}

export type WalletInfo = { key: string; name: string; icon?: string };

/** Wallet extensions in this browser. They inject `window.cardano` shortly after load. */
export function listWallets(): WalletInfo[] {
  const found = window.cardano ?? {};
  const seen = new Set<string>();
  return Object.entries(found).flatMap(([key, w]) => {
    if (!w || typeof w.enable !== "function") return [];
    const name = w.name ?? key;
    // Some wallets register under two keys (e.g. "lace" and an alias); show each once.
    if (seen.has(name)) return [];
    seen.add(name);
    return [{ key, name, icon: w.icon }];
  });
}

/** CIP-30 hands addresses out as hex bytes; the API wants bech32 (`addr_test1…` on preprod). */
export function addressToBech32(hex: string) {
  const bytes = Uint8Array.from(hex.match(/../g) ?? [], (b) => Number.parseInt(b, 16));
  // Header nibble 0 = mainnet, 1 = testnet; preprod is a testnet.
  const prefix = (bytes[0] ?? 0) & 0x0f ? "addr" : "addr_test";
  return bech32.encode(prefix, bech32.toWords(bytes), 1023);
}

export type Connected = { key: string; name: string; api: Cip30Api; hex: string; address: string };

export class WalletError extends Error {}

/** Opens the wallet, checks it is on preprod and returns its address. */
export async function connectWallet(key: string): Promise<Connected> {
  const wallet = window.cardano?.[key];
  if (!wallet) throw new WalletError("That wallet isn't available in this browser any more.");
  const api = await wallet.enable();
  if ((await api.getNetworkId()) !== 0)
    throw new WalletError("Switch your wallet to the preprod testnet and try again.");
  const hex = await api.getChangeAddress();
  if (!/^[0-9a-f]+$/i.test(hex))
    throw new WalletError("This wallet returned an address in an unexpected format.");
  // Listings are signed with the payment key, so the payment part must be a key, not a script.
  // Shelley header types 0, 2, 4 and 6 have a key payment credential (CIP-19).
  const type = Number.parseInt(hex.slice(0, 1), 16);
  if (type > 7 || type % 2 !== 0)
    throw new WalletError("Use a regular wallet address; script addresses can't sign a listing.");
  const address = addressToBech32(hex);
  return { key, name: wallet.name ?? key, api, hex, address };
}

/**
 * Wallets reject with CIP-30 `{ code, info }` objects rather than Errors; make them readable.
 * signData: 1 proof generation, 2 address not the wallet's key, 3 user declined.
 * Wallet API: -3 refused, -4 account changed.
 */
export function walletMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  const e = err as { info?: string; message?: string; code?: number } | null;
  if (e?.code === 3 || e?.code === -3) return "You declined in the wallet.";
  if (e?.code === 2 || e?.code === -4)
    return "The wallet's account changed. Disconnect and connect again.";
  return e?.info ?? e?.message ?? "The wallet didn't respond.";
}
