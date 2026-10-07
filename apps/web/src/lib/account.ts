import type { DeliveryMode } from "@simpuru/core";
import { API_BASE, ApiError, type ListingView } from "@/lib/api";
import type { PurchaseView } from "@/lib/purchases";

/** `GET /me` (spec #86): the signed-in account. Lovelace amounts are strings. */
export interface Me {
  owner: string;
  wallet: { address: string; balanceLovelace: string };
  limits: {
    maxPerPaymentLovelace: string;
    dailyBudgetLovelace: string;
    spentTodayLovelace: string;
  };
  purchases: PurchaseView[];
  listings: ListingView[];
  sales: number;
  sellerReputation?: { score: number; basis: number };
}

export interface Session {
  token: string;
  expiresAt: number;
  owner: string;
}

const STORAGE_KEY = "simpuru.session";

// Storage can be blocked (private mode, previews); then the session lives for this tab only.
export function loadSession(): Session | null {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Session | null;
    return s && s.expiresAt > Date.now() ? s : null;
  } catch {
    return null;
  }
}
export function saveSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/** Thrown when the API says the session is gone, so the provider can sign out. */
export class SignedOut extends ApiError {}

/** A call to the API with the session token. A 401 becomes `SignedOut`. */
export async function authFetch(token: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 401) throw new SignedOut(401, "Your session ended. Sign in again.");
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, data.error ?? `Request failed (${res.status})`);
  }
  return res;
}

export const fetchMe = async (token: string) =>
  (await (await authFetch(token, "/me")).json()) as Me;

export async function signInChallenge(addressHex: string) {
  const res = await fetch(`${API_BASE}/auth/challenge`, {
    method: "POST",
    headers: { "content-type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ address: addressHex }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    owner?: string;
    digest?: string;
    error?: string;
  };
  if (!res.ok || !data.owner || !data.digest)
    throw new ApiError(res.status, data.error ?? "Couldn't start the sign-in");
  return { owner: data.owner, digest: data.digest };
}

export async function signInVerify(owner: string, key: string, signature: string) {
  const res = await fetch(`${API_BASE}/auth/verify`, {
    method: "POST",
    headers: { "content-type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ owner, key, signature }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    token?: string;
    expiresAt?: number;
    error?: string;
  };
  if (!res.ok || !data.token || !data.expiresAt)
    throw new ApiError(res.status, data.error ?? "The wallet signature didn't check out");
  return { token: data.token, expiresAt: data.expiresAt };
}

export const signOutRemote = (token: string) =>
  fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});

export interface BuyResult {
  purchase: PurchaseView | null;
  content: string;
  alreadyOwned: boolean;
}

/** `POST /me/buy`: pays from the Simpuru wallet (20–60 s on chain) and returns the content. */
export const buy = async (token: string, listingId: string, mode: DeliveryMode) =>
  (await (
    await authFetch(token, "/me/buy", { method: "POST", body: JSON.stringify({ listingId, mode }) })
  ).json()) as BuyResult;

export const purchaseContent = async (token: string, purchaseId: string) =>
  (await authFetch(token, `/me/purchases/${encodeURIComponent(purchaseId)}/content`)).text();

export const withdraw = async (token: string) =>
  (await (await authFetch(token, "/me/wallet/withdraw", { method: "POST" })).json()) as {
    tx: string;
    lovelace: string;
  };

export const setAgentLimits = async (
  token: string,
  maxPerPaymentAda: number,
  dailyBudgetAda: number,
) =>
  (await (
    await authFetch(token, "/me/agent-limits", {
      method: "PUT",
      body: JSON.stringify({ maxPerPaymentAda, dailyBudgetAda }),
    })
  ).json()) as { maxPerPaymentLovelace: string; dailyBudgetLovelace: string };

/** The purchase that still entitles this account to a listing's content, if any. */
export const ownedPurchase = (me: Me | null, listingId: string) =>
  me?.purchases.find((p) => p.listingId === listingId && p.status !== "refunded") ?? null;

export const PREPROD_FAUCET = "https://docs.cardano.org/cardano-testnets/tools/faucet";
