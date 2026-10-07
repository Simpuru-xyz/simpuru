import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { NETWORK } from "@simpuru/core";
import type { SimpuruMcpOptions } from "@simpuru/mcp";
import { createSimpuruMcp } from "@simpuru/mcp";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { type Db, getListing } from "./db";
import { creatorsRoutes, listingsRoutes } from "./listings";
import type { Me } from "./me";
import type { OAuth } from "./oauth";
import { docsHtml, openApiSpec } from "./openapi";
import { ownedContent, PROOF_HEADER, PURCHASE_HEADER } from "./owned";
import type { Paywall } from "./paywall";
import { purchasesRoutes } from "./purchases";
import { deliveredContent } from "./seed";

/** The hosted MCP: who is calling (OAuth bearer) and the tools for that owner. */
export interface HostedMcp {
  oauth: Pick<OAuth, "routes" | "ownerOf" | "resourceMetadataUrl">;
  optionsFor: (owner: string) => SimpuruMcpOptions;
}

export function createApp(db: Db, paywall?: Paywall, hosted?: HostedMcp, me?: Me) {
  const app = new Hono();
  app.use(
    "*",
    cors({
      origin: "*",
      allowHeaders: [
        "Content-Type",
        "PAYMENT-SIGNATURE",
        "Authorization",
        "Mcp-Protocol-Version",
        PROOF_HEADER,
      ],
      exposeHeaders: ["PAYMENT-REQUIRED", "PAYMENT-RESPONSE", "WWW-Authenticate", PURCHASE_HEADER],
    }),
  );
  app.get("/health", (c) => c.json({ ok: true, network: NETWORK }));
  app.get("/openapi.json", (c) => c.json(openApiSpec));
  app.get("/docs", (c) => c.html(docsHtml));

  // Returning buyers who prove they paid skip the gate.
  app.use("/listings/:id/unlock", ownedContent(db));

  if (paywall) {
    // x402 gate: 402 with both payment options until paid, then the content below.
    app.use("/listings/:id/unlock", async (c, next) => {
      const listing = getListing(db, c.req.param("id"));
      if (!listing) return c.json({ error: "not found" }, 404);
      const gate = await paywall.forListing(listing);
      return gate(c, next);
    });
    app.get("/listings/:id/unlock", (c) => {
      const listing = getListing(db, c.req.param("id"));
      return listing ? c.text(deliveredContent(listing)) : c.json({ error: "not found" }, 404);
    });
  }

  if (hosted) {
    app.route("/", hosted.oauth.routes);
    // Hosted MCP (streamable HTTP, stateless). The client signs the owner in first (OAuth 2.1):
    // `claude mcp add --transport http simpuru <api>/mcp`.
    app.all("/mcp", async (c) => {
      const owner = hosted.oauth.ownerOf(c.req.header("authorization"));
      if (!owner) {
        c.header(
          "WWW-Authenticate",
          `Bearer resource_metadata="${hosted.oauth.resourceMetadataUrl}"`,
        );
        return c.json(
          { error: "unauthorized", hint: "Sign in through your MCP client (OAuth)" },
          401,
        );
      }
      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      await createSimpuruMcp(hosted.optionsFor(owner)).connect(transport);
      return transport.handleRequest(c.req.raw);
    });
  }

  if (me) app.route("/", me.routes);
  app.route("/listings", listingsRoutes(db, me?.sessionOwner));
  app.route("/creators", creatorsRoutes(db));
  app.route("/purchases", purchasesRoutes(db));
  return app;
}
