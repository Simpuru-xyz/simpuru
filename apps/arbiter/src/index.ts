// Arbiter HTTP service. The watcher (#10) or the API calls it with a disputed
// escrow and the evidence; it answers with the verdict and either the payout tx
// or the time the dispute window opens.
//
//   POST /disputes/resolve  { ref, listing: { id, contentHash }, output }
//        Authorization: Bearer $ARBITER_TOKEN
//   GET  /health
//
// Resolving spends the arbiter wallet's fees, so the endpoint is closed to anyone
// without the shared token, and refuses to start without one.
import crypto from "node:crypto";
import { loadDeployment } from "@simpuru/escrow";
import { type ResolveRequest, resolve } from "./resolve";
import { createStore } from "./store";

const port = Number(process.env.ARBITER_PORT ?? 4023);
const token = process.env.ARBITER_TOKEN;
if (!token || token.length < 24) throw new Error("ARBITER_TOKEN must be set (24+ chars)");

const store = createStore(
  process.env.ARBITER_STORE ?? new URL("../data/arbiter.json", import.meta.url).pathname,
);

function authorized(request: Request): boolean {
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${token}`);
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

function parse(body: unknown): ResolveRequest {
  const b = body as Partial<ResolveRequest> | null;
  const ok =
    typeof b?.ref === "string" &&
    /^[0-9a-f]{64}#\d+$/.test(b.ref) &&
    typeof b.listing?.id === "string" &&
    typeof b.listing?.contentHash === "string" &&
    typeof b.output === "string";
  if (!ok) throw new Error("expected { ref: txHash#index, listing: { id, contentHash }, output }");
  return b as ResolveRequest;
}

const server = Bun.serve({
  port,
  routes: {
    "/health": () => Response.json({ ok: true, escrow: loadDeployment().escrowAddress }),
    "/disputes/resolve": {
      POST: async (request) => {
        if (!authorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
        let req: ResolveRequest;
        try {
          req = parse(await request.json());
        } catch (error) {
          return Response.json({ error: String(error) }, { status: 400 });
        }
        try {
          return Response.json(await resolve(req, store));
        } catch (error) {
          return Response.json({ error: String(error) }, { status: 422 });
        }
      },
    },
  },
});

console.log(`arbiter listening on :${server.port}`);
