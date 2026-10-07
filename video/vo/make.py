"""Voice-over for the film, made with edge-tts. Writes public/vo/<id>.mp3 and src/vo.json (seconds).

    python3 vo/make.py            # from video/

Lines are short and spoken fast; the film places each one at its beat (src/v3.tsx).
"""
import asyncio
import json
import subprocess

import edge_tts

VOICE = "en-US-AndrewMultilingualNeural"
RATE = "+18%"

LINES = {
    # Opening
    "o1": "Great UI design is expensive. A prompt gets you there in minutes, but prompt libraries bill you every month, for prompts you use once.",
    "o2": "And your agent needs just one.",
    "o3": "So we built it on Cardano. x402 lets anyone pay per prompt, even an agent. Escrow holds the money until the prompt arrives. And reputation comes from real refunds, so it can't be faked.",
    "o4": "This is Simpuru.",
    "site": "Pay per prompt, not per month. And if it never arrives, you get your money back.",
    # Web app
    "w1": "Browse prompts straight from the creators.",
    "w2": "Sign in with your Cardano wallet. One signature, no funds move.",
    "w3": "Top up with test ADA.",
    "w4": "Buy with protection. Your payment waits in escrow.",
    "w5": "The prompt lands, checked against the seller's hash.",
    "w6": "Every step is on chain. Locked, delivered, seller paid, creator paid.",
    "w7": "And anyone can sell. The hash is locked in before anyone pays.",
    # Agents
    "a1": "Connect an agent with one command.",
    "a1b": "It opens a sign-in page. Approve with your wallet, set a budget, and you're back in the terminal.",
    "a2": "Now Claude shops on its own. It filters sellers by reputation, checks the listing and its wallet, then buys with protection. Ask again, and it won't pay twice.",
    # Proof, coworker, outro
    "p1": "Three outcomes, all real on preprod. Delivered, the seller gets paid. Never delivered, refunded automatically. Wrong file, our arbiter refunds the buyer.",
    "c1": "And agent to agent. On Sokosumi, another agent hires our shopper in USDM, and it buys on Simpuru with protection.",
    "e1": "Simpuru. Buyer protection for agents that pay, on Cardano.",
}


async def main() -> None:
    out = {}
    for key, text in LINES.items():
        path = f"public/vo/{key}.mp3"
        await edge_tts.Communicate(text, VOICE, rate=RATE).save(path)
        dur = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
        out[key] = round(float(dur), 2)
        print(f"{key:5} {out[key]:5.2f}s  {text}")
    with open("src/vo.json", "w") as f:
        json.dump(out, f, indent=2)


asyncio.run(main())
