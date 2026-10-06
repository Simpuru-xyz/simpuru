import { afterAll, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createBuyer } from "@simpuru/agent";
import { createApp } from "./app";
import { openDb } from "./db";
import { seed } from "./seed";

const db = openDb(":memory:");
seed(db, `addr_test1${"q".repeat(98)}`);
// Serve first so the buyer and the MCP tools can point at the real URL.
let app: ReturnType<typeof createApp> | undefined;
const server = Bun.serve({
  port: 0,
  fetch: (req) => (app as ReturnType<typeof createApp>).fetch(req),
});
const base = `http://localhost:${server.port}`;
app = createApp(db, undefined, {
  // Public BIP-39 test vector, never funded: these tests never pay.
  buyer: createBuyer({
    mnemonic: `${"abandon ".repeat(23)}art`,
    blockfrostProjectId: "unused",
    apiUrl: base,
    maxPerPaymentLovelace: 1n,
    dailyBudgetLovelace: 1n,
    logPath: join(mkdtempSync(join(tmpdir(), "mcp-")), "log.jsonl"),
  }),
  api: base,
  dailyBudgetLovelace: 1n,
});
afterAll(() => server.stop(true));

const connect = async () => {
  const client = new Client({ name: "test", version: "0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${base}/mcp`)));
  return client;
};

test("hosted MCP lists the Simpuru tools over HTTP", async () => {
  const client = await connect();
  const names = (await client.listTools()).tools.map((t) => t.name).sort();
  expect(names).toEqual([
    "buy_listing",
    "get_listing",
    "get_purchase_status",
    "my_purchases",
    "search_listings",
  ]);
  await client.close();
});

test("search_listings reads the catalogue", async () => {
  const client = await connect();
  const r = (await client.callTool({
    name: "search_listings",
    arguments: { query: "pricing" },
  })) as {
    content: { text: string }[];
  };
  const hits = JSON.parse(r.content[0]?.text ?? "[]") as { id: string }[];
  expect(hits.map((h) => h.id)).toEqual(["kinetic-pricing-section"]);
  await client.close();
});

test("a buy above the hosted cap is refused before anything is signed", async () => {
  const client = await connect();
  const r = (await client.callTool({
    name: "buy_listing",
    arguments: { id: "aurora-saas-hero", mode: "instant" },
  })) as {
    isError?: boolean;
    content: { text: string }[];
  };
  expect(r.isError).toBe(true);
  expect(r.content[0]?.text).toContain("Not paid");
  await client.close();
});
