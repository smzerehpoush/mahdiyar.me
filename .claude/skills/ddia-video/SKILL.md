---
name: ddia-video
description: Make an English YouTube explainer video (12–14 min, 16:9) or a YouTube Short (≤ 60 s, 9:16) for one chapter of Designing Data-Intensive Applications from the blog's DDIA session deck (public/blog/ddia-session-N), then publish it to the channel with captions, thumbnail, description and playlist. Use when the user asks for a DDIA chapter video, the next video in the series, or a DDIA Short.
argument-hint: "session <N> [short [topic]] | import <cloud branch>"
---

# DDIA chapter videos (long-form and Shorts)

Deterministic motion graphics (HTML/SVG scenes rendered frame by frame in headless Chrome), Kokoro TTS narration, whisper word
timings so every visual lands on its spoken word, procedural music, −14 LUFS mix, SRT captions, and a YouTube Studio upload driven
over CDP. Chapter 1 was made with this pipeline: long-form https://youtu.be/uCm4lbSYg2Y, Short https://youtube.com/shorts/unP7OnG847Y.

Request: `$ARGUMENTS` (e.g. `session 2`, `session 1 short tail latency`, `import claude/ddia-session-4-xyz`). Missing pieces you cannot
infer — which session, long or Short, a Short's topic — ask once, with a recommendation.

**Cloud session** (`CLAUDE_CODE_REMOTE=true`): read [reference/cloud.md](reference/cloud.md) first. It covers setup, where the work dir
lives, long commands, checkpoint commits to the session branch, and the hand-off that replaces §8–§9.
**`import <branch>`** (local only): run `node "${CLAUDE_SKILL_DIR}/scripts/import-cloud.mjs" --branch <branch>`. It brings a cloud
session's work into `~/Movies`. Then QA-check the imported `final.mp4` (a few frames, the length) and continue at §8 from its work dir.

`SKILL` = `${CLAUDE_SKILL_DIR}`. Read as needed:
- [reference/series-standards.md](reference/series-standards.md) — the user's binding requirements for every video. **Read first.**
- [reference/pipeline.md](reference/pipeline.md) — work-dir layout, `video.json` schema, every command, timing model, deliverables.
- [reference/script-format.md](reference/script-format.md) · [reference/scene-guide.md](reference/scene-guide.md) — what the script
  writers and scene builders follow (copied into each work dir's `brief/`).
- [reference/shorts.md](reference/shorts.md) — Shorts shape, safe area, cover, thumbnail, related-video eligibility.
- [reference/youtube-upload.md](reference/youtube-upload.md) — Studio upload step by step (selectors, gotchas, verification).
- Worked examples: `examples/session-01-long/` (brief, storyboard, accuracy notes, data, 28 scenes, thumbnail, video.json) and
  `examples/session-01-short/` (6 scenes). Reuse their visual language; copy patterns, not content.
- [reference/series-log.md](reference/series-log.md): what is published, the playlist, series decisions (e.g. Chapter 3 is two
  videos), pending Studio edits. Local sessions may also have the project memory `ddia-youtube-series` (local-only Studio notes).

## Ground rules
- Locally, never commit or push anything. In a cloud session, commit only `videos/` to the session's own branch and push it
  (reference/cloud.md); never `master`. Leave unrelated working-tree changes alone.
- The user signs in to Google themselves; never ask for or type a password. Never send their email address anywhere.
- Accuracy over speed: every number is sourced (book 1st ed. / deck), historical figures are labeled, illustrations are labeled.
- Check the channel for an existing upload of the same chapter/topic before publishing; never delete videos unless asked.
- Look at your output. QA images exist to be Read; a gate passes only when you have seen it pass.

## 0. Setup (once per machine; idempotent)
```bash
node "${CLAUDE_SKILL_DIR}/scripts/setup.mjs" --prefetch-tts        # macOS
bash "${CLAUDE_SKILL_DIR}/scripts/cloud-setup.sh"                  # Linux / cloud session (every session; seconds when cached)
```
Then scaffold the work dir (default `~/Movies/DDIA-Session-N-Video/work/<format>`, in a cloud session
`<repo>/videos/DDIA-Session-N-Video/work/<format>`; deliverables go to the `DDIA-Session-N-Video/` folder, a Short's to its `Short/`
folder):
```bash
node "${CLAUDE_SKILL_DIR}/scripts/new-video.mjs" --session N [--format short]
```
It copies the engine, writes a `video.json` skeleton (titles, deck, book, sections, YouTube defaults), copies the deck to
`brief/deck.html` and the guides to `brief/`, and links `node_modules` to `~/.cache/ddia-video/node_modules`. Run everything below in
the work dir. `--force` re-scaffolds but keeps every replaced file as `<file>.bak`; `--dir <work dir> --update-engine` refreshes only the
engine and the `brief/` guides.

## 1. Brief
1. Read the deck end to end, including speaker notes (`<aside class="notes">`). Map the session to the book chapter (the scaffold
   prints it; a chapter split over two sessions gets one video — confirm with the user if both decks exist).
   Sessions 3+4, 6+7, 9+10, 12+13 and 15+16 share a chapter: scaffold with the first session, save the second deck as
   `brief/deck-2.html`, add `"deck2": { "title", "url" }` to `video.json` (credited in the description and as `VIDEO.deck2` in the
   credits scene), and cover both decks in the brief.
2. Write `brief/brief.md`: goal, hook (a real-world problem plus the payoff, both within the first ~20 s; series-standards.md →
   Structure), the chapter's 2–4 framing questions, required content per section (every deck idea,
   labs turned into demonstrations, team-specific prompts replaced by general ones), ending (callback + questions + next chapter).
3. Write `brief/accuracy-notes.md`: numbered, binding decisions — each figure with source and qualification, deck errors corrected
   against the book, required on-screen labels. Verify claims against your knowledge of DDIA 1st ed.; drop anything unqualifiable.
4. Show the user a short outline (sections, hook, notable accuracy decisions) before investing in production if anything is a judgment
   call; otherwise proceed.

Shorts (read reference/shorts.md): `brief/brief.md` can be a few lines (topic, hook, the long-form video it points to), but
`brief/storyboard.md` (5–7 scenes with beats) and `brief/accuracy-notes.md` (every on-screen figure with its source) are required.
Set `relatedVideo` to the chapter's long-form URL (reference/series-log.md). Edit and run `build/data.mjs` only if the Short shows
illustrative charts; never run the unedited template (it writes placeholder numbers into `numbers.md`).

## 2. Storyboard and config
1. `brief/storyboard.md`: ~25–30 scenes for 12–14 min (see the Ch. 1 storyboard): id, target seconds, visual, beats (cue names). One
   idea per scene, diagrams that build with the narration, a section divider per part, credits at the end.
2. `video.json`: `scenes` (id, section, beats, word target), `sections` (labels like "01 · Data models", accents teal → orange →
   purple), `words` range, `spokenRules`, `description` (summary, chapters by scene id, blocks, figure notes, hashtags), YouTube tags.
3. Illustrative data: edit `build/data.mjs` (seeded; template in `reference/data-template.mjs`) → `node build/data.mjs` →
   `data/numbers.md` is the only source of illustrative numbers.

## 3. Script
**Workflows cost real tokens.** Run the workflows below directly only when the user typed `/ddia-video` or asked for agents/workflows.
If you picked this skill up yourself from a plain request, first tell the user what will run and roughly how many agents (script ≈ 9;
scenes ≈ 3 per group, e.g. ≈ 27 for 9 groups), and ask once. The scenes workflow is large either way: state its agent count before
starting it. If they decline, or the Workflow tool is not available, do that step yourself, following the same guides.

Long-form: run the script workflow (two drafts → judge → four review lenses → revise → adversarial check, ≈ 9 agents):
`Workflow({ scriptPath: "${CLAUDE_SKILL_DIR}/workflows/script.js", args: { dir: "<abs work dir>" } })`.
Then read the result yourself — the whole script, aloud in your head — and fix what is off. Gate: `node build/validate-script.mjs`
prints "OK: no errors" and the total is in range.
Shorts: write the script yourself (120–155 words, ≈ 140; reference/shorts.md), validate the same way.

## 4. Narration and timing
```bash
node build/tts.mjs && node build/words.mjs && node tools/asr-check.mjs
```
Gate: real total in range (long 12–14 min; Short ≤ 60 s — Shorts already run at `speed` 1.08, so trim words; keep pauses ≥ ~0.2 s); every
ASR-flagged line listened to via its transcript and fixed with a better `say` unless it is a spelling-only difference.

## 5. Scenes
Long-form: group the scenes (2–5 per group, related scenes together, a note per group from the storyboard with the must-have
details and labels) and run (opt-in as in §3; build → review → fix per group)
`Workflow({ scriptPath: "${CLAUDE_SKILL_DIR}/workflows/scenes.js", args: { dir, exemplar: "${CLAUDE_SKILL_DIR}/examples/session-01-long/scenes/fault-failure.js", groups } })`,
e.g. `groups: [{ key: "scalability", scenes: ["sca-intro", "twitter", "percentiles"], note: "Twitter, circa 2012 badge on every
Twitter scene; p50/p95/p99 from numbers.md; …" }, …]`.
Shorts: write the 5–7 scenes yourself following `brief/scene-guide.md` and the Short exemplars.
If the narration changes after scenes exist: re-run `tts` + `words`, write `brief/resync-diff.md`, and run `workflows/resync.js`
with `{ dir, groups: [{ key, scenes, fixes }] }`.

## 6. QA gates (all must pass; you look at the images)
- `node tools/still.mjs <scene> --qa` for every scene you touched: no JS errors, no layout warnings, every beat on its word, clean final
  frame.
- `node tools/anchor-audit.mjs`: all `k.word` calls exact (no fallback; no "later exact match" = early beat).
- `node tools/sweep.mjs` and Read every `out/qa/_sweep/sheet-NN.png`: no empty stretches, no jumps, nothing unreadable.
- Accuracy pass over on-screen text vs `accuracy-notes.md` / `numbers.md` (and historical/illustration labels present).

## 7. Render, audio, captions, thumbnail, package
```bash
node tools/render.mjs --workers 8 && node build/captions.mjs && node build/music.mjs && node build/mix.mjs
node tools/thumbnail.mjs && node build/package.mjs
```
Cloud session: render with the default workers, in the background (reference/cloud.md → Long commands).
Thumbnail: edit `stage/thumbnail.html` first (long-form 1280×720 from `reference/thumbnail-long.html`, ≤ 3 big words naming the problem or payoff + 1 line;
Short 1080×1920 from `reference/thumbnail-short.html`) and Read `out/thumbnail.png`. Check `final.mp4` frames at a few times
(ffmpeg `-ss`), the caption QA summary (≤ 20 cps mostly), and `out/youtube-description.txt` (credits, no-affiliation line, figure
notes, chapters ≥ 10 s apart, < 5000 chars, no `<` `>`).
Export to the deliverables folder (reference/pipeline.md → Deliverables).

## 8. Publish
Not in a cloud session: there, hand off instead (reference/cloud.md → Hand-off) and stop.
Follow reference/youtube-upload.md: start/reuse the CDP Chrome (the user signs in), duplicate check, upload, details, thumbnail,
playlist (long-form only), audience/AI/paid-promotion/tags/language, subtitles SRT, Shorts related video (if eligible), Public,
then `node tools/yt.mjs verify <id>`. Public is the series default (series-standards.md), but confirm with the user right before the
final Publish click; Private/Unlisted are fine while waiting.

## 9. Wrap up
- `video.json` → `youtube.videoId`. Update reference/series-log.md: add a row to Published, and note anything pending, such as a
  related-video link that wasn't allowed yet. Then ask the user whether to commit that one file to `master`, so cloud sessions see it.
- Report to the user: links, length, where the files are, any judgment calls and anything not done (with why). Offer to close the CDP
  Chrome window; the signed-in profile lives in `~/.cache/ddia-video/yt-profile` (delete it to sign out).
