import { ArrowUpRight } from "lucide-react";
import { explorerTx, REPO_URL } from "@/lib/links";

/**
 * Every protection path, each with the preprod transaction that proves it. The hashes come from
 * docs/demo.md; change them together.
 */
const PROOFS = [
  {
    path: "Instant",
    what: "An agent pays the seller and gets the prompt in about 30 seconds.",
    tx: "49659f72decf393d04dcb4ad9d3f18f489656b9dce0a078143275dd4448ec89b",
  },
  {
    path: "Delivered",
    what: "Paid into escrow, delivery matched its hash, the seller agent collected on its own.",
    tx: "61eb7ffd37c64c79b68950bde150f31ad761c5f900278ec87ff0e33422e714e9",
  },
  {
    path: "Never arrived",
    what: "The seller posted nothing by the deadline. The watcher refunded the buyer on its own.",
    tx: "9b78922320d2be04be4742a24610eb569f38788421c0d77d57d6628103853091",
  },
  {
    path: "Wrong file",
    what: "The delivery didn't match the listing. The buyer disputed and the arbiter paid it back.",
    tx: "7132086b6142a805e0018458800d4053eae7a865f9f58d1eb924fc6ad1ca3d1b",
  },
];

export default function Proof() {
  return (
    <section id="proof" className="w-full bg-white px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div data-reveal className="mb-12 max-w-3xl">
          <h2 className="mb-4 text-4xl leading-tight font-medium tracking-[-0.03em] text-black md:text-5xl">
            Proven on Cardano preprod.
          </h2>
          <p className="text-xl leading-relaxed text-black/70">
            Each path below is a real transaction. Open it on the explorer.
          </p>
        </div>
        <ul data-reveal-group className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PROOFS.map((p) => (
            <li key={p.tx}>
              <a
                href={explorerTx(p.tx)}
                target="_blank"
                rel="noreferrer"
                className="group flex h-full flex-col justify-between gap-6 rounded-2xl border border-black/10 bg-[#F5F5F5] p-7 transition-colors hover:border-black/30"
              >
                <div>
                  <p className="mb-2 text-sm font-semibold tracking-wide text-black/50 uppercase">
                    {p.path}
                  </p>
                  <p className="text-lg leading-relaxed text-black">{p.what}</p>
                </div>
                <span className="inline-flex items-center gap-2 font-mono text-sm text-black/70 group-hover:text-black">
                  {p.tx.slice(0, 8)}…{p.tx.slice(-6)}
                  <ArrowUpRight aria-hidden className="h-4 w-4" />
                </span>
              </a>
            </li>
          ))}
        </ul>
        <a
          href={`${REPO_URL}/blob/main/docs/demo.md`}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
        >
          Every receipt, with timings
          <ArrowUpRight aria-hidden className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
