# DDIA Session 4 — Designing Data-Intensive Applications, Chapter 3, Part 2: Why Analytics Uses Columns

Long-form explainer (12:50, 1920×1080, 60 fps, English narration, −14 LUFS) made in a Claude Code cloud session.
YouTube: not published yet (publish locally with `/ddia-video import <branch>`).

## Files
- `DDIA-Session-4-Why-Analytics-Uses-Columns.mp4`: final video with an English mov_text subtitle track
- `captions.en.srt`, `captions.en.vtt`: captions for the YouTube upload ("with timing")
- `thumbnail.jpg` / `thumbnail.png`: custom thumbnail, 1280×720 ("Rows vs. Columns")
- `youtube-description.txt`: description with chapters, credits, no-affiliation line and figure notes
- `script-with-timings.md`: narration with timestamps
- `work/long/`: rebuildable source (video.json, brief/, script/, stage/scenes/, data/)

## Rebuild
From `work/long/`: `node build/tts.mjs && node build/words.mjs`, then `node tools/render.mjs && node build/captions.mjs &&
node build/music.mjs && node build/mix.mjs && node tools/thumbnail.mjs && node build/package.mjs` (audio isn't committed; TTS reruns
can shift word timings slightly, so re-run `node tools/anchor-audit.mjs` and `node tools/sweep.mjs` before re-rendering).

## Pending
- Upload, playlist ("Designing Data-Intensive Applications, Chapter by Chapter"), SRT, thumbnail (daily limit), Public.
- Title: "Designing Data-Intensive Applications, Chapter 3, Part 2: Why Analytics Uses Columns".
