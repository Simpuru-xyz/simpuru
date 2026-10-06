Build a pricing section with three tiers and a monthly / yearly toggle as ONE React + TypeScript component file "Pricing.tsx" styled with Tailwind utility classes. No other dependencies (no Framer Motion, no Headless UI, no icon packages). It must drop into any React 18+ app with Tailwind 3+ configured.

DELIVERABLE
- export default function Pricing(): JSX.Element
- Self-contained: data, state, animations and the inline SVG check icon live in this one file.
- Works with server rendering (no window access during render).

LOOK
- Page section background #fafafa, text #0a0a0a, muted #6b7280.
- Font: inherit the app's font; headings use font-semibold tracking-tight.
- Max width 1100px, centered, padding y 96px.

EXACT COPY
- Eyebrow: Pricing
- Heading: Plans that grow with your team
- Sub: Start free. Upgrade when it pays for itself.
- Toggle labels: Monthly · Yearly (save 20%)
- Tiers (monthly / yearly per month):
    Starter $0 / $0 · "For side projects" · 1 project, Community support, 1 GB storage · button "Start free"
    Team $24 / $19 · "For growing teams" · Unlimited projects, 10 seats, Priority support, 100 GB storage · button "Start trial"  (highlighted)
    Scale $79 / $63 · "For companies" · SSO and SCIM, Audit log, 99.9% SLA, Dedicated support · button "Talk to sales"
- Under the price: "per month" for paid tiers, "forever" for Starter; yearly adds the line "billed yearly".

TOGGLE
- A pill (h-11, p-1, bg-white, ring-1 ring-black/10, rounded-full) with two options and a sliding thumb (absolute, bg-black, rounded-full) behind the active label; active label text white, inactive #6b7280.
- The thumb moves with transition: transform 350ms cubic-bezier(.34,1.56,.64,1) (slight overshoot). Measure each option's width with refs so the thumb always fits its label.
- It is a real radio group: role="radiogroup", each option role="radio" aria-checked; ArrowLeft/ArrowRight switch; focus ring ring-2 ring-black ring-offset-2.

CARDS
- Grid md:grid-cols-3 gap-6; each card rounded-3xl bg-white p-8 ring-1 ring-black/10, flex column, equal height.
- Team card: -translate-y-3, a 2px gradient border (indigo #6366f1 → fuchsia #d946ef) done with a wrapper: p-[2px] rounded-3xl bg-gradient-to-br, inner card rounded-[22px]; badge "Most popular" (absolute -top-3 left-8, rounded-full bg-black text-white text-xs px-3 py-1).
- Features: list with an inline 16px SVG check (stroke currentColor, stroke-width 2) in #6366f1 for Team, #0a0a0a otherwise.
- Button: full width, h-11, rounded-xl; Team: bg-black text-white hover:bg-black/85; others: bg-black/5 hover:bg-black/10.

PRICE ODOMETER (the signature)
- Each price renders as "$" + digits. Each digit is a fixed-height window (h-[1em], overflow-hidden) containing a vertical strip 0–9; translateY(-digit em) selects it.
- Switching period animates every digit strip to its new value: transform 400ms cubic-bezier(.22,1,.36,1), staggered 40ms per digit from the left. When the number of digits changes, new digit windows grow in width from 0 (200ms).
- prefers-reduced-motion (matchMedia in an effect): no strip animation, values swap instantly; thumb moves without overshoot.

RESPONSIVE
- < md: cards stack, Team card first, no translate.

DO NOT
- No external UI or animation libraries, no images, no dark mode toggle, no extra tiers, no FAQ under the cards.
