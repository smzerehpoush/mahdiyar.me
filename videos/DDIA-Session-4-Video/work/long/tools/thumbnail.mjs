// Render the YouTube thumbnail (PNG + JPEG; 1280×720 long-form, 1080×1920 Shorts) from stage/thumbnail.html.
import path from "node:path";
import { execFileSync } from "node:child_process";
import puppeteer from "puppeteer-core";
import { root, CHROME, LINUX_ARGS } from "./browser.mjs";
import { THUMB } from "../build/config.mjs";
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--force-color-profile=srgb", "--allow-file-access-from-files", ...LINUX_ARGS], defaultViewport: { width: THUMB.w, height: THUMB.h, deviceScaleFactor: 1 } });
const page = await browser.newPage();
await page.goto("file://" + path.join(root, "stage/thumbnail.html"), { waitUntil: "load" });
await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.fonts].map((f) => f.load().catch(() => null))); });
const png = path.join(root, "out/thumbnail.png");
await page.screenshot({ path: png });
await browser.close();
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", png, "-q:v", "2", path.join(root, "out/thumbnail.jpg")]);
console.log("→ out/thumbnail.png, out/thumbnail.jpg");
process.exit(0);
