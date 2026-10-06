import { Check, Minus, ShieldCheck, Zap } from "lucide-react";

type Row = { label: string; instant: string; protected: string };

/**
 * The two payment paths the API offers in every 402 (apps/api): `default`
 * (instant) and `masumi` (protected). Numbers follow the preprod setup in
 * contracts/README.md and apps/agent/README.md; keep them in step.
 */
const ROWS: Row[] = [
  {
    label: "Where the money goes",
    instant: "Straight to the seller",
    protected: "Held until the prompt arrives",
  },
  {
    label: "When you get the prompt",
    instant: "Right away",
    protected: "As soon as the seller delivers",
  },
  {
    label: "If nothing arrives",
    instant: "The money is gone",
    protected: "Refunded on its own after the deadline",
  },
  {
    label: "If it is the wrong prompt",
    instant: "The money is gone",
    protected: "Your agent disputes it and a referee decides",
  },
  {
    label: "When the seller is paid",
    instant: "Immediately",
    protected: "After the waiting period, if nobody objects",
  },
  {
    label: "Best for",
    instant: "Cheap things you would not chase",
    protected: "Anything you would want back",
  },
];

function PathCard({ kind }: { kind: "instant" | "protected" }) {
  const isProtected = kind === "protected";
  const Icon = isProtected ? ShieldCheck : Zap;

  return (
    <div
      className={`flex flex-col rounded-3xl p-6 sm:p-8 ${
        isProtected
          ? "bg-[#141414] text-[#F4F2EF]"
          : "border border-gray-200 bg-white text-[#141414]"
      }`}
    >
      <div className="mb-6 flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            isProtected ? "bg-white text-black" : "bg-black text-white"
          }`}
        >
          <Icon aria-hidden className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-xl font-medium tracking-tight">
            {isProtected ? "Protected" : "Instant"}
          </h3>
          <p className={`text-sm ${isProtected ? "text-white/60" : "text-gray-500"}`}>
            {isProtected ? "The default for agents" : "Pay and go"}
          </p>
        </div>
      </div>

      <dl className="flex flex-col">
        {ROWS.map((row) => {
          const value = isProtected ? row.protected : row.instant;
          const good = isProtected || row.instant !== "The money is gone";
          return (
            <div
              key={row.label}
              className={`flex gap-3 border-t py-3.5 ${
                isProtected ? "border-white/10" : "border-gray-100"
              }`}
            >
              {good ? (
                <Check
                  aria-hidden
                  className={`mt-0.5 h-4 w-4 shrink-0 ${isProtected ? "text-emerald-300" : "text-gray-400"}`}
                />
              ) : (
                <Minus aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
              )}
              <div>
                <dt
                  className={`text-xs tracking-wide uppercase ${
                    isProtected ? "text-white/45" : "text-gray-400"
                  }`}
                >
                  {row.label}
                </dt>
                <dd className="mt-0.5 text-[15px]">{value}</dd>
              </div>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

export default function InstantVsProtected() {
  return (
    <section id="instant-vs-protected" className="w-full bg-[#F0F1F3] px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 text-xs font-medium tracking-widest text-gray-500 uppercase">
          Two ways to pay
        </p>
        <h2 className="mb-4 max-w-3xl text-3xl leading-tight font-normal tracking-tight sm:text-4xl md:text-5xl">
          Instant, or protected
        </h2>
        <p className="mb-12 max-w-2xl text-base text-gray-600 sm:text-lg">
          Every listing offers both. Instant is the plain payment you know. Protected waits a little
          longer and costs the seller a small fee, and in return you never pay for something you did
          not get.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PathCard kind="instant" />
          <PathCard kind="protected" />
        </div>

        <p className="mt-6 max-w-2xl text-sm text-gray-500">
          Protected payments are held by the Masumi escrow contract on Cardano. The seller pays
          about 1.35 tADA in network fees per protected sale, so it makes most sense from around 5
          tADA up.
        </p>
      </div>
    </section>
  );
}
