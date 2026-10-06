// Moves faucet funds from the buyer's enterprise address to the base addresses the
// x402 signer uses, and gives the seller enough tADA to pay its own escrow fees.
//
//   bun packages/escrow/scripts/fund-wallets.ts [sellerTada=25]
import { Address, Assets } from "@evolution-sdk/evolution";
import { walletAddress, walletClient } from "../src/chain";

const sellerTada = BigInt(process.argv[2] ?? "25");

const from = walletClient("buyer", "Enterprise");
const fromUtxos = await from.getWalletUtxos();
if (fromUtxos.length === 0) throw new Error("buyer enterprise address has no UTxOs");

const buyerBase = await walletAddress("buyer");
const sellerBase = await walletAddress("seller");

const tx = await from
  .newTx()
  .payToAddress({
    address: Address.fromBech32(sellerBase),
    assets: Assets.fromLovelace(sellerTada * 1_000_000n),
  })
  .build({ changeAddress: Address.fromBech32(buyerBase) });
const hash = await (await tx.sign()).submit();

console.log(
  JSON.stringify(
    {
      from: await walletAddress("buyer", "Enterprise"),
      buyerBase,
      sellerBase,
      sellerTada: sellerTada.toString(),
      tx: Buffer.from(hash.hash).toString("hex"),
    },
    null,
    2,
  ),
);
