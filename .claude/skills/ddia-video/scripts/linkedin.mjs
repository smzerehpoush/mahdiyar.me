#!/usr/bin/env node
// Drive LinkedIn in the same signed-in CDP Chrome as YouTube Studio (reference/linkedin.md). It always uses its own LinkedIn tab,
// opened in a separate window, so it never takes over the Studio tab that tools/yt.mjs drives.
// Commands: status | goto <url> | shot [out.png] | eval '<js>' | click '<sel>' | clickxy <x> <y> | type <text> | key <Key>
//           fill '<sel>' <text|@file>   (select-all + replace in a contenteditable; keeps line breaks)
// Port: YT_CDP_PORT (default 9333). Needs puppeteer-core from ~/.cache/ddia-video/node_modules (scripts/setup.mjs).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const CACHE = process.env.DDIA_VIDEO_CACHE || path.join(os.homedir(), ".cache/ddia-video");
const require = createRequire(path.join(CACHE, "node_modules/"));
const puppeteer = require("puppeteer-core");
const [cmd, a, b] = process.argv.slice(2);
const SHOT = path.join(CACHE, "auto/linkedin.png");
setTimeout(() => { console.log(`ERR ${cmd}: no result after 90 s (take a shot; try clickxy or eval-click)`); process.exit(2); }, 90000).unref();

const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${process.env.YT_CDP_PORT || 9333}`, defaultViewport: null });
let page = (await browser.pages()).find((p) => p.url().includes("linkedin.com"));
if (!page) {
  // A new window (not a tab) keeps the Studio tab visible to its own session.
  const cdp = await browser.target().createCDPSession();
  await cdp.send("Target.createTarget", { url: "https://www.linkedin.com/feed/", newWindow: true });
  const t = await browser.waitForTarget((t) => t.type() === "page" && t.url().includes("linkedin.com"), { timeout: 30000 });
  page = await t.page();
  await new Promise((r) => setTimeout(r, 4000));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  if (cmd === "status") {
    if (!page.url().includes("/feed")) { await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 60000 }); await sleep(4000); }
    const u = page.url();
    console.log(JSON.stringify({ url: u, signedIn: /linkedin\.com\/feed/.test(u) && !/login|checkpoint|authwall/.test(u) }));
  }
  else if (cmd === "goto") { await page.goto(a, { waitUntil: "domcontentloaded", timeout: 60000 }); await sleep(3000); console.log(page.url()); }
  else if (cmd === "shot") { fs.mkdirSync(path.dirname(a || SHOT), { recursive: true }); await page.screenshot({ path: a || SHOT }); console.log((a || SHOT) + " " + page.url()); }
  else if (cmd === "eval") console.log(JSON.stringify(await page.evaluate(a), null, 1));
  else if (cmd === "click") { const h = await page.waitForSelector(a, { timeout: 15000 }); await h.click(); console.log("clicked"); }
  else if (cmd === "clickxy") { await page.mouse.click(+a, +b); console.log(`clicked at ${a},${b}`); }
  else if (cmd === "key") { await page.keyboard.press(a); console.log("pressed"); }
  else if (cmd === "type") { await page.keyboard.type(a, { delay: 5 }); console.log("typed"); }
  else if (cmd === "fill") {
    const text = b.startsWith("@") ? fs.readFileSync(b.slice(1), "utf8").replace(/\s+$/, "") : b;
    const h = await page.waitForSelector(a, { timeout: 15000 });
    await h.click();
    await h.evaluate((e) => { e.focus(); const r = document.createRange(); r.selectNodeContents(e); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
    await page.keyboard.press("Backspace");
    // Type line by line: Enter makes a new paragraph in LinkedIn's editor; insertText keeps Persian text and emoji intact.
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]) await page.keyboard.sendCharacter(lines[i]);
      if (i < lines.length - 1) await page.keyboard.press("Enter");
    }
    console.log(`filled ${text.length} chars; now: ${JSON.stringify((await h.evaluate((e) => e.innerText)).slice(0, 80))}`);
  }
  else console.log("usage: linkedin.mjs status|goto|shot|eval|click|clickxy|type|key|fill");
} catch (e) { console.log("ERR " + e.message); }
browser.disconnect();
process.exit(0);
