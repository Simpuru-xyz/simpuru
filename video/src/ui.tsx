import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Img, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, mono, sans, short } from "./theme";

/** 0→1 spring that starts at `delay` frames. */
export const useIn = (delay = 0, damping = 200) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping } });
};

/** Fades out over the last `frames` of a scene of length `duration`. */
export const useOut = (duration: number, frames = 12) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [duration - frames, duration], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
};

export const Rise = ({ delay = 0, children, style }: { delay?: number; children: ReactNode; style?: CSSProperties }) => {
  const p = useIn(delay);
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 28}px)`, ...style }}>{children}</div>
  );
};

export const Scene = ({ children, dark, style }: { children: ReactNode; dark?: boolean; style?: CSSProperties }) => (
  <AbsoluteFill style={{ background: dark ? C.night : C.bg, color: dark ? "#fff" : C.ink, fontFamily: sans, ...style }}>
    {children}
  </AbsoluteFill>
);

/** Small label above a heading. */
export const Kicker = ({ children, dark }: { children: ReactNode; dark?: boolean }) => (
  <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: 4, textTransform: "uppercase", color: dark ? "#9b9bb0" : C.muted }}>
    {children}
  </div>
);

export const H = ({ children, size = 84, style }: { children: ReactNode; size?: number; style?: CSSProperties }) => (
  <div style={{ fontSize: size, fontWeight: 600, letterSpacing: -2.5, lineHeight: 1.05, ...style }}>{children}</div>
);

/** Bottom caption, so the video reads without a voice-over. */
export const Caption = ({ children, delay = 0, dark }: { children: ReactNode; delay?: number; dark?: boolean }) => {
  const p = useIn(delay);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 56, display: "flex", justifyContent: "center", opacity: p }}>
      <div
        style={{
          maxWidth: 1500,
          padding: "16px 30px",
          borderRadius: 18,
          fontSize: 34,
          fontWeight: 500,
          lineHeight: 1.3,
          textAlign: "center",
          background: dark ? "rgba(255,255,255,0.08)" : "rgba(10,10,10,0.86)",
          color: "#fff",
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** A screenshot in a browser window, slowly pushing in towards (fx, fy). */
export const Browser = ({
  src,
  url,
  width = 1500,
  zoom = 1.12,
  fx = 0.5,
  fy = 0.3,
  delay = 0,
  duration = 300,
  video,
}: {
  src: string;
  url: string;
  width?: number;
  zoom?: number;
  fx?: number;
  fy?: number;
  delay?: number;
  duration?: number;
  video?: boolean;
}) => {
  const frame = useCurrentFrame();
  const p = useIn(delay);
  const z = interpolate(frame - delay, [0, duration], [1, zoom], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const height = (width * 9) / 16;
  return (
    <div
      style={{
        width,
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: "0 40px 120px rgba(0,0,0,0.22)",
        border: `1px solid ${C.line}`,
        background: "#fff",
        opacity: p,
        transform: `translateY(${(1 - p) * 40}px) scale(${0.96 + p * 0.04})`,
      }}
    >
      <div style={{ height: 52, display: "flex", alignItems: "center", gap: 10, padding: "0 20px", background: C.soft, borderBottom: `1px solid ${C.line}` }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
        ))}
        <div style={{ marginLeft: 18, flex: 1, height: 32, borderRadius: 16, background: "#fff", border: `1px solid ${C.line}`, display: "flex", alignItems: "center", padding: "0 16px", fontSize: 18, color: C.muted, fontFamily: sans }}>
          {url}
        </div>
      </div>
      <div style={{ width, height, overflow: "hidden", position: "relative" }}>
        {video ? (
          <OffthreadVideo src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
        ) : (
          <Img
            src={staticFile(src)}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", transform: `scale(${z})`, transformOrigin: `${fx * 100}% ${fy * 100}%` }}
          />
        )}
      </div>
    </div>
  );
};

/** A highlight ring that pops on a spot of the screen (percentages of the Browser area). */
export const Spot = ({ x, y, w, h, delay }: { x: number; y: number; w: number; h: number; delay: number }) => {
  const p = useIn(delay, 14);
  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        width: `${w}%`,
        height: `${h}%`,
        borderRadius: 16,
        border: `5px solid ${C.violet}`,
        boxShadow: `0 0 0 9999px rgba(10,10,10,${0.28 * p})`,
        opacity: p,
        transform: `scale(${1.08 - 0.08 * p})`,
      }}
    />
  );
};

/** A transaction chip: label + short hash, the way it reads on cardanoscan. */
export const Tx = ({ label, hash, color = C.green, delay = 0, dark }: { label: string; hash: string; color?: string; delay?: number; dark?: boolean }) => {
  const p = useIn(delay);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 22px",
        borderRadius: 14,
        background: dark ? "rgba(255,255,255,0.06)" : "#fff",
        border: `1px solid ${dark ? "rgba(255,255,255,0.12)" : C.line}`,
        opacity: p,
        transform: `translateX(${(1 - p) * -24}px)`,
      }}
    >
      <div style={{ width: 14, height: 14, borderRadius: 7, background: color, flexShrink: 0 }} />
      <div style={{ fontSize: 24, fontWeight: 500, flex: 1, whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ whiteSpace: "nowrap", flexShrink: 0, fontFamily: mono, fontSize: 20, color: dark ? "#a5a5bd" : C.muted }}>{short(hash)}</div>
    </div>
  );
};

/** A box in a flow diagram. */
export const Node = ({ title, sub, delay = 0, accent = C.ink, dark, width = 340 }: { title: string; sub?: string; delay?: number; accent?: string; dark?: boolean; width?: number }) => {
  const p = useIn(delay, 16);
  return (
    <div
      style={{
        width,
        padding: "26px 28px",
        borderRadius: 22,
        background: dark ? "rgba(255,255,255,0.06)" : "#fff",
        border: `2px solid ${accent}`,
        opacity: p,
        transform: `scale(${0.85 + 0.15 * p})`,
      }}
    >
      <div style={{ fontSize: 32, fontWeight: 600 }}>{title}</div>
      {sub ? <div style={{ fontSize: 22, marginTop: 8, color: dark ? "#a5a5bd" : C.muted, lineHeight: 1.35 }}>{sub}</div> : null}
    </div>
  );
};

/** A horizontal arrow that draws itself. */
export const Arrow = ({ delay = 0, width = 90, dark, label }: { delay?: number; width?: number; dark?: boolean; label?: string }) => {
  const p = useIn(delay, 30);
  const color = dark ? "#8a8aa3" : "#9a9a9a";
  return (
    <div style={{ width, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      {label ? <div style={{ fontSize: 18, color, opacity: p, whiteSpace: "nowrap" }}>{label}</div> : null}
      <svg width={width} height={24} viewBox={`0 0 ${width} 24`}>
        <line x1={0} y1={12} x2={(width - 12) * p} y2={12} stroke={color} strokeWidth={4} strokeLinecap="round" />
        {p > 0.95 ? <path d={`M${width - 16} 4 L${width - 2} 12 L${width - 16} 20`} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /> : null}
      </svg>
    </div>
  );
};

/** Terminal lines typed out one after another. `lines`: [text, kind] where kind styles it. */
export type Line = { text: string; kind?: "prompt" | "agent" | "tool" | "out" | "ok" | "dim" };
export const Terminal = ({ lines, start = 0, cps = 55, width = 1500, height = 760, title = "claude" }: { lines: Line[]; start?: number; cps?: number; width?: number; height?: number; title?: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let budget = Math.max(0, ((frame - start) / fps) * cps);
  const shown: { line: Line; text: string }[] = [];
  for (const line of lines) {
    // Tool output appears at once, like a real terminal; prompts and replies type out.
    const cost = line.kind === "out" || line.kind === "tool" ? Math.min(line.text.length, 30) : line.text.length;
    if (budget <= 0) break;
    if (budget >= cost) shown.push({ line, text: line.text });
    else shown.push({ line, text: line.kind === "out" || line.kind === "tool" ? "" : line.text.slice(0, Math.floor(budget)) });
    budget -= cost + 10;
  }
  const color = (k?: Line["kind"]) =>
    k === "prompt" ? "#fff" : k === "tool" ? "#c4b5fd" : k === "ok" ? "#86efac" : k === "dim" || k === "out" ? "#9ca3af" : "#e5e7eb";
  return (
    <div style={{ width, height, borderRadius: 18, overflow: "hidden", background: "#111114", boxShadow: "0 40px 120px rgba(0,0,0,0.35)", border: "1px solid #26262c" }}>
      <div style={{ height: 48, display: "flex", alignItems: "center", gap: 10, padding: "0 18px", background: "#1b1b20", color: "#8b8b96", fontFamily: sans, fontSize: 18 }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
        ))}
        <span style={{ marginLeft: 14 }}>{title}</span>
      </div>
      <div style={{ padding: "26px 34px", fontFamily: mono, fontSize: 25, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
        {shown.map(({ line, text }, i) => (
          <div key={i} style={{ color: color(line.kind), marginTop: line.kind === "prompt" && i > 0 ? 18 : 0 }}>
            {line.kind === "prompt" ? <span style={{ color: "#a78bfa" }}>{"> "}</span> : null}
            {text}
          </div>
        ))}
      </div>
    </div>
  );
};

export const Logo = ({ size = 72, invert }: { size?: number; invert?: boolean }) => (
  <Img src={staticFile("logo.svg")} style={{ width: size, height: size, filter: invert ? "invert(1)" : undefined }} />
);
