// The pitch deck, one frame per slide, in the film's look. deck/build.py turns the frames into a
// .pptx and embeds the film on slide 2.
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { C, mono, sans } from "./theme";

const BG = "#f4f4f5";
const Eyebrow = ({ children, dark }: { children: string; dark?: boolean }) => (
  <div
    style={{
      fontFamily: mono,
      fontSize: 22,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: dark ? "#9b9bb0" : C.muted,
    }}
  >
    {children}
  </div>
);
const Title = ({
  children,
  dark,
  size = 84,
}: {
  children: string;
  dark?: boolean;
  size?: number;
}) => (
  <div
    style={{
      fontFamily: sans,
      fontSize: size,
      fontWeight: 600,
      letterSpacing: -2.5,
      lineHeight: 1.05,
      color: dark ? "#fff" : C.ink,
      marginTop: 14,
    }}
  >
    {children}
  </div>
);
const Card = ({ children, w, dark }: { children: React.ReactNode; w: number; dark?: boolean }) => (
  <div
    style={{
      width: w,
      padding: "32px 34px",
      borderRadius: 24,
      background: dark ? "#16161f" : "#fff",
      border: `1px solid ${dark ? "#2a2a35" : C.line}`,
      fontFamily: sans,
    }}
  >
    {children}
  </div>
);
const Still = ({ src }: { src: string }) => (
  <Img src={staticFile(`deck/${src}`)} style={{ width: 1920, height: 1080 }} />
);

const Cover = () => (
  <AbsoluteFill
    style={{
      background: BG,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
      gap: 26,
      fontFamily: sans,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
      <Img src={staticFile("logo.svg")} style={{ width: 110, height: 110 }} />
      <div style={{ fontSize: 150, fontWeight: 600, letterSpacing: -5 }}>Simpuru</div>
    </div>
    <div style={{ fontSize: 44, color: C.muted }}>
      Pay per prompt. Not per month. Refunded if it never arrives.
    </div>
    <div style={{ fontFamily: mono, fontSize: 28, marginTop: 18 }}>
      app.simpuru.xyz · live on Cardano preprod
    </div>
    <div
      style={{ position: "absolute", bottom: 70, display: "flex", gap: 60, alignItems: "center" }}
    >
      {["cardano.svg", "x402.svg", "masumi.webp", "blockfrost.svg"].map((f) => (
        <Img
          key={f}
          src={staticFile(f)}
          style={{ height: 40, filter: "grayscale(1)", opacity: 0.8 }}
        />
      ))}
    </div>
  </AbsoluteFill>
);

const DemoSlide = () => (
  <AbsoluteFill
    style={{
      background: C.night,
      justifyContent: "flex-end",
      alignItems: "center",
      paddingBottom: 30,
    }}
  >
    <div style={{ fontFamily: mono, fontSize: 20, color: "#6b6b80" }}>
      Demo · 1:12 · plays in the deck
    </div>
  </AbsoluteFill>
);

const Lock = () => (
  <AbsoluteFill style={{ background: C.night, padding: "150px 150px", fontFamily: sans }}>
    <Eyebrow dark>The trust problem</Eyebrow>
    <Title dark size={120}>
      x402 ends at the lock.
    </Title>
    <div style={{ fontSize: 32, color: "#b9b9c9", marginTop: 34, maxWidth: 1500, lineHeight: 1.4 }}>
      "A settled masumi payment means the funds are locked in the escrow, not delivered to the
      seller." x402 Cardano spec
    </div>
    <div style={{ display: "flex", gap: 30, marginTop: 70 }}>
      {[
        ["Nothing arrives", C.red],
        ["The wrong file arrives", C.red],
        ["The deadline passes at 3 a.m.", C.amber],
      ].map(([t, c]) => (
        <Card key={t} w={520} dark>
          <div style={{ width: 52, height: 6, borderRadius: 3, background: c }} />
          <div style={{ fontSize: 36, fontWeight: 600, color: "#fff", marginTop: 20 }}>{t}</div>
        </Card>
      ))}
    </div>
    <div style={{ fontSize: 30, color: "#9b9bb0", marginTop: 50 }}>
      Once an agent has paid, nobody checks the delivery for it.
    </div>
  </AbsoluteFill>
);

const How = () => (
  <AbsoluteFill style={{ background: BG, padding: "140px 140px", fontFamily: sans }}>
    <Eyebrow>How it works</Eyebrow>
    <Title>Protection is built in.</Title>
    <div style={{ display: "flex", gap: 26, marginTop: 70 }}>
      {[
        ["1", "Seller commits", "Every listing carries the SHA-256 of its content."],
        ["2", "Pay over x402", "Instantly, or into Masumi vested_pay escrow."],
        ["3", "Watcher checks", "The delivery against the commitment, on its own."],
        ["4", "Arbiter decides", "From on-chain evidence, not opinion."],
      ].map(([n, t, b]) => (
        <Card key={n} w={390}>
          <div style={{ fontSize: 40, fontWeight: 700, color: C.violet }}>{n}</div>
          <div style={{ fontSize: 36, fontWeight: 600, marginTop: 14 }}>{t}</div>
          <div style={{ fontSize: 25, color: C.muted, marginTop: 12, lineHeight: 1.4 }}>{b}</div>
        </Card>
      ))}
    </div>
    <div style={{ display: "flex", gap: 50, marginTop: 60, fontSize: 30, fontWeight: 600 }}>
      <span style={{ color: C.green }}>Right delivery: seller paid</span>
      <span style={{ color: C.amber }}>Nothing in time: refund</span>
      <span style={{ color: C.red }}>Wrong file: buyer refunded</span>
    </div>
  </AbsoluteFill>
);

const Numbers = () => (
  <AbsoluteFill style={{ background: BG, padding: "120px 140px", fontFamily: sans }}>
    <Eyebrow>Measured on preprod · Cardano Agentic Commerce</Eyebrow>
    <Title size={76}>Built for the track. Proven on chain.</Title>
    <div style={{ display: "flex", gap: 24, marginTop: 50 }}>
      {[
        ["17–31 s", "instant, pay to content"],
        ["30–50 s", "protected, pay to content"],
        ["0.40 tADA", "per escrow transaction"],
        ["3 / 3", "outcomes settled on chain"],
      ].map(([a, b]) => (
        <Card key={a} w={392}>
          <div style={{ fontSize: 58, fontWeight: 600, letterSpacing: -1.5 }}>{a}</div>
          <div style={{ fontSize: 24, color: C.muted, marginTop: 6 }}>{b}</div>
        </Card>
      ))}
    </div>
    <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: 12 }}>
      {[
        ["x402 open standard", "Instant and escrow paths, in-process facilitator"],
        ["Agents pay on their own", "Hosted MCP, owner-set limits, never pays twice"],
        ["Monetize content per request", "Anyone lists; each purchase is one x402 payment"],
        ["Agent to agent", "Seller agent settles; Sokosumi Coworker hired in USDM"],
        ["Unique innovation", "Automatic refund, dispute, evidence-based arbiter"],
      ].map(([a, b]) => (
        <div
          key={a}
          style={{
            display: "flex",
            padding: "20px 30px",
            borderRadius: 18,
            background: "#fff",
            border: `1px solid ${C.line}`,
            fontSize: 27,
          }}
        >
          <span style={{ width: 520, fontWeight: 600 }}>{a}</span>
          <span style={{ color: C.muted }}>{b}</span>
        </div>
      ))}
    </div>
  </AbsoluteFill>
);

const Team = () => (
  <AbsoluteFill
    style={{ background: C.night, padding: "130px 140px", fontFamily: sans, color: "#fff" }}
  >
    <Title dark size={100}>
      This is Simpuru.
    </Title>
    <div style={{ display: "flex", gap: 24, marginTop: 64 }}>
      {[
        ["Ghoza", "Contracts, escrow, arbiter"],
        ["Kiel", "API, MCP, coworker"],
        ["Wisnu", "Web app"],
        ["Axel", "Landing"],
      ].map(([n, r]) => (
        <Card key={n} w={392} dark>
          <div style={{ fontSize: 38, fontWeight: 600 }}>{n}</div>
          <div style={{ fontSize: 24, color: "#9b9bb0", marginTop: 6 }}>{r}</div>
        </Card>
      ))}
    </div>
    <div style={{ fontSize: 28, color: "#b9b9c9", marginTop: 56, lineHeight: 1.5 }}>
      Stack: x402 on Cardano · Masumi vested_pay with our own arbiter · Evolution SDK · Blockfrost ·
      MCP · Masumi Payment Service
      <br />
      Next: an audit before mainnet, a multi-key arbiter, USDM prices, goods beyond prompts.
    </div>
    <div style={{ fontFamily: mono, fontSize: 30, color: "#c4b5fd", marginTop: 56 }}>
      simpuru.xyz · app.simpuru.xyz · api.simpuru.xyz/docs
    </div>
  </AbsoluteFill>
);

const SLIDES = [
  <Cover key="cover" />,
  <DemoSlide key="demo" />,
  <Still key="cost" src="f200.png" />,
  <Lock key="lock" />,
  <How key="how" />,
  <Still key="why" src="f375.png" />,
  <Still key="landing" src="f528.png" />,
  <Still key="buy" src="f800.png" />,
  <Still key="agents" src="f1440.png" />,
  <Still key="outcomes" src="f1650.png" />,
  <Still key="coworker" src="f1940.png" />,
  <Numbers key="numbers" />,
  <Team key="team" />,
];
export const SLIDE_COUNT = SLIDES.length;
export const Slides = () => SLIDES[useCurrentFrame()] ?? null;
