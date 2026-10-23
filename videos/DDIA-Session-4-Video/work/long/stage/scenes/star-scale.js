// S09 — Fact tables at scale, then the snowflake variant. The fact table (column stripes) stretches sideways to 100+ and then
// several hundred columns, then downwards: "Tens of petabytes" (as described in the book, 2017). It then folds into a thin strip at the
// top while a snowflake schema builds below: dim_merchant → dim_category, dim_country. Chip: "Star: simpler for analysts".
// Final line: the strip's width is measured with a yellow dimension line ("Keep that width in mind").
(function () {
  const C = K.C;
  const X0 = 120, WMAX = 1680, TY = 300;            // table left, full width, top
  const N = 300;                                     // column stripes at most ("several hundred")
  const HDR = 34, ROWH = 30, NROWS = 22;             // header band height, row spacing, row lines
  const H_WIDE = 236, H_HUGE = 600, H_STRIP = 74;

  const BODY = A.mix(C.bg2, C.teal, 0.2), HEAD = A.mix(C.bg2, C.teal, 0.5);
  const BODY7 = A.mix(C.bg2, C.teal, 0.34), HEAD7 = C.teal;

  function dimBox(svg, o) {
    const g = U.sv("g", {}, svg);
    const rect = U.sv("rect", { x: o.x, y: o.y, width: o.w, height: o.h, rx: 18, fill: o.fill || C.surface, stroke: o.stroke || C.line2, "stroke-width": 3,
      "stroke-dasharray": o.dash || null }, g);
    const name = U.sv("text", { x: o.x + o.w / 2, y: o.y + o.h / 2 + 10, "text-anchor": "middle", "font-size": o.fs || 30, "font-weight": 750,
      fill: o.color || C.ink, "font-family": "JetBrains Mono, monospace" }, g, o.name);
    return { g, rect, name, x: o.x, y: o.y, w: o.w, h: o.h, cx: o.x + o.w / 2, cy: o.y + o.h / 2 };
  }

  R.scene("star-scale", {
    build(root, k) {
      const s = {};
      s.title = K.text(root, { x: 120, y: 110, cls: "h3", text: "Inside the warehouse" });

      // Header row above the table.
      s.name = K.text(root, { x: 120, y: 214, cls: "label mono", text: "fact_payments", color: "teal" });
      s.name.style.fontSize = "34px";
      s.count = U.el("div", { class: "k-text" }, root);
      Object.assign(s.count.style, { left: "800px", top: "206px", width: "1000px", textAlign: "right", whiteSpace: "nowrap" });
      s.countA = U.el("span", {}, s.count, "100+ columns");
      Object.assign(s.countA.style, { fontSize: "44px", fontWeight: 800, color: C.hl, letterSpacing: "-0.01em" });
      s.countB = U.el("span", {}, s.count, " · sometimes several hundred");
      Object.assign(s.countB.style, { fontSize: "32px", fontWeight: 600, color: C.muted });

      const svg = K.svgLayer(root);
      // Bottom fade for the "tall" table.
      const defs = U.sv("defs", {}, svg);
      const lg = U.sv("linearGradient", { id: "ss-fade", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      U.sv("stop", { offset: "0", "stop-color": C.bg, "stop-opacity": 0 }, lg);
      U.sv("stop", { offset: "1", "stop-color": C.bg, "stop-opacity": 1 }, lg);

      s.table = U.sv("g", {}, svg);
      s.cols = Array.from({ length: N }, (_, i) => ({
        body: U.sv("rect", { y: TY, fill: i < 7 ? BODY7 : BODY }, s.table),
        head: U.sv("rect", { y: TY, height: HDR, fill: i < 7 ? HEAD7 : HEAD }, s.table),
      }));
      s.rows = Array.from({ length: NROWS }, () => U.sv("rect", { x: X0, height: 3, fill: C.bg }, s.table));
      s.fade = U.sv("rect", { x: X0 - 4, width: WMAX + 8, height: 170, fill: "url(#ss-fade)" }, s.table);
      s.outline = U.sv("rect", { x: X0 - 6, y: TY - 6, rx: 8, fill: "none", stroke: C.hl, "stroke-width": 3, opacity: 0 }, svg);

      // Width dimension line (final line).
      s.dim = U.sv("g", {}, svg);
      const dy = TY - 20;
      U.sv("path", { d: `M${X0},${dy} H${X0 + WMAX}`, stroke: C.hl, "stroke-width": 4, fill: "none" }, s.dim);
      U.sv("path", { d: `M${X0},${dy - 12} V${dy + 12} M${X0 + WMAX},${dy - 12} V${dy + 12}`, stroke: C.hl, "stroke-width": 4, "stroke-linecap": "round", fill: "none" }, s.dim);
      U.sv("path", { d: `M${X0 + 20},${dy - 9} L${X0 + 6},${dy} L${X0 + 20},${dy + 9} M${X0 + WMAX - 20},${dy - 9} L${X0 + WMAX - 6},${dy} L${X0 + WMAX - 20},${dy + 9}`,
        stroke: C.hl, "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round", fill: "none" }, s.dim);

      // Petabytes card (over the tall table).
      s.card = U.el("div", {}, root);
      Object.assign(s.card.style, { position: "absolute", left: "430px", top: "470px", width: "1060px", padding: "34px 40px 30px", borderRadius: "26px",
        background: C.surface, border: `2px solid ${C.teal}`, textAlign: "center", boxShadow: "0 30px 60px -30px rgba(0,0,0,.7)" });
      s.cardBig = U.el("div", { class: "k-text h2" }, s.card, "Tens of petabytes");
      Object.assign(s.cardBig.style, { position: "relative", color: C.ink });
      s.cardSub = U.el("div", { class: "k-text body" }, s.card, "of transaction history, mostly in fact tables");
      Object.assign(s.cardSub.style, { position: "relative", color: C.muted, marginTop: "10px" });
      s.cardBadgeWrap = U.el("div", { style: { position: "relative", marginTop: "22px", display: "flex", justifyContent: "center" } }, s.card);
      s.cardBadge = K.badge(s.cardBadgeWrap, { x: 0, y: 0, text: "A big enterprise, as described in the book (2017)", tone: "teal" });
      s.cardBadge.style.position = "relative"; s.cardBadge.style.left = "0"; s.cardBadge.style.top = "0";

      // Snowflake diagram (below the strip).
      s.snow = U.sv("g", {}, svg);
      const sg = s.snow;
      s.box = U.sv("rect", { x: 120, y: 448, width: 1680, height: 462, rx: 24, fill: C.bg2, stroke: C.line2, "stroke-width": 2.5 }, sg);
      s.boxG = U.sv("g", {}, sg);
      s.ghost1 = dimBox(sg, { x: 160, y: 520, w: 320, h: 76, name: "dim_date", fill: "none", stroke: C.line2, dash: "10 10", color: C.muted, fs: 28 });
      s.ghost2 = dimBox(sg, { x: 160, y: 810, w: 320, h: 76, name: "dim_customer", fill: "none", stroke: C.line2, dash: "10 10", color: C.muted, fs: 28 });
      s.fact = dimBox(sg, { x: 140, y: 648, w: 360, h: 100, name: "fact_payments", fill: "#0F2E2C", stroke: C.teal, color: C.teal });
      s.merch = dimBox(sg, { x: 720, y: 638, w: 330, h: 100, name: "dim_merchant" });
      s.cat = dimBox(sg, { x: 1370, y: 540, w: 330, h: 96, name: "dim_category" });
      s.ctry = dimBox(sg, { x: 1370, y: 760, w: 330, h: 96, name: "dim_country" });
      s.aG1 = K.arrow(sg, { from: [320, 648], to: [320, 596], gapStart: 6, gapEnd: 6, head: false, tone: "line" });
      s.aG2 = K.arrow(sg, { from: [320, 748], to: [320, 810], gapStart: 6, gapEnd: 6, head: false, tone: "line" });
      s.aFM = K.arrow(sg, { from: [500, 693], to: [720, 693], gapStart: 10, gapEnd: 12, tone: "teal" });
      s.aMC = K.arrow(sg, { from: [1050, 670], to: [1370, 588], gapStart: 12, gapEnd: 12, tone: "teal" });
      s.aMK = K.arrow(sg, { from: [1050, 706], to: [1370, 808], gapStart: 12, gapEnd: 12, tone: "teal" });
      // Container label (inside its top edge).
      s.snowLbl = U.el("div", { class: "k-text label" }, root);
      Object.assign(s.snowLbl.style, { left: "152px", top: "468px", fontSize: "34px", whiteSpace: "nowrap" });
      s.snowA = U.el("span", {}, s.snowLbl, "Snowflake");
      s.snowA.style.color = C.teal;
      s.snowB = U.el("span", {}, s.snowLbl, ": more normalized");
      s.snowB.style.color = C.ink;
      s.subLbl = K.text(root, { x: 1370, y: 878, cls: "small", text: "sub-dimensions" });
      s.subLbl.style.color = C.muted;

      // Star verdict chip: top-right corner of the panel, right-aligned, opposite the "Snowflake" label.
      const chipWrap = U.el("div", { style: { position: "absolute", left: "1000px", top: "462px", width: "770px", display: "flex", justifyContent: "flex-end" } }, root);
      s.chip = K.chip(chipWrap, { text: "Star: simpler for analysts", accent: "ok", icon: "check" });
      s.chip.style.position = "relative";
      return s;
    },

    update(t, k, s) {
      A.show(s.title, t, -1);

      // --- Width: 7 columns → 100+ (at "hundred"), then → several hundred (at "several").
      const tWide = k.word("wide", "wide") - 0.1, tHund = k.word("wide", "hundred"), tSev = k.word("wide", "several") - 0.1;
      const pW = A.prog(t, tWide, tHund + 0.4 - tWide, A.E.inOutCubic);
      const pS = A.prog(t, tSev, 0.9, A.E.inOutCubic);
      const W = U.lerp(7 * 60, WMAX, pW);
      const n = U.lerp(7, 110, pW) + (N - 110) * pS;

      // --- Height: tall at "huge", folds to a strip at "snowflake".
      const tHuge = k.word("huge", "huge") - 0.1;
      const pH = A.prog(t, tHuge, 1.1, A.E.inOutCubic);
      const tFold = k.cue("snowflake") + 0.2;
      const pF = A.prog(t, tFold, 0.9, A.E.inOutCubic);
      const H = U.lerp(U.lerp(H_WIDE, H_HUGE, pH), H_STRIP, pF);

      const tIn = 0.2;
      A.show(s.table, t, tIn, { dy: 16 });
      A.show(s.name, t, tIn, { dy: 12 });
      const colW = W / n, gap = Math.min(5, colW * 0.28);
      s.cols.forEach((c, i) => {
        const vis = U.clamp(n - i);
        const x = X0 + i * colW;
        const w = Math.max(0.6, colW - gap);
        for (const r of [c.body, c.head]) {
          r.setAttribute("x", x.toFixed(2));
          r.setAttribute("width", w.toFixed(2));
          r.style.opacity = vis.toFixed(3);
          r.style.visibility = vis > 0.002 ? "visible" : "hidden";
        }
        c.body.setAttribute("height", H.toFixed(1));
        c.head.setAttribute("height", Math.min(HDR, H * 0.45).toFixed(1));
      });
      const rowStep = U.lerp(ROWH, 18, pF);
      s.rows.forEach((r, j) => {
        const y = TY + Math.min(HDR, H * 0.45) + j * rowStep;
        r.setAttribute("y", y.toFixed(1));
        r.setAttribute("width", Math.min(W, X0 + WMAX).toFixed(1));
        A.setOpacity(r, y < TY + H - 8 ? 1 : 0);
      });
      s.fade.setAttribute("y", (TY + H - 170).toFixed(1));
      A.setOpacity(s.fade, pH * (1 - pF));

      // Counter: "100+ columns" at "hundred", the rest at "several".
      A.show(s.count, t, tHund - 0.1, { dy: 10 });
      A.setOpacity(s.countB, A.prog(t, tSev, 0.5));

      // Petabytes card: at "tens of petabytes"; leaves as the table folds.
      A.show(s.card, t, k.word("huge", "tens") - 0.1, { dy: 16, out: k.cue("snowflake") - 0.1, outD: 0.35 });
      A.setOpacity(s.cardSub, A.prog(t, k.word("huge", "transaction") - 0.1, 0.5));
      A.setOpacity(s.cardBadge, A.prog(t, k.word("huge", "book") - 0.1, 0.5));

      // --- Snowflake.
      const tSnow = k.word("snowflake", "snowflake") - 0.1;
      const iEnd = k.lines.length - 1;
      const tEnd = k.word(iEnd, "width") - 0.1;
      const dimEnd = 1 - 0.45 * A.prog(t, tEnd, 0.6);
      const snowOn = A.prog(t, tSnow, 0.6) * dimEnd;
      A.setOpacity(s.snow, snowOn > 0.002 ? 1 : 0);
      A.show(s.fact.g, t, tSnow, { dy: 12, max: dimEnd });
      A.show(s.ghost1.g, t, tSnow + 0.15, { dy: 12, max: dimEnd });
      A.show(s.ghost2.g, t, tSnow + 0.15, { dy: 12, max: dimEnd });
      s.aG1.draw(t, tSnow + 0.2, 0.4); s.aG2.draw(t, tSnow + 0.2, 0.4);
      s.aG1.setOpacity(A.prog(t, tSnow + 0.2, 0.1) * dimEnd); s.aG2.setOpacity(A.prog(t, tSnow + 0.2, 0.1) * dimEnd);
      A.show(s.merch.g, t, tSnow + 0.3, { dy: 12, max: dimEnd });
      s.aFM.draw(t, tSnow + 0.3, 0.5); s.aFM.setOpacity(A.prog(t, tSnow + 0.3, 0.1) * dimEnd);
      // Container + "Snowflake" at "sub-dimensions"; ": more normalized" at "normalized".
      A.show(s.box, t, tSnow + 0.2, { dy: 0, max: dimEnd });
      A.show(s.snowLbl, t, tSnow, { dy: 10, max: dimEnd });
      A.setOpacity(s.snowB, A.prog(t, k.word("simpler", "normalized") - 0.1, 0.5));
      A.show(s.subLbl, t, k.word("snowflake", "category") + 0.3, { dy: 8, max: dimEnd });
      // Merchant highlights at "a merchant", then its sub-dimensions.
      const pM = A.win(t, k.word("snowflake", "merchant") - 0.1, k.cue("simpler"), 0.4);
      s.merch.rect.setAttribute("stroke", A.mix(C.line2, C.teal, pM));
      const tCat = k.word("snowflake", "category") - 0.1, tCtry = k.word("snowflake", "country") - 0.1;
      A.show(s.cat.g, t, tCat, { dx: -14, dy: 0, max: dimEnd });
      s.aMC.draw(t, tCat - 0.1, 0.45); s.aMC.setOpacity(A.prog(t, tCat - 0.1, 0.1) * dimEnd);
      A.show(s.ctry.g, t, tCtry, { dx: -14, dy: 0, max: dimEnd });
      s.aMK.draw(t, tCtry - 0.1, 0.45); s.aMK.setOpacity(A.prog(t, tCtry - 0.1, 0.1) * dimEnd);

      // Stars preferred: the star side lights, chip at "simpler".
      const pStar = A.prog(t, k.word("simpler", "stars") - 0.1, 0.5);
      s.fact.rect.setAttribute("stroke-width", (3 + 2 * pStar).toFixed(2));
      A.show(s.chip, t, k.word("simpler", "simpler") - 0.1, { dy: 10 });

      // --- "Keep that width in mind": measure the strip.
      const pE = A.prog(t, tEnd, 0.6);
      s.dim.style.opacity = pE.toFixed(3);
      s.dim.style.visibility = pE > 0.002 ? "visible" : "hidden";
      s.outline.setAttribute("width", (Math.min(W, WMAX) + 12).toFixed(1));
      s.outline.setAttribute("height", (H + 12).toFixed(1));
      s.outline.setAttribute("opacity", pE.toFixed(3));
    },
  });
})();
