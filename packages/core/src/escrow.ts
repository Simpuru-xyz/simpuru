import record from "../../../contracts/deployments/preprod.json";
import { X402_NETWORK } from "./index";

type Deployment = { requiredAdmins: string; adminVkeys: string[]; cooldownPeriod: string };

/** Our vested_pay deployment (contracts/deployments/preprod.json). */
export const ESCROW = {
  address: record.escrowAddress,
  scriptHash: record.scriptHash,
  deployment: record.deployment as Deployment,
};

/** Approves exactly our escrow deployment; pass as `validateCustomMasumiDeployment`. */
export const isOurDeployment = (claim: {
  network: string;
  payTo: string;
  deployment: Deployment;
}) =>
  claim.network === X402_NETWORK &&
  claim.payTo === ESCROW.address &&
  claim.deployment.requiredAdmins === ESCROW.deployment.requiredAdmins &&
  claim.deployment.cooldownPeriod === ESCROW.deployment.cooldownPeriod &&
  claim.deployment.adminVkeys.join() === ESCROW.deployment.adminVkeys.join();
