// Buyer protection: what to do next with one protected purchase, given the escrow
// as it is on chain right now. Pure, so every branch is testable without a chain.
import type { LockHashes, Verdict } from "./verify";

/** The escrow datum fields the decision needs (any vested_pay parser provides them). */
export interface EscrowNow extends LockHashes {
  /** vested_pay state index: 0 FundsLocked, 1 ResultSubmitted, 2 RefundRequested, 3 Disputed, 4 WithdrawAuthorized, 5 RefundAuthorized. */
  state: bigint;
  submitResultTime: bigint;
  unlockTime: bigint;
  externalDisputeUnlockTime: bigint;
}

export type NextAction =
  /** Take the money back: no result by the deadline, or the seller conceded. */
  | { kind: "refund"; why: string }
  /** The delivery does not match what was committed: dispute before the seller can withdraw. */
  | { kind: "dispute"; why: string }
  /** Disputed and the window is open: ask the arbiter to settle. */
  | { kind: "arbitrate"; why: string }
  | { kind: "wait"; why: string };

export function nextAction(escrow: EscrowNow, verdict: Verdict, nowMs: bigint): NextAction {
  const noResult = escrow.resultHash === "";
  switch (escrow.state) {
    case 5n:
      return { kind: "refund", why: "the seller authorized a refund" };
    case 0n:
    case 2n:
      if (noResult && nowMs > escrow.submitResultTime) {
        return { kind: "refund", why: "no result by submit_result_time" };
      }
      return { kind: "wait", why: "waiting for the seller's result" };
    case 1n:
      if (verdict.status === "mismatch") {
        if (nowMs < escrow.unlockTime) {
          return { kind: "dispute", why: verdict.reasons.join("; ") };
        }
        return { kind: "wait", why: "mismatch found after unlock_time, too late to dispute" };
      }
      return { kind: "wait", why: "delivery verified, nothing to do" };
    case 3n:
      if (nowMs > escrow.externalDisputeUnlockTime) {
        return { kind: "arbitrate", why: "dispute window is open" };
      }
      return { kind: "wait", why: "disputed, waiting for the dispute window" };
    default:
      return { kind: "wait", why: `state ${escrow.state} needs nothing from the buyer` };
  }
}
