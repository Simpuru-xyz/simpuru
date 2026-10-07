import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { mono, sans } from "./theme";

/** Scene delays are authored at a relaxed pace; PACE tightens them all (0.5 = twice as fast). */
export const PACE = 0.5;

/** 0→1 spring that starts at `delay` frames (scaled by PACE). */
export const useIn = (delay = 0, damping = 200) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - delay * PACE,
    fps,
    config: { damping, stiffness: 220, mass: 0.6 },
  });
};

/** Fades out over the last `frames` of a scene of length `duration`. */
/** Terminal lines typed out one after another. `lines`: [text, kind] where kind styles it. */
export type Line = { text: string; kind?: "prompt" | "agent" | "tool" | "out" | "ok" | "dim" };
export const Terminal = ({
  lines,
  start = 0,
  cps = 55,
  width = 1500,
  height = 760,
  title = "claude",
}: {
  lines: Line[];
  start?: number;
  cps?: number;
  width?: number;
  height?: number;
  title?: string;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shownAt = (f: number) => {
    let budget = Math.max(0, ((f - start) / fps) * cps);
    const out: { line: Line; text: string }[] = [];
    for (const line of lines) {
      // Tool output appears at once, like a real terminal; prompts and replies type out.
      const instant = line.kind === "out" || line.kind === "tool";
      const cost = instant ? Math.min(line.text.length, 30) : line.text.length;
      if (budget <= 0) break;
      if (budget >= cost) out.push({ line, text: line.text });
      else out.push({ line, text: instant ? "" : line.text.slice(0, Math.floor(budget)) });
      budget -= cost + 10;
    }
    return out;
  };
  const shown = shownAt(frame);
  // Keep the newest line in view: scroll by how far the text runs past the window, eased over a
  // few frames. Mono at 25px is ~15px a character, 38.75px a row.
  const perRow = Math.floor((width - 68) / 15);
  const overflow = (f: number) => {
    const h = shownAt(f).reduce(
      (n, { line, text }, i) =>
        n +
        Math.max(1, Math.ceil((text.length + (line.kind === "prompt" ? 2 : 0)) / perRow)) * 38.75 +
        (line.kind === "prompt" && i > 0 ? 18 : 0),
      0,
    );
    return Math.max(0, h - (height - 48 - 52) + 24);
  };
  const scroll = [0, 1, 2, 3, 4, 5, 6, 7].reduce((n, d) => n + overflow(frame - d), 0) / 8;
  const color = (k?: Line["kind"]) =>
    k === "prompt"
      ? "#fff"
      : k === "tool"
        ? "#c4b5fd"
        : k === "ok"
          ? "#86efac"
          : k === "dim" || k === "out"
            ? "#9ca3af"
            : "#e5e7eb";
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 18,
        overflow: "hidden",
        background: "#111114",
        boxShadow: "0 40px 120px rgba(0,0,0,0.35)",
        border: "1px solid #26262c",
      }}
    >
      <div
        style={{
          height: 48,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 18px",
          background: "#1b1b20",
          color: "#8b8b96",
          fontFamily: sans,
          fontSize: 18,
        }}
      >
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
        ))}
        <span style={{ marginLeft: 14 }}>{title}</span>
      </div>
      <div style={{ height: height - 48, overflow: "hidden" }}>
        <div
          style={{
            padding: "26px 34px",
            fontFamily: mono,
            fontSize: 25,
            lineHeight: 1.55,
            whiteSpace: "pre-wrap",
            transform: `translateY(${-scroll}px)`,
          }}
        >
          {shown.map(({ line, text }, i) => (
            <div
              key={line.text}
              style={{
                color: color(line.kind),
                marginTop: line.kind === "prompt" && i > 0 ? 18 : 0,
              }}
            >
              {line.kind === "prompt" ? <span style={{ color: "#a78bfa" }}>{"> "}</span> : null}
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
