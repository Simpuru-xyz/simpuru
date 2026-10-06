// Derives our vested_pay escrow deployment on preprod and writes it to
// contracts/deployments/preprod.json.
//
// Run from the repo root so Bun loads .env:
//   bun packages/escrow/scripts/derive-deployment.ts
//
// The address comes from @x402/cardano's own masumiEscrowAddress, the same
// function the x402 client and facilitator use to check `payTo`, so the
// recorded address cannot drift from what they accept.
import { writeFileSync } from "node:fs";
import * as Address from "@evolution-sdk/evolution/Address";
import * as KeyHash from "@evolution-sdk/evolution/KeyHash";
import * as PrivateKey from "@evolution-sdk/evolution/PrivateKey";
import {
  MASUMI_DEFAULT_DEPLOYMENT,
  type MasumiDeployment,
  masumiEscrowAddress,
  masumiEscrowScriptHash,
} from "@x402/cardano";

const NETWORK = "cardano:preprod";

// Control: the canonical Masumi deployment must derive to the escrow address
// Masumi publishes for preprod. If this ever fails, the derivation below
// cannot be trusted either.
const CANONICAL_PREPROD = "addr_test1wzs4e6wc95hkwezlccjw9mdvq0r0rsgx6zk34avptga3ftgn37w4g";
const canonical = masumiEscrowAddress(NETWORK, MASUMI_DEFAULT_DEPLOYMENT);
if (canonical !== CANONICAL_PREPROD) {
  throw new Error(`canonical deployment derived to ${canonical}, expected ${CANONICAL_PREPROD}`);
}

const mnemonic = process.env.ARBITER_MNEMONIC;
if (!mnemonic)
  throw new Error("ARBITER_MNEMONIC is not set (run from the repo root with a filled .env)");
const arbiterKey = PrivateKey.fromMnemonicCardano(mnemonic);
const arbiterKeyHash = KeyHash.fromPrivateKey(arbiterKey);
const arbiterKeyHashHex = KeyHash.toHex(arbiterKeyHash);
const arbiterAddress = Address.toBech32(
  new Address.Address({ networkId: 0, paymentCredential: arbiterKeyHash }),
);

// 1-of-1 arbiter for the demo. A 60 s cooldown instead of Masumi's 7 min keeps
// back-to-back escrow actions (e.g. submit, then concede) demoable; the
// deadline intervals x402 enforces are unaffected by this parameter.
const deployment: MasumiDeployment = {
  requiredAdmins: "1",
  adminVkeys: [arbiterKeyHashHex],
  cooldownPeriod: "60000",
};

const record = {
  network: NETWORK,
  validator: "vested_pay.vested_pay.spend",
  blueprint:
    "masumi-network/masumi-payment-service@d74b2c319228bcbef36632de37875c388dcee7ce smart-contracts/payment-v2/plutus.json",
  derivedWith: "@x402/cardano@2.28.0 masumiEscrowAddress",
  deployment,
  scriptHash: masumiEscrowScriptHash(deployment),
  escrowAddress: masumiEscrowAddress(NETWORK, deployment),
  arbiter: { keyHash: arbiterKeyHashHex, address: arbiterAddress },
  referenceScript: null,
};

const out = new URL("../../../contracts/deployments/preprod.json", import.meta.url).pathname;
writeFileSync(out, `${JSON.stringify(record, null, 2)}\n`);
// Format with the repo's own formatter so a regenerated record passes `bun run lint`.
Bun.spawnSync(["bunx", "biome", "format", "--write", out]);
console.log(JSON.stringify(record, null, 2));
