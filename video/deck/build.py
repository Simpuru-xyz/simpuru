"""Builds the submission deck (out/simpuru-deck.pptx) with the demo video embedded on slide 2.
Run from video/: python3 deck/build.py  (needs out/simpuru-demo.mp4 and out/deck/ stills)."""
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.util import Emu, Pt

INK, MUTED, BG, NIGHT, LINE = "0A0A0A", "6B6B6B", "F4F4F5", "0B0B12", "E6E6E6"
GREEN, AMBER, RED, VIOLET = "16A34A", "D97706", "DC2626", "6D5DFC"
FONT = "Helvetica Neue"
W, H = 12192000, 6858000  # 16:9
px = lambda v: Emu(int(v * W / 1920))  # author in 1920x1080 pixels

prs = Presentation()
prs.slide_width, prs.slide_height = W, H
blank = prs.slide_layouts[6]


def slide(bg=BG):
    s = prs.slides.add_slide(blank)
    s.background.fill.solid()
    s.background.fill.fore_color.rgb = RGBColor.from_string(bg)
    return s


def text(s, x, y, w, h, value, size=28, color=INK, bold=False, mono=False, align=None):
    box = s.shapes.add_textbox(px(x), px(y), px(w), px(h))
    tf = box.text_frame
    tf.word_wrap = True
    for i, line in enumerate(value.split("\n")):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        if align:
            p.alignment = align
        r = p.add_run()
        r.text = line
        r.font.size = Pt(size * 0.75)
        r.font.bold = bold
        r.font.name = "Menlo" if mono else FONT
        r.font.color.rgb = RGBColor.from_string(color)
    return box


def card(s, x, y, w, h, fill="FFFFFF", line=LINE):
    from pptx.enum.shapes import MSO_SHAPE

    r = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, px(x), px(y), px(w), px(h))
    r.adjustments[0] = 0.08
    r.fill.solid()
    r.fill.fore_color.rgb = RGBColor.from_string(fill)
    r.line.color.rgb = RGBColor.from_string(line)
    r.shadow.inherit = False
    return r


def eyebrow(s, x, y, value, dark=False):
    text(s, x, y, 900, 40, value.upper(), 20, "9B9BB0" if dark else MUTED, mono=True)


def image(s, path, x, y, w=None, h=None):
    return s.shapes.add_picture(path, px(x), px(y), px(w) if w else None, px(h) if h else None)


# 1. Title
s = slide()
text(s, 0, 330, 1920, 160, "Simpuru", 150, bold=True, align=1)
text(s, 0, 520, 1920, 60, "Buyer protection for agents paying with x402 on Cardano.", 40, MUTED, align=1)
text(s, 0, 640, 1920, 40, "app.simpuru.xyz  ·  live on Cardano preprod", 26, INK, mono=True, align=1)
text(s, 0, 960, 1920, 40, "TOKEN2049 Origins  ·  Cardano Agentic Commerce  ·  Masumi", 22, MUTED, align=1)

# 2. Demo (embedded)
s = slide(NIGHT)
s.shapes.add_movie("out/simpuru-demo.mp4", px(160), px(90), px(1600), px(900), poster_frame_image="out/deck/s200.png", mime_type="video/mp4")

# 3. Problem
s = slide(NIGHT)
eyebrow(s, 140, 180, "The problem", True)
text(s, 140, 230, 1640, 140, "x402 ends at the lock.", 110, "FFFFFF", bold=True)
text(s, 140, 410, 1500, 120, "“A settled masumi payment means the funds are locked in the escrow, not delivered to the seller.”  x402 Cardano spec", 30, "B9B9C9")
for i, (label, col) in enumerate([("Nothing arrives", RED), ("The wrong file arrives", RED), ("The deadline passes at 3 a.m.", AMBER)]):
    c = card(s, 140 + i * 560, 640, 520, 150, "16161F", "2A2A35")
    text(s, 175 + i * 560, 690, 460, 60, label, 34, "FFFFFF", bold=True)
text(s, 140, 880, 1600, 60, "Once an agent has paid, nobody checks the delivery or acts before the deadlines.", 30, "B9B9C9")

# 4. How it works
s = slide()
eyebrow(s, 140, 150, "How it works")
text(s, 140, 200, 1640, 110, "Protection is built in.", 84, bold=True)
steps = [("1", "Seller commits", "The listing carries the SHA-256 of its content."),
         ("2", "Pay over x402", "Instantly, or into Masumi vested_pay escrow."),
         ("3", "Watcher checks", "Delivery against the commitment. On its own."),
         ("4", "Arbiter decides", "From on-chain evidence, not opinion.")]
for i, (n, t, b) in enumerate(steps):
    x = 140 + i * 420
    card(s, x, 380, 390, 300)
    text(s, x + 30, 410, 330, 60, n, 40, VIOLET, bold=True)
    text(s, x + 30, 480, 330, 60, t, 34, bold=True)
    text(s, x + 30, 545, 330, 120, b, 24, MUTED)
for i, (t, col) in enumerate([("Right delivery: seller paid", GREEN), ("Nothing in time: refund", AMBER), ("Wrong file: buyer refunded", RED)]):
    text(s, 140 + i * 560, 760, 540, 50, "●  " + t, 28, col, bold=True)

# 5. For people
s = slide()
eyebrow(s, 120, 200, "For people")
text(s, 120, 250, 560, 220, "Your wallet\nis the account.", 66, bold=True)
text(s, 120, 470, 520, 200, "Sign in with a Cardano wallet.\nPay from your Simpuru wallet.\nBuy instantly or with protection.\nAnyone can sell.", 28, MUTED)
image(s, "out/deck/c470.png", 700, 125, w=1120)

# 6. For agents
s = slide()
eyebrow(s, 120, 200, "For agents")
text(s, 120, 250, 560, 220, "One command.", 66, bold=True)
text(s, 120, 360, 520, 120, "claude mcp add --transport http\nsimpuru https://api.simpuru.xyz/mcp", 20, INK, mono=True)
text(s, 120, 480, 520, 200, "Sign in with your wallet. The agent spends your Simpuru wallet inside your limits. It never pays twice.", 28, MUTED)
image(s, "out/deck/c1120.png", 700, 125, w=1120)

# 7. Three outcomes
s = slide()
image(s, "out/deck/s1300.png", 0, 0, w=1920)

# 8. Agent to agent
s = slide()
eyebrow(s, 120, 200, "Agent to agent  ·  Masumi")
text(s, 120, 250, 560, 220, "Hired on\nSokosumi.", 66, bold=True)
text(s, 120, 470, 520, 220, "Simpuru Shopper is a Masumi Coworker on our own payment node. Paid 1 USDM for the job, it buys on Simpuru with buyer protection.", 28, MUTED)
image(s, "out/deck/c1610.png", 700, 125, w=1120)

# 9. Numbers
s = slide()
eyebrow(s, 140, 180, "Measured on preprod")
text(s, 140, 230, 1640, 110, "Fast enough for an agent.", 84, bold=True)
for i, (a, b) in enumerate([("17–31 s", "instant, pay to content"), ("30–50 s", "protected, pay to content"), ("0.40 tADA", "per escrow transaction"), ("4 / 4", "outcomes proven on chain")]):
    x = 140 + i * 420
    card(s, x, 420, 390, 230)
    text(s, x + 30, 460, 340, 90, a, 60, bold=True)
    text(s, x + 30, 560, 340, 60, b, 24, MUTED)
text(s, 140, 760, 1640, 60, "Every claim links a transaction: github.com/Simpuru-xyz/simpuru  (docs/demo.md)", 24, MUTED)

# 10. Track fit
s = slide()
eyebrow(s, 140, 140, "Cardano Agentic Commerce")
text(s, 140, 190, 1640, 100, "What the track asks for.", 72, bold=True)
rows = [("x402 open standard", "Paywall with instant and escrow paths, in-process facilitator"),
        ("Agents pay autonomously", "Hosted MCP, owner-set limits, never pays twice"),
        ("Monetize content per request", "Anyone lists; each purchase is one x402 payment"),
        ("Agent-to-agent flows", "Seller agent settles; Sokosumi Coworker hired in USDM"),
        ("Unique innovation", "Automatic refund, dispute and an evidence-based arbiter")]
for i, (a, b) in enumerate(rows):
    y = 340 + i * 112
    card(s, 140, y, 1640, 96)
    text(s, 175, y + 26, 560, 50, a, 28, bold=True)
    text(s, 760, y + 28, 1000, 50, b, 26, MUTED)

# 11. Stack
s = slide()
eyebrow(s, 140, 180, "Built with")
text(s, 140, 230, 1640, 110, "Cardano all the way down.", 84, bold=True)
stack = [("Payments", "x402 v2 (@x402/cardano, hono, fetch, mcp)"),
         ("Escrow", "Masumi vested_pay V2, our deployment and arbiter key"),
         ("Chain", "Cardano preprod, Blockfrost, Evolution SDK, CIP-30 and CIP-8"),
         ("Agents", "MCP server with OAuth 2.1, Masumi Payment Service, Sokosumi"),
         ("Apps", "Hono on Bun, Next.js on Vercel, OpenAPI 3.1")]
for i, (a, b) in enumerate(stack):
    y = 400 + i * 100
    text(s, 140, y, 300, 50, a, 30, bold=True)
    text(s, 460, y, 1300, 50, b, 30, MUTED)

# 12. Team and next
s = slide(NIGHT)
text(s, 140, 200, 1640, 110, "This is Simpuru.", 96, "FFFFFF", bold=True)
team = [("Ghoza", "contracts, escrow, arbiter"), ("Kiel", "API, MCP, coworker"), ("Wisnu", "web app"), ("Axel", "landing")]
for i, (n, r) in enumerate(team):
    text(s, 140 + i * 420, 420, 400, 50, n, 34, "FFFFFF", bold=True)
    text(s, 140 + i * 420, 470, 400, 50, r, 24, "9B9BB0")
text(s, 140, 620, 1640, 50, "Next: an audit before mainnet, a multi-key arbiter, USDM prices next to ADA, goods beyond prompts.", 28, "B9B9C9")
text(s, 140, 860, 1640, 50, "simpuru.xyz  ·  app.simpuru.xyz  ·  api.simpuru.xyz/docs", 28, "C4B5FD", mono=True)

prs.save("out/simpuru-deck.pptx")
print("saved out/simpuru-deck.pptx", len(prs.slides._sldIdLst), "slides")
