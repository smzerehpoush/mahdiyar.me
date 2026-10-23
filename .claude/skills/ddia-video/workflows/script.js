export const meta = {
  name: 'ddia-video-script',
  description: 'Draft, judge, verify and revise the narration script for one DDIA video (long-form or Short)',
  whenToUse: 'After brief/, storyboard, accuracy notes, data/numbers.md and video.json scenes exist. args: { dir: "<abs work dir>" }',
  phases: [
    { title: 'Draft', detail: 'two independent full drafts' },
    { title: 'Synthesize', detail: 'judge drafts and merge the best parts into script/script.json' },
    { title: 'Verify', detail: 'accuracy, coverage/cues, spoken form/captions, pedagogy/flow' },
    { title: 'Revise', detail: 'apply verified issues' },
    { title: 'Final check', detail: 'adversarial accuracy + coverage re-check' },
  ],
}

// args: { dir: absolute work dir (holds video.json), angles?: [{ key, angle }] }
const W = args && args.dir
if (!W) throw new Error('pass args: { dir: "<absolute work dir>" }')

const INPUTS = `WORK = ${W}. Read ALL of these first (they are binding):
- ${W}/video.json — format (long 16:9 or short 9:16), scenes in order with their section, beats (cue names, in order) and word targets, total word range ("words"), voice/speed, spokenRules.
- ${W}/brief/series-standards.md — series-wide requirements (audience, tone, accuracy, attribution).
- ${W}/brief/brief.md — this video's requirements.
- ${W}/brief/accuracy-notes.md — binding accuracy decisions (they override the deck where they differ).
- ${W}/brief/storyboard.md — each scene's visuals and beats.
- ${W}/brief/script-format.md — the JSON format, field rules, spoken-form ("say") rules, length budget, style rules.
- ${W}/data/numbers.md — the only illustrative numbers the narration may quote.
- ${W}/brief/deck.html — the source slide deck; <aside class="notes"> elements are speaker notes (teaching context). Ignore team-specific discussion prompts.
Validator: \`node ${W}/build/validate-script.mjs <file>\` checks scene order, sections, cue names/order, digits-without-say, spokenRules, word budgets, and estimates runtime. A script is acceptable only when it prints "OK: no errors" with the total inside video.json "words" (minimize warnings).`

const ISSUES = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          scene: { type: 'string' },
          line: { type: 'integer', description: 'zero-based line index within the scene, or -1 for scene-level' },
          severity: { type: 'string', enum: ['must', 'should', 'nit'] },
          category: { type: 'string' },
          problem: { type: 'string' },
          suggestion: { type: 'string', description: 'concrete replacement text or action' },
        },
        required: ['scene', 'line', 'severity', 'category', 'problem', 'suggestion'],
      },
    },
  },
  required: ['summary', 'issues'],
}

phase('Draft')
const ANGLES = (args.angles && args.angles.length) ? args.angles : [
  { key: 'A', angle: 'STORY-FIRST: one continuous story anchored in the opening scenario; every part investigates part of it. Warm, concrete, a colleague explaining at a whiteboard.' },
  { key: 'B', angle: 'CLARITY-FIRST: optimize for a junior engineer meeting these ideas for the first time. Each concept: plain-words definition → concrete example on screen → one-line takeaway. Crisp, precise, zero filler; still conversational.' },
]
const drafts = await parallel(ANGLES.map((a) => () => agent(
  `You are a senior engineer and experienced technical scriptwriter writing the narration for an educational YouTube video about Designing Data-Intensive Applications (motion graphics, synthetic voice, no presenter).

${INPUTS}

Your angle: ${a.angle}

Write the COMPLETE narration for every scene in video.json as JSON in the format of script-format.md and save it to ${W}/script/draft-${a.key}.json (Write tool). Requirements:
- Original wording (do not copy slide text or the book's sentences); preserve the concepts.
- Every beat used exactly once as a "cue", in order, on the line where that visual change happens (that line must talk about what the beat shows).
- "say" for every line with digits/symbols/abbreviations; it must contain the same words as "text", just spelled out. Captions verbatim with what is spoken.
- Label historical/illustrative numbers in speech. Only numbers from numbers.md / accuracy-notes.md.
- Use "pause" deliberately (long-form 0.8–1.6 s after key reveals; Shorts 0.2–0.6 s).
- Total inside video.json "words"; per-scene targets ±15%.
Run the validator on your file and iterate until "OK: no errors". Reply with: total words, estimated runtime, and the 3 choices you are least sure about.`,
  { label: `draft-${a.key}`, phase: 'Draft' },
)))

phase('Synthesize')
const synth = await agent(
  `You are the head writer and judge for this narration.

${INPUTS}

Complete drafts: ${ANGLES.map((a) => `${W}/script/draft-${a.key}.json`).join(', ')}. Notes from their authors:
${ANGLES.map((a, i) => `--- ${a.key} ---\n${drafts[i] ?? '(missing)'}`).join('\n')}

1. Read every draft in full. Per scene, judge: accuracy (accuracy-notes), clarity for junior/mid engineers, natural rhythm read aloud, sync with the beats, story continuity, word budget.
2. Write the merged final script to ${W}/script/script.json: the better scene from each draft, the best individual lines grafted across, transitions smoothed into ONE voice. Do not just concatenate.
3. Run the validator on script/script.json until "OK: no errors".
Reply with: per-scene source choice in one compact line each, total words, estimated runtime.`,
  { label: 'judge-synthesize', phase: 'Synthesize' },
)

phase('Verify')
const LENSES = [
  { key: 'accuracy', prompt: 'ACCURACY lens. Check every factual claim, number, definition and attribution against the deck (and its speaker notes), accuracy-notes.md, numbers.md, and your solid knowledge of DDIA (1st edition) for this chapter. Flag: wrong or unqualified numbers; historical figures not labeled as historical in speech; illustrative numbers not called illustrative; misdefinitions; overclaims; anything implying affiliation with the author/publisher; claims that cannot be qualified; numbers that differ from numbers.md.' },
  { key: 'coverage', prompt: 'COVERAGE + SYNC lens. (1) Walk through brief.md item by item and flag anything missing, weakened, or out of order (hook: does the first ~20 s of narration name a real-world problem and what the viewer will understand by the end, before any title, book credit or agenda? framing questions, every required content item, ending, closing questions, next-chapter preview or full-video pointer, source credit). (2) For each scene, compare each cue line with the storyboard beat it triggers: does the line talk about what the beat shows at that moment? Is a beat triggered before the narration introduces it, or too late?' },
  { key: 'spoken', prompt: 'SPOKEN-FORM + CAPTION lens. For every line: (1) "say" contains exactly the same words as "text" (only spelled-out differences); flag any word added/dropped. (2) Flag anything a TTS engine (Kokoro, espeak-based phonemizer) may mispronounce unless spelled out in "say": digits, symbols, acronyms, names (Kleppmann), hyphenated compounds, "p99"-style tokens, "read/write", "vs.", "e.g.", parentheses. Give the exact "say". (3) Caption quality: verbatim, numbers formatted consistently, no "ms", ASCII quotes, no line over 28 words/170 chars. (4) Lines awkward to say aloud.' },
  { key: 'pedagogy', prompt: 'PEDAGOGY + FLOW lens, as a demanding editor for junior-to-mid engineers. Read it aloud in your head. Flag: terms used before being defined; logic jumps; transitions that do not connect to the story; hype, filler, cliches, overused rhetorical questions, repeated sentence openings; slide-reading instead of explaining; missing pauses where a diagram needs absorbing; scenes far from their word budget; anything condescending or jargon-heavy. Propose concrete rewrites.' },
]
const reviews = await parallel(LENSES.map((l) => () => agent(
  `You are a meticulous reviewer of a narration script for an educational YouTube video about Designing Data-Intensive Applications.

${INPUTS}

Script to review: ${W}/script/script.json (do NOT edit it — report only).

${l.prompt}

Severity "must" = factual error, missing required content, broken sync, mispronunciation risk on key terms; "should" = clear improvement; "nit" = polish. Give concrete replacement text. Do not invent problems — say nothing about scenes that are fine.`,
  { label: `verify-${l.key}`, phase: 'Verify', schema: ISSUES },
)))
const allIssues = reviews.flatMap((r, i) => (r?.issues ?? []).map((x) => ({ ...x, lens: LENSES[i].key })))
log(`Reviewers raised ${allIssues.length} issues (${allIssues.filter((x) => x.severity === 'must').length} must)`)

phase('Revise')
const revise = await agent(
  `You are the head writer revising the final narration script.

${INPUTS}

Script: ${W}/script/script.json. Reviewers (accuracy, coverage/sync, spoken form/captions, pedagogy/flow) raised these issues (JSON):
${JSON.stringify(allIssues, null, 1)}

Apply every "must" (unless it is factually wrong — then explain why) and every "should"/"nit" you agree improves the script. Keep ONE voice, the word range and valid cues. Edit ${W}/script/script.json in place, then run the validator until "OK: no errors".
Reply with: issues you rejected and why (one line each), final total words, estimated runtime.`,
  { label: 'revise', phase: 'Revise' },
)

phase('Final check')
const finalCheck = await agent(
  `You are an adversarial final checker. Find anything still wrong in ${W}/script/script.json before it is recorded.

${INPUTS}

Fresh eyes, ONLY: (1) factual accuracy and qualification of every number/claim (accuracy-notes.md, numbers.md); (2) every required item in brief.md present; (3) "say" vs "text" word equivalence and TTS pronunciation risks on key terms; (4) cue lines matching their beats. Do NOT edit. Report only real problems; if none remain, return an empty issues list.`,
  { label: 'final-check', phase: 'Final check', schema: ISSUES },
)

return { synth, revise, remaining: finalCheck, reviewCounts: reviews.map((r, i) => ({ lens: LENSES[i].key, n: r?.issues?.length ?? null })) }
