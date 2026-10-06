import { X402_NETWORK } from "@simpuru/core";
import { ESCROW, isOurDeployment } from "@simpuru/core/escrow";
import { toFacilitatorCardanoSigner, toMasumiSellerSigner } from "@x402/cardano";
import { ExactCardanoScheme as FacilitatorScheme } from "@x402/cardano/exact/facilitator";
import { ExactCardanoScheme as ServerScheme } from "@x402/cardano/exact/server";
import { x402Facilitator } from "@x402/core/facilitator";
import type { PaymentOption } from "@x402/core/http";
import { type FacilitatorClient, x402ResourceServer } from "@x402/core/server";
import { paymentMiddlewareFromHTTPServer, x402HTTPResourceServer } from "@x402/hono";
import type { MiddlewareHandler } from "hono";
import type { Db, ListingRow } from "./db";
import { insertPurchase } from "./purchases";

// The issuer insists submit_result_time >= now + 15 min. With a 5 min pay-by window these
// offsets are the earliest it allows (+1 min for slot rounding): refund ~16 min, seller paid
// ~31, arbiter ~46 after the quote.
// ponytail: shorter demo deadlines need the unsafe issuer path, see #21 q4.
const PAY_BY_SECONDS = 300;
const DEADLINES = {
  submitResultAfterPayByMs: 11 * 60_000,
  unlockAfterPayByMs: 26 * 60_000,
  externalDisputeUnlockAfterPayByMs: 41 * 60_000,
};
// Block inclusion is enough evidence for a digital good, and keeps delivery under a minute.
const CONFIRMATION = { l1Confirmations: 0 };

export function createPaywall(
  db: Db,
  opts: { sellerMnemonics: string[]; blockfrostProjectId: string },
) {
  // Every wallet the platform sells from (the main seller, plus the demo bad seller when set).
  const sellers = new Map(
    opts.sellerMnemonics.map((mnemonic) => {
      const signer = toMasumiSellerSigner({ mnemonic, network: X402_NETWORK });
      return [signer.sellerAddress, signer] as const;
    }),
  );
  const [seller] = [...sellers.values()];
  if (!seller) throw new Error("at least one seller mnemonic is required");

  // In-process facilitator: no keys, only verifies and broadcasts the buyer's signed tx.
  const facilitator = new x402Facilitator().register(
    X402_NETWORK,
    new FacilitatorScheme(
      toFacilitatorCardanoSigner({
        network: X402_NETWORK,
        provider: {
          blockfrost: {
            baseUrl: "https://cardano-preprod.blockfrost.io/api/v0",
            projectId: opts.blockfrostProjectId,
          },
        },
        awaitConfirmation: false,
      }),
      { validateCustomMasumiDeployment: isOurDeployment },
    ),
  );
  const facilitatorClient: FacilitatorClient = {
    verify: (payload, requirements) => facilitator.verify(payload, requirements),
    settle: (payload, requirements) => facilitator.settle(payload, requirements),
    getSupported: async () =>
      facilitator.getSupported() as Awaited<ReturnType<FacilitatorClient["getSupported"]>>,
  };

  const build = async (listing: ListingRow): Promise<MiddlewareHandler> => {
    const listingSeller = sellers.get(listing.sellerAddress);
    const server = new x402ResourceServer(facilitatorClient).register(
      X402_NETWORK,
      new ServerScheme({
        masumi: {
          seller: listingSeller ?? seller,
          deployment: ESCROW.deployment,
          deadlines: DEADLINES,
          // input_hash binds the escrow to this listing and its committed content.
          commitment: () => [
            {
              name: "listing",
              canonicalization: "jcs",
              mediaType: "application/json",
              content: { listingId: listing.id, contentHash: listing.contentHash },
            },
          ],
        },
      }),
    );
    server.onAfterSettle(async ({ requirements, result }) => {
      if (!result.success) return;
      const protectedPath = requirements.extra?.assetTransferMethod === "masumi";
      insertPurchase(db, {
        txHash: result.transaction,
        listingId: listing.id,
        mode: protectedPath ? "protected" : "instant",
        payer: result.payer ?? "",
        status: protectedPath ? "FundsLocked" : "settled",
        terms: JSON.stringify(requirements),
      });
    });
    server.onVerifyFailure(async ({ error }) =>
      console.warn(`[verify ${listing.id}] ${error.message}`),
    );
    server.onSettleFailure(async ({ error }) =>
      console.warn(`[settle ${listing.id}] ${error.message}`),
    );

    const price = { amount: listing.priceLovelace, asset: "lovelace" };
    const accepts: PaymentOption[] = [];
    if (listing.modes.includes("instant")) {
      accepts.push({
        scheme: "exact",
        network: X402_NETWORK,
        payTo: listing.sellerAddress,
        price,
        maxTimeoutSeconds: PAY_BY_SECONDS,
        extra: {
          assetTransferMethod: "default",
          areFeesSponsored: false,
          confirmationPolicy: CONFIRMATION,
        },
      });
    }
    // A platform wallet is the escrow seller of record: its own for platform listings, the main
    // one for creators (it signs the quote, submits, withdraws, then pays the creator; see seller.ts).
    if (listing.modes.includes("protected")) {
      accepts.push({
        scheme: "exact",
        network: X402_NETWORK,
        payTo: ESCROW.address,
        price,
        maxTimeoutSeconds: PAY_BY_SECONDS,
        extra: {
          assetTransferMethod: "masumi",
          areFeesSponsored: false,
          confirmationPolicy: CONFIRMATION,
        },
      });
    }
    if (accepts.length === 0) throw new Error(`listing ${listing.id} has no payable mode`);

    const http = new x402HTTPResourceServer(server, {
      [`GET /listings/${listing.id}/unlock`]: {
        accepts,
        description: listing.title,
        mimeType: "text/plain",
      },
    });
    await server.initialize();
    await http.initialize();
    return paymentMiddlewareFromHTTPServer(http, undefined, undefined, false);
  };

  // Listings never change after creation, so one middleware per listing, built on first use.
  const cache = new Map<string, Promise<MiddlewareHandler>>();
  return {
    sellerAddress: seller.sellerAddress,
    sellerAddresses: [...sellers.keys()],
    forListing(listing: ListingRow) {
      let handler = cache.get(listing.id);
      if (!handler) {
        handler = build(listing);
        handler.catch(() => cache.delete(listing.id));
        cache.set(listing.id, handler);
      }
      return handler;
    },
  };
}

export type Paywall = ReturnType<typeof createPaywall>;
