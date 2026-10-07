import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

export const sans = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
}).fontFamily;
export const mono = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] }).fontFamily;

export const C = {
  bg: "#ffffff",
  ink: "#0a0a0a",
  muted: "#6b6b6b",
  line: "#e6e6e6",
  soft: "#f5f5f5",
  night: "#0b0b12",
  green: "#16a34a",
  red: "#dc2626",
  amber: "#d97706",
  violet: "#6d5dfc",
};

/** Real preprod transactions (docs/demo.md). */
export const TX = {
  lockWeb: "0159485bc6894d2ad005fe9e417952698339332494dcec8146b34828ef313238",
  oylaLock: "3219a522944214055ad9dc1574ed6971b5c5b05bc177902f5228ccd298502b2b",
  oylaResult: "37735beeee1a976c4fd5783c74377e92831dda3ef7183ddb768033f66b993e8a",
  oylaWithdraw: "ef89895f89f9c91d8bf67c17eb479431cb6a8a88f95291981108cbf713f1308d",
  creatorPaid: "af4944a72de3af14bf5f60a9beab7a8731ee2674e7ee39c1b4bf514ccee67f0b",
  noDeliveryRefund: "66879ef7bd7845105e4a0f6706c09abe3c6a362cb1e19f07a784dd834650353b",
  wrongLock: "7863336b61a012864c441d4cff8e24541555a50de95150cec37fdfee816a7be1",
  wrongResult: "0e04bea941a2d9f9969c465c0855abdcb6467c11ac66615fb19e1b9e15f0035c",
  dispute: "11ec18911105623851eb11bddf7051e998ddbb76803f5c0273360c21d2fc00d9",
  arbiterRefund: "52c7d537f69d02367310860b3cdfdf5c416912f888b075977ae15895d4938f26",
  sellerPaidArbiter: "763b27fee81803c91507747be3dce4ae4796181ea42bcc6a93f9b498b639aa15",
  mcpBuy: "fc9db1e1a198a7dd3b270dc57bd793c66c4d05e14538e42b8a04caa4230ee7be",
  usdmLock: "5d406f9c4e4db34235148a9f33760f7713b1486722844a2e87426bcc61c109e9",
  usdmResult: "1fb3b13e8d75dfee62b9ba9768ab714c9e3ee19f4c13888a22af2bc5b64840ca",
  usdmPaid: "b18e3608011af78ed2ce4f4f1d32c599f8f457a91cc51dac45b14bb9229ba9d5",
};
export const short = (h: string) => `${h.slice(0, 8)}…${h.slice(-6)}`;
