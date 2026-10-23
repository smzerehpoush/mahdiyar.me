// Loads video.json (the per-video config at the work-dir root) and derives canvas size, safe area and paths.
// Every build/tools script imports this instead of hard-coding chapter- or format-specific values.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const file = path.join(root, "video.json");
if (!fs.existsSync(file)) throw new Error(`missing ${file} — scaffold the work dir with scripts/new-video.mjs`);
export const cfg = JSON.parse(fs.readFileSync(file, "utf8"));

export const FORMATS = {
  // long: 16:9. Text the viewer must read stays above y = 950 (YouTube captions/controls cover the bottom band).
  long: { W: 1920, H: 1080, safe: { x0: 0, y0: 0, x1: 1920, y1: 950 }, thumb: { w: 1280, h: 720 }, captions: { maxChars: 42, maxLines: 2 },
    timing: { leadFirst: 1.0, lead: 0.6, endHold: 2.5, tail: 0.8 }, fade: { in: 0.6, out: 1.2 } },
  // short: 9:16. The Shorts player overlays the top bar, the right-hand action buttons and the bottom title/channel block,
  // so everything readable stays inside x 60–940, y 220–1480. Shorts autoplay and loop: no fade-in from black (the first
  // frame is the hook), the voice starts almost at once, and the end hold is short.
  short: { W: 1080, H: 1920, safe: { x0: 60, y0: 220, x1: 940, y1: 1480 }, thumb: { w: 1080, h: 1920 }, captions: { maxChars: 32, maxLines: 2 },
    timing: { leadFirst: 0.35, lead: 0.35, endHold: 1.2, tail: 0.4 }, fade: { in: 0, out: 0.6 } },
};
export const fmt = FORMATS[cfg.format || "long"];
if (!fmt) throw new Error(`video.json: unknown format "${cfg.format}" (use "long" or "short")`);
export const W = fmt.W, H = fmt.H;
export const SAFE = { ...fmt.safe, ...(cfg.safe || {}) };
export const CAPTIONS = { ...fmt.captions, ...(cfg.captions || {}) };
export const THUMB = { ...fmt.thumb, ...(cfg.thumbnail || {}) };
export const TIMING = { ...fmt.timing, ...(cfg.timing || {}) };
export const FADE = { ...fmt.fade, ...(cfg.fade || {}) };

/** Shared, durable cache for heavy dependencies (node_modules, whisper model). */
export const CACHE = process.env.DDIA_VIDEO_CACHE || path.join(os.homedir(), ".cache/ddia-video");
export function whisperModel() {
  const cands = [process.env.WHISPER_MODEL, path.join(CACHE, "models/ggml-base.en.bin"), path.join(root, "build/ggml-base.en.bin")].filter(Boolean);
  const m = cands.find((p) => fs.existsSync(p));
  if (!m) throw new Error(`whisper model not found; run scripts/setup.mjs from the skill (looked in: ${cands.join(", ")})`);
  return m;
}
/** build/timeline.json (written by build/tts.mjs); exits with a clear message when tts has not run yet. */
export function loadTimeline() {
  const f = path.join(root, "build/timeline.json");
  if (!fs.existsSync(f)) { console.error("no build/timeline.json yet: run node build/tts.mjs (after the script validates)"); process.exit(1); }
  return JSON.parse(fs.readFileSync(f, "utf8"));
}
export const expandHome = (p) => (p && p.startsWith("~/") ? path.join(os.homedir(), p.slice(2)) : p);

/** Section label + accent color for the on-screen section tag, keyed by script scene.section. */
export function stageConfig() {
  return {
    title: cfg.shortTitle || cfg.title || "DDIA video",
    format: cfg.format || "long",
    W, H, safe: SAFE, fade: FADE,
    sections: cfg.sections || {},
    // For the credits/"next chapter" scene: read these instead of hard-coding the session URL or chapter number.
    session: cfg.session ?? null, chapter: cfg.chapter ?? null, book: cfg.book || null,
    deck: cfg.deck ? { title: cfg.deck.title, url: cfg.deck.url } : null,
    ...(cfg.deck2 ? { deck2: { title: cfg.deck2.title, url: cfg.deck2.url } } : {}), // second session deck of a split chapter
  };
}
export function writeStageConfig() {
  fs.writeFileSync(path.join(root, "stage/video.js"), "window.VIDEO = " + JSON.stringify(stageConfig(), null, 1) + ";\n");
}
