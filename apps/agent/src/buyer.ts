import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { type DeliveryMode, type EscrowDeadlines, type Listing, X402_NETWORK } from "@simpuru/core";
import { ESCROW, isOurDeployment } from "@simpuru/core/escrow";
import { contentHash } from "@simpuru/core/hash";
import { toClientCardanoSigner } from "@x402/cardano";
import { ExactCardanoScheme } from "@x402/cardano/exact/client";
import type { PaymentRequirements } from "@x402/core/types";
import { decodePaymentResponseHeader, wrapFetchWithPayment, x402Client } from "@x402/fetch";

export interface BuyerConfig {
  mnemonic: string;
  blockfrostProjectId: string;
  apiUrl: string;
  /** Hard ceiling for a single payment. */
  maxPerPaymentLovelace: bigint;
  /** Hard ceiling for everything paid since UTC midnight. */
  dailyBudgetLovelace: bigint;
  /** JSON-lines purchase log; also the source of the daily total. */
  logPath: string;
}

/** One line of the purchase log. */
export interface PurchaseRecord {
  at: string;
  listingId: string;
  mode: DeliveryMode;
  priceLovelace: string;
  txHash: string;
  /** sha256 of what we received vs what the listing committed to. */
  receivedContentHash: string;
  listingContentHash: string;
  /** Protected path: what the seller signed (deadlines, identifier, input hash). */
  escrow?: {
    address: string;
    blockchainIdentifier: string;
    inputHash: string;
    deadlines: EscrowDeadlines;
  };
}

export type BuyResult =
  | { ok: true; record: PurchaseRecord; content: string; seconds: number }
  | { ok: false; error: string; paid: false };

export function createBuyer(cfg: BuyerConfig) {
  const signer = toClientCardanoSigner({
    mnemonic: cfg.mnemonic,
    network: X402_NETWORK,
    provider: {
      blockfrost: {
        baseUrl: "https://cardano-preprod.blockfrost.io/api/v0",
        projectId: cfg.blockfrostProjectId,
      },
    },
    validateCustomMasumiDeployment: isOurDeployment,
  });

  const purchases = (): PurchaseRecord[] =>
    existsSync(cfg.logPath)
      ? readFileSync(cfg.logPath, "utf8")
          .split("\n")
          .filter(Boolean)
          .map((l) => JSON.parse(l) as PurchaseRecord)
      : [];

  const spentToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    return purchases()
      .filter((p) => p.at.startsWith(today))
      .reduce((sum, p) => sum + BigInt(p.priceLovelace), 0n);
  };

  const getListing = async (id: string): Promise<Listing | null> => {
    const res = await fetch(`${cfg.apiUrl}/listings/${encodeURIComponent(id)}`);
    return res.ok ? ((await res.json()) as Listing) : null;
  };

  async function attempt(listing: Listing, mode: DeliveryMode) {
    let selected: PaymentRequirements | undefined;
    const client = x402Client
      .fromConfig({
        schemes: [{ network: X402_NETWORK, client: new ExactCardanoScheme(signer) }],
        policies: [
          // Only the path we asked for, only our escrow, only the listed price.
          (_v, reqs) =>
            reqs.filter(
              (r) =>
                r.amount === listing.priceLovelace &&
                r.asset === "lovelace" &&
                (mode === "protected"
                  ? r.extra?.assetTransferMethod === "masumi" && r.payTo === ESCROW.address
                  : (r.extra?.assetTransferMethod ?? "default") === "default" &&
                    r.payTo === listing.sellerAddress),
            ),
        ],
        spendControls: {
          allowedAssets: [
            {
              network: X402_NETWORK,
              asset: "lovelace",
              maxAmountPerPayment: cfg.maxPerPaymentLovelace.toString(),
            },
          ],
        },
      })
      .onAfterPaymentCreation(async (ctx) => {
        selected = ctx.selectedRequirements;
      });

    const res = await wrapFetchWithPayment(
      fetch,
      client,
    )(`${cfg.apiUrl}/listings/${encodeURIComponent(listing.id)}/unlock`);
    const body = await res.text();
    if (!res.ok) {
      const required = res.headers.get("PAYMENT-REQUIRED");
      const reason = required
        ? (JSON.parse(Buffer.from(required, "base64").toString()) as { error?: string }).error
        : undefined;
      return {
        ok: false as const,
        status: res.status,
        error: reason ?? (body || `HTTP ${res.status}`),
      };
    }
    const header = res.headers.get("PAYMENT-RESPONSE");
    const txHash = header ? decodePaymentResponseHeader(header).transaction : "";
    return { ok: true as const, body, txHash, selected };
  }

  return {
    address: signer.getAddress(),
    purchases,
    spentToday,
    getListing,

    async buy(listingId: string, mode: DeliveryMode): Promise<BuyResult> {
      const listing = await getListing(listingId);
      if (!listing) return { ok: false, paid: false, error: `listing ${listingId} not found` };
      if (!listing.modes.includes(mode))
        return { ok: false, paid: false, error: `listing does not offer ${mode}` };
      const price = BigInt(listing.priceLovelace);
      if (price > cfg.maxPerPaymentLovelace)
        return {
          ok: false,
          paid: false,
          error: `price ${price} is above the per-payment cap ${cfg.maxPerPaymentLovelace}`,
        };
      const spent = spentToday();
      if (spent + price > cfg.dailyBudgetLovelace)
        return {
          ok: false,
          paid: false,
          error: `daily budget: ${spent} spent of ${cfg.dailyBudgetLovelace}`,
        };

      const started = Date.now();
      let r = await attempt(listing, mode);
      // A 402 means nothing was broadcast. The usual cause right after another buy is a
      // wallet UTxO the provider has not indexed yet, so wait one block and try once more.
      if (!r.ok && r.status === 402) {
        await Bun.sleep(20_000);
        r = await attempt(listing, mode);
      }
      if (!r.ok) return { ok: false, paid: false, error: r.error };

      const terms = r.selected?.extra?.terms as Record<string, string> | undefined;
      const record: PurchaseRecord = {
        at: new Date().toISOString(),
        listingId: listing.id,
        mode,
        priceLovelace: listing.priceLovelace,
        txHash: r.txHash,
        receivedContentHash: contentHash(r.body),
        listingContentHash: listing.contentHash,
        ...(mode === "protected" && terms
          ? {
              escrow: {
                address: ESCROW.address,
                blockchainIdentifier: String(r.selected?.extra?.blockchainIdentifier ?? ""),
                inputHash: terms.inputHash ?? "",
                deadlines: {
                  payBy: terms.payByTime ?? "",
                  submitResult: terms.submitResultTime ?? "",
                  unlock: terms.unlockTime ?? "",
                  externalDisputeUnlock: terms.externalDisputeUnlockTime ?? "",
                },
              },
            }
          : {}),
      };
      mkdirSync(dirname(cfg.logPath), { recursive: true });
      appendFileSync(cfg.logPath, `${JSON.stringify(record)}\n`);
      return { ok: true, record, content: r.body, seconds: (Date.now() - started) / 1000 };
    },
  };
}

export type Buyer = ReturnType<typeof createBuyer>;

/** Buyer configured from the environment (root .env). */
export function buyerFromEnv(
  logPath = new URL("../data/purchases.jsonl", import.meta.url).pathname,
) {
  const need = (k: string) => {
    const v = process.env[k];
    if (!v) throw new Error(`${k} is not set (see .env.example)`);
    return v;
  };
  return createBuyer({
    mnemonic: need("BUYER_MNEMONIC"),
    blockfrostProjectId: need("BLOCKFROST_PROJECT_ID"),
    apiUrl: process.env.SIMPURU_API_URL ?? "http://localhost:4021",
    maxPerPaymentLovelace: BigInt(process.env.MAX_PER_PAYMENT_LOVELACE ?? "20000000"),
    dailyBudgetLovelace: BigInt(process.env.DAILY_BUDGET_LOVELACE ?? "50000000"),
    logPath,
  });
}
