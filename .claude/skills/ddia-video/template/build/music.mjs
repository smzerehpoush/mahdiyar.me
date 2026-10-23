// Procedural ambient pad (original, royalty-free): slow chord progression of soft sine voices with gentle chorus and long
// crossfades. Writes audio/music.wav (48 kHz stereo) matching the timeline length. Usage: node build/music.mjs
import fs from "node:fs";
import path from "node:path";

import { root, loadTimeline } from "./config.mjs";
const tl = loadTimeline();
const SR = 48000, DUR = tl.total, N = Math.ceil(DUR * SR);
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
// D major color: Dmaj9 · Bm11 · Gmaj9 · Asus2 — voiced low and open.
const CHORDS = [
  [50, 57, 64, 66, 69], // D3 A3 E4 F#4 A4
  [47, 54, 61, 62, 66], // B2 F#3 C#4 D4 F#4
  [43, 50, 57, 59, 66], // G2 D3 A3 B3 F#4
  [45, 52, 59, 61, 64], // A2 E3 B3 C#4 E4
];
const BAR = 9.6, XF = 4.8; // seconds per chord, crossfade length
const L = new Float32Array(N), R = new Float32Array(N);
const nChords = Math.ceil(DUR / BAR) + 1;
for (let c = 0; c < nChords; c++) {
  const notes = CHORDS[c % CHORDS.length];
  const t0 = c * BAR - XF / 2, t1 = (c + 1) * BAR + XF / 2;
  const i0 = Math.max(0, Math.floor(t0 * SR)), i1 = Math.min(N, Math.ceil(t1 * SR));
  notes.forEach((m, k) => {
    const f = midi(m), amp = (k === 0 ? 0.9 : 0.55) / notes.length;
    const detune = 0.0016 * (k % 2 ? 1 : -1);
    const ph = (c * 1.7 + k * 0.9) % (2 * Math.PI);
    for (let i = i0; i < i1; i++) {
      const t = i / SR;
      // raised-cosine envelope across the chord window
      const u = (t - t0) / (t1 - t0);
      const env = u < XF / (t1 - t0) ? 0.5 - 0.5 * Math.cos((Math.PI * (t - t0)) / XF) : u > 1 - XF / (t1 - t0) ? 0.5 - 0.5 * Math.cos((Math.PI * (t1 - t)) / XF) : 1;
      const trem = 0.85 + 0.15 * Math.sin(2 * Math.PI * (0.07 + 0.013 * k) * t + k);
      const w = 2 * Math.PI * f * t + ph;
      const sL = Math.sin(w * (1 + detune)) + 0.18 * Math.sin(2 * w) + 0.06 * Math.sin(3 * w);
      const sR = Math.sin(w * (1 - detune) + 0.6) + 0.18 * Math.sin(2 * w + 0.3) + 0.06 * Math.sin(3 * w + 0.5);
      L[i] += amp * env * trem * sL;
      R[i] += amp * env * trem * sR;
    }
  });
}
// Global fade in/out and normalization to a low peak.
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR, g = Math.min(1, t / 4, (DUR - t) / 5);
  L[i] *= Math.max(0, g); R[i] *= Math.max(0, g);
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const gain = Math.pow(10, -12 / 20) / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * gain)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * gain)) * 32767), 46 + i * 4);
}
fs.writeFileSync(path.join(root, "audio/music.wav"), buf);
console.log(`music: ${DUR.toFixed(2)} s → audio/music.wav`);
