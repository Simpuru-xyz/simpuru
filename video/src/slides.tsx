// The pitch deck: the argument and the numbers, not a replay of the film (the film plays on slide 2).
// Editorial look: serif headlines on ink, one accent. deck/build.py assembles the .pptx.
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { mono, sans } from "./theme";

const serif = loadSerif("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily;
const INK = "#101014";
const PAPER = "#f6f4ef";
const ACCENT = "#c8f169";
const DIM = "#8d8d98";
const RULE = "#2a2a31";

const Frame = ({
  n,
  dark = true,
  children,
}: {
  n: number;
  dark?: boolean;
  children: ReactNode;
}) => (
  <AbsoluteFill
    style={{
      background: dark ? INK : PAPER,
      color: dark ? "#f2f2f4" : INK,
      fontFamily: sans,
      padding: "110px 130px",
    }}
  >
    {children}
    <div
      style={{
        position: "absolute",
        left: 130,
        right: 130,
        bottom: 56,
        display: "flex",
        justifyContent: "space-between",
        fontFamily: mono,
        fontSize: 18,
        color: DIM,
      }}
    >
      <span>Simpuru</span>
      <span>{String(n).padStart(2, "0")}</span>
    </div>
  </AbsoluteFill>
);
const Kicker = ({ children, light }: { children: string; light?: boolean }) => (
  <div
    style={{
      fontFamily: mono,
      fontSize: 20,
      letterSpacing: 3,
      textTransform: "uppercase",
      color: light ? "#4d6b00" : ACCENT,
    }}
  >
    {children}
  </div>
);
const Head = ({
  children,
  size = 104,
  style,
}: {
  children: ReactNode;
  size?: number;
  style?: CSSProperties;
}) => (
  <div
    style={{
      fontFamily: serif,
      fontSize: size,
      lineHeight: 1.02,
      letterSpacing: -1.5,
      marginTop: 22,
      ...style,
    }}
  >
    {children}
  </div>
);
const Col = ({
  title,
  body,
  w = 500,
  dark = true,
}: {
  title: string;
  body: string;
  w?: number;
  dark?: boolean;
}) => (
  <div style={{ width: w, borderTop: `2px solid ${dark ? RULE : "#d9d6cd"}`, paddingTop: 24 }}>
    <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: -0.5 }}>{title}</div>
    <div style={{ fontSize: 25, color: DIM, marginTop: 12, lineHeight: 1.45 }}>{body}</div>
  </div>
);

const Cover = () => (
  <Frame n={1}>
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <Img src={staticFile("logo.svg")} style={{ width: 54, height: 54, filter: "invert(1)" }} />
      <span style={{ fontSize: 30, fontWeight: 600 }}>Simpuru</span>
    </div>
    <Head size={150} style={{ marginTop: 150 }}>
      Buyer protection
      <br />
      for <span style={{ color: ACCENT }}>agents</span> that pay.
    </Head>
    <div style={{ fontSize: 32, color: DIM, marginTop: 40 }}>
      x402 on Cardano · Masumi escrow · live on preprod
    </div>
    <div
      style={{
        position: "absolute",
        right: 130,
        top: 120,
        fontFamily: mono,
        fontSize: 20,
        color: DIM,
        textAlign: "right",
        lineHeight: 1.7,
      }}
    >
      TOKEN2049 Origins
      <br />
      Cardano · Agentic Commerce
    </div>
  </Frame>
);

const Demo = () => (
  <Frame n={2}>
    <Kicker>Demo</Kicker>
  </Frame>
);

const Problem = () => (
  <Frame n={3}>
    <Kicker>Problem</Kicker>
    <Head>Agents can pay now. They can't get their money back.</Head>
    <div style={{ display: "flex", gap: 60, marginTop: 90 }}>
      <Col
        title="Priced for people"
        body="Design prompts sit behind monthly subscriptions. An agent needs one prompt, once."
      />
      <Col
        title="Nothing after the lock"
        body="x402 locks the payment in escrow. Releasing or refunding it is left to someone watching."
      />
      <Col
        title="No signal to trust"
        body="An agent can't read reviews. Stars are cheap; a refund record isn't."
      />
    </div>
  </Frame>
);

const Insight = () => (
  <Frame n={4} dark={false}>
    <Kicker light>Insight</Kicker>
    <Head size={120} style={{ maxWidth: 1600 }}>
      If the seller commits to the file before payment, a machine can judge the delivery.
    </Head>
    <div
      style={{ fontSize: 32, color: "#6b6b6b", marginTop: 50, maxWidth: 1400, lineHeight: 1.45 }}
    >
      The SHA-256 goes into the listing and the escrow terms. Delivered bytes either match or they
      don't. No opinion, no support ticket.
    </div>
  </Frame>
);

const Solution = () => (
  <Frame n={5}>
    <Kicker>Solution</Kicker>
    <Head>A shop where every purchase is protected by default.</Head>
    <div style={{ display: "flex", gap: 60, marginTop: 90 }}>
      <Col
        title="Pay per prompt"
        body="One x402 payment in ADA per item, straight to the creator. Instant, or into escrow."
      />
      <Col
        title="Refunds on their own"
        body="A watcher refunds when nothing arrives and disputes when the wrong thing does."
      />
      <Col
        title="Reputation that's earned"
        body="Each seller's score is withdrawn over refunded escrows. Visible to people and agents."
      />
    </div>
  </Frame>
);

const Box = ({
  x,
  y,
  w,
  title,
  sub,
  accent,
}: {
  x: number;
  y: number;
  w: number;
  title: string;
  sub: string;
  accent?: boolean;
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      padding: "20px 24px",
      borderRadius: 16,
      border: `2px solid ${accent ? ACCENT : RULE}`,
      background: "#16161c",
    }}
  >
    <div style={{ fontSize: 26, fontWeight: 600 }}>{title}</div>
    <div style={{ fontSize: 19, color: DIM, marginTop: 6, lineHeight: 1.35 }}>{sub}</div>
  </div>
);
const Wire = ({
  x1,
  y1,
  x2,
  y2,
  label,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
}) => (
  <>
    <svg
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      width={1}
      height={1}
      aria-hidden="true"
    >
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#4a4a55"
        strokeWidth={3}
        strokeDasharray="8 8"
      />
    </svg>
    {label ? (
      <div
        style={{
          position: "absolute",
          left: (x1 + x2) / 2 - 90,
          top: (y1 + y2) / 2 - 34,
          width: 180,
          textAlign: "center",
          fontFamily: mono,
          fontSize: 16,
          color: ACCENT,
        }}
      >
        {label}
      </div>
    ) : null}
  </>
);
const Architecture = () => (
  <Frame n={6}>
    <Kicker>Architecture</Kicker>
    <Head size={84}>How the pieces settle on Cardano.</Head>
    <div style={{ position: "relative", marginTop: 50, height: 560 }}>
      <Wire x1={330} y1={110} x2={560} y2={110} label="x402" />
      <Wire x1={330} y1={300} x2={560} y2={160} />
      <Wire x1={330} y1={470} x2={560} y2={190} />
      <Wire x1={900} y1={130} x2={1130} y2={130} label="lock" />
      <Wire x1={1300} y1={210} x2={1300} y2={330} />
      <Wire x1={730} y1={230} x2={730} y2={360} />
      <Wire x1={900} y1={420} x2={1130} y2={420} label="evidence" />
      <Box x={0} y={60} w={330} title="People" sub="web app, Cardano wallet sign-in" />
      <Box x={0} y={240} w={330} title="Agents" sub="hosted MCP, owner-set limits" />
      <Box x={0} y={420} w={330} title="Other agents" sub="Sokosumi Task, paid in USDM" />
      <Box
        x={560}
        y={60}
        w={340}
        title="Simpuru API"
        sub="x402 paywall, facilitator, accounts"
        accent
      />
      <Box
        x={1130}
        y={60}
        w={340}
        title="Escrow"
        sub="Masumi vested_pay V2, our deployment"
        accent
      />
      <Box
        x={560}
        y={360}
        w={340}
        title="Watchers"
        sub="seller agent posts and collects; buyer side refunds or disputes"
      />
      <Box x={1130} y={330} w={340} title="Arbiter" sub="decides from three hashes, pays out" />
    </div>
  </Frame>
);

const WhyCardano = () => (
  <Frame n={7} dark={false}>
    <Kicker light>Why Cardano</Kicker>
    <Head>The escrow is the product, so the chain matters.</Head>
    <div style={{ display: "flex", gap: 60, marginTop: 90 }}>
      <Col
        dark={false}
        title="Deterministic escrow"
        body="eUTxO outcomes are known before submission. A refund either builds or it doesn't."
      />
      <Col
        dark={false}
        title="Cheap enough per item"
        body="0.40 tADA per escrow step with a reference script. Small prompts stay worth protecting."
      />
      <Col
        dark={false}
        title="x402 has a masumi path"
        body="Escrowed x402 payments and the Masumi agent economy already speak Cardano."
      />
    </div>
  </Frame>
);

const Model = () => (
  <Frame n={8}>
    <Kicker>Business model</Kicker>
    <Head>We earn when protection does its job.</Head>
    <div style={{ display: "flex", gap: 40, marginTop: 80, alignItems: "flex-end" }}>
      {[
        [
          "10%",
          "of a protected sale, at least 1.5 tADA, taken when the escrow releases to the creator",
        ],
        ["0%", "on instant sales: paid straight to the creator"],
        ["3.5 tADA", "to the creator on a 5 tADA protected sale, paid automatically on release"],
      ].map(([a, b]) => (
        <div key={a} style={{ width: 520, borderTop: `2px solid ${RULE}`, paddingTop: 24 }}>
          <div
            style={{
              fontFamily: serif,
              fontSize: a.length > 4 ? 110 : 150,
              lineHeight: 1,
              color: a === "3.5 tADA" ? ACCENT : "#f2f2f4",
            }}
          >
            {a}
          </div>
          <div style={{ fontSize: 25, color: DIM, marginTop: 16, lineHeight: 1.45 }}>{b}</div>
        </div>
      ))}
    </div>
  </Frame>
);

const Traction = () => (
  <Frame n={9}>
    <Kicker>Traction · Cardano preprod</Kicker>
    <Head>Every claim is a transaction.</Head>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 30, marginTop: 80 }}>
      {[
        ["42", "preprod transactions linked in our receipts"],
        ["3 / 3", "outcomes settled: paid, refunded, arbitrated"],
        ["1 USDM", "earned by our Sokosumi coworker, settled"],
        ["17–31 s", "from payment to content, instant path"],
      ].map(([a, b]) => (
        <div key={a} style={{ borderTop: `2px solid ${RULE}`, paddingTop: 22 }}>
          <div style={{ fontFamily: serif, fontSize: 96, lineHeight: 1 }}>{a}</div>
          <div style={{ fontSize: 23, color: DIM, marginTop: 14, lineHeight: 1.4 }}>{b}</div>
        </div>
      ))}
    </div>
    <div style={{ fontSize: 24, color: DIM, marginTop: 60 }}>
      Real creator listings sold and paid out. Receipts: github.com/Simpuru-xyz/simpuru,
      docs/demo.md
    </div>
  </Frame>
);

const Compare = () => {
  const rows: [string, string, string, string][] = [
    ["", "Prompt libraries", "Plain x402", "Simpuru"],
    ["Pay for one item", "No, monthly", "Yes", "Yes"],
    ["Agents can buy", "No", "Yes", "Yes"],
    ["Money back if it never arrives", "Support ticket", "No", "Automatic"],
    ["Wrong file", "Support ticket", "No", "Arbiter, from hashes"],
    ["Seller reputation", "Reviews", "None", "From settled escrows"],
  ];
  return (
    <Frame n={10} dark={false}>
      <Kicker light>Why not the alternatives</Kicker>
      <Head size={84}>Others take the payment. We stand behind it.</Head>
      <div style={{ marginTop: 60 }}>
        {rows.map((r, i) => (
          <div
            key={r[0] || "head"}
            style={{
              display: "flex",
              padding: "18px 0",
              borderBottom: "1px solid #d9d6cd",
              fontSize: i === 0 ? 22 : 27,
              fontFamily: i === 0 ? mono : sans,
              color: i === 0 ? "#6b6b6b" : INK,
            }}
          >
            <span style={{ width: 600, fontWeight: i === 0 ? 400 : 600 }}>{r[0]}</span>
            <span style={{ width: 360 }}>{r[1]}</span>
            <span style={{ width: 360 }}>{r[2]}</span>
            <span
              style={{
                fontWeight: 600,
                background: i === 0 ? "transparent" : ACCENT,
                padding: i === 0 ? 0 : "2px 12px",
                borderRadius: 8,
              }}
            >
              {r[3]}
            </span>
          </div>
        ))}
      </div>
    </Frame>
  );
};

const Roadmap = () => (
  <Frame n={11}>
    <Kicker>Roadmap</Kicker>
    <Head>From prompts to any good an agent buys.</Head>
    <div style={{ display: "flex", gap: 60, marginTop: 90 }}>
      <Col
        title="Now"
        body="Live on preprod: web, MCP, coworker, refunds and the arbiter, all proven on chain."
      />
      <Col
        title="Next"
        body="Independent audit, multi-key arbiter, USDM prices next to ADA, mainnet."
      />
      <Col
        title="Later"
        body="Any x402 seller lists with a commitment: APIs, datasets, files, agent work."
      />
    </div>
  </Frame>
);

const Team = () => (
  <Frame n={12}>
    <Kicker>Team</Kicker>
    <Head>Four builders. Everything on chain.</Head>
    <div style={{ display: "flex", gap: 40, marginTop: 90 }}>
      {[
        ["Ghoza", "Contracts, escrow, arbiter"],
        ["Kiel", "API, MCP, coworker"],
        ["Wisnu", "Web app"],
        ["Axel", "Landing page"],
      ].map(([n, r]) => (
        <Col key={n} w={380} title={n} body={r} />
      ))}
    </div>
    <div style={{ fontFamily: mono, fontSize: 28, color: ACCENT, marginTop: 110 }}>
      app.simpuru.xyz · api.simpuru.xyz/docs
    </div>
  </Frame>
);

const SLIDES = [
  Cover,
  Demo,
  Problem,
  Insight,
  Solution,
  Architecture,
  WhyCardano,
  Model,
  Traction,
  Compare,
  Roadmap,
  Team,
];
export const SLIDE_COUNT = SLIDES.length;
export const Slides = () => {
  const S = SLIDES[useCurrentFrame()];
  return S ? <S /> : null;
};
