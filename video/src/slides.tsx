// The pitch deck. Plain on purpose: short claims, real screenshots, real explorer pages, a table of
// transactions, and what isn't trustless yet. The film plays on slide 2. deck/build.py makes the .pptx.
import type { ReactNode } from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { mono, sans } from "./theme";

const BG = "#f2f2f2";
const INK = "#111111";
const GREY = "#8a8a8a";
const LINE = "#e4e4e4";
const N = 16;

const Logo = ({ src, h = 56 }: { src: string; h?: number }) => (
  <Img src={staticFile(src)} style={{ height: h }} />
);
const Chip = ({
  children,
  bg = "#fff",
  color = INK,
  border = LINE,
}: {
  children: ReactNode;
  bg?: string;
  color?: string;
  border?: string;
}) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 18px",
      borderRadius: 999,
      background: bg,
      color,
      border: `1px solid ${border}`,
      fontSize: 20,
      fontWeight: 600,
    }}
  >
    {children}
  </span>
);
const Panel = ({ children, style }: { children: ReactNode; style?: React.CSSProperties }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 18,
      border: `1px solid ${LINE}`,
      boxShadow: "0 24px 60px rgba(0,0,0,0.07)",
      ...style,
    }}
  >
    {children}
  </div>
);
const Arrow = ({ w = 70 }: { w?: number }) => (
  <svg width={w} height={24} viewBox={`0 0 ${w} 24`} aria-hidden="true">
    <line x1={0} y1={12} x2={w - 10} y2={12} stroke="#b5b5b5" strokeWidth={3} />
    <path
      d={`M${w - 14} 5 L${w - 2} 12 L${w - 14} 19`}
      fill="none"
      stroke="#b5b5b5"
      strokeWidth={3}
    />
  </svg>
);
const GREEN = "#1f9d55";
const RED = "#d64545";
const AMBER = "#d98b1a";

const Page = ({ n, dark, children }: { n: number; dark?: boolean; children: ReactNode }) => (
  <AbsoluteFill
    style={{
      background: dark ? "#141416" : BG,
      color: dark ? "#fff" : INK,
      fontFamily: sans,
      padding: "0 110px",
    }}
  >
    {children}
    <div
      style={{
        position: "absolute",
        left: 110,
        right: 110,
        bottom: 46,
        display: "flex",
        justifyContent: "space-between",
        fontSize: 16,
        color: GREY,
      }}
    >
      <span>Simpuru</span>
      <span>
        {n} / {N}
      </span>
    </div>
  </AbsoluteFill>
);
const Eyebrow = ({ children }: { children: string }) => (
  <div
    style={{
      fontSize: 17,
      letterSpacing: 2.4,
      textTransform: "uppercase",
      color: GREY,
      fontWeight: 500,
    }}
  >
    {children}
  </div>
);
const H = ({ children, size = 70 }: { children: ReactNode; size?: number }) => (
  <div
    style={{
      fontSize: size,
      fontWeight: 600,
      letterSpacing: -2.2,
      lineHeight: 1.08,
      marginTop: 16,
    }}
  >
    {children}
  </div>
);
const Grey = ({ children }: { children: ReactNode }) => (
  <span style={{ color: "#a3a3a3" }}>{children}</span>
);
const Block = ({ top = 150, children }: { top?: number; children: ReactNode }) => (
  <div style={{ position: "absolute", left: 110, right: 110, top }}>{children}</div>
);
const Card = ({ k, title, body }: { k?: string; title: string; body: string }) => (
  <div
    style={{
      flex: 1,
      background: "#fff",
      borderRadius: 16,
      border: `1px solid ${LINE}`,
      padding: "26px 28px 30px",
    }}
  >
    {k ? <div style={{ fontSize: 15, color: GREY, letterSpacing: 1.5 }}>{k}</div> : null}
    <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: -0.8, marginTop: k ? 10 : 0 }}>
      {title}
    </div>
    <div style={{ fontSize: 20, color: GREY, marginTop: 10, lineHeight: 1.4 }}>{body}</div>
  </div>
);
const _Stat = ({ v, label }: { v: string; label: string }) => (
  <div
    style={{
      flex: 1,
      background: "#fff",
      borderRadius: 16,
      border: `1px solid ${LINE}`,
      padding: "30px 30px 32px",
    }}
  >
    <div style={{ fontSize: 64, fontWeight: 600, letterSpacing: -2 }}>{v}</div>
    <div style={{ fontSize: 19, color: GREY, marginTop: 10, lineHeight: 1.4 }}>{label}</div>
  </div>
);
const Shot = ({ src, w, h }: { src: string; w: number; h?: number }) => (
  <Img
    src={staticFile(`deck/${src}`)}
    style={{
      width: w,
      height: h,
      objectFit: "cover",
      objectPosition: "top",
      borderRadius: 14,
      border: `1px solid ${LINE}`,
      boxShadow: "0 24px 60px rgba(0,0,0,0.10)",
    }}
  />
);
const _short = (h: string) => `${h.slice(0, 10)}…${h.slice(-6)}`;

const Cover = () => (
  <Page n={1}>
    <Block top={340}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Img src={staticFile("logo.svg")} style={{ width: 44, height: 44 }} />
        <span style={{ fontSize: 30, fontWeight: 600 }}>Simpuru</span>
      </div>
      <H size={104}>
        Pay per prompt. Not per month.
        <br />
        <Grey>Refunded if it never arrives.</Grey>
      </H>
      <div style={{ fontSize: 22, color: GREY, marginTop: 28 }}>
        A design prompt shop for people and AI agents, on Cardano
      </div>
    </Block>
  </Page>
);

const Demo = () => (
  <Page n={2}>
    <div />
  </Page>
);

const Problem = () => (
  <Page n={3}>
    <Block top={300}>
      <Eyebrow>The problem</Eyebrow>
      <H size={84}>
        Great UI design is expensive.{" "}
        <Grey>Prompts make it cheap, then libraries sell them by the month.</Grey>
      </H>
      <H size={84}>
        Agents can pay now. <Grey>Nobody protects them after they do.</Grey>
      </H>
    </Block>
  </Page>
);

const Users = () => (
  <Page n={4}>
    <Block top={150}>
      <Eyebrow>Who it's for</Eyebrow>
      <H>Three people, one shop.</H>
    </Block>
    <div
      style={{ position: "absolute", left: 110, right: 110, top: 400, display: "flex", gap: 26 }}
    >
      <Panel style={{ flex: 1, padding: 40 }}>
        <div
          style={{
            height: 170,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              height: 58,
              borderRadius: 14,
              border: `1px solid ${LINE}`,
              display: "flex",
              alignItems: "center",
              padding: "0 18px",
              gap: 14,
              fontSize: 22,
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "linear-gradient(135deg,#f472b6,#fb923c)",
              }}
            />
            Eternl <span style={{ marginLeft: "auto", fontSize: 16, color: GREY }}>preprod</span>
          </div>
          <div
            style={{
              height: 58,
              borderRadius: 14,
              background: INK,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            Sign in · one signature
          </div>
        </div>
        <div style={{ marginTop: 34, fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>
          Builders and founders
        </div>
        <div style={{ fontSize: 22, color: GREY, marginTop: 12, lineHeight: 1.45 }}>
          Sign in with a wallet and buy the one prompt you need. No plan, no card.
        </div>
      </Panel>
      <Panel style={{ flex: 1, padding: 40 }}>
        <div style={{ display: "flex", gap: 46, alignItems: "center", height: 170 }}>
          <Logo src="logos/claude.svg" h={96} />
          <Logo src="logos/cursor.svg" h={96} />
          <Logo src="logos/mcp.svg" h={96} />
        </div>
        <div style={{ marginTop: 34, fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>
          AI agents
        </div>
        <div style={{ fontSize: 22, color: GREY, marginTop: 12, lineHeight: 1.45 }}>
          Claude Code, Cursor or any MCP client shops for its owner, inside a budget.
        </div>
      </Panel>
      <Panel style={{ flex: 1, padding: 40 }}>
        <div style={{ display: "flex", gap: 14, height: 170 }}>
          <Img
            src={staticFile("deck/oyla-still.png")}
            style={{ flex: 1, height: 170, objectFit: "cover", borderRadius: 14 }}
          />
          <Img
            src={staticFile("hero3d.webp")}
            style={{ flex: 1, height: 170, objectFit: "cover", borderRadius: 14 }}
          />
        </div>
        <div style={{ marginTop: 34, fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>
          Prompt creators
        </div>
        <div style={{ fontSize: 22, color: GREY, marginTop: 12, lineHeight: 1.45 }}>
          Sell each prompt on its own, get paid in ADA, and earn a reputation that sells.
        </div>
      </Panel>
    </div>
  </Page>
);

const LockIcon = () => (
  <svg width={64} height={64} viewBox="0 0 24 24" aria-hidden="true">
    <rect x={4} y={10} width={16} height={11} rx={2.5} fill={INK} />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke={INK} strokeWidth={2.2} />
  </svg>
);
const Solution = () => (
  <Page n={5}>
    <Block top={150}>
      <Eyebrow>The solution</Eyebrow>
      <H>
        Buy one prompt at a time. <Grey>Protection comes with it.</Grey>
      </H>
    </Block>
    <div
      style={{
        position: "absolute",
        left: 110,
        right: 110,
        top: 420,
        display: "flex",
        alignItems: "center",
        gap: 20,
      }}
    >
      <Panel style={{ padding: 32, width: 380 }}>
        <Img
          src={staticFile("deck/oyla-still.png")}
          style={{ width: "100%", height: 170, objectFit: "cover", borderRadius: 12 }}
        />
        <div style={{ fontSize: 26, fontWeight: 600, marginTop: 16 }}>OYLA · 5 tADA</div>
        <div
          style={{
            marginTop: 14,
            height: 58,
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
          Buy with protection
        </div>
      </Panel>
      <Arrow w={60} />
      <Panel style={{ padding: 32, width: 300, textAlign: "center" }}>
        <LockIcon />
        <div style={{ fontSize: 28, fontWeight: 600, marginTop: 10 }}>5 tADA in escrow</div>
        <div style={{ fontSize: 19, color: GREY, marginTop: 8 }}>
          held on Cardano until the delivery checks out
        </div>
      </Panel>
      <Arrow w={60} />
      <Panel style={{ padding: 32, width: 330 }}>
        <div style={{ fontFamily: mono, fontSize: 18, color: GREY }}>delivered sha256</div>
        <div style={{ fontFamily: mono, fontSize: 22, marginTop: 10 }}>c0ee84f5…001fc</div>
        <div style={{ fontFamily: mono, fontSize: 18, color: GREY, marginTop: 16 }}>
          listing sha256
        </div>
        <div style={{ fontFamily: mono, fontSize: 22, marginTop: 10 }}>c0ee84f5…001fc</div>
        <div style={{ marginTop: 16, fontSize: 22, fontWeight: 600, color: GREEN }}>✓ match</div>
      </Panel>
      <Arrow w={60} />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Chip bg="#e8f6ee" color={GREEN} border="#c6e9d4">
          Seller paid · creator gets 3.5 tADA
        </Chip>
        <Chip bg="#fdf1e3" color={AMBER} border="#f3d8b5">
          Never arrived · refunded
        </Chip>
        <Chip bg="#fbe9e9" color={RED} border="#f1c4c4">
          Wrong file · arbiter refunds
        </Chip>
      </div>
    </div>
  </Page>
);

const Product = () => (
  <Page n={6}>
    <Block top={110}>
      <div style={{ textAlign: "center" }}>
        <Eyebrow>Live on Cardano preprod</Eyebrow>
        <H>Sign in with a wallet. Buy. Track every step.</H>
      </div>
      <div style={{ display: "flex", gap: 26, justifyContent: "center", marginTop: 50 }}>
        <Shot src="app-purchase-timeline-c.png" w={640} />
        <Shot src="app-agents-signed-in-c.png" w={640} />
      </div>
    </Block>
  </Page>
);

const X402 = () => (
  <Page n={7}>
    <Block top={150}>
      <div style={{ width: 760 }}>
        <Eyebrow>Key technology · x402</Eyebrow>
        <H>
          Payment is part of the request. <Grey>That's what lets an agent buy.</Grey>
        </H>
        <div style={{ fontSize: 24, color: GREY, marginTop: 26, lineHeight: 1.45 }}>
          An agent can't fill a sign-up form or hold a card. It can answer a 402 with a signed
          Cardano payment. Instant pays the creator; protected locks the money in escrow.
        </div>
        <div style={{ display: "flex", gap: 40, alignItems: "center", marginTop: 44 }}>
          <Img src={staticFile("x402.svg")} style={{ height: 44 }} />
          <Img src={staticFile("cardano.svg")} style={{ height: 40 }} />
        </div>
      </div>
    </Block>
    <div
      style={{
        position: "absolute",
        right: 110,
        top: 190,
        width: 880,
        borderRadius: 18,
        background: "#111114",
        padding: "30px 34px",
        fontFamily: mono,
        fontSize: 21,
        lineHeight: 1.7,
        color: "#d4d4d8",
        boxShadow: "0 30px 70px rgba(0,0,0,0.2)",
      }}
    >
      <div style={{ color: "#8b8b96" }}># the agent asks for the prompt</div>
      <div>GET /listings/oyla/unlock</div>
      <div style={{ color: "#fbbf24", marginTop: 14 }}>← 402 Payment Required</div>
      <div style={{ color: "#a1a1aa" }}>{"   "}price 5 tADA · instant | protected (escrow)</div>
      <div style={{ color: "#8b8b96", marginTop: 14 }}>
        # it signs a Cardano payment and asks again
      </div>
      <div>GET /listings/oyla/unlock</div>
      <div style={{ color: "#c4b5fd" }}>{"   "}PAYMENT-SIGNATURE: 84a400…</div>
      <div style={{ color: "#86efac", marginTop: 14 }}>← 200 OK · the prompt</div>
      <div style={{ color: "#a1a1aa" }}>{"   "}PAYMENT-RESPONSE: tx 3219a522…502b2b</div>
    </div>
  </Page>
);

const Reputation = () => (
  <Page n={8}>
    <Block top={150}>
      <div style={{ width: 760 }}>
        <Eyebrow>Key technology · reputation</Eyebrow>
        <H>
          A score that costs money to fake.{" "}
          <Grey>Agents can't read reviews. They can read refunds.</Grey>
        </H>
        <div style={{ fontSize: 24, color: GREY, marginTop: 26, lineHeight: 1.45 }}>
          Every closed escrow is a vote. Paid out counts for the seller, refunded counts against. A
          fake review is free; a refund cost the seller the sale.
        </div>
      </div>
    </Block>
    <div
      style={{
        position: "absolute",
        right: 110,
        top: 170,
        width: 860,
        display: "flex",
        flexDirection: "column",
        gap: 22,
      }}
    >
      <Panel style={{ padding: 30 }}>
        <div style={{ fontSize: 18, color: GREY }}>score = paid out ÷ (paid out + refunded)</div>
        {[
          ["Honest seller", 100, GREEN, "3 paid · 0 refunded"],
          ["Demo seller", 0, RED, "0 paid · 2 refunded"],
        ].map(([n, v, c, d]) => (
          <div key={n as string} style={{ marginTop: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22 }}>
              <b>{n}</b>
              <span style={{ color: GREY }}>
                {d} · <b style={{ color: INK }}>{v}</b>
              </span>
            </div>
            <div style={{ height: 14, borderRadius: 7, background: "#ececec", marginTop: 10 }}>
              <div
                style={{
                  width: `${Math.max(3, v as number)}%`,
                  height: 14,
                  borderRadius: 7,
                  background: c as string,
                }}
              />
            </div>
          </div>
        ))}
      </Panel>
      <div
        style={{
          borderRadius: 18,
          background: "#111114",
          padding: "24px 30px",
          fontFamily: mono,
          fontSize: 20,
          lineHeight: 1.7,
          color: "#d4d4d8",
        }}
      >
        <div style={{ color: "#c4b5fd" }}>● simpuru · search_listings minReputation: 80</div>
        <div style={{ color: "#a1a1aa" }}>
          {"  "}OYLA · 5 tADA · seller reputation 100/100 from 3 escrows
        </div>
        <div style={{ color: "#6b6b75" }}>{"  "}(sellers under 80 left out)</div>
      </div>
    </div>
  </Page>
);

const Lane = ({ label, hash, ok }: { label: string; hash: string; ok?: boolean }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "16px 0" }}>
    <span style={{ width: 140, fontSize: 20, color: GREY }}>{label}</span>
    <span
      style={{
        fontFamily: mono,
        fontSize: 22,
        padding: "10px 16px",
        borderRadius: 10,
        background: ok === undefined ? "#f6f6f6" : ok ? "#e8f6ee" : "#fbe9e9",
      }}
    >
      {hash}
    </span>
    {ok === undefined ? null : (
      <span style={{ fontSize: 22, fontWeight: 600, color: ok ? GREEN : RED }}>
        {ok ? "✓ seller paid" : "✕ arbiter refunds the buyer"}
      </span>
    )}
  </div>
);
const Protection = () => (
  <Page n={9}>
    <Block top={150}>
      <Eyebrow>Key technology · buyer protection</Eyebrow>
      <H>
        The seller commits first. <Grey>The chain settles.</Grey>
      </H>
    </Block>
    <Panel style={{ position: "absolute", left: 110, top: 400, width: 1000, padding: "20px 34px" }}>
      <Lane label="Committed" hash="c0ee84f5 89cf00aa …001fc" />
      <div style={{ height: 1, background: LINE }} />
      <Lane label="Delivered" hash="c0ee84f5 89cf00aa …001fc" ok />
      <Lane label="Delivered" hash="da7bd341 65edaa1d …e96af" ok={false} />
    </Panel>
    <div
      style={{
        position: "absolute",
        right: 110,
        top: 400,
        width: 560,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {[
        ["FundsLocked", "Masumi vested_pay, our own deployment"],
        ["ResultSubmitted", "the seller posts the delivery hash"],
        ["Withdrawn · Refunded · Disputed", "the watcher acts before the deadline"],
      ].map(([st, d], i) => (
        <div key={st} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              background: INK,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            {i + 1}
          </div>
          <div>
            <div style={{ fontFamily: mono, fontSize: 21, fontWeight: 600 }}>{st}</div>
            <div style={{ fontSize: 19, color: GREY, marginTop: 4 }}>{d}</div>
          </div>
        </div>
      ))}
    </div>
  </Page>
);

const Compare = () => {
  const cols = ["Prompt libraries", "Marketplaces", "Plain x402", "Simpuru"];
  const rows: [string, string, string, string, string][] = [
    ["Pay for one prompt", "No, monthly", "Yes", "Yes", "Yes"],
    ["Agents can buy", "No", "No", "Yes", "Yes"],
    ["Money back if nothing arrives", "Ask support", "Ask support", "No", "Automatic"],
    ["Wrong file", "Ask support", "Dispute by email", "No", "Arbiter, from hashes"],
    ["Seller trust signal", "Brand", "Star ratings", "None", "Refund-based score"],
  ];
  return (
    <Page n={10}>
      <Block top={170}>
        <Eyebrow>Our advantage</Eyebrow>
        <H>Others take the payment. We stand behind it.</H>
        <div
          style={{
            marginTop: 44,
            background: "#fff",
            borderRadius: 16,
            border: `1px solid ${LINE}`,
          }}
        >
          <div style={{ display: "flex", padding: "16px 28px", fontSize: 17, color: GREY }}>
            <span style={{ width: 470 }} />
            {cols.map((c) => (
              <span
                key={c}
                style={{
                  width: 300,
                  fontWeight: c === "Simpuru" ? 700 : 400,
                  color: c === "Simpuru" ? INK : GREY,
                }}
              >
                {c}
              </span>
            ))}
          </div>
          {rows.map((r) => (
            <div
              key={r[0]}
              style={{
                display: "flex",
                padding: "18px 28px",
                borderTop: `1px solid ${LINE}`,
                fontSize: 22,
              }}
            >
              <span style={{ width: 470, fontWeight: 600 }}>{r[0]}</span>
              <span style={{ width: 300, color: GREY }}>{r[1]}</span>
              <span style={{ width: 300, color: GREY }}>{r[2]}</span>
              <span style={{ width: 300, color: GREY }}>{r[3]}</span>
              <span style={{ width: 300, fontWeight: 600 }}>{r[4]}</span>
            </div>
          ))}
        </div>
      </Block>
    </Page>
  );
};

const WhyUs = () => (
  <Page n={11}>
    <Block top={290}>
      <Eyebrow>Why people choose it</Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 10 }}>
        <H size={60}>
          Buyers <Grey>pay for what they use and never chase a refund.</Grey>
        </H>
        <H size={60}>
          Agents <Grey>connect with one command and spend inside a budget.</Grey>
        </H>
        <H size={60}>
          Creators <Grey>sell each prompt and earn a reputation that pays.</Grey>
        </H>
      </div>
    </Block>
  </Page>
);

const Bar = ({ parts, label }: { parts: [number, string, string, string][]; label: string }) => (
  <div style={{ marginTop: 40 }}>
    <div style={{ fontSize: 22, color: GREY, marginBottom: 12 }}>{label}</div>
    <div style={{ display: "flex", height: 92, borderRadius: 16, overflow: "hidden" }}>
      {parts.map(([w, bg, fg, t]) => (
        <div
          key={t}
          style={{
            width: `${w}%`,
            background: bg,
            color: fg,
            display: "flex",
            alignItems: "center",
            padding: "0 26px",
            fontSize: 26,
            fontWeight: 600,
          }}
        >
          {t}
        </div>
      ))}
    </div>
  </div>
);
const Model = () => (
  <Page n={12}>
    <Block top={200}>
      <Eyebrow>Business model</Eyebrow>
      <H>We earn when protection does its job.</H>
      <Bar
        label="Protected sale, 5 tADA"
        parts={[
          [70, GREEN, "#fff", "3.5 tADA to the creator"],
          [30, INK, "#fff", "1.5 tADA Simpuru"],
        ]}
      />
      <Bar
        label="Instant sale, 5 tADA"
        parts={[[100, "#dfe9e3", INK, "5 tADA to the creator, no fee"]]}
      />
      <div style={{ fontSize: 22, color: GREY, marginTop: 26 }}>
        Our cut is the larger of 10% or 1.5 tADA, taken only when the escrow releases. It also pays
        the escrow fees.
      </div>
    </Block>
  </Page>
);

const Gtm = () => {
  const R = 300;
  const cx = 1420;
  const cy = 600;
  const nodes: [string, ReactNode, number][] = [
    ["Creators list prompts", <Chip key="a">no fee on instant</Chip>, -90],
    [
      "Agents and people buy",
      <div key="b" style={{ display: "flex", gap: 16 }}>
        <Logo src="logos/claude.svg" h={34} />
        <Logo src="logos/cursor.svg" h={34} />
        <Logo src="logos/mcp.svg" h={34} />
        <Img src={staticFile("masumi.webp")} style={{ height: 26 }} />
      </div>,
      30,
    ],
    ["Settled escrows build reputation", <Chip key="c">score 100</Chip>, 150],
  ];
  return (
    <Page n={13}>
      <Block top={160}>
        <div style={{ width: 760 }}>
          <Eyebrow>Go to market</Eyebrow>
          <H>Supply from creators. Demand from agents.</H>
          <div style={{ fontSize: 24, color: GREY, marginTop: 26, lineHeight: 1.5 }}>
            1. Invite prompt designers from design and AI communities.
            <br />
            2. Meet agents where they run: one MCP command in Claude Code and Cursor, and our
            coworker on Sokosumi.
            <br />
            3. Open the protection layer to other x402 sellers.
          </div>
        </div>
      </Block>
      <svg
        style={{ position: "absolute", left: 0, top: 0 }}
        width={1920}
        height={1080}
        aria-hidden="true"
      >
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke="#d6d6d6"
          strokeWidth={3}
          strokeDasharray="10 12"
        />
      </svg>
      {nodes.map(([t, extra, deg]) => {
        const a = (deg * Math.PI) / 180;
        return (
          <Panel
            key={t}
            style={{
              position: "absolute",
              left: cx + R * Math.cos(a) - 170,
              top: cy + R * Math.sin(a) - 70,
              width: 340,
              padding: "20px 24px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 600 }}>{t}</div>
            <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>{extra}</div>
          </Panel>
        );
      })}
    </Page>
  );
};

const Roadmap = () => (
  <Page n={14}>
    <Block top={290}>
      <Eyebrow>Roadmap</Eyebrow>
      <H>From prompts to anything an agent buys.</H>
      <div style={{ display: "flex", gap: 22, marginTop: 60 }}>
        <Card
          k="NOW"
          title="Live on preprod"
          body="Web shop, agent checkout over MCP, refunds, arbiter, Sokosumi coworker, all proven on chain."
        />
        <Card
          k="NEXT"
          title="Mainnet"
          body="Independent audit, a multi-key arbiter, prices in USDM next to ADA."
        />
        <Card
          k="LATER"
          title="Protection as a service"
          body="Any x402 seller lists with a commitment and inherits refunds and reputation."
        />
      </div>
    </Block>
  </Page>
);

const Traction = () => (
  <Page n={15}>
    <Block top={130}>
      <Eyebrow>Proven on Cardano preprod</Eyebrow>
      <H>Every outcome already happened on chain.</H>
    </Block>
    <div
      style={{ position: "absolute", left: 110, right: 110, top: 360, display: "flex", gap: 26 }}
    >
      {[
        [
          "Seller paid",
          "scan-lock-c.png",
          GREEN,
          "5 tADA locked, then released; creator paid 3.5 tADA",
        ],
        [
          "Buyer refunded",
          "scan-refund-c.png",
          RED,
          "wrong file: our arbiter returned 5 tADA from escrow",
        ],
        [
          "Agent hired",
          "scan-usdm-c.png",
          "#6d5dfc",
          "1 USDM paid to our coworker by another agent",
        ],
      ].map(([t, img, c, d]) => (
        <div key={t} style={{ flex: 1 }}>
          <div
            style={{
              borderRadius: 14,
              overflow: "hidden",
              border: `1px solid ${LINE}`,
              boxShadow: "0 24px 60px rgba(0,0,0,0.10)",
              height: 340,
            }}
          >
            <Img
              src={staticFile(`deck/${img}`)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "left bottom",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 22,
              fontSize: 32,
              fontWeight: 600,
            }}
          >
            <span style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
            {t}
          </div>
          <div style={{ fontSize: 20, color: GREY, marginTop: 8 }}>{d}</div>
        </div>
      ))}
    </div>
  </Page>
);

const Close = () => (
  <Page n={16} dark>
    <Block top={300}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Img src={staticFile("logo.svg")} style={{ width: 44, height: 44, filter: "invert(1)" }} />
        <span style={{ fontSize: 30, fontWeight: 600 }}>Simpuru</span>
      </div>
      <H size={140}>simpuru.xyz</H>
      <div style={{ display: "flex", gap: 80, marginTop: 70 }}>
        {[
          ["Ghoza", "Contracts, escrow, arbiter"],
          ["Kiel", "API, MCP, coworker"],
          ["Wisnu", "Web app"],
          ["Axel", "Landing page"],
        ].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{k}</div>
            <div style={{ fontSize: 18, color: GREY, marginTop: 6 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 80, marginTop: 60 }}>
        {[
          ["Try it", "app.simpuru.xyz"],
          ["Docs", "docs.simpuru.xyz"],
          ["API", "api.simpuru.xyz/docs"],
          ["Code", "github.com/Simpuru-xyz/simpuru"],
        ].map(([k, v]) => (
          <div key={k}>
            <div
              style={{ fontSize: 15, letterSpacing: 2, textTransform: "uppercase", color: GREY }}
            >
              {k}
            </div>
            <div style={{ fontSize: 22, marginTop: 8 }}>{v}</div>
          </div>
        ))}
      </div>
    </Block>
  </Page>
);

const SLIDES = [
  Cover,
  Demo,
  Problem,
  Users,
  Solution,
  Product,
  X402,
  Reputation,
  Protection,
  Compare,
  WhyUs,
  Model,
  Gtm,
  Roadmap,
  Traction,
  Close,
];
export const SLIDE_COUNT = SLIDES.length;
export const Slides = () => {
  const S = SLIDES[useCurrentFrame()];
  return S ? <S /> : null;
};
