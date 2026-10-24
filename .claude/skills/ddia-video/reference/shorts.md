# YouTube Shorts

Worked example: `examples/session-01-short/` (Chapter 1, "How Twitter Built Your Timeline: Fan-Out Explained", 59.5 s,
https://youtube.com/shorts/unP7OnG847Y). Rebuild it with `node scripts/new-video.mjs --session 1 --format short --example session-01-short --dir <dir>`.
It was voiced with `af_heart` and the rebuild keeps that voice. Its 146 words would run 64.5 s in `am_michael`, the series voice now.

## Pick the idea
One self-contained idea from the chapter that has a number or a contrast people remember (Chapter 1: Twitter fan-out — 4,600 tweets/s
vs 300,000 timeline reads/s; tail-latency amplification — 1% slow calls → 63% slow requests). Check the channel's existing Shorts first
(see youtube-upload.md §1) so topics do not repeat. Same accuracy rules as long-form: label historical figures on screen and in speech.

## Shape (≤ 60 s, 5–7 scenes, 110–140 words, ≈ 128, at 1.08×)
1. **Hook (0–10 s)** — a question or surprising contrast as the headline, visible from frame 0 (it is the cover in the feed). The first
   spoken sentence states the tension.
2. **2–4 explanation scenes** — one diagram each, one idea each, beats on spoken words.
3. **Payoff** — the lesson in one sentence (big type).
4. **Source line** — "From Chapter N of Designing Data-Intensive Applications. Full explainer linked below." with a book card.

## Format specifics (handled by the engine when `video.json` `format` = `"short"`)
- Canvas 1080×1920; safe area x 60–940, y 220–1480 (QA flags `UNSAFE`). Design in x 80–920, centre column x = 500.
- No fade-in from black (first frame = cover), 0.35 s lead before the first line and between scenes, 1.2 s end hold, 0.6 s fade-out.
- Captions: max 32 chars per line, 2 lines. Uploaded as an SRT track; not burned in (burned-in captions would collide with the diagrams
  and double up when viewers turn CC on).
- Thumbnail 1080×1920 from `stage/thumbnail.html` (template: `reference/thumbnail-short.html`); keep the claim and the visual inside
  y ≈ 300–1500 because feeds crop the cover. Studio accepts a custom Shorts thumbnail on desktop.
- Description: summary, Sources (with "Full video: <long-form URL>" from `video.json` `relatedVideo`), notes on figures, hashtags
  ending in `#Shorts`. No chapters.
- Not added to the chapter playlist.
- Related video: set it in the Video elements step if the channel is eligible (see youtube-upload.md); otherwise note it for later.

## Sizes that read well on a phone
Headline 84–104 px · numbers 76–130 px · labels 38–44 px · minimum 36 px · box labels `fs` 40–46 · arrow width 4–5 · packets r 10–11.
