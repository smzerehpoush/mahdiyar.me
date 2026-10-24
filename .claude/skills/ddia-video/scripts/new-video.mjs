#!/usr/bin/env node
// Scaffold a work directory for one DDIA video (long-form chapter explainer or a YouTube Short).
//
//   node scripts/new-video.mjs --session 2                       # long-form → ~/Movies/DDIA-Session-2-Video/work/long
//   node scripts/new-video.mjs --session 2 --format short        # Short     → ~/Movies/DDIA-Session-2-Video/work/short
//   node scripts/new-video.mjs --session 1 --example session-01-long --dir /tmp/x   # rebuild a worked example
//   node scripts/new-video.mjs --dir <existing work dir> --update-engine            # refresh engine files only
//
// The work dir gets: the engine (build/, tools/, stage/ runtime, fonts), a video.json skeleton, stub data files, and a
// node_modules symlink to the shared cache (~/.cache/ddia-video, created by scripts/setup.mjs).
// In a Claude Code cloud session (CLAUDE_CODE_REMOTE=true) the default home is <repo>/videos instead of ~/Movies, so the work and
// the deliverables can be committed to the session branch (reference/cloud.md). DDIA_VIDEO_HOME overrides both.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SKILL = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const TEMPLATE = path.join(SKILL, "template");
const CACHE = process.env.DDIA_VIDEO_CACHE || path.join(os.homedir(), ".cache/ddia-video");
const REPO = process.env.DDIA_REPO || path.resolve(SKILL, "../../..");
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i >= 0 ? argv[i + 1] : d; };
const flag = (n) => argv.includes("--" + n);
// Narration voice for new videos (template/build/config.mjs DEFAULT_VOICE; reference/series-log.md). A worked example keeps its own.
const VOICE = "am_michael";

// Blog session → book chapter (1st edition). Some chapters span two sessions.
const CHAPTER = { 1: 1, 2: 2, 3: 3, 4: 3, 5: 4, 6: 5, 7: 5, 8: 6, 9: 7, 10: 7, 11: 8, 12: 9, 13: 9, 14: 10, 15: 11, 16: 11, 17: 12 };
const ENGINE = ["build/config.mjs", "build/tts.mjs", "build/captions.mjs", "build/music.mjs", "build/mix.mjs", "build/package.mjs", "build/words.mjs",
  "build/validate-script.mjs", "tools", "stage/index.html", "stage/runtime.js", "stage/tokens.css", "fonts", "package.json", "package-lock.json"];

const GUIDES = ["scene-guide.md", "script-format.md", "series-standards.md"];
const copy = (rel, dir) => fs.cpSync(path.join(TEMPLATE, rel), path.join(dir, rel), { recursive: true });
const copyGuides = (dir) => { for (const f of GUIDES) fs.copyFileSync(path.join(SKILL, "reference", f), path.join(dir, "brief", f)); };

if (flag("update-engine")) {
  const dir = path.resolve(opt("dir", "."));
  if (!fs.existsSync(path.join(dir, "video.json"))) throw new Error(`${dir} is not a work dir (no video.json)`);
  for (const rel of ENGINE) copy(rel, dir);
  fs.mkdirSync(path.join(dir, "brief"), { recursive: true });
  copyGuides(dir);
  console.log(`engine files and brief/ guides refreshed in ${dir}`);
  process.exit(0);
}

const session = +opt("session");
if (!session) { console.error("usage: new-video.mjs --session N [--format long|short] [--dir DIR] [--example NAME] [--force]"); process.exit(2); }
const example = opt("example");
const exampleDir = example && path.join(SKILL, "examples", example);
if (example && !fs.existsSync(exampleDir)) throw new Error(`no example ${example} (have: ${fs.readdirSync(path.join(SKILL, "examples")).join(", ")})`);
const format = opt("format", example ? JSON.parse(fs.readFileSync(path.join(exampleDir, "video.json"), "utf8")).format || "long" : "long");
if (!["long", "short"].includes(format)) throw new Error("--format must be long or short");
const CLOUD = process.env.CLAUDE_CODE_REMOTE === "true";
const HOME_DIR = process.env.DDIA_VIDEO_HOME || (CLOUD ? path.join(REPO, "videos") : path.join(os.homedir(), "Movies"));
const deliverables = path.join(HOME_DIR, `DDIA-Session-${session}-Video`);
const tilde = (p) => (p.startsWith(os.homedir() + path.sep) ? "~/" + path.relative(os.homedir(), p) : p);
const dir = path.resolve(opt("dir", path.join(deliverables, "work", format)));
if (fs.existsSync(path.join(dir, "video.json")) && !flag("force")) { console.error(`${dir} already has video.json (use --update-engine, or --force to overwrite)`); process.exit(1); }
// Per-video files written below: with --force an existing one is kept as <file>.bak first, so a re-scaffold never loses a script.
const put = (rel, write) => {
  const f = path.join(dir, rel);
  if (fs.existsSync(f)) { fs.copyFileSync(f, f + ".bak"); console.log(`kept the previous ${rel} as ${rel}.bak`); }
  write(f);
};

const deckFile = path.join(REPO, "public/blog", `ddia-session-${session}`, "index.html");
const deckHtml = fs.existsSync(deckFile) ? fs.readFileSync(deckFile, "utf8") : "";
const deckTitle = (/<title>([^<]*)<\/title>/.exec(deckHtml)?.[1] || `DDIA Session ${session}`).replace(/&amp;/g, "&");
const topic = deckTitle.replace(/^DDIA Session \d+:\s*/, "");
const chapter = CHAPTER[session] ?? null;

fs.mkdirSync(dir, { recursive: true });
for (const rel of ENGINE) copy(rel, dir);
for (const d of ["brief", "script", "data", "stage/scenes", "audio", "out"]) fs.mkdirSync(path.join(dir, d), { recursive: true });

if (example) {
  const E = exampleDir;
  // The example's "deliverables" names its own machine; point it at this run's folder.
  const own = JSON.stringify(tilde(format === "short" ? path.join(deliverables, "Short") : deliverables));
  put("video.json", (f) => fs.writeFileSync(f, fs.readFileSync(path.join(E, "video.json"), "utf8").replace(/("deliverables":\s*)"[^"]*"/, `$1${own}`)));
  put("script/script.json", (f) => fs.copyFileSync(path.join(E, "script.json"), f));
  fs.cpSync(path.join(E, "scenes"), path.join(dir, "stage/scenes"), { recursive: true });
  for (const [f, to] of [["data.mjs", "build/data.mjs"], ["thumbnail.html", "stage/thumbnail.html"], ["storyboard.md", "brief/storyboard.md"],
    ["accuracy-notes.md", "brief/accuracy-notes.md"], ["brief.md", "brief/brief.md"], ["numbers.md", "data/numbers.md"]]) {
    if (fs.existsSync(path.join(E, f))) put(to, (dst) => fs.copyFileSync(path.join(E, f), dst));
  }
} else {
  const short = format === "short";
  const speed = short ? 1.08 : 1.0; // Shorts: slightly faster voice to fit ≤ 60 s
  const video = {
    session, chapter, format,
    title: format === "short" ? `TODO hook-style Short title (≤ 70 chars) #Shorts` : `Designing Data-Intensive Applications, Chapter ${chapter}: TODO the problem/payoff, not just "${topic}" (≤ 100 chars total)`,
    shortTitle: format === "short" ? `TODO — DDIA Chapter ${chapter} Short` : `${topic} — DDIA Chapter ${chapter}`,
    deck: { title: deckTitle, url: `https://mahdiyar.me/blog/ddia-session-${session}/`, file: path.relative(REPO, deckFile) },
    book: "Martin Kleppmann, Designing Data-Intensive Applications (O'Reilly, 1st edition, 2017)",
    voice: VOICE, speed,
    // Sized for am_michael (≈ 150 words/min at 1.0×): long-form 12–14 min; a Short ≈ 128 words ≈ 58 s at 1.08×.
    words: short ? { min: 110, max: 140 } : { min: 1550, max: 1850 },
    sections: format === "short" ? { short: { label: "", accent: "hl" } } : { intro: { label: "", accent: "hl" }, ending: { label: "", accent: "hl" } },
    scenes: [],
    spokenRules: [],
    description: { summary: "TODO", chapters: [], blocks: [], figureNotes: [], hashtags: format === "short" ? "#SystemDesign #DDIA #SoftwareEngineering #Shorts" : "#SystemDesign #DistributedSystems #DDIA #SoftwareEngineering" },
    youtube: {
      visibility: "public", category: "Education", language: "English", madeForKids: false, alteredContent: false,
      // Shorts stay out of the chapter playlist (series-standards.md); videoId is filled in after publishing.
      playlist: short ? null : "Designing Data-Intensive Applications, Chapter by Chapter", videoId: null, tags: ["designing data-intensive applications", "DDIA", "Martin Kleppmann", "system design", "distributed systems"],
    },
    ...(short ? { relatedVideo: null } : {}), // Shorts: "https://youtu.be/<long-form id>" (reference/series-log.md)
    deliverables: tilde(format === "short" ? path.join(deliverables, "Short") : deliverables),
  };
  put("video.json", (f) => fs.writeFileSync(f, JSON.stringify(video, null, 1) + "\n"));
  put("script/script.json", (f) => fs.writeFileSync(f, JSON.stringify({ voice: VOICE, speed, scenes: [] }, null, 1) + "\n"));
  put("build/data.mjs", (f) => fs.copyFileSync(path.join(SKILL, "reference/data-template.mjs"), f));
  put("stage/thumbnail.html", (f) => fs.copyFileSync(path.join(SKILL, "reference", short ? "thumbnail-short.html" : "thumbnail-long.html"), f));
}
// Generic guides every agent reads (copies, so prompts can point at WORK/brief/...), plus stubs for the per-video brief files.
copyGuides(dir);
for (const [f, body] of [
  ["brief/brief.md", `# Brief — DDIA Session ${session} (${format})\n\nTODO: goal, audience, hook, required content (one bullet per deck section), ending, chapter-specific accuracy points.\nSeries-wide rules: brief/series-standards.md.\n`],
  ["brief/storyboard.md", `# Storyboard — DDIA Session ${session} (${format})\n\nTODO: one entry per scene: id, target seconds, visual, beats (cue names, in order). Mirror the ids/beats in video.json "scenes".\n`],
  ["brief/accuracy-notes.md", `# Accuracy decisions (binding for script and visuals)\n\nTODO: numbered decisions — every figure with its source and qualification, deck errors corrected, labels required on screen.\n`],
]) if (!fs.existsSync(path.join(dir, f))) fs.writeFileSync(path.join(dir, f), body);
// Stubs so the stage loads before data/words exist.
for (const [f, body] of [["stage/datasets.js", "window.DATA = {};\n"], ["stage/words.js", "window.WORDS = {};\n"]]) if (!fs.existsSync(path.join(dir, f))) fs.writeFileSync(path.join(dir, f), body);
if (deckHtml) fs.copyFileSync(deckFile, path.join(dir, "brief/deck.html"));

// Cloud: keep regenerable media out of the session branch (the final .mp4 is committed from the deliverables folder).
const ignore = path.join(HOME_DIR, ".gitignore");
if (CLOUD && !fs.existsSync(ignore)) fs.writeFileSync(ignore, `# Cloud-session DDIA video work (.claude/skills/ddia-video/reference/cloud.md).
# Committed: deliverables (with the final .mp4) and each work dir's sources. Ignored: regenerable media.
node_modules
**/work/*/audio/
**/work/*/out/*.mp4
**/work/*/out/*.wav
**/work/*/out/segments-*/
**/work/*/out/qa/
*.bak
`);

// node_modules → shared cache.
const nm = path.join(dir, "node_modules");
if (!fs.existsSync(nm)) {
  if (fs.existsSync(path.join(CACHE, "node_modules"))) fs.symlinkSync(path.join(CACHE, "node_modules"), nm);
  else console.log(`! ${CACHE}/node_modules missing — run: node ${path.join(SKILL, "scripts/setup.mjs")}`);
}
console.log(`work dir: ${dir}
session ${session} (${deckTitle}) → book chapter ${chapter ?? "?"} · format ${format}${example ? ` · from example ${example}` : ""}
deck: ${deckHtml ? deckFile : "(not found — set DDIA_REPO)"}
next: fill video.json, brief/, script/script.json, stage/scenes/ (see the skill's SKILL.md)`);
