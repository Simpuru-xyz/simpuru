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
    <Block top={300}>
      <Eyebrow>Who it's for</Eyebrow>
      <H>Three people, one shop.</H>
      <div style={{ display: "flex", gap: 22, marginTop: 60 }}>
        <Card
          k="BUYERS"
          title="Builders and founders"
          body="Need one great landing page, not a yearly plan. Pay for the prompt they use."
        />
        <Card
          k="AGENTS"
          title="Claude, Cursor, any MCP agent"
          body="Shop on their owner's behalf, inside a budget, without a card or an account."
        />
        <Card
          k="CREATORS"
          title="Prompt designers"
          body="Sell each prompt on its own, get paid in ADA, and build a reputation buyers can trust."
        />
      </div>
    </Block>
  </Page>
);

const Solution = () => (
  <Page n={5}>
    <Block top={300}>
      <Eyebrow>The solution</Eyebrow>
      <H>
        Buy one prompt at a time.
        <br />
        <Grey>Protection comes with every purchase.</Grey>
      </H>
      <div style={{ display: "flex", gap: 22, marginTop: 60 }}>
        <Card
          k="01"
          title="Pay per item"
          body="One x402 payment in ADA, from a person or an agent."
        />
        <Card k="02" title="Held in escrow" body="The money waits until the delivery checks out." />
        <Card
          k="03"
          title="Refunded on its own"
          body="Nothing arrives, or the wrong file does: the buyer gets it back."
        />
        <Card
          k="04"
          title="Earned reputation"
          body="Every seller's score comes from how their escrows ended."
        />
      </div>
    </Block>
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
    <Block top={260}>
      <Eyebrow>Key technology · x402</Eyebrow>
      <H>
        Payment is part of the request.
        <br />
        <Grey>That's what lets an agent buy.</Grey>
      </H>
      <div style={{ display: "flex", gap: 22, marginTop: 56 }}>
        <Card
          k="WHAT"
          title="HTTP 402, answered"
          body="The shop replies 402 with a price. The agent signs a Cardano payment and asks again. Content comes back."
        />
        <Card
          k="WHY"
          title="No account, no API key"
          body="An agent can't fill a sign-up form or hold a card. It can sign a transaction."
        />
        <Card
          k="HOW WE USE IT"
          title="Two paths"
          body="Instant pays the creator directly. Protected (masumi) locks the payment in escrow."
        />
      </div>
    </Block>
  </Page>
);

const Reputation = () => (
  <Page n={8}>
    <Block top={260}>
      <Eyebrow>Key technology · reputation</Eyebrow>
      <H>
        A score that costs money to fake.
        <br />
        <Grey>Agents can't read reviews. They can read refunds.</Grey>
      </H>
      <div style={{ display: "flex", gap: 22, marginTop: 56 }}>
        <Card
          k="WHERE IT COMES FROM"
          title="Closed escrows"
          body="Seller score = paid out ÷ (paid out + refunded), from on-chain outcomes."
        />
        <Card
          k="WHERE IT SHOWS"
          title="Catalogue and MCP"
          body="On every listing, and as a filter agents use: find prompts from sellers above 80."
        />
        <Card
          k="WHY IT MATTERS"
          title="Stars are cheap"
          body="A fake review is free. A refund means the seller lost the sale. The score can't be bought."
        />
      </div>
    </Block>
  </Page>
);

const Protection = () => (
  <Page n={9}>
    <Block top={260}>
      <Eyebrow>Key technology · buyer protection</Eyebrow>
      <H>
        The seller commits first. <Grey>The chain settles.</Grey>
      </H>
      <div style={{ display: "flex", gap: 22, marginTop: 56 }}>
        {[
          [
            "sha256",
            "Commit",
            "Each listing carries the hash of its content, fixed before anyone pays.",
          ],
          ["escrow", "Lock", "Masumi vested_pay, our own deployment, holds the payment."],
          ["watcher", "Check", "Compares the delivery with the hash and acts before the deadline."],
          ["arbiter", "Decide", "Pays the seller if it matches, the buyer if it doesn't."],
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

const Model = () => (
  <Page n={12}>
    <Block top={320}>
      <Eyebrow>Business model</Eyebrow>
      <H>We earn when protection does its job.</H>
      <div style={{ display: "flex", gap: 22, marginTop: 60 }}>
        <Stat
          v="10%"
          label="of a protected sale, at least 1.5 tADA, taken when the escrow releases"
        />
        <Stat v="0%" label="on instant sales, paid straight to the creator" />
        <Stat v="3.5 tADA" label="to the creator on a 5 tADA protected sale, automatically" />
      </div>
    </Block>
  </Page>
);

const Gtm = () => (
  <Page n={13}>
    <Block top={260}>
      <Eyebrow>Go to market</Eyebrow>
      <H>Supply from creators. Demand from agents.</H>
      <div style={{ display: "flex", gap: 22, marginTop: 56 }}>
        <Card
          k="1 · SUPPLY"
          title="Creators first"
          body="Invite prompt designers from design and AI communities. No fee on instant sales while the catalogue grows."
        />
        <Card
          k="2 · DEMAND"
          title="Where agents live"
          body="One MCP command in Claude Code and Cursor, plus our coworker on Sokosumi, Masumi's agent marketplace."
        />
        <Card
          k="3 · EXPAND"
          title="Protection for any seller"
          body="Open the escrow and reputation layer to other x402 sellers: APIs, datasets, files."
        />
      </div>
    </Block>
  </Page>
);

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
    <Block top={300}>
      <Eyebrow>Proven on Cardano preprod</Eyebrow>
      <H>Every outcome already happened on chain.</H>
      <div style={{ display: "flex", gap: 22, marginTop: 60 }}>
        <Stat v="Paid" label="honest seller paid, creator paid 3.5 tADA automatically" />
        <Stat v="Refunded" label="nothing delivered, buyer refunded with no human involved" />
        <Stat v="Arbitrated" label="wrong file, our arbiter refunded the buyer from the hashes" />
        <Stat v="1 USDM" label="earned by our coworker, hired by another agent on Sokosumi" />
      </div>
    </Block>
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
