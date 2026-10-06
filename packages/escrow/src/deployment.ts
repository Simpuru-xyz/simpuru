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

/** For x402's `validateCustomMasumiDeployment`: allow exactly our escrow, nothing else. */
export function isOurDeployment(claim: { network: string; payTo: string }): boolean {
  const ours = loadDeployment();
  return claim.network === ours.network && claim.payTo === ours.escrowAddress;
}
