"use client";

import type { DeliveryMode, Listing } from "@simpuru/core";
import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import CopyButton from "@/components/CopyButton";
import ModeBadge from "@/components/ModeBadge";
import { adaToLovelace, createListing, RULES } from "@/lib/api";

const field =
  "w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none";

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <span className="flex items-baseline justify-between gap-3">
      <span className="text-sm font-medium text-black">{children}</span>
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
    </span>
  );
}

const EMPTY = { title: "", description: "", content: "", priceAda: "" };

/**
 * Create a listing. The API hashes the content and returns the commitment;
 * we show that hash back so the seller sees exactly what buyers will check.
 */
export default function CreateListingForm({
  sellerAddress,
  onCreated,
}: {
  sellerAddress: string;
  onCreated: (listing: Listing) => void;
}) {
  const [form, setForm] = useState(EMPTY);
  const [modes, setModes] = useState<DeliveryMode[]>(["instant", "protected"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Listing | null>(null);

  // Any edit clears the last submit error, so it never outlives the mistake it was about.
  const set = (key: keyof typeof EMPTY) => (value: string) => {
    setError("");
    setForm((current) => ({ ...current, [key]: value }));
  };
  const toggle = (mode: DeliveryMode) => {
    setError("");
    setModes((current) =>
      current.includes(mode) ? current.filter((m) => m !== mode) : [...current, mode],
    );
  };

  const minAda = modes.includes("protected") ? RULES.minAdaProtected : RULES.minAdaInstant;
  const lovelace = adaToLovelace(form.priceAda);
  const contentBytes = new TextEncoder().encode(form.content).length;

  const problem = (() => {
    if (!RULES.address.test(sellerAddress)) return "Set a preprod seller address first.";
    if (form.title && !form.title.trim()) return "Title: not only spaces.";
    if (form.description && !form.description.trim()) return "Description: not only spaces.";
    if (modes.length === 0) return "Pick at least one delivery mode.";
    if (form.priceAda && !lovelace)
      return "Price: an ADA amount with up to 6 decimals, below 10 billion ADA.";
    if (lovelace && BigInt(lovelace) < BigInt(minAda * 1_000_000))
      return `Price: at least ${minAda} ADA for these modes.`;
    if (contentBytes > RULES.contentBytes) return "Content: max 1 MiB.";
    return "";
  })();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (problem || !lovelace) {
      setError(problem || "Set a price.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const listing = await createListing({
        title: form.title.trim(),
        description: form.description.trim(),
        priceLovelace: lovelace,
        sellerAddress,
        modes,
        content: form.content,
      });
      setCreated(listing);
      setForm(EMPTY);
      onCreated(listing);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Listing failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {created && (
        <div
          role="status"
          className="animate-fade-in-up space-y-3 rounded-2xl border border-black bg-white p-5"
        >
          <p className="inline-flex items-center gap-2 text-sm font-medium text-black">
            <Check aria-hidden className="h-4 w-4" />
            Listed: {created.title}
          </p>
          <div className="space-y-1.5">
            <span className="text-xs text-gray-500">Committed content hash (SHA-256)</span>
            <div className="flex items-center justify-between gap-3">
              <code className="min-w-0 truncate font-mono text-sm text-black">
                {created.contentHash}
              </code>
              <span className="shrink-0">
                <CopyButton text={created.contentHash} label="content hash" />
              </span>
            </div>
            <span className="block text-xs text-gray-500">
              Buyers recompute this from what you deliver. Any other bytes are a mismatch.
            </span>
          </div>
          <Link
            href={`/listings/${created.id}`}
            className="inline-block text-sm font-medium text-black underline underline-offset-4"
          >
            View the listing
          </Link>
        </div>
      )}

      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-gray-200 p-5 sm:p-6">
        <label className="block space-y-1.5">
          <Label hint={`${form.title.length}/${RULES.title}`}>Title</Label>
          <input
            required
            maxLength={RULES.title}
            value={form.title}
            onChange={(e) => set("title")(e.target.value)}
            placeholder="Sample dataset: 100 synthetic shop orders (CSV)"
            className={field}
          />
        </label>

        <label className="block space-y-1.5">
          <Label hint={`${form.description.length}/${RULES.description}`}>
            Description, public
          </Label>
          <textarea
            required
            rows={2}
            maxLength={RULES.description}
            value={form.description}
            onChange={(e) => set("description")(e.target.value)}
            placeholder="What a buyer gets, in a sentence or two."
            className={field}
          />
        </label>

        <label className="block space-y-1.5">
          <Label hint={`${contentBytes.toLocaleString("en-US")} bytes`}>The content itself</Label>
          <textarea
            required
            rows={8}
            value={form.content}
            onChange={(e) => set("content")(e.target.value)}
            placeholder="The exact bytes the buyer receives. Nobody sees this until they pay."
            className={`${field} font-mono text-xs`}
          />
          <span className="block text-xs text-gray-500">
            Hashed when you list, so a buyer can prove the bytes they got are the bytes you sold.
          </span>
        </label>

        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-sm font-medium text-black">Delivery modes</legend>
          <div className="flex flex-wrap gap-2">
            {(["instant", "protected"] as const).map((mode) => (
              <label
                key={mode}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-black ${
                  modes.includes(mode) ? "border-black" : "border-gray-300 opacity-60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={modes.includes(mode)}
                  onChange={() => toggle(mode)}
                  className="sr-only"
                />
                <ModeBadge mode={mode} />
                <span className="text-gray-600">
                  {mode === "instant"
                    ? `from ${RULES.minAdaInstant} ADA`
                    : `from ${RULES.minAdaProtected} ADA`}
                </span>
              </label>
            ))}
          </div>
          <span className="block text-xs text-gray-500">
            Protected costs you about 1.35 tADA in escrow fees per sale, so it starts at 5 ADA.
          </span>
        </fieldset>

        <label className="block space-y-1.5">
          <Label
            hint={lovelace ? `${BigInt(lovelace).toLocaleString("en-US")} lovelace` : undefined}
          >
            Price in ADA
          </Label>
          <input
            required
            inputMode="decimal"
            value={form.priceAda}
            onChange={(e) => set("priceAda")(e.target.value)}
            placeholder={String(minAda)}
            className={field}
          />
        </label>

        {(error || problem) && (form.title || form.priceAda || error) && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800"
          >
            {error || problem}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
        >
          {busy && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
          {busy ? "Listing…" : "List it"}
        </button>
      </form>
    </div>
  );
}
