// Simpuru Shopper, a Sokosumi Coworker. A Task asks for a design prompt; the shopper finds it on
// Simpuru, asks 1 test USDM for the job through our Masumi Payment Service (Masumi escrow), and once
// the buyer's funds are locked buys the prompt on Simpuru with buyer protection (ADA, our escrow)
// from its own Simpuru account. The Task result is the prompt plus the purchase receipt.
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { Listing } from "@simpuru/core";
import { sha256Hex } from "@simpuru/core/hash";
import { toMasumiSellerSigner } from "@x402/cardano";
import { pickListing } from "./match";

const env = (k: string, fallback?: string) => {
  const v = process.env[k] ?? fallback;
  if (v === undefined) throw new Error(`${k} is not set`);
  return v;
};
const CORE = env("SOKOSUMI_API", "https://api.preprod.sokosumi.com");
const COWORKER_ID = env("COWORKER_ID");
const CORE_KEY = env("SOKOSUMI_COWORKER_KEY");
const SIMPURU = env("SIMPURU_API", "http://127.0.0.1:4021");
const SHOPPER = toMasumiSellerSigner({
  mnemonic: env("SHOPPER_MNEMONIC"),
  network: "cardano:preprod",
});
const STATE_PATH = env("STATE_PATH", "coworker-state.json");
// Paid Tasks need our payment node; without it the shopper still works, for free.
const MPS =
  process.env.MPS_URL && process.env.MPS_TOKEN && process.env.MPS_AGENT_ID
    ? { url: process.env.MPS_URL, token: process.env.MPS_TOKEN, agent: process.env.MPS_AGENT_ID }
    : null;
const USDM = "16a55b2a349361ff88c03788f93e1e966e5d689605d044fef722ddde0014df10745553444d";
const FEE = { amount: "1000000", unit: USDM }; // 1 test USDM per Task
const MIN = 60_000;

type Payment = Record<string, unknown> & {
  blockchainIdentifier: string;
  payByTime: string;
  submitResultTime: string;
};
type State = {
  stage: "started" | "awaiting_funds" | "result_ready" | "awaiting_result" | "done" | "failed";
  input: string;
  listingId?: string;
  nonce?: string;
  payment?: Payment;
  result?: string;
  note?: string;
};
const states: Record<string, State> = existsSync(STATE_PATH)
  ? JSON.parse(readFileSync(STATE_PATH, "utf8"))
  : {};
const save = () => writeFileSync(STATE_PATH, JSON.stringify(states, null, 2), { mode: 0o600 });
const log = (taskId: string, msg: string) => console.log(`[coworker] ${taskId.slice(-8)} ${msg}`);

async function core(path: string, body?: unknown) {
  const r = await fetch(CORE + path, {
    method: body ? "POST" : "GET",
    headers: { authorization: `Bearer ${CORE_KEY}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
  });
  const j = (await r.json().catch(() => ({}))) as { data?: unknown };
  if (!r.ok) throw new Error(`Core ${path} ${r.status} ${JSON.stringify(j).slice(0, 300)}`);
  return j.data as Record<string, unknown>;
}
const event = (taskId: string, body: Record<string, unknown>) =>
  core(`/v1/tasks/${taskId}/events`, body);

async function mps(path: string, body: unknown) {
  if (!MPS) throw new Error("no payment node");
  const r = await fetch(MPS.url + path, {
    method: "POST",
    headers: { token: MPS.token, "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  const j = (await r.json().catch(() => ({}))) as { status?: string; data?: unknown };
  if (!r.ok || j.status !== "success")
    throw new Error(`MPS ${path} ${r.status} ${JSON.stringify(j).slice(0, 300)}`);
  return j.data as Record<string, unknown>;
}

// --- Simpuru: the shopper is an ordinary signed-in Simpuru account.
let session: string | null = null;
async function simpuru(
  path: string,
  body?: unknown,
): Promise<{ status: number; body: Record<string, unknown> }> {
  if (!session) {
    const ch = (await (
      await fetch(`${SIMPURU}/auth/challenge`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: SHOPPER.sellerAddress }),
      })
    ).json()) as { owner: string; digest: string };
    const sig = await SHOPPER.signTerms(ch.owner, ch.digest);
    const v = (await (
      await fetch(`${SIMPURU}/auth/verify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ owner: ch.owner, ...sig }),
      })
    ).json()) as { token?: string };
    if (!v.token) throw new Error("Simpuru sign-in failed");
    session = v.token;
  }
  const r = await fetch(SIMPURU + path, {
    method: body ? "POST" : "GET",
    headers: { authorization: `Bearer ${session}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(180_000), // a protected purchase waits for the chain
  });
  if (r.status === 401) session = null;
  return { status: r.status, body: (await r.json().catch(() => ({}))) as Record<string, unknown> };
}

async function findListing(input: string): Promise<Listing | null> {
  const all = (await (await fetch(`${SIMPURU}/listings`)).json()) as Listing[];
  const picked = pickListing(input, all);
  if (picked) return picked;
  // A listing id given in the Task may be unlisted from the catalogue but still for sale.
  for (const id of input.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g) ??
    []) {
    const r = await fetch(`${SIMPURU}/listings/${id}`);
    if (r.ok) return pickListing(id, [(await r.json()) as Listing]);
  }
  return null;
}

async function buy(listingId: string) {
  const r = await simpuru("/me/buy", { listingId, mode: "protected" });
  if (r.status !== 200) throw new Error(String(r.body.error ?? `buy failed (${r.status})`));
  const p = r.body.purchase as { txHash: string; status: string; escrow?: { address: string } };
  const listing = (await (await fetch(`${SIMPURU}/listings/${listingId}`)).json()) as Listing;
  return [
    `Bought "${listing.title}" on Simpuru for ${Number(listing.priceLovelace) / 1e6} tADA, with buyer protection.`,
    `Payment (locked in escrow until delivery checks out): https://preprod.cardanoscan.io/transaction/${p.txHash}`,
    `The seller committed to this content up front (sha256 ${listing.contentHash}); if it doesn't match, the escrow refunds.`,
    "",
    "--- Prompt ---",
    String(r.body.content),
  ].join("\n");
}

const confirmed = (p: Record<string, unknown>, state: string) =>
  p.onChainState === state &&
  [p.CurrentTransaction, ...((p.TransactionHistory as unknown[]) ?? [])].some(
    (t) =>
      (t as { status?: string; newOnChainState?: string } | null)?.status === "Confirmed" &&
      (t as { newOnChainState?: string }).newOnChainState === state,
  );

async function advance(taskId: string, s: State) {
  if (s.stage === "started") {
    const listing = await findListing(s.input);
    if (!listing) {
      await event(taskId, {
        status: "COMPLETED",
        comment:
          "I couldn't find a matching prompt on Simpuru within your budget (protected purchases only). Nothing was charged. Try different words or a listing id from https://app.simpuru.xyz.",
      });
      return Object.assign(s, { stage: "done", note: "no match" });
    }
    s.listingId = listing.id;
    if (!MPS) return Object.assign(s, { stage: "result_ready", result: await buy(listing.id) });
    // Quote the job: our payment node signs terms bound to this exact Task input.
    s.nonce = randomBytes(10).toString("hex");
    const now = Date.now();
    const payment = (await mps("/api/v1/payment", {
      network: "Preprod",
      agentIdentifier: MPS.agent,
      paymentSourceType: "Web3CardanoV2",
      inputHash: sha256Hex(s.input),
      identifierFromPurchaser: s.nonce,
      RequestedFunds: [FEE],
      payByTime: new Date(now + 5 * MIN).toISOString(),
      submitResultTime: new Date(now + 20 * MIN).toISOString(),
      unlockTime: new Date(now + 36 * MIN).toISOString(),
      externalDisputeUnlockTime: new Date(now + 52 * MIN).toISOString(),
      metadata: JSON.stringify({ taskId, listingId: listing.id }),
    })) as Payment;
    s.payment = payment;
    save();
    const ps = payment.PaymentSource as { smartContractAddress: string; policyId: string };
    const wallet = payment.SmartContractWallet as { walletVkey: string };
    await event(taskId, {
      comment: `Found "${listing.title}" (${Number(listing.priceLovelace) / 1e6} tADA). My fee is 1 test USDM, held in escrow until I deliver.`,
      masumiPayment: {
        blockchainIdentifier: payment.blockchainIdentifier,
        agentIdentifier: payment.agentIdentifier,
        sellerVkey: wallet.walletVkey,
        submitResultTime: payment.submitResultTime,
        payByTime: payment.payByTime,
        unlockTime: payment.unlockTime,
        externalDisputeUnlockTime: payment.externalDisputeUnlockTime,
        inputHash: payment.inputHash,
        identifierFromPurchaser: s.nonce,
        paymentSourceType: "Web3CardanoV2",
        supportedPaymentSourceIndex: 0,
        Amounts: (payment.RequestedFunds as { amount: string; unit: string }[]).map(
          ({ amount, unit }) => ({ amount, unit }),
        ),
        PaymentSource: {
          network: "Preprod",
          smartContractAddress: ps.smartContractAddress,
          policyId: ps.policyId,
        },
      },
    });
    return Object.assign(s, { stage: "awaiting_funds" });
  }

  const payment = s.payment;
  const resolve = () =>
    mps("/api/v1/payment/resolve-blockchain-identifier", {
      network: "Preprod",
      blockchainIdentifier: payment?.blockchainIdentifier,
      includeHistory: "true",
    });

  if (s.stage === "awaiting_funds" && payment) {
    if (Date.now() > Number(payment.payByTime) + 10 * MIN)
      return Object.assign(s, { stage: "failed", note: "buyer never paid" });
    if (!confirmed(await resolve(), "FundsLocked")) return s;
    log(taskId, "funds locked, buying");
    return Object.assign(s, { stage: "result_ready", result: await buy(s.listingId as string) });
  }

  if (s.stage === "result_ready" && s.result) {
    if (payment) {
      await mps("/api/v1/payment/submit-result", {
        network: "Preprod",
        blockchainIdentifier: payment.blockchainIdentifier,
        submitResultHash: sha256Hex(s.result),
      });
      return Object.assign(s, { stage: "awaiting_result" });
    }
    await event(taskId, { status: "COMPLETED", comment: s.result });
    return Object.assign(s, { stage: "done" });
  }

  if (s.stage === "awaiting_result" && payment && s.result) {
    if (!confirmed(await resolve(), "ResultSubmitted")) return s;
    await event(taskId, { status: "COMPLETED", comment: s.result });
    log(taskId, "completed; our payment node collects the fee after unlock");
    return Object.assign(s, { stage: "done" });
  }
  return s;
}

async function tick() {
  const tasks = (await core("/v1/tasks?limit=50")) as unknown as {
    id: string;
    status: string;
    description: string | null;
    name: string;
    coworkerId: string;
  }[];
  for (const t of tasks.filter((t) => t.coworkerId === COWORKER_ID)) {
    let s = states[t.id];
    if (!s && t.status === "READY") {
      await event(t.id, { status: "RUNNING" });
      s = states[t.id] = { stage: "started", input: `${t.name}\n${t.description ?? ""}`.trim() };
      save();
      log(t.id, "started");
    }
    if (!s || s.stage === "done" || s.stage === "failed") continue;
    try {
      const before = s.stage;
      await advance(t.id, s);
      if (s.stage !== before) log(t.id, `${before} → ${s.stage}${s.note ? ` (${s.note})` : ""}`);
    } catch (error) {
      log(t.id, `blocked: ${String(error).slice(0, 300)}`);
    }
    save();
  }
}

console.log(
  `[coworker] Simpuru Shopper ${COWORKER_ID} as ${SHOPPER.sellerAddress.slice(0, 20)}…, paid Tasks ${MPS ? "on" : "off"}`,
);
for (;;) {
  await tick().catch((e) => console.error(`[coworker] poll failed: ${String(e).slice(0, 300)}`));
  await Bun.sleep(10_000);
}
