# Demo film and deck (Remotion)

The submission film (`Film`, ~1:40, 1920×1080, 30 fps, narrated) and the pitch deck (`Slides`). Everything on
screen is the product rebuilt as animated UI, real listing previews and real preprod transactions.
Not part of the bun workspaces.

```bash
cd video
npm install
npm run studio                 # preview
npm run render                 # → out/simpuru-demo.mp4
python3 vo/make.py             # regenerate the voice-over (edge-tts) after editing its lines
python3 deck/build.py          # slides in out/slides/*.png → out/simpuru-deck.pptx (film on slide 2)
```

| File | What |
|---|---|
| `src/film.tsx` | the film: opening, landing, web app, agent (OAuth + Claude Code), outcomes, coworker, outro |
| `src/app.tsx` | app.simpuru.xyz and simpuru.xyz rebuilt as animated components, with the cursor |
| `src/agent.ts` | the Claude Code conversation |
| `src/slides.tsx` | the deck |
| `vo/make.py` | voice-over lines and voice (edge-tts) |
| `public/sfx/make.sh` | sound effects, synthesized with ffmpeg |
