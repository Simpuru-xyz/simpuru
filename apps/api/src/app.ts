import { NETWORK } from "@simpuru/core";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Db } from "./db";
import { listingsRoutes } from "./listings";

export function createApp(db: Db) {
  const app = new Hono();
  app.use("*", cors());
  app.get("/health", (c) => c.json({ ok: true, network: NETWORK }));
  app.route("/listings", listingsRoutes(db));
  return app;
}
