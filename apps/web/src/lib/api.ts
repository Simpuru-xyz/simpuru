import type { DeliveryMode, Listing } from "@simpuru/core";

/** The only place that knows apps/api paths. */
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4021").replace(
  /\/+$/,
  "",
);

export const ENDPOINTS = {
  listings: () => `${API_BASE}/listings`,
  listing: (id: string) => `${API_BASE}/listings/${encodeURIComponent(id)}`,
  /** x402-paid content. Agents call this; the browser only shows it. */
  unlock: (id: string) => `${API_BASE}/listings/${encodeURIComponent(id)}/unlock`,
} as const;

/** Non-OK response, so callers can branch on status (404 → not found). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new ApiError(res.status, `${res.status} for ${url}`);
  return (await res.json()) as T;
}

export const fetchListings = () => getJson<Listing[]>(ENDPOINTS.listings());
export const fetchListing = (id: string) => getJson<Listing>(ENDPOINTS.listing(id));

export interface NewListing {
  title: string;
  description: string;
  priceLovelace: string;
  sellerAddress: string;
  modes: DeliveryMode[];
  content: string;
}

/** POST /listings. The API's own validation message is surfaced as the error. */
export async function createListing(body: NewListing): Promise<Listing> {
  const res = await fetch(ENDPOINTS.listings(), {
    method: "POST",
    headers: { "content-type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Listing & { error?: string };
  if (!res.ok) throw new ApiError(res.status, data.error ?? `listing failed (${res.status})`);
  return data;
}

/** Mirrors apps/api listings.ts, so a mistake is caught before the round trip. */
export const RULES = {
  title: 120,
  description: 2000,
  contentBytes: 1024 * 1024,
  minAdaInstant: 1,
  minAdaProtected: 5,
  /** API: priceLovelace is at most 16 digits. */
  maxLovelace: BigInt("9999999999999999"),
  address: /^addr_test1[0-9a-z]{50,110}$/,
} as const;

/** "6.5" → "6500000". Exact, no float. Null when it is not an ADA amount with ≤ 6 decimals. */
export function adaToLovelace(ada: string): string | null {
  const m = /^(\d+)(?:\.(\d{1,6}))?$/.exec(ada.trim());
  if (!m) return null;
  const lovelace =
    BigInt(m[1] ?? "0") * BigInt(1_000_000) + BigInt((m[2] ?? "").padEnd(6, "0") || "0");
  return lovelace > BigInt(0) && lovelace <= RULES.maxLovelace ? lovelace.toString() : null;
}

/** Lovelace string → ADA string, exact (no float), trailing zeros dropped. "6500000" → "6.5". */
export function formatAda(lovelace: string) {
  const n = BigInt(lovelace);
  const perAda = BigInt(1_000_000);
  const whole = n / perAda;
  const frac = (n % perAda).toString().padStart(6, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole.toString();
}

/** `addr_test1qx…k9z2` style shortening for addresses and hashes. */
export const shorten = (value: string, head = 10, tail = 6) =>
  value.length <= head + tail + 1 ? value : `${value.slice(0, head)}…${value.slice(-tail)}`;
