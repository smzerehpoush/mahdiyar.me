// S16 — Percentiles: histogram of 1,000 simulated requests (window.DATA.percentiles), p50/p95/p99 markers and readouts,
// then 20 long pauses (2%) land far right on a broken axis and the readouts update.
R.scene("percentiles", {
  build(root, k) {
    const s = {};
    const C = K.C;
    const P = k.data.percentiles;
    s.P = P;
    const hexMix = (a, b, p) => "#" + [0, 2, 4].map((j) => Math.round(U.lerp(parseInt(a.slice(1 + j, 3 + j), 16), parseInt(b.slice(1 + j, 3 + j), 16), p)).toString(16).padStart(2, "0")).join("");
    s.barFill = hexMix(C.bg, C.sca, 0.5);
    s.barHi = hexMix(C.bg, C.sca, 0.78);
    s.hexMix = hexMix;

    s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Response time is a distribution" });
    s.badge = K.badge(root, { x: 0, y: 132, right: 120, text: "1,000 simulated requests" });

    // ---- Scales: main axis 0–400 ms, a break, then a compressed 0.8–2.0 s region for the pauses.
    const X0 = 180, PX = 2.5, XB0 = 1180, XP0 = 1260, XP1 = 1740, PP = (XP1 - XP0) / 1200;
    const BASE = 620, PH = 320, BIN = 10, NB = 40;
    const xOf = (ms) => (ms <= 400 ? X0 + ms * PX : XP0 + (ms - 800) * PP);
    Object.assign(s, { X0, PX, XB0, XP0, XP1, BASE, PH, BIN, NB, xOf });

    const binsOf = (arr) => { const b = new Array(NB).fill(0); for (const v of arr) if (v < 400) b[Math.floor(v / BIN)]++; return b; };
    s.binsN = binsOf(P.normal);
    s.maxCount = Math.max(...s.binsN, ...binsOf(P.withPauses));
    s.cpx = PH / s.maxCount; // px per request (fixed scale for the whole scene)

    const svg = K.svgLayer(root);
    // Histogram bars (own rects: heights morph when the pause requests leave their bins).
    s.hist = U.sv("g", {}, svg);
    s.bars = s.binsN.map((n, i) => U.sv("rect", { x: (X0 + i * BIN * PX + 1.5).toFixed(1), width: (BIN * PX - 3).toFixed(1), rx: 3, fill: s.barFill }, s.hist));

    // Main axis + ticks.
    s.axis = U.sv("g", {}, svg);
    U.sv("line", { x1: X0 - 10, x2: XB0 + 6, y1: BASE + 2, y2: BASE + 2, stroke: C.line2, "stroke-width": 3, "stroke-linecap": "round" }, s.axis);
    [0, 100, 200, 300, 400].forEach((ms) => {
      U.sv("line", { x1: xOf(ms), x2: xOf(ms), y1: BASE + 2, y2: BASE + 12, stroke: C.line2, "stroke-width": 3 }, s.axis);
      U.sv("text", { x: xOf(ms), y: BASE + 44, "text-anchor": "middle", "font-size": 26, "font-weight": 600, fill: C.muted }, s.axis, ms === 400 ? "400 ms" : String(ms));
    });
    // Pause region: break marks, compressed axis, ticks.
    s.paxis = U.sv("g", {}, svg);
    const bx = (XB0 + XP0) / 2;
    [-9, 9].forEach((o) => U.sv("line", { x1: bx + o - 8, x2: bx + o + 8, y1: BASE + 16, y2: BASE - 12, stroke: C.muted, "stroke-width": 3, "stroke-linecap": "round" }, s.paxis));
    s.paxLine = U.sv("line", { x1: XP0 - 6, x2: XP1 + 10, y1: BASE + 2, y2: BASE + 2, stroke: C.line2, "stroke-width": 3, "stroke-linecap": "round" }, s.paxis);
    [[1000, "1 s"], [1500, "1.5 s"], [2000, "2 s"]].forEach(([ms, l]) => {
      U.sv("line", { x1: xOf(ms), x2: xOf(ms), y1: BASE + 2, y2: BASE + 12, stroke: C.line2, "stroke-width": 3 }, s.paxis);
      U.sv("text", { x: xOf(ms), y: BASE + 44, "text-anchor": "middle", "font-size": 26, "font-weight": 600, fill: C.muted }, s.paxis, l);
    });

    // Sweep line for "a given share of requests stay under".
    const sorted = P.normal.slice().sort((a, b) => a - b);
    s.shareUnder = (ms) => { let lo = 0, hi = sorted.length; while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] <= ms) lo = m + 1; else hi = m; } return lo / sorted.length; };
    s.sweep = U.sv("g", {}, svg);
    // Readout sits in the marker-label row (empty during the sweep), above the tallest bars.
    s.sweepLine = U.sv("line", { x1: 0, x2: 0, y1: BASE - PH - 20, y2: BASE, stroke: C.ink, "stroke-width": 3, "stroke-dasharray": "8 8" }, s.sweep);
    s.sweepTxt = U.sv("text", { x: 14, y: BASE - PH - 30, "font-size": 30, "font-weight": 700, fill: C.ink }, s.sweep, "");

    // Tail bracket (bins from 190 ms up to the slowest normal request).
    const tx0 = xOf(190), tx1 = xOf(350), ty = 548;
    s.tail = U.sv("g", {}, svg);
    U.sv("path", { d: `M${tx0},${ty + 12} L${tx0},${ty} L${tx1},${ty} L${tx1},${ty + 12}`, fill: "none", stroke: C.sca, "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round" }, s.tail);
    U.sv("text", { x: 800, y: 490, "font-size": 34, "font-weight": 800, fill: C.sca }, s.tail, "The tail");
    s.tailSub = U.sv("text", { x: 800, y: 526, "font-size": 28, "font-weight": 600, fill: C.muted }, s.tail, "the slowest requests");

    // Percentile markers.
    const mk = (name, color) => {
      const g = U.sv("g", { transform: "translate(0,0)" }, svg);
      const inner = U.sv("g", {}, g);
      const line = U.sv("path", { d: `M0,${BASE - PH - 16} L0,${BASE}`, fill: "none", stroke: color, "stroke-width": 4, "stroke-linecap": "round" }, inner);
      const lab = U.sv("text", { x: 0, y: BASE - PH - 30, "text-anchor": "middle", "font-size": 34, "font-weight": 800, fill: color }, inner, name);
      return { g, inner, line, lab };
    };
    s.m50 = mk("p50", C.ink);
    s.m95 = mk("p95", C.hl);
    s.m99 = mk("p99", C.bad);

    // Pause requests: they lift out of their original bins and land at their new (slow) times, one dot per request.
    const R9 = 9;
    const dest = P.pauseIdx.map((idx) => ({ idx, v0: P.normal[idx], v1: P.withPauses[idx] }));
    const placed = [];
    dest.slice().sort((a, b) => a.v1 - b.v1).forEach((d) => {
      const x = xOf(d.v1);
      let lvl = 0;
      while (placed.some((p) => p.lvl === lvl && Math.abs(p.x - x) < 2 * R9 + 2)) lvl++;
      placed.push({ x, lvl });
      d.x1 = x; d.y1 = BASE - R9 - 3 - lvl * (2 * R9 + 2);
    });
    dest.forEach((d) => { d.b0 = Math.floor(d.v0 / BIN); d.x0 = X0 + (d.b0 + 0.5) * BIN * PX; });
    s.dest = dest;
    s.dots = dest.map(() => U.sv("circle", { r: R9, fill: C.bad }, svg));

    // Pause annotation (left of where p99 will land).
    s.pl1 = K.text(root, { x: XP0 + 8, y: 318, cls: "label", text: "20 requests", color: "bad" }); s.pl1.style.fontSize = "34px"; s.pl1.style.fontWeight = 800;
    s.pl2 = K.text(root, { x: XP0 + 8, y: 362, cls: "label", text: "just 2%", color: "ink" });
    s.pl3 = K.text(root, { x: XP0 + 8, y: 402, cls: "label", text: "0.8–2.0 s each", color: "ink" });
    s.pkey = K.text(root, { x: XP0 + 8, y: 446, cls: "small", html: `<span style="color:${C.bad}">●</span> = 1 request` });

    // Readout tiles.
    // Order = order of appearance (Mean is first named in the compare line), so the row builds left to right.
    const tiles = [
      { key: "p50", name: "p50", desc: "median, half faster", color: C.ink },
      { key: "p95", name: "p95", desc: "95 of 100 faster", color: C.hl },
      { key: "p99", name: "p99", desc: "99 of 100 faster", color: C.bad },
      { key: "mean", name: "Mean", desc: "average", color: C.muted },
    ];
    const TY = 714, TW = 400, TG = 20;
    s.tiles = tiles.map((d, i) => {
      const n = K.card(root, { x: 120 + i * (TW + TG), y: TY, w: TW, h: 196 });
      n.style.padding = "22px 30px";
      n.style.borderColor = d.color === C.muted ? C.line2 : `color-mix(in srgb, ${d.color} 60%, transparent)`;
      n.innerHTML = `<div style="display:flex;align-items:baseline;gap:14px;white-space:nowrap"><span style="font-size:36px;font-weight:800;color:${d.color}">${d.name}</span><span style="font-size:26px;font-weight:550;color:${C.muted}">${d.desc}</span></div>` +
        `<div style="margin-top:10px;white-space:nowrap;line-height:1"><span class="v" style="font-size:66px;font-weight:800;letter-spacing:-0.02em;font-variant-numeric:tabular-nums;color:${C.ink}"></span><span style="font-size:30px;font-weight:600;color:${C.muted}">&nbsp;ms</span></div>` +
        `<div class="was" style="margin-top:12px;font-size:26px;font-weight:550;color:${C.muted};white-space:nowrap"></div>`;
      return { ...d, n, v: n.querySelector(".v"), vrow: n.querySelector(".v").parentNode, was: n.querySelector(".was") };
    });
    // Takeaway: lands in the empty plot space between p95 and the axis break once p99 has jumped away.
    // (38 px so "High percentiles reveal it." keeps clear air before the "20 requests / just 2%" labels at x≈1268.)
    s.take1 = K.text(root, { x: 736, y: 320, cls: "label", text: "Averages hide this.", color: "muted" }); s.take1.style.fontSize = "38px"; s.take1.style.fontWeight = 750;
    s.take2 = K.text(root, { x: 736, y: 370, cls: "label", html: `<span style="color:${C.bad}">High percentiles</span> reveal it.` }); s.take2.style.fontSize = "38px"; s.take2.style.fontWeight = 800;
    return s;
  },

  update(t, k, s) {
    const C = K.C, P = s.P, B = P.before, Af = P.after;
    const L = k.lines;
    // Word anchor; extra needles are fallbacks (the recognizer spells "p50" as "P-50").
    const wd = (ref, ...needles) => { for (const n of needles) { try { return k.word(ref, n); } catch (e) { /* next */ } } throw new Error("no anchor " + needles); };
    const iHist = L.findIndex((l) => l.cue === "hist"), iP99 = L.findIndex((l) => l.cue === "p99");
    const iPause = L.findIndex((l) => l.cue === "pauses"), iCmp = L.findIndex((l) => l.cue === "compare");
    const iDef = iHist + 1, iTail = iP99 + 1, iJump = iCmp + 1, iTake = iCmp + 2;

    A.show(s.title, t, 0.1);
    A.show(s.badge, t, k.word("hist", "1,000") - 0.05, { dy: 10 });

    // Histogram + axis: the distribution builds on "distribution", complete as "This histogram…" is said.
    const tHist = k.word("hist", "distribution");
    A.setOpacity(s.axis, A.prog(t, tHist - 0.25, 0.5));
    const grow = (i) => A.prog(t, tHist - 0.1 + (i / s.NB) * 1.3, 0.5);
    // Pause flights (on "long pauses"): each pause request leaves its bin (bin height drops by one request as it departs).
    const tFly = k.word("pauses", "pauses");
    const fly = s.dest.map((d, j) => A.prog(t, tFly + j * 0.06, 0.95, A.E.inOutCubic));
    const left = new Array(s.NB).fill(0);
    s.dest.forEach((d, j) => { left[d.b0] += A.prog(t, tFly + j * 0.06, 0.25); });
    // Sweep highlight (whole definition line) and tail highlight (on "tail").
    const tSw0 = L[iDef].start + 0.3, tSw1 = L[iDef].end - 0.5;
    const swOn = A.prog(t, tSw0, 0.3) * (1 - A.prog(t, L[iDef].end, 0.4));
    const swMs = 5 + (B.p99 - 5) * A.E.inOutSine(U.clamp((t - tSw0 - 0.2) / (tSw1 - tSw0 - 0.2)));
    const tTail = k.word(iTail, "tail") - 0.05;
    const tailOn = A.prog(t, tTail, 0.5);
    s.bars.forEach((r, i) => {
      const h = (s.binsN[i] - left[i]) * s.cpx * grow(i);
      r.setAttribute("y", (s.BASE - h).toFixed(1));
      r.setAttribute("height", Math.max(0, h).toFixed(1));
      const lo = i * s.BIN;
      const sw = swOn * (lo + s.BIN <= swMs ? 1 : 0);
      const tl = i >= 19 ? tailOn : 0;
      r.setAttribute("fill", s.hexMix(s.barFill, i >= 19 ? C.sca : s.barHi, Math.max(sw, tl)));
    });

    // Sweep line: "the response time a given share of requests stays under".
    A.setOpacity(s.sweep, swOn);
    s.sweep.setAttribute("transform", `translate(${s.xOf(swMs).toFixed(1)},0)`);
    s.sweepTxt.textContent = `${Math.floor(s.shareUnder(swMs) * 100)}% are faster`; // floor: never overstate

    // Markers. Positions come straight from numbers (before/after), never recomputed.
    const tP50 = k.word("compare", "112") - 0.15;                 // 111 → 112 as "112" is said
    const tMean = k.word("compare", "mean"), tRise = k.word("compare", "rises");
    const tP95 = tRise + 0.1;                                     // p95 drifts with "rises only a little" (never spoken)
    const tJump = k.word(iJump, "1,473") - 0.05, JD = 1.1;       // leaves on "to" (audible ≈ 49.18; its stamp is early), counts up through "1,473"
    const pos = (b, a, t0, d) => U.lerp(s.xOf(b), s.xOf(a), A.prog(t, t0, d, A.E.inOutCubic));
    const place = (m, x, tLine, tLab) => {
      m.g.setAttribute("transform", `translate(${x.toFixed(1)},0)`);
      A.draw(m.line, t, tLine, 0.5);
      A.show(m.lab, t, tLab, { dy: 10, d: 0.45 });
    };
    // p50: line on "median", label on "p50"; p95 / p99: both on their name.
    place(s.m50, pos(B.p50, Af.p50, tP50, 0.6), k.word("p50", "median"), wd("p50", "P-50", "p50") - 0.05);
    const w95 = k.word("p95", "p95"), w99 = k.word("p99", "p99");
    place(s.m95, pos(B.p95, Af.p95, tP95, 0.7), w95, w95 + 0.1);
    place(s.m99, pos(B.p99, Af.p99, tJump, JD), w99, w99 + 0.1);

    // Tail bracket (on "tail"; the gloss on "slowest"; fades when the pauses arrive).
    A.show(s.tail, t, tTail + 0.1, { dy: 10, out: L[iPause].start + 0.1 });
    A.setOpacity(s.tailSub, A.prog(t, k.word(iTail, "slowest") - 0.05, 0.45));

    // Pauses: broken axis region appears on "long pauses", dots fly to it.
    A.show(s.paxis, t, k.word("pauses", "long") - 0.1, { dy: 0, d: 0.5 });
    // Arc stays under the p50/p95/p99 label row: start ≥ YT, true apex yA ≥ YT (quadratic min = yA for this cy),
    // and the control point sits early so the descent glides in under the "20 requests / just 2%" labels.
    const YT = s.BASE - s.PH + 12;
    s.dest.forEach((d, j) => {
      const p = fly[j];
      const y0 = Math.max(s.BASE - s.binsN[d.b0] * s.cpx - 14, YT);
      const yA = Math.max(YT, Math.min(y0, d.y1) - 120);
      const cx = d.x0 + 0.4 * (d.x1 - d.x0), cy = yA - Math.sqrt((y0 - yA) * (d.y1 - yA));
      const x = (1 - p) * (1 - p) * d.x0 + 2 * (1 - p) * p * cx + p * p * d.x1;
      const y = (1 - p) * (1 - p) * y0 + 2 * (1 - p) * p * cy + p * p * d.y1;
      s.dots[j].setAttribute("cx", x.toFixed(1)); s.dots[j].setAttribute("cy", y.toFixed(1));
      A.setOpacity(s.dots[j], A.prog(t, tFly + j * 0.06, 0.2));
    });
    const tRange = k.word("pauses", "0.8") - 0.05;
    A.show(s.pl1, t, k.word("pauses", "20") - 0.05, { dy: 10 });
    A.show(s.pl2, t, k.word("pauses", "just") - 0.05, { dy: 10 });
    A.show(s.pl3, t, tRange, { dy: 10 });
    A.show(s.pkey, t, tRange + 0.4, { dy: 10 });

    // Readout tiles.
    const T = {}; s.tiles.forEach((x) => (T[x.key] = x));
    const tTake = k.word(iTake, "averages");
    const tile = (x, tIn, tVal, before, after, tUpd, dUpd = 0.6, max = 1) => {
      A.show(x.n, t, tIn, { dy: 14, max });
      const v = Math.round(U.lerp(before, after, A.prog(t, tUpd, dUpd, A.E.inOutCubic)));
      x.v.textContent = U.fmt(v);
      A.setOpacity(x.vrow, A.prog(t, tVal, 0.4));
      x.was.textContent = `was ${U.fmt(before)} ms`;
      A.setOpacity(x.was, A.prog(t, tUpd, 0.4));
    };
    // Each tile lands complete when its number is spoken (p95's value is never spoken: it lands on "95 out of 100").
    const t50 = k.word("p50", "111") - 0.1, t95 = k.word("p95", "95") - 0.05, t99 = k.word("p99", "234") - 0.1;
    tile(T.p50, t50, t50, B.p50, Af.p50, tP50, 0.4);
    // Mean lands on "mean" (compare line) showing 117, then rolls to 144 on "rises only a little".
    tile(T.mean, tMean - 0.05, tMean - 0.05, B.mean, Af.mean, tRise, 0.8, 1 - 0.45 * A.prog(t, tTake, 0.6));
    tile(T.p95, t95, t95, B.p95, Af.p95, tP95, 0.7);
    tile(T.p99, t99, t99, B.p99, Af.p99, tJump, JD);
    // p99 tile lights up on "But p99 jumps…"; its value turns red once the jump is under way.
    const hot = A.prog(t, k.word(iJump, "p99") - 0.05, 0.6);
    T.p99.n.style.background = `color-mix(in srgb, ${C.bad} ${(4 + 14 * hot).toFixed(1)}%, ${C.surface})`;
    T.p99.n.style.borderColor = `color-mix(in srgb, ${C.bad} ${(60 + 40 * hot).toFixed(1)}%, transparent)`;
    T.p99.v.style.color = A.prog(t, tJump, JD) > 0.3 ? C.bad : C.ink;

    // Takeaway.
    A.show(s.take1, t, tTake, { dy: 12 });
    A.show(s.take2, t, k.word(iTake, "high") - 0.05, { dy: 12 });
  },
});
