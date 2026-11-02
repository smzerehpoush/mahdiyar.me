#!/usr/bin/env node
// Decide what the next automatic run makes, from reference/series-log.md (the Published table is the series' source of truth).
//   node scripts/auto/next.mjs          → JSON: { long: N|null, shorts: [N…], done: bool, lastShortDate }
// One run = the next session's long-form + its Short, plus at most one backlog Short (a published long-form with no Short yet).
import fs from "node:fs";
import path from "node:path";

const SKILL = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const LAST_SESSION = 17;
const log = fs.readFileSync(path.join(SKILL, "reference/series-log.md"), "utf8");

const longs = new Set(), shorts = new Set();
let lastShortDate = null;
for (const line of log.split("\n")) {
  const m = /^\|\s*(\d+)\s*\|\s*(long|Short)\b[^|]*\|[^|]*\|[^|]*\|\s*([^|]*)\|/.exec(line);
  if (!m) continue;
  const s = +m[1];
  if (m[2] === "long") longs.add(s);
  else {
    shorts.add(s);
    const d = /(\d{4}-\d{2}-\d{2})/.exec(m[3])?.[1];
    if (d && (!lastShortDate || d > lastShortDate)) lastShortDate = d;
  }
}

let long = null;
for (let s = 1; s <= LAST_SESSION; s++) if (!longs.has(s)) { long = s; break; }
const backlog = [...longs].filter((s) => !shorts.has(s)).sort((a, b) => a - b).slice(0, 1);
const out = [...backlog];
if (long && !out.includes(long)) out.push(long);
console.log(JSON.stringify({ long, shorts: out, done: !long && out.length === 0, lastShortDate }));
