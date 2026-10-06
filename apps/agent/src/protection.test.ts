import { describe, expect, test } from "bun:test";
import { type EscrowNow, nextAction } from "./protection";
import type { Verdict } from "./verify";

const base: EscrowNow = {
  state: 0n,
  inputHash: "aa",
  resultHash: "",
  submitResultTime: 1_000n,
  unlockTime: 2_000n,
  externalDisputeUnlockTime: 3_000n,
};
const ok: Verdict = { status: "ok" };
const noResultYet: Verdict = { status: "no_result_yet" };
const mismatch: Verdict = { status: "mismatch", reasons: ["content hash differs"] };

describe("nextAction", () => {
  test("no result before the deadline: wait", () => {
    expect(nextAction(base, noResultYet, 999n).kind).toBe("wait");
  });

  test("no result after submit_result_time: refund", () => {
    expect(nextAction(base, noResultYet, 1_001n).kind).toBe("refund");
  });

  test("seller conceded: refund at once", () => {
    expect(nextAction({ ...base, state: 5n }, noResultYet, 0n).kind).toBe("refund");
  });

  test("result submitted and it matches: nothing to do", () => {
    expect(nextAction({ ...base, state: 1n, resultHash: "bb" }, ok, 1_500n).kind).toBe("wait");
  });

  test("result submitted but mismatched, before unlock: dispute", () => {
    expect(nextAction({ ...base, state: 1n, resultHash: "bb" }, mismatch, 1_500n).kind).toBe(
      "dispute",
    );
  });

  test("mismatch noticed after unlock: too late, the contract no longer allows a dispute", () => {
    expect(nextAction({ ...base, state: 1n, resultHash: "bb" }, mismatch, 2_001n).kind).toBe(
      "wait",
    );
  });

  test("disputed: wait for the window, then ask the arbiter", () => {
    const disputed = { ...base, state: 3n, resultHash: "bb" };
    expect(nextAction(disputed, mismatch, 2_999n).kind).toBe("wait");
    expect(nextAction(disputed, mismatch, 3_001n).kind).toBe("arbitrate");
  });

  test("a result on chain never triggers a plain refund, even past the deadline", () => {
    expect(nextAction({ ...base, state: 0n, resultHash: "bb" }, ok, 5_000n).kind).toBe("wait");
  });
});
