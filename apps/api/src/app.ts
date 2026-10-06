import { NETWORK } from "@simpuru/core";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { type Db, getListing } from "./db";
import { listingsRoutes } from "./listings";
import { ownedContent, PROOF_HEADER, PURCHASE_HEADER } from "./owned";
import type { Paywall } from "./paywall";
import { purchasesRoutes } from "./purchases";

export function createApp(db: Db, paywall?: Paywall) {
  const app = new Hono();
  app.use(
    "*",
    cors({
      origin: "*",
      allowHeaders: ["Content-Type", "PAYMENT-SIGNATURE", PROOF_HEADER],
      exposeHeaders: ["PAYMENT-REQUIRED", "PAYMENT-RESPONSE", PURCHASE_HEADER],
    }),
  );
  app.get("/health", (c) => c.json({ ok: true, network: NETWORK }));

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
      return listing ? c.text(listing.content) : c.json({ error: "not found" }, 404);
    });
  }

  app.route("/listings", listingsRoutes(db));
  app.route("/purchases", purchasesRoutes(db));
  return app;
}
