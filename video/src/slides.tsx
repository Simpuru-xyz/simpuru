// The pitch deck: the argument and the numbers, each slide with its own visual (the film plays on
// slide 2, so nothing here repeats it). Light editorial look; deck/build.py assembles the .pptx.
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { mono, sans } from "./theme";
import TXS from "./txs.json";

const serif = loadSerif("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily;
const INK = "#121216";
const PAPER = "#f5f3ee";
const CARD = "#ffffff";
const LINE = "#e3dfd6";
const MUTE = "#6f6c66";
const LIME = "#d6f36b";
const GREEN = "#1f9d55";
const RED = "#d64545";
const AMBER = "#d98b1a";
const VIOLET = "#6d5dfc";
const shadow = "0 30px 80px rgba(30,25,15,0.12), 0 6px 18px rgba(30,25,15,0.06)";

const Frame = ({ n, children }: { n: number; children: ReactNode }) => (
  <AbsoluteFill style={{ background: PAPER, color: INK, fontFamily: sans, overflow: "hidden" }}>
    {children}
    <div
      style={{
        position: "absolute",
        left: 120,
        right: 120,
        bottom: 50,
        display: "flex",
        justifyContent: "space-between",
        fontFamily: mono,
        fontSize: 17,
        color: MUTE,
      }}
    >
      <span>Simpuru · TOKEN2049 Origins</span>
      <span>{String(n).padStart(2, "0")}</span>
    </div>
  </AbsoluteFill>
);
const Kicker = ({ children }: { children: string }) => (
  <span
    style={{
      display: "inline-block",
      fontFamily: mono,
      fontSize: 19,
      letterSpacing: 2.5,
      textTransform: "uppercase",
      background: LIME,
      padding: "6px 12px",
      borderRadius: 6,
    }}
  >
    {children}
  </span>
);
const Head = ({
  children,
  size = 92,
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
      lineHeight: 1.0,
      letterSpacing: -1.5,
      marginTop: 26,
      ...style,
    }}
  >
    {children}
  </div>
);
const Body = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div style={{ fontSize: 27, color: MUTE, lineHeight: 1.45, marginTop: 28, ...style }}>
    {children}
  </div>
);
const Left = ({ children, w = 700 }: { children: ReactNode; w?: number }) => (
  <div style={{ position: "absolute", left: 120, top: 120, width: w }}>{children}</div>
);
const Panel = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div
    style={{
      background: CARD,
      borderRadius: 22,
      border: `1px solid ${LINE}`,
      boxShadow: shadow,
      ...style,
    }}
  >
    {children}
  </div>
);
const Dot = ({ c, s = 12 }: { c: string; s?: number }) => (
  <span style={{ display: "inline-block", width: s, height: s, borderRadius: s, background: c }} />
);

// ── 1. Cover: the product, tilted ───────────────────────────────────────────
const Cover = () => (
  <Frame n={1}>
    <Left w={760}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Img src={staticFile("logo.svg")} style={{ width: 46, height: 46 }} />
        <span style={{ fontSize: 28, fontWeight: 600 }}>Simpuru</span>
      </div>
      <Head size={132} style={{ marginTop: 120 }}>
        Buyer protection for agents that{" "}
        <span style={{ background: LIME, padding: "0 14px", borderRadius: 10 }}>pay.</span>
      </Head>
      <Body>x402 on Cardano · Masumi escrow · live on preprod</Body>
    </Left>
    <div
      style={{
        position: "absolute",
        right: -60,
        top: 120,
        width: 1000,
        height: 820,
        perspective: 1600,
      }}
    >
      <div
        style={{
          transform: "rotateY(-18deg) rotateX(8deg) rotateZ(2deg)",
          transformStyle: "preserve-3d",
        }}
      >
        <Panel style={{ width: 560, overflow: "hidden", position: "absolute", left: 40, top: 30 }}>
          <div style={{ height: 300, overflow: "hidden" }}>
            <OffthreadVideo
              src={staticFile("oyla.mp4")}
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div
            style={{
              padding: "22px 26px",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 28,
              fontWeight: 600,
            }}
          >
            <span>OYLA</span>
            <span>5 tADA</span>
          </div>
          <div style={{ padding: "0 26px 26px", fontSize: 19, color: MUTE }}>
            Landing Page · seller reputation 100%
          </div>
        </Panel>
        <Panel style={{ width: 440, padding: 26, position: "absolute", left: 470, top: 300 }}>
          <div style={{ fontSize: 20, color: MUTE }}>Buy with protection</div>
          <div
            style={{
              marginTop: 14,
              height: 56,
              borderRadius: 999,
              background: INK,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 21,
              fontWeight: 600,
            }}
          >
            Held in escrow · 5 tADA
          </div>
          <div style={{ marginTop: 14, fontSize: 17, color: MUTE }}>
            Refunded automatically if it never arrives.
          </div>
        </Panel>
        <Panel style={{ width: 420, padding: 26, position: "absolute", left: 120, top: 520 }}>
          {[
            ["Locked in escrow", INK],
            ["Result matches hash", INK],
            ["Seller paid", GREEN],
            ["Creator paid 3.5 tADA", GREEN],
          ].map(([t, c]) => (
            <div
              key={t}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontSize: 21,
                padding: "8px 0",
              }}
            >
              <Dot c={c} />
              {t}
            </div>
          ))}
        </Panel>
      </div>
    </div>
  </Frame>
);

// ── 2. Demo (the film is embedded over this) ────────────────────────────────
const Demo = () => (
  <Frame n={2}>
    <div style={{ position: "absolute", left: 120, top: 60 }}>
      <Kicker>Demo · 1:12</Kicker>
    </div>
  </Frame>
);

// ── 3. Problem: the bill and the hanging lock ───────────────────────────────
const Receipt = ({
  children,
  rot,
  style,
}: {
  children: ReactNode;
  rot: number;
  style?: CSSProperties;
}) => (
  <div
    style={{
      position: "absolute",
      width: 380,
      padding: "30px 32px 40px",
      background: CARD,
      boxShadow: shadow,
      transform: `rotate(${rot}deg)`,
      fontFamily: mono,
      fontSize: 19,
      clipPath:
        "polygon(0 0,100% 0,100% 94%,95% 100%,90% 94%,85% 100%,80% 94%,75% 100%,70% 94%,65% 100%,60% 94%,55% 100%,50% 94%,45% 100%,40% 94%,35% 100%,30% 94%,25% 100%,20% 94%,15% 100%,10% 94%,5% 100%,0 94%)",
      ...style,
    }}
  >
    {children}
  </div>
);
const Problem = () => (
  <Frame n={3}>
    <Left w={760}>
      <Kicker>Problem</Kicker>
      <Head>Agents can pay now. They can't get their money back.</Head>
      <Body>
        Design prompts are sold by the month. x402 locks a payment in escrow and stops there. An
        agent can't read reviews to decide who to trust.
      </Body>
    </Left>
    <Receipt rot={-6} style={{ left: 1000, top: 160 }}>
      <div style={{ fontSize: 22, fontWeight: 600 }}>PROMPT LIBRARY</div>
      <div style={{ color: MUTE, marginTop: 6 }}>Pro plan · auto-renew</div>
      {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m) => (
        <div key={m} style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
          <span>{m}</span>
          <span>$99.00</span>
        </div>
      ))}
      <div
        style={{
          borderTop: `2px dashed ${LINE}`,
          marginTop: 16,
          paddingTop: 12,
          display: "flex",
          justifyContent: "space-between",
          fontWeight: 600,
        }}
      >
        <span>Prompts used</span>
        <span>1</span>
      </div>
    </Receipt>
    <Panel
      style={{
        position: "absolute",
        left: 1300,
        top: 470,
        width: 460,
        padding: 30,
        transform: "rotate(4deg)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: mono, fontSize: 18, color: MUTE }}>x402 · masumi</span>
        <span
          style={{
            padding: "5px 12px",
            borderRadius: 999,
            background: "#f3ece0",
            color: AMBER,
            fontSize: 17,
            fontWeight: 600,
          }}
        >
          Locked
        </span>
      </div>
      <div style={{ fontFamily: serif, fontSize: 64, marginTop: 14 }}>5 tADA</div>
      <div style={{ fontSize: 20, color: MUTE, marginTop: 8 }}>
        in escrow. Delivered? Wrong file? Who checks before the deadline?
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        {["Nothing arrives", "Wrong file", "3 a.m."].map((t) => (
          <span
            key={t}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              background: "#fbe9e9",
              color: RED,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </Panel>
  </Frame>
);

// ── 4. Insight: the hash lane ───────────────────────────────────────────────
const HashChip = ({ h, ok, label }: { h: string; ok?: boolean; label: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
    <span style={{ width: 150, fontSize: 21, color: MUTE }}>{label}</span>
    <span
      style={{
        fontFamily: mono,
        fontSize: 24,
        padding: "12px 18px",
        borderRadius: 12,
        background: ok === undefined ? CARD : ok ? "#e6f6ec" : "#fbe9e9",
        border: `1px solid ${ok === undefined ? LINE : ok ? "#bfe6cf" : "#f1c4c4"}`,
      }}
    >
      {h}
    </span>
    {ok === undefined ? null : (
      <span style={{ fontSize: 30, fontWeight: 700, color: ok ? GREEN : RED }}>
        {ok ? "✓" : "✕"}
      </span>
    )}
  </div>
);
const Insight = () => (
  <Frame n={4}>
    <Left w={820}>
      <Kicker>Insight</Kicker>
      <Head>Commit to the file first, and a machine can judge the delivery.</Head>
      <Body>
        The SHA-256 is fixed in the listing and the escrow terms before anyone pays. Delivered bytes
        match or they don't.
      </Body>
    </Left>
    <Panel
      style={{
        position: "absolute",
        right: 120,
        top: 210,
        width: 820,
        padding: "40px 44px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <HashChip label="Committed" h="c0ee84f5 · 89cf00aa · …001fc" />
      <div style={{ height: 1, background: LINE }} />
      <HashChip label="Delivered" h="c0ee84f5 · 89cf00aa · …001fc" ok />
      <div style={{ fontSize: 20, color: GREEN, marginLeft: 168, marginTop: -8 }}>
        Seller paid when the window closes
      </div>
      <HashChip label="Delivered" h="da7bd341 · 65edaa1d · …e96af" ok={false} />
      <div style={{ fontSize: 20, color: RED, marginLeft: 168, marginTop: -8 }}>
        Dispute, then the arbiter refunds the buyer
      </div>
    </Panel>
  </Frame>
);

// ── 5. Solution: three pillars as product pieces ────────────────────────────
const Solution = () => (
  <Frame n={5}>
    <Left w={1300}>
      <Kicker>Solution</Kicker>
      <Head>A shop where every purchase is protected by default.</Head>
    </Left>
    <div
      style={{ position: "absolute", left: 120, right: 120, top: 470, display: "flex", gap: 34 }}
    >
      {[
        [
          "Pay per prompt",
          "One x402 payment in ADA, straight to the creator.",
          <div key="a" style={{ display: "flex", gap: 10 }}>
            <span
              style={{
                padding: "10px 18px",
                borderRadius: 999,
                border: `1px solid ${LINE}`,
                fontSize: 20,
              }}
            >
              Instant · 5 tADA
            </span>
            <span
              style={{
                padding: "10px 18px",
                borderRadius: 999,
                background: INK,
                color: "#fff",
                fontSize: 20,
              }}
            >
              Protected · 5 tADA
            </span>
          </div>,
        ],
        [
          "Refunds on their own",
          "A watcher refunds a no-show and disputes a wrong file.",
          <span
            key="b"
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              background: "#e6f6ec",
              color: GREEN,
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            Refunded · 39e9af4e ↗
          </span>,
        ],
        [
          "Reputation that's earned",
          "Withdrawn over refunded escrows, per seller.",
          <div key="c" style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20 }}>
              <span>Seller reputation</span>
              <b>100%</b>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: "#eee", marginTop: 10 }}>
              <div style={{ width: "100%", height: 10, borderRadius: 5, background: GREEN }} />
            </div>
          </div>,
        ],
      ].map(([t, b, ui]) => (
        <Panel key={t as string} style={{ flex: 1, padding: "34px 34px 38px" }}>
          <div style={{ height: 70, display: "flex", alignItems: "center" }}>{ui}</div>
          <div style={{ fontSize: 34, fontWeight: 600, marginTop: 26 }}>{t}</div>
          <div style={{ fontSize: 23, color: MUTE, marginTop: 10, lineHeight: 1.4 }}>{b}</div>
        </Panel>
      ))}
    </div>
  </Frame>
);

// ── 6. Architecture ─────────────────────────────────────────────────────────
const Node = ({
  x,
  y,
  w,
  title,
  sub,
  tone = INK,
}: {
  x: number;
  y: number;
  w: number;
  title: string;
  sub: string;
  tone?: string;
}) => (
  <Panel
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      padding: "20px 24px",
      borderTop: `5px solid ${tone}`,
    }}
  >
    <div style={{ fontSize: 25, fontWeight: 600 }}>{title}</div>
    <div style={{ fontSize: 18, color: MUTE, marginTop: 6, lineHeight: 1.35 }}>{sub}</div>
  </Panel>
);
const Link = ({ d, label, lx, ly }: { d: string; label?: string; lx?: number; ly?: number }) => (
  <>
    <svg
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      width={1}
      height={1}
      aria-hidden="true"
    >
      <path d={d} fill="none" stroke="#b9b3a6" strokeWidth={3} />
    </svg>
    {label ? (
      <span
        style={{
          position: "absolute",
          left: lx,
          top: ly,
          fontFamily: mono,
          fontSize: 16,
          background: LIME,
          padding: "3px 8px",
          borderRadius: 5,
        }}
      >
        {label}
      </span>
    ) : null}
  </>
);
const Architecture = () => (
  <Frame n={6}>
    <Left w={1400}>
      <Kicker>Architecture</Kicker>
      <Head size={80}>How the pieces settle on Cardano.</Head>
    </Left>
    <div style={{ position: "absolute", left: 120, top: 360, width: 1680, height: 560 }}>
      <Link d="M330 80 C 440 80, 440 120, 560 120" label="x402" lx={410} ly={70} />
      <Link d="M330 270 C 440 270, 440 150, 560 150" />
      <Link d="M330 450 C 440 450, 440 180, 560 180" />
      <Link d="M920 140 L 1180 140" label="lock" lx={1020} ly={110} />
      <Link d="M740 230 L 740 360" />
      <Link d="M920 430 L 1180 430" label="evidence" lx={1000} ly={400} />
      <Link d="M1360 230 L 1360 340" />
      <Node x={0} y={30} w={330} title="People" sub="web app, Cardano wallet sign-in" />
      <Node x={0} y={220} w={330} title="Agents" sub="hosted MCP, owner-set limits" />
      <Node
        x={0}
        y={400}
        w={330}
        title="Other agents"
        sub="Sokosumi Task, paid in USDM"
        tone={VIOLET}
      />
      <Node
        x={560}
        y={60}
        w={360}
        title="Simpuru API"
        sub="x402 paywall, facilitator, accounts"
        tone={GREEN}
      />
      <Node
        x={1180}
        y={60}
        w={360}
        title="Escrow"
        sub="Masumi vested_pay V2, our deployment"
        tone={GREEN}
      />
      <Node
        x={560}
        y={360}
        w={360}
        title="Watchers"
        sub="seller agent collects, buyer side refunds or disputes"
      />
      <Node
        x={1180}
        y={340}
        w={360}
        title="Arbiter"
        sub="decides from three hashes and pays out"
        tone={AMBER}
      />
    </div>
  </Frame>
);

// ── 7. Why Cardano: UTxOs with datums ───────────────────────────────────────
const Utxo = ({
  x,
  y,
  ada,
  datum,
  tone,
}: {
  x: number;
  y: number;
  ada: string;
  datum: string;
  tone: string;
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      display: "flex",
      alignItems: "center",
      gap: 18,
    }}
  >
    <div
      style={{
        width: 190,
        height: 190,
        borderRadius: 95,
        background: CARD,
        border: `3px solid ${tone}`,
        boxShadow: shadow,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: serif,
        fontSize: 54,
      }}
    >
      {ada}
    </div>
    <div
      style={{
        fontFamily: mono,
        fontSize: 22,
        color: MUTE,
        lineHeight: 1.6,
        whiteSpace: "pre-line",
      }}
    >
      {datum}
    </div>
  </div>
);
const WhyCardano = () => (
  <Frame n={7}>
    <Left w={780}>
      <Kicker>Why Cardano</Kicker>
      <Head>The escrow is the product, so the chain matters.</Head>
      <Body>
        eUTxO: a refund either builds or it doesn't, known before it's sent. 0.40 tADA per escrow
        step keeps a 5 tADA prompt worth protecting. x402's masumi path and the Masumi agent economy
        already run here.
      </Body>
    </Left>
    <Utxo
      x={1080}
      y={200}
      ada="5 ₳"
      datum={"state: FundsLocked\ninput_hash: c0ee84f5…\nunlock: after the window"}
      tone={INK}
    />
    <Utxo
      x={1180}
      y={420}
      ada="5 ₳"
      datum={"state: ResultSubmitted\nresult_hash: matches"}
      tone={GREEN}
    />
    <Utxo x={1020} y={650} ada="3.5 ₳" datum={"to the creator\nfee 0.40 tADA"} tone={GREEN} />
  </Frame>
);

// ── 8. Business model: where 5 tADA goes ────────────────────────────────────
const Donut = ({ parts }: { parts: [number, string][] }) => {
  const r = 190;
  const c = 2 * Math.PI * r;
  let off = 0;
  return (
    <svg width={500} height={500} viewBox="0 0 500 500" aria-hidden="true">
      {parts.map(([v, col]) => {
        const len = c * v;
        const el = (
          <circle
            key={col}
            cx={250}
            cy={250}
            r={r}
            fill="none"
            stroke={col}
            strokeWidth={70}
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-off}
            transform="rotate(-90 250 250)"
          />
        );
        off += len;
        return el;
      })}
    </svg>
  );
};
const Model = () => (
  <Frame n={8}>
    <Left w={760}>
      <Kicker>Business model</Kicker>
      <Head>We earn when protection does its job.</Head>
      <Body>
        Protected sales pay the larger of 10% or 1.5 tADA when the escrow releases. Instant sales go
        straight to the creator, no fee.
      </Body>
    </Left>
    <div style={{ position: "absolute", left: 1050, top: 230 }}>
      <Donut
        parts={[
          [0.7, GREEN],
          [0.3, INK],
        ]}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 500,
          height: 500,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontFamily: serif, fontSize: 84 }}>5 tADA</div>
        <div style={{ fontSize: 20, color: MUTE }}>a protected sale</div>
      </div>
    </div>
    <div
      style={{
        position: "absolute",
        left: 1600,
        top: 330,
        display: "flex",
        flexDirection: "column",
        gap: 30,
      }}
    >
      <div>
        <Dot c={GREEN} s={16} /> <b style={{ fontSize: 30 }}>3.5 tADA</b>
        <div style={{ fontSize: 20, color: MUTE }}>creator, paid on release</div>
      </div>
      <div>
        <Dot c={INK} s={16} /> <b style={{ fontSize: 30 }}>1.5 tADA</b>
        <div style={{ fontSize: 20, color: MUTE }}>Simpuru, covers escrow fees</div>
      </div>
    </div>
  </Frame>
);

// ── 9. Traction: the wall of real transactions ──────────────────────────────
const Traction = () => (
  <Frame n={9}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        padding: "60px 40px",
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignContent: "flex-start",
        opacity: 0.55,
      }}
    >
      {[...TXS, ...TXS].map((h, i) => (
        <span
          key={`${h}-${i < TXS.length ? "a" : "b"}`}
          style={{
            fontFamily: mono,
            fontSize: 15,
            padding: "8px 12px",
            borderRadius: 8,
            background: CARD,
            border: `1px solid ${LINE}`,
            color: MUTE,
          }}
        >
          {h.slice(0, 22)}…
        </span>
      ))}
    </div>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(ellipse at 30% 50%, ${PAPER} 35%, rgba(245,243,238,0.4) 75%)`,
      }}
    />
    <Left w={1500}>
      <Kicker>Traction · Cardano preprod</Kicker>
      <Head>Every claim is a transaction.</Head>
      <div style={{ display: "flex", gap: 70, marginTop: 70 }}>
        {[
          [String(TXS.length), "transactions linked in our receipts"],
          ["3 / 3", "outcomes settled: paid, refunded, arbitrated"],
          ["1 USDM", "earned by our Sokosumi coworker"],
        ].map(([a, b]) => (
          <div key={a} style={{ width: 360 }}>
            <div style={{ fontFamily: serif, fontSize: 120, lineHeight: 1 }}>{a}</div>
            <div style={{ fontSize: 23, color: MUTE, marginTop: 10, lineHeight: 1.4 }}>{b}</div>
          </div>
        ))}
      </div>
    </Left>
  </Frame>
);

// ── 10. Alternatives ────────────────────────────────────────────────────────
const Yes = ({ t }: { t: string }) => (
  <span style={{ background: LIME, padding: "4px 12px", borderRadius: 8, fontWeight: 600 }}>
    {t}
  </span>
);
const Compare = () => {
  const rows: [string, string, string, string][] = [
    ["Pay for one item", "Monthly plans", "Yes", "Yes"],
    ["Agents can buy", "No", "Yes", "Yes"],
    ["Never arrives", "Support ticket", "Money stays locked", "Automatic refund"],
    ["Wrong file", "Support ticket", "Nobody checks", "Arbiter, from hashes"],
    ["Seller reputation", "Star ratings", "None", "From settled escrows"],
  ];
  return (
    <Frame n={10}>
      <Left w={1500}>
        <Kicker>Alternatives</Kicker>
        <Head size={80}>Others take the payment. We stand behind it.</Head>
      </Left>
      <Panel
        style={{ position: "absolute", left: 120, right: 120, top: 380, padding: "18px 40px" }}
      >
        <div
          style={{
            display: "flex",
            padding: "16px 0",
            fontFamily: mono,
            fontSize: 19,
            color: MUTE,
            borderBottom: `1px solid ${LINE}`,
          }}
        >
          <span style={{ width: 460 }} />
          <span style={{ width: 380 }}>Prompt libraries</span>
          <span style={{ width: 380 }}>Plain x402</span>
          <span>Simpuru</span>
        </div>
        {rows.map((r) => (
          <div
            key={r[0]}
            style={{
              display: "flex",
              padding: "20px 0",
              fontSize: 26,
              borderBottom: `1px solid ${LINE}`,
            }}
          >
            <span style={{ width: 460, fontWeight: 600 }}>{r[0]}</span>
            <span style={{ width: 380, color: MUTE }}>{r[1]}</span>
            <span style={{ width: 380, color: MUTE }}>{r[2]}</span>
            <Yes t={r[3]} />
          </div>
        ))}
      </Panel>
    </Frame>
  );
};

// ── 11. Roadmap ─────────────────────────────────────────────────────────────
const Roadmap = () => (
  <Frame n={11}>
    <Left w={1500}>
      <Kicker>Roadmap</Kicker>
      <Head>From prompts to any good an agent buys.</Head>
    </Left>
    <div
      style={{ position: "absolute", left: 120, right: 120, top: 560, height: 4, background: LINE }}
    />
    {[
      ["Now", "Live on preprod. Web, MCP, coworker, refunds and arbiter proven on chain.", GREEN],
      ["Next", "Independent audit, multi-key arbiter, USDM prices next to ADA, mainnet.", INK],
      [
        "Later",
        "Any x402 seller lists with a commitment: APIs, datasets, files, agent work.",
        MUTE,
      ],
    ].map(([t, b, c], i) => (
      <div key={t} style={{ position: "absolute", left: 120 + i * 580, top: 540, width: 520 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            background: c,
            border: `6px solid ${PAPER}`,
          }}
        />
        <div style={{ fontFamily: serif, fontSize: 64, marginTop: 20 }}>{t}</div>
        <div style={{ fontSize: 24, color: MUTE, marginTop: 10, lineHeight: 1.4 }}>{b}</div>
      </div>
    ))}
  </Frame>
);

// ── 12. Team ────────────────────────────────────────────────────────────────
const Team = () => (
  <Frame n={12}>
    <Left w={1500}>
      <Kicker>Team</Kicker>
      <Head>Four builders. Everything on chain.</Head>
    </Left>
    <div
      style={{ position: "absolute", left: 120, right: 120, top: 440, display: "flex", gap: 30 }}
    >
      {[
        ["G", "Ghoza", "Contracts, escrow, arbiter", "#e8e2ff"],
        ["K", "Kiel", "API, MCP, coworker", LIME],
        ["W", "Wisnu", "Web app", "#dff3e6"],
        ["A", "Axel", "Landing page", "#fde9d6"],
      ].map(([i, n, r, bg]) => (
        <Panel key={n} style={{ flex: 1, padding: 34 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 42,
              background: bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: serif,
              fontSize: 48,
            }}
          >
            {i}
          </div>
          <div style={{ fontSize: 34, fontWeight: 600, marginTop: 22 }}>{n}</div>
          <div style={{ fontSize: 22, color: MUTE, marginTop: 6 }}>{r}</div>
        </Panel>
      ))}
    </div>
    <div style={{ position: "absolute", left: 120, top: 820, fontFamily: mono, fontSize: 28 }}>
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
