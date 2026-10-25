// Shared headless-Chrome helpers for stills and rendering.
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

import { root, W, H, loadTimeline, CACHE } from "../build/config.mjs";
export { root, W, H, loadTimeline };
// CHROME_PATH, else macOS Google Chrome, else the Chrome for Testing build that scripts/cloud-setup.sh installs on Linux.
export const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  path.join(CACHE, "chrome/chrome-linux64/chrome")].find((p) => fs.existsSync(p)) || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
// Cloud sessions run as root, where Chrome refuses to start without --no-sandbox.
export const LINUX_ARGS = process.platform === "linux" ? ["--disable-dev-shm-usage", ...(process.getuid?.() === 0 ? ["--no-sandbox"] : [])] : [];

export async function openStage({ qa = false } = {}) {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--force-color-profile=srgb", "--hide-scrollbars", "--font-render-hinting=none", "--disable-lcd-text", "--allow-file-access-from-files", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", ...LINUX_ARGS],
    defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message || e)));
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warn" || m.type() === "warning") errors.push(`[console.${m.type()}] ${m.text()}`); });
  const url = "file://" + path.join(root, "stage/index.html") + (qa ? "?qa=1" : "");
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction("window.__ready === true", { timeout: 60000 });
  const missing = await page.evaluate(() => window.__missing);
  const cdp = await page.createCDPSession();
  return { browser, page, cdp, errors, missing };
}

/** Seek and return the scene-update error (if any) instead of throwing, so tools can report it. */
export async function seek(page, T) {
  return page.evaluate((T) => { try { R.seek(T); return null; } catch (e) { return String(e && e.stack || e); } }, T);
}
