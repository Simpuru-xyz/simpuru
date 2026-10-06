import { expect, test } from "bun:test";
import { ESCROW, isOurDeployment } from "./escrow";

const ours = { network: "cardano:preprod", payTo: ESCROW.address, deployment: ESCROW.deployment };

test("approves exactly our deployment", () => {
  expect(isOurDeployment(ours)).toBe(true);
});

test.each([
  ["another network", { ...ours, network: "cardano:preview" }],
  [
    "another address",
    { ...ours, payTo: "addr_test1wzs4e6wc95hkwezlccjw9mdvq0r0rsgx6zk34avptga3ftgn37w4g" },
  ],
  [
    "another arbiter",
    { ...ours, deployment: { ...ours.deployment, adminVkeys: ["00".repeat(28)] } },
  ],
  ["more admins required", { ...ours, deployment: { ...ours.deployment, requiredAdmins: "2" } }],
  ["another cooldown", { ...ours, deployment: { ...ours.deployment, cooldownPeriod: "420000" } }],
])("rejects %s", (_, claim) => {
  expect(isOurDeployment(claim)).toBe(false);
});
