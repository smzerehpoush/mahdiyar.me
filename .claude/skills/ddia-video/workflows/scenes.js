export const meta = {
  name: 'ddia-video-scenes',
  description: 'Implement, review and fix the motion-graphics scenes of one DDIA video, one agent per scene group',
  whenToUse: 'After tts + words have run (timeline and word timings exist). args: { dir, exemplar, groups: [{ key, scenes: [ids], note }] }',
  phases: [
    { title: 'Implement', detail: 'one agent per scene group, with the mandatory stills QA loop' },
    { title: 'Review', detail: 'fresh-eyes visual + sync + accuracy review per group' },
    { title: 'Fix', detail: 'apply review findings and re-run QA' },
  ],
}

// args: { dir: absolute work dir, exemplar: absolute path of an exemplar scene of the same format,
//         groups: [{ key, scenes: ['id', …], note: 'group-specific direction from the storyboard' }] }
const W = args && args.dir
if (!W || !Array.isArray(args.groups) || !args.groups.length) throw new Error('pass args: { dir, exemplar, groups: [{ key, scenes, note }] }')
const EX = args.exemplar || '(see scene-guide.md "Read first")'

const ISSUES = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    issues: { type: 'array', items: { type: 'object', properties: {
      scene: { type: 'string' }, beat: { type: 'string' }, severity: { type: 'string', enum: ['must', 'should', 'nit'] },
      problem: { type: 'string' }, fix: { type: 'string' } }, required: ['scene', 'severity', 'problem', 'fix'] } },
  },
  required: ['summary', 'issues'],
}

const results = await pipeline(
  args.groups,
  (g) => agent(
    `You are a senior motion designer + front-end engineer building scenes for an educational explainer video about Designing Data-Intensive Applications.

WORK = ${W}. Read ${W}/brief/scene-guide.md first and follow it exactly (files to read, canvas and safe area for this video's format in ${W}/video.json, rules, mandatory stills QA loop).

Your scenes: ${g.scenes.map((s) => '`' + s + '`').join(', ')} → write ${g.scenes.map((s) => `${W}/stage/scenes/${s}.js`).join(', ')}.
Group-specific direction: ${g.note || '(see the storyboard)'}

For each scene: read its storyboard entry and its narration lines + cue timings (script/script.json, build/timeline.json; word timings via node tools/word-probe.mjs <scene>), design the layout for the canvas, implement it with word anchors, then run the QA loop (node tools/still.mjs <scene> --qa; Read sheet.png and individual frames) until it is genuinely good. Quality bar: the exemplar ${EX}. Finish with the short report described in the guide.`,
    { label: `build:${g.key}`, phase: 'Implement' },
  ),
  (report, g) => agent(
    `You are a demanding art director and technical editor reviewing finished scenes of an educational explainer video about Designing Data-Intensive Applications. Fresh eyes: you did not build them.

WORK = ${W}. Read ${W}/brief/scene-guide.md (rules + QA tools), ${W}/brief/storyboard.md (entries for your scenes), ${W}/brief/accuracy-notes.md, ${W}/data/numbers.md, and the narration lines with timings for your scenes (node tools/word-probe.mjs <scene>).
Scenes: ${g.scenes.join(', ')} (code in ${W}/stage/scenes/<id>.js). Builder's notes:
${report ?? '(none)'}

For each scene run \`cd ${W} && node tools/still.mjs <scene> --qa\`, inspect sheet.png and full-size frames with the Read tool, and probe mid-animation moments with --at <cue>+0.3. Read the code too. Check:
1. Story: each beat shows what the narration says at that moment (never before it is said); the final frame summarizes the scene.
2. Readability for the format (scene-guide.md sizes and safe area), contrast, no clipping/collisions, not too much text, negative space, consistent visual language and accent colors.
3. Accuracy of every on-screen number/label vs numbers.md, accuracy-notes.md and the narration; required labels present ("…, circa 2012", "Simplified illustration", …).
4. Determinism: no Math.random/Date/setTimeout/rAF/CSS animations; every animated property set in update().
5. Motion: purposeful, not jittery; nothing moves while the viewer must read it.
Do NOT edit files. Report concrete issues with exact fixes; "must" = wrong/unreadable/out of sync/missing required, "should" = clear improvement, "nit" = polish. Nothing for scenes that are fine.`,
    { label: `review:${g.key}`, phase: 'Review', schema: ISSUES },
  ),
  (review, g) => {
    const todo = (review?.issues ?? []).filter((i) => i.severity !== 'nit' || review.issues.length <= 6)
    if (!todo.length) return { group: g.key, fixed: 'no issues', review }
    return agent(
      `You are a senior motion designer + front-end engineer fixing scenes after an art-director review.

WORK = ${W}. Read ${W}/brief/scene-guide.md and follow it (rules + mandatory QA loop). Scenes: ${g.scenes.map((s) => `${W}/stage/scenes/${s}.js`).join(', ')}.
Findings (JSON):
${JSON.stringify(todo, null, 1)}

Apply every "must" and every "should" you agree with (explain any you reject). Re-run \`node tools/still.mjs <scene> --qa\` and inspect frames until each fix is verified visually with no JS errors or layout warnings. Report what you changed in a few lines.`,
      { label: `fix:${g.key}`, phase: 'Fix' },
    ).then((r) => ({ group: g.key, fixed: r, review }))
  },
)
return results
