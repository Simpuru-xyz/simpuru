// Runs the protection watcher: one pass every 25 s over the buyer's purchase log.
//
//   bun apps/agent/src/watch.ts            (from the repo root, so .env loads)
//   bun apps/agent/src/watch.ts --once     (single pass, for scripts and tests)
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { PurchaseRecord } from "./buyer";
import { createWatcher } from "./watcher";

const dataDir = new URL("../data", import.meta.url).pathname;
const logPath = process.env.PURCHASE_LOG ?? join(dataDir, "purchases.jsonl");
const POLL_MS = 25_000;

const purchases = (): PurchaseRecord[] =>
  existsSync(logPath)
    ? readFileSync(logPath, "utf8")
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as PurchaseRecord)
    : [];

const watcher = createWatcher({
  purchases,
  delivery: (lockTx) => {
    if (!/^[0-9a-f]{64}$/.test(lockTx)) return undefined; // purchase log lines are file names here
    const path = join(dataDir, "deliveries", lockTx);
    return existsSync(path) ? readFileSync(path, "utf8") : undefined;
  },
  statusPath: process.env.WATCHER_STATUS ?? join(dataDir, "watcher.json"),
  arbiter: process.env.ARBITER_URL
    ? { url: process.env.ARBITER_URL, token: process.env.ARBITER_TOKEN ?? "" }
    : undefined,
});

const once = process.argv.includes("--once");
for (;;) {
  const status = await watcher.tick();
  for (const [lockTx, s] of Object.entries(status)) {
    const last = s.events.at(-1);
    console.log(
      `${new Date().toISOString()} ${lockTx.slice(0, 10)} ${s.closed ? "closed" : s.state}${last ? ` | ${last.action}: ${last.why}${last.tx ? ` (${last.tx})` : ""}` : ""}`,
    );
  }
  if (once) break;
  await Bun.sleep(POLL_MS);
}
