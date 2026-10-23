// Validates a narration script against the scene/beat plan in video.json and the spoken-form rules.
// Usage: node build/validate-script.mjs [script/script.json]
import fs from "node:fs";
import path from "node:path";

import { root, cfg, TIMING } from "./config.mjs";
const file = path.resolve(process.argv[2] || path.join(root, "script/script.json"));
const script = JSON.parse(fs.readFileSync(file, "utf8"));
// Scenes, beats (cue names, in order), sections and per-scene word targets come from video.json "scenes".
const SCENES = cfg.scenes || [];
if (!SCENES.length) { console.error('video.json has no "scenes" — fill it from the storyboard first'); process.exit(1); }
const BEATS = Object.fromEntries(SCENES.map((s) => [s.id, s.beats || []]));
const SECTIONS = {};
for (const s of SCENES) (SECTIONS[s.section] ||= []).push(s.id);
const TARGET = Object.fromEntries(SCENES.map((s) => [s.id, s.words || 0]));
const WMIN = cfg.words?.min ?? 1700, WMAX = cfg.words?.max ?? 2000;

const errors = [], warnings = [];
const order = Object.keys(BEATS);
const ids = script.scenes.map((s) => s.id);
if (JSON.stringify(ids) !== JSON.stringify(order)) errors.push(`scene order/ids mismatch.\n  got:      ${ids.join(",")}\n  expected: ${order.join(",")}`);
const words = (s) => (s.match(/[A-Za-z0-9][A-Za-z0-9'’.,%-]*/g) || []).length;
let total = 0, pauses = 0;
const rows = [];
for (const sc of script.scenes) {
  const beats = BEATS[sc.id];
  if (!beats) continue;
  const sec = Object.entries(SECTIONS).find(([, v]) => v.includes(sc.id))?.[0];
  if (sc.section !== sec) errors.push(`${sc.id}: section should be "${sec}", got "${sc.section}"`);
  const cues = sc.lines.filter((l) => l.cue).map((l) => l.cue);
  if (JSON.stringify(cues) !== JSON.stringify(beats)) errors.push(`${sc.id}: cues ${JSON.stringify(cues)} != beats ${JSON.stringify(beats)}`);
  let w = 0;
  sc.lines.forEach((l, i) => {
    const where = `${sc.id}[${i}]`;
    if (!l.text || typeof l.text !== "string") return errors.push(`${where}: missing text`);
    const lw = words(l.text);
    w += lw;
    if (lw > 28 || l.text.length > 170) warnings.push(`${where}: long line (${lw} words, ${l.text.length} chars)`);
    if (/[0-9%×÷^=<>+]/.test(l.text) && !l.say) errors.push(`${where}: text has digits/symbols but no "say": ${l.text}`);
    if (l.say && /[0-9%×÷^=<>]/.test(l.say)) errors.push(`${where}: "say" still has digits/symbols: ${l.say}`);
    if (/[“”‘’]/.test(l.text + (l.say || ""))) warnings.push(`${where}: curly quotes present (use ASCII)`);
    if (/\bms\b/.test(l.text)) errors.push(`${where}: abbreviation "ms" in caption — write "milliseconds"`);
    // video.json "spokenRules": [{ "pattern": "\\bMTTF\\b", "message": "say \"mean time to failure\"" }] — checked against what is spoken.
    for (const r of cfg.spokenRules || []) if (new RegExp(r.pattern).test(l.say || l.text)) errors.push(`${where}: ${r.message}`);
    pauses += l.pause ?? 0.35;
  });
  pauses += sc.tail ?? TIMING.tail;
  total += w;
  const t = TARGET[sc.id] || w;
  const dev = (w - t) / t;
  rows.push(`${sc.id.padEnd(14)} ${String(w).padStart(4)} words (target ${t}, ${dev >= 0 ? "+" : ""}${Math.round(dev * 100)}%)`);
  if (Math.abs(dev) > 0.15) warnings.push(`${sc.id}: ${w} words vs target ${t} (more than ±15%)`);
}
const estSec = (total / 164 / (cfg.speed || 1)) * 60 * 0.93 + pauses + script.scenes.length * TIMING.lead + TIMING.leadFirst - TIMING.lead + TIMING.endHold;
console.log(rows.join("\n"));
console.log(`\nTOTAL ${total} words · pauses+tails ${pauses.toFixed(1)} s · estimated runtime ${(estSec / 60).toFixed(2)} min`);
if (total < WMIN || total > WMAX) errors.push(`total words ${total} outside ${WMIN}–${WMAX} (video.json "words")`);
if (warnings.length) console.log("\nWARNINGS:\n- " + warnings.join("\n- "));
if (errors.length) { console.log("\nERRORS:\n- " + errors.join("\n- ")); process.exit(1); }
console.log("\nOK: no errors");
