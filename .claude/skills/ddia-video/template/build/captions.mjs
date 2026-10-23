// Subtitles from the narration timeline: SRT + WebVTT. Each script line becomes one or more cues of at most two lines × CAPTIONS.maxChars (42 long-form, 32 Shorts)
// characters; when a line must be split, the boundary is estimated from spoken length and snapped to a real pause in the
// line's audio. Usage: node build/captions.mjs → out/captions.en.srt, out/captions.en.vtt, prints a QA summary.
import fs from "node:fs";
import path from "node:path";

import { root, CAPTIONS, loadTimeline } from "./config.mjs";
const tl = loadTimeline();
const MAXL = CAPTIONS.maxChars, SR = tl.sampleRate; // max characters per caption line (2 lines per cue)

function twoLines(s) {
  if (s.length <= MAXL) return [s];
  const words = s.split(" ");
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" "), b = words.slice(i).join(" ");
    if (a.length > MAXL || b.length > MAXL) continue;
    const punct = /[,;:—.?!]$/.test(a) ? -6 : 0;
    const cost = Math.abs(a.length - b.length) + punct + (a.length < b.length ? 2 : 0);
    if (!best || cost < best.cost) best = { cost, lines: [a, b] };
  }
  return best ? best.lines : null;
}
function chunk(s) {
  if (twoLines(s)) return [s];
  const words = s.split(" ");
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" "), b = words.slice(i).join(" ");
    const mid = Math.abs(a.length - b.length) / s.length;
    const punct = /[,;:—.?!]$/.test(a) ? -0.35 : /^(and|but|or|so|because|which|while|when|that|then|if)$/i.test(words[i]) ? -0.12 : 0;
    const cost = mid + punct;
    if (!best || cost < best.cost) best = { cost, i };
  }
  const a = words.slice(0, best.i).join(" "), b = words.slice(best.i).join(" ");
  return [...chunk(a), ...chunk(b)];
}
/** Spoken weight of a caption fragment (numbers take longer to say than to write). */
const weight = (s) => s.split(" ").reduce((n, w) => n + (/\d/.test(w) ? w.replace(/[^\d]/g, "").length * 5 + 4 : w.length + 1), 0);

function readWav(file) {
  const b = fs.readFileSync(file), n = (b.length - 44) / 2, out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = b.readInt16LE(44 + i * 2) / 32767;
  return out;
}
/** Centers (seconds) of pauses ≥ 70 ms inside a clip. */
function pauses(x) {
  const win = Math.round(SR * 0.01), thr = Math.pow(10, -40 / 20), out = [];
  let run = 0;
  for (let f = 0; f * win < x.length; f++) {
    let s = 0; for (let j = f * win; j < Math.min(x.length, (f + 1) * win); j++) s += x[j] * x[j];
    const quiet = Math.sqrt(s / win) < thr;
    if (quiet) run++;
    else { if (run >= 7) out.push(((f - run / 2) * win) / SR); run = 0; }
  }
  return out;
}

const cues = [];
for (const sc of tl.scenes) for (const l of sc.lines) {
  const t0 = sc.start + l.start, t1 = sc.start + l.end;
  const parts = chunk(l.text.trim());
  if (parts.length === 1) { cues.push({ a: t0, b: t1, text: parts[0] }); continue; }
  const wts = parts.map(weight), W = wts.reduce((x, y) => x + y, 0);
  const gaps = pauses(readWav(path.join(root, l.file)));
  let acc = 0, prev = t0;
  parts.forEach((p, i) => {
    acc += wts[i];
    let b = i === parts.length - 1 ? t1 : t0 + (acc / W) * (t1 - t0);
    if (i < parts.length - 1 && gaps.length) {
      const near = gaps.map((g) => t0 + g).reduce((m, g) => (Math.abs(g - b) < Math.abs(m - b) ? g : m), Infinity);
      if (Math.abs(near - b) < 0.5) b = near;
    }
    cues.push({ a: prev, b, text: p });
    prev = b;
  });
}
// Hold captions through short pauses; enforce a minimum display time without overlapping the next cue.
for (let i = 0; i < cues.length; i++) {
  const next = cues[i + 1] ? cues[i + 1].a : Infinity;
  cues[i].b = Math.min(Math.max(cues[i].b + 0.5, cues[i].a + 1.0), next - 0.04);
}
const ts = (t, sep) => { const ms = Math.round(t * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}${sep}${String(ms % 1000).padStart(3, "0")}`; };
const body = cues.map((c) => twoLines(c.text).join("\n"));
fs.mkdirSync(path.join(root, "out"), { recursive: true });
fs.writeFileSync(path.join(root, "out/captions.en.srt"), cues.map((c, i) => `${i + 1}\n${ts(c.a, ",")} --> ${ts(c.b, ",")}\n${body[i]}\n`).join("\n"));
fs.writeFileSync(path.join(root, "out/captions.en.vtt"), "WEBVTT\n\n" + cues.map((c, i) => `${ts(c.a, ".")} --> ${ts(c.b, ".")}\n${body[i]}\n`).join("\n"));

const cps = cues.map((c) => c.text.length / (c.b - c.a));
const fast = cues.filter((c, i) => cps[i] > 20);
console.log(`captions: ${cues.length} cues; max line ${Math.max(...body.flatMap((b) => b.split("\n").map((x) => x.length)))} chars; ` +
  `median ${(cps.sort((a, b) => a - b)[Math.floor(cps.length / 2)]).toFixed(1)} cps; >20 cps: ${fast.length}; shortest ${Math.min(...cues.map((c) => c.b - c.a)).toFixed(2)} s`);
for (const c of fast.slice(0, 10)) console.log(`  fast: ${(c.text.length / (c.b - c.a)).toFixed(1)} cps  "${c.text}"`);
