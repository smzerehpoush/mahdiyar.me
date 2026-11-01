// Narration: synthesize every script line with Kokoro (cached by content hash), trim edge silence, lay the clips out on a
// timeline, and write: build/timeline.json, stage/timeline.js, audio/narration.wav (24 kHz mono).
// Pacing: a line with several sentences is synthesized one sentence at a time and joined with short gaps, so each sentence gets
// its own intonation and the rhythm can breathe (the 2026-10-31 "warmer" delivery). The gap after a sentence comes from the
// line's optional `gaps` array (seconds, one per sentence break, in order), else from its end punctuation (GAP below).
// Usage: node build/tts.mjs [--script script/script.json]
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { root, cfg, TIMING, DEFAULT_VOICE, writeStageConfig } from "./config.mjs";

const scriptArg = process.argv.indexOf("--script");
const scriptFile = scriptArg > 0 ? path.resolve(process.argv[scriptArg + 1]) : path.join(root, "script/script.json");
const script = JSON.parse(fs.readFileSync(scriptFile, "utf8"));
const VOICE = cfg.voice || script.voice || DEFAULT_VOICE;
const SPEED = cfg.speed || script.speed || 1.0;
const SR = 24000;
const LEAD_FIRST = TIMING.leadFirst, LEAD = TIMING.lead, DEFAULT_PAUSE = 0.35, DEFAULT_TAIL = TIMING.tail, END_HOLD = TIMING.endHold;
const linesDir = path.join(root, "audio/lines");
fs.mkdirSync(linesDir, { recursive: true });
fs.mkdirSync(path.join(root, "build"), { recursive: true });

/** Text actually sent to the TTS engine. */
function ttsInput(line) {
  let s = (line.say ?? line.text).trim();
  s = s.replace(/\s*—\s*/g, ", ").replace(/\s*–\s*/g, ", ").replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  return s;
}
const keyOf = (s) => crypto.createHash("sha1").update(`${VOICE}|${SPEED}|${s}`).digest("hex").slice(0, 16);
// Default gap after a sentence that ends a chunk: questions and exclamations breathe a little longer.
const GAP = { ".": 0.28, "?": 0.38, "!": 0.34 };
/** Split TTS input into sentences: end punctuation followed by a space and an upper-case letter, digit or quote. */
function sentences(s) {
  return s.split(/(?<=[.?!])\s+(?=["'A-Z0-9])/).map((x) => x.trim()).filter(Boolean);
}

function writeWav(file, f32, sr = SR) {
  const n = f32.length, buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(f32[i] * 32767))), 44 + i * 2);
  fs.writeFileSync(file, buf);
}
function readWav(file) {
  const b = fs.readFileSync(file), n = (b.length - 44) / 2, out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = b.readInt16LE(44 + i * 2) / 32767;
  return out;
}
/** Trim leading/trailing silence (10 ms RMS window below −46 dBFS), keep small margins, apply short fades. */
function trim(x) {
  const win = Math.round(SR * 0.01), thr = Math.pow(10, -46 / 20);
  const rms = (i) => { let s = 0; for (let j = i; j < Math.min(x.length, i + win); j++) s += x[j] * x[j]; return Math.sqrt(s / win); };
  let a = 0; while (a < x.length - win && rms(a) < thr) a += win;
  let b = x.length - win; while (b > a && rms(b) < thr) b -= win;
  a = Math.max(0, a - Math.round(SR * 0.03)); b = Math.min(x.length, b + win + Math.round(SR * 0.07));
  const y = x.slice(a, b);
  const f = Math.round(SR * 0.012);
  for (let i = 0; i < f && i < y.length; i++) { y[i] *= i / f; y[y.length - 1 - i] *= i / f; }
  return y;
}

let tts = null;
async function synth(text) {
  if (!tts) {
    const { KokoroTTS } = await import("kokoro-js");
    tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "fp32", device: "cpu" });
  }
  const audio = await tts.generate(text, { voice: VOICE, speed: SPEED });
  if (audio.sampling_rate !== SR) throw new Error("unexpected sample rate " + audio.sampling_rate);
  return audio.audio;
}

const timeline = { fps: 30, voice: VOICE, speed: SPEED, sampleRate: SR, scenes: [] };
let cursor = 0, synthCount = 0;
for (const [si, sc] of script.scenes.entries()) {
  const lines = [];
  let t = si === 0 ? LEAD_FIRST : LEAD;
  for (const [i, line] of sc.lines.entries()) {
    const say = ttsInput(line);
    const parts = sentences(say);
    if (line.gaps && line.gaps.length !== parts.length - 1)
      throw new Error(`${sc.id} line ${i}: ${line.gaps.length} gaps for ${parts.length} sentences: ${JSON.stringify(parts)}`);
    const gaps = parts.slice(0, -1).map((p, j) => line.gaps ? line.gaps[j] : GAP[p.slice(-1)] ?? GAP["."]);
    const key = keyOf(parts.length > 1 ? JSON.stringify([parts, gaps]) : say);
    const wav = path.join(linesDir, key + ".wav");
    if (!fs.existsSync(wav)) {
      const chunks = [];
      for (const [j, p] of parts.entries()) {
        const pk = path.join(linesDir, "s-" + keyOf(p) + ".wav");
        if (!fs.existsSync(pk)) { writeWav(pk, trim(await synth(p))); synthCount++; }
        chunks.push(readWav(pk));
        if (j < gaps.length) chunks.push(new Float32Array(Math.round(SR * gaps[j])));
      }
      const all = new Float32Array(chunks.reduce((n, c) => n + c.length, 0));
      let o = 0; for (const c of chunks) { all.set(c, o); o += c.length; }
      writeWav(wav, all);
      process.stdout.write(`\r synthesized ${synthCount} sentences (scene ${sc.id})      `);
    }
    const n = (fs.statSync(wav).size - 44) / 2;
    const dur = n / SR;
    lines.push({ i, cue: line.cue || null, text: line.text, say, file: path.relative(root, wav), start: +t.toFixed(3), end: +(t + dur).toFixed(3) });
    t += dur + (line.pause ?? DEFAULT_PAUSE);
  }
  // scene ends after the last line's audio plus the larger of the scene tail and that line's own pause
  const last = lines[lines.length - 1];
  const lastPause = sc.lines.length ? sc.lines[sc.lines.length - 1].pause ?? 0 : 0;
  let dur = (last ? last.end : t) + Math.max(sc.tail ?? DEFAULT_TAIL, lastPause);
  if (si === script.scenes.length - 1) dur += END_HOLD;
  if (sc.minDur) dur = Math.max(dur, sc.minDur);
  timeline.scenes.push({ id: sc.id, section: sc.section, start: +cursor.toFixed(3), dur: +dur.toFixed(3), lines });
  cursor += dur;
}
// Snap total to whole frames.
timeline.total = Math.ceil(cursor * timeline.fps) / timeline.fps;
process.stdout.write("\n");

fs.writeFileSync(path.join(root, "build/timeline.json"), JSON.stringify(timeline, null, 1));
fs.writeFileSync(path.join(root, "stage/timeline.js"), "window.TIMELINE = " + JSON.stringify(timeline) + ";\n");
writeStageConfig(); // stage/video.js: canvas size, safe area, section labels/accents from video.json

// Narration track.
const total = new Float32Array(Math.ceil(timeline.total * SR));
for (const sc of timeline.scenes) for (const l of sc.lines) {
  const x = readWav(path.join(root, l.file)), off = Math.round((sc.start + l.start) * SR);
  for (let i = 0; i < x.length && off + i < total.length; i++) total[off + i] += x[i];
}
writeWav(path.join(root, "audio/narration.wav"), total);

// Mouth envelope for the narrator character (stage/narrator.js): per-frame loudness, 0..1, relative to the narration's own level
// (the 95th percentile of voiced frames maps to 1, 30 dB below it to 0), with a fast attack and a slower release.
{
  const hop = SR / timeline.fps, nf = Math.ceil(total.length / hop), db = new Float32Array(nf);
  for (let f = 0; f < nf; f++) {
    let e2 = 0, c = 0;
    for (let i = Math.floor(f * hop); i < Math.min(total.length, Math.floor((f + 1) * hop)); i++) { e2 += total[i] * total[i]; c++; }
    db[f] = 20 * Math.log10(Math.sqrt(e2 / Math.max(1, c)) + 1e-9);
  }
  const voiced = [...db].filter((d) => d > -60).sort((a, b) => a - b);
  const top = voiced.length ? voiced[Math.floor(voiced.length * 0.95)] : -12;
  const v = new Array(nf); let env = 0;
  for (let f = 0; f < nf; f++) {
    const x = Math.max(0, Math.min(1, (db[f] - (top - 30)) / 30));
    env = x > env ? env + (x - env) * 0.75 : env + (x - env) * 0.35;
    v[f] = Math.round(env * 100) / 100;
  }
  fs.writeFileSync(path.join(root, "stage/mouth.js"), "window.MOUTH = " + JSON.stringify({ fps: timeline.fps, v }) + ";\n");
}

const words = script.scenes.flatMap((s) => s.lines).reduce((n, l) => n + l.text.split(/\s+/).length, 0);
const m = Math.floor(timeline.total / 60), s = (timeline.total % 60).toFixed(1);
console.log(`timeline: ${timeline.scenes.length} scenes, ${timeline.scenes.reduce((n, s) => n + s.lines.length, 0)} lines, ${words} words, total ${m}:${s.padStart(4, "0")} (${timeline.total.toFixed(2)} s); newly synthesized ${synthCount}`);
for (const sc of timeline.scenes) console.log(`  ${String(sc.start.toFixed(1)).padStart(6)}s  ${sc.id.padEnd(14)} ${sc.dur.toFixed(1)}s`);
