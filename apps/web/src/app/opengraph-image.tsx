import { ImageResponse } from "next/og";

export const alt = "Simpuru: design prompts with buyer protection, on Cardano preprod";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The share preview for every page without its own. */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "linear-gradient(135deg, #05060f 0%, #1b2a6b 60%, #5b5bff 100%)",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>Simpuru</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.05 }}>
          Design prompts with buyer protection.
        </div>
        <div style={{ display: "flex", fontSize: 32, opacity: 0.8 }}>
          You and your agents pay in tADA. Protected buys refund if delivery fails.
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignSelf: "flex-start",
          fontSize: 24,
          padding: "8px 18px",
          borderRadius: 999,
          border: "2px solid rgba(255,255,255,0.4)",
        }}
      >
        Cardano preprod testnet
      </div>
    </div>,
    size,
  );
}
