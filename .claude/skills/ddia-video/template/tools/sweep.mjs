// Whole-video QA: seek every --step s (default 0.2) collecting seek errors + layout warnings, and capture a frame every
// --every s (default 4) into contact sheets of 4×4 (out/qa/_sweep/sheet-NN.png). Usage: node tools/sweep.mjs [--from s] [--to s]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { root, openStage, seek, W, H, loadTimeline } from "./browser.mjs";
const a = process.argv.slice(2), opt = (n, d) => (a.includes(n) ? +a[a.indexOf(n) + 1] : d);
const tl = loadTimeline();
const step = opt("--step", 0.2), every = opt("--every", 4), from = opt("--from", 0), to = opt("--to", tl.total);
const out = path.join(root, "out/qa/_sweep"); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const { browser, page, errors } = await openStage({ qa: true });
const warn = new Map(); let shots = 0, nextShot = from + 1;
const sceneAt = (T) => tl.scenes.find((s) => T >= s.start && T < s.start + s.dur) || tl.scenes.at(-1);
for (let T = from; T <= to + 1e-9; T += step) {
  const err = await seek(page, T);
  const sc = sceneAt(T), loc = (T - sc.start).toFixed(1);
  if (err) { const k = `${sc.id}: ERROR ${err.split("\n")[0]}`; if (!warn.has(k)) warn.set(k, `${loc}`); }
  for (const w of await page.evaluate(() => R.layoutReport())) { const k = `${sc.id}: ${w}`; warn.set(k, (warn.get(k) ? warn.get(k) + "," : "") + loc); }
  if (T >= nextShot - 1e-9) { await page.screenshot({ path: path.join(out, `f${String(shots++).padStart(4, "0")}.png`) }); nextShot += every; }
}
await browser.close();
for (let i = 0; i * 16 < shots; i++) {
  execFileSync("ffmpeg", ["-v", "error", "-y", "-start_number", String(i * 16), "-i", path.join(out, "f%04d.png"), "-frames:v", "16", "-vf", W > H ? "scale=480:270,tile=4x4:padding=4:color=0x444444" : "scale=270:480,tile=8x2:padding=4:color=0x444444", "-frames:v", "1", path.join(out, `sheet-${String(i).padStart(2, "0")}.png`)]);
}
for (const f of fs.readdirSync(out)) if (f.startsWith("f")) fs.rmSync(path.join(out, f));
console.log(`sweep ${from}–${to.toFixed(1)} s: ${warn.size} distinct warnings, ${shots} frames → ${Math.ceil(shots / 16)} sheets (each frame ${every} s apart, first at ${from + 1} s)`);
for (const [k, v] of warn) console.log("  " + k + "  @ " + v.split(",").slice(0, 6).join(",") + (v.split(",").length > 6 ? ` … (${v.split(",").length})` : ""));
if (errors.length) console.log("JS errors/warnings:\n  " + [...new Set(errors)].slice(0, 20).join("\n  "));
process.exit(0);
