#!/usr/bin/env node
// One-time machine setup for the ddia-video skill. Idempotent: safe to re-run; it only fills in what is missing.
//  - checks ffmpeg, whisper-cli, Google Chrome, node ≥ 20 (on Linux / cloud sessions, scripts/cloud-setup.sh installs them)
//  - installs the shared node_modules (kokoro-js, puppeteer-core, onnxruntime-common) into ~/.cache/ddia-video
//  - downloads the whisper base.en model (word timings + ASR check) into ~/.cache/ddia-video/models
//  - optionally pre-fetches the Kokoro TTS model (~330 MB) with parallel ranged curl (the HF download can be slow)
// Usage: node scripts/setup.mjs [--prefetch-tts]
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const SKILL = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CACHE = process.env.DDIA_VIDEO_CACHE || path.join(os.homedir(), ".cache/ddia-video");
const LINUX = process.platform === "linux";
// Same lookup as template/tools/browser.mjs.
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  path.join(CACHE, "chrome/chrome-linux64/chrome")].find((p) => fs.existsSync(p)) || (LINUX ? path.join(CACHE, "chrome/chrome-linux64/chrome") : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
const SYS_HINT = `sudo bash ${path.join(SKILL, "scripts/cloud-setup.sh")}`;
const ok = (m) => console.log("  ✓ " + m), bad = (m) => console.log("  ✗ " + m);
let problems = 0;
const has = (cmd) => spawnSync("sh", ["-c", `command -v ${cmd}`]).status === 0;

console.log("tools");
if (+process.versions.node.split(".")[0] >= 20) ok(`node ${process.versions.node}`); else { bad(`node ${process.versions.node} (need ≥ 20)`); problems++; }
for (const [cmd, hint] of [["ffmpeg", LINUX ? SYS_HINT : "brew install ffmpeg"], ["ffprobe", LINUX ? SYS_HINT : "brew install ffmpeg"], ["whisper-cli", LINUX ? SYS_HINT : "brew install whisper-cpp"]]) {
  if (has(cmd)) ok(cmd); else { bad(`${cmd} missing — ${hint}`); problems++; }
}
if (fs.existsSync(CHROME)) ok(`Chrome ${CHROME}`); else { bad(`Chrome not found at ${CHROME} (${LINUX ? SYS_HINT : "set CHROME_PATH"})`); problems++; }

console.log(`shared cache ${CACHE}`);
fs.mkdirSync(path.join(CACHE, "models"), { recursive: true });
for (const f of ["package.json", "package-lock.json"]) fs.copyFileSync(path.join(SKILL, "template", f), path.join(CACHE, f));
if (!fs.existsSync(path.join(CACHE, "node_modules/kokoro-js"))) {
  console.log("  installing node_modules (npm ci)…");
  // onnxruntime-node's postinstall would otherwise fetch CUDA binaries on linux-x64 (unused: TTS runs on the CPU).
  execFileSync("npm", ["ci", "--no-audit", "--no-fund", "--fetch-retries=5"], { cwd: CACHE, stdio: "inherit", env: { ...process.env, ONNXRUNTIME_NODE_INSTALL_CUDA: "skip" } });
}
ok("node_modules");

const ggml = path.join(CACHE, "models/ggml-base.en.bin");
if (!fs.existsSync(ggml)) {
  console.log("  downloading whisper ggml-base.en.bin (~150 MB)…");
  execFileSync("curl", ["-L", "--fail", "--retry", "5", "-o", ggml, "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin"], { stdio: "inherit" });
}
ok("whisper model");

const kokoro = path.join(CACHE, "node_modules/@huggingface/transformers/.cache/onnx-community/Kokoro-82M-v1.0-ONNX");
if (fs.existsSync(path.join(kokoro, "onnx/model.onnx"))) ok("Kokoro model cached");
else if (process.argv.includes("--prefetch-tts")) {
  const base = "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/";
  fs.mkdirSync(path.join(kokoro, "onnx"), { recursive: true });
  for (const f of ["config.json", "tokenizer.json", "tokenizer_config.json"]) execFileSync("curl", ["-sL", "--fail", "--retry", "5", "-o", path.join(kokoro, f), base + f]);
  // model.onnx in 8 parallel ranges (single-stream HF downloads are often slow), then concatenated.
  const url = base + "onnx/model.onnx";
  const size = +execFileSync("sh", ["-c", `curl -sIL '${url}' | awk 'tolower($1)=="content-length:"{v=$2} END{print v+0}'`]).toString().trim();
  if (!size) throw new Error("could not read model size");
  const N = 8, part = Math.ceil(size / N), tmp = path.join(kokoro, "onnx/.parts"); fs.mkdirSync(tmp, { recursive: true });
  const cmds = Array.from({ length: N }, (_, i) => `curl -sL --fail --retry 5 -r ${i * part}-${Math.min(size, (i + 1) * part) - 1} -o '${tmp}/p${i}' '${url}' &`).join("\n") + "\nwait";
  console.log(`  downloading Kokoro model.onnx (${(size / 1e6).toFixed(0)} MB) in ${N} parts…`);
  execFileSync("bash", ["-c", cmds], { stdio: "inherit" });
  execFileSync("bash", ["-c", `cat ${Array.from({ length: N }, (_, i) => `'${tmp}/p${i}'`).join(" ")} > '${kokoro}/onnx/model.onnx' && rm -rf '${tmp}'`]);
  if (fs.statSync(path.join(kokoro, "onnx/model.onnx")).size !== size) throw new Error("model.onnx size mismatch");
  ok("Kokoro model downloaded");
} else console.log("  · Kokoro model not cached yet — the first `node build/tts.mjs` downloads it (or re-run with --prefetch-tts)");

console.log(problems ? `\n${problems} problem(s) above need fixing.` : "\nready.");
process.exit(problems ? 1 : 0);
