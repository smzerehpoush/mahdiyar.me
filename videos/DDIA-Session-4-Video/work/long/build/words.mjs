// Word-level timings for every narration line (whisper.cpp, one word per segment), so scenes can anchor visuals to the
// moment a word is spoken: k.word('ratio', '65'). Writes build/words.json and stage/words.js (window.WORDS).
// Times are scene-local seconds. Usage: node build/words.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { root, whisperModel, loadTimeline } from "./config.mjs";
const tl = loadTimeline();
const tmp = path.join(root, "audio/words"); fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
const PAD = 0.3; // seconds of silence prepended (whisper is more reliable with a lead-in)

const items = [];
for (const sc of tl.scenes) for (const l of sc.lines) items.push({ sc, l, f: path.join(tmp, `${String(items.length).padStart(4, "0")}.wav`) });
for (const it of items) execFileSync("ffmpeg", ["-v", "error", "-y", "-i", path.join(root, it.l.file), "-af", `adelay=${PAD * 1000},apad=pad_dur=0.6`, "-ar", "16000", "-ac", "1", it.f]);
for (let i = 0; i < items.length; i += 40) {
  const batch = items.slice(i, i + 40);
  execFileSync("whisper-cli", ["-m", whisperModel(), "-ml", "1", "-sow", "-oj", "-np", ...batch.flatMap((b) => ["-f", b.f])], { stdio: "ignore" });
}
const norm = (w) => w.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9.%-]/g, "").replace(/[.-]+$/, "");
const out = {};
for (const it of items) {
  const j = JSON.parse(fs.readFileSync(it.f + ".json", "utf8"));
  const dur = it.l.end - it.l.start;
  const words = j.transcription
    .filter((s) => s.text.trim())
    .map((s) => ({ w: norm(s.text.trim()), raw: s.text.trim(), s: +(it.l.start + Math.max(0, s.offsets.from / 1000 - PAD)).toFixed(3), e: +(it.l.start + Math.min(dur, s.offsets.to / 1000 - PAD)).toFixed(3) }))
    .filter((x) => x.w);
  (out[it.sc.id] ||= [])[it.l.i] = words;
}
fs.writeFileSync(path.join(root, "build/words.json"), JSON.stringify(out));
fs.writeFileSync(path.join(root, "stage/words.js"), "window.WORDS = " + JSON.stringify(out) + ";\n");
console.log(`words: ${items.length} lines, ${Object.values(out).flat().flat().length} words → build/words.json, stage/words.js`);
