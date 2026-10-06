// Arbiter HTTP service. The watcher (#10) or the API calls it with a disputed
// escrow and the evidence; it answers with the verdict and either the payout tx
// or the time the dispute window opens.
//
//   POST /disputes/resolve  { ref, listing: { id, contentHash }, output, identifierFromPurchaser }
//   GET  /health
import { loadDeployment } from "@simpuru/escrow";
import { type ResolveRequest, resolve } from "./resolve";

const port = Number(process.env.ARBITER_PORT ?? 4023);

function parse(body: unknown): ResolveRequest {
  const b = body as Partial<ResolveRequest> | null;
  const ok =
    typeof b?.ref === "string" &&
    /^[0-9a-f]{64}#\d+$/.test(b.ref) &&
    typeof b.listing?.id === "string" &&
    typeof b.listing?.contentHash === "string" &&
    typeof b.output === "string" &&
    typeof b.identifierFromPurchaser === "string";
  if (!ok)
    throw new Error(
      "expected { ref: txHash#index, listing: { id, contentHash }, output, identifierFromPurchaser }",
    );
  return b as ResolveRequest;
}

const server = Bun.serve({
  port,
  routes: {
    "/health": () => Response.json({ ok: true, escrow: loadDeployment().escrowAddress }),
    "/disputes/resolve": {
      POST: async (request) => {
        let req: ResolveRequest;
        try {
          req = parse(await request.json());
        } catch (error) {
          return Response.json({ error: String(error) }, { status: 400 });
        }
        try {
          return Response.json(await resolve(req));
        } catch (error) {
          return Response.json({ error: String(error) }, { status: 422 });
        }
      },
    },
  },
});

console.log(`arbiter listening on :${server.port}`);
