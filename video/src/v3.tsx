// The demo film: a short kinetic opening, then the product on the right and three lines of copy on
// the left, then proof on chain. No narration needed; sound marks every beat.
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { AgentsPage, APP_FLOW_FRAMES, AppFlow, AppWindow, APP_BEATS as B } from "./app";
import { AGENT } from "./scenes";
import { C, mono, sans, short, TX } from "./theme";
import { Arrow, Node, Terminal, Tx, useIn } from "./ui";

export const FPS3 = 30;
const BG = "#f4f4f5";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Sfx = ({ name, at, volume = 0.6 }: { name: string; at: number; volume?: number }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={60}>
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

// ── Opening: one short line per beat, word by word ───────────────────────────
const BEATS: { words: string[]; dark?: boolean; logo?: boolean; sub?: string }[] = [
  { words: ["Agents", "can", "pay", "now."] },
  { words: ["x402,", "on", "Cardano."] },
  { words: ["The", "money", "waits", "in", "escrow."], dark: true },
  { words: ["Nobody", "checks", "what", "arrives."], dark: true },
  { words: ["Simpuru", "checks."], logo: true },
];
const BEAT = 48;

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

const OPEN_FRAMES = BEATS.length * BEAT;
const Opening = () => (
  <AbsoluteFill>
    {BEATS.map((b, i) => (
      <Sequence key={b.words.join(" ")} from={i * BEAT} durationInFrames={BEAT}>
        <Line {...b} />
      </Sequence>
    ))}
    {BEATS.map((b, i) =>
      b.words.map((w, j) => (
        <Sfx key={`${i}${w}`} name="blip" at={i * BEAT + j * 4} volume={0.35} />
      )),
    )}
    <Sfx name="thud" at={2 * BEAT} volume={0.8} />
    <Sfx name="swish" at={4 * BEAT - 4} />
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
    to: 330,
    eyebrow: "08 Agents",
    title: "It shops on its own.",
    body: "Search, buy, verify. It never pays twice.",
  },
];
const AGENTS_FRAMES = 330;
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
            cps={150}
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

// ── Proof on chain ───────────────────────────────────────────────────────────
const Col = ({
  title,
  color,
  at,
  items,
}: {
  title: string;
  color: string;
  at: number;
  items: [string, string, string?][];
}) => {
  const p = useIn(at * 2);
  return (
    <div style={{ width: 540, display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontFamily: sans,
          fontSize: 32,
          fontWeight: 600,
          color: "#fff",
          opacity: p,
          marginBottom: 6,
        }}
      >
        <div style={{ width: 16, height: 16, borderRadius: 8, background: color }} />
        {title}
      </div>
      {items.map(([l, h, c], i) => (
        <Tx key={h} dark label={l} hash={h} color={c ?? "#8a8aa3"} delay={(at + 10 + i * 10) * 2} />
      ))}
    </div>
  );
};
const PROOF_FRAMES = 270;
const Proof = () => {
  const p = useIn(0);
  return (
    <AbsoluteFill
      style={{
        background: C.night,
        fontFamily: sans,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 54,
      }}
    >
      <div style={{ opacity: p, textAlign: "center" }}>
        <div style={{ fontFamily: mono, fontSize: 22, letterSpacing: 2, color: "#9b9bb0" }}>
          CARDANO PREPROD
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 600,
            letterSpacing: -2.5,
            color: "#fff",
            marginTop: 12,
          }}
        >
          Every path is a real transaction.
        </div>
      </div>
      <div style={{ display: "flex", gap: 36, alignItems: "flex-start" }}>
        <Col
          title="Delivered"
          color={C.green}
          at={10}
          items={[
            ["Locked", TX.oylaLock],
            ["Result posted", TX.oylaResult],
            ["Seller paid", TX.oylaWithdraw, C.green],
            ["Creator paid", TX.creatorPaid, C.green],
          ]}
        />
        <Col
          title="Nothing arrived"
          color={C.amber}
          at={40}
          items={[
            ["Locked", "003c3c7f3fb6109dfd6993e51bc15cf69c65f67e1841da8784be84cec61f074c"],
            [
              "Refunded",
              "39e9af4ee93160e5813128330e6115a659f1e727bd2cc985aa44110be8b1e221",
              C.green,
            ],
          ]}
        />
        <Col
          title="Wrong file"
          color={C.red}
          at={60}
          items={[
            ["Locked", TX.wrongLock],
            ["Wrong result", TX.wrongResult, C.red],
            ["Dispute", TX.dispute, C.amber],
            ["Arbiter refunds", TX.arbiterRefund, C.green],
          ]}
        />
      </div>
      <Sfx name="thud" at={0} volume={0.7} />
      {[20, 40, 60, 80, 100, 120, 140, 160, 180, 200].map((at) => (
        <Sfx key={at} name="blip" at={at} volume={0.3} />
      ))}
    </AbsoluteFill>
  );
};

// ── Agent to agent (Masumi) ──────────────────────────────────────────────────
const COWORKER_COPY: Copy[] = [
  {
    at: 0,
    to: 300,
    eyebrow: "09 Agent to agent",
    title: "Hired on Sokosumi.",
    body: "Paid in USDM for the job. Buys on Simpuru in ADA. Both escrows settled.",
  },
];
const COWORKER_FRAMES = 300;
const Coworker = () => (
  <Split copy={COWORKER_COPY}>
    <div
      style={{ width: 1110, display: "flex", flexDirection: "column", gap: 40, fontFamily: sans }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Node title="Sokosumi user" sub="writes a Task" delay={10} width={290} />
        <Arrow delay={30} width={110} label="1 USDM" />
        <Node
          title="Simpuru Shopper"
          sub="Masumi Coworker"
          delay={44}
          width={300}
          accent={C.violet}
        />
        <Arrow delay={64} width={110} label="5 tADA" />
        <Node title="Creator" sub="paid on delivery" delay={78} width={240} accent={C.green} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Tx label="USDM locked" hash={TX.usdmLock} delay={110} color={C.violet} />
        <Tx label="Bought, protected" hash={TX.oylaLock} delay={130} color={C.ink} />
        <Tx label="Result posted" hash={TX.usdmResult} delay={150} color={C.violet} />
        <Tx label="Creator paid" hash={TX.creatorPaid} delay={170} />
        <Tx label="Fee collected" hash={TX.usdmPaid} delay={190} />
      </div>
    </div>
    <Img
      src={staticFile("masumi.webp")}
      style={{ position: "absolute", right: 0, top: 120, height: 44 }}
    />
  </Split>
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
      <div style={{ display: "flex", gap: 46, alignItems: "center", marginTop: 26, opacity: c }}>
        {["cardano.svg", "x402.svg", "masumi.webp", "blockfrost.svg"].map((f) => (
          <Img key={f} src={staticFile(f)} style={{ height: 40, filter: "grayscale(1)" }} />
        ))}
      </div>
      <Sfx name="thud" at={0} volume={0.6} />
    </AbsoluteFill>
  );
};

// ── The film ─────────────────────────────────────────────────────────────────
const T = 8;
const PARTS = [
  ["opening", Opening, OPEN_FRAMES],
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
