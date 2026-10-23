// Render the stage to H.264 by stepping R.seek(frame/fps) and piping screenshots into ffmpeg; parallel workers render
// contiguous frame ranges into segments that are concatenated losslessly.
// Usage: node tools/render.mjs [--fps 60] [--workers 6] [--from 0] [--to <s>] [--out out/video.mp4] [--format png|jpeg] [--crf 16]
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { root, openStage, seek, loadTimeline } from "./browser.mjs";

const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf("--" + name); return i >= 0 ? argv[i + 1] : def; };
const timeline = loadTimeline();
const FPS = +opt("fps", 60);
// Default: one Chrome per core, capped at 6 (a 4-vCPU cloud VM gets 4; more workers than cores only adds memory pressure).
const WORKERS = +opt("workers", Math.min(6, os.availableParallelism?.() ?? os.cpus().length));
const FROM = +opt("from", 0), TO = +opt("to", timeline.total);
const OUT = path.resolve(root, opt("out", "out/video.mp4"));
const FORMAT = opt("format", "png");
const CRF = opt("crf", "16");
const f0 = Math.round(FROM * FPS), f1 = Math.round(TO * FPS);
const segDir = path.join(path.dirname(OUT), "segments-" + path.basename(OUT, ".mp4"));
fs.rmSync(segDir, { recursive: true, force: true });
fs.mkdirSync(segDir, { recursive: true });

const total = f1 - f0, per = Math.ceil(total / WORKERS);
const t0 = Date.now();
let done = 0;
const progress = () => { const el = (Date.now() - t0) / 1000; process.stdout.write(`\r  ${done}/${total} frames  ${(done / el).toFixed(1)} fps  eta ${Math.round(((total - done) / Math.max(1, done)) * el)} s   `); };

async function worker(w) {
  const a = f0 + w * per, b = Math.min(f1, a + per);
  if (a >= b) return null;
  const seg = path.join(segDir, `seg_${String(w).padStart(2, "0")}.mp4`);
  const vf = FORMAT === "png"
    ? "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p"
    : "scale=in_color_matrix=bt601:in_range=pc:out_color_matrix=bt709:out_range=tv,format=yuv420p";
  const ff = spawn("ffmpeg", ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", FORMAT === "png" ? "png" : "mjpeg", "-i", "-",
    "-vf", vf, "-c:v", "libx264", "-preset", "slow", "-crf", CRF, "-tune", "animation", "-g", String(FPS * 4), "-bf", "2",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv", "-movflags", "+faststart", seg], { stdio: ["pipe", "inherit", "inherit"] });
  const ffDone = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error("ffmpeg exit " + c)))));
  const { browser, page, cdp, errors } = await openStage();
  for (let f = a; f < b; f++) {
    const err = await seek(page, f / FPS);
    if (err) throw new Error(`frame ${f} (T=${(f / FPS).toFixed(2)}): ${err}`);
    const shot = await cdp.send("Page.captureScreenshot", FORMAT === "png" ? { format: "png", optimizeForSpeed: true } : { format: "jpeg", quality: 95, optimizeForSpeed: true });
    if (!ff.stdin.write(Buffer.from(shot.data, "base64"))) await new Promise((r) => ff.stdin.once("drain", r));
    done++; if (done % 600 === 0) progress();
  }
  ff.stdin.end();
  await ffDone;
  await browser.close();
  if (errors.length) console.log(`\n worker ${w} JS errors: ${[...new Set(errors)].slice(0, 5).join(" | ")}`);
  return seg;
}

const segs = (await Promise.all(Array.from({ length: WORKERS }, (_, w) => worker(w)))).filter(Boolean);
progress();
const list = path.join(segDir, "list.txt");
fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join("\n"));
execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", OUT]);
console.log(`\nrendered ${total} frames (${(total / FPS).toFixed(2)} s) in ${((Date.now() - t0) / 1000).toFixed(0)} s → ${path.relative(root, OUT)}`);
process.exit(0);
