import { X402_NETWORK } from "@simpuru/core";
import { toMasumiSellerSigner } from "@x402/cardano";
import { createApp } from "./app";
import { openDb } from "./db";
import { seed } from "./seed";

const mnemonic = process.env.SELLER_MNEMONIC;
if (!mnemonic) throw new Error("SELLER_MNEMONIC is not set (see .env.example)");
const seller = toMasumiSellerSigner({ mnemonic, network: X402_NETWORK });

const db = openDb();
seed(db, seller.sellerAddress);

export default { port: Number(process.env.PORT ?? 4021), fetch: createApp(db).fetch };
