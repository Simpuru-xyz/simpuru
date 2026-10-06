// Stage the demo recording (#49): one escrow per protected path, bought so each gate opens
// at a chosen second of the recording (the "slot"), plus a pre-stage check read from chain.
//
//   bun apps/agent/scripts/stage-demo.ts plan  --slot 2026-10-07T10:00:00Z
//   bun apps/agent/scripts/stage-demo.ts run   --slot 2026-10-07T10:00:00Z
//   bun apps/agent/scripts/stage-demo.ts check [--json]
//
// Options (plan/run): --seller-at 60 --refund-at 120 --arbiter-at 180  (seconds after the
// slot start each gate opens; the order of the video, docs/demo.md), --refund-listing / --seller-listing / --arbiter-listing.
// Run from the repo root so .env loads (BUYER_MNEMONIC, BLOCKFROST_PROJECT_ID, SIMPURU_API_URL).
// `run` must start at least ~46 min before the slot; it sleeps until each buy is due.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Address } from "@evolution-sdk/evolution";
import { loadDeployment, lockTxOf, readClient, viewOf } from "@simpuru/escrow";
import { buyerFromEnv } from "../src/buyer";
import { type CheckRow, checkStaged, type EscrowState, planStage, type Staged } from "../src/stage";

const dataDir = new URL("../data", import.meta.url).pathname;
const stagePath = process.env.STAGE_FILE ?? join(dataDir, "stage.json");

const args = process.argv.slice(2);
const cmd = args[0];
const opt = (name: string, fallback?: string) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

function plan() {
  const slot = opt("slot");
  if (!slot || Number.isNaN(Date.parse(slot))) throw new Error("--slot <ISO time> is required");
  return planStage({
    slotMs: Date.parse(slot),
    gateOffsetSec: {
      refund: Number(opt("refund-at", "120")),
      seller: Number(opt("seller-at", "60")),
      arbiter: Number(opt("arbiter-at", "180")),
    },
    listings: {
      refund: opt("refund-listing", "demo-no-delivery") as string,
      seller: opt("seller-listing", "aurora-saas-hero") as string,
      arbiter: opt("arbiter-listing", "demo-wrong-file") as string,
    },
  });
}

const iso = (ms: number) => new Date(ms).toISOString();
const loadStaged = (): Staged[] =>
  existsSync(stagePath) ? JSON.parse(readFileSync(stagePath, "utf8")) : [];

if (cmd === "plan") {
  const now = Date.now();
  for (const p of plan()) {
    const late = p.buyAt < now ? "  ← already too late" : "";
    console.log(
      `${p.path.padEnd(8)} buy ${p.listing} at ${iso(p.buyAt)} → gate ${iso(p.gateAt)}${late}`,
    );
  }
} else if (cmd === "run") {
  const steps = plan();
  const late = steps.filter((p) => p.buyAt < Date.now() - 30_000);
  if (late.length) throw new Error(`too late to stage: ${late.map((p) => p.path).join(", ")}`);
  const buyer = buyerFromEnv();
  for (const p of steps) {
    const wait = p.buyAt - Date.now();
    console.log(
      `${iso(Date.now())} ${p.path}: buying ${p.listing} in ${Math.round(wait / 1000)} s`,
    );
    if (wait > 0) await Bun.sleep(wait);
    const r = await buyer.buy(p.listing, "protected");
    if (!r.ok || r.redelivered || !r.record.escrow) {
      console.error(`${p.path}: not staged (${r.ok ? "no escrow" : r.error})`);
      continue;
    }
    const staged: Staged = {
      path: p.path,
      listing: p.listing,
      lockTx: r.record.txHash,
      deadlines: r.record.escrow.deadlines,
    };
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(stagePath, JSON.stringify([...loadStaged(), staged], null, 2));
    console.log(`${iso(Date.now())} ${p.path}: locked ${staged.lockTx}`);
  }
} else if (cmd === "check") {
  const staged = loadStaged();
  if (!staged.length) throw new Error(`nothing staged in ${stagePath}`);
  // Map lock tx → current escrow state. An escrow missing once may be a Koios gap, so a
  // staged escrow only counts as spent if two reads a few seconds apart agree.
  const read = async () => {
    const map = new Map<string, EscrowState>();
    const escrow = Address.fromBech32(loadDeployment().escrowAddress);
    for (const utxo of await readClient().getUtxos(escrow)) {
      const ref = `${Buffer.from(utxo.transactionId.hash).toString("hex")}#${utxo.index}`;
      const lock = await lockTxOf(ref).catch(() => undefined);
      if (lock) map.set(lock, { state: viewOf(utxo).state, resultHash: viewOf(utxo).resultHash });
    }
    return map;
  };
  let states = await read();
  if (staged.some((s) => !states.has(s.lockTx))) {
    await Bun.sleep(5_000);
    const again = await read();
    states = new Map([...states, ...again]);
  }
  const now = Date.now();
  const rows: CheckRow[] = staged.map((s) => checkStaged(s, states.get(s.lockTx) ?? null, now));
  if (args.includes("--json")) {
    console.log(JSON.stringify(rows, null, 2));
  } else {
    for (const r of rows) {
      const t = r.secondsToGate >= 0 ? `in ${r.secondsToGate}s` : `${-r.secondsToGate}s ago`;
      console.log(
        `${r.status.padEnd(7)} ${r.path.padEnd(7)} ${r.state.padEnd(15)} ${r.gate} ${t.padEnd(9)} ${r.lockTx.slice(0, 10)}  ${r.note}`,
      );
    }
    const bad = rows.filter((r) => r.status === "PROBLEM");
    if (bad.length) process.exitCode = 1;
  }
} else {
  console.error("usage: stage-demo.ts <plan|run|check> [--slot ISO] ...");
  process.exit(2);
}
