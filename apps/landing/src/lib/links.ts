/**
 * Addresses that leave this site.
 *
 * Read from configuration so a move to another host does not leave links
 * pointing somewhere we left.
 */

/** The app (apps/web): catalogue, purchases, seller dashboard. */
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
  /\/+$/,
  "",
);

export const REPO_URL = "https://github.com/Simpuru-xyz/simpuru";

/** Setup steps for the MCP server live next to its code until there is a docs site. */
export const MCP_DOCS_URL = `${REPO_URL}/tree/main/apps/mcp`;

/** Every escrow action links to its preprod transaction. Preprod only, never mainnet. */
export const explorerTx = (hash: string) => `https://preprod.cardanoscan.io/transaction/${hash}`;
