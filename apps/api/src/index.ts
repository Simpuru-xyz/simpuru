import { NETWORK } from "@simpuru/core";
import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true, network: NETWORK }));

export default { port: Number(process.env.PORT ?? 4021), fetch: app.fetch };
