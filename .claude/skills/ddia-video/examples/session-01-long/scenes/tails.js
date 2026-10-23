// S17 — Why the tail matters: Amazon's historical p99.9 target (1,000-dot grid, one slow request), who is in the tail
// (customers with the most data), percentile targets in an example SLA, and why Amazon stopped short of p99.99.
R.scene("tails", {
  build(root, k) {
    const s = {};
    const C = K.C;
    const hexMix = (a, b, p) => "#" + [0, 2, 4].map((j) => Math.round(U.lerp(parseInt(a.slice(1 + j, 3 + j), 16), parseInt(b.slice(1 + j, 3 + j), 16), p)).toString(16).padStart(2, "0")).join("");
    s.hexMix = hexMix;
    const prevDisp = root.style.display; root.style.display = "block"; // allow measuring text in build

    s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Why the tail matters" });

    // Cards first, so the SVG layer (bars, dots, marks, connector) sits on top of them.
    const LX = 120, LY = 250, LW = 800, LH = 670;   // Amazon (left, tall)
    const RX = 980, RW = 820, TY = 250, TH = 400;   // who is in the tail (right top)
    const SY = 690, SH = 230;                       // example SLA (right bottom)
    s.amz = K.card(root, { x: LX, y: LY, w: LW, h: LH, title: "Amazon", accent: "sca" });
    s.who = K.card(root, { x: RX, y: TY, w: RW, h: TH, title: "Who is in the tail?", accent: "sca" });
    s.sla = K.card(root, { x: RX, y: SY, w: RW, h: SH, title: "SLA", accent: "sca" });

    // ---- Left card: Amazon (historical) — p99.9.
    s.amzBadge = K.badge(root, { x: 0, y: LY + 30, text: "Historical example" });
    s.amzBadge.style.left = LX + LW - 34 - s.amzBadge.offsetWidth + "px";
    s.amzBody = K.text(root, { x: LX + 34, y: LY + 80, cls: "body", text: "Internal service targets in terms of", color: "muted" });
    s.p999 = K.text(root, { x: LX + 30, y: LY + 138, cls: "big-num", text: "p99.9", color: "sca" });
    s.p999.style.fontSize = "120px";
    s.p999sub = K.text(root, { x: LX + 420, y: LY + 152, w: 340, cls: "body", html: `<b style="color:${C.ink}">999 of 1,000</b><br><span style="color:${C.muted}">requests faster</span>` });

    const svg = K.svgLayer(root);
    // 1,000-dot grid: one request in a thousand is slower.
    const GX = LX + 34, GY = LY + 272, COLS = 50, ROWS = 20, PITCH = 12;
    s.grid = U.sv("g", {}, svg);
    const dotFill = hexMix(C.bg, C.sca, 0.5);
    s.SLOW = { c: COLS - 1, r: 9 };
    s.gcols = [];
    for (let c = 0; c < COLS; c++) {
      const g = U.sv("g", {}, s.grid);
      for (let r = 0; r < ROWS; r++) {
        if (c === s.SLOW.c && r === s.SLOW.r) continue;
        U.sv("circle", { cx: GX + c * PITCH + PITCH / 2, cy: GY + r * PITCH + PITCH / 2, r: 3.8, fill: dotFill }, g);
      }
      s.gcols.push(g);
    }
    const sx = GX + s.SLOW.c * PITCH + PITCH / 2, sy = GY + s.SLOW.r * PITCH + PITCH / 2;
    s.slowG = U.sv("g", { transform: `translate(${sx},${sy})` }, svg);
    s.slowIn = U.sv("g", {}, s.slowG);
    s.slowRing = U.sv("circle", { cx: 0, cy: 0, r: 15, fill: "none", stroke: C.bad, "stroke-width": 3 }, s.slowIn);
    U.sv("circle", { cx: 0, cy: 0, r: 7.5, fill: C.bad }, s.slowIn);
    s.gridLbl = K.text(root, { x: GX, y: GY + ROWS * PITCH + 10, cls: "small", text: "1,000 requests" });
    s.slowLbl = K.text(root, { x: GX, y: GY + ROWS * PITCH + 10, cls: "small", html: `<span style="color:${C.bad};font-weight:700">● 1 slower request</span> in every 1,000` });

    // p99.99 row at the bottom of the Amazon card.
    const DY = LY + LH - 98;
    s.div = U.sv("line", { x1: LX + 34, x2: LX + LW - 34, y1: DY, y2: DY, stroke: C.line2, "stroke-width": 2 }, svg);
    s.p9999 = K.text(root, { x: LX + 34, y: DY + 20, cls: "label", text: "p99.99", color: "muted" });
    Object.assign(s.p9999.style, { fontSize: "56px", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: "1" });
    const w9999 = s.p9999.offsetWidth;
    s.strike = U.sv("path", { d: `M${LX + 30},${DY + 48} L${LX + 38 + w9999},${DY + 48}`, fill: "none", stroke: C.bad, "stroke-width": 5, "stroke-linecap": "round" }, svg);
    s.costly = K.text(root, { x: LX + 34 + w9999 + 36, y: DY + 12, cls: "label", text: "Cost outweighed the benefit", color: "ink" });
    s.costly.style.fontSize = "32px";
    s.dimin = K.text(root, { x: LX + 34 + w9999 + 36, y: DY + 52, cls: "small", text: "diminishing returns" });

    // ---- Right top card: who is in the tail? (illustration)
    s.whoBadge = K.badge(root, { x: 0, y: TY + 30, text: "Illustration", tone: "muted" });
    s.whoBadge.style.left = RX + RW - 34 - s.whoBadge.offsetWidth + "px";
    const DX = RX + 110, RSX = RX + 420;
    s.hData = K.text(root, { x: DX, y: TY + 92, cls: "small", text: "Data stored" });
    s.hResp = K.text(root, { x: RSX, y: TY + 92, cls: "small", text: "Response time" });
    const rows = [{ d: 46, r: 84 }, { d: 120, r: 150 }, { d: 270, r: 360 }];
    const barData = hexMix(C.bg, C.ink, 0.38), barResp = hexMix(C.bg, C.sca, 0.5);
    s.rows = rows.map((rw, i) => {
      const cy = TY + 160 + i * 58;
      const g = U.sv("g", {}, svg);
      const ic = K.svgIcon(g, "user", { x: RX + 36, y: cy - 24, size: 48, color: "muted" });
      const db = U.sv("rect", { x: DX, y: cy - 16, width: rw.d, height: 32, rx: 6, fill: barData }, g);
      const rb = U.sv("rect", { x: RSX, y: cy - 16, width: rw.r, height: 32, rx: 6, fill: barResp }, g);
      return { g, ic, db, rb, d: rw.d, r: rw.r };
    });
    s.barData = barData; s.barResp = barResp;
    s.valuable = K.text(root, { x: RX + 34, y: TY + TH - 66, cls: "label", html: `${K.iconSvg("star", 34, C.hl, 3.5)}<span style="vertical-align:6px;margin-left:12px">Most data <span style="color:${C.muted}">→</span> slowest <span style="color:${C.muted}">→</span> <span style="color:${C.hl}">often the most valuable</span></span>` });

    // Connector: the slow request belongs to the customer with the most data.
    const ry = TY + 160 + 2 * 58;
    s.link = U.sv("path", { d: `M${sx + 16},${sy} C${sx + 130},${sy} ${RX - 110},${ry} ${RX - 6},${ry}`, fill: "none", stroke: C.bad, "stroke-width": 3.5, "stroke-linecap": "round" }, svg);
    s.linkEnd = U.sv("circle", { cx: RX - 6, cy: ry, r: 6, fill: C.bad }, svg);

    // ---- Right bottom card: percentile targets in an SLA, with the book's example values (badge: "Example").
    s.sla.querySelector(".k-card-title").innerHTML = `SLA <span style="font-size:28px;font-weight:600;color:${C.muted};letter-spacing:0"> service level agreement</span>`;
    s.slaBadge = K.badge(root, { x: 0, y: SY + 30, text: "Example" });
    s.slaBadge.style.left = RX + RW - 34 - s.slaBadge.offsetWidth + "px";
    // Each row: target name (lands as it is spoken) + its bound and check mark (land on the number).
    s.slaRows = [["Median", "< 200 ms"], ["p99", "< 1 s"]].map(([a, b], i) => {
      const y = SY + 96 + i * 64;
      const m = K.mark(svg, "check", { x: RX + 56, y: y + 24, size: 40 });
      const tx = K.text(root, { x: RX + 92, y, cls: "label", text: a, color: "ink" });
      tx.style.fontSize = "40px"; tx.style.fontWeight = 750;
      const val = K.text(root, { x: RX + 92 + tx.offsetWidth + 8, y, cls: "label", text: b, color: "sca" });
      val.style.fontSize = "40px"; val.style.fontWeight = 750;
      return { m, tx, val };
    });

    root.style.display = prevDisp;
    return s;
  },

  update(t, k, s) {
    const C = K.C, L = k.lines;
    const iV = L.findIndex((l) => l.cue === "valuable"), iS = L.findIndex((l) => l.cue === "sla");
    const iH = iS + 1; // "Why not go higher? At p99.99, Amazon judged the cost outweighed the benefit." (no cue)

    A.show(s.title, t, 0.1);

    // Amazon card builds with the sentence; the "Historical example" badge lands on "historically".
    A.show(s.amz, t, k.word("amazon", "Amazon") - 0.05, { dy: 16 });
    A.show(s.amzBadge, t, k.word("amazon", "historically") - 0.05, { dy: 10 });
    A.show(s.amzBody, t, k.word("amazon", "internal") - 0.05, { dy: 10 });
    const tP = k.word("amazon", "p99.9");
    A.show(s.p999, t, tP, { dy: 16, s0: 0.96 });
    A.show(s.p999sub, t, tP + 0.35, { dy: 12 });
    // Then the 1,000 requests it implies sweep in, and the one slower request pops (just before "Slow requests…").
    const tGrid = tP + 0.3;
    s.gcols.forEach((g, c) => A.setOpacity(g, A.prog(t, tGrid + c * 0.02, 0.35)));
    const tSlow = tGrid + 0.95;
    A.show(s.slowIn, t, tSlow, { dy: 0, s0: 0.2, d: 0.5, ease: A.E.outBack });
    A.setOpacity(s.gridLbl, 0); // superseded by slowLbl (the sweep is too short for two captions in a row)
    A.show(s.slowLbl, t, tSlow + 0.3, { dy: 10 });

    // Valuable: the card summarises the line (lands at its start); rows on "customers"; the heaviest customer lights up
    // and the slow request links to it on "most data".
    const cV = k.cue("valuable"), tRows = k.word(iV, "customers") - 0.1, tHeavy = k.word(iV, "most data");
    s.link.style.opacity = 1;
    A.draw(s.link, t, tHeavy - 0.1, 0.7);
    A.setOpacity(s.linkEnd, A.prog(t, tHeavy + 0.5, 0.2));
    A.show(s.who, t, cV + 0.3, { dy: 16 });
    A.show(s.whoBadge, t, cV + 0.5, { dy: 10 });
    const tHead = k.word(iV, "often");
    A.show(s.hData, t, tHead, { dy: 8 });
    A.show(s.hResp, t, tHead, { dy: 8 });
    const heavy = A.prog(t, tHeavy, 0.5);
    s.rows.forEach((r, i) => {
      const t0 = tRows + i * 0.18;
      A.setOpacity(r.g, A.prog(t, t0, 0.3));
      r.db.setAttribute("width", Math.max(0.1, r.d * A.prog(t, t0 + 0.1, 0.5)).toFixed(1));
      r.rb.setAttribute("width", Math.max(0.1, r.r * A.prog(t, t0 + 0.3, 0.6)).toFixed(1));
      if (i === 2) {
        r.rb.setAttribute("fill", s.hexMix(s.barResp, C.bad, heavy));
        r.db.setAttribute("fill", s.hexMix(s.barData, C.hl, heavy));
        r.ic.ig.setAttribute("stroke", s.hexMix(C.muted, C.hl, heavy));
      }
    });
    A.show(s.valuable, t, k.word(iV, "the most valuable") + 0.1, { dy: 10 });

    // SLA: card on "service level agreements", badge on "For example", then each target as it is spoken.
    // Whisper stamps run early in the second half of this line (audio onsets: "median" and "two hundred" ≈ +0.4 s,
    // "p ninety-nine" ≈ +0.25 s after their stamps; "one second" follows "under" by ≈ 0.25 s). The offsets compensate.
    A.show(s.sla, t, k.word(iS, "service") - 0.1, { dy: 16 });
    A.show(s.slaBadge, t, k.word(iS, "example") - 0.05, { dy: 10 });
    const slaT = [
      [k.word(iS, "median") + 0.4, k.word(iS, "200") + 0.4],
      [k.word(iS, "p99") + 0.25, k.word(iS, "under", 1) + 0.25],
    ];
    slaT.forEach(([tName, tVal], i) => {
      const r = s.slaRows[i];
      A.show(r.tx, t, tName, { dy: 10 });
      A.show(r.val, t, tVal, { dy: 10 });
      A.show(r.m.inner, t, tVal, { dy: 0, s0: 0.3, d: 0.45, ease: A.E.outBack });
    });

    // Why not higher? p99.99 lands on its word; struck through on "the cost outweighed the benefit".
    const t99 = k.word(iH, "p99.99") + 0.05;
    A.setOpacity(s.div, A.prog(t, L[iH].start + 0.1, 0.4));
    A.show(s.p9999, t, t99, { dy: 12 });
    const tCost = k.word(iH, "cost") - 0.05;
    A.draw(s.strike, t, tCost, 0.4);
    A.show(s.costly, t, tCost + 0.05, { dy: 10 });
    A.show(s.dimin, t, k.word(iH, "benefit"), { dy: 10 });
  },
});
