Build ONE standalone HTML file: the home of "Noa Martens", a director and designer in Oslo, made entirely of giant moving type. Four full-bleed marquee rows of condensed capitals scroll in alternating directions over a warm paper background, with a rotating "SCROLL" badge. All CSS in <style>, all JS in <script type="module">. No images, no video, no libraries.

DELIVERABLE
- Title: Noa Martens — Director, designer, Oslo
- <meta name="theme-color" content="#f3efe7">
- Inline before first paint: <script>document.documentElement.classList.add('js')</script>

FONTS
- Anton 400 (the marquee rows) and Inter 400/500 (header) from Google Fonts, display=swap.
- Fallback for Anton: "Anton Fallback" from local Impact, size-adjust 101%.

TOKENS
- --paper #f3efe7  --ink #111111  --orange #ff4f1f  --ink-60 rgba(17,17,17,.6)
- Row size: --row clamp(72px, 12.5vw, 180px)  (each row's font-size; rows overlap: line-height .86)

HEADER (absolute, padding 18px 22px, flex space-between, 12px Inter 500, uppercase only for the name)
- left: NOA MARTENS
- right: Work · Info · Contact  (Inter 400, --ink-60 dots)

THE FOUR ROWS (exact text; each row repeats its phrase so the strip is at least 2× viewport wide)
1) solid ink:      DIRECTOR — DESIGNER —
2) outline ink:    MOTION — BRAND —
3) solid ink:      BASED IN OSLO —
4) solid orange:   AVAILABLE 2027 —
- Outline row: color transparent; -webkit-text-stroke 1.5px var(--ink) (2px above 1200px wide).
- The em dash has a space on both sides. Uppercase in the source, not via CSS.
- Rows stack in a column that fills 100svh, vertically centered, overflow hidden; each row is white-space nowrap.

MARQUEE ENGINE (JS, one requestAnimationFrame loop, no CSS keyframes)
- Each row is a track containing the phrase cloned until its width ≥ 2·viewport; translateX wraps with modulo the width of one phrase, so the loop is seamless.
- Base speeds in px/s (positive = left): row1 60, row2 −45, row3 70, row4 −55.
- Scroll velocity boost: listen to wheel and touchmove; v += deltaY·0.9; decay v with v *= exp(−dt·4). Each row's speed = base · (1 + |v|/600), keeping its own direction; also skew the track by clamp(v/80, −8, 8) deg on X, lerped (.12).
- The page itself does not scroll (body overflow hidden); wheel only drives the type.
- Pause when document.hidden; dt clamp 50ms.

ROTATING BADGE
- 120px circle (88px under 768px), background --ink, positioned right 9vw, bottom 14svh, sitting over rows 3–4.
- Text on a circular path (SVG <textPath>, 11px Inter 500, letter-spacing .2em, fill --paper): "SCROLL ↓ SCROLL ↓ " repeated to close the circle.
- Rotates 360° per 10s linear; scroll velocity adds to the rotation the same way it boosts the rows.

MOTION / ENTRANCE
- On load (fonts.ready, failsafe 1500ms): rows slide in from alternating sides, translateX ±30vw → 0 and opacity 0 → 1 over 1.1s cubic-bezier(.16,1,.3,1), staggered 90ms; then the marquee takes over without a jump (start the loop from the entrance's final offset).
- Hover a row (fine pointer): that row's outline/solid inverts (solid → outline, outline → solid) for as long as the pointer is over it; speed halves on that row.
- prefers-reduced-motion: rows are static (no loop, no skew), badge does not rotate, entrance is a fade.

RESPONSIVE
- < 768px: --row clamp(56px, 18vw, 96px); header shows NOA MARTENS and "Contact" only.

A11Y
- The marquee tracks are aria-hidden; a visually hidden <h1>: Noa Martens — director and designer based in Oslo, available 2027.

DO NOT
- No images, no gradients, no shadows, no third color besides orange, no lowercase in the rows, no GSAP or marquee libraries, no CSS animation for the rows.
