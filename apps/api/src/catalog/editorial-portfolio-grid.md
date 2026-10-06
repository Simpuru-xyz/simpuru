Build ONE standalone HTML file: the "Selected work" section of an independent designer's portfolio, set like a magazine. Oversized serif title, an asymmetric 12-column grid of six project cards, and hover reveals with a lagging custom cursor. All CSS in <style>, at most ~80 lines of vanilla JS in <script type="module">. No frameworks, no images (each project is a solid color plate).

DELIVERABLE
- Title: Selected work — Mara Lind, independent designer
- <meta name="theme-color" content="#f4f1ea">

FONTS
- Fraunces 300 and 400 (variable opsz) for display and project names; JetBrains Mono 400 for meta lines. Google Fonts, display=swap, preconnect both hosts.
- No other family, no bold.

TOKENS
- --paper #f4f1ea  --ink #151412  --ink-60 rgba(21,20,18,.6)  --ink-12 rgba(21,20,18,.12)
- Plates (one per project): #d9c7b0 · #2f3e34 · #c45a3c · #a9b7c6 · #e7d36f · #3a2f4b
- --gutter 24px  --max 1320px  --pad-x clamp(20px, 3vw, 48px)
- --ease cubic-bezier(.2,.7,.2,1)

TYPE
- Section title: Fraunces 300, clamp(48px, 7.5vw, 112px), line-height .95, letter-spacing -.02em, opsz 144.
- Project name: Fraunces 400, clamp(22px, 2vw, 28px), letter-spacing -.01em.
- Meta: JetBrains Mono 400, 12px, uppercase, letter-spacing .08em, --ink-60.

LAYOUT + EXACT COPY
- Container max-width var(--max), centered, padding 12vh var(--pad-x).
- Title spans all 12 columns, margin-bottom 8vh: Selected work, 2021–2026
- Grid: 12 columns, column-gap var(--gutter), row-gap clamp(56px, 8vw, 120px). Six cards in an asymmetric rhythm:
    row 1: card 1 spans 7 columns (plate 4:5) · card 2 spans 5 columns, offset down 12vh (plate 4:5)
    row 2: cards 3, 4, 5 span 4 columns each (plates 4:5)
    row 3: card 6 spans 12 columns (plate 16:9)
- Projects (name · client · year):
    1 Field Notes · Arken Studio · 2026
    2 Low Tide · Havn Records · 2025
    3 Common Ground · Folk Bank · 2024
    4 North Light · Ostra Hotels · 2024
    5 Paper Moons · Lumi Press · 2023
    6 Quiet Machines · Tessel Robotics · 2022
- Card: a link wrapping plate → name (margin-top 18px) → meta "CLIENT — YEAR".

HOVER REVEAL (pointer devices only: @media (hover: hover) and (pointer: fine))
- Plate scales 1 → 1.04 over 500ms var(--ease) inside an overflow-hidden frame.
- A caption panel slides up from the bottom of the plate (translateY 100% → 0, 500ms), --paper background, 16px padding, one-line summary per project (write a specific 8–12 word line for each, e.g. "Identity and packaging for a slow-coffee roaster in Bergen").
- Custom cursor: a 72px black circle with the word "View" (Inter-free: use the mono font, 11px, paper color) that follows the pointer with lag (lerp .15 per frame in one rAF loop) and scales 0 → 1 only while over a card; the native cursor is hidden inside cards only.
- Touch devices: the caption is always visible under the plate; no custom cursor.

SCROLL REVEAL
- IntersectionObserver (threshold .15): each card rises 32px and fades in over 900ms var(--ease); cards in the same row stagger 90ms; the title's words reveal one by one (wrap each word in a span with overflow hidden, words slide up 100% → 0, 60ms stagger).

A11Y
- Each card is one <a> with an accessible name "Field Notes, Arken Studio, 2026". :focus-visible shows a 2px ink outline offset 6px around the plate, and the caption panel appears on focus too.
- prefers-reduced-motion: no scale, no slide, no custom cursor; reveal is a 300ms fade.

RESPONSIVE
- < 900px: one column; all plates 4:5 except card 6 (16:9); title clamp(44px, 12vw, 64px); captions always visible.

DO NOT
- No images, no gradients, no shadows, no rounded corners, no extra sections (no about, no footer), no GSAP, no smooth-scroll library.
