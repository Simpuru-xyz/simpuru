"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import CopyButton from "@/components/CopyButton";
import { useSession } from "@/components/SessionProvider";
import { setAgentLimits } from "@/lib/account";
import { formatAda } from "@/lib/api";

const MCP_URL = "https://api.simpuru.xyz/mcp";

const CLIENTS = {
  code: {
    label: "Claude Code",
    steps: [
      "Run this in your terminal:",
      "A browser page asks you to approve with your wallet. Done.",
    ],
    snippet: `claude mcp add --transport http simpuru ${MCP_URL}`,
  },
  desktop: {
    label: "Claude Desktop",
    steps: [
      "Settings → Connectors → Add custom connector.",
      "Paste this URL, then Connect and approve with your wallet:",
    ],
    snippet: MCP_URL,
  },
  cursor: {
    label: "Cursor",
    steps: [
      "Add this to your MCP settings (mcp.json):",
      "Cursor opens a page to approve with your wallet.",
    ],
    snippet: `{"mcpServers":{"simpuru":{"url":"${MCP_URL}"}}}`,
  },
} as const;
type Client = keyof typeof CLIENTS;

const EXAMPLES = [
  "Find a hero section prompt on Simpuru under 8 tADA and buy it with protection.",
  "Search Simpuru for a pricing section prompt and show me its preview before buying.",
  "Buy the Aurora SaaS hero prompt on Simpuru, then build it in this repo.",
  "What have I bought on Simpuru, and is any protected purchase still waiting on the seller?",
];

const field =
  "w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-black focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none";

/** Agent limits, editable (spec #86, J6: PUT /me/agent-limits). */
function LimitsCard() {
  const { session, me, openSignIn, guard, refresh } = useSession();
  const [editing, setEditing] = useState(false);
  const [per, setPer] = useState("");
  const [day, setDay] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!session)
    return (
      <section className="space-y-3 rounded-2xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold">Spending limits</h2>
        <p className="text-sm text-gray-600">
          Your agents pay from your Simpuru wallet, never more than the limits you set here. New
          accounts start at 10 tADA per purchase and 30 tADA a day.
        </p>
        <button
          type="button"
          onClick={openSignIn}
          className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Sign in to set your limits
        </button>
      </section>
    );
  if (!me) return <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />;

  const l = me.limits;
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = Number(per);
    const d = Number(day);
    if (!(Number.isInteger(p) && Number.isInteger(d) && p >= 1 && p <= 100 && d >= p && d <= 500)) {
      setError("Whole tADA: 1–100 per purchase, and a daily budget of at least that, up to 500.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await guard((t) => setAgentLimits(t, p, d));
      await refresh();
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Spending limits</h2>
        {!editing && (
          <button
            type="button"
            onClick={() => {
              setPer(formatAda(l.maxPerPaymentLovelace));
              setDay(formatAda(l.dailyBudgetLovelace));
              setEditing(true);
            }}
            className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium hover:border-black"
          >
            Edit
          </button>
        )}
      </div>
      {editing ? (
        <form onSubmit={save} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Max per purchase (tADA)</span>
              <input
                inputMode="numeric"
                value={per}
                onChange={(e) => setPer(e.target.value)}
                className={field}
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Daily budget (tADA)</span>
              <input
                inputMode="numeric"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className={field}
              />
            </label>
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800"
            >
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {busy && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
              Save limits
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:border-black"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <dl className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-xs text-gray-500">Max per purchase</dt>
            <dd className="text-xl font-semibold">{formatAda(l.maxPerPaymentLovelace)} tADA</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Daily budget</dt>
            <dd className="text-xl font-semibold">{formatAda(l.dailyBudgetLovelace)} tADA</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Spent today</dt>
            <dd className="text-xl font-semibold">{formatAda(l.spentTodayLovelace)} tADA</dd>
          </div>
        </dl>
      )}
      <p className="text-sm text-gray-600">
        Your agents spend from your Simpuru wallet, only within these limits. Protected purchases
        are refunded automatically if the seller doesn&apos;t deliver.
      </p>
    </section>
  );
}

/** Connect an agent (spec #86, J6). Everything is on this page; no external links needed. */
export default function AgentsPage() {
  const [client, setClient] = useState<Client>("code");
  const c = CLIENTS[client];
  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-3xl space-y-8 px-4 pb-24 sm:px-6">
        <header className="pt-8">
          <h1 className="mb-3 text-3xl font-normal tracking-tight sm:text-4xl">Connect an agent</h1>
          <p className="text-base text-gray-600">
            Give Claude or Cursor the Simpuru MCP server and it can search the catalogue, buy
            prompts over x402 and check deliveries for you.
          </p>
        </header>

        <LimitsCard />

        <section className="space-y-4 rounded-2xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold">Set it up</h2>
          <div role="tablist" aria-label="Agent" className="flex gap-1 border-b border-gray-200">
            {(Object.keys(CLIENTS) as Client[]).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={client === k}
                onClick={() => setClient(k)}
                className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
                  client === k
                    ? "border-black font-medium text-black"
                    : "border-transparent text-gray-500 hover:text-black"
                }`}
              >
                {CLIENTS[k].label}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="space-y-3 text-sm text-gray-700">
            <p>{c.steps[0]}</p>
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
              <code className="min-w-0 flex-1 overflow-x-auto font-mono text-xs whitespace-nowrap">
                {c.snippet}
              </code>
              <span className="shrink-0">
                <CopyButton text={c.snippet} label={`${c.label} setup`} />
              </span>
            </div>
            <p>{c.steps[1]}</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Try asking</h2>
          <ul className="space-y-2">
            {EXAMPLES.map((e) => (
              <li
                key={e}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-3 text-sm"
              >
                <span>{e}</span>
                <span className="shrink-0">
                  <CopyButton text={e} label="prompt" />
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
