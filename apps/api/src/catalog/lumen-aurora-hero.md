Build ONE standalone HTML file for "Lumen", a realtime analytics SaaS: a full-viewport dark hero lit by a slow aurora. All CSS in one <style>, all JS in one <script type="module">. No frameworks, no build step, no images or videos: every visual is drawn by CSS and a single <canvas>. Do not add sections below the hero, extra copy, testimonials or logos.

DELIVERABLE
- Title: Lumen — Ship analytics at light speed
- <meta name="theme-color" content="#05060a">
- Before first paint: <script>document.documentElement.classList.add('js')</script>
- Works opened from any static server; no network calls except Google Fonts.

FONTS
- Inter Tight 400 / 500 / 700 from Google Fonts (one request, display=swap). Preconnect both Google hosts.
- Fallback face "Inter Tight Fallback": local Arial, size-adjust 98%, ascent-override 96%, descent-override 24%.
- Stack: 'Inter Tight','Inter Tight Fallback',system-ui,sans-serif. No second family. Never italic.

TOKENS (:root)
- --bg #05060a  --ink #f5f7ff  --ink-70 color-mix(in oklab, var(--ink) 70%, transparent)  --ink-55 (55%)  --ink-12 (12%)  --ink-06 (6%)
- Aurora: --a1 #5b4bff (violet)  --a2 #12c2a9 (teal)  --a3 #d946ef (magenta)  --a4 #38bdf8 (sky)
- --radius-pill 999px  --pad-x clamp(20px, 2.8vw, 44px)
- --ease-out-expo cubic-bezier(.16,1,.3,1)  --ease-soft cubic-bezier(.33,0,0,1)
- @layer reset, tokens, base, layout, components, motion;  use nesting, clamp(), color-mix, svh.

TYPE
- Display: clamp(44px, 7.4vw, 104px) / line-height .98 / letter-spacing -.045em / weight 700
- Lead: clamp(16px, 1.35vw, 19px) / 1.5 / -.01em / weight 400 / --ink-70, max-width 34em, centered
- UI: 14px / 1 / -.005em / weight 500

LAYOUT + EXACT COPY
1) Header (absolute top, padding 22px var(--pad-x), 3-column grid: 1fr auto 1fr):
   - Left: "◆ Lumen" (the diamond is U+25C6 at .8em, 6px gap), 15px weight 700.
   - Center nav: Product · Pricing · Docs (gap 28px, --ink-70, hover --ink, no underline).
   - Right: "Sign in" pill, height 32px, padding 0 16px, background --ink-06, 1px inset ring --ink-12 (box-shadow inset, not a border), backdrop-filter blur(10px).
2) Hero: min-height 100svh, grid place-items center, text-align center, padding-top 64px.
   - Badge pill: "✦ Now with realtime sync", 12.5px weight 500, height 28px, padding 0 12px, glass like Sign in, margin-bottom 28px.
   - H1, two lines with an explicit <br>:
       line 1 "Ship analytics" in --ink
       line 2 "at light speed" as gradient text: background linear-gradient(90deg, var(--a2), var(--a4) 30%, #a5b4fc 55%, #f0abfc 80%, var(--a2)); background-size 200% 100%; -webkit-background-clip text; color transparent.
   - Lead (margin-top 24px): The data platform your whole team actually opens. Queries in milliseconds, dashboards in minutes.
   - Buttons row (margin-top 36px, gap 12px):
       "Start free" solid: background #fff, color #05060a, height 44px, padding 0 22px, pill, weight 600.
       "Book a demo" glass: --ink-06 fill, inset ring --ink-12, same size. Hover: fill --ink-12.
       Active: scale .97 over 120ms.

AURORA ENGINE (the look depends on this; do not replace with a static gradient)
- One fixed <canvas id="sky"> behind everything, sized to the viewport × devicePixelRatio (cap DPR at 2).
- Four blobs, each a radial gradient (color at 0, color at 45% alpha .55, transparent at 100%), drawn with globalCompositeOperation "lighter":
    a1 violet  center (18%, 30%)  radius .55·max(w,h)
    a2 teal    center (82%, 18%)  radius .48·max(w,h)
    a3 magenta center (68%, 88%)  radius .52·max(w,h)
    a4 sky     center (30%, 82%)  radius .36·max(w,h)
- Each blob orbits its center on a Lissajous path: x += sin(t·fx + φ)·.09w, y += cos(t·fy + φ)·.07h, with fx/fy between .05 and .11 rad/s (different per blob) and random φ. Radius breathes ±6% at .07 rad/s.
- After the blobs, fill the canvas with rgba(5,6,10,.35) using "source-over" so the edges fall into near-black. Add a CSS vignette on top: radial-gradient(ellipse at center, transparent 40%, rgba(5,6,10,.85) 100%).
- Grain: an SVG feTurbulence (baseFrequency .9, 2 octaves) as a fixed overlay at opacity .06, mix-blend-mode overlay.
- requestAnimationFrame only while the tab is visible; render at most every 33ms (30fps is enough for this).

MOTION
- Gradient line: background-position animates 0% → 200% over 9s linear infinite.
- Entrance after document.fonts.ready (failsafe 1500ms), staggered 90ms in this order: badge, H1 line 1, H1 line 2, lead, buttons. Each: opacity 0→1, translateY 18px→0, filter blur(10px)→0, 1.1s var(--ease-out-expo). Header fades in last over 600ms.
- Cursor: the a1 blob's center is pulled 6% toward the pointer (lerp .05 per frame); release to rest on pointerleave.
- prefers-reduced-motion: no blob movement (draw one still frame), no gradient pan, entrance is a 300ms opacity fade only.

RESPONSIVE
- Below 768px: nav hidden, header becomes logo + Sign in; H1 clamps to 44px; buttons stack full width (max 320px); blob radii × 1.3 so color still fills the narrow screen.

A11Y
- One <h1>. Buttons are <a href="#"> with visible :focus-visible ring 2px #fff offset 3px. Contrast of lead text ≥ 4.5:1 against the darkest aurora region.

DO NOT
- No images, video, Lottie, three.js, GSAP or icon fonts. No borders (rings are inset box-shadows). No extra sections, footer or cookie bar. No pure #000 background. No uppercase anywhere.
