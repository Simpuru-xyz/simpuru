Build ONE standalone HTML file for "NEURA", an AI research lab: a black page where a sphere of a few thousand particles slowly rotates and breathes beside a two-line statement. All CSS in <style>, all JS in <script type="module">. Use raw WebGL (no three.js, no libraries). No images, no video. Do not add sections, model cards, pricing or a footer.

DELIVERABLE
- Title: NEURA — Intelligence, made visible
- <meta name="theme-color" content="#000000">
- Inline before first paint: <script>document.documentElement.classList.add('js')</script>

FONTS
- Inter 400 / 500 / 600 from Google Fonts, display=swap, preconnect both hosts. Fallback "Inter Fallback": local Arial, size-adjust 107%.
- Only this family. No italics.

TOKENS
- --bg #000  --ink #fff  --ink-60 rgba(255,255,255,.6)  --ink-40 rgba(255,255,255,.4)
- Particle palette (by height on the sphere, bottom → top): #3b2a8f → #6d5dfc → #9fb4ff → #c8f7e1
- --pad clamp(20px, 2.2vw, 32px)
- --ease cubic-bezier(.22,1,.36,1)

TYPE
- Wordmark: 13px, weight 600, letter-spacing .04em, uppercase (the ONLY uppercase on the page).
- Nav: 13px weight 500, --ink-60, items separated by " · " in --ink-40.
- Statement: clamp(40px, 5.4vw, 76px), weight 600, line-height 1.02, letter-spacing -.035em.
- Sub: 15px weight 400, --ink-60, margin-top 14px.

LAYOUT + EXACT COPY
- Header absolute, padding var(--pad), flex space-between:
    left NEURA · right "Research · Models · API"
- Stage: 100svh, position relative, overflow hidden.
- Canvas fills the stage. The sphere's center sits at (62% width, 44% height); its radius is 34% of min(width, height).
- Text block absolute, left var(--pad), bottom calc(var(--pad) * 1.6), max-width 14ch:
    h1: "Intelligence,<br>made visible."
    p:  A model you can watch think.

PARTICLE ENGINE
- 4,200 points distributed on the sphere with a Fibonacci lattice (golden angle 2.39996 rad) so there are no poles or clumps.
- Per point store: unit position, a random phase (0..2π), a size (1.2–2.4 CSS px), and a color picked from the palette by the point's y (lerp between the 4 stops).
- Vertex shader:
    • rotate around Y by time·0.08 rad and around X by 0.35 rad (fixed tilt)
    • radial "breath": r = 1 + 0.035·sin(time·0.6 + phase) + 0.02·sin(time·1.7 + y·6.0)
    • a slow traveling wave adds 0.03·sin(4.0·x + time) to r so the surface shimmers
    • perspective projection, camera at z = 3.2, fov 38°
    • gl_PointSize = size · dpr · (1.0 / depth) · 2.2
- Fragment shader: round soft point (smoothstep from .5 to .1 on distance to center), alpha = .25 + .75·(front-facing ? 1 : .35), color from the vertex. Additive blending (gl.ONE, gl.ONE). Depth test off.
- The sphere keeps its pixel-crispness: canvas backing size = CSS size × min(devicePixelRatio, 2).
- Points facing away are dimmed, which is what makes the depth read without fog.

MOTION
- Intro: points start at radius 0 and scale out to 1 over 2.2s with ease-out (1 - (1-t)^4), while global alpha goes 0 → 1. The statement enters 400ms later: each line rises 24px with opacity 0→1 over 1.2s var(--ease), 120ms stagger; then the sub.
- Pointer: the sphere tilts toward the pointer up to ±8° on both axes (lerp .04). On touch, a slow auto-sway (±5°, 9s period) instead.
- Scroll is not used. The page is exactly one screen.
- prefers-reduced-motion: no breathing, no wave, rotation 4× slower; intro is a 400ms fade.
- Pause rendering when document.hidden.

RESPONSIVE
- < 768px: sphere center moves to (50%, 38%), radius 42% of width; text block stays bottom-left; nav collapses to "Research · API".

A11Y
- Canvas has aria-hidden="true". One <h1>. Links have a 2px white focus ring offset 3px.
- If WebGL is unavailable, draw the same lattice once with Canvas 2D (no animation) so the page still looks right.

DO NOT
- No three.js, no postprocessing, no bloom pass, no gradients behind the sphere, no stars or background particles, no text effects (no glow, no gradient text). No additional colors beyond the palette above.
