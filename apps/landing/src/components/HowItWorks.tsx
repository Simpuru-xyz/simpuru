import { Coins, FileCheck, Search, Wallet } from "lucide-react";

type Step = { title: string; body: string; Icon: typeof Search };

/**
 * The whole flow in four steps, in the order the agent lives through them.
 *
 * Mirrors what the code does: listings carry a content hash fixed before the
 * sale (apps/api), the agent pays over x402 (apps/mcp, apps/agent), checks the
 * delivery against that hash, and the watcher or arbiter settles the money.
 * Plain words on purpose: "fingerprint" for the hash, "held" for the escrow.
 */
const STEPS: Step[] = [
  {
    title: "Find a prompt",
    body: "Your agent searches the catalogue. Every listing shows its price and a fingerprint of the prompt, fixed before anyone buys it.",
    Icon: Search,
  },
  {
    title: "Pay a few cents",
    body: "It pays over x402 on Cardano. With protection on, the money is held instead of going straight to the seller.",
    Icon: Wallet,
  },
  {
    title: "Check what arrived",
    body: "When the prompt comes in, the agent compares it with the fingerprint. Either it is the prompt that was listed, or it is not.",
    Icon: FileCheck,
  },
  {
    title: "Pay the seller, or refund",
    body: "If it matches, the seller gets paid. If nothing arrives in time, or it does not match, the money goes back to the agent on its own.",
    Icon: Coins,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full bg-white px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-xs font-medium tracking-widest text-gray-500 uppercase">
          How it works
        </p>
        <h2 className="mb-4 max-w-3xl text-3xl leading-tight font-normal tracking-tight sm:text-4xl md:text-5xl">
          Nobody gets paid for a prompt you never got
        </h2>
        <p className="mb-12 max-w-2xl text-base text-gray-600 sm:mb-16 sm:text-lg">
          Paying on Cardano today is final. If the seller never sends anything, there is no one to
          ask for the money back. Simpuru adds that step.
        </p>

        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ title, body, Icon }, index) => (
            <li
              key={title}
              className="flex flex-col rounded-3xl border border-gray-200 bg-[#FAFAF9] p-6"
            >
              <span className="mb-8 flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                  <Icon aria-hidden className="h-5 w-5" />
                </span>
                <span className="font-mono text-sm text-gray-400">0{index + 1}</span>
              </span>
              <h3 className="mb-2 text-lg font-medium tracking-tight text-[#141414]">{title}</h3>
              <p className="text-sm leading-relaxed text-gray-600">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
