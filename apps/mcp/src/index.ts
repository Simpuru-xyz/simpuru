// Simpuru MCP server over stdio, next to the agent, paying from the agent's own wallet (.env).
// Never write to stdout here: it is the MCP transport.
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buyerFromEnv } from "@simpuru/agent";
import { createSimpuruMcp } from "./server";

const mcp = createSimpuruMcp({
  buyer: buyerFromEnv(),
  api: process.env.SIMPURU_API_URL ?? "https://api.simpuru.xyz",
  dailyBudgetLovelace: BigInt(process.env.DAILY_BUDGET_LOVELACE ?? "50000000"),
});
await mcp.connect(new StdioServerTransport());
