// Puts our escrow validator in a reference-script UTxO at an address nobody can spend
// from, then records it in contracts/deployments/preprod.json.
//
//   bun packages/escrow/scripts/deploy-reference-script.ts
//
// Funded from the buyer's enterprise address (the faucet address). The min-ADA for a
// ~9.9 KB script is locked for good; that is the price of never attaching it again.
import { readFileSync, writeFileSync } from "node:fs";
import { Address, Assets } from "@evolution-sdk/evolution";
import { walletClient } from "../src/chain";
import { loadDeployment } from "../src/deployment";
import { escrowValidator, referenceScriptUtxo, unspendableAddress } from "../src/script";

const ours = loadDeployment();
if (ours.referenceScript) throw new Error(`already deployed at ${ours.referenceScript}`);

const funder = walletClient("buyer", "Enterprise");
const target = unspendableAddress();
const tx = await funder
  .newTx()
  .payToAddress({
    address: Address.fromBech32(target),
    assets: Assets.fromLovelace(1_000_000n),
    script: escrowValidator(),
    autoMinUtxo: true,
  })
  .build({ changeAddress: await funder.address() });
const txHash = Buffer.from((await (await tx.sign()).submit()).hash).toString("hex");
console.error(`submitted ${txHash}, waiting for the reference UTxO...`);

// Record it, then prove it: read the UTxO back and check it carries exactly our validator.
const path = new URL("../../../contracts/deployments/preprod.json", import.meta.url).pathname;
const record = JSON.parse(readFileSync(path, "utf8"));
record.referenceScript = `${txHash}#0`;
record.referenceScriptAddress = target;
writeFileSync(path, `${JSON.stringify(record, null, 2)}\n`);
Bun.spawnSync(["bunx", "biome", "format", "--write", path]);

for (let i = 0; ; i++) {
  try {
    const utxo = await referenceScriptUtxo();
    console.log(
      JSON.stringify(
        {
          referenceScript: record.referenceScript,
          address: target,
          lockedLovelace: utxo?.assets.lovelace.toString(),
        },
        null,
        2,
      ),
    );
    break;
  } catch (error) {
    if (i >= 20) throw error;
    await Bun.sleep(10_000);
  }
}
