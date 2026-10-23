// Production package: YouTube description (chapters from the real timings, for long-form) and a timed narration script.
// Everything chapter-specific comes from video.json ("title", "deck", "book", "description", "youtube").
// Usage: node build/package.mjs → out/youtube-description.txt, out/youtube-meta.json, out/script-with-timings.md
import fs from "node:fs";
import path from "node:path";
import { root, cfg, W, H, loadTimeline } from "./config.mjs";

const tl = loadTimeline();
const at = (id) => {
  const s = tl.scenes.find((x) => x.id === id);
  if (!s) throw new Error(`video.json description.chapters: unknown scene "${id}"`);
  return s.start;
};
const mmss = (t) => { t = Math.floor(t); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
const D = cfg.description || {};
const isShort = cfg.format === "short";

// Placeholders from the scaffold must never reach YouTube.
const todo = Object.entries({ title: cfg.title, shortTitle: cfg.shortTitle, "description.summary": D.summary, relatedVideo: cfg.relatedVideo,
  "description.blocks": (D.blocks || []).join(" "), "description.figureNotes": (D.figureNotes || []).join(" ") }).filter(([, v]) => /\bTODO\b/.test(v || ""));
if (todo.length) { console.error("video.json still has TODO placeholders: " + todo.map(([k]) => k).join(", ")); process.exit(1); }
if (isShort && !cfg.relatedVideo) console.warn("warning: Short without video.json relatedVideo; no \"Full video:\" link in the description");

const parts = [];
if (D.summary) parts.push(D.summary.trim());
// Chapters: YouTube needs the first at 0:00, at least three, each ≥ 10 s apart. Not used for Shorts.
if (!isShort && D.chapters?.length) {
  const rows = D.chapters.map(([id, title], i) => [i === 0 ? 0 : at(id), title]);
  rows.forEach(([t], i) => { if (i && t - rows[i - 1][0] < 10) console.warn(`warning: chapter "${rows[i][1]}" is < 10 s after the previous one`); });
  // Nearest second, not floor: a floored timestamp can land up to 1 s early, on the previous scene's last frame.
  parts.push("Chapters\n" + rows.map(([t, title]) => `${mmss(Math.round(t))} ${title}`).join("\n"));
}
for (const block of D.blocks || []) parts.push(block.trim()); // free-form blocks, e.g. "Questions to ask about your own system\n• …"
const src = ["Sources"];
if (cfg.relatedVideo) src.push(`• Full video: ${cfg.relatedVideo}`);
if (cfg.deck) src.push(`• Presentation: "${cfg.deck.title}" — ${cfg.deck.url}`);
if (cfg.deck2) src.push(`• Presentation: "${cfg.deck2.title}" — ${cfg.deck2.url}`);
src.push(`• Book: ${cfg.book || "Martin Kleppmann, Designing Data-Intensive Applications (O'Reilly, 1st edition, 2017)"}${cfg.chapter ? `, Chapter ${cfg.chapter}` : ""}.`);
src.push("This video is an independent study summary. It is not affiliated with or endorsed by the author or publisher.");
parts.push(src.join("\n"));
const notes = [...(D.figureNotes || []), "Narration uses a synthetic voice (Kokoro TTS). Background music is original and generated for this video."];
parts.push("Notes on figures\n" + notes.map((n) => `• ${n}`).join("\n"));
if (D.hashtags) parts.push(D.hashtags.trim());
const desc = parts.join("\n\n") + "\n";

if (/[<>]/.test(desc)) {
  const line = desc.split("\n").find((l) => /[<>]/.test(l));
  console.error(`YouTube rejects descriptions containing < or >; found in: ${line}`); process.exit(1);
}
if (desc.length > 5000) throw new Error(`description is ${desc.length} chars (YouTube limit 5000)`);
if ((cfg.title || "").length > 100) throw new Error(`title is ${cfg.title.length} chars (YouTube limit 100)`);
fs.mkdirSync(path.join(root, "out"), { recursive: true });
fs.writeFileSync(path.join(root, "out/youtube-description.txt"), desc);
// Everything the Studio upload step needs, in one place.
fs.writeFileSync(path.join(root, "out/youtube-meta.json"), JSON.stringify({
  title: cfg.title, format: cfg.format || "long", description: "out/youtube-description.txt",
  thumbnail: "out/thumbnail.jpg", captions: "out/captions.en.srt", video: "out/final.mp4", ...(cfg.youtube || {}),
}, null, 1));

// Timed narration script (the rendered video is the record of the visuals).
let md = `# ${cfg.shortTitle || cfg.title} — narration script with timings\n\nTotal runtime ${mmss(tl.total)} (${tl.total.toFixed(1)} s) · rendered ${W}×${H} at 60 fps · synthetic voice (Kokoro ${tl.voice}) @ ${tl.speed}×\n\n`;
for (const sc of tl.scenes) {
  md += `## ${mmss(sc.start)} — \`${sc.id}\` (${sc.dur.toFixed(1)} s, ${sc.section})\n\n`;
  md += `| Time | Beat | Narration |\n|---|---|---|\n`;
  for (const l of sc.lines) md += `| ${mmss(sc.start + l.start)} | ${l.cue ? "`" + l.cue + "`" : ""} | ${l.text.replace(/\|/g, "\\|")} |\n`;
  md += "\n";
}
fs.writeFileSync(path.join(root, "out/script-with-timings.md"), md);
console.log(desc);
console.log(`→ out/youtube-description.txt (${desc.length} chars), out/youtube-meta.json, out/script-with-timings.md`);
