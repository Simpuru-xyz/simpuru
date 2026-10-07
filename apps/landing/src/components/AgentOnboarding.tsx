"use client";

import { ArrowRight } from "lucide-react";
import { useRef, useState } from "react";
import CopyButton from "@/components/CopyButton";
import { AGENTS_URL } from "@/lib/links";

/**
 * Connect your agent: one card, one command to copy.
 *
 * Layout follows the MotionSites "Community CTA" card (video background, copy
 * on the left, a pill row where the form was). The commands follow the spec in
 * #86 (J6) and the app's /agents page; change them together. Agents sign in to
 * the hosted MCP with the user's wallet and spend from their Simpuru wallet,
 * within the limits set on /agents.
 *
 * Tabs follow the WAI-ARIA tabs pattern: roving tabindex, arrow keys, labelled
 * panel.
 */

/** `hint` is one line under the command: where it goes, in the client's own words. */
export type OnboardingTarget = { id: string; label: string; command: string; hint: string };

export const ONBOARDING_TARGETS: OnboardingTarget[] = [
  {
    id: "claude-code",
    label: "Claude Code",
    command: "claude mcp add --transport http simpuru https://api.simpuru.xyz/mcp",
    hint: "Run it, then approve with your wallet in the browser page that opens.",
  },
  {
    id: "claude-desktop",
    label: "Claude Desktop",
    command: "https://api.simpuru.xyz/mcp",
    hint: "Settings → Connectors → Add custom connector, paste this URL, then Connect.",
  },
  {
    id: "cursor",
    label: "Cursor",
    command: `{"mcpServers":{"simpuru":{"url":"https://api.simpuru.xyz/mcp"}}}`,
    hint: "Add it to your MCP config.",
  },
  {
    id: "cli",
    label: "Terminal",
    command: "bun run buy <listingId> protected",
    hint: "The buyer CLI, paying from your own wallet.",
  },
];

export default function AgentOnboarding() {
  const [activeId, setActiveId] = useState(ONBOARDING_TARGETS[0].id);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const active = ONBOARDING_TARGETS.find((t) => t.id === activeId) ?? ONBOARDING_TARGETS[0];

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
    <section id="for-agents" className="w-full bg-white px-4 py-16 sm:px-6 sm:py-24">
      <div
        data-reveal
        className="relative mx-auto min-h-[220px] max-w-6xl overflow-hidden rounded-[28px] border border-[rgba(13,36,72,0.15)] bg-[#d8e5f2]"
      >
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          poster="/media/connect.jpg"
          aria-hidden
        >
          <source src="/media/connect.mp4" type="video/mp4" />
        </video>

        <div className="relative z-10 max-w-2xl p-6 text-[#08063C] sm:p-10 md:p-12">
          <h2 className="mb-3 text-3xl leading-tight font-bold tracking-[-0.015em] sm:text-4xl">
            Connect your agent
          </h2>
          <p className="mb-7 max-w-md text-base leading-relaxed">
            One command. Then your agent can buy prompts on its own.
          </p>

          <div
            role="tablist"
            aria-label="Where your agent runs"
            onKeyDown={onKeyDown}
            className="mb-3 flex flex-wrap gap-2"
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
                  aria-controls="agent-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveId(target.id)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[#08063C] focus-visible:outline-none ${
                    selected
                      ? "bg-[#08063C] text-white"
                      : "bg-white/60 text-[#08063C] hover:bg-white/90"
                  }`}
                >
                  {target.label}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id="agent-panel"
            aria-labelledby={`agent-tab-${active.id}`}
            className="flex items-center gap-2"
          >
            <code className="min-w-0 flex-1 overflow-x-auto rounded-full border border-[rgba(195,210,235,0.75)] bg-white/95 px-4 py-3 font-mono text-[12px] sm:px-5 sm:text-[13px] whitespace-nowrap shadow-[0_1px_5px_rgba(100,110,180,0.07)]">
              {active.command}
            </code>
            <CopyButton text={active.command} label={active.label} tone="light" />
          </div>
          <p className="mt-2.5 px-1 text-sm text-[#08063C]/75">{active.hint}</p>

          <a
            href={AGENTS_URL}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
          >
            Full setup and spending limits
            <ArrowRight aria-hidden className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
