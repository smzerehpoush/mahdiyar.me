// QA stills for one scene: PNG frames at each cue (+offset), a contact sheet, layout report and errors.
// Usage:
//   node tools/still.mjs <sceneId>                    # frame shortly after every cue + final state → out/qa/<scene>/
//   node tools/still.mjs <sceneId> --at 3.2 --at p99+0.8 --at end-0.2   # specific local times / cue offsets
//   node tools/still.mjs <sceneId> --offset 1.5       # offset after each cue (default 1.2 s)
//   node tools/still.mjs <sceneId> --qa               # draw the caption-safe band + debug label
// Prints: frame list, layout warnings (off-frame, caption band, overlapping text), JS errors.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { root, openStage, seek, W, H, loadTimeline } from "./browser.mjs";

const args = process.argv.slice(2);
const sceneId = args[0];
if (!sceneId) { console.error("usage: node tools/still.mjs <sceneId> [--at t|cue+o|end-o]... [--offset s] [--qa]"); process.exit(2); }
const ats = [];
let offset = 1.2, qa = false;
for (let i = 1; i < args.length; i++) {
  if (args[i] === "--at") ats.push(args[++i]);
  else if (args[i] === "--offset") offset = +args[++i];
  else if (args[i] === "--qa") qa = true;
}
const timeline = loadTimeline();
const sc = timeline.scenes.find((s) => s.id === sceneId);
if (!sc) { console.error("unknown scene " + sceneId + ". Known: " + timeline.scenes.map((s) => s.id).join(", ")); process.exit(2); }

function resolve(spec) {
  const m = /^([A-Za-z]\w*(?:-[A-Za-z]\w*)*)?([+-][\d.]+)?$/.exec(spec); // "end-1" = end minus 1 s; "onread-cost+0.3" = cue + 0.3 s
  if (/^-?[\d.]+$/.test(spec)) return { t: +spec, label: `t${(+spec).toFixed(2)}` };
  if (!m) throw new Error("bad --at " + spec);
  const name = m[1], off = m[2] ? +m[2] : 0;
  if (name === "end") return { t: sc.dur + off, label: `end${off}` };
  if (name === "start") return { t: off, label: `start+${off}` };
  const l = sc.lines.find((x) => x.cue === name);
  if (!l) throw new Error(`no cue "${name}" in ${sceneId}; cues: ${sc.lines.filter((x) => x.cue).map((x) => x.cue).join(", ")}`);
  return { t: l.start + off, label: `${name}${off >= 0 ? "+" : ""}${off}` };
}
let frames = [];
if (ats.length) frames = ats.map(resolve);
else {
  const cues = sc.lines.filter((l) => l.cue);
  frames.push({ t: 0.4, label: "start" });
  cues.forEach((l, i) => {
    const next = cues[i + 1] ? cues[i + 1].start - 0.05 : sc.dur - 0.3;
    frames.push({ t: Math.min(l.start + offset, Math.max(l.start + 0.3, next)), label: "cue-" + l.cue });
  });
  frames.push({ t: sc.dur - 0.35, label: "final" });
}

const outDir = path.join(root, "out/qa", sceneId);
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const { browser, page, errors, missing } = await openStage({ qa });
if (missing.includes(sceneId)) console.log(`!! scenes/${sceneId}.js failed to load (missing file or syntax error)`);
const report = [];
for (const [i, f] of frames.entries()) {
  const err = await seek(page, sc.start + f.t);
  const file = path.join(outDir, `${String(i).padStart(2, "0")}_${f.label.replace(/[^\w.+-]/g, "_")}.png`);
  await page.screenshot({ path: file });
  const lay = await page.evaluate(() => R.layoutReport());
  report.push(`${path.basename(file)}  (local t=${f.t.toFixed(2)}s)` + (err ? `\n   ERROR: ${err.split("\n").slice(0, 3).join(" | ")}` : "") + lay.map((x) => "\n   " + x).join(""));
}
await browser.close();
// Contact sheet: 3 columns (640 px wide for 16:9, 360 px wide for 9:16).
try {
  const list = fs.readdirSync(outDir).filter((f) => f.endsWith(".png")).sort();
  const tmp = path.join(outDir, ".seq"); fs.mkdirSync(tmp, { recursive: true });
  list.forEach((f, i) => fs.copyFileSync(path.join(outDir, f), path.join(tmp, String(i).padStart(3, "0") + ".png")));
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", path.join(tmp, "%03d.png"), "-vf", `scale=${W > H ? "640:360" : "360:640"},tile=${W > H ? 3 : 5}x${Math.ceil(list.length / (W > H ? 3 : 5))}:padding=6:color=0x333333`, "-frames:v", "1", path.join(outDir, "sheet.png")]);
  fs.rmSync(tmp, { recursive: true, force: true });
} catch (e) { console.log("contact sheet failed: " + e.message); }

console.log(`scene ${sceneId}: start ${sc.start}s, dur ${sc.dur}s, cues: ${sc.lines.filter((l) => l.cue).map((l) => `${l.cue}@${l.start}`).join(" ")}`);
console.log(report.join("\n"));
if (errors.length) console.log("JS errors/warnings:\n  " + [...new Set(errors)].slice(0, 20).join("\n  "));
console.log(`frames + sheet.png → ${path.relative(root, outDir)}/`);
process.exit(0);
