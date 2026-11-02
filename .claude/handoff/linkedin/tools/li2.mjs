// LinkedIn helper over CDP (port 9333), pierces shadow roots.
// node li2.mjs find '<regex>'            → list visible elements whose own text matches (deepest first), with centers
// node li2.mjs click '<regex>' [n]       → trusted mouse click on the n-th match (default 0)
// node li2.mjs clickxy x y | key <Key> | type <text> | shot [file] | text '<regex for container text>'
// node li2.mjs label '<regex>' [n]       → match by aria-label instead of text
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
// puppeteer-core comes from the ddia-video cache that scripts/setup.mjs installs, so this folder needs no node_modules.
const puppeteer = createRequire(path.join(os.homedir(), ".cache/ddia-video/node_modules/"))("puppeteer-core");
const [cmd, a, b] = process.argv.slice(2);
setTimeout(() => { console.log("ERR timeout"); process.exit(2); }, 60000).unref();
const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9333", defaultViewport: null });
const page = (await browser.pages()).find((p) => p.url().includes("linkedin.com"));
if (!page) { console.log("ERR no linkedin tab"); process.exit(1); }
const finder = (re, byLabel) => {
  const rx = new RegExp(re, "i");
  const roots = [document], els = [];
  while (roots.length) { const r = roots.pop(); for (const e of r.querySelectorAll("*")) { if (e.shadowRoot) roots.push(e.shadowRoot); els.push(e); } }
  const out = [];
  for (const e of els) {
    const s = byLabel ? (e.getAttribute("aria-label") || "") : (e.innerText || "").trim();
    if (!s || !rx.test(s)) continue;
    const r = e.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight) continue;
    out.push({ e, s, r });
  }
  // deepest first: drop elements that contain another match
  const deep = out.filter((o) => !out.some((p) => p !== o && o.e.contains(p.e)));
  return deep.map((o) => ({ tag: o.e.tagName, text: o.s.slice(0, 90).replace(/\n/g, " | "), x: Math.round(o.r.x + o.r.width / 2), y: Math.round(o.r.y + o.r.height / 2) }));
};
try {
  if (cmd === "find" || cmd === "findl") console.log(JSON.stringify(await page.evaluate(finder, a, cmd === "findl"), null, 0).replace(/},{/g, "},\n{"));
  else if (cmd === "click" || cmd === "label") {
    const m = await page.evaluate(finder, a, cmd === "label");
    const t = m[+(b || 0)];
    if (!t) console.log("ERR no match for " + a + " (" + m.length + " matches)");
    else { await page.mouse.click(t.x, t.y); console.log("clicked " + t.tag + " '" + t.text.slice(0, 50) + "' at " + t.x + "," + t.y); }
  }
  else if (cmd === "reveal") {
    console.log(await page.evaluate((re) => {
      const rx = new RegExp(re, "i"); const roots = [document]; const hits = [];
      while (roots.length) { const r = roots.pop(); for (const e of r.querySelectorAll("*")) { if (e.shadowRoot) roots.push(e.shadowRoot); if (rx.test((e.innerText || "").trim())) hits.push(e); } }
      const deep = hits.filter((h) => !hits.some((o) => o !== h && h.contains(o)));
      if (!deep.length) return "none";
      deep[0].scrollIntoView({ block: "center" }); const r = deep[0].getBoundingClientRect();
      return "revealed at y=" + Math.round(r.y + r.height / 2) + " (" + deep.length + " matches)";
    }, a));
  }
  else if (cmd === "postmenu") {
    // postmenu '<hook regex>': find the scheduled-post item whose text matches, scroll it to centre, click its "More options".
    const where = async () => page.evaluate((re) => {
      const rx = new RegExp(re); const roots = [document]; const els = [];
      while (roots.length) { const r = roots.pop(); for (const e of r.querySelectorAll("*")) { if (e.shadowRoot) roots.push(e.shadowRoot); els.push(e); } }
      const hook = els.filter((e) => rx.test((e.innerText || "").trim())).filter((h, _, all) => !all.some((o) => o !== h && h.contains(o)))[0];
      if (!hook) return { err: "no hook" };
      hook.scrollIntoView({ block: "center", behavior: "instant" });
      const opts = (el) => [...el.querySelectorAll("*")].filter((e) => (e.getAttribute("aria-label") || "") === "More options");
      let item = hook;
      while (item && opts(item).length === 0) item = item.parentElement;
      if (!item) return { err: "no item" };
      if (opts(item).length !== 1) return { err: "ambiguous: " + opts(item).length + " buttons" };
      const btn = opts(item)[0];
      btn.scrollIntoView({ block: "center", behavior: "instant" });
      const r = btn.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), head: (item.innerText || "").trim().split("\n")[0] };
    }, a);
    let w = await where(); await new Promise((r) => setTimeout(r, 700)); w = await where();
    if (w.err) console.log("ERR " + w.err);
    else { await page.mouse.click(w.x, w.y); console.log("menu for '" + w.head + "' at " + w.x + "," + w.y); }
  }
  else if (cmd === "eval") { console.log(JSON.stringify(await page.evaluate(a))); }
  else if (cmd === "clickxy") { await page.mouse.click(+a, +b); console.log("clicked"); }
  else if (cmd === "key") { await page.keyboard.press(a); console.log("pressed " + a); }
  else if (cmd === "type") { await page.keyboard.type(a, { delay: 20 }); console.log("typed"); }
  else if (cmd === "shot") { await page.screenshot({ path: a || "li.png" }); console.log("shot"); }
  else if (cmd === "text") {
    console.log(await page.evaluate((re) => {
      const rx = new RegExp(re, "i"); const roots = [document]; let best = null;
      while (roots.length) { const r = roots.pop(); for (const e of r.querySelectorAll("*")) { if (e.shadowRoot) roots.push(e.shadowRoot); const s = e.innerText || ""; if (rx.test(s) && (!best || s.length < best.length)) best = s; } }
      return best;
    }, a));
  }
} catch (e) { console.log("ERR " + e.message); }
browser.disconnect(); process.exit(0);
