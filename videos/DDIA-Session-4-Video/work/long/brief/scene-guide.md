# Scene authoring guide

`WORK` = the video's work directory (the folder that holds `video.json`; your task prompt gives its absolute path).

You implement one or more scenes of a motion-graphics explainer as files `WORK/stage/scenes/<scene-id>.js`. Rendering is
frame-by-frame in headless Chrome: the engine calls your `update(t)` for every frame with the scene-local time `t` (seconds).
**Everything visible must be a pure function of `t`.**

The canvas depends on `video.json` → `format`:

| format | canvas | readable area (safe area) | why |
|---|---|---|---|
| `long` | 1920×1080 | x 120–1800, y 105–940 | YouTube captions and controls cover the bottom band |
| `short` | 1080×1920 | x 60–940, y 220–1480 (design inside x 80–920) | the Shorts player overlays the top bar, the right-hand buttons and the bottom title/channel block |

## Read first
- `WORK/stage/runtime.js` — engine + full API (A = animation helpers, K = components, U = utils). Read it entirely.
- `WORK/stage/tokens.css` — colors and type scale.
- An exemplar scene of the same format, to match its quality, structure and visual language:
  long-form → the skill's `examples/session-01-long/scenes/fault-failure.js` (or `twitter.js`);
  Shorts → `examples/session-01-short/scenes/onread.js` and `celebrity.js`.
- `WORK/brief/storyboard.md` — what each scene must show and its beats.
- `WORK/script/script.json` — the narration (each line's `cue` = the beat that starts when that line starts).
- `WORK/build/timeline.json` — real timings: per scene `dur`, per line `start`/`end` (seconds from scene start) and `cue`.
- `WORK/data/numbers.md` + `window.DATA` (from `WORK/stage/datasets.js`) — seeded datasets for charts. Use these, not your own numbers.
- `WORK/brief/accuracy-notes.md` — labeling rules (e.g. a "Twitter, circa 2012" badge; "Simplified illustration" labels).

## Rules
1. **Determinism**: no CSS animations/transitions, no `Math.random`, `Date`, `setTimeout`, `requestAnimationFrame`. Use `U.rng(seed)`
   (in `build`) for any randomness and precompute. `update` must set every animated property every frame.
2. **Timing**: drive every change from the narration: `k.cue('name')` (line start), `k.cueEnd('name')`, `k.lines[i].start`, `k.dur`.
   Never hard-code absolute seconds for beats (small offsets like `k.cue('x') + 0.4` are fine). A visual lands within ~0.3 s of the
   narration that introduces it, never before the narrator mentions it. Keep the composition stable; build up progressively; do not move
   things the viewer is reading.
   **Word anchors** (preferred for anything that depicts a specific spoken word, number or item): `k.word(lineRef, needle, nth=0)` returns
   the scene-local time the narrator starts saying `needle` (a word or short phrase from the caption text, e.g. `"65"`, `"fan-out"`) in
   that line (`lineRef` = cue name or line index), from whisper word timings (±~0.15 s; falls back to the needle's proportional position
   in the caption). `k.at(lineRef, p)` = time at fraction p through a line. Inspect timings with `node tools/word-probe.mjs <scene>`
   (or `<scene> <lineRef> <needle>` for one anchor). Typical: `A.show(chip, t, k.word('practices', 'sandboxes') - 0.1)`.
   Do not use `cue + <seconds>` offsets larger than ~0.6 s.
   Exceptions: a scene heading may land with the scene (`A.show(title, t, 0.3)`); in a Short, the first scene's headline and badge are
   visible from frame 0 (`A.show(node, t, -1)`) because the first frame is the cover.
3. **Layout**: keep everything readable inside the safe area above. Long-form: the section tag sits top-left (y≈52–82), so titles start
   at y ≥ 105 (`K.text(root, {x:120, y:110, cls:'h2', …})`); nothing the viewer must read below y = 940; minimum text 26 px (`.small`),
   body labels 30–36 px, headlines `.h2` (80 px) or `.h3`. Shorts: badge at (80, 236), headline at y ≈ 316 (84–104 px); centre column
   x = 500 (not 540 — the right edge is covered by buttons); minimum text 36 px, labels 38–44 px, numbers 76–130 px; one idea per
   screen. `layoutReport` (printed by the QA tools) flags long-form text below y 950 (`CAPTION-BAND`) and Shorts text outside the safe
   area (`UNSAFE`). The long-form side and top margins (x 120–1800, y ≥ 105) are a design rule QA does not check: check them by eye.
4. **Visual language**: dark canvas; one accent per section from `video.json` `sections` (teal / orange / purple; the Chapter 1 names
   `rel`/`sca`/`mai` are aliases); `bad` red for faults/slow/failure, `ok` green for healthy, `hl` yellow for emphasis and request dots.
   Use the K components (box, arrow, packets, card, chip(s), pill, badge, label, mark, svgIcon, histogram, divider) rather than inventing
   new styles. Concise on-screen text (≤ ~8 words per label); never paragraphs. No decorative code, fake dashboards, stock imagery, emoji.
5. **Motion**: entrances with `A.show` (0.4–0.8 s, ease-out, small dy), progressive line draws (`arrow.draw`), packets for request flow,
   tone transitions via `box.setTone(tone, p)`. Subtle and purposeful; one idea at a time. Exits: fade with `out:`. Scene-to-scene
   crossfades are automatic (0.5 s) — do not fade the whole scene yourself. Scenes may start slightly before t=0 and run past `k.dur`
   during the crossfade; helpers clamp, so that is fine. A pinned element shared by consecutive scenes (e.g. a historical badge) goes at
   the same position in each so the crossfade looks static.
6. **SVG transforms**: CSS `transform` (set by `A.show`) overrides the SVG `transform` attribute. Position with an outer group's attribute
   and animate the inner group — all K SVG components return `{ g, inner }`; call `A.show(x.inner, …)`. Box icons and arrow heads already
   pin their transform origin; do the same (`U.pinOrigin(node)`) for your own SVG nodes that use a `transform` attribute.
7. **Centering HTML**: to centre a chip/pill, put it in a full-width flex wrapper
   (`U.el('div', {style:{position:'absolute', left:'80px', top:'1236px', width:'840px', display:'flex', justifyContent:'center'}}, root)`)
   and give the chip `position: relative`.
8. **Labels on busy diagrams**: never let a label sit on arrows. For a group of nodes, draw a container (rounded rect, `C.bg2` fill) with
   the label inside its top edge, and point arrows at the container edge (see the Shorts `onread.js`).
9. **Do not edit** `runtime.js`, `tokens.css`, `index.html`, other scenes, the script, or the timeline, and do not run anything in
   `WORK/build/` (it regenerates shared files). Need a helper? Write it inside your scene file. Believe the runtime has a bug? Work around
   it locally and report it. Other agents may be working on other scenes at the same time.
10. **Accuracy**: on-screen numbers and labels must match `numbers.md`/`accuracy-notes.md` and the narration. Label historical examples
    ("Twitter, circa 2012") and illustrations ("Simplified illustration") on screen as the storyboard says. The credits / next-chapter
    scene takes the deck title and URL and the chapter number from `VIDEO.deck.title`, `VIDEO.deck.url` and `VIDEO.chapter` (filled
    from `video.json`; a split chapter also has `VIDEO.deck2`), as the exemplar `next.js` does; never type Session 1 strings.

## QA loop (mandatory)
After writing a scene, run:
```
cd WORK && node tools/still.mjs <scene-id> --qa
```
It renders a frame ~1.2 s after every cue plus start/final frames into `WORK/out/qa/<scene-id>/`, writes a contact sheet `sheet.png`,
and prints JS errors and a layout report (OFF-FRAME, CAPTION-BAND = long-form text below y 950, UNSAFE = Shorts text outside the safe
area, OVERLAP = text boxes colliding).
Then **look at the images with the Read tool**: the sheet first, then individual frames at full size where details matter. Use
`--at cue+0.3`, `--at 12.5`, `--at end-0.2` to inspect specific moments. Fix and repeat until: no JS errors, no layout warnings (unless
clearly benign, e.g. a decorative element), text is readable, nothing is clipped or colliding, the diagram
tells the story of each beat, and the final frame is a clean summary of the scene. Expect 3–6 iterations.

## Final message
Report per scene: what each beat shows, anything you could not achieve, any runtime issue you worked around. Keep it short.
