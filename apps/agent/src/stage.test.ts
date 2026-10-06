import { describe, expect, test } from "bun:test";
import { checkStaged, planStage, type Staged } from "./stage";

const MIN = 60_000;
const slot = Date.UTC(2026, 9, 7, 10, 0, 0);
const listings = {
  refund: "demo-no-delivery",
  seller: "aurora-saas-hero",
  arbiter: "demo-wrong-file",
};

describe("planStage", () => {
  test("buys each path so its gate opens at the chosen moment of the slot", () => {
    const plan = planStage({
      slotMs: slot,
      gateOffsetSec: { refund: 60, seller: 120, arbiter: 180 },
      listings,
    });
    const by = Object.fromEntries(plan.map((p) => [p.path, p]));
    expect(by.arbiter?.buyAt).toBe(slot + 180_000 - 46 * MIN);
    expect(by.seller?.buyAt).toBe(slot + 120_000 - 31 * MIN);
    expect(by.refund?.buyAt).toBe(slot + 60_000 - 16 * MIN);
    // earliest buy first: the arbiter path has the longest lead
    expect(plan.map((p) => p.path)).toEqual(["arbiter", "seller", "refund"]);
  });
});

describe("checkStaged", () => {
  const gate = slot;
  const staged = (path: Staged["path"]): Staged => ({
    path,
    listing: listings[path],
    lockTx: "ab".repeat(32),
    deadlines: {
      submitResult: String(gate),
      unlock: String(gate),
      externalDisputeUnlock: String(gate),
    },
  });
  const before = gate - 5 * MIN;
  const after = gate + MIN;

  test("refund: locked, no result, before the gate → READY", () => {
    expect(checkStaged(staged("refund"), { state: 0n, resultHash: "" }, before).status).toBe(
      "READY",
    );
  });
  test("refund: the seller posted a result → PROBLEM (no plain refund any more)", () => {
    expect(checkStaged(staged("refund"), { state: 1n, resultHash: "cd" }, before).status).toBe(
      "PROBLEM",
    );
  });
  test("seller: result posted before the gate → READY; none yet → WAIT, then PROBLEM after", () => {
    expect(checkStaged(staged("seller"), { state: 1n, resultHash: "cd" }, before).status).toBe(
      "READY",
    );
    expect(checkStaged(staged("seller"), { state: 0n, resultHash: "" }, before).status).toBe(
      "WAIT",
    );
    expect(checkStaged(staged("seller"), { state: 0n, resultHash: "" }, after).status).toBe(
      "PROBLEM",
    );
  });
  test("arbiter: must already be Disputed before its gate", () => {
    expect(checkStaged(staged("arbiter"), { state: 3n, resultHash: "cd" }, before).status).toBe(
      "READY",
    );
    expect(checkStaged(staged("arbiter"), { state: 1n, resultHash: "cd" }, before).status).toBe(
      "WAIT",
    );
    expect(checkStaged(staged("arbiter"), { state: 1n, resultHash: "cd" }, after).status).toBe(
      "PROBLEM",
    );
  });
  test("spent: after its gate is DONE, before its gate is a PROBLEM", () => {
    expect(checkStaged(staged("refund"), null, after).status).toBe("DONE");
    expect(checkStaged(staged("refund"), null, before).status).toBe("PROBLEM");
  });
  test("reports seconds to the gate", () => {
    expect(checkStaged(staged("refund"), { state: 0n, resultHash: "" }, before).secondsToGate).toBe(
      300,
    );
  });
});
