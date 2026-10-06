// Demo staging (#49): the demo is live on stage, and each protected path only
// moves once a deadline passes, so every escrow is bought ahead of time so its
// gate opens at a chosen moment of the slot. Pure functions; the CLI is
// scripts/stage-demo.ts.

/** Minutes from the buy (quote) to each gate, from apps/api/src/paywall.ts: pay-by 5 + 11 / 26 / 41. */
export const GATE_AFTER_BUY_MIN = { refund: 16, seller: 31, arbiter: 46 } as const;

export type Path = keyof typeof GATE_AFTER_BUY_MIN;

export interface PathPlan {
  path: Path;
  listing: string;
  /** When the gate should open (POSIX ms). */
  gateAt: number;
  /** When to buy so that it does (POSIX ms). */
  buyAt: number;
}

export interface StagePlanInput {
  slotMs: number;
  /** Seconds after the slot start each gate should open. */
  gateOffsetSec: Record<Path, number>;
  listings: Record<Path, string>;
}

export function planStage(input: StagePlanInput): PathPlan[] {
  return (Object.keys(GATE_AFTER_BUY_MIN) as Path[])
    .map((path) => {
      const gateAt = input.slotMs + input.gateOffsetSec[path] * 1000;
      return {
        path,
        listing: input.listings[path],
        gateAt,
        buyAt: gateAt - GATE_AFTER_BUY_MIN[path] * 60_000,
      };
    })
    .sort((a, b) => a.buyAt - b.buyAt);
}

/** What a staged purchase recorded: the lock and its real deadlines (POSIX ms strings). */
export interface Staged {
  path: Path;
  listing: string;
  lockTx: string;
  deadlines: { submitResult: string; unlock: string; externalDisputeUnlock: string };
}

/** The escrow as read from chain right now; null when it is no longer at the escrow address. */
export interface EscrowState {
  state: bigint;
  resultHash: string;
}

const STATE = [
  "FundsLocked",
  "ResultSubmitted",
  "RefundRequested",
  "Disputed",
  "WithdrawAuthorized",
  "RefundAuthorized",
];

export interface CheckRow {
  path: Path;
  listing: string;
  lockTx: string;
  state: string;
  gate: string;
  gateAt: string;
  secondsToGate: number;
  status: "READY" | "WAIT" | "DONE" | "PROBLEM";
  note: string;
}

function gateOf(s: Staged): { name: string; at: number } {
  if (s.path === "refund")
    return { name: "submit_result_time", at: Number(s.deadlines.submitResult) };
  if (s.path === "seller") return { name: "unlock_time", at: Number(s.deadlines.unlock) };
  return { name: "external_dispute_unlock_time", at: Number(s.deadlines.externalDisputeUnlock) };
}

/**
 * READY: in the state its gate needs, so the actor will fire when the gate opens.
 * WAIT: an earlier step is still expected (e.g. seller result, watcher dispute).
 * DONE: spent after its gate. PROBLEM: will not fire as staged.
 */
export function checkStaged(s: Staged, escrow: EscrowState | null, nowMs: number): CheckRow {
  const gate = gateOf(s);
  const base = {
    path: s.path,
    listing: s.listing,
    lockTx: s.lockTx,
    gate: gate.name,
    gateAt: new Date(gate.at).toISOString(),
    secondsToGate: Math.round((gate.at - nowMs) / 1000),
  };
  if (!escrow) {
    return nowMs >= gate.at
      ? { ...base, state: "spent", status: "DONE", note: "escrow spent after its gate" }
      : { ...base, state: "spent", status: "PROBLEM", note: "escrow spent before its gate" };
  }
  const state = STATE[Number(escrow.state)] ?? String(escrow.state);
  const row = (status: CheckRow["status"], note: string): CheckRow => ({
    ...base,
    state,
    status,
    note,
  });
  const early = nowMs < gate.at;

  switch (s.path) {
    case "refund":
      if (escrow.resultHash !== "")
        return row("PROBLEM", "seller posted a result: no plain refund");
      return row(
        early ? "READY" : "WAIT",
        early ? "watcher refunds when the gate opens" : "gate open, waiting for the watcher",
      );
    case "seller":
      if (escrow.state === 1n)
        return row(
          early ? "READY" : "WAIT",
          early
            ? "seller agent withdraws when the gate opens"
            : "gate open, waiting for the seller agent",
        );
      if (escrow.state === 0n)
        return row(early ? "WAIT" : "PROBLEM", "seller agent has not posted its result yet");
      return row("PROBLEM", "the buyer disputed or a refund is in play");
    case "arbiter":
      if (escrow.state === 3n)
        return row(
          early ? "READY" : "WAIT",
          early
            ? "watcher asks the arbiter when the gate opens"
            : "gate open, waiting for watcher + arbiter",
        );
      if (escrow.state === 0n || escrow.state === 1n)
        return row(
          early ? "WAIT" : "PROBLEM",
          escrow.state === 0n
            ? "seller has not posted the wrong file yet"
            : "not disputed yet: is the watcher running?",
        );
      return row("PROBLEM", "escrow is not on the dispute path");
  }
}
