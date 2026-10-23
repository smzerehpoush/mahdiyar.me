// ASR round-trip: transcribe every narration clip with whisper.cpp (base.en) and compare it with the intended words.
// Flags lines whose word error rate is high — usually mispronunciations, dropped words, or truncated synthesis.
// Usage: node tools/asr-check.mjs [--threshold 0.12] [--scene id]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { root, whisperModel, loadTimeline } from "../build/config.mjs";
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i >= 0 ? argv[i + 1] : d; };
const TH = +opt("threshold", 0.12), ONLY = opt("scene", null);
const tl = loadTimeline();
const tmp = path.join(root, "audio/asr"); fs.mkdirSync(tmp, { recursive: true });

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function spell(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
  if (n < 1000) return ONES[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + spell(n % 100) : "");
  if (n < 1e6) return spell(Math.floor(n / 1000)) + " thousand" + (n % 1000 ? " " + spell(n % 1000) : "");
  return spell(Math.floor(n / 1e6)) + " million" + (n % 1e6 ? " " + spell(n % 1e6) : "");
}
function norm(s) {
  s = s.toLowerCase().replace(/(\d),(\d)/g, "$1$2").replace(/%/g, " percent").replace(/(\d+)\.(\d+)/g, (m, a, b) => `${a} point ${b.split("").join(" ")}`);
  s = s.replace(/\d+/g, (d) => " " + spell(+d) + " ");
  s = s.replace(/[-–—]/g, " ").replace(/[^a-z' ]/g, " ").replace(/\band\b/g, " ").replace(/'/g, "");
  return s.split(/\s+/).filter(Boolean);
}
function wer(ref, hyp) {
  const d = Array.from({ length: ref.length + 1 }, (_, i) => [i, ...new Array(hyp.length).fill(0)]);
  for (let j = 1; j <= hyp.length; j++) d[0][j] = j;
  for (let i = 1; i <= ref.length; i++) for (let j = 1; j <= hyp.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (ref[i - 1] === hyp[j - 1] ? 0 : 1));
  return d[ref.length][hyp.length] / Math.max(1, ref.length);
}

const items = [];
for (const sc of tl.scenes) { if (ONLY && sc.id !== ONLY) continue; for (const l of sc.lines) items.push({ sc: sc.id, l }); }
const files = items.map(({ l }, i) => {
  const f = path.join(tmp, `${String(i).padStart(4, "0")}.wav`);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", path.join(root, l.file), "-af", "adelay=300,apad=pad_dur=0.6", "-ar", "16000", "-ac", "1", f]);
  return f;
});
const out = execFileSync("whisper-cli", ["-m", whisperModel(), "-nt", "-np", "-otxt", ...files.flatMap((f) => ["-f", f])], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 26 });
let flagged = 0, sum = 0;
items.forEach(({ sc, l }, i) => {
  const hyp = fs.readFileSync(files[i] + ".txt", "utf8").trim();
  const e = wer(norm(l.text), norm(hyp));
  sum += e;
  if (e > TH) { flagged++; console.log(`[${sc}#${l.i}] WER ${(e * 100).toFixed(0)}%\n   want: ${l.text}\n   said: ${hyp}`); }
});
console.log(`\nASR check: ${items.length} lines, mean WER ${((sum / items.length) * 100).toFixed(1)}%, flagged ${flagged} (> ${TH * 100}%)`);
