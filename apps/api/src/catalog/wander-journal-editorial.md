Build ONE standalone HTML file: the cover of "Wander Journal", issue 07, a travel magazine. A sunset of flat layered mountains under a big pale sun, a serif headline with an italic second line, and a slow parallax as the sun sinks. All CSS in <style>, all JS in <script type="module">. Scenery is inline SVG drawn by code. No images, no libraries.

DELIVERABLE
- Title: Wander Journal — The long way to Patagonia
- <meta name="theme-color" content="#f6c48c">

FONTS
- Playfair Display 500 + 500 italic (headline) and Inter 500 (small caps lines) from Google Fonts, display=swap.

TOKENS
- Sky: --sky-top #f6c48c  --sky-mid #f39a86  --sky-low #c7678f
- Sun: --sun #fde4a7  glow rgba(253,228,167,.55)
- Ridges back → front: --r1 #b06a8a  --r2 #8e4f78  --r3 #6a3a66  --r4 #4b2a55  --ground #2a1b30
- --ink #fffaf3  --ink-80 rgba(255,250,243,.8)

TYPE
- Masthead lines: Inter 500, 11px, letter-spacing .18em, uppercase, --ink-80.
- Headline: Playfair Display 500, clamp(44px, 6vw, 92px), line-height 1, letter-spacing -.01em, centered, --ink.
  Second line in italic.
- Footer line: Inter 500, 12px, letter-spacing .2em, uppercase, --ink-80, centered.

LAYOUT + EXACT COPY (one screen, 100svh, overflow hidden)
- Sky: linear-gradient(180deg, var(--sky-top) 0%, var(--sky-mid) 48%, var(--sky-low) 78%).
- Masthead row (absolute top, padding 18px 22px, space-between): WANDER JOURNAL · ISSUE 07
- Headline (absolute, top 9svh, centered):
    The long way<br><em>to Patagonia</em>
- Sun: circle, diameter 26vmin, centered horizontally, center at 47% of the viewport height, fill --sun, glow box-shadow 0 0 120px 40px rgba(253,228,167,.45). It overlaps the headline's lower edge slightly; the headline stays on top.
- Mountains: one full-width SVG (viewBox 0 0 1440 400, preserveAspectRatio none) anchored to the bottom, height 42svh, four ridge paths + ground:
    each ridge is a polyline of 7–9 peaks generated from a seeded value noise (seeds 11, 23, 37, 51), sharper (fewer, taller peaks) at the back, broader at the front; heights from 55% (back) to 25% (front) of the SVG.
    ground: a flat band, 14% of the SVG height, color --ground.
- Footer line (absolute, bottom 22px, centered, over the ground): TEN DAYS · 1,200 KM · ONE ROAD

MOTION
- Sunset loop (the signature): over 14s, ease-in-out, alternate infinite:
    sun translateY 0 → 7vmin and scale 1 → .96
    sky gradient shifts warmer: animate registered @property colors --sky-mid #f39a86 → #ef8a8a and --sky-low #c7678f → #b0587f
- Parallax on pointer (fine pointer): ridges shift X by (pointer.x − .5) × [4, 8, 14, 22] px back → front, and Y by (pointer.y − .5) × [2, 3, 5, 8] px; lerp .06. Touch: a gentle 10s sway instead.
- Entrance: sky fades in; the sun rises from +12vmin with opacity 0 → 1 over 2s cubic-bezier(.16,1,.3,1); ridges slide up from +40px, back to front, 120ms stagger; headline lines fade up 18px with 150ms stagger; masthead and footer fade last.
- Film grain overlay: SVG feTurbulence, opacity .08, mix-blend-mode soft-light.
- prefers-reduced-motion: no sunset loop, no parallax, entrance is a 400ms fade.

RESPONSIVE
- Portrait (< 768px): headline clamp(40px, 11vw, 56px); sun 38vmin; ridges height 38svh.

A11Y
- The headline is the <h1>; scenery SVG is aria-hidden; text contrast over the sky ≥ 3:1 for the large headline.

DO NOT
- No photos, no stock illustrations, no clouds, no birds, no extra copy, no gradients on the mountains (flat fills only), no GSAP.
