import { expect, test } from "bun:test";
import { createAccounts } from "./accounts";
import { createApp } from "./app";
import { openDb } from "./db";
import { createOAuth } from "./oauth";
import { openApiSpec } from "./openapi";
import type { Paywall } from "./paywall";

// Stubs only so the optional routes get registered; nothing is called.
const db = openDb(":memory:");
const accounts = createAccounts(db, {
  secret: "s",
  blockfrostProjectId: "x",
  apiUrl: "http://x",
  dataDir: "/tmp",
});
const app = createApp(db, {} as Paywall, {
  oauth: createOAuth(db, accounts, "http://x"),
  optionsFor: () => {
    throw new Error("not called");
  },
});
const documented = openApiSpec.paths as Record<string, Record<string, unknown>>;

test("every API route is in the OpenAPI spec", () => {
  const missing = app.routes
    .filter((r) => !["/openapi.json", "/docs"].includes(r.path) && !r.path.includes("*"))
    // app.use() middleware is "ALL"; the only real ALL route is the MCP endpoint (POST).
    .filter((r) => r.method !== "ALL" || r.path === "/mcp")
    .map((r) => ({
      method: r.method === "ALL" ? "post" : r.method.toLowerCase(),
      path: (r.path.replace(/\/$/, "") || "/").replace(/:(\w+)/g, "{$1}"),
    }))
    .filter(({ method, path }) => !documented[path]?.[method])
    .map(({ method, path }) => `${method.toUpperCase()} ${path}`);
  expect(missing).toEqual([]);
});

test("spec and Swagger UI are served", async () => {
  const spec = (await (await app.request("/openapi.json")).json()) as {
    openapi: string;
    paths: object;
  };
  expect(spec.openapi).toBe("3.1.0");
  expect(Object.keys(spec.paths)).toContain("/listings/{id}/unlock");
  const html = await (await app.request("/docs")).text();
  expect(html).toContain("SwaggerUIBundle");
});
