import { ArrowUpRight } from "lucide-react";
import { explorerTx } from "@/lib/links";

/**
 * Every protection path, step by step, each step linked to the preprod transaction that proves it.
 * The hashes and timings come from docs/demo.md and the README; change them together.
 *
 * Layout after the MotionSites "Bento Grid Stats" section (a six-column bento with one large
 * figure per card). Card headings follow the MotionSites "Axle Journey" stat cards: a two-line
 * title, then a row of status dots, one per step (filled = it happened on chain, ring = nothing
 * was posted). One accent for every card; the dots carry the difference. The tall card plays the
 * clip from the MotionSites "Halo Use Case" section, kept in public/media.
 */
type Step = { label: string; tx?: string };
type Path = {
  title: [string, string];
  stat: string;
  statNote: string;
  line: string;
  steps: Step[];
};

const PATHS: Path[] = [
  {
    title: ["Instant", "purchase"],
    stat: "30.5 s",
    statNote: "pay to content",
    line: "The agent pays the seller and gets the prompt.",
    steps: [
      {
        label: "Paid the seller, 2 tADA",
        tx: "49659f72decf393d04dcb4ad9d3f18f489656b9dce0a078143275dd4448ec89b",
      },
      {
        label: "Same through MCP, in 17 s",
        tx: "37edbd55bc8ba8f19ba540e34cb2645c945873f39a3d4bcdb7a7e3ec2abfc565",
      },
    ],
  },
  {
    title: ["Delivered", "seller paid"],
    stat: "~31 min",
    statNote: "to the seller's payout",
    line: "The delivery matched its hash. The seller agent collected on its own.",
    steps: [
      {
        label: "Locked in escrow, 5 tADA",
        tx: "50a6adc66d0451fc2ca1709b9bd518a862108d2dc5b2532098085ab2dc9a29fd",
      },
      {
        label: "Result posted",
        tx: "11e25013f909aaea9e306adcf410c70980a02d3a60b2de6af45573d314a5968d",
      },
      {
        label: "Seller paid",
        tx: "61eb7ffd37c64c79b68950bde150f31ad761c5f900278ec87ff0e33422e714e9",
      },
    ],
  },
  {
    title: ["Never", "arrived"],
    stat: "~16 min",
    statNote: "to the refund",
    line: "Nothing came by the deadline. The watcher refunded the buyer on its own.",
    steps: [
      {
        label: "Locked in escrow",
        tx: "8c6d1572790cfbdd152f7ac1bc84cdfc89b3fe6e850506b9eb18fd4ebd220259",
      },
      { label: "Deadline passed, no result" },
      {
        label: "Buyer refunded",
        tx: "9b78922320d2be04be4742a24610eb569f38788421c0d77d57d6628103853091",
      },
    ],
  },
  {
    title: ["Wrong", "file"],
    stat: "~46 min",
    statNote: "to the arbiter's payout",
    line: "The file didn't match the listing. The arbiter paid the buyer back.",
    steps: [
      {
        label: "Locked in escrow",
        tx: "d7485072b936998df2cafe22fb003731ac8396f9f7e91fe7d4244dd62ff0ef7f",
      },
      {
        label: "Wrong file posted",
        tx: "ff8b418a9921a2755793fe7c5dfdc8e3f885239a0a060221170e07919371bba1",
      },
      {
        label: "Buyer disputed",
        tx: "c1e28c303d20e9107c56d423fec7bebfa2c09b1c85d0bf666e607cb8c3abe909",
      },
      {
        label: "Arbiter paid the buyer",
        tx: "7132086b6142a805e0018458800d4053eae7a865f9f58d1eb924fc6ad1ca3d1b",
      },
    ],
  },
];

const short = (h: string) => `${h.slice(0, 8)}…${h.slice(-6)}`;

function PathCard({ p }: { p: Path }) {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-black/[0.07] bg-white p-7 shadow-[0_1px_2px_rgba(20,20,20,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="origin-left scale-x-[1.06] text-lg leading-[1.15] font-medium text-[#141414]">
            {p.title[0]}
            <br />
            <span className="text-black/45">{p.title[1]}</span>
          </h3>
          {/* One dot per step: filled when it happened on chain, a ring when nothing was posted. */}
          <div className="mt-4 flex gap-1" aria-hidden>
            {p.steps.map((s) => (
              <span
                key={s.label}
                className={`grid h-5 w-5 place-items-center rounded-full ${s.tx ? "bg-[#7b68d4]" : "border border-black/25"}`}
              >
                <span className={`h-1 w-1 rounded-full ${s.tx ? "bg-white" : "bg-black/30"}`} />
              </span>
            ))}
          </div>
        </div>
        <span className="text-right">
          <span className="block text-3xl leading-none font-light tracking-tight text-[#141414] sm:text-4xl">
            {p.stat}
          </span>
          <span className="mt-1 block text-xs text-black/50">{p.statNote}</span>
        </span>
      </div>
      <p className="mt-5 max-w-sm text-base leading-relaxed text-black/70">{p.line}</p>

      <ol className="mt-auto pt-7">
        {p.steps.map((s, i) => {
          const last = i === p.steps.length - 1;
          return (
            <li key={s.label} className="relative flex gap-3 pb-4 last:pb-0">
              {!last && (
                <span aria-hidden className="absolute top-3 left-[5px] h-full w-px bg-black/12" />
              )}
              <span
                aria-hidden
                className={`relative mt-1.5 h-3 w-3 shrink-0 rounded-full ${s.tx ? "bg-[#141414]" : "border border-black/30 bg-white"}`}
              />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm text-[#141414]">{s.label}</span>
                {s.tx ? (
                  <a
                    href={explorerTx(s.tx)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-fit items-center gap-1 font-mono text-xs text-black/55 transition-colors hover:text-black"
                  >
                    {short(s.tx)}
                    <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span className="font-mono text-xs text-black/35">no tx</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function Proof() {
  return (
    <section id="proof" className="w-full bg-[#F5F5F5] px-4 py-16 sm:px-6 sm:py-24">
      <div data-reveal-group className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-6">
        <div className="flex flex-col justify-end pr-4 pb-2 md:col-span-2">
          <p className="mb-4 text-sm tracking-[0.15em] text-black/50 uppercase">Proof</p>
          <h2 className="text-4xl leading-[1.1] font-medium tracking-[-0.03em] text-black md:text-5xl">
            Proven on <span className="text-black/45">Cardano preprod.</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-black/60">
            Every step is a real transaction. Open any hash on the explorer.
          </p>
        </div>

        <div className="md:col-span-2">
          <PathCard p={PATHS[0]} />
        </div>
        <div className="md:col-span-2">
          <PathCard p={PATHS[1]} />
        </div>

        <div className="relative min-h-[460px] overflow-hidden rounded-3xl bg-[#f3f2f8] md:col-span-2">
          <video
            className="absolute inset-0 h-full w-full object-cover object-bottom"
            autoPlay
            loop
            muted
            playsInline
            poster="/media/proof.jpg"
            aria-hidden
          >
            <source src="/media/proof.mp4" type="video/mp4" />
          </video>
          {/* Text sits at the top, on the sky; the temple stays visible at the bottom. */}
          <div className="relative z-10 p-7">
            <span className="block text-sm tracking-[0.15em] text-[#2b2644]/70 uppercase">
              Settled on chain
            </span>
            <span className="mt-6 block text-6xl leading-none font-light tracking-tight text-[#2b2644]">
              4 / 4
            </span>
            <span className="mt-3 block max-w-[16rem] text-sm leading-snug text-[#2b2644]/75">
              paths settled with nobody watching. The rules decide, not trust.
            </span>
          </div>
        </div>

        <div className="md:col-span-2">
          <PathCard p={PATHS[2]} />
        </div>
        <div className="md:col-span-2">
          <PathCard p={PATHS[3]} />
        </div>
      </div>
    </section>
  );
}
