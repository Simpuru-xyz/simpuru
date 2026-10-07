// The app (app.simpuru.xyz) rebuilt as animated components, driven by a cursor. Same look as the real
// UI: Inter, black and white, pill buttons, the yellow testnet badge.
import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { C, mono, sans, short, TX } from "./theme";

const W = 1440;
const H = 810;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);
/** 0→1 between frames a and b (eased). */
const t = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { ...clamp, easing: ease });

/** A listing's real preview (the creator's own media, as on app.simpuru.xyz). */
const Media = ({ src, style }: { src: string; style?: CSSProperties }) =>
  src.endsWith(".mp4") ? (
    <OffthreadVideo
      src={staticFile(src)}
      muted
      style={{ width: "100%", height: "100%", objectFit: "cover", ...style }}
    />
  ) : (
    <Img
      src={staticFile(src)}
      style={{ width: "100%", height: "100%", objectFit: "cover", ...style }}
    />
  );

const Pill = ({
  children,
  dark,
  style,
}: {
  children: ReactNode;
  dark?: boolean;
  style?: CSSProperties;
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      height: 44,
      padding: "0 22px",
      borderRadius: 999,
      fontSize: 17,
      fontWeight: 500,
      background: dark ? C.ink : "#fff",
      color: dark ? "#fff" : C.ink,
      border: dark ? "none" : `1px solid ${C.line}`,
      ...style,
    }}
  >
    {children}
  </div>
);

const Badge = () => (
  <div
    style={{
      height: 32,
      padding: "0 14px",
      borderRadius: 999,
      background: "#fffbea",
      border: "1px solid #f5d76e",
      color: "#7a5b00",
      fontSize: 14,
      fontWeight: 500,
      display: "flex",
      alignItems: "center",
    }}
  >
    Testnet · preprod
  </div>
);

const Nav = ({
  signedIn,
  balance,
  active,
}: {
  signedIn: number;
  balance: number;
  active?: string;
}) => (
  <div
    style={{
      height: 72,
      display: "flex",
      alignItems: "center",
      padding: "0 36px",
      borderBottom: `1px solid ${C.line}`,
      background: "#fff",
    }}
  >
    <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5, width: 400 }}>Simpuru</div>
    <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 8 }}>
      {["Catalogue", "Sell", "Agents"].map((l) => (
        <div
          key={l}
          style={{
            padding: "8px 16px",
            borderRadius: 999,
            fontSize: 16,
            background: active === l ? C.soft : "transparent",
            fontWeight: active === l ? 500 : 400,
          }}
        >
          {l}
        </div>
      ))}
    </div>
    <div
      style={{
        width: 400,
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 12,
        whiteSpace: "nowrap",
      }}
    >
      <Badge />
      {signedIn < 0.5 ? (
        <Pill dark style={{ height: 40, opacity: 1 - signedIn * 2 }}>
          Sign in
        </Pill>
      ) : (
        <div
          style={{
            height: 42,
            padding: "0 14px 0 6px",
            borderRadius: 999,
            border: `1px solid ${C.line}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            opacity: (signedIn - 0.5) * 2,
            transform: `scale(${0.9 + (signedIn - 0.5) * 0.2})`,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              background: "linear-gradient(135deg,#7c3aed,#a855f7)",
            }}
          />
          <span style={{ fontFamily: mono, fontSize: 14, color: C.muted }}>addr_test1…wjjg</span>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{balance.toFixed(0)} tADA</span>
        </div>
      )}
    </div>
  </div>
);

const Card = ({
  title,
  sub,
  price,
  p,
  protectedMode = true,
  hover = 0,
  media,
}: {
  title: string;
  sub: string;
  price: string;
  p: number;
  protectedMode?: boolean;
  hover?: number;
  media: string;
}) => (
  <div style={{ width: 360, opacity: p, transform: `translateY(${(1 - p) * 30 - hover * 6}px)` }}>
    <div
      style={{
        height: 270,
        borderRadius: 18,
        overflow: "hidden",
        background: C.soft,
        position: "relative",
        boxShadow: hover ? "0 18px 40px rgba(0,0,0,0.18)" : "none",
      }}
    >
      <Media src={media} />
      {protectedMode ? (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            padding: "5px 12px",
            borderRadius: 999,
            background: "rgba(0,0,0,0.55)",
            color: "#fff",
            fontSize: 13,
          }}
        >
          Protected
        </div>
      ) : null}
    </div>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginTop: 12,
        fontSize: 18,
        fontWeight: 600,
      }}
    >
      <span>{title}</span>
      <span>{price}</span>
    </div>
    <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>{sub}</div>
  </div>
);

/** Catalogue page. */
const Catalogue = ({ f, hoverCard }: { f: number; hoverCard: number }) => (
  <div style={{ padding: "28px 36px" }}>
    <div
      style={{
        height: 190,
        borderRadius: 24,
        background: "#000",
        color: "#fff",
        padding: "40px 44px",
        opacity: t(f, 0, 12),
        transform: `translateY(${(1 - t(f, 0, 12)) * 20}px)`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -80,
          top: -60,
          width: 520,
          height: 520,
          borderRadius: 260,
          background: "radial-gradient(circle, rgba(124,58,237,0.45), transparent 65%)",
        }}
      />
      <div
        style={{
          fontSize: 46,
          fontWeight: 600,
          letterSpacing: -1.5,
          lineHeight: 1.05,
          maxWidth: 640,
        }}
      >
        Design prompts you and your agents can buy.
      </div>
      <div
        style={{ fontSize: 17, color: "#c9c9d6", marginTop: 16, maxWidth: 560, lineHeight: 1.45 }}
      >
        Pay once in tADA on Cardano. Protected buys wait in escrow until delivery checks out.
      </div>
    </div>
    <div style={{ display: "flex", gap: 24, marginTop: 30 }}>
      <Card
        title="OYLA"
        sub="Landing Page · 100% · 3 sold"
        price="5 tADA"
        p={t(f, 8, 22)}
        hover={hoverCard}
        media="oyla.mp4"
      />
      <Card
        title="3D Collectible Hero"
        sub="3D · new"
        price="1 tADA"
        p={t(f, 12, 26)}
        protectedMode={false}
        media="hero3d.webp"
      />
    </div>
  </div>
);

const Modal = ({
  p,
  children,
  width = 460,
}: {
  p: number;
  children: ReactNode;
  width?: number;
}) => (
  <AbsoluteFill
    style={{
      background: `rgba(255,255,255,${0.7 * p})`,
      backdropFilter: `blur(${6 * p}px)`,
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <div
      style={{
        width,
        padding: 26,
        borderRadius: 20,
        background: "#fff",
        border: `1px solid ${C.line}`,
        boxShadow: "0 30px 80px rgba(0,0,0,0.18)",
        opacity: p,
        transform: `scale(${0.94 + 0.06 * p})`,
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

const SignIn = ({ f }: { f: number }) => (
  <>
    <div style={{ fontSize: 21, fontWeight: 600 }}>Sign in with your Cardano wallet</div>
    <div style={{ fontSize: 15, color: C.muted, marginTop: 10, lineHeight: 1.45 }}>
      Your wallet signs a one-time message to prove it's yours. No funds move. Set the wallet to
      preprod.
    </div>
    {["Eternl", "Lace"].map((w, i) => (
      <div
        key={w}
        style={{
          marginTop: i ? 10 : 18,
          height: 50,
          borderRadius: 14,
          border: `1px solid ${i === 0 && f > 0 ? C.ink : C.line}`,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 12,
          fontSize: 16,
          background: i === 0 && f > 0 ? C.soft : "#fff",
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 7,
            background:
              i === 0
                ? "linear-gradient(135deg,#f472b6,#fb923c)"
                : "linear-gradient(135deg,#22d3ee,#6366f1)",
          }}
        />
        {w}
        <span style={{ marginLeft: "auto", fontSize: 13, color: C.muted }}>preprod</span>
      </div>
    ))}
  </>
);

/** The wallet extension's sign request, top right like a real popup. */
const WalletPopup = ({ p, pressed }: { p: number; pressed: number }) => (
  <div
    style={{
      position: "absolute",
      top: 86,
      right: 30,
      width: 330,
      borderRadius: 18,
      background: "#16161c",
      color: "#fff",
      padding: 22,
      boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
      opacity: p,
      transform: `translateY(${(1 - p) * -16}px)`,
      fontFamily: sans,
    }}
  >
    <div style={{ fontSize: 13, color: "#9a9aa8" }}>Wallet · Pre-Production testnet</div>
    <div style={{ fontSize: 19, fontWeight: 600, marginTop: 10 }}>Sign data request</div>
    <div style={{ fontSize: 14, color: "#b9b9c6", marginTop: 8, lineHeight: 1.45 }}>
      app.simpuru.xyz asks you to sign a message. This doesn't send any funds.
    </div>
    <div
      style={{
        marginTop: 12,
        padding: "10px 12px",
        borderRadius: 10,
        background: "#22222b",
        fontFamily: mono,
        fontSize: 12,
        color: "#c4b5fd",
      }}
    >
      simpuru:signin:v1 · 9f2c…41ab
    </div>
    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
      <div
        style={{
          flex: 1,
          height: 40,
          borderRadius: 10,
          background: "#2a2a33",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
        }}
      >
        Cancel
      </div>
      <div
        style={{
          flex: 1,
          height: 40,
          borderRadius: 10,
          background: "#f472b6",
          color: "#111",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          transform: `scale(${1 - pressed * 0.06})`,
        }}
      >
        Sign
      </div>
    </div>
  </div>
);

const Toast = ({ p, children }: { p: number; children: ReactNode }) => (
  <div
    style={{
      position: "absolute",
      bottom: 30,
      left: "50%",
      transform: `translate(-50%, ${(1 - p) * 30}px)`,
      opacity: p,
      padding: "14px 22px",
      borderRadius: 14,
      background: C.ink,
      color: "#fff",
      fontSize: 16,
      fontWeight: 500,
      display: "flex",
      gap: 10,
      alignItems: "center",
    }}
  >
    {children}
  </div>
);

/** Listing page with the buy panel. `buy`: 0 idle, 0..1 paying, 1 done. */
const Listing = ({
  f,
  pressed,
  paying,
  done,
}: {
  f: number;
  pressed: number;
  paying: number;
  done: number;
}) => (
  <div
    style={{
      display: "flex",
      gap: 40,
      padding: "30px 36px",
      opacity: t(f, 0, 10),
      transform: `translateX(${(1 - t(f, 0, 10)) * 40}px)`,
    }}
  >
    <div
      style={{ width: 760, height: 640, borderRadius: 24, overflow: "hidden", background: C.soft }}
    >
      <Media src="oyla.mp4" />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 14, color: C.muted }}>Catalogue / Landing Page</div>
      <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: -1, marginTop: 6 }}>OYLA</div>
      <div style={{ fontSize: 18, color: C.muted, marginTop: 4 }}>Ecommerce landing page</div>
      <div style={{ fontSize: 34, fontWeight: 600, marginTop: 22 }}>5 tADA</div>
      <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>
        Pay once over x402, reuse it after.
      </div>
      <Pill style={{ width: "100%", marginTop: 22, height: 52 }}>Buy instant · 5 tADA</Pill>
      <div style={{ fontSize: 13, color: C.muted, textAlign: "center", marginTop: 6 }}>
        Paid to the seller now.
      </div>
      <div
        style={{
          position: "relative",
          marginTop: 12,
          height: 54,
          borderRadius: 999,
          background: C.ink,
          color: "#fff",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 17,
          fontWeight: 500,
          transform: `scale(${1 - pressed * 0.04})`,
        }}
      >
        {paying > 0 && done < 1 ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${paying * 100}%`,
              background: "#3f3f46",
            }}
          />
        ) : null}
        <span style={{ position: "relative" }}>
          {done >= 1
            ? "Open"
            : paying > 0
              ? "Paying on Cardano… locking in escrow"
              : "Buy with protection · 5 tADA"}
        </span>
      </div>
      <div style={{ fontSize: 13, color: C.muted, textAlign: "center", marginTop: 6 }}>
        Held in escrow until the delivery is checked; refunded if it fails.
      </div>
      <div style={{ display: "flex", gap: 40, marginTop: 22, fontSize: 14, color: C.muted }}>
        <div>
          Sold<div style={{ fontSize: 18, color: C.ink, fontWeight: 600 }}>3</div>
        </div>
        <div>
          Seller reputation<div style={{ fontSize: 18, color: C.ink, fontWeight: 600 }}>100%</div>
        </div>
      </div>
    </div>
  </div>
);

const Bought = ({ f }: { f: number }) => {
  // First line of the real prompt; the rest stays blurred (it's the creator's paid content).
  const lines = ["Build a luxury handcrafted jewelry landing page…", "blur-1", "blur-2"];
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            background: C.green,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
          }}
        >
          ✓
        </div>
        <div style={{ fontSize: 21, fontWeight: 600 }}>You bought OYLA</div>
      </div>
      <div
        style={{
          marginTop: 14,
          padding: 16,
          borderRadius: 14,
          background: C.soft,
          fontFamily: mono,
          fontSize: 14,
          lineHeight: 1.6,
          minHeight: 92,
        }}
      >
        {lines.map((l, i) =>
          !l.startsWith("blur") ? (
            <div key={l} style={{ opacity: t(f, 4, 12) }}>
              {l}
            </div>
          ) : (
            <div
              key={l}
              style={{
                height: 14,
                margin: "8px 0",
                width: `${88 - i * 18}%`,
                borderRadius: 7,
                background: "#d9d9de",
                filter: "blur(2px)",
                opacity: t(f, 8 + i * 4, 16 + i * 4),
              }}
            />
          ),
        )}
      </div>
      <div
        style={{
          marginTop: 14,
          fontSize: 14,
          display: "flex",
          justifyContent: "space-between",
          opacity: t(f, 30, 40),
        }}
      >
        <span style={{ color: C.green, fontWeight: 600 }}>Matches the seller's committed hash</span>
        <span style={{ fontFamily: mono, color: C.muted }}>{short(TX.oylaLock)} ↗</span>
      </div>
    </>
  );
};

const Timeline = ({ f }: { f: number }) => {
  const steps: [string, string, string][] = [
    ["Locked in escrow", "13:31:23", TX.oylaLock],
    ["Result submitted", "13:33:04", TX.oylaResult],
    ["Seller paid", "14:03:06", TX.oylaWithdraw],
    ["Creator paid · 3.5 tADA", "14:03:35", TX.creatorPaid],
  ];
  return (
    <div
      style={{ padding: "34px 0", display: "flex", justifyContent: "center", opacity: t(f, 0, 10) }}
    >
      <div style={{ width: 760 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <Pill dark style={{ height: 30, fontSize: 13, padding: "0 12px" }}>
            Protected
          </Pill>
          <Pill
            style={{
              height: 30,
              fontSize: 13,
              padding: "0 12px",
              background: C.soft,
              border: "none",
            }}
          >
            Seller paid
          </Pill>
        </div>
        <div style={{ fontSize: 44, fontWeight: 600, marginTop: 10 }}>OYLA</div>
        <div
          style={{
            marginTop: 20,
            padding: "26px 30px",
            borderRadius: 20,
            border: `1px solid ${C.line}`,
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 14 }}>Timeline</div>
          {steps.map(([label, time, hash], i) => {
            const p = t(f, 12 + i * 16, 22 + i * 16);
            return (
              <div
                key={label}
                style={{
                  display: "flex",
                  gap: 18,
                  opacity: p,
                  transform: `translateX(${(1 - p) * -20}px)`,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      background: i === 3 ? C.green : C.ink,
                      marginTop: 4,
                    }}
                  />
                  {i < 3 ? (
                    <div
                      style={{
                        width: 2,
                        height: 66,
                        background: C.ink,
                        transform: `scaleY(${t(f, 20 + i * 16, 30 + i * 16)})`,
                        transformOrigin: "top",
                      }}
                    />
                  ) : null}
                </div>
                <div style={{ paddingBottom: 18 }}>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 14, color: C.muted, marginTop: 2 }}>
                    7 Oct 2026, {time}
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 14, marginTop: 4 }}>
                    {short(hash)} ↗
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/** Typed text: shows `text` up to progress p (0..1). */
const typed = (text: string, p: number) => text.slice(0, Math.round(text.length * p));

const Field = ({
  label,
  value,
  p,
  mono: m,
}: {
  label: string;
  value: string;
  p: number;
  mono?: boolean;
}) => (
  <div style={{ marginTop: 16 }}>
    <div style={{ fontSize: 14, color: C.muted, marginBottom: 6 }}>{label}</div>
    <div
      style={{
        height: 48,
        borderRadius: 12,
        border: `1px solid ${p > 0 && p < 1 ? C.ink : C.line}`,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        fontSize: 16,
        fontFamily: m ? mono : sans,
      }}
    >
      {typed(value, p)}
      {p > 0 && p < 1 ? (
        <span style={{ width: 2, height: 22, background: C.ink, marginLeft: 2 }} />
      ) : null}
    </div>
  </div>
);

const Sell = ({ f, pressed, listed }: { f: number; pressed: number; listed: number }) => (
  <div
    style={{ display: "flex", justifyContent: "center", padding: "30px 0", opacity: t(f, 0, 10) }}
  >
    <div style={{ width: 720 }}>
      <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>Sell a prompt</div>
      <div style={{ fontSize: 16, color: C.muted, marginTop: 6 }}>
        You sell as the signed-in account. The content's SHA-256 is committed before anyone pays.
      </div>
      <Field label="Title" value="Aurora SaaS hero" p={t(f, 10, 28)} />
      <Field label="Price" value="6 tADA · instant + protected" p={t(f, 30, 42)} />
      <Field
        label="Prompt (only buyers see it)"
        value="Build ONE standalone HTML file for a SaaS hero…"
        p={t(f, 44, 66)}
        mono
      />
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 22 }}>
        <Pill
          dark
          style={{ height: 50, padding: "0 30px", transform: `scale(${1 - pressed * 0.05})` }}
        >
          Publish listing
        </Pill>
        <div style={{ opacity: listed, fontSize: 15, color: C.green, fontWeight: 600 }}>
          Listed · content hash committed ✓
        </div>
      </div>
    </div>
  </div>
);

/** Cursor gliding between waypoints; `click` frames pulse a ring. */
type Way = { f: number; x: number; y: number };
const Cursor = ({ f, path, clicks }: { f: number; path: Way[]; clicks: number[] }) => {
  let x = path[0]?.x ?? 0;
  let y = path[0]?.y ?? 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1] as Way;
    const b = path[i] as Way;
    if (f >= a.f) {
      const p = t(f, a.f, b.f);
      x = a.x + (b.x - a.x) * p;
      y = a.y + (b.y - a.y) * p;
    }
  }
  const ring =
    clicks.map((c) => interpolate(f, [c, c + 12], [0, 1], clamp)).find((v) => v > 0 && v < 1) ?? 0;
  return (
    <div style={{ position: "absolute", left: x, top: y, pointerEvents: "none" }}>
      {ring ? (
        <div
          style={{
            position: "absolute",
            left: -22 * ring,
            top: -22 * ring,
            width: 44 * ring,
            height: 44 * ring,
            borderRadius: 999,
            border: `3px solid ${C.violet}`,
            opacity: 1 - ring,
          }}
        />
      ) : null}
      <svg
        width={30}
        height={30}
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))" }}
      >
        <path
          d="M4 2 L4 19 L8.5 14.5 L11.5 21 L14 20 L11 13.5 L17.5 13.5 Z"
          fill="#111"
          stroke="#fff"
          strokeWidth={1.4}
        />
      </svg>
    </div>
  );
};

/** The whole web journey in one browser window: catalogue → sign in → buy → timeline → sell. */
export const APP_FLOW_FRAMES = 600;
/** The web journey plays slower than authored so the voice-over fits each beat. */
export const APP_SLOW = 1.35;
/** Beats of the web journey (frames), shared with the copy and the sound. */
export const APP_BEATS = {
  signClick: 40,
  modal: 46,
  eternl: 70,
  popup: 76,
  sign: 100,
  signed: 106,
  funded: 120,
  cardClick: 168,
  listing: 174,
  buyClick: 214,
  paid: 262,
  bought: 266,
  toTimeline: 340,
  sellNav: 452,
  publish: 540,
};
export const AppFlow = () => {
  const f = useCurrentFrame() / APP_SLOW;
  // Beats (frames).
  const B = APP_BEATS;
  const signedIn = t(f, B.signed, B.signed + 10);
  const balance = interpolate(f, [B.funded, B.funded + 24], [0, 15], clamp) - (f >= B.paid ? 5 : 0);
  const page =
    f < B.listing
      ? "catalogue"
      : f < B.toTimeline
        ? "listing"
        : f < B.sellNav
          ? "timeline"
          : "sell";
  const path: Way[] = [
    // Targets measured in the rendered UI (centre of each control); the arrow's tip sits 5,3 px
    // inside the cursor box, and the cursor holds still from arrival until after the click.
    { f: 0, x: 900, y: 500 },
    { f: 32, x: 1349, y: 33 }, // Sign in (1354,36), click 40
    { f: 46, x: 1349, y: 33 },
    { f: 62, x: 615, y: 420 }, // Eternl row (620,423), click 70
    { f: 76, x: 615, y: 420 },
    { f: 92, x: 1314, y: 287 }, // wallet Sign (1319,290), click 100
    { f: 108, x: 1314, y: 287 },
    { f: 140, x: 1150, y: 320 },
    { f: 160, x: 211, y: 451 }, // OYLA card image (216,454), click 168
    { f: 176, x: 211, y: 451 },
    { f: 204, x: 1115, y: 420 }, // Buy with protection (1120,423), click 214
    { f: 226, x: 1115, y: 420 },
    { f: 330, x: 1115, y: 520 },
    { f: 440, x: 727, y: 33 }, // Sell (732,36), click 452
    { f: 458, x: 727, y: 33 },
    { f: 528, x: 441, y: 482 }, // Publish listing (446,485), click 540
    { f: 600, x: 441, y: 482 },
  ];
  const press = (at: number) => interpolate(f, [at, at + 4, at + 10], [0, 1, 0], clamp);
  return (
    <div
      style={{
        width: W,
        height: H,
        position: "relative",
        overflow: "hidden",
        background: "#fff",
        fontFamily: sans,
        color: C.ink,
      }}
    >
      <Nav
        signedIn={signedIn}
        balance={Math.max(0, balance)}
        active={page === "sell" ? "Sell" : "Catalogue"}
      />
      {page === "catalogue" ? <Catalogue f={f} hoverCard={t(f, 160, 168)} /> : null}
      {page === "listing" ? (
        <Listing
          f={f - B.listing}
          pressed={press(B.buyClick)}
          paying={t(f, B.buyClick + 4, B.paid)}
          done={f >= B.paid ? 1 : 0}
        />
      ) : null}
      {page === "timeline" ? <Timeline f={f - B.toTimeline} /> : null}
      {page === "sell" ? (
        <Sell
          f={f - B.sellNav}
          pressed={press(B.publish)}
          listed={t(f, B.publish + 6, B.publish + 16)}
        />
      ) : null}
      {f >= B.modal && f < B.signed ? (
        <Modal p={t(f, B.modal, B.modal + 8) * (1 - t(f, B.sign + 2, B.signed))}>
          <SignIn f={f >= B.eternl ? 1 : 0} />
        </Modal>
      ) : null}
      {f >= B.popup && f < B.signed + 6 ? (
        <WalletPopup
          p={t(f, B.popup, B.popup + 8) * (1 - t(f, B.sign + 2, B.signed + 4))}
          pressed={press(B.sign)}
        />
      ) : null}
      {f >= B.bought && f < B.toTimeline ? (
        <Modal
          p={t(f, B.bought, B.bought + 8) * (1 - t(f, B.toTimeline - 8, B.toTimeline))}
          width={560}
        >
          <Bought f={f - B.bought} />
        </Modal>
      ) : null}
      <Toast p={t(f, B.funded, B.funded + 8) * (1 - t(f, B.funded + 40, B.funded + 48))}>
        +15 tADA arrived in your Simpuru wallet
      </Toast>
      <Cursor
        f={f}
        path={path}
        clicks={[B.signClick, B.eternl, B.sign, B.cardClick, B.buyClick, B.sellNav, B.publish]}
      />
    </div>
  );
};

/** Agents page: limits and the one command, with a Copy click. */
export const AgentsPage = () => {
  const f = useCurrentFrame();
  const copied = f > 52;
  return (
    <div
      style={{
        width: W,
        height: H,
        position: "relative",
        overflow: "hidden",
        background: "#fff",
        fontFamily: sans,
        color: C.ink,
      }}
    >
      <Nav signedIn={1} balance={10} active="Agents" />
      <div
        style={{ display: "flex", justifyContent: "center", paddingTop: 30, opacity: t(f, 0, 10) }}
      >
        <div style={{ width: 760 }}>
          <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>Connect an agent</div>
          <div
            style={{ marginTop: 20, padding: 24, borderRadius: 20, border: `1px solid ${C.line}` }}
          >
            <div style={{ fontSize: 19, fontWeight: 600 }}>Spending limits</div>
            <div style={{ display: "flex", gap: 60, marginTop: 14 }}>
              {[
                ["Max per purchase", Math.round(interpolate(f, [8, 26], [0, 10], clamp))],
                ["Daily budget", Math.round(interpolate(f, [8, 26], [0, 30], clamp))],
                ["Spent today", 0],
              ].map(([l, v]) => (
                <div key={l as string}>
                  <div style={{ fontSize: 14, color: C.muted }}>{l}</div>
                  <div style={{ fontSize: 26, fontWeight: 600 }}>{v} tADA</div>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{ marginTop: 18, padding: 24, borderRadius: 20, border: `1px solid ${C.line}` }}
          >
            <div style={{ fontSize: 19, fontWeight: 600 }}>Set it up</div>
            <div
              style={{
                marginTop: 14,
                padding: "14px 16px",
                borderRadius: 12,
                background: C.soft,
                display: "flex",
                alignItems: "center",
                fontFamily: mono,
                fontSize: 15,
              }}
            >
              claude mcp add --transport http simpuru https://api.simpuru.xyz/mcp
              <Pill
                style={{
                  marginLeft: "auto",
                  height: 34,
                  fontSize: 14,
                  padding: "0 14px",
                  fontFamily: sans,
                }}
              >
                {copied ? "Copied" : "Copy"}
              </Pill>
            </div>
            <div style={{ fontSize: 15, color: C.muted, marginTop: 12 }}>
              A browser page asks you to approve with your wallet. Done.
            </div>
          </div>
        </div>
      </div>
      <Cursor
        f={f}
        path={[
          { f: 0, x: 900, y: 600 },
          { f: 40, x: 1021, y: 414 }, // Copy (1026,417), click 48
          { f: 90, x: 1021, y: 414 },
        ]}
        clicks={[48]}
      />
    </div>
  );
};

/** Fits a 1440×810 app view into a browser frame at `width`. */
export const AppWindow = ({
  children,
  width = 1500,
  url = "app.simpuru.xyz",
}: {
  children: ReactNode;
  width?: number;
  url?: string;
}) => {
  const s = width / W;
  return (
    <div
      style={{
        width,
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: "0 40px 120px rgba(0,0,0,0.25)",
        border: `1px solid ${C.line}`,
        background: "#fff",
      }}
    >
      <div
        style={{
          height: 50,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 20px",
          background: C.soft,
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
        ))}
        <div
          style={{
            marginLeft: 16,
            flex: 1,
            height: 30,
            borderRadius: 15,
            background: "#fff",
            border: `1px solid ${C.line}`,
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            fontSize: 16,
            color: C.muted,
            fontFamily: sans,
          }}
        >
          {url}
        </div>
      </div>
      <div style={{ width, height: H * s, overflow: "hidden" }}>
        <div style={{ transform: `scale(${s})`, transformOrigin: "top left" }}>{children}</div>
      </div>
    </div>
  );
};

/** simpuru.xyz, rebuilt: the orb video, the two-line headline, the shop button, the stack row. */
export const LANDING_FRAMES = 132;
export const LANDING_CLICK = 96;
export const Landing = () => {
  const f = useCurrentFrame();
  const rise = (a: number) => {
    const p = t(f, a, a + 14);
    return { opacity: p, transform: `translateY(${(1 - p) * 26}px)` };
  };
  const press = interpolate(
    f,
    [LANDING_CLICK, LANDING_CLICK + 4, LANDING_CLICK + 10],
    [0, 1, 0],
    clamp,
  );
  const logos = ["x402.svg", "masumi.webp", "blockfrost.svg", "token2049.png", "cardano.svg"];
  return (
    <div
      style={{
        width: W,
        height: H,
        position: "relative",
        overflow: "hidden",
        background: "#fff",
        fontFamily: sans,
        color: C.ink,
      }}
    >
      <OffthreadVideo
        src={staticFile("hero.mp4")}
        muted
        style={{
          position: "absolute",
          left: 0,
          top: 120,
          width: W,
          height: H - 120,
          objectFit: "cover",
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 120,
          height: 260,
          background: "linear-gradient(#fff, rgba(255,255,255,0))",
        }}
      />
      <div
        style={{
          position: "relative",
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 120px",
        }}
      >
        <Img src={staticFile("logo.svg")} style={{ width: 36, height: 36 }} />
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Badge />
          <Pill dark style={{ height: 40 }}>
            Sign in
          </Pill>
        </div>
      </div>
      <div style={{ position: "relative", textAlign: "center", paddingTop: 44 }}>
        <div style={{ fontSize: 76, letterSpacing: -2.5, lineHeight: 1.1, ...rise(4) }}>
          Pay per prompt. Not per month.
        </div>
        <div
          style={{
            fontSize: 76,
            letterSpacing: -2.5,
            lineHeight: 1.1,
            backgroundImage: "linear-gradient(90deg,#000,#6b7280 60%,#9ca3af)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            ...rise(14),
          }}
        >
          Refunded if it never arrives.
        </div>
        <div style={{ fontSize: 21, color: "#4b5563", marginTop: 22, ...rise(26) }}>
          Sign in with your Cardano wallet, add test ADA on preprod, and buy yourself or let your
          agent buy.
        </div>
        <div style={{ marginTop: 52, ...rise(36) }}>
          <Pill
            dark
            style={{
              height: 50,
              padding: "0 30px",
              fontSize: 18,
              transform: `scale(${1 - press * 0.05})`,
            }}
          >
            Open the shop
          </Pill>
        </div>
        <div style={{ fontSize: 16, color: "#4b5563", marginTop: 18, ...rise(42) }}>
          Made something good?{" "}
          <span style={{ color: C.ink, textDecoration: "underline" }}>Sell your prompts</span>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 34,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          padding: "0 60px",
          ...rise(50),
        }}
      >
        {logos.map((l) => (
          <Img
            key={l}
            src={staticFile(l)}
            style={{
              height: 34,
              filter: l === "token2049.png" ? "invert(1) grayscale(1)" : "grayscale(1)",
              opacity: 0.8,
            }}
          />
        ))}
      </div>
      <Cursor
        f={f}
        path={[
          { f: 0, x: 1100, y: 640 },
          { f: 60, x: 1000, y: 560 },
          { f: 88, x: 715, y: 404 }, // Open the shop (720,407), click 96
          { f: 132, x: 715, y: 404 },
        ]}
        clicks={[LANDING_CLICK]}
      />
    </div>
  );
};
