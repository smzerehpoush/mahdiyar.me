# Narration script format — `script/script.json`

The script is the single source of truth for narration audio (TTS, one call per line), subtitles, and visual timing (each `cue`
triggers a storyboard beat when its line starts). Scene ids, their order, sections, beats and per-scene word targets come from
`video.json` → `scenes`; `node build/validate-script.mjs` checks the script against them.

```json
{
  "voice": "am_michael",
  "speed": 1.0,
  "scenes": [
    {
      "id": "hook",
      "section": "intro",
      "lines": [
        { "cue": "running", "text": "Your database is running.", "pause": 0.5 },
        { "cue": "p99", "text": "The p99 jumps to 1,473 milliseconds.", "say": "The p ninety-nine jumps to fourteen hundred and seventy-three milliseconds." }
      ],
      "tail": 1.0
    }
  ]
}
```

## Fields
- `id`, `section` — exactly as in `video.json` `scenes`, in that order.
- `lines[]` — ONE sentence per line (occasionally two very short sentences). Aim for 6–22 words; hard max 28 words / 170 characters.
- `text` — the caption (subtitle) text: exactly the words spoken, in normal written form (digits like 4,600 / 345,000 / 30 million /
  63%, terms like p99 only if spoken as such). Straight ASCII apostrophes and quotes; an em dash "—" is allowed. No emoji, no markdown.
- `say` — OPTIONAL. The exact string fed to the TTS engine when the written form would be mispronounced. Same words as `text`, just
  spelled out. Required whenever `text` contains digits, %, ×, ÷, symbols, abbreviations read letter by letter, or tricky names:
  - "p99" → "p ninety-nine"; "p50" → "p fifty"; "p99.9" → "p ninety-nine point nine"
  - "4,600" → "forty-six hundred"; "345,000" → "three hundred forty-five thousand"; "30 million" → "thirty million"; "63%" → "sixty-three percent"
  - "1 − 0.99^100" → "one minus zero point nine nine to the power of one hundred"
  - "SQL" → "S Q L"; avoid acronyms that are not normally spoken (say "mean time to failure", not "MTTF")
  - "Kleppmann" → "Klepman"; "Redis" → "Reddis"; "HdrHistogram" → "H D R Histogram"; "t-digest" → "tee digest"
  - "ms" → write "milliseconds" in both text and say (no abbreviation in captions either)
  - "2012" → "twenty twelve"; "Chapter 1" → "Chapter one"
- `cue` — OPTIONAL beat name. Every beat listed for a scene in `video.json` must be used exactly once, in order, on the line during which
  that visual change should appear. A line carries at most one cue.
- `pause` — OPTIONAL seconds of silence after this line (default 0.35). 0.8–1.6 after key reveals in long-form so a diagram can be
  absorbed; 0.2–0.6 in Shorts. A scene's last-line pause also extends the scene end.
- `gaps` — OPTIONAL seconds of silence between the sentences of this line, one number per sentence break, in order (e.g.
  `"Coffee's there. And the tea? Gone."` → `"gaps": [0.4, 0.4]`). build/tts.mjs synthesizes every sentence separately (split at
  `. ` `? ` `! ` before a capital letter or digit). Without `gaps` the break after a sentence is 0.28 s, after a question 0.38 s, after
  "!" 0.34 s. Use longer gaps (0.4–0.7) before a reveal or punchline. The validator checks the count.
- `tail` — OPTIONAL silence at the end of the scene. Default by format: long-form 0.8, Shorts 0.4 (`video.json` `timing.tail` overrides);
  section dividers usually 1.2.

`video.json` `voice`/`speed` override the script's. The series uses `am_michael` (male, American), from Session 5 on: long-form at
1.05 from Session 7 on (1.0 before), Shorts at 1.08. Sessions 1–4 and the worked examples used `af_heart`; their `video.json` keeps it.

## Length budget
- Long-form: measured voice rate ≈ 150 words/min at 1.0× (af_heart was 164); pauses/leads add ~1.5–2 min. 12–14 min ⇒ ≈ 1,550–1,850
  words at 1.0×; at 1.05× with sentence gaps, ≈ 1,600–1,950 (Ch. 5 Part 2: 1,950 words = 13:39). Set `video.json` `words`. Per-scene
  targets ±15% (`video.json` `scenes[].words`).
- Shorts: ≈ 110–140 words (≈ 128 is about 58 s) at 1.08× for ≤ 60 s. Check the real length after `node build/tts.mjs`, not just the validator's estimate.

## Style
- Conversational and clear: an experienced engineer talking to a colleague. Second person ("you") is welcome. Short sentences. No hype
  ("game-changer", "mind-blowing"), no filler ("let's dive in", "in today's video"), no rhetorical overload.
- Warm, not dry (series-standards.md → Narration, from Session 7 on). Use contractions ("it's", "doesn't", "you'll"), and a short real
  question where a viewer would wonder ("The downside?", "How does Replica 3 catch up?"), answered right away. Split a long statement
  into a short setup and a payoff ("No error, no crash. The database got both writes, and quietly kept one."). About one question or
  turn per scene, never two in a row. Reread a line aloud: if it sounds like a textbook caption, rewrite it.
- Define a term in plain words BEFORE relying on it.
- Transitions flow as one story (refer back to the opening scenario / the chapter's framing questions).
- Narration complements visuals: refer to what is on screen; do not read on-screen text verbatim at length.
- Historical examples are labeled in speech too ("Twitter, around 2012"); illustrative numbers are called illustrative at least once
  ("a simplified illustration").
- Only quote numbers listed in `data/numbers.md` or `brief/accuracy-notes.md`.
- Long-form opening: the first ~20 s name a real-world problem and what the viewer will understand by the end; no title, book credit
  or agenda before that (series-standards.md → Structure).
- Do not read the book or quote it at length; no claim of affiliation. Long-form: mention the author once, right after the hook ("based on
  Chapter N of Martin Kleppmann's book, Designing Data-Intensive Applications") and in the credits. Shorts: name the book in the last line.
