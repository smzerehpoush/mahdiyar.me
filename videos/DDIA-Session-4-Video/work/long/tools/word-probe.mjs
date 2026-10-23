// Probe word anchors: node tools/word-probe.mjs <scene> <lineRef> <needle> [nth]   (lineRef = cue name or index)
// With only <scene>: prints every line's words with scene-local start times.
import { openStage } from "./browser.mjs";
const [scene, ref, needle, nth] = process.argv.slice(2);
const { browser, page } = await openStage();
const out = await page.evaluate((scene, ref, needle, nth) => {
  const inst = R.inst[scene]; if (!inst) return `no scene ${scene}`;
  const k = inst.k, sc = inst.sc;
  if (!needle) return sc.lines.map((l, i) => `[${i}] ${l.cue ? "(" + l.cue + ") " : ""}${l.start.toFixed(2)}–${l.end.toFixed(2)}  ${l.text}\n     ` +
    ((window.WORDS[scene] || [])[i] || []).map((w) => `${w.raw}@${w.s.toFixed(2)}`).join(" ")).join("\n");
  const r = /^\d+$/.test(ref) ? +ref : ref;
  try { return `${needle} → ${k.word(r, needle, nth ? +nth : 0).toFixed(3)}`; } catch (e) { return String(e.message); }
}, scene, ref, needle, nth);
console.log(out);
await browser.close(); process.exit(0);
