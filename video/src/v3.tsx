// The demo film: a short kinetic opening, then the product on the right and three lines of copy on
// the left, then proof on chain. No narration needed; sound marks every beat.
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  AgentsPage,
  APP_FLOW_FRAMES,
  AppFlow,
  AppWindow,
  APP_BEATS as B,
  LANDING_CLICK,
  LANDING_FRAMES,
  Landing,
} from "./app";
import { AGENT } from "./scenes";
import { C, mono, sans, TX } from "./theme";
import { Terminal, useIn } from "./ui";

export const FPS3 = 30;
const BG = "#f4f4f5";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Sfx = ({ name, at, volume = 0.6 }: { name: string; at: number; volume?: number }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={60}>
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

// ── Opening: one short line per beat, word by word ───────────────────────────

const Line = ({ words, dark, logo }: { words: string[]; dark?: boolean; logo?: boolean }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: dark ? C.night : BG,
        justifyContent: "center",
        alignItems: "center",
        gap: 30,
        flexDirection: "column",
      }}
    >
      {logo ? (
        <Img
          src={staticFile("logo.svg")}
          style={{ width: 96, height: 96, opacity: interpolate(f, [0, 8], [0, 1], clamp) }}
        />
      ) : null}
      <div
        style={{
          display: "flex",
          gap: 26,
          fontFamily: sans,
          fontSize: 104,
          fontWeight: 600,
          letterSpacing: -3.5,
          color: dark ? "#fff" : C.ink,
        }}
      >
        {words.map((w, i) => {
          const p = interpolate(f, [i * 4, i * 4 + 8], [0, 1], clamp);
          return (
            <span
              key={w}
              style={{
                opacity: p,
                transform: `translateY(${(1 - p) * 26}px)`,
                filter: `blur(${(1 - p) * 6}px)`,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** A mechanical counter: each digit rolls, higher digits roll only while the lower one carries. */
const DIGIT_H = 168;
const Odometer = ({ value, digits }: { value: number; digits: number }) => (
  <div
    style={{
      display: "flex",
      alignItems: "flex-start",
      fontFamily: sans,
      fontSize: 160,
      fontWeight: 600,
      letterSpacing: -4,
      fontVariantNumeric: "tabular-nums",
    }}
  >
    <span style={{ lineHeight: `${DIGIT_H}px` }}>$</span>
    {Array.from({ length: digits }, (_, i) => digits - 1 - i).map((k) => {
      const unit = 10 ** k;
      const carry = k === 0 ? 0 : Math.min(1, Math.max(0, (value % unit) - (unit - 1)));
      const pos = k === 0 ? value : Math.floor(value / unit) + carry;
      const show = value >= unit || k === 0;
      return (
        <div key={k} style={{ display: "flex" }}>
          <div style={{ height: DIGIT_H, overflow: "hidden", width: show ? undefined : 0 }}>
            <div style={{ transform: `translateY(${-(pos % 10) * DIGIT_H}px)` }}>
              {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0 "].map((d) => (
                <div key={d} style={{ height: DIGIT_H, lineHeight: `${DIGIT_H}px` }}>
                  {d.trim()}
                </div>
              ))}
            </div>
          </div>
          {k === 3 && show ? <span style={{ lineHeight: `${DIGIT_H}px` }}>,</span> : null}
        </div>
      );
    })}
  </div>
);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PER_MONTH = 99;
const MONTH_FRAMES = 6;
export const SUB_FRAMES = 12 * MONTH_FRAMES + 40;

/** Prompt libraries bill by the month: the bill rolls up a year, for prompts used once. */
const Subscriptions = () => {
  const f = useCurrentFrame();
  const head = interpolate(f, [0, 10], [0, 1], clamp);
  const t = Math.max(0, (f - 8) / MONTH_FRAMES);
  const month = Math.min(
    12,
    Math.floor(t) + Easing.bezier(0.22, 1, 0.36, 1)(Math.min(1, (t % 1) * 1.6)),
  );
  const value = Math.round(PER_MONTH * Math.min(12, month) * 1000) / 1000;
  const current = Math.min(11, Math.floor(t));
  const tail = interpolate(f, [12 * MONTH_FRAMES + 12, 12 * MONTH_FRAMES + 24], [0, 1], clamp);
  return (
    <AbsoluteFill
      style={{
        background: BG,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 34,
        fontFamily: sans,
      }}
    >
      <div
        style={{
          fontSize: 56,
          fontWeight: 600,
          letterSpacing: -1.5,
          color: C.muted,
          opacity: head,
        }}
      >
        Prompt libraries bill you every month.
      </div>
      <Odometer value={value} digits={4} />
      <div style={{ display: "flex", gap: 14 }}>
        {MONTHS.map((m, i) => (
          <div
            key={m}
            style={{
              width: 74,
              padding: "10px 0",
              borderRadius: 12,
              textAlign: "center",
              fontSize: 22,
              fontWeight: 600,
              background: i <= current && t > 0 ? C.ink : "#fff",
              color: i <= current && t > 0 ? "#fff" : "#a1a1aa",
              border: `1px solid ${C.line}`,
            }}
          >
            {m}
          </div>
        ))}
      </div>
      <div
        style={{
          fontSize: 44,
          fontWeight: 600,
          letterSpacing: -1,
          opacity: tail,
          transform: `translateY(${(1 - tail) * 14}px)`,
        }}
      >
        For prompts you used once.
      </div>
    </AbsoluteFill>
  );
};

/** Why it needs a chain: three reasons, one card each. */
const WhyChain = () => {
  const f = useCurrentFrame();
  const head = interpolate(f, [0, 10], [0, 1], clamp);
  const reasons: [string, string, string][] = [
    ["x402", "Pay per prompt in ADA, straight to the creator. No account, no card.", C.ink],
    ["Escrow", "No prompt, money back. Cardano enforces it, not a support desk.", C.violet],
    ["Reputation", "Counted from settled escrows. It can't be bought or faked.", C.green],
  ];
  return (
    <AbsoluteFill
      style={{
        background: BG,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 56,
        fontFamily: sans,
      }}
    >
      <div style={{ fontSize: 76, fontWeight: 600, letterSpacing: -2.5, opacity: head }}>
        Why it runs on Cardano.
      </div>
      <div style={{ display: "flex", gap: 28 }}>
        {reasons.map(([t, b, c], i) => {
          const p = interpolate(f, [10 + i * 18, 22 + i * 18], [0, 1], clamp);
          return (
            <div
              key={t}
              style={{
                width: 470,
                padding: "36px 38px",
                borderRadius: 24,
                background: "#fff",
                border: `1px solid ${C.line}`,
                opacity: p,
                transform: `translateY(${(1 - p) * 30}px)`,
              }}
            >
              <div style={{ width: 52, height: 6, borderRadius: 3, background: c }} />
              <div style={{ fontSize: 46, fontWeight: 600, marginTop: 22, letterSpacing: -1 }}>
                {t}
              </div>
              <div style={{ fontSize: 26, color: C.muted, marginTop: 12, lineHeight: 1.4 }}>
                {b}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

type Act = { len: number; node: ReactNode; words?: string[] };
const ACTS: Act[] = [
  {
    len: 50,
    words: ["Great", "UI", "design", "is", "expensive."],
    node: <Line words={["Great", "UI", "design", "is", "expensive."]} />,
  },
  {
    len: 54,
    words: ["A", "design", "prompt", "gets", "you", "there."],
    node: <Line words={["A", "design", "prompt", "gets", "you", "there."]} />,
  },
  { len: SUB_FRAMES, node: <Subscriptions /> },
  {
    len: 54,
    words: ["Your", "agent", "needs", "one.", "Once."],
    node: <Line dark words={["Your", "agent", "needs", "one.", "Once."]} />,
  },
  { len: 120, node: <WhyChain /> },
  {
    len: 48,
    words: ["This", "is", "Simpuru."],
    node: <Line logo words={["This", "is", "Simpuru."]} />,
  },
];
const starts: number[] = [];
for (let i = 0; i < ACTS.length; i++)
  starts.push(i === 0 ? 0 : (starts[i - 1] as number) + (ACTS[i - 1] as Act).len);
const OPEN_FRAMES = ACTS.reduce((n, a) => n + a.len, 0);
const Opening = () => (
  <AbsoluteFill>
    {ACTS.map((a, i) => (
      <Sequence key={starts[i]} from={starts[i]} durationInFrames={a.len}>
        {a.node}
      </Sequence>
    ))}
    {ACTS.flatMap((a, i) =>
      (a.words ?? []).map((w, j) => ({
        key: `${starts[i]}:${w}`,
        at: (starts[i] as number) + j * 4,
      })),
    ).map((x) => (
      <Sfx key={x.key} name="blip" at={x.at} volume={0.35} />
    ))}
    <Sfx name="swish" at={starts[2] as number} volume={0.5} />
    {MONTHS.map((m, i) => (
      <Sfx key={m} name="tap" at={(starts[2] as number) + 8 + i * MONTH_FRAMES} volume={0.45} />
    ))}
    <Sfx name="thud" at={(starts[2] as number) + 12 * MONTH_FRAMES + 12} volume={0.7} />
    <Sfx name="thud" at={starts[3] as number} volume={0.8} />
    <Sfx name="swish" at={starts[4] as number} volume={0.5} />
    {[10, 28, 46].map((d) => (
      <Sfx key={d} name="tap" at={(starts[4] as number) + d} volume={0.5} />
    ))}
    <Sfx name="chime" at={starts[5] as number} volume={0.5} />
  </AbsoluteFill>
);

// ── Split layout: copy on the left, product on the right ─────────────────────
type Copy = { at: number; to: number; eyebrow: string; title: string; body: string };

const CopyBlock = ({ c, dark }: { c: Copy; dark?: boolean }) => {
  const f = useCurrentFrame();
  const p =
    interpolate(f, [c.at, c.at + 10], [0, 1], clamp) *
    interpolate(f, [c.to - 6, c.to], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: 100,
        top: 0,
        bottom: 0,
        width: 470,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        opacity: p,
        transform: `translateY(${(1 - p) * 16}px)`,
      }}
    >
      <div
        style={{
          fontFamily: mono,
          fontSize: 22,
          letterSpacing: 2,
          color: dark ? "#9b9bb0" : C.muted,
          textTransform: "uppercase",
        }}
      >
        {c.eyebrow}
      </div>
      <div
        style={{
          fontFamily: sans,
          fontSize: 58,
          fontWeight: 600,
          letterSpacing: -2,
          lineHeight: 1.05,
          marginTop: 14,
          color: dark ? "#fff" : C.ink,
        }}
      >
        {c.title}
      </div>
      <div
        style={{
          fontFamily: sans,
          fontSize: 28,
          lineHeight: 1.4,
          marginTop: 18,
          color: dark ? "#b9b9c9" : C.muted,
        }}
      >
        {c.body}
      </div>
    </div>
  );
};

const Split = ({ copy, children, dark }: { copy: Copy[]; children: ReactNode; dark?: boolean }) => (
  <AbsoluteFill style={{ background: dark ? C.night : BG }}>
    {copy.map((c) => (
      <CopyBlock key={c.eyebrow + c.title} c={c} dark={dark} />
    ))}
    <div
      style={{
        position: "absolute",
        right: 70,
        top: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

const WEB_COPY: Copy[] = [
  {
    at: 0,
    to: B.modal,
    eyebrow: "01 Browse",
    title: "Prompts worth buying.",
    body: "Real previews from the creators. Prices in test ADA.",
  },
  {
    at: B.modal,
    to: B.funded,
    eyebrow: "02 Sign in",
    title: "Your wallet is the account.",
    body: "One signature. No funds move.",
  },
  {
    at: B.funded,
    to: B.cardClick,
    eyebrow: "03 Fund",
    title: "A wallet to spend from.",
    body: "Top it up with test ADA.",
  },
  {
    at: B.cardClick,
    to: B.bought + 4,
    eyebrow: "04 Buy",
    title: "Buy with protection.",
    body: "The money waits in escrow.",
  },
  {
    at: B.bought + 4,
    to: B.toTimeline,
    eyebrow: "05 Receive",
    title: "Checked on arrival.",
    body: "It matches the hash the seller committed.",
  },
  {
    at: B.toTimeline,
    to: B.sellNav,
    eyebrow: "06 Track",
    title: "Every step on chain.",
    body: "Locked, posted, seller paid, creator paid. A real sale.",
  },
  {
    at: B.sellNav,
    to: APP_FLOW_FRAMES,
    eyebrow: "07 Sell",
    title: "Anyone can sell.",
    body: "The hash is fixed before anyone pays.",
  },
];

const Web = () => (
  <>
    <Split copy={WEB_COPY}>
      <AppWindow width={1200}>
        <AppFlow />
      </AppWindow>
    </Split>
    {[B.signClick, B.eternl, B.sign, B.cardClick, B.buyClick, B.sellNav, B.publish].map((at) => (
      <Sfx key={at} name="tap" at={at} />
    ))}
    <Sfx name="chime" at={B.funded} />
    <Sfx name="chime" at={B.bought} />
    <Sfx name="chime" at={B.toTimeline + 60} volume={0.45} />
    <Sfx name="chime" at={B.publish + 6} />
    <Sfx name="swish" at={B.listing - 2} volume={0.4} />
    <Sfx name="swish" at={B.toTimeline - 2} volume={0.4} />
    <Sfx name="swish" at={B.sellNav - 2} volume={0.4} />
  </>
);

const AGENT_COPY: Copy[] = [
  {
    at: 0,
    to: 96,
    eyebrow: "08 Agents",
    title: "One command.",
    body: "Your agent gets your Simpuru wallet and your limits.",
  },
  {
    at: 96,
    to: 450,
    eyebrow: "08 Agents",
    title: "It shops on its own.",
    body: "Filters by reputation, checks the listing, buys with protection. Never pays twice.",
  },
];
const AGENTS_FRAMES = 450;
const Agents = () => (
  <>
    <Split copy={AGENT_COPY}>
      <Sequence durationInFrames={96}>
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          <AppWindow width={1200} url="app.simpuru.xyz/agents">
            <AgentsPage />
          </AppWindow>
        </div>
      </Sequence>
      <Sequence from={96}>
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Terminal
            lines={AGENT}
            start={0}
            cps={120}
            width={1200}
            height={640}
            title="claude · Simpuru MCP"
          />
        </div>
      </Sequence>
      <div style={{ width: 1200 }} />
    </Split>
    <Sfx name="tap" at={48} />
    <Sfx name="swish" at={94} volume={0.4} />
  </>
);

// ── Three outcomes, as purchase cards from the app ───────────────────────────
type Step = { label: string; tx: string; tone?: "good" | "bad" | "warn" };
const tone = (t?: Step["tone"]) =>
  t === "good" ? C.green : t === "bad" ? C.red : t === "warn" ? C.amber : C.ink;

const Outcome = ({
  at,
  title,
  badge,
  badgeTone,
  thumb,
  steps,
}: {
  at: number;
  title: string;
  badge: string;
  badgeTone: Step["tone"];
  thumb?: string;
  steps: Step[];
}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 12], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const done = interpolate(
    f,
    [at + 14 + steps.length * 14, at + 24 + steps.length * 14],
    [0, 1],
    clamp,
  );
  return (
    <div
      style={{
        width: 500,
        borderRadius: 24,
        background: "#fff",
        border: `1px solid ${C.line}`,
        overflow: "hidden",
        boxShadow: "0 30px 70px rgba(0,0,0,0.08)",
        opacity: p,
        transform: `translateY(${(1 - p) * 40}px)`,
      }}
    >
      <div style={{ height: 150, background: C.soft, position: "relative", overflow: "hidden" }}>
        {thumb ? (
          thumb.endsWith(".mp4") ? (
            <OffthreadVideo
              src={staticFile(thumb)}
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Img
              src={staticFile(thumb)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: sans,
              fontSize: 64,
              fontWeight: 600,
              color: tone(badgeTone),
              background: `${tone(badgeTone)}14`,
            }}
          >
            {badgeTone === "warn" ? "0 / 1" : "≠"}
          </div>
        )}
      </div>
      <div style={{ padding: "22px 26px 26px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: sans, fontSize: 28, fontWeight: 600 }}>{title}</div>
          <div
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              fontFamily: sans,
              fontSize: 16,
              fontWeight: 600,
              color: "#fff",
              background: tone(badgeTone),
              opacity: done,
              transform: `scale(${0.8 + 0.2 * done})`,
            }}
          >
            {badge}
          </div>
        </div>
        <div style={{ marginTop: 18 }}>
          {steps.map((s, i) => {
            const q = interpolate(f, [at + 14 + i * 14, at + 22 + i * 14], [0, 1], clamp);
            return (
              <div key={s.label} style={{ display: "flex", gap: 16, opacity: q }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      background: tone(s.tone),
                      marginTop: 6,
                    }}
                  />
                  {i < steps.length - 1 ? (
                    <div style={{ width: 2, height: 38, background: C.line }} />
                  ) : null}
                </div>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "space-between",
                    fontFamily: sans,
                    fontSize: 20,
                    paddingBottom: 14,
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{s.label}</span>
                  <span style={{ fontFamily: mono, fontSize: 15, color: C.muted, marginTop: 3 }}>
                    {s.tx ? `${s.tx.slice(0, 8)} ↗` : "deadline"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const PROOF_FRAMES = 240;
const Proof = () => {
  const f = useCurrentFrame();
  const h = interpolate(f, [0, 12], [0, 1], clamp);
  return (
    <AbsoluteFill
      style={{
        background: BG,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 50,
      }}
    >
      <div
        style={{
          fontFamily: sans,
          fontSize: 64,
          fontWeight: 600,
          letterSpacing: -2,
          opacity: h,
          transform: `translateY(${(1 - h) * 16}px)`,
        }}
      >
        Three outcomes. All on chain.
      </div>
      <div style={{ display: "flex", gap: 34, alignItems: "flex-start" }}>
        <Outcome
          at={10}
          title="OYLA"
          badge="Seller paid"
          badgeTone="good"
          thumb="oyla.mp4"
          steps={[
            { label: "Locked", tx: TX.oylaLock },
            { label: "Result posted", tx: TX.oylaResult },
            { label: "Seller paid", tx: TX.oylaWithdraw, tone: "good" },
            { label: "Creator paid", tx: TX.creatorPaid, tone: "good" },
          ]}
        />
        <Outcome
          at={40}
          title="Never delivered"
          badge="Refunded"
          badgeTone="warn"
          steps={[
            {
              label: "Locked",
              tx: "003c3c7f3fb6109dfd6993e51bc15cf69c65f67e1841da8784be84cec61f074c",
            },
            { label: "No result by the deadline", tx: "", tone: "warn" },
            {
              label: "Refunded",
              tx: "39e9af4ee93160e5813128330e6115a659f1e727bd2cc985aa44110be8b1e221",
              tone: "good",
            },
          ]}
        />
        <Outcome
          at={70}
          title="Wrong file"
          badge="Buyer refunded"
          badgeTone="bad"
          steps={[
            { label: "Locked", tx: TX.wrongLock },
            { label: "Hash mismatch", tx: TX.wrongResult, tone: "bad" },
            { label: "Disputed", tx: TX.dispute, tone: "warn" },
            { label: "Arbiter refunds", tx: TX.arbiterRefund, tone: "good" },
          ]}
        />
      </div>
      {[24, 38, 52, 66, 82, 98, 112, 126].map((at) => (
        <Sfx key={at} name="blip" at={at} volume={0.25} />
      ))}
      <Sfx name="chime" at={80} volume={0.4} />
      <Sfx name="chime" at={96} volume={0.4} />
      <Sfx name="chime" at={140} volume={0.4} />
    </AbsoluteFill>
  );
};

// ── Agent to agent: a Task, hired and settled ────────────────────────────────
const TASK_STATES: [number, string, string][] = [
  [0, "Ready", C.muted],
  [40, "Running", C.ink],
  [80, "1 USDM in escrow", C.violet],
  [150, "Completed", C.green],
];
const TaskCard = () => {
  const f = useCurrentFrame();
  const state = [...TASK_STATES].reverse().find(([at]) => f >= at) ?? TASK_STATES[0];
  const reply = interpolate(f, [150, 164], [0, 1], clamp);
  const pay = interpolate(f, [190, 204], [0, 1], clamp);
  return (
    <div style={{ width: 1000, fontFamily: sans }}>
      <div
        style={{
          borderRadius: 24,
          background: "#fff",
          border: `1px solid ${C.line}`,
          padding: "28px 32px",
          boxShadow: "0 30px 70px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: mono, fontSize: 16, color: C.muted }}>Sokosumi · Task</div>
          <div
            style={{
              padding: "7px 16px",
              borderRadius: 999,
              fontSize: 17,
              fontWeight: 600,
              color: "#fff",
              background: state[2],
            }}
          >
            {state[1]}
          </div>
        </div>
        <div style={{ fontSize: 32, fontWeight: 600, marginTop: 14, letterSpacing: -0.5 }}>
          Landing page prompt for my ecommerce store
        </div>
        <div style={{ fontSize: 20, color: C.muted, marginTop: 8 }}>
          Find one on Simpuru. Max 10 tADA. Buy it with protection.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: C.ink,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Img
              src={staticFile("logo.svg")}
              style={{ width: 20, height: 20, filter: "invert(1)" }}
            />
          </div>
          <div style={{ fontSize: 19, fontWeight: 600 }}>Simpuru Shopper</div>
          <div style={{ fontSize: 17, color: C.muted }}>Coworker</div>
        </div>
      </div>
      <div
        style={{
          marginTop: 18,
          marginLeft: 60,
          borderRadius: 22,
          background: C.ink,
          color: "#fff",
          padding: "22px 26px",
          opacity: reply,
          transform: `translateY(${(1 - reply) * 20}px)`,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 600 }}>
          Bought "OYLA" on Simpuru, with buyer protection.
        </div>
        <div style={{ fontFamily: mono, fontSize: 16, color: "#c4b5fd", marginTop: 10 }}>
          Build a luxury handcrafted jewelry landing page…
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 18,
          marginTop: 18,
          marginLeft: 60,
          opacity: pay,
          transform: `translateY(${(1 - pay) * 14}px)`,
        }}
      >
        {[
          ["1 USDM", "to the Shopper, for the job"],
          ["3.5 tADA", "to the creator, for the prompt"],
        ].map(([a, b]) => (
          <div
            key={a}
            style={{
              flex: 1,
              borderRadius: 18,
              background: "#fff",
              border: `1px solid ${C.line}`,
              padding: "16px 22px",
            }}
          >
            <div style={{ fontSize: 30, fontWeight: 600 }}>{a}</div>
            <div style={{ fontSize: 17, color: C.muted, marginTop: 2 }}>{b}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const COWORKER_COPY: Copy[] = [
  {
    at: 0,
    to: 270,
    eyebrow: "09 Agent to agent",
    title: "Hired on Sokosumi.",
    body: "Another agent hires ours in USDM. Ours buys on Simpuru, protected.",
  },
];
const COWORKER_FRAMES = 270;
const Coworker = () => (
  <>
    <Split copy={COWORKER_COPY}>
      <TaskCard />
    </Split>
    <Sfx name="tap" at={40} />
    <Sfx name="chime" at={80} volume={0.4} />
    <Sfx name="chime" at={150} />
    <Sfx name="chime" at={190} volume={0.4} />
  </>
);

// ── Outro ────────────────────────────────────────────────────────────────────
const OUTRO_FRAMES = 210;
const Outro = () => {
  const a = useIn(0);
  const b = useIn(24);
  const c = useIn(48);
  return (
    <AbsoluteFill
      style={{
        background: BG,
        fontFamily: sans,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          opacity: a,
          transform: `scale(${0.94 + 0.06 * a})`,
        }}
      >
        <Img src={staticFile("logo.svg")} style={{ width: 96, height: 96 }} />
        <div style={{ fontSize: 110, fontWeight: 600, letterSpacing: -4 }}>Simpuru</div>
      </div>
      <div style={{ fontSize: 40, color: C.muted, opacity: b }}>
        Buyer protection for agents paying with x402 on Cardano.
      </div>
      <div style={{ fontFamily: mono, fontSize: 30, marginTop: 20, opacity: c }}>
        app.simpuru.xyz
      </div>
      <div style={{ display: "flex", gap: 80, alignItems: "center", marginTop: 40, opacity: c }}>
        {["x402.svg", "masumi.webp", "blockfrost.svg", "token2049.png", "cardano.svg"].map((f) => (
          <Img
            key={f}
            src={staticFile(f)}
            style={{
              height: 44,
              filter: f === "token2049.png" ? "invert(1) grayscale(1)" : "grayscale(1)",
              opacity: 0.85,
            }}
          />
        ))}
      </div>
      <Sfx name="thud" at={0} volume={0.6} />
    </AbsoluteFill>
  );
};

// ── simpuru.xyz, into the shop ───────────────────────────────────────────────
const Site = () => (
  <AbsoluteFill style={{ background: BG, justifyContent: "center", alignItems: "center" }}>
    <AppWindow width={1600} url="simpuru.xyz">
      <Landing />
    </AppWindow>
    <Sfx name="tap" at={LANDING_CLICK} />
    <Sfx name="swish" at={LANDING_FRAMES - 10} volume={0.5} />
  </AbsoluteFill>
);

// ── The film ─────────────────────────────────────────────────────────────────
const T = 8;
const PARTS = [
  ["opening", Opening, OPEN_FRAMES],
  ["site", Site, LANDING_FRAMES],
  ["web", Web, APP_FLOW_FRAMES],
  ["agents", Agents, AGENTS_FRAMES],
  ["proof", Proof, PROOF_FRAMES],
  ["coworker", Coworker, COWORKER_FRAMES],
  ["outro", Outro, OUTRO_FRAMES],
] as const;
export const FILM_FRAMES = PARTS.reduce((n, [, , d]) => n + d, 0) - T * (PARTS.length - 1);

export const Film = () => (
  <AbsoluteFill>
    <TransitionSeries>
      {PARTS.flatMap(([name, Part, d], i) => [
        <TransitionSeries.Sequence key={name} durationInFrames={d}>
          <Part />
        </TransitionSeries.Sequence>,
        ...(i < PARTS.length - 1
          ? [
              <TransitionSeries.Transition
                key={`${name}-out`}
                presentation={fade()}
                timing={linearTiming({ durationInFrames: T })}
              />,
            ]
          : []),
      ])}
    </TransitionSeries>
    <Audio
      src={staticFile("sfx/pad.wav")}
      volume={(f) =>
        0.22 * interpolate(f, [0, 30, FILM_FRAMES - 60, FILM_FRAMES], [0, 1, 1, 0], clamp)
      }
    />
  </AbsoluteFill>
);
