// The pitch deck. Plain on purpose: short claims, real screenshots, real explorer pages, a table of
// transactions, and what isn't trustless yet. The film plays on slide 2. deck/build.py makes the .pptx.
import type { ReactNode } from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { mono, sans, TX } from "./theme";
import TXS from "./txs.json";

const BG = "#f2f2f2";
const INK = "#111111";
const GREY = "#8a8a8a";
const LINE = "#e4e4e4";
const N = 15;

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
const Stat = ({ v, label }: { v: string; label: string }) => (
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
const short = (h: string) => `${h.slice(0, 10)}…${h.slice(-6)}`;

const Cover = () => (
  <Page n={1}>
    <Block top={340}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Img src={staticFile("logo.svg")} style={{ width: 44, height: 44 }} />
        <span style={{ fontSize: 30, fontWeight: 600 }}>Simpuru</span>
      </div>
      <H size={104}>
        Buyer protection for agents
        <br />
        that pay over x402.
      </H>
      <div style={{ fontSize: 22, color: GREY, marginTop: 28 }}>
        Built on Cardano preprod with Masumi escrow
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
    <Block top={330}>
      <Eyebrow>The problem</Eyebrow>
      <H>An x402 escrow payment stops at the lock.</H>
      <H size={86}>
        Nobody checks the delivery. <Grey>The deadline passes either way.</Grey>
      </H>
    </Block>
  </Page>
);

const Solution = () => (
  <Page n={4}>
    <Block top={300}>
      <Eyebrow>The solution</Eyebrow>
      <H>
        The seller commits first.
        <br />
        The chain settles the rest.
      </H>
      <div style={{ display: "flex", gap: 22, marginTop: 64 }}>
        <Card k="01" title="Commit" body="Every listing carries the SHA-256 of what it sells." />
        <Card k="02" title="Pay" body="One x402 payment, instant or into escrow." />
        <Card k="03" title="Check" body="A watcher compares the delivery with the commitment." />
        <Card k="04" title="Settle" body="Paid, refunded, or decided by the arbiter." />
      </div>
    </Block>
  </Page>
);

const Product = () => (
  <Page n={5}>
    <Block top={110}>
      <div style={{ textAlign: "center" }}>
        <Eyebrow>app.simpuru.xyz</Eyebrow>
        <H>Every figure read live off the chain.</H>
      </div>
      <div style={{ display: "flex", gap: 26, justifyContent: "center", marginTop: 50 }}>
        <Shot src="app-purchase-timeline-c.png" w={640} />
        <Shot src="app-agents-signed-in-c.png" w={640} />
      </div>
    </Block>
  </Page>
);

const SignIn = () => (
  <Page n={6}>
    <Block top={290}>
      <div style={{ width: 640 }}>
        <Eyebrow>One account, on preprod, today</Eyebrow>
        <H>Your wallet is the account.</H>
        <div style={{ fontSize: 24, color: GREY, marginTop: 22, lineHeight: 1.45 }}>
          One signature, no email, no password. Simpuru gives the account a wallet that you and your
          agents spend from, inside your limits.
        </div>
      </div>
    </Block>
    <div style={{ position: "absolute", right: 110, top: 200 }}>
      <Shot src="app-sign-in-modal.png" w={1000} h={562} />
    </div>
  </Page>
);

const Money = () => (
  <Page n={7}>
    <Block top={330}>
      <Eyebrow>One protected sale, on preprod</Eyebrow>
      <H>Locked in our escrow. Paid to the creator.</H>
      <div style={{ display: "flex", gap: 22, marginTop: 60 }}>
        <Stat v="5 tADA" label="locked in escrow until the delivery checks out" />
        <Stat v="3.5 tADA" label="paid to the creator when the escrow released" />
        <Stat v="0.40 tADA" label="per escrow transaction, with a reference script" />
      </div>
    </Block>
  </Page>
);

const Explorer = ({
  n,
  eyebrow,
  title,
  src,
  caption,
}: {
  n: number;
  eyebrow: string;
  title: string;
  src: string;
  caption: string;
}) => (
  <Page n={n}>
    <Block top={100}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <H>{title}</H>
      <div style={{ marginTop: 34 }}>
        <Shot src={src} w={1180} />
      </div>
      <div style={{ fontFamily: mono, fontSize: 17, color: GREY, marginTop: 18 }}>{caption}</div>
    </Block>
  </Page>
);

const Arbiter = () => (
  <Page n={9}>
    <Block top={300}>
      <Eyebrow>Simpuru arbiter</Eyebrow>
      <H>How a wrong file becomes a refund.</H>
      <div style={{ display: "flex", gap: 22, marginTop: 60 }}>
        {[
          ["input_hash", "Locked", "Bound to the listing and its content hash at payment."],
          ["result_hash", "Posted", "The seller posts what it delivered, on chain."],
          ["sha256", "Compared", "Delivery against the listing. They don't match."],
          ["refund()", "Settled", "The arbiter pays the buyer back after the window."],
        ].map(([code, t, b]) => (
          <div
            key={code}
            style={{
              flex: 1,
              background: "#fff",
              borderRadius: 16,
              border: `1px solid ${LINE}`,
              padding: "26px 28px 30px",
            }}
          >
            <div style={{ fontSize: 15, color: GREY, letterSpacing: 1.5, fontFamily: mono }}>
              {code}
            </div>
            <div style={{ fontSize: 34, fontWeight: 600, marginTop: 10 }}>{t}</div>
            <div style={{ fontSize: 20, color: GREY, marginTop: 10, lineHeight: 1.4 }}>{b}</div>
          </div>
        ))}
      </div>
    </Block>
  </Page>
);

const Cycle = () => {
  const rows: [string, string][] = [
    ["Protected buy, 5 tADA locked", TX.oylaLock],
    ["Seller agent posts the result", TX.oylaResult],
    ["Seller agent withdraws", TX.oylaWithdraw],
    ["Creator paid 3.5 tADA", TX.creatorPaid],
    [
      "Never delivered: refunded",
      "39e9af4ee93160e5813128330e6115a659f1e727bd2cc985aa44110be8b1e221",
    ],
    ["Wrong file: disputed", TX.dispute],
    ["Wrong file: arbiter refunds the buyer", TX.arbiterRefund],
  ];
  return (
    <Page n={11}>
      <Block top={190}>
        <Eyebrow>Verified end to end</Eyebrow>
        <H>Every outcome, a transaction.</H>
        <div
          style={{
            marginTop: 44,
            background: "#fff",
            borderRadius: 16,
            border: `1px solid ${LINE}`,
          }}
        >
          {rows.map(([label, h], i) => (
            <div
              key={h}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "18px 28px",
                borderTop: i ? `1px solid ${LINE}` : "none",
                fontSize: 22,
              }}
            >
              <span>{label}</span>
              <span style={{ fontFamily: mono, color: GREY }}>{short(h)}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 17, color: GREY, marginTop: 16 }}>
          All on preprod.cardanoscan.io and preprod.cexplorer.io
        </div>
      </Block>
    </Page>
  );
};

const Honest = () => (
  <Page n={13}>
    <Block top={290}>
      <Eyebrow>What is not trustless</Eyebrow>
      <H>Three places. We say them first.</H>
      <div style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 20 }}>
        <H size={60}>
          The arbiter <Grey>is one key, ours, for now.</Grey>
        </H>
        <H size={60}>
          Creator sales <Grey>settle through our seller wallet.</Grey>
        </H>
        <H size={60}>
          Preprod only. <Grey>No audit yet.</Grey>
        </H>
      </div>
    </Block>
  </Page>
);

const Live = () => (
  <Page n={14}>
    <Block top={340}>
      <Eyebrow>Live on preprod</Eyebrow>
      <div style={{ display: "flex", gap: 22, marginTop: 30 }}>
        <Stat v={String(TXS.length)} label="transactions in our receipts" />
        <Stat v="4" label="services on our VPS: API, arbiter, coworker, payment node" />
        <Stat v="2" label="front ends on Vercel" />
        <Stat v="7" label="MCP tools for agents" />
      </div>
      <div style={{ fontSize: 20, color: GREY, marginTop: 30 }}>
        Every endpoint documented in Swagger at api.simpuru.xyz/docs
      </div>
    </Block>
  </Page>
);

const Close = () => (
  <Page n={15} dark>
    <Block top={330}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Img src={staticFile("logo.svg")} style={{ width: 44, height: 44, filter: "invert(1)" }} />
        <span style={{ fontSize: 30, fontWeight: 600 }}>Simpuru</span>
      </div>
      <H size={140}>simpuru.xyz</H>
      <div style={{ display: "flex", gap: 80, marginTop: 70 }}>
        {[
          ["Try it", "app.simpuru.xyz"],
          ["Docs", "api.simpuru.xyz/docs"],
          ["Code", "github.com/Simpuru-xyz/simpuru"],
          ["Agents", "claude mcp add … /mcp"],
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
  Solution,
  Product,
  SignIn,
  Money,
  () => (
    <Explorer
      n={8}
      eyebrow="On Cardano's explorer"
      title="The escrow, verified."
      src="scan-lock-c.png"
      caption={`${short(TX.oylaLock)} · 5.00 ₳ to addr_test1w…rk9ksc7d963, our vested_pay deployment`}
    />
  ),
  Arbiter,
  () => (
    <Explorer
      n={10}
      eyebrow="On Cardano's explorer"
      title="The refund, verified."
      src="scan-refund-c.png"
      caption={`${short(TX.arbiterRefund)} · 5.00 ₳ out of escrow, back to the buyer`}
    />
  ),
  Cycle,
  () => (
    <Explorer
      n={12}
      eyebrow="Agent to agent · Masumi"
      title="Hired on Sokosumi. Paid in USDM."
      src="scan-usdm-c.png"
      caption={`${short(TX.usdmPaid)} · 1 tUSDM released from Masumi escrow to our coworker's seller wallet`}
    />
  ),
  Honest,
  Live,
  Close,
];
export const SLIDE_COUNT = SLIDES.length;
export const Slides = () => {
  const S = SLIDES[useCurrentFrame()];
  return S ? <S /> : null;
};
