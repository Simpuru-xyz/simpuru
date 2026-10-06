Build ONE standalone HTML file for "ORBITAL", an edge-compute network running on satellites: a deep-navy hero with a glowing planet and three tilted orbits carrying lights. Pure CSS 3D + SVG + a few lines of JS. No WebGL, no three.js, no images. Do not add sections, stats strips, logos or a footer.

DELIVERABLE
- Title: ORBITAL — Infrastructure in orbit
- <meta name="theme-color" content="#070b1f">
- Inline before first paint: <script>document.documentElement.classList.add('js')</script>

FONTS
- Space Grotesk 500 / 600 (headings, wordmark) and Inter 400 (body) from Google Fonts in one request, display=swap.
- Fallbacks: local Arial with size-adjust 104% for Space Grotesk, 107% for Inter.

TOKENS
- --bg-0 #070b1f (edges)  --bg-1 #111a52 (glow behind planet)
- --ink #eef1ff  --ink-60 rgba(238,241,255,.6)
- Planet: --p-hi #c7cdff  --p-mid #7c83f7  --p-lo #3a3fb8
- Orbits: --o1 #2dd4bf (teal)  --o2 #f472b6 (pink)  --o3 #818cf8 (indigo)
- --ease cubic-bezier(.2,.8,.2,1)

TYPE
- Wordmark: Space Grotesk 600, 13px, letter-spacing .08em, uppercase.
- Nav: Inter 13px, --ink-60, "Platform · Network · Careers".
- H1: Space Grotesk 600, clamp(36px, 4.6vw, 64px), line-height 1.05, letter-spacing -.03em, centered.
- Caption: Inter 14px, --ink-60, centered.

LAYOUT + EXACT COPY
- Background: radial-gradient(60% 55% at 50% 52%, var(--bg-1) 0%, #0b1238 45%, var(--bg-0) 100%).
- Header absolute top, padding 20px clamp(20px,2.4vw,36px): ORBITAL left, nav right.
- Column centered, 100svh, grid rows: auto 1fr auto, padding-block 72px 40px.
    H1 (row 1): Infrastructure in orbit
    Scene (row 2): square, size min(56vh, 70vw), centered.
    Caption (row 3): Low-latency compute, 550 km above every user.

PLANET (CSS only)
- A circle 38% of the scene, centered.
- Fill: radial-gradient(circle at 35% 30%, #ffffff 0%, var(--p-hi) 12%, var(--p-mid) 48%, var(--p-lo) 100%).
- Glow: box-shadow 0 0 80px 10px rgba(124,131,247,.45), 0 0 220px 60px rgba(70,80,220,.25).
- Terminator: an inset shadow inset -18px -22px 40px rgba(10,14,60,.55) so it reads as a lit sphere, not a disc.

ORBITS (SVG inside the scene, viewBox 0 0 100 100, perspective via CSS on the wrapper)
- Three ellipses centered on the planet, rx 46, ry 15, stroke-width .35, fill none, each in its own <g> rotated:
    o1 teal   rotate(-58deg)
    o2 pink   rotate(28deg)
    o3 indigo rotate(0deg)
- Each orbit stroke is a gradient along its length (linearGradient across x) from the orbit color at .85 opacity to the same color at .15, so one side looks closer.
- One light per orbit: a 1.6-unit ellipse (rx 1.6, ry .9) in the orbit color with a blur filter (feGaussianBlur stdDeviation .6) plus a 0.6 white core.
- Lights travel along the ellipse with JS: angle θ += speed·dt where o1 .55, o2 .38, o3 .71 rad/s; x = cx + rx·cosθ, y = cy + ry·sinθ, then the <g>'s rotation applies.
- Depth: when sinθ < 0 (the far half), draw the light BEHIND the planet (move it to a <g> before the planet layer) and scale it to .7 with opacity .5; when sinθ ≥ 0 it passes in front at full size. Swap layers only when the sign flips.

MOTION
- Whole scene floats: translateY ±6px on an 8s ease-in-out alternate loop; the planet's highlight drifts 3% left/right on a 14s loop (animate the gradient position via a custom property registered with @property).
- Entrance: background glow scales from .8 → 1 and fades in (1.4s var(--ease)); planet scales .92 → 1 (1.2s); orbits draw in with stroke-dasharray/dashoffset over 1.6s, staggered 150ms; lights appear after their orbit finishes; H1 and caption fade up 16px at 300ms and 700ms.
- Pointer parallax: the scene tilts rotateX/rotateY up to 6° toward the pointer (lerp .06), perspective 900px. Touch: no tilt.
- prefers-reduced-motion: no float, no tilt, lights rest at fixed angles, entrance is a 300ms fade.

RESPONSIVE
- < 768px: scene size 82vw; H1 34px; nav hidden.

DO NOT
- No stars, no noise, no extra planets or moons, no image textures, no text gradients, no borders on anything. Keep exactly three orbits and three lights.
