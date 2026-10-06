Build ONE standalone HTML file for "still.", a breathing app: a soft sage page with three concentric circles that grow and shrink in a 4-7-8 breathing rhythm while the center word guides you. All CSS in <style>, all JS in <script type="module">. No images, no audio, no libraries.

DELIVERABLE
- Title: still. — Breathe with us
- <meta name="theme-color" content="#eef1ea">

FONTS
- Fraunces 400 (optical size auto) for the headline, Inter 400/500 for UI, from Google Fonts, display=swap.

TOKENS
- --bg #eef1ea  --ink #1f2b22  --ink-60 rgba(31,43,34,.6)
- Rings, outer → inner: --c1 #d6e2cf  --c2 #bcd3b6  --c3 #9dbb93
- --ease-breath cubic-bezier(.45,0,.55,1)

TYPE
- Wordmark "still.": Inter 500, 13px.
- Nav: Inter 400, 13px, --ink-60: "Sessions · Journal · App"
- H1: Fraunces 400, clamp(36px, 4.6vw, 60px), letter-spacing -.02em, centered.
- Center cue: Inter 500, 12px, letter-spacing .32em, uppercase.
- Footer line: Inter 400, 14px, --ink-60, centered.

LAYOUT + EXACT COPY (one screen, 100svh)
- Header (absolute, padding 18px 22px, space-between): still. · Sessions · Journal · App
- H1 near the top (padding-top 9svh): Breathe with us
- Rings centered at 52% height: three circles, diameters 74vmin (c1), 52vmin (c2), 31vmin (c3) at rest. They overlap the H1's bottom a little; the H1 stays above them (z-index).
- Center cue inside c3: INHALE / HOLD / EXHALE
- Footer (absolute bottom 24px): Four minutes. No account. Just the circle.

BREATH ENGINE (4-7-8, the reason the page exists)
- One cycle = 19s: inhale 4s, hold 7s, exhale 8s. Drive it with requestAnimationFrame and a phase clock, not CSS keyframes, so the cue text and the rings stay in lockstep.
- Scale per ring (relative to rest):
    inhale: c3 .78 → 1.06, c2 .86 → 1.04, c1 .92 → 1.02 (ease var(--ease-breath))
    hold: hold the inhale size with a ±0.6% shimmer at 0.8 Hz
    exhale: back to .78 / .86 / .92 over the full 8s
- The inner ring leads, the middle lags 120ms, the outer lags 240ms (compute each ring's phase with its own delay), so they ripple.
- Cue word crossfades (300ms) at each phase change; during HOLD a thin progress ring (SVG circle stroke 1.5px --ink at 35% opacity) draws around c3 for the 7 seconds.
- Count: after 12 cycles (≈ 4 minutes) the cue becomes "WELL DONE" and the rings rest.

INTERACTION
- Click or Space toggles pause / resume (cue shows "PAUSED"). Keyboard focusable wrapper with an aria-label describing the control.
- Background very slowly warms during inhale (--bg toward #f1f2e8) and cools on exhale, via a registered @property color.

ENTRANCE
- Rings scale from 0 → their exhale size, inner first, 1.2s var(--ease-breath), 150ms stagger; H1 fades in from 12px below; then the first INHALE begins.

ACCESSIBILITY
- aria-live="polite" region that announces the cue text change (inhale / hold / exhale).
- prefers-reduced-motion: rings stay still; only the cue text and the HOLD progress ring change.

RESPONSIVE
- < 768px: ring diameters × 1.25 in vmin terms but capped to 92vw for c1; nav shows "App" only.

DO NOT
- No sound, no images, no gradients on the rings (flat fills), no shadows, no extra sections or app-store badges, no GSAP.
