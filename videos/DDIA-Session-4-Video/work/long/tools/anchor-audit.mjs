// Audit every k.word() call made while seeking through the whole video: which spoken word each needle actually matched,
// whether it fell back to the proportional estimate, and whether an exact match for the needle occurs later in the line
// (i.e. the beat may fire early). Usage: node tools/anchor-audit.mjs
import { openStage } from "./browser.mjs";
const { browser, page } = await openStage();
const rows = await page.evaluate(() => {
  const calls = new Map();
  for (const [id, inst] of Object.entries(R.inst)) {
    const k = inst.k, orig = k.word.bind(k);
    k.word = (ref, needle, nth = 0) => { const key = `${id}|${ref}|${needle}|${nth}`; const v = orig(ref, needle, nth); if (!calls.has(key)) calls.set(key, { id, ref, needle, nth, t: v }); return v; };
  }
  for (let T = 0; T <= R.timeline.total; T += 0.1) { try { R.seek(T); } catch (e) {} }
  const norm = (w) => w.toLowerCase().replace(/[’']/g, "").replace(/,(?=\d)/g, "").replace(/[^a-z0-9.%-]/g, "").replace(/[.-]+$/, "");
  const out = [];
  for (const c of calls.values()) {
    const inst = R.inst[c.id], li = inst.k.lineIndex(c.ref), ws = ((window.WORDS || {})[c.id] || [])[li] || [];
    const parts = c.needle.split(/\s+/).map(norm).filter(Boolean);
    const m = ws.findIndex((w) => Math.abs(w.s - c.t) < 1e-6);
    const matched = m >= 0 ? ws.slice(m, m + parts.length).map((w) => w.w).join(" ") : null;
    const exact = m >= 0 && parts.every((p, j) => ws[m + j] && ws[m + j].w === p);
    // exact occurrences of the needle's first token later in the line
    let later = null;
    if (m >= 0 && !exact) for (let i = m + 1; i < ws.length; i++) if (parts.every((p, j) => ws[i + j] && ws[i + j].w === p)) { later = ws[i].s; break; }
    out.push({ ...c, li, matched, exact, fallback: m < 0, later, line: inst.sc.lines[li].text });
  }
  return out;
});
await browser.close();
const flagged = rows.filter((r) => !r.exact);
console.log(`${rows.length} distinct k.word calls; exact ${rows.length - flagged.length}; fuzzy ${flagged.filter((r) => !r.fallback).length}; fallback ${flagged.filter((r) => r.fallback).length}`);
for (const r of flagged) console.log(`${r.later != null ? "!! EARLY" : r.fallback ? "   fallbk" : "   fuzzy "} ${r.id}[${r.li}] "${r.needle}"${r.nth ? " nth=" + r.nth : ""} → ${r.fallback ? "proportional" : `"${r.matched}"`} @${r.t.toFixed(2)}${r.later != null ? `  (exact later @${r.later.toFixed(2)}, ${(r.later - r.t).toFixed(2)} s early)` : ""}   | ${r.line.slice(0, 90)}`);
process.exit(0);
