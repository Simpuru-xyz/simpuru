// Our vested_pay deployment, read from contracts/deployments/<network>.json.
import { readFileSync } from "node:fs";
import type { MasumiDeployment } from "@x402/cardano";

export interface EscrowDeployment {
  network: string;
  deployment: MasumiDeployment;
  scriptHash: string;
  escrowAddress: string;
  arbiter: { keyHash: string; address: string };
  referenceScript: string | null;
}

export function loadDeployment(network = "preprod"): EscrowDeployment {
  const path = new URL(`../../../contracts/deployments/${network}.json`, import.meta.url).pathname;
  return JSON.parse(readFileSync(path, "utf8")) as EscrowDeployment;
}

/**
 * For x402's `validateCustomMasumiDeployment`: allow exactly our escrow. Re-exported from
 * `@simpuru/core/escrow`, which pins the address **and** the admins, keys and cooldown, so
 * there is one check, the strict one.
 */
export { isOurDeployment } from "@simpuru/core/escrow";
