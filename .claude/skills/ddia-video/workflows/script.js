export const meta = {
  name: 'ddia-video-script',
  description: 'Draft, judge, verify, revise and debate the narration script for one DDIA video (long-form or Short)',
  whenToUse: 'After brief/, storyboard, accuracy notes, data/numbers.md and video.json scenes exist. args: { dir: "<abs work dir>", debateRounds?: 2 }',
  phases: [
    { title: 'Draft', detail: 'two independent full drafts' },
    { title: 'Synthesize', detail: 'judge drafts and merge the best parts into script/script.json' },
    { title: 'Verify', detail: 'accuracy, coverage/cues, spoken form/captions, pedagogy/flow, viewer' },
    { title: 'Revise', detail: 'apply verified issues, with a decision per issue' },
    { title: 'Debate', detail: 'reviewers answer the head writer’s rejections; round 2 only for must issues' },
    { title: 'Final check', detail: 'adversarial accuracy + coverage re-check' },
  ],
}

// args: { dir: absolute work dir (holds video.json), angles?: [{ key, angle }], debateRounds?: integer (default 2, 0 = no debate) }
const W = args && args.dir
if (!W) throw new Error('pass args: { dir: "<absolute work dir>" }')
const ROUNDS = Number.isInteger(args.debateRounds) ? args.debateRounds : 2

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

const DECISIONS = {
  type: 'object',
  properties: {
    decisions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          decision: { type: 'string', enum: ['applied', 'partial', 'rejected'] },
          reason: { type: 'string', description: 'applied: what changed, in a few words; partial/rejected: why, answering the reviewer' },
        },
        required: ['id', 'decision', 'reason'],
      },
    },
    totalWords: { type: 'integer' },
    runtime: { type: 'string', description: 'estimated runtime printed by the validator' },
  },
  required: ['decisions', 'totalWords', 'runtime'],
}

const REBUTTAL = {
  type: 'object',
  properties: {
    conceded: { type: 'array', items: { type: 'string' }, description: 'ids where you accept the head writer’s answer' },
    pushback: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ref: { type: 'string', description: 'the id you push back on, or "regression" for a problem the revision itself introduced' },
          scene: { type: 'string' },
          line: { type: 'integer', description: 'zero-based line index within the scene, or -1 for scene-level' },
          severity: { type: 'string', enum: ['must', 'should'] },
          problem: { type: 'string' },
          argument: { type: 'string', description: 'what the head writer’s answer missed: a source, a concrete consequence, a better replacement' },
          suggestion: { type: 'string', description: 'concrete replacement text or action' },
        },
        required: ['ref', 'scene', 'line', 'severity', 'problem', 'argument', 'suggestion'],
      },
    },
  },
  required: ['conceded', 'pushback'],
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
  { key: 'pedagogy', prompt: 'PEDAGOGY + FLOW lens, as a demanding editor for junior-to-mid engineers. Read it aloud in your head. Flag: terms used before being defined; logic jumps; transitions that do not connect to the story; hype, filler, cliches, repeated sentence openings; more questions or turns than script-format.md allows (about one per scene, never two in a row) or a question not answered right away; slide-reading instead of explaining; missing pauses where a diagram needs absorbing; scenes far from their word budget; anything condescending or jargon-heavy. Propose concrete rewrites.' },
  { key: 'viewer', prompt: 'VIEWER lens. You are the viewer this series is for: a junior-to-mid backend engineer who clicked this video on YouTube and can leave at any second. Go through the narration in order at speaking pace, picturing each scene from the storyboard and hearing the rhythm from "pause" and "gaps". Flag: (1) the first ~20 s: would you stay? Is there a concrete problem you now care about and a reason to keep watching (series-standards.md → Structure)? (2) every stretch where your attention would drift or you would skip ahead, and why (facts with no story, three similar sentences in a row, a definition before you care, a recap you did not need); (3) lines that sound read rather than said: telegraphic fragments, stacked nouns, no "you", no contractions, every sentence the same length (series-standards.md → Narration, warm delivery; script-format.md → Style); (4) questions, jokes or hype that would make you cringe, and any scene over the question budget in script-format.md (about one question or turn per scene, never two in a row); (5) the ending: do you want the next video? Leave accuracy, sync and caption rules to the other reviewers. Severity for this lens: "must" = a point where many viewers would leave, especially in the first minute; "should" = a flat or dry stretch; "nit" = polish.' },
]
const reviews = await parallel(LENSES.map((l) => () => agent(
  `You are a meticulous reviewer of a narration script for an educational YouTube video about Designing Data-Intensive Applications.

${INPUTS}

Script to review: ${W}/script/script.json (do NOT edit it — report only).

${l.prompt}

Severity, unless your lens defines its own: "must" = factual error, missing required content, broken sync, mispronunciation risk on key terms; "should" = clear improvement; "nit" = polish. Give concrete replacement text. Do not invent problems — say nothing about scenes that are fine.`,
  { label: `verify-${l.key}`, phase: 'Verify', schema: ISSUES },
)))
// Every issue gets an id, so the head writer's decisions and the debate can refer to it.
const allIssues = reviews.flatMap((r, i) => (r?.issues ?? []).map((x, j) => ({ id: `${LENSES[i].key}-${j + 1}`, lens: LENSES[i].key, ...x })))
log(`Reviewers raised ${allIssues.length} issues (${allIssues.filter((x) => x.severity === 'must').length} must)`)

phase('Revise')
const revise = await agent(
  `You are the head writer revising the final narration script.

${INPUTS}

Script: ${W}/script/script.json. Reviewers (accuracy, coverage/sync, spoken form/captions, pedagogy/flow, viewer) raised these issues (JSON):
${JSON.stringify(allIssues, null, 1)}

Apply every "must" (unless it is factually wrong — then explain why) and every "should"/"nit" you agree improves the script. Where two reviewers pull in opposite directions (say, the viewer's warmth against an accuracy qualifier), find wording that satisfies both; accuracy wins when both cannot hold. Keep ONE voice, the word range and valid cues. Edit ${W}/script/script.json in place, then run the validator until "OK: no errors".
Record a decision for EVERY issue id: "applied", "partial" or "rejected", with a reason.${ROUNDS ? ' Each reviewer will see your reasons for its must/should issues and may answer them.' : ''}`,
  { label: 'revise', phase: 'Revise', schema: DECISIONS },
)

// Debate. Each reviewer sees the head writer's answer to its must/should issues that were not fully applied, and either
// concedes or pushes back with something new. A "should" gets one exchange; only "must" points go another round. What is
// still not applied when that ends is returned as `disputes`, with both sides, for the main session to settle.
const decisionFor = (ds, id) => (ds ?? []).find((d) => d.id === id) ?? { decision: 'rejected', reason: '(no decision recorded)' }
const withAnswers = (items, ds) => items.map((x) => {
  const d = decisionFor(ds, x.id)
  return { ...x, decision: d.decision, answer: d.reason }
})
let open = []
if (!revise) log('Revise returned nothing; skipping the debate')
else open = withAnswers(allIssues.filter((x) => x.severity !== 'nit'), revise.decisions).filter((x) => x.decision !== 'applied')
const debate = []
let disputes = ROUNDS ? [] : open
for (let round = 1; round <= ROUNDS && open.length; round++) {
  phase('Debate')
  const inPlay = LENSES.filter((l) => open.some((x) => x.lens === l.key))
  log(`Debate round ${round}: ${open.length} open issues (${inPlay.map((l) => l.key).join(', ')})`)
  const rebuttals = await parallel(inPlay.map((l) => () => {
    const applied = allIssues.filter((x) => x.lens === l.key && decisionFor(revise.decisions, x.id).decision === 'applied').map((x) => x.id)
    return agent(
      `You speak for one review lens in a debate about the narration script ${W}/script/script.json. A reviewer for your lens raised the points below; the head writer has since revised the script in place and answered them, and you take those points over. This is debate round ${round} of at most ${ROUNDS}.

${INPUTS.replace('Read ALL of these first (they are binding):', 'Binding inputs. Read the current script first, then only the files your points depend on:')}

Your lens: ${l.prompt}

Your points the head writer did not fully apply, each with their decision and answer (JSON):
${JSON.stringify(open.filter((x) => x.lens === l.key), null, 1)}
${round === 1 ? `\nPoints of yours they say they applied: ${applied.join(', ') || '(none)'}. Check in the current script that each one actually landed; push back on any that did not.\n` : ''}
For each point: if the answer holds, or the point no longer matters, concede it (put its id in "conceded"). Push back only when you can add something the answer did not address (a source, a concrete consequence for the viewer, a better replacement) and put exactly that in "argument". Do not restate the same argument in other words. Raise nothing new, except a "regression": a real problem the revision itself introduced. Keep each point's severity unless the revision made it worse. Do NOT edit the script.`,
      { label: `rebut-${l.key}-${round}`, phase: 'Debate', schema: REBUTTAL },
    )
  }))
  inPlay.forEach((l, i) => {
    if (rebuttals[i]) return
    log(`The ${l.key} reviewer did not answer round ${round}; its open points are left as disputes`)
    disputes.push(...open.filter((x) => x.lens === l.key))
  })
  const pushback = rebuttals.flatMap((r, i) => (r?.pushback ?? []).map((p, j) => ({ id: `${inPlay[i].key}-r${round}-${j + 1}`, lens: inPlay[i].key, ...p })))
  const conceded = rebuttals.reduce((n, r) => n + (r?.conceded?.length ?? 0), 0)
  log(`Round ${round}: ${conceded} conceded, ${pushback.length} pushed back (${pushback.filter((p) => p.severity === 'must').length} must)`)
  if (!pushback.length) {
    debate.push({ round, conceded, pushback: 0, unresolved: 0 })
    break
  }
  const answer = await agent(
    `You are the head writer. Reviewers have pushed back on your answers (debate round ${round} of at most ${ROUNDS}). Each item's "argument" says what your earlier answer missed; "ref" is the issue it continues, or "regression" for a problem your revision introduced.

${INPUTS}

Script: ${W}/script/script.json. Pushback (JSON):
${JSON.stringify(pushback, null, 1)}

For each id: apply it (edit the script in place), apply part of it, or keep your position, but only with a reason that answers this argument rather than repeating your earlier one. Fix every real regression. Keep ONE voice, the word range and valid cues; run the validator until "OK: no errors". Record a decision for EVERY id.`,
    { label: `answer-${round}`, phase: 'Debate', schema: DECISIONS },
  )
  if (!answer) {
    log(`Head writer did not answer round ${round}; ${pushback.length} points left as disputes`)
    disputes.push(...withAnswers(pushback, []))
    debate.push({ round, conceded, pushback: pushback.length, unresolved: pushback.length })
    break
  }
  const unresolved = withAnswers(pushback, answer.decisions).filter((x) => x.decision !== 'applied')
  debate.push({ round, conceded, pushback: pushback.length, unresolved: unresolved.length })
  disputes.push(...unresolved.filter((x) => x.severity !== 'must' || round === ROUNDS))
  open = unresolved.filter((x) => x.severity === 'must')
}
if (disputes.length) log(`${disputes.length} disputes left for the main session (${disputes.filter((x) => x.severity === 'must').length} must)`)

phase('Final check')
const finalCheck = await agent(
  `You are an adversarial final checker. Find anything still wrong in ${W}/script/script.json before it is recorded.

${INPUTS}

Fresh eyes, ONLY: (1) factual accuracy and qualification of every number/claim (accuracy-notes.md, numbers.md); (2) every required item in brief.md present; (3) "say" vs "text" word equivalence and TTS pronunciation risks on key terms; (4) cue lines matching their beats. Do NOT edit. Report only real problems; if none remain, return an empty issues list.`,
  { label: 'final-check', phase: 'Final check', schema: ISSUES },
)

return { synth, revise, debate, disputes, remaining: finalCheck, reviewCounts: reviews.map((r, i) => ({ lens: LENSES[i].key, n: r?.issues?.length ?? null })) }
