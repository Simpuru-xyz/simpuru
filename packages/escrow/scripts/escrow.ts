// CLI over the escrow builders, for preprod runs.
//
//   bun packages/escrow/scripts/escrow.ts show <txHash#index>
//   bun packages/escrow/scripts/escrow.ts submit-result <txHash#index> <resultHashHex>
//   bun packages/escrow/scripts/escrow.ts request-refund <txHash#index>
//   bun packages/escrow/scripts/escrow.ts authorize-refund <txHash#index>
//   bun packages/escrow/scripts/escrow.ts withdraw <txHash#index>
//   bun packages/escrow/scripts/escrow.ts withdraw-refund <txHash#index>
//
// Every action prints the tx hash, waits for the escrow to move, and prints the
// state it reads back from chain.
import { Address, TransactionHash } from "@evolution-sdk/evolution";
import {
  authorizeRefund,
  findEscrowUtxo,
  setRefundRequested,
  submitResult,
  viewOf,
  withdraw,
  withdrawRefund,
} from "../src/actions";
import { type Role, readClient, walletAddress } from "../src/chain";
import { stateName } from "../src/datum";
import { loadDeployment } from "../src/deployment";

/** Lovelace held by a role's base address. Two reads that disagree are retried (Koios lag). */
async function balanceOf(role: Role): Promise<bigint> {
  const address = Address.fromBech32(await walletAddress(role));
  const read = async () =>
    (await readClient().getUtxos(address)).reduce((n, u) => n + u.assets.lovelace, 0n);
  for (let i = 0; i < 5; i++) {
    const [a, b] = [await read(), await read()];
    if (a === b) return a;
    await Bun.sleep(3_000);
  }
  throw new Error(`balance of ${role} kept changing between reads`);
}

async function show(ref: string) {
  const utxo = await findEscrowUtxo(ref);
  const v = viewOf(utxo);
  return {
    utxo: ref,
    lovelace: utxo.assets.lovelace.toString(),
    state: stateName(v.state),
    resultHash: v.resultHash || null,
    sellerCooldown: v.sellerCooldownTime ? new Date(Number(v.sellerCooldownTime)).toISOString() : 0,
    buyerCooldown: v.buyerCooldownTime ? new Date(Number(v.buyerCooldownTime)).toISOString() : 0,
    submitResultTime: new Date(Number(v.submitResultTime)).toISOString(),
    unlockTime: new Date(Number(v.unlockTime)).toISOString(),
    externalDisputeUnlockTime: new Date(Number(v.externalDisputeUnlockTime)).toISOString(),
  };
}

/** Waits until an escrow UTxO created by `txHash` exists, then shows it. */
async function settled(txHash: string) {
  const escrow = Address.fromBech32(loadDeployment().escrowAddress);
  const deadline = Date.now() + 240_000;
  for (;;) {
    const utxos = await readClient().getUtxos(escrow);
    const next = utxos.find((u) => Buffer.from(u.transactionId.hash).toString("hex") === txHash);
    if (next) return show(`${txHash}#${Number(next.index)}`);
    if (Date.now() > deadline) throw new Error(`escrow did not move to ${txHash} within 240 s`);
    await Bun.sleep(10_000);
  }
}

const [cmd, ref, arg] = process.argv.slice(2);
if (!cmd || !ref) throw new Error("usage: escrow.ts <show|submit-result> <txHash#index> [arg]");

if (cmd === "show") {
  console.log(JSON.stringify(await show(ref), null, 2));
} else if (cmd === "submit-result") {
  if (!arg) throw new Error("submit-result needs a 32-byte hex result hash");
  const tx = await submitResult(ref, arg);
  console.error(`submitted ${tx}`);
  console.log(JSON.stringify(await settled(tx), null, 2));
} else if (cmd === "request-refund") {
  const tx = await setRefundRequested(ref);
  console.error(`submitted ${tx}`);
  console.log(JSON.stringify(await settled(tx), null, 2));
} else if (cmd === "authorize-refund") {
  const tx = await authorizeRefund(ref);
  console.error(`submitted ${tx}`);
  console.log(JSON.stringify(await settled(tx), null, 2));
} else if (cmd === "withdraw" || cmd === "withdraw-refund") {
  // Terminal: the escrow UTxO is gone afterwards. Proof is the money: the acting
  // party's balance before and after, once the tx is confirmed on chain.
  const role = cmd === "withdraw" ? "seller" : "buyer";
  const escrowLovelace = (await findEscrowUtxo(ref)).assets.lovelace;
  const before = await balanceOf(role);
  const tx = cmd === "withdraw" ? await withdraw(ref) : await withdrawRefund(ref);
  console.error(`submitted ${tx}, waiting for confirmation...`);
  await readClient().awaitTx(TransactionHash.fromHex(tx), 10_000, 300_000);
  const after = await balanceOf(role);
  console.log(
    JSON.stringify(
      {
        tx,
        spent: ref,
        escrowLovelace: escrowLovelace.toString(),
        [`${role}Before`]: before.toString(),
        [`${role}After`]: after.toString(),
        [`${role}Delta`]: (after - before).toString(),
      },
      null,
      2,
    ),
  );
} else {
  throw new Error(`unknown command ${cmd}`);
}
