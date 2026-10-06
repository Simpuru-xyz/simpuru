Build ONE standalone HTML file for "Ledgerly", a consumer money app: a clean light hero headline over a bento of live dashboard cards (balance with an animated chart, savings goal, card, FX rate). All CSS in <style>, all JS in <script type="module">. Charts are SVG drawn by your code. No chart libraries, no images.

DELIVERABLE
- Title: Ledgerly — Money that moves as fast as you do
- <meta name="theme-color" content="#f5f7fb">

FONTS
- Inter Tight 400 / 500 / 600 / 700 from Google Fonts, display=swap; tabular numbers via font-variant-numeric: tabular-nums on every figure.

TOKENS
- --bg #f5f7fb  --card #ffffff  --ink #0b1220  --ink-60 #5b6474  --ink-40 #8a93a3
- --blue #2563eb  --blue-soft rgba(37,99,235,.14)  --green #16a34a  --night #0b1220 (the dark card)
- --radius 16px  --shadow 0 1px 2px rgba(11,18,32,.04), 0 8px 24px rgba(11,18,32,.06)
- --gap 16px  --pad-x clamp(20px, 3vw, 48px)
- --ease cubic-bezier(.2,.8,.2,1)

TYPE
- H1: clamp(36px, 4.4vw, 60px) / 1.04 / -.035em / 700
- Card label: 12px / 500 / --ink-60
- Big figure: clamp(28px, 2.6vw, 38px) / 700 / -.02em
- Small: 12px / 500

LAYOUT + EXACT COPY
- Header: padding 20px var(--pad-x), flex space-between.
    left: "▲ Ledgerly" (triangle U+25B2 at .75em) 15px 600
    right: "Open account" button: --ink fill, white text, 13px 600, height 34px, padding 0 14px, radius 8px
- H1 (padding 24px var(--pad-x) 0, left aligned), with an explicit <br>:
    "Money that <span class=accent>moves</span><br>as fast as you do"
    .accent color --blue
- Bento (margin 40px var(--pad-x), grid-template-columns 1.65fr 1fr, gap var(--gap)):
    A) Balance card (spans 3 rows on the left):
       label "Total balance" · figure "$248,930.42" · delta "▲ 12.4% this month" in --green 12px 600
       area chart filling the rest of the card (min-height 240px)
    B) "Savings goal" · "$18,000" · progress bar (track #eef1f6, fill --blue, height 6px, radius 3px) at 72%
    C) "Cards" · "•••• 4821" · small "Virtual · frozen in one tap"
    D) Dark card (--night bg, white text): "FX today" (white 60%) · "1 USD = 16,240 IDR"
- All cards: --card bg, --radius, --shadow, padding 20px.

CHART (SVG, the hero detail)
- 48 data points generated from a seeded random walk (seed 7) trending up: start 0.25, end 0.85 of height, step noise ±0.04, then smoothed with a Catmull-Rom → Bézier conversion (tension .5).
- Line: stroke --blue, width 2.25, round joins. Area: same path closed to the bottom, filled with a vertical gradient --blue-soft → transparent.
- Draw-in: animate stroke-dashoffset from length → 0 over 1.6s var(--ease); the area fades in 400ms after.
- Live tick: every 2.2s shift the series one point left and push a new point (continuing the walk), morphing the path over 600ms with interpolated y values (no jump). The balance figure counts to the new value over the same 600ms (format with Intl.NumberFormat en-US currency).
- Hover (fine pointer): a vertical hairline + 6px dot on the nearest point, and a small tooltip with the value; leave → hide.

OTHER MOTION
- Entrance: H1 lines rise 20px + fade, 1s var(--ease), 100ms stagger; cards fade up 24px staggered 80ms in the order A, B, C, D; numbers count up from 0 over 1.2s (easeOutCubic).
- Savings bar fills from 0 to 72% over 1.4s, starting with its card.
- FX value nudges ±5 IDR every 3s with a 300ms crossfade of the last digits.
- Cards lift 2px with a stronger shadow on hover (200ms).
- prefers-reduced-motion: no draw-in, no live ticks, no count-ups.

RESPONSIVE
- < 900px: bento becomes one column in the order A, B, C, D; chart min-height 200px.

DO NOT
- No chart libraries, no icons fonts, no gradients except the chart area, no dark mode, no extra cards, no fake logos.
