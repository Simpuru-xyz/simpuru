import type { Listing } from "@simpuru/core";

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
