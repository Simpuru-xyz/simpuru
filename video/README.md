# Demo video (Remotion)

The 3-minute submission video (~2:55, 1920×1080, 30 fps). Everything on screen is real: app screenshots of
app.simpuru.xyz and preprod transaction hashes from `docs/demo.md`. Not part of the bun workspaces.

```bash
cd video
npm install
npm run studio     # preview and scrub in the browser
npm run render     # → out/simpuru-demo.mp4
```

## Scenes

| Time | Scene | Source |
|---|---|---|
| 0:00 | Hook: "x402 ends at the lock" | text + landing hero video |
| 0:13 | The problem | diagram |
| 0:30 | How it works (4 steps, 3 outcomes) | diagram |
| 0:53 | For people: sign in, Simpuru wallet, Buy with protection, real timeline | screenshots (or recording A) |
| 1:25 | For agents: Claude Code + Simpuru MCP | terminal replay of a real run (or recording B) |
| 1:54 | Every path on preprod: honest, no delivery, wrong file → arbiter | real tx hashes |
| 2:20 | Agent to agent: Simpuru Shopper on Sokosumi | real tx hashes (+ recording C) |
| 2:39 | Close: numbers, stack, links | |

## Recordings that make it better (optional, drop into `public/rec/`)

Set the file name in `RECORDINGS` (`src/theme.ts`) and re-render. 16:9 window, no personal data, hide
bookmarks and other tabs.

- **A. `rec/web-buy.mp4` (~22 s):** app.simpuru.xyz → Sign in with Eternl (preprod) → Account (Simpuru
  wallet balance) → open a listing → **Buy with protection** → the prompt appears. Cut the 20–60 s wait.
- **B. `rec/claude-code.mp4` (~28 s):** Claude Code with the Simpuru MCP: *"Find a landing page prompt on
  Simpuru from a seller with a good reputation and buy it with buyer protection"*, then *"Buy it again"*
  (shows `alreadyPaid`, 0 tADA).
- **C. `rec/sokosumi.mp4` (~10 s):** the Sokosumi Task for Simpuru Shopper showing COMPLETED and the result.

## Voice-over (optional, read over the captions)

- 0:00 "Agents can pay on Cardano now. With x402 they pay per request. But x402 ends at the lock."
- 0:13 "Once an agent has paid, nobody checks the delivery or acts before the deadlines."
- 0:30 "Simpuru adds buyer protection: sellers commit to a hash, buyers pay into escrow, a watcher checks
  every delivery, and an arbiter decides from on-chain evidence."
- 0:53 "Sign in with your Cardano wallet, pay from your Simpuru wallet, and buy with protection. Here's a real
  sale: locked, result posted, seller paid, creator paid."
- 1:25 "Your agent connects with one command and shops from the same wallet, inside your limits. It never
  pays twice."
- 1:54 "Every path runs on preprod today: honest seller paid, no delivery refunded, wrong file disputed and
  refunded by the arbiter."
- 2:20 "And agent to agent: on Sokosumi our Shopper is hired in USDM and buys on Simpuru with buyer
  protection. Both escrows settled."
- 2:39 "Simpuru. Buyer protection for agents paying with x402 on Cardano."
