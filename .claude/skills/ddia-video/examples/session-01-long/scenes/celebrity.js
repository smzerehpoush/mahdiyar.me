// S13 — The celebrity problem. Average fan-out cost (4,600 × 75 ≈ 345,000 insertions/s), one celebrity tweet that floods
// 30,000,000 timelines and does not fit on the chart, then the long-tail distribution of followers per account ("That's skew").
// Every beat is anchored to the spoken word (k.word).
R.scene("celebrity", {
  build(root, k) {
    const s = {}, C = K.C;
    s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Writes aren't free." });
    s.badge = K.badge(root, { right: 120, y: 52, text: "Twitter, circa 2012" }); // same spot as in the twitter scene (pinned top-right)

    // ---- Beat `multiply` / `result`: the equation (HTML flex row so the operators sit between the terms).
    s.eq = U.el("div", { style: { position: "absolute", left: "120px", top: "232px", display: "flex", alignItems: "flex-start", gap: "34px" } }, root);
    const term = (num, sub, color) => {
      const col = U.el("div", { style: { position: "relative", display: "flex", flexDirection: "column", alignItems: "center" } }, s.eq);
      const n = U.el("div", { class: "k-text", style: { position: "relative", fontSize: "112px", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: "1", color, fontVariantNumeric: "tabular-nums" } }, col, num);
      U.el("div", { class: "k-text small", style: { position: "relative", marginTop: "14px", fontSize: "28px", whiteSpace: "nowrap" } }, col, sub);
      return { col, n };
    };
    const op = (ch) => U.el("div", { class: "k-text", style: { position: "relative", fontSize: "84px", fontWeight: 600, lineHeight: "1.3", color: C.faint } }, s.eq, ch);
    s.tTweets = term("4,600", "tweets / s (avg)", C.ink);
    s.opMul = op("×");
    s.tFollow = term("75", "followers each (avg)", C.ink);
    s.opEq = op("≈");
    s.tResult = term("345,000", "timeline insertions / s", C.sca);

    const svg = K.svgLayer(root);
    s.rows = U.sv("g", {}, svg);
    // Runtime quirk: tokens.css gives every SVG node `transform-box: fill-box; transform-origin: center`, so the box icon's
    // `scale()` attribute scales about the icon's own centre and shifts it ~10 px. Restore plain SVG transform semantics
    // (same workaround as the twitter scene).
    const fixIcon = (b) => { if (b.icon) { b.icon.style.transformBox = "view-box"; b.icon.style.transformOrigin = "0 0"; } return b; };
    const grid = (parent, x0, y0, cols) => {
      const cells = [];
      for (let c = 0; c < cols; c++) for (let r = 0; r < 5; r++) cells.push({ c, r, n: U.sv("rect", { x: x0 + c * 24, y: y0 + r * 24, width: 18, height: 18, rx: 4 }, parent) });
      return cells;
    };

    // ---- Row 1: an average tweet is copied into 75 follower timelines (one cell = one insertion). 75 is a per-tweet mean.
    s.avgBox = fixIcon(K.box(s.rows, { x: 120, y: 458, w: 350, h: 124, label: "Average tweet", sub: "75 followers", icon: "tweet", iconInline: true, fs: 34 }));
    s.a1 = K.arrow(s.rows, { from: [470, 520], to: [536, 520], gapStart: 10, gapEnd: 6, width: 3 });
    s.cells1G = U.sv("g", {}, s.rows);
    s.cells1 = grid(s.cells1G, 540, 463, 15);
    s.bar1 = U.sv("rect", { x: 540, y: 480, width: 75 * 4.8, height: 80, rx: 8, fill: C.sca }, s.rows);
    s.val1 = K.label(s.rows, { x: 920, y: 532, text: "75 insertions", anchor: "start", size: 34, weight: 750, fill: "sca" });

    // ---- Row 2: a celebrity's tweet floods 30,000,000 timelines — off the edge of the frame.
    s.celBox = fixIcon(K.box(s.rows, { x: 120, y: 652, w: 350, h: 124, label: "Celebrity tweet", sub: "30M+ followers", icon: "star", iconInline: true, fs: 34, tone: "hl" }));
    s.a2 = K.arrow(s.rows, { from: [470, 714], to: [536, 714], gapStart: 10, gapEnd: 6, width: 3, tone: "hl" });
    s.cells2G = U.sv("g", {}, s.rows);
    s.cells2 = grid(s.cells2G, 540, 657, 58);
    s.bar2 = U.sv("rect", { x: 540, y: 674, width: 0, height: 80, rx: 8, fill: C.sca }, s.rows);
    s.cut2 = U.sv("polygon", { points: "1583,664 1601,664 1587,764 1569,764", fill: C.bg }, s.rows);
    s.tip2 = U.sv("polygon", { points: "1718,660 1786,714 1718,768", fill: C.sca }, s.rows);
    s.val2 = K.label(s.rows, { x: 1545, y: 727, text: "30,000,000 insertions", anchor: "end", size: 36, weight: 800, fill: "#0F1B2D" });

    // ---- Beat `bars`: the chart frame (axis 0–200, broken at the right edge).
    s.axis = U.sv("g", {}, s.rows);
    s.axisInner = U.sv("g", {}, s.axis);
    U.sv("path", { d: "M540,800 H1578", stroke: C.line2, "stroke-width": 3, fill: "none" }, s.axisInner);
    U.sv("path", { d: "M1570,814 L1584,786 M1584,814 L1598,786", stroke: C.muted, "stroke-width": 3, fill: "none", "stroke-linecap": "round" }, s.axisInner);
    [0, 50, 100, 150, 200].forEach((v) => {
      const x = 540 + v * 4.8;
      U.sv("path", { d: `M${x},800 v10`, stroke: C.line2, "stroke-width": 3 }, s.axisInner);
      K.label(s.axisInner, { x, y: 840, text: String(v), size: 26, weight: 600, fill: "muted", mono: true });
    });
    K.label(s.axisInner, { x: 1060, y: 884, text: "timeline insertions per tweet", size: 28, weight: 600, fill: "muted" });

    // Overlays for `oneTweet` (HTML on top of the flood).
    s.pill1 = K.pill(root, { x: 860, y: 682, text: "One tweet → 30,000,000 insertions", tone: "sca" });
    // The delivery goal builds in two parts with the voice: "aimed to deliver tweets to followers" … "within about five seconds".
    [s.goalA, s.goalB] = K.chips(root, { x: 540, y: 794, w: 1260, accent: "hl", items: [
      { text: "Goal: deliver to followers", icon: "users" },
      { text: "within ~5 s", icon: "clock" },
    ] }).chips;
    s.goalA.style.background = C.bg2; s.goalB.style.background = C.bg2;

    // ---- Beat `distribution`: long-tail histogram of followers per account (log-scale buckets; illustrative shape).
    s.hist = U.sv("g", {}, svg);
    const HX = 200, BW = 195, HB = 790, HH = 450;
    s.HX = HX; s.BW = BW;
    const shape = [1, 0.84, 0.43, 0.15, 0.05, 0.016, 0.006, 0.002];
    s.hAxis = U.sv("g", {}, s.hist);
    U.sv("path", { d: `M${HX},${HB} H${HX + 8 * BW}`, stroke: C.line2, "stroke-width": 3, fill: "none" }, s.hAxis);
    ["1", "10", "100", "1k", "10k", "100k", "1M", "10M", "100M"].forEach((lb, i) => {
      U.sv("path", { d: `M${HX + i * BW},${HB} v10`, stroke: C.line2, "stroke-width": 3 }, s.hAxis);
      K.label(s.hAxis, { x: HX + i * BW, y: HB + 40, text: lb, size: 26, weight: 600, fill: "muted", mono: true });
    });
    K.label(s.hAxis, { x: HX + 4 * BW, y: HB + 86, text: "followers per account (log scale)", size: 28, weight: 600, fill: "muted" });
    s.yTitle = K.label(s.hAxis, { x: 0, y: 0, text: "accounts", size: 28, weight: 600, fill: "muted" });
    s.yTitle.g.setAttribute("transform", `translate(${HX - 34},${HB - HH / 2}) rotate(-90)`);
    K.label(s.hAxis, { x: HX + 8 * BW, y: HB + 86, text: "Simplified illustration", anchor: "end", size: 26, weight: 600, fill: "muted" });
    s.hbars = shape.map((f, i) => {
      const h = Math.max(8, f * HH);
      const r = U.sv("rect", { x: HX + i * BW + 8, y: HB - h, width: BW - 16, height: h, rx: 6, fill: C.line2 }, s.hist);
      r.style.transformOrigin = "bottom"; r.style.transformBox = "fill-box";
      return r;
    });
    // "Most accounts" bracket over the first three buckets.
    s.most = U.sv("g", {}, s.hist);
    s.mostInner = U.sv("g", {}, s.most);
    U.sv("path", { d: `M${HX + 8},336 V322 H${HX + 3 * BW - 8} V336`, stroke: C.ink, "stroke-width": 3, fill: "none", "stroke-linejoin": "round" }, s.mostInner);
    K.label(s.mostInner, { x: HX + 8, y: 302, text: "Most accounts: modest followings", anchor: "start", size: 30, weight: 750, fill: "ink" });
    // Tail callout ("a tiny few" … "have enormous ones").
    s.tail = U.sv("g", {}, s.hist);
    s.tailA = U.sv("g", {}, s.tail);
    s.tailB = U.sv("g", {}, s.tail);
    const tx = HX + 7 * BW;
    K.label(s.tailA, { x: tx, y: 650, text: "A tiny few:", size: 32, weight: 750, fill: "sca" });
    K.label(s.tailB, { x: tx, y: 690, text: "enormous followings", size: 32, weight: 750, fill: "sca" });
    s.tailArrow = K.arrow(s.tailB, { from: [tx, 708], to: [tx, 770], tone: "sca", width: 3 });
    // Runtime quirk: the global `svg * { transform-origin: center }` rule rotates arrow heads about their own centre, which
    // shifts heads on non-horizontal arrows. Pin the origin to (0,0) so the head sits on the tip.
    s.tailArrow.head.style.transformBox = "view-box"; s.tailArrow.head.style.transformOrigin = "0 0";
    // Average marker.
    const ax = HX + Math.log10(75) * BW;
    s.avg = U.sv("g", {}, s.hist);
    s.avgInner = U.sv("g", {}, s.avg);
    U.sv("path", { d: `M${ax},350 V${HB}`, stroke: C.hl, "stroke-width": 3, "stroke-dasharray": "8 8", fill: "none" }, s.avgInner);
    K.label(s.avgInner, { x: ax + 14, y: 376, text: "avg per tweet: 75", anchor: "start", size: 30, weight: 750, fill: "hl" });

    // "That's skew." — names the shape (same chip language as the load-parameter chips in sca-intro).
    s.skew = K.chips(root, { x: tx - 200, y: 538, w: 400, justify: "center", accent: "sca", size: 32, items: [{ text: "Skew", icon: "chart" }] }).chips[0];

    // Takeaway (last line).
    s.take = K.card(root, { x: 1000, y: 330, w: 760, accent: "sca", title: "The distribution matters,", body: "<span style='font-size:40px;color:#E9EEF5;font-weight:650'>not just the average.</span>" });
    s.take.querySelector(".k-card-title").style.fontSize = "48px";
    return s;
  },

  update(t, k, s) {
    const C = K.C;
    const cM = k.cue("multiply"), cC = k.cue("celebrity"), cO = k.cue("oneTweet"), cB = k.cue("bars"), cD = k.cue("distribution");
    const iL = k.lineIndex("distribution") + 1; // "…isn't just the average. It's the distribution of followers."

    A.show(s.title, t, cM); // "But writes aren't free" opens the scene
    A.setOpacity(s.badge, 1); // pinned: no entrance, so it stays put across the Twitter scenes

    // Phase out everything from the first beats as the distribution line starts.
    const gone = 1 - A.prog(t, cD + 0.1, 0.35, A.E.inOutCubic);

    // ---- Equation. Terms land on the spoken words: "4,600 …", "times …", "75", "about" (≈), "345,000".
    const w46 = k.word("multiply", "4,600"), wTimes = k.word("multiply", "times"), w75 = k.word("multiply", "75"), wFol = k.word("multiply", "followers");
    const wAbout = k.word("result", "about"), w345 = k.word("result", "345,000"), wTl = k.word("result", "timeline"), wIns = k.word("result", "insertions");
    const eqDim = (1 - 0.55 * A.prog(t, cC, 0.6)) * gone;
    s.eq.style.opacity = eqDim.toFixed(4);
    s.eq.style.visibility = eqDim <= 0.002 ? "hidden" : "visible";
    A.show(s.tTweets.col, t, w46 - 0.05, { dy: 18 });
    A.show(s.opMul, t, wTimes - 0.05, { dy: 0, s0: 0.6 });
    A.show(s.tFollow.col, t, w75 - 0.05, { dy: 18 });
    A.show(s.opEq, t, wAbout, { dy: 0, s0: 0.6 });
    A.show(s.tResult.col, t, w345 - 0.05, { dy: 18 });
    // The counter rolls up while "three hundred forty-five thousand" is spoken and settles as the number ends.
    const v = A.tween(t, w345 - 0.05, Math.max(0.6, wTl - w345), 0, 345000, A.E.outCubic);
    s.tResult.n.textContent = U.fmt(Math.round(v / 100) * 100);

    s.rows.style.opacity = gone.toFixed(4);
    s.rows.style.visibility = gone <= 0.002 ? "hidden" : "visible";

    // ---- Row 1: on "75", one average tweet; its 75 copies fill in on "followers each"; "insertions" labels the row.
    A.show(s.avgBox.inner, t, w75, { dy: 14 });
    s.a1.draw(t, w75 + 0.2, 0.35);
    const toBar1 = A.prog(t, k.word("bars", "average"), 0.6);
    A.setOpacity(s.cells1G, A.prog(t, w75 + 0.1, 0.4) * (1 - toBar1));
    // While "345,000 … every second" is on screen, a highlight keeps sweeping through the 75 copies (continuous inserts).
    const shimmer = A.win(t, w345 + 0.5, cC + 0.3, 0.4);
    s.cells1.forEach((cell, i) => {
      const td = wFol - 0.2 + (i / 74) * 1.2;
      const a = A.prog(t, td, 0.12), b = A.prog(t, td + 0.1, 0.45);
      const ph = ((((t - w345) * 0.9 - cell.c * 0.04) % 1) + 1) % 1;
      const flash = (ph < 0.2 ? 1 - ph / 0.2 : 0) * shimmer;
      cell.n.setAttribute("fill", a <= 0 ? C.bg2 : A.mix(C.hl, C.sca, b * (1 - 0.85 * flash)));
      cell.n.setAttribute("stroke", a <= 0 ? C.line2 : "none");
      cell.n.setAttribute("stroke-width", 2);
    });
    A.setOpacity(s.bar1, toBar1);
    A.show(s.val1.inner, t, wIns, { dy: 0, dx: -12 });

    // ---- Row 2: the celebrity ("add a celebrity" → box; "over 30 million followers" → its follower count).
    A.show(s.celBox.inner, t, k.word("celebrity", "celebrity") - 0.05, { dy: 14 });
    A.setOpacity(s.celBox.sub, A.prog(t, k.word("celebrity", "30 million") - 0.05, 0.5));
    // "One tweet from them meant 30 million insertions": arrow on "one tweet", flood on "meant", the number on "30 million".
    const wMeant = k.word("oneTweet", "meant"), w30 = k.word("oneTweet", "30 million");
    s.a2.draw(t, cO + 0.1, 0.35);
    const g2 = A.prog(t, k.word("bars", "bar") - 0.1, 0.7, A.E.inOutCubic);
    const dim2 = (1 - 0.82 * A.prog(t, cB + 0.4, 0.6)) * (1 - g2);
    A.setOpacity(s.cells2G, dim2);
    s.cells2.forEach((cell) => {
      const td = wMeant + 1.15 * Math.sqrt(cell.c / 57) + cell.r * 0.02;
      const a = A.prog(t, td, 0.12), b = A.prog(t, td + 0.1, 0.45);
      cell.n.style.opacity = a.toFixed(3);
      cell.n.setAttribute("fill", A.mix(C.hl, C.sca, b));
    });
    A.show(s.pill1, t, w30 - 0.05, { dy: 12, out: cB + 0.1 });
    A.show(s.goalA, t, k.word("oneTweet", "aimed") - 0.05, { dy: 12, out: cB + 0.1 });
    A.show(s.goalB, t, k.word("oneTweet", "five") - 0.1, { dy: 12, out: cB + 0.1 });

    // ---- Beat `bars`: axis appears, the average collapses into a bar on "average"; the celebrity bar grows straight off the
    // chart on "that bar runs off the chart".
    A.show(s.axisInner, t, cB + 0.45, { dy: 10 });
    const w2 = g2 * (1718 - 540);
    s.bar2.setAttribute("width", w2.toFixed(1));
    A.setOpacity(s.bar2, g2 > 0 ? 1 : 0);
    A.setOpacity(s.cut2, U.clamp((540 + w2 - 1600) / 30));
    A.setOpacity(s.tip2, U.clamp((540 + w2 - 1700) / 16));
    A.show(s.val2.inner, t, k.word("bars", "bar") + 0.4, { dy: 0, dx: -16 }); // once the bar is under the label

    // ---- Beat `distribution`: histogram builds; "modest followings" labels the bulk; "a tiny few" lights the tail;
    // "enormous ones" points at it; "That's skew" names it.
    const wModest = k.word("distribution", "modest"), wTiny = k.word("distribution", "tiny few"), wEnorm = k.word("distribution", "enormous");
    const hOn = A.prog(t, cD + 0.35, 0.5);
    A.setOpacity(s.hist, hOn);
    A.show(s.hAxis, t, cD + 0.35, { dy: 0 });
    const tailOn = A.prog(t, wTiny - 0.05, 0.5);
    s.hbars.forEach((r, i) => {
      const g = A.prog(t, cD + 0.45 + i * 0.12, 0.7);
      r.style.transform = `scaleY(${g.toFixed(4)})`;
      r.setAttribute("fill", i >= 6 ? A.mix(C.line2, C.sca, tailOn) : A.mix(C.line2, C.muted, 0.45 * A.prog(t, wModest, 0.5) * (i < 3 ? 1 : 0)));
    });
    A.show(s.mostInner, t, wModest, { dy: 10 });
    A.show(s.tailA, t, wTiny - 0.05, { dy: -10 });
    A.show(s.tailB, t, wEnorm - 0.05, { dy: -10 });
    s.tailArrow.draw(t, wEnorm + 0.1, 0.4);
    A.show(s.skew, t, k.word("distribution", "skew") - 0.1, { dy: 10, s0: 0.92 });
    // Last line: "isn't just the average" → the average marker; "It's the distribution" → the takeaway.
    A.show(s.avgInner, t, k.word(iL, "average") - 0.05, { dy: 0 });
    A.show(s.take, t, k.word(iL, "distribution") - 0.05, { dy: 14, s0: 0.97 });
  },
});
