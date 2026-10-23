// Final audio mix + mux.
//  1. measure narration and music loudness; set music MUSIC_BELOW dB under the voice; duck it further under speech
//  2. two-pass loudnorm to −14 LUFS integrated, −1.5 dBTP (YouTube)
//  3. mux video + audio (AAC 192k) + English subtitles (mov_text) + metadata
// Usage: node build/mix.mjs [--video out/video.mp4] [--out out/final.mp4] [--no-music]
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

import { root, cfg } from "./config.mjs";
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i >= 0 ? argv[i + 1] : d; };
const VIDEO = path.resolve(root, opt("video", "out/video.mp4"));
const OUT = path.resolve(root, opt("out", "out/final.mp4"));
const MUSIC = !argv.includes("--no-music");
const MUSIC_BELOW = +opt("music-below", 22);
const A = (p) => path.join(root, p);

const ff = (args) => spawnSync("ffmpeg", ["-hide_banner", ...args], { encoding: "utf8", maxBuffer: 1 << 26 });
function integrated(file) {
  const r = ff(["-i", file, "-af", "ebur128", "-f", "null", "-"]);
  const m = [...r.stderr.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].pop();
  return +m[1];
}

let premixIn = A("audio/narration.wav");
if (MUSIC) {
  const vI = integrated(A("audio/narration.wav")), mI = integrated(A("audio/music.wav"));
  const gain = vI - MUSIC_BELOW - mI;
  console.log(`voice ${vI} LUFS, music ${mI} LUFS → music gain ${gain.toFixed(1)} dB (sits ${MUSIC_BELOW} dB under the voice before ducking)`);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", A("audio/narration.wav"), "-i", A("audio/music.wav"), "-filter_complex",
    `[0:a]aresample=48000:filter_size=64:phase_shift=10:cutoff=0.97,pan=stereo|c0=c0|c1=c0,asplit=2[voice][sc];` +
    `[1:a]volume=${gain.toFixed(2)}dB[mus];` +
    `[mus][sc]sidechaincompress=threshold=0.02:ratio=4:attack=40:release=700:knee=4[duck];` +
    `[voice][duck]amix=inputs=2:normalize=0:duration=first[mix]`,
    "-map", "[mix]", "-c:a", "pcm_s24le", A("audio/premix.wav")]);
  premixIn = A("audio/premix.wav");
} else {
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", premixIn, "-af", "aresample=48000:filter_size=64:phase_shift=10:cutoff=0.97,pan=stereo|c0=c0|c1=c0", "-c:a", "pcm_s24le", A("audio/premix.wav")]);
  premixIn = A("audio/premix.wav");
}

// Two-pass loudness normalization.
const LN = "I=-14:TP=-1.5:LRA=11";
const pass1 = ff(["-i", premixIn, "-af", `loudnorm=${LN}:print_format=json`, "-f", "null", "-"]).stderr;
const j = JSON.parse(pass1.slice(pass1.lastIndexOf("{"), pass1.lastIndexOf("}") + 1));
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", premixIn, "-af",
  `loudnorm=${LN}:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true,aresample=48000:filter_size=64:phase_shift=10:cutoff=0.97`,
  "-c:a", "pcm_s24le", A("audio/final.wav")]);
const fI = integrated(A("audio/final.wav"));
console.log(`final audio: ${fI} LUFS (target −14)`);

// AAC encoder: ffmpeg's native aac at 192k can overshoot the −1.5 dBTP WAV by several dB (Ch. 2 long measured +2.1 dBTP),
// so prefer Apple's AudioToolbox encoder (macOS) and fall back to native aac at 256k, which stayed at the WAV's peak in tests.
const AAC = /\baac_at\b/.test(ff(["-encoders"]).stdout || "") ? ["-c:a", "aac_at", "-b:a", "192k"] : ["-c:a", "aac", "-b:a", "256k"];
function truePeak(file, map = []) {
  const r = ff(["-nostats", "-i", file, ...map, "-af", "ebur128=peak=true", "-f", "null", "-"]);
  const m = [...r.stderr.matchAll(/Peak:\s+(-?[\d.]+) dBFS/g)].pop();
  return m ? +m[1] : NaN;
}

if (fs.existsSync(VIDEO)) {
  const vdur = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=duration", "-of", "csv=p=0", VIDEO], { encoding: "utf8" }).trim();
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", VIDEO, "-i", A("audio/final.wav"), "-i", A("out/captions.en.srt"),
    "-map", "0:v", "-map", "1:a", "-map", "2:s", "-c:v", "copy", ...AAC, "-ar", "48000", "-c:s", "mov_text",
    "-metadata", `title=${cfg.shortTitle || cfg.title}`,
    "-metadata:s:a:0", "language=eng", "-metadata:s:s:0", "language=eng", "-metadata:s:s:0", "title=English",
    "-disposition:s:0", "0", "-t", vdur, "-movflags", "+faststart", OUT]);
  const probe = execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=index,codec_type,codec_name,width,height,r_frame_rate,duration:format=duration,size,bit_rate", "-of", "compact", OUT], { encoding: "utf8" });
  console.log(probe.trim());
  const tp = truePeak(OUT, ["-map", "0:a"]);
  console.log(`muxed audio (${AAC[1]}): true peak ${tp} dBTP` + (tp > -1 ? "  WARNING: above −1 dBTP; the AAC encode overshot (check the encoder/bitrate)" : ""));
  console.log("→ " + path.relative(root, OUT));
}
