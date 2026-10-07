import {
  AbsoluteFill,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { C, mono, RECORDINGS, short, TX } from "./theme";
import {
  Arrow,
  Browser,
  Caption,
  H,
  Kicker,
  type Line,
  Logo,
  Node,
  Rise,
  Scene,
  Spot,
  Terminal,
  Tx,
  useIn,
} from "./ui";

const center = { justifyContent: "center", alignItems: "center" } as const;

// 1. Hook ─────────────────────────────────────────────────────────────────────
export const Hook = () => {
  const frame = useCurrentFrame();
  const big = useIn(150, 18);
  return (
    <Scene dark style={center}>
      <OffthreadVideo
        src={staticFile("hero.mp4")}
        muted
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.22,
        }}
      />
      <AbsoluteFill style={{ ...center, flexDirection: "column", gap: 34 }}>
        <Rise style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <Logo size={64} invert />
          <div style={{ fontSize: 46, fontWeight: 600 }}>Simpuru</div>
        </Rise>
        <Rise delay={30}>
          <H size={70} style={{ textAlign: "center", color: "#d7d7e4" }}>
            Agents can pay on Cardano now.
            <br />
            With x402, they pay per request.
          </H>
        </Rise>
        <div style={{ opacity: big, transform: `scale(${0.9 + 0.1 * big})`, marginTop: 24 }}>
          <H size={124} style={{ textAlign: "center" }}>
            But x402 ends at the lock.
          </H>
        </div>
        <div
          style={{
            opacity: interpolate(frame, [230, 260], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            fontSize: 28,
            color: "#9b9bb0",
            maxWidth: 1250,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          "A settled masumi payment means the funds are locked in the escrow, not delivered to the
          seller." — x402 Cardano spec
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

// 2. Problem ──────────────────────────────────────────────────────────────────
export const Problem = () => (
  <Scene style={center}>
    <AbsoluteFill style={{ ...center, flexDirection: "column", gap: 70 }}>
      <Rise>
        <Kicker>The problem</Kicker>
      </Rise>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <Node title="Agent" sub="pays 5 tADA" delay={20} />
        <Arrow delay={45} width={150} label="x402" />
        <Node title="Escrow" sub="funds locked" delay={60} accent={C.violet} />
        <Arrow delay={85} width={150} label="?" />
        <Node title="Seller" sub="delivers… or not" delay={100} />
      </div>
      <div style={{ display: "flex", gap: 28 }}>
        {[
          ["Nothing arrives", 170],
          ["The wrong file arrives", 200],
          ["The deadline passes at 3 a.m.", 230],
        ].map(([t, d]) => (
          <Rise key={t as string} delay={d as number}>
            <div
              style={{
                padding: "22px 34px",
                borderRadius: 18,
                background: "#fef2f2",
                color: C.red,
                fontSize: 34,
                fontWeight: 600,
              }}
            >
              {t}
            </div>
          </Rise>
        ))}
      </div>
    </AbsoluteFill>
    <Caption delay={280}>
      Once an agent has paid, nobody checks the delivery or acts before the deadlines. A human won't
      be watching.
    </Caption>
  </Scene>
);

// 3. How it works ─────────────────────────────────────────────────────────────
export const How = () => (
  <Scene style={center}>
    <AbsoluteFill style={{ ...center, flexDirection: "column", gap: 64, paddingBottom: 80 }}>
      <Rise style={{ textAlign: "center" }}>
        <Kicker>Simpuru</Kicker>
        <H size={76} style={{ marginTop: 14 }}>
          Buyer protection, built in.
        </H>
      </Rise>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Node
          width={330}
          delay={40}
          title="1 · Seller commits"
          sub="every listing carries the SHA-256 of its content"
        />
        <Arrow delay={70} width={60} />
        <Node
          width={330}
          delay={90}
          title="2 · Pay over x402"
          sub="instantly, or into escrow (Masumi vested_pay)"
          accent={C.violet}
        />
        <Arrow delay={120} width={60} />
        <Node
          width={330}
          delay={140}
          title="3 · Watcher checks"
          sub="the delivery against the commitment, on its own"
        />
        <Arrow delay={170} width={60} />
        <Node
          width={330}
          delay={190}
          title="4 · Arbiter decides"
          sub="from on-chain evidence, not opinion"
          accent={C.amber}
        />
      </div>
      <div style={{ display: "flex", gap: 24 }}>
        {[
          ["Right delivery → seller paid", C.green, 280],
          ["Nothing by the deadline → refund", C.amber, 320],
          ["Wrong file → dispute → buyer refunded", C.red, 360],
        ].map(([t, c, d]) => (
          <Rise key={t as string} delay={d as number}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "18px 28px",
                borderRadius: 999,
                border: `2px solid ${c}`,
                fontSize: 28,
                fontWeight: 600,
              }}
            >
              <div style={{ width: 14, height: 14, borderRadius: 7, background: c as string }} />
              {t}
            </div>
          </Rise>
        ))}
      </div>
    </AbsoluteFill>
    <Caption delay={430}>
      The escrow is Masumi's vested_pay validator, unchanged, deployed with our own arbiter key.
    </Caption>
  </Scene>
);

// 4. For people ───────────────────────────────────────────────────────────────
const shot = (
  src: string,
  url: string,
  from: number,
  len: number,
  caption: string,
  spot?: { x: number; y: number; w: number; h: number },
  focus = { fx: 0.5, fy: 0.3 },
) => (
  <Sequence from={from} durationInFrames={len} key={src}>
    <AbsoluteFill style={{ ...center, paddingTop: 40, paddingBottom: 150 }}>
      <div style={{ position: "relative" }}>
        <Browser src={src} url={url} width={1280} duration={len} {...focus} />
        {spot ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 52,
              bottom: 0,
              overflow: "hidden",
              borderRadius: "0 0 18px 18px",
            }}
          >
            <Spot {...spot} delay={45} />
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
    <Caption delay={10}>{caption}</Caption>
  </Sequence>
);

export const People = () => (
  <Scene style={{ background: C.soft }}>
    <div style={{ position: "absolute", top: 34, left: 0, right: 0, textAlign: "center" }}>
      <Kicker>For people · app.simpuru.xyz</Kicker>
    </div>
    {RECORDINGS.webBuy ? (
      <Sequence durationInFrames={660}>
        <AbsoluteFill style={{ ...center, paddingTop: 40, paddingBottom: 150 }}>
          <Browser src={RECORDINGS.webBuy} url="app.simpuru.xyz" width={1280} video />
        </AbsoluteFill>
        <Caption delay={10}>
          Sign in with your Cardano wallet, fund your Simpuru wallet, buy with protection.
        </Caption>
      </Sequence>
    ) : (
      <>
        {shot(
          "app-sign-in-modal.png",
          "app.simpuru.xyz",
          0,
          210,
          "Sign in with your Cardano wallet. Your account is your wallet.",
        )}
        {shot(
          "app-account-wallet.png",
          "app.simpuru.xyz/account",
          210,
          210,
          "Simpuru gives you a wallet to spend from. Fund it with test ADA.",
          undefined,
          { fx: 0.3, fy: 0.4 },
        )}
        {shot(
          "app-listing.png",
          "app.simpuru.xyz/listings/2c913748…",
          420,
          240,
          "Buy instantly, or with protection: the money waits in escrow until the prompt checks out.",
          { x: 67.2, y: 50, w: 30.4, h: 11 },
          { fx: 0.8, fy: 0.55 },
        )}
      </>
    )}
    {shot(
      "app-timeline.png",
      "app.simpuru.xyz/purchases/3219a522…",
      660,
      300,
      "A real sale on preprod: locked, result posted, seller paid, then the creator paid. Every step links its transaction.",
      { x: 24, y: 36, w: 52, h: 46 },
      { fx: 0.4, fy: 0.55 },
    )}
  </Scene>
);

// 5. For agents ───────────────────────────────────────────────────────────────
const AGENT: Line[] = [
  { text: "$ claude mcp add --transport http simpuru https://api.simpuru.xyz/mcp", kind: "dim" },
  {
    text: "✓ Signed in with your wallet · agent spends your Simpuru wallet · max 10 tADA per purchase",
    kind: "ok",
  },
  {
    text: "Find a landing page prompt on Simpuru from a seller with a good reputation, and buy it with buyer protection.",
    kind: "prompt",
  },
  { text: '● simpuru · search_listings  query: "landing"  minReputation: 80', kind: "tool" },
  {
    text: "  OYLA · Landing Page · 5 tADA · instant, protected · seller reputation 100%",
    kind: "out",
  },
  { text: '● simpuru · buy_listing  id: "2c913748…"  mode: "protected"', kind: "tool" },
  { text: `  paid 5 tADA into escrow · tx ${short(TX.oylaLock)}`, kind: "out" },
  { text: "  content matches the hash the seller committed to ✓", kind: "ok" },
  {
    text: "Bought OYLA with buyer protection. If the seller doesn't post the result in time, or posts the wrong one, the escrow refunds you automatically.",
    kind: "agent",
  },
  { text: "Buy it again.", kind: "prompt" },
  { text: '● simpuru · buy_listing  id: "2c913748…"', kind: "tool" },
  { text: "  alreadyPaid: true · paidNow: 0 tADA", kind: "ok" },
];

export const Agents = () => (
  <Scene dark style={center}>
    <div style={{ position: "absolute", top: 34, left: 0, right: 0, textAlign: "center" }}>
      <Kicker dark>For agents · one MCP endpoint</Kicker>
    </div>
    <AbsoluteFill style={{ ...center, paddingBottom: 90 }}>
      {RECORDINGS.claudeCode ? (
        <Browser src={RECORDINGS.claudeCode} url="Claude Code" width={1500} video />
      ) : (
        <Terminal lines={AGENT} start={15} cps={70} title="claude · Simpuru MCP" />
      )}
    </AbsoluteFill>
    <Caption dark delay={20}>
      Your agent shops from the same wallet, inside the limits you set. It never pays twice.
    </Caption>
  </Scene>
);

// 6. Protection on chain ──────────────────────────────────────────────────────
const Column = ({
  title,
  color,
  delay,
  items,
}: {
  title: string;
  color: string;
  delay: number;
  items: [string, string, string?][];
}) => (
  <div style={{ width: 590, display: "flex", flexDirection: "column", gap: 14 }}>
    <Rise delay={delay}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontSize: 36,
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        <div style={{ width: 18, height: 18, borderRadius: 9, background: color }} />
        {title}
      </div>
    </Rise>
    {items.map(([label, hash, c], i) => (
      <Tx
        key={hash}
        dark
        label={label}
        hash={hash}
        color={c ?? "#8a8aa3"}
        delay={delay + 25 + i * 22}
      />
    ))}
  </div>
);

export const Protection = () => (
  <Scene dark>
    <AbsoluteFill style={{ ...center, flexDirection: "column", gap: 56, paddingBottom: 110 }}>
      <Rise style={{ textAlign: "center" }}>
        <Kicker dark>Every path, on Cardano preprod</Kicker>
        <H size={68} style={{ marginTop: 14 }}>
          Real transactions, not a mock-up.
        </H>
      </Rise>
      <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
        <Column
          title="Honest seller"
          color={C.green}
          delay={40}
          items={[
            ["Locked in escrow", TX.oylaLock],
            ["Result posted", TX.oylaResult],
            ["Seller paid", TX.oylaWithdraw, C.green],
            ["Creator paid 3.5 tADA", TX.creatorPaid, C.green],
          ]}
        />
        <Column
          title="Nothing delivered"
          color={C.amber}
          delay={170}
          items={[["No result in time: refunded", TX.noDeliveryRefund, C.amber]]}
        />
        <Column
          title="Wrong file"
          color={C.red}
          delay={260}
          items={[
            ["Locked in escrow", TX.wrongLock],
            ["Wrong result posted", TX.wrongResult, C.red],
            ["Watcher opens a dispute", TX.dispute, C.amber],
            ["Arbiter refunds the buyer", TX.arbiterRefund, C.green],
          ]}
        />
      </div>
    </AbsoluteFill>
    <Caption dark delay={420}>
      The watcher refunds or disputes on its own. The arbiter checks three hashes the seller can't
      change.
    </Caption>
  </Scene>
);

// 7. Agent to agent (Masumi) ──────────────────────────────────────────────────
export const Coworker = () => (
  <Scene style={center}>
    <AbsoluteFill style={{ ...center, flexDirection: "column", gap: 54, paddingBottom: 110 }}>
      <Rise style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <Img src={staticFile("masumi.webp")} style={{ height: 54 }} />
        <H size={64}>Agent to agent: Simpuru Shopper on Sokosumi</H>
      </Rise>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Node title="Sokosumi user" sub="writes a Task" delay={30} width={300} />
        <Arrow delay={60} width={190} label="1 USDM · Masumi escrow" />
        <Node
          title="Simpuru Shopper"
          sub="Masumi Coworker, our payment node"
          delay={80}
          width={360}
          accent={C.violet}
        />
        <Arrow delay={110} width={190} label="5 tADA · our escrow" />
        <Node
          title="Creator"
          sub="paid when it checks out"
          delay={130}
          width={300}
          accent={C.green}
        />
      </div>
      <div style={{ display: "flex", gap: 40 }}>
        <div style={{ width: 700, display: "flex", flexDirection: "column", gap: 12 }}>
          <Tx label="1 USDM locked for the job" hash={TX.usdmLock} delay={190} color={C.violet} />
          <Tx label="Result hash posted" hash={TX.usdmResult} delay={215} color={C.violet} />
          <Tx label="Shopper's fee collected" hash={TX.usdmPaid} delay={240} />
        </div>
        <div style={{ width: 700, display: "flex", flexDirection: "column", gap: 12 }}>
          <Tx label="Shopper buys OYLA, protected" hash={TX.oylaLock} delay={265} color={C.ink} />
          <Tx label="Seller paid" hash={TX.oylaWithdraw} delay={290} />
          <Tx label="Creator paid" hash={TX.creatorPaid} delay={315} />
        </div>
      </div>
      {RECORDINGS.sokosumi ? (
        <div style={{ position: "absolute", right: 60, top: 40, width: 520 }}>
          <Browser src={RECORDINGS.sokosumi} url="preprod.sokosumi.com" width={520} video />
        </div>
      ) : null}
    </AbsoluteFill>
    <Caption delay={340}>Hired in USDM, buys in ADA, both escrows settled on preprod.</Caption>
  </Scene>
);

// 8. Close ────────────────────────────────────────────────────────────────────
export const Close = () => (
  <Scene dark style={center}>
    <AbsoluteFill style={{ ...center, flexDirection: "column", gap: 48 }}>
      <Rise style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <Logo size={92} invert />
        <div style={{ fontSize: 96, fontWeight: 600, letterSpacing: -3 }}>Simpuru</div>
      </Rise>
      <Rise delay={20}>
        <div style={{ fontSize: 44, color: "#d7d7e4", textAlign: "center" }}>
          Buyer protection for agents paying with x402 on Cardano.
        </div>
      </Rise>
      <div style={{ display: "flex", gap: 30 }}>
        {[
          ["17–31 s", "instant, pay → content"],
          ["30–50 s", "protected, pay → content"],
          ["0.40 tADA", "per escrow transaction"],
        ].map(([a, b], i) => (
          <Rise key={a} delay={50 + i * 15}>
            <div
              style={{
                width: 360,
                padding: "26px 30px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div style={{ fontSize: 50, fontWeight: 600 }}>{a}</div>
              <div style={{ fontSize: 24, color: "#a5a5bd", marginTop: 6 }}>{b}</div>
            </div>
          </Rise>
        ))}
      </div>
      <Rise delay={110} style={{ display: "flex", gap: 50, alignItems: "center", opacity: 0.9 }}>
        {[
          ["cardano.svg", "grayscale(1) brightness(1.8)"],
          ["x402.svg", "grayscale(1) invert(1)"],
          ["masumi.webp", "grayscale(1) invert(1)"],
          ["blockfrost.svg", "grayscale(1) brightness(1.8)"],
        ].map(([f, filter]) => (
          <Img key={f} src={staticFile(f)} style={{ height: 48, filter }} />
        ))}
      </Rise>
      <Rise delay={140}>
        <div style={{ fontFamily: mono, fontSize: 30, color: "#c4b5fd" }}>
          simpuru.xyz · app.simpuru.xyz · api.simpuru.xyz/docs
        </div>
      </Rise>
      <Rise delay={160}>
        <div style={{ fontSize: 24, color: "#9b9bb0" }}>
          Live on Cardano preprod · test ADA only
        </div>
      </Rise>
    </AbsoluteFill>
  </Scene>
);
