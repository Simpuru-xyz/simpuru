// Prints each role's on-chain balance. With --wait <bech32>, polls until that
// address holds at least one UTxO (or 180 s pass), so a script can read state
// instead of trusting a submitted tx hash.
//
//   bun packages/escrow/scripts/balances.ts [--wait <address>]
import { Address } from "@evolution-sdk/evolution";
import { type Role, readClient, walletAddress } from "../src/chain";

const client = readClient();

async function lovelaceAt(bech32: string) {
  const utxos = await client.getUtxos(Address.fromBech32(bech32));
  return { utxos: utxos.length, lovelace: utxos.reduce((n, u) => n + u.assets.lovelace, 0n) };
}

const waitIdx = process.argv.indexOf("--wait");
if (waitIdx !== -1) {
  const target = process.argv[waitIdx + 1];
  if (!target) throw new Error("--wait needs an address");
  const deadline = Date.now() + 180_000;
  while ((await lovelaceAt(target)).utxos === 0) {
    if (Date.now() > deadline) throw new Error(`no UTxO at ${target} after 180 s`);
    await Bun.sleep(10_000);
  }
}

const rows: Record<string, unknown> = {};
for (const role of ["buyer", "seller", "arbiter"] as Role[]) {
  for (const type of ["Base", "Enterprise"] as const) {
    const address = await walletAddress(role, type);
    const { utxos, lovelace } = await lovelaceAt(address);
    rows[`${role} ${type}`] = { address, utxos, tada: Number(lovelace) / 1e6 };
  }
}
console.log(JSON.stringify(rows, null, 2));
