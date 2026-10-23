// Drive the user's signed-in YouTube Studio tab over CDP (Chrome started with --remote-debugging-port=9333).
// Commands: verify <videoId> [shot.png] (public watch page: title, length, captions, privacy) | goto <url> | clickxy <x> <y> (CSS px; e.g. to dismiss a popup) | shot [out.png] | eval '<js expr>' | file '<css selector>' <path> | click '<css selector>' | key <Key> | type <text>
//           fill '<selector>' <text|@file> | choose '<selector>' <path>   (port: YT_CDP_PORT, default 9333)
import puppeteer from "puppeteer-core";
const [cmd, a, b] = process.argv.slice(2);
// Puppeteer's element click can wait forever on some Studio widgets; never hang the caller.
setTimeout(() => { console.log(`ERR ${cmd}: no result after 90 s (take a shot; try clickxy or eval-click)`); process.exit(2); }, 90000).unref();
const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${process.env.YT_CDP_PORT || 9333}`, defaultViewport: null });
const pages = await browser.pages();
let page = pages.find((p) => p.url().startsWith("https://studio.youtube.com")) || pages.find((p) => p.url().startsWith("http")) || pages[0];
try {
  if (!page || cmd === "goto") {
    if (!page) page = await browser.newPage();
    if (cmd === "goto") { await page.goto(a, { waitUntil: "domcontentloaded", timeout: 60000 }); await new Promise((r) => setTimeout(r, 2500)); console.log(page.url()); }
  }
  if (cmd === "goto") {}
  else if (cmd === "verify") {
    const w = await browser.newPage();
    await w.goto("https://www.youtube.com/watch?v=" + a, { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 6000));
    console.log(JSON.stringify(await w.evaluate(() => {
      const pr = window.ytInitialPlayerResponse || {}, vd = pr.videoDetails || {};
      const caps = pr.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
      return { url: location.href, title: vd.title, lengthSeconds: vd.lengthSeconds, isPrivate: vd.isPrivate, playable: pr.playabilityStatus?.status,
        captions: caps.map((c) => (c.name?.simpleText || c.name?.runs?.[0]?.text) + (c.kind ? ` (${c.kind})` : "")) };
    }), null, 1));
    if (b) await w.screenshot({ path: b });
    await w.close();
  }
  else if (cmd === "shot") { await page.screenshot({ path: a || new URL("../out/yt.png", import.meta.url).pathname }); console.log(page.url()); }
  else if (cmd === "eval") console.log(JSON.stringify(await page.evaluate(a), null, 1));
  else if (cmd === "file") { const h = await page.waitForSelector(a, { timeout: 15000 }); await h.uploadFile(b); console.log("file set"); }
  else if (cmd === "click") { const h = await page.waitForSelector(a, { timeout: 15000 }); await h.click(); console.log("clicked"); }
  else if (cmd === "clickxy") { await page.mouse.click(+a, +b); console.log("clicked at " + a + "," + b); }
  else if (cmd === "key") { await page.keyboard.press(a); console.log("pressed"); }
  else if (cmd === "fill") {
    // fill '<selector>' <text or @file>: focus a contenteditable/textbox, select all, replace with the text.
    const fs = await import("node:fs");
    const text = b.startsWith("@") ? fs.readFileSync(b.slice(1), "utf8").replace(/\s+$/, "") : b;
    const h = await page.waitForSelector(a, { timeout: 15000 });
    await h.click();
    await h.evaluate((e) => { e.focus(); const r = document.createRange(); r.selectNodeContents(e); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); });
    await page.keyboard.press("Backspace");
    await page.keyboard.type(text, { delay: 0 });
    console.log("filled " + text.length + " chars; now: " + JSON.stringify((await h.evaluate((e) => e.innerText)).slice(0, 80)));
  }
  else if (cmd === "choose") {
    // choose '<selector>' <path>: click a button that opens a native file chooser and accept it with <path>.
    const h = await page.waitForSelector(a, { timeout: 15000 });
    const [fc] = await Promise.all([page.waitForFileChooser({ timeout: 15000 }), h.click()]);
    await fc.accept([b]); console.log("chooser accepted");
  }
  else if (cmd === "type") { await page.keyboard.type(a, { delay: 5 }); console.log("typed"); }
} catch (e) { console.log("ERR " + e.message); }
browser.disconnect();
process.exit(0);
