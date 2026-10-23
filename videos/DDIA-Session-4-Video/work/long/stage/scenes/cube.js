// S21 — Data cube. A 4×3 grid (Jun 1–4 × Acme/Bolt/Cora, SUM(amount) in $ thousands, window.DATA.cube) fills in; "Simplified
// illustration" badge. `totals`: a row sweep → day totals, a column sweep → merchant totals, grand total 700 on "seven hundred thousand".
// `more`: numbers/headers/totals fade and the grid extrudes into a 3-D cube silhouette (third axis "method"); dimension chips on the
// right reach five → "5 dimensions → 5-D hypercube". `fast`: back to the grid; query card "Bolt, all days" → the Bolt total 255 lights
// up as a single lookup. `rigid`: "Payments over $100?" → red ✕ "amount isn't a dimension". `raw`: chip "Keep raw data · cubes are a speed-up".
(function () {
  const C = K.C;
  const LX = 262;                                  // right edge of the date labels
  const CX0 = 290, CW = 160, CG = 10;              // cell columns
  const RY0 = 345, CH = 92, RG = 8;                // cell rows
  const TX = CX0 + 3 * (CW + CG) + 18;             // totals column x
  const colX = (j) => CX0 + j * (CW + CG);
  const rowY = (i) => RY0 + i * (CH + RG);
  const TY = rowY(4) + 18;                          // totals row y
  const GX0 = CX0 - 8, GY0 = RY0 - 8;               // core grid frame (for the extrusion)
  const GX1 = colX(2) + CW + 8, GY1 = rowY(3) + CH + 8;
  const DEP = [140, -88];                           // full extrusion vector
  const PX = 1130, PW = 670;                        // right panel

  const grp = (parent, x, y) => { const g = U.sv("g", { transform: `translate(${x},${y})` }, parent); const inner = U.sv("g", {}, g); return { g, inner }; };

  function cellNode(parent, x, y, w, h, value, o = {}) {
    const c = grp(parent, x, y);
    const r = U.sv("rect", { x: 0, y: 0, width: w, height: h, rx: 12, fill: o.fill || C.surface, stroke: o.stroke || C.line2, "stroke-width": 2.5 }, c.inner);
    const tx = U.sv("text", { x: w / 2, y: h / 2 + 15, "text-anchor": "middle", "font-size": o.fs || 42, "font-weight": 800, fill: o.color || C.ink }, c.inner, String(value));
    return { ...c, r, tx };
  }

  R.scene("cube", {
    build(root, k) {
      const s = {};
      const D = k.data.cube;
      s.title = K.text(root, { x: 120, y: 110, cls: "h3", text: "Data cube" });
      s.cap = K.text(root, { x: 122, y: 176, cls: "body", html: `<span style="font-family:var(--mono);color:${C.purple}">SUM(amount)</span>, thousands of dollars` });
      s.cap.style.color = C.muted; s.cap.style.whiteSpace = "nowrap"; s.cap.style.fontSize = "32px";
      s.badge = K.badge(root, { x: 0, y: 118, right: 120, text: "Simplified illustration" });

      const svg = K.svgLayer(root);

      // Extrusion (behind the grid): faces + depth lines, scaled by p in update.
      s.ext = U.sv("g", {}, svg);
      s.topFace = U.sv("path", { fill: C.purple, "fill-opacity": 0.12, stroke: C.purple, "stroke-width": 3, "stroke-linejoin": "round" }, s.ext);
      s.sideFace = U.sv("path", { fill: C.purple, "fill-opacity": 0.2, stroke: C.purple, "stroke-width": 3, "stroke-linejoin": "round" }, s.ext);
      s.extLines = U.sv("path", { fill: "none", stroke: C.purple, "stroke-width": 1.8, "stroke-opacity": 0.6 }, s.ext);
      s.frontFrame = U.sv("rect", { x: GX0, y: GY0, width: GX1 - GX0, height: GY1 - GY0, rx: 14, fill: "none", stroke: C.purple, "stroke-width": 3 }, svg);

      // Headers.
      s.heads = D.merchants.map((m, j) => K.label(svg, { x: colX(j) + CW / 2, y: RY0 - 22, text: m, size: 32, weight: 750, fill: "ink" }));
      s.totHead = K.label(svg, { x: TX + CW / 2, y: RY0 - 22, text: "total", size: 30, weight: 700, fill: "purple" });
      s.dates = D.dates.map((d, i) => K.label(svg, { x: LX, y: rowY(i) + CH / 2 + 11, text: d, size: 32, weight: 700, fill: "muted", anchor: "end" }));
      s.totRowLbl = K.label(svg, { x: LX, y: TY + CH / 2 + 11, text: "total", size: 30, weight: 700, fill: "purple", anchor: "end" });

      // Cells.
      s.cells = D.cells.map((row, i) => row.map((v, j) => cellNode(svg, colX(j), rowY(i), CW, CH, v)));
      s.rowT = D.rowTotals.map((v, i) => cellNode(svg, TX, rowY(i), CW, CH, v, { fill: "#241F45", stroke: C.purple, color: C.purple }));
      s.colT = D.colTotals.map((v, j) => cellNode(svg, colX(j), TY, CW, CH, v, { fill: "#241F45", stroke: C.purple, color: C.purple }));
      s.grand = cellNode(svg, TX, TY, CW, CH, D.grand, { fill: "#3A3216", stroke: C.hl, color: C.hl, fs: 46 });
      // Sweep highlight bars (row / column being added up).
      s.rowSweep = U.sv("rect", { x: CX0 - 6, y: rowY(0) - 6, width: TX + CW - CX0 + 12, height: CH + 12, rx: 16, fill: "none", stroke: C.hl, "stroke-width": 4, opacity: 0 }, svg);
      s.colSweep = U.sv("rect", { x: colX(0) - 6, y: RY0 - 6, width: CW + 12, height: TY + CH - RY0 + 12, rx: 16, fill: "none", stroke: C.hl, "stroke-width": 4, opacity: 0 }, svg);
      s.bolt = U.sv("rect", { x: colX(1) - 6, y: RY0 - 6, width: CW + 12, height: TY + CH - RY0 + 12, rx: 16, fill: "none", stroke: C.ok, "stroke-width": 4, opacity: 0 }, svg);

      // Axis labels during the extrusion.
      s.axMerch = K.label(svg, { x: (GX0 + GX1) / 2, y: GY1 + 48, text: "merchant →", size: 30, weight: 700, fill: "purple" });
      s.axDate = K.label(svg, { x: GX0 - 150, y: GY0 - 20, text: "date ↓", size: 30, weight: 700, fill: "purple", anchor: "start" });
      s.axMethod = K.label(svg, { x: GX1 + DEP[0] / 2 + 22, y: GY1 + DEP[1] / 2 + 30, text: "method ↗", size: 30, weight: 700, fill: "purple", anchor: "start" });

      // Right panel: dimensions (beat `more`).
      s.dimHead = K.text(root, { x: PX, y: 330, cls: "label", text: "Dimensions of the fact table" });
      s.dimHead.style.color = C.muted;
      s.dims = K.chips(root, { x: PX, y: 390, w: PW, items: ["date", "merchant", "method", "country", "customer"], accent: "purple", size: 30 });
      s.dims.chips.forEach((c) => (c.querySelector("span").style.fontFamily = "var(--mono)"));
      s.hyper = K.text(root, { x: PX, y: 590, cls: "h3", html: `5 dimensions → <span style="color:${C.purple}">5-D hypercube</span>` });
      s.hyper.style.whiteSpace = "nowrap"; s.hyper.style.fontSize = "44px";

      // Right panel: queries (beats `fast`, `rigid`).
      s.q1 = K.card(root, { x: PX, y: 330, w: PW, title: "Bolt, all days", accent: "ok", body: " " });
      s.q1b = s.q1.querySelector(".k-card-body");
      s.q1b.innerHTML = `<span class="a">Single lookup →</span> <span class="b"><b style="color:${C.ok};font-weight:800;font-size:44px">255</b> <span style="color:${C.ink}">thousand</span></span><span class="c" style="display:block">already computed</span>`;
      s.q2 = K.card(root, { x: PX, y: 560, w: PW, title: "Payments over $100?", accent: "bad", body: " " });
      s.q2b = s.q2.querySelector(".k-card-body");
      s.q2b.innerHTML = `<span style="color:${C.ink}">amount</span> isn't a dimension`;
      [s.q1, s.q2].forEach((q) => (q.style.minHeight = "190px"));
      const ms = K.svgLayer(root);
      s.ok = K.mark(ms, "check", { x: PX + PW - 56, y: 386, size: 60 });
      s.x = K.mark(ms, "x", { x: PX + PW - 56, y: 616, size: 60 });

      // Takeaway.
      const wrap = U.el("div", { style: { position: "absolute", left: PX + "px", top: "790px", width: PW + "px", display: "flex", justifyContent: "center" } }, root);
      s.raw = K.chip(wrap, { text: "Keep raw data · cubes are a speed-up", accent: "purple", size: 32, icon: "layers" });
      s.raw.style.position = "relative";
      return s;
    },

    update(t, k, s) {
      const w = (ref, n, i = 0) => k.word(ref, n, i);
      A.show(s.title, t, 0.3);
      A.show(s.badge, t, w(1, "simplified") - 0.1, { dy: 10 });

      // Beat `more` window: grid → cube → back to the grid at "Back in our grid".
      const tGrow = w("more", "grows") - 0.15;
      const tBack = w("fast", "Back") - 0.05;
      const ex = A.prog(t, tGrow, 1.0, A.E.inOutCubic) * (1 - A.prog(t, tBack, 0.8, A.E.inOutCubic));
      const exOn = A.win(t, tGrow, tBack, 0.5);           // fade for labels/numbers that leave during the cube
      const keep = 1 - exOn;                               // headers/totals leave during the cube
      const core = 1 - 0.45 * exOn;                        // the core grid stays as the cube's front face

      // Grid: frame + cells at "grid", numbers cascade, headers on their words.
      const tGrid = w("grid", "grid") - 0.1;
      s.cells.forEach((row, i) => row.forEach((c, j) => {
        A.show(c.inner, t, tGrid + 0.1 + (i * 3 + j) * 0.06, { dy: 10, d: 0.45, max: core });
        A.setOpacity(c.tx, A.prog(t, w("grid", "totals") + (i * 3 + j) * 0.05, 0.4));
      }));
      A.show(s.cap, t, w("grid", "thousands") - 0.1, { dy: 10 });
      s.dates.forEach((d, i) => A.show(d.inner, t, w("grid", "date") - 0.1 + i * 0.08, { dy: 0, dx: -10, d: 0.45, max: 1 }));
      s.heads.forEach((h, j) => A.show(h.inner, t, w("grid", "merchant") - 0.1 + j * 0.08, { dy: 10, d: 0.45, max: keep }));

      // Totals: row sweep (Jun 1) → row totals; column sweep (Acme) → column totals; grand total on "700".
      const tRow = w("totals", "row") - 0.1, tDay = w("totals", "total") - 0.1;
      const tCol = w("totals", "column") - 0.1, tMer = w("totals", "merchant's") - 0.1, tGrand = w("totals", "700") - 0.1;
      s.rowSweep.setAttribute("opacity", A.win(t, tRow, tCol - 0.1, 0.3).toFixed(3));
      s.colSweep.setAttribute("opacity", A.win(t, tCol, tMer + 0.6, 0.3).toFixed(3));
      A.show(s.totHead.inner, t, tDay, { dy: 10, d: 0.45, max: keep });
      s.rowT.forEach((c, i) => A.show(c.inner, t, tDay + i * 0.12, { dy: 0, dx: -14, d: 0.45, max: keep }));
      A.show(s.totRowLbl.inner, t, tMer, { dy: 0, dx: -10, d: 0.45, max: keep });
      s.colT.forEach((c, j) => A.show(c.inner, t, tMer + j * 0.12, { dy: -14, d: 0.45, max: keep }));
      A.show(s.grand.inner, t, tGrand, { dy: 0, s0: 0.7, d: 0.55, ease: A.E.outBack, max: keep });

      // Extrusion geometry.
      const dx = DEP[0] * ex, dy = DEP[1] * ex;
      const P = (x, y) => `${(x + dx).toFixed(1)},${(y + dy).toFixed(1)}`;
      s.topFace.setAttribute("d", `M${GX0},${GY0} L${GX1},${GY0} L${P(GX1, GY0)} L${P(GX0, GY0)} Z`);
      s.sideFace.setAttribute("d", `M${GX1},${GY0} L${GX1},${GY1} L${P(GX1, GY1)} L${P(GX1, GY0)} Z`);
      let d = "";
      for (let j = 1; j < 3; j++) { const x = colX(j) - CG / 2; d += `M${x},${GY0} L${P(x, GY0)} `; }
      for (let i = 1; i < 4; i++) { const y = rowY(i) - RG / 2; d += `M${GX1},${y} L${P(GX1, y)} `; }
      for (const f of [1 / 3, 2 / 3]) { const ax = dx * f, ay = dy * f; d += `M${GX0 + ax},${GY0 + ay} L${GX1 + ax},${GY0 + ay} L${GX1 + ax},${GY1 + ay} `; }
      s.extLines.setAttribute("d", d);
      A.setOpacity(s.ext, Math.min(1, ex * 4));
      A.show(s.axMerch.inner, t, tGrow + 0.5, { dy: 8, d: 0.45, out: tBack - 0.3 });
      A.show(s.axDate.inner, t, tGrow + 0.6, { dy: 8, d: 0.45, out: tBack - 0.3 });
      A.show(s.axMethod.inner, t, tGrow + 0.8, { dy: 8, d: 0.45, out: tBack - 0.3 });

      // Dimensions panel.
      const tDims = w("more", "dimensions") - 0.1, tFive = w("more", "5") - 0.1;
      A.show(s.dimHead, t, tDims, { dy: 10, out: tBack - 0.3 });
      s.dims.chips.forEach((c, i) => {
        const t0 = i < 2 ? tDims + 0.15 * i : i === 2 ? tGrow + 0.6 : tFive + (i - 3) * 0.2;
        A.show(c, t, t0, { dy: 10, d: 0.45, out: tBack - 0.3 });
      });
      A.show(s.hyper, t, w("more", "5-dimensional") - 0.1, { dy: 12, out: tBack - 0.3 });

      // Fast: Bolt, all days → 255.
      const tQ1 = w("fast", "Bolt's") - 0.1, tLook = w("fast", "single") - 0.1, t255 = w("fast", "255") - 0.1;
      A.show(s.q1, t, tQ1, { dy: 14 });
      const sp = s.q1b.querySelectorAll(":scope > span");
      A.setOpacity(sp[0], A.prog(t, tLook, 0.4));
      A.setOpacity(sp[1], A.prog(t, t255, 0.4));
      A.setOpacity(sp[2], A.prog(t, w("fast", "already") - 0.1, 0.4));
      A.show(s.ok.inner, t, t255, { dy: 0, s0: 0.3, d: 0.45, ease: A.E.outBack });
      s.bolt.setAttribute("opacity", A.win(t, tQ1 + 0.3, tLook + 0.2, 0.3).toFixed(3));
      const lit = A.prog(t, tLook + 0.2, 0.3);
      const c255 = s.colT[1];
      c255.r.setAttribute("fill", A.mix("#241F45", "#12301F", lit));
      c255.r.setAttribute("stroke", A.mix(C.purple, C.ok, lit));
      c255.r.setAttribute("stroke-width", (2.5 + 2 * lit).toFixed(2));
      c255.tx.setAttribute("fill", A.mix(C.purple, C.ok, lit));
      // Other cells dim while the lookup is lit, then come back.
      const look = A.win(t, tLook + 0.2, w("rigid", "payments") - 0.2, 0.4);
      s.cells.flat().concat(s.rowT, [s.colT[0], s.colT[2], s.grand]).forEach((c) => (c.g.style.opacity = (1 - 0.6 * look).toFixed(3)));

      // Rigid: payments over $100 → ✕, amount isn't a dimension.
      const tQ2 = w("rigid", "payments") - 0.1;
      A.show(s.q2, t, tQ2, { dy: 14 });
      A.show(s.x.inner, t, w("rigid", "can't") - 0.1, { dy: 0, s0: 0.3, d: 0.45, ease: A.E.outBack });
      A.setOpacity(s.q2b, A.prog(t, w("rigid", "isn't") - 0.25, 0.45));
      // The grid has no amount axis: frame flashes red while the cube can't help.
      const nope = A.win(t, w("rigid", "can't") - 0.1, k.cueEnd("rigid"), 0.35);
      s.frontFrame.setAttribute("stroke", A.mix(C.purple, C.bad, nope));
      A.setOpacity(s.frontFrame, A.prog(t, tGrid, 0.5) * Math.max(0.15 + 0.85 * exOn, nope));

      // Raw.
      A.show(s.raw, t, w("raw", "raw") - 0.1, { dy: 12 });
    },
  });
})();
