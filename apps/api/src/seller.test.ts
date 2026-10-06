import { describe, expect, test } from "bun:test";
import type { OpenPurchase } from "./purchases";
import { type LockView, nextSellerAction } from "./seller";

const NOW = 1_800_000_000_000;
const min = (m: number) => BigInt(NOW + m * 60_000);
const purchase = (over: Partial<OpenPurchase> = {}): OpenPurchase => ({
  tx_hash: "ab".repeat(32),
  listing_id: "x",
  mode: "protected",
  payer: "addr_test1buyer",
  status: "FundsLocked",
  terms: "{}",
  result_tx: null,
  result_hash: null,
  closing_tx: null,
  last_ref: null,
  verification: null,
  updated_at: null,
  created_at: NOW - 60_000,
  ...over,
});
const lock = (over: Partial<LockView> = {}): LockView => ({
  state: 0n,
  resultHash: "",
  submitResultTime: min(10),
  unlockTime: min(25),
  sellerCooldownTime: 0n,
  ...over,
});

describe("nextSellerAction", () => {
  test("fresh lock: submit the result", () => {
    expect(nextSellerAction(lock(), purchase(), NOW).kind).toBe("submit");
  });

  test("does not resubmit while the last submit is in flight", () => {
    const p = purchase({ result_tx: "cd".repeat(32), updated_at: NOW - 30_000 });
    expect(nextSellerAction(lock(), p, NOW).kind).toBe("wait");
  });

  test("resubmits if the last submit never landed", () => {
    const p = purchase({ result_tx: "cd".repeat(32), updated_at: NOW - 10 * 60_000 });
    expect(nextSellerAction(lock(), p, NOW).kind).toBe("submit");
  });

  test("too close to submit_result_time: leave it, the buyer refunds", () => {
    expect(nextSellerAction(lock({ submitResultTime: min(0.5) }), purchase(), NOW).kind).toBe(
      "wait",
    );
  });

  test("result posted, before unlock: wait", () => {
    expect(nextSellerAction(lock({ state: 1n, resultHash: "ff" }), purchase(), NOW)).toEqual({
      kind: "wait",
      status: "ResultSubmitted",
    });
  });

  test("result posted, after unlock: withdraw", () => {
    const l = lock({ state: 1n, resultHash: "ff", unlockTime: min(-5) });
    expect(nextSellerAction(l, purchase(), NOW).kind).toBe("withdraw");
  });

  test("disputed: wait for the arbiter, never concede automatically", () => {
    const l = lock({ state: 3n, resultHash: "ff", unlockTime: min(-5) });
    expect(nextSellerAction(l, purchase(), NOW)).toEqual({ kind: "wait", status: "Disputed" });
  });

  test("lock gone: closed", () => {
    expect(nextSellerAction(null, purchase(), NOW).kind).toBe("closed");
  });
});
