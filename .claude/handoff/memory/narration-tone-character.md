---
name: narration-tone-character
description: "The user finds the DDIA narration too dry and wants a simple animated character that seems to be presenting; decided 2026-10-31: warm script + paced Kokoro am_michael ×1.05, robot in the corner, from Part 2 on"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 32e320eb-b919-4da4-931d-aaf8a06c9ce2
  modified: 2026-10-30T21:08:55.691Z
---

On 2026-10-31 the user said (Persian): the videos' voice tone is very dry, and they'd like to add a simple animated character, as if it were the one explaining.

**Why:** the Kokoro narration (`am_michael`, picked from a dry-script comparison on 2026-10-24) plus a terse, telegraphic script sounds flat. They want the videos to feel presented by someone.

**How to apply:**
- Scripts should come out warm by default: contractions, direct "you", real questions, short punchy turns, varied pauses. Once the user picks a direction, put this into series-standards.md and script-format.md.
- Kokoro has no emotion control. If a warmer script isn't enough, the next step is another engine. Chatterbox (MIT, ~3.2 GB of weights plus PyTorch; needs a Python 3.11/3.12 venv, since the Mac has 3.15) needs the user's OK to download. A cloud engine needs the user's own API key in an env var.
- Character: it must be original and drawn deterministically. Mouth from a per-frame loudness envelope of narration.wav, seeded blinks and gestures, a global layer driven from R.seek like `#chrome`. Bottom-right corner (x > 1760, y > 840, mostly outside the safe area). It leaves before the last ~20 s, because the end screen uses the right half. No character in Shorts for now.
- Options page: ~/Movies/DDIA-Session-7-Video/options/narrator-options.html (hook samples A–D and three characters: disk, host, bot).
- **The user's picks (2026-10-31):** voice sample C (warmer script, shorter sentences, varied pauses, Kokoro `am_michael` at speed 1.05; no new engine). Character: the **robot** (screen face, its mouth is a 5-bar sound wave, antenna, section-accent colour). Placement: always in the bottom-right corner, gone for the last ~20 s (end screen). Scope: from Ch5 Part 2 on; published videos stay as they are.
- Never re-render or replace published videos without a yes.

Related: [[ddia-youtube-series]], [[ddia-todo-file]].
