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

/** Sign in with a Cardano wallet, fund the Simpuru wallet, see purchases. */
export const ACCOUNT_URL = `${APP_URL}/account`;

/** Agent limits and the full MCP setup, written on the page. */
export const AGENTS_URL = `${APP_URL}/agents`;

/** List a prompt; the seller is the signed-in account. */
export const SELL_URL = `${APP_URL}/sell`;

/** The only GitHub link on the landing: the footer's "Source". */
export const REPO_URL = "https://github.com/Simpuru-xyz/simpuru";

/** Where to get test ADA. Everything runs on Cardano preprod. */
export const FAUCET_URL = "https://docs.cardano.org/cardano-testnets/tools/faucet";

/** Every escrow action links to its preprod transaction. Preprod only, never mainnet. */
export const explorerTx = (hash: string) => `https://preprod.cardanoscan.io/transaction/${hash}`;
