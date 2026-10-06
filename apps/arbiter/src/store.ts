// What the arbiter has seen, kept across calls and restarts.
//
// The arbiter is called by whoever wants a verdict, so it must not forget: once an
// output matching the seller's on-chain result hash has been shown, that output is
// the evidence for the escrow from then on, whatever later callers send. And one
// escrow is paid out once.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

interface State {
  /**
   * `${lockTx}:${resultHash}` → the first output shown that matches that result hash.
   * Keyed by the result hash too: the seller may replace its result while disputed,
   * and evidence for an old hash says nothing about a new one.
   */
  evidence: Record<string, { output: string; shownAt: string }>;
  /** escrow UTxO ref → payout tx hash. */
  payouts: Record<string, string>;
}

export function createStore(path: string) {
  const load = (): State =>
    existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : { evidence: {}, payouts: {} };
  const save = (state: State) => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(`${path}.tmp`, JSON.stringify(state, null, 2));
    renameSync(`${path}.tmp`, path);
  };

  // One resolution per escrow at a time, so two concurrent calls cannot both pay.
  const busy = new Map<string, Promise<unknown>>();

  return {
    evidenceFor: (lockTx: string, resultHash: string) =>
      load().evidence[`${lockTx}:${resultHash}`]?.output,
    /** Records evidence for one posted result; the first one wins and is never replaced. */
    recordEvidence(lockTx: string, resultHash: string, output: string) {
      const state = load();
      const key = `${lockTx}:${resultHash}`;
      if (state.evidence[key]) return;
      state.evidence[key] = { output, shownAt: new Date().toISOString() };
      save(state);
    },
    payoutFor: (ref: string) => load().payouts[ref],
    recordPayout(ref: string, tx: string) {
      const state = load();
      state.payouts[ref] = tx;
      save(state);
    },
    async exclusive<T>(key: string, run: () => Promise<T>): Promise<T> {
      while (busy.has(key)) await busy.get(key)?.catch(() => {});
      const pending = run();
      busy.set(key, pending);
      try {
        return await pending;
      } finally {
        busy.delete(key);
      }
    },
  };
}

export type Store = ReturnType<typeof createStore>;
