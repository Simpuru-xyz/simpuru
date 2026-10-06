"use client";

import { useRef, useState } from "react";
import CopyButton from "@/components/CopyButton";
import { MCP_DOCS_URL, MCP_URL } from "@/lib/links";

/**
 * Agent onboarding: the landing section where a visitor with an agent copies
 * one block and is wired into the catalogue.
 *
 * The MCP server (apps/mcp) exposes `search_listings` and `get_listing` for
 * free, `buy_listing` paid over x402, and `get_purchase_status` for the escrow
 * state. The buyer CLI (apps/agent) is the same purchase with a spend budget
 * enforced before anything is signed.
 *
 * Tabs follow the WAI-ARIA tabs pattern: roving tabindex, arrow-key navigation
 * with selection following focus, labelled panels. The copy control keeps its
 * named states and aria-live region.
 */

export type OnboardingTarget = {
  id: string;
  label: string;
  intro: string;
  snippet: string;
  note: string;
};

export const ONBOARDING_TARGETS: OnboardingTarget[] = [
  {
    id: "claude-code",
    label: "Claude Code",
    intro: "One command. The server is remote, so there is nothing to install.",
    snippet: `claude mcp add --transport http simpuru ${MCP_URL}`,
    note: "Then ask: “search simpuru for a landing page prompt and buy it, protected”. The agent can check the escrow state at any time with get_purchase_status.",
  },
  {
    id: "mcp-json",
    label: "Cursor · Windsurf · Claude Desktop",
    intro: "Any MCP client that takes a URL. Paste this into its MCP config.",
    snippet: `{
  "mcpServers": {
    "simpuru": {
      "type": "http",
      "url": "${MCP_URL}"
    }
  }
}`,
    note: "Config file names differ per editor, but most accept this shape.",
  },
  {
    id: "buyer-cli",
    label: "Buyer agent CLI",
    intro:
      "The reference buyer. It pays from its own preprod wallet and refuses to sign anything outside its budget.",
    snippet: `# From a clone of the repo, with a funded preprod wallet in .env
bun install
bun run buy <listing-id>

# Before signing it checks:
#   - payTo is our approved escrow deployment
#   - the price is under the per-payment cap
#   - today's total stays under the daily budget`,
    note: "After the purchase the protection watcher keeps running: no result by the deadline means withdrawRefund, a result that fails the hash check means a dispute.",
  },
];

export default function AgentOnboarding() {
  const [activeId, setActiveId] = useState(ONBOARDING_TARGETS[0].id);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const active = ONBOARDING_TARGETS.find((t) => t.id === activeId) ?? ONBOARDING_TARGETS[0];

  // Selection follows focus (WAI-ARIA tabs, automatic activation).
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const count = ONBOARDING_TARGETS.length;
    const index = ONBOARDING_TARGETS.findIndex((t) => t.id === activeId);
    let next: number;
    switch (event.key) {
      case "ArrowRight":
        next = (index + 1) % count;
        break;
      case "ArrowLeft":
        next = (index - 1 + count) % count;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const target = ONBOARDING_TARGETS[next];
    setActiveId(target.id);
    tabRefs.current[target.id]?.focus();
  };

  return (
    <section
      id="for-agents"
      className="relative z-20 mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24"
    >
      <p className="mb-3 text-xs font-medium tracking-widest text-gray-500 uppercase">For agents</p>
      <h2 className="mb-4 text-3xl leading-tight font-normal tracking-tight sm:text-4xl md:text-5xl">
        Connect your agent in one paste
      </h2>
      <p className="mb-3 max-w-2xl text-base text-gray-600 sm:text-lg">
        Every listing commits to a hash of its content before it is sold, so the agent can prove
        whether what arrived is what it paid for. Pay instantly for small things, or through escrow
        when it matters.
      </p>
      <p className="mb-8 max-w-2xl text-sm text-gray-500">
        Everything runs on Cardano preprod with test ADA. Instant purchases settle straight to the
        seller; protected ones lock in an escrow script until the seller is paid or the buyer is
        refunded.
      </p>

      <div
        role="tablist"
        aria-label="Choose your agent"
        onKeyDown={onKeyDown}
        className="mb-6 flex flex-wrap gap-2"
      >
        {ONBOARDING_TARGETS.map((target) => {
          const selected = target.id === activeId;
          return (
            <button
              key={target.id}
              ref={(el) => {
                tabRefs.current[target.id] = el;
              }}
              type="button"
              role="tab"
              id={`agent-tab-${target.id}`}
              aria-selected={selected}
              aria-controls={`agent-panel-${target.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveId(target.id)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none ${
                selected
                  ? "border-black bg-black text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-500 hover:text-black"
              }`}
            >
              {target.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`agent-panel-${active.id}`}
        aria-labelledby={`agent-tab-${active.id}`}
      >
        <p className="mb-4 max-w-2xl text-sm text-gray-600">{active.intro}</p>

        <div className="overflow-hidden rounded-2xl bg-gray-950">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-2.5">
            <span className="truncate text-xs text-gray-400">{active.label}</span>
            <CopyButton text={active.snippet} label={active.label} />
          </div>
          <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-gray-100">
            <code>{active.snippet}</code>
          </pre>
        </div>

        <p className="mt-3 max-w-2xl text-xs text-gray-500">{active.note}</p>

        <a
          href={MCP_DOCS_URL}
          className="mt-4 inline-block text-sm text-gray-700 underline underline-offset-4 transition-colors hover:text-black"
        >
          MCP setup on GitHub
        </a>
      </div>
    </section>
  );
}
