#!/usr/bin/env node
// Bring a cloud session's video work home (reference/cloud.md): fetch its branch and copy every videos/DDIA-Session-N-Video folder
// into ~/Movies, so the local publish step (SKILL.md §8) runs unchanged on the result.
//
//   node scripts/import-cloud.mjs --branch claude/ddia-session-4-xyz
//
// A local file that differs from the branch's copy is kept as <file>.bak before it is replaced. Each work dir gets its node_modules
// link back, out/final.mp4 (from the deliverables folder; the branch ignores work-dir media), and a local "deliverables" path.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SKILL = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const REPO = process.env.DDIA_REPO || path.resolve(SKILL, "../../..");
const CACHE = process.env.DDIA_VIDEO_CACHE || path.join(os.homedir(), ".cache/ddia-video");
const HOME_DIR = process.env.DDIA_VIDEO_HOME || path.join(os.homedir(), "Movies");
const argv = process.argv.slice(2);
const branch = argv[argv.indexOf("--branch") + 1];
if (!argv.includes("--branch") || !branch) { console.error("usage: import-cloud.mjs --branch <cloud session branch>"); process.exit(2); }

const git = (...a) => execFileSync("git", ["-C", REPO, ...a], { encoding: "utf8", maxBuffer: 1 << 30 });
git("fetch", "-q", "origin", `+refs/heads/${branch}:refs/remotes/origin/${branch}`);
const ref = `origin/${branch}`;
const folders = git("ls-tree", "-d", "--name-only", ref, "videos/").split("\n").filter((d) => /^videos\/DDIA-Session-\d+-Video$/.test(d));
if (!folders.length) { console.error(`${ref} has no videos/DDIA-Session-N-Video folder`); process.exit(1); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ddia-import-"));
execFileSync("sh", ["-c", `git -C '${REPO}' archive '${ref}' ${folders.map((f) => `'${f}'`).join(" ")} | tar -x -C '${tmp}'`]);
const tilde = (p) => (p.startsWith(os.homedir() + path.sep) ? "~/" + path.relative(os.homedir(), p) : p);

for (const folder of folders) {
  const from = path.join(tmp, folder), to = path.join(HOME_DIR, path.basename(folder));
  let added = 0, replaced = 0;
  for (const rel of fs.readdirSync(from, { recursive: true })) {
    const a = path.join(from, rel), b = path.join(to, rel);
    if (fs.statSync(a).isDirectory()) continue;
    let data = fs.readFileSync(a);
    // A work dir's "deliverables" names the cloud VM's folder; use the local one (so a re-import finds the file unchanged).
    const fmt = /^work[\\/](long|short)[\\/]video\.json$/.exec(rel)?.[1];
    if (fmt) data = Buffer.from(data.toString("utf8").replace(/("deliverables":\s*)"[^"]*"/, `$1${JSON.stringify(tilde(fmt === "short" ? path.join(to, "Short") : to))}`));
    fs.mkdirSync(path.dirname(b), { recursive: true });
    if (fs.existsSync(b)) { if (fs.readFileSync(b).equals(data)) continue; fs.copyFileSync(b, b + ".bak"); replaced++; } else added++;
    fs.writeFileSync(b, data);
  }
  console.log(`${tilde(to)}: ${added} new, ${replaced} replaced (previous copies kept as .bak)`);

  for (const format of ["long", "short"]) {
    const work = path.join(to, "work", format), vj = path.join(work, "video.json");
    if (!fs.existsSync(vj)) continue;
    const out = format === "short" ? path.join(to, "Short") : to;
    const nm = path.join(work, "node_modules");
    if (!fs.existsSync(nm) && fs.existsSync(path.join(CACHE, "node_modules"))) fs.symlinkSync(path.join(CACHE, "node_modules"), nm);
    const mp4 = fs.existsSync(out) ? fs.readdirSync(out).find((f) => f.endsWith(".mp4")) : null;
    if (mp4) { fs.mkdirSync(path.join(work, "out"), { recursive: true }); fs.copyFileSync(path.join(out, mp4), path.join(work, "out/final.mp4")); }
    console.log(`  work/${format}: ${mp4 ? `out/final.mp4 ← ${mp4}` : "no .mp4 in the deliverables yet (not rendered in the cloud?)"}`);
  }
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\nnext: publish from the work dir (SKILL.md §8). The branch ${branch} can be deleted on GitHub once the video is published.`);
