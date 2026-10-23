export const meta = {
  name: 'ddia-video-resync',
  description: 'Re-sync scenes to revised narration with word anchors, apply on-screen text fixes, and re-QA',
  whenToUse: 'After the narration changed (tts + words re-run) once scenes already exist. args: { dir, groups: [{ key, scenes, fixes }] }',
  phases: [{ title: 'Resync', detail: 'one agent per scene group: audit every beat vs the final narration, anchor to words, fix text, stills QA' }],
}

// args: { dir: absolute work dir, groups: [{ key, scenes: ['id', …], fixes: 'required text/timing fixes for this group' }] }
// Optional: write WORK/brief/resync-diff.md (old → new narration lines) before running; agents read it if present.
const W = args && args.dir
if (!W || !Array.isArray(args.groups) || !args.groups.length) throw new Error('pass args: { dir, groups: [{ key, scenes, fixes }] }')

const prompt = (g) => `You are a senior motion designer + front-end engineer doing the final sync-and-polish pass on scenes of an educational explainer video about Designing Data-Intensive Applications. The scenes exist and look good; the narration was revised after they were built, so some beats drift from the voice and some on-screen texts must change.

WORK = ${W}. Read first: ${W}/brief/scene-guide.md (rules, QA loop, word anchors k.word / k.at, tools/word-probe.mjs), ${W}/brief/resync-diff.md if it exists (narration lines that changed), ${W}/brief/accuracy-notes.md, ${W}/data/numbers.md, and the final narration in ${W}/script/script.json (timings in ${W}/build/timeline.json).

Your scenes: ${g.scenes.map((s) => `${W}/stage/scenes/${s}.js`).join(', ')}. Edit only these files.

For EACH scene:
1. \`cd ${W} && node tools/word-probe.mjs <scene>\` — every line with its word timings.
2. Audit every timed element in update(): decide which spoken word or phrase it depicts and when it should land (within ~0.3 s of the word that introduces it, never before; elements summarizing a whole line may land at the line start; scene headings may land with the scene). Replace any \`cue + offset\` larger than ~0.6 s, fraction-of-line timing, or timing that no longer matches the wording with \`k.word(line, 'needle')\` (or k.cue / k.cueEnd). Confirm anchors with word-probe <scene> <line> <needle>.
3. Check every on-screen text against the final narration wording and accuracy-notes / numbers.md; fix mismatches (keep labels concise).
4. Group-specific required fixes: ${g.fixes || '(none beyond the audit)'}
5. QA loop: \`node tools/still.mjs <scene> --qa\`, Read sheet.png and full-size frames; probe \`--at <cue>+0.2\` / \`--at <seconds>\` to confirm each re-timed beat appears with its word. Fix until no JS errors, no layout warnings, nothing outside the safe area, every beat in sync.

Finish with a short report: per scene, which beats you re-anchored (old → new timing), which texts you changed, anything unresolved.`

return await pipeline(args.groups, (g) => agent(prompt(g), { label: `resync:${g.key}`, phase: 'Resync' }).then((r) => ({ group: g.key, report: r })))
