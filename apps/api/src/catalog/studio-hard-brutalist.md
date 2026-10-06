Build ONE standalone HTML file for "Studio Hard", a branding studio in Lisbon: a loud brutalist grid of flat color cells that keep swapping colors and glyphs, over a giant two-line headline. All CSS in <style>, all JS in <script type="module">. No images, no libraries.

DELIVERABLE
- Title: Studio Hard — We make loud brands
- <meta name="theme-color" content="#fff200">

FONTS
- Archivo Black 400 (glyphs + headline) and Space Mono 400/700 (tags) from Google Fonts, display=swap.

TOKENS (only these five colors, flat, no tints)
- --yellow #fff200  --black #0a0a0a  --blue #0047ff  --red #ff3b00  --line #0a0a0a
- Grid line 2px solid var(--line). No radius anywhere.

LAYOUT (one screen, 100svh, no scroll)
- A 4-column × 3-row grid filling the viewport; every cell has the 2px line on its right and bottom (the outer frame too).
- Rows 1 and 2: 8 cells, each a centered glyph. Row 3 spans all 4 columns and holds the headline.
- Initial cells, left → right:
    row 1:  A on yellow (black glyph) | ✶ on yellow (black) | G on blue (yellow glyph) | empty yellow
    row 2:  empty yellow | → on black (yellow glyph) | empty yellow | ● on red (black glyph)
- Glyph size: clamp(40px, 5.5vw, 80px). The arrow and dot are text glyphs (U+2192, U+25CF), the star is U+2736.
- Headline (row 3), Archivo Black, clamp(48px, 8.4vw, 132px), line-height .9, letter-spacing -.03em, left-aligned with 2vw padding, anchored to the bottom of the cell:
    WE MAKE
    LOUD BRANDS
- Tags, Space Mono 700 11px, uppercase, black background, yellow text, padding 4px 8px:
    top-left over cell 1: [ STUDIO HARD ]
    top-right over cell 4: EST. 2019 / LISBON

SWAP ENGINE (the signature; do not fake it with a GIF)
- Every 900ms one random cell from rows 1–2 changes: it picks a new background from {yellow, black, blue, red} different from its current one, and its glyph color becomes the contrasting pair (yellow on black/blue, black on yellow/red).
- Cells with a glyph keep their glyph; empty cells occasionally (20% chance) gain one of ✶ → ● for one cycle.
- The change is a hard cut, no fade, no transition. That is the style.
- Never let two adjacent cells share the same color after a swap (re-roll if they would).
- Pointer: hovering a cell triggers its swap immediately and resets the 900ms timer for that cell.

MOTION / ENTRANCE
- On load the grid lines draw first: each line scales from 0 → 1 along its axis (scaleX for horizontals, scaleY for verticals), 500ms steps(6) easing (stepped, mechanical), staggered 40ms.
- Then the cells fill in a random order, hard cuts, 60ms apart.
- Then the headline types in: one letter every 35ms (no blinking cursor).
- prefers-reduced-motion: everything appears at once; no swapping.

RESPONSIVE
- < 768px: grid becomes 2 columns × 5 rows (rows 1–4 hold the 8 glyph cells, row 5 the headline at clamp(40px, 13vw, 64px)).

A11Y
- The glyph grid is aria-hidden; the headline is the <h1>. Tags are plain text.

DO NOT
- No gradients, no shadows, no rounded corners, no images, no transitions on color, no extra colors, no lowercase in the headline, no GSAP.
