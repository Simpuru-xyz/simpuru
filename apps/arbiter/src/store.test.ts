import { describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStore } from "./store";

const fresh = () => createStore(join(mkdtempSync(join(tmpdir(), "arbiter-")), "state.json"));

describe("arbiter store", () => {
  test("the first matching evidence is kept; a later caller cannot replace it", () => {
    const store = fresh();
    store.recordEvidence("lock1", "r1", "the real report");
    store.recordEvidence("lock1", "r1", "something a buyer made up");
    expect(store.evidenceFor("lock1", "r1")).toBe("the real report");
  });

  test("evidence for one posted result does not carry over to a replaced result", () => {
    const store = fresh();
    store.recordEvidence("lock1", "r1", "the real report");
    expect(store.evidenceFor("lock1", "r2")).toBeUndefined();
  });

  test("evidence and payouts survive a restart", () => {
    const path = join(mkdtempSync(join(tmpdir(), "arbiter-")), "state.json");
    createStore(path).recordEvidence("lock1", "r1", "x");
    createStore(path).recordPayout("ref#0", "tx1");
    const reopened = createStore(path);
    expect(reopened.evidenceFor("lock1", "r1")).toBe("x");
    expect(reopened.payoutFor("ref#0")).toBe("tx1");
  });

  test("two resolutions of one escrow never overlap", async () => {
    const store = fresh();
    let running = 0;
    let maxRunning = 0;
    const job = () =>
      store.exclusive("ref#0", async () => {
        running++;
        maxRunning = Math.max(maxRunning, running);
        await Bun.sleep(20);
        running--;
      });
    await Promise.all([job(), job(), job()]);
    expect(maxRunning).toBe(1);
  });
});
