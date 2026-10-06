/**
 * Addresses that leave this site.
 *
 * Read from configuration so a move to another host does not leave links
 * pointing somewhere we left.
 */

export const REPO_URL = "https://github.com/Simpuru-xyz/simpuru";

/** The MCP server, as an agent connects to it. */
export const MCP_URL = `${(process.env.NEXT_PUBLIC_MCP_URL ?? "http://localhost:3004").replace(/\/+$/, "")}/mcp`;

/** Setup steps for the MCP server live next to its code until there is a docs site. */
export const MCP_DOCS_URL = `${REPO_URL}/tree/main/apps/mcp`;

/** Every escrow action links to its preprod transaction. Preprod only, never mainnet. */
export const explorerTx = (hash: string) => `https://preprod.cardanoscan.io/transaction/${hash}`;
