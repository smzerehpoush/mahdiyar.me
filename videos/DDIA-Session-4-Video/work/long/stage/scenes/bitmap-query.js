// S14 — bitmap-query. The 12 payments laid out as columns (id / country / method), bit i under payment i.
// in/or: country IN ('DE','NL') = DE OR NL, computed position by position. and: country = 'DE' AND method = 'card' → payment 10.
// order: every column keeps the same row order (one vertical slice = one payment).
(function () {
  const X0 = 420, CW = 108, PITCH = 114;
  const Y_ID = 220, Y_CTRY = 270, Y_METH = 334, TH = 56;
  const Y_Q = 420;
  const Y_A = 500, Y_B = 568, Y_RULE = 640, Y_RES = 654, BH = 56;
  const MONO = "JetBrains Mono, monospace";
  const cx = (i) => X0 + i * PITCH + CW / 2;
  const BG = { orange: "#33210F", purple: "#241F45", teal: "#0F2E2C", hl: "#3A3216" };

  R.scene("bitmap-query", {
    build(root, k) {
      const C = K.C, s = {}, D = k.data;
      const rows = D.rows;
      s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Bitmaps answer queries" });
      s.badge = K.badge(root, { x: 0, y: 128, right: 120, text: "Simplified illustration" });
      const svg = K.svgLayer(root);
      const T = (parent, o, txt) => U.sv("text", { "text-anchor": "middle", "font-weight": 650, "font-family": MONO, ...o }, parent, txt);

      // Column guides (order beat) and highlight bands sit underneath everything.
      s.guides = U.sv("g", {}, svg);
      // Two stacked rounded rects per column: the table part and the bit rows (the query row stays clear).
      const seg2 = (i, pad) => {
        const x = X0 + i * PITCH - pad, w = CW + 2 * pad, r = 12;
        const rr = (y0, y1) => `M${x + r},${y0} H${x + w - r} Q${x + w},${y0} ${x + w},${y0 + r} V${y1 - r} Q${x + w},${y1} ${x + w - r},${y1} H${x + r} Q${x},${y1} ${x},${y1 - r} V${y0 + r} Q${x},${y0} ${x + r},${y0} Z`;
        return rr(Y_ID - 2 - pad, Y_METH + TH + 2 + pad) + " " + rr(Y_A - 2 - pad, Y_RES + BH + 2 + pad);
      };
      s.guideR = rows.map((r, i) => U.sv("path", { d: seg2(i, 4), fill: C.bg2, stroke: C.line2, "stroke-width": 2 }, s.guides));
      const band = (i, tone) => U.sv("path", { d: seg2(i, 8), fill: "none", stroke: K.toneColor(tone), "stroke-width": 4 }, svg);
      s.band10 = band(9, "hl");
      s.band4 = band(3, "teal"); s.band4.setAttribute("stroke-dasharray", "12 9");

      // ---- The payments as columns: id, country, method.
      s.tbl = U.sv("g", {}, svg);
      const lab = (y, txt) => T(s.tbl, { x: 120, y, "text-anchor": "start", "font-size": 30, fill: C.muted }, txt);
      s.lId = lab(Y_ID + 30, "payment");
      s.lCtry = lab(Y_CTRY + TH / 2 + 10, "country");
      s.lMeth = lab(Y_METH + TH / 2 + 10, "method");
      s.ids = rows.map((r, i) => T(s.tbl, { x: cx(i), y: Y_ID + 30, "font-size": 28, fill: C.faint, "font-weight": 700 }, String(r[0])));
      const cell = (y, txt, fs = 28, extra = {}) => {
        const g = U.sv("g", {}, s.tbl);
        const rect = U.sv("rect", { x: 0, y, width: CW, height: TH, rx: 10, "stroke-width": 2.5 }, g);
        const tx = T(g, { x: CW / 2, y: y + TH / 2 + 10, "font-size": fs, "font-weight": 700, ...extra }, txt);
        return { g, rect, tx };
      };
      s.ctry = rows.map((r, i) => { const c = cell(Y_CTRY, r[3]); c.g.setAttribute("transform", `translate(${X0 + i * PITCH},0)`); c.v = r[3]; return c; });
      s.meth = rows.map((r, i) => { const c = cell(Y_METH, r[4], 26, { "font-family": null, "font-weight": 650 }); c.g.setAttribute("transform", `translate(${X0 + i * PITCH},0)`); c.v = r[4]; return c; });

      // ---- Query chips.
      const qchip = (txt) => { const c = K.chip(root, { x: 120, y: Y_Q, text: txt, accent: "orange", icon: "search" }); Object.assign(c.style, { fontFamily: "var(--mono)", fontWeight: 600, fontSize: "28px" }); return c; };
      s.q1 = qchip("WHERE country IN ('DE', 'NL')");
      s.q2 = qchip("WHERE country = 'DE' AND method = 'card'");

      // ---- Bit rows.
      const bitRow = (y, label, bits, tone) => {
        const g = U.sv("g", {}, svg);
        const lbl = T(g, { x: 120, y: y + BH / 2 + 10, "text-anchor": "start", "font-size": 30, "font-weight": 700, fill: K.toneColor(tone) }, label);
        const cells = [...bits].map((b, i) => {
          const rect = U.sv("rect", { x: X0 + i * PITCH, y, width: CW, height: BH, rx: 8, "stroke-width": 2.5 }, g);
          const tx = T(g, { x: cx(i), y: y + BH / 2 + 12, "font-size": 34, "font-weight": 700 }, b);
          return { rect, tx, b };
        });
        return { g, lbl, cells, tone, col: K.toneColor(tone), bits };
      };
      s.de = bitRow(Y_A, "country = DE", D.bitmaps.DE.bits, "orange");
      s.nl = bitRow(Y_B, "country = NL", D.bitmaps.NL.bits, "purple");
      s.card = bitRow(Y_B, "method = card", D.cardBits, "teal");
      s.or = bitRow(Y_RES, "DE  OR  NL", D.orBits, "hl");
      s.and = bitRow(Y_RES, "DE  AND  card", D.andBits, "hl");
      s.rule = U.sv("path", { d: `M120,${Y_RULE} H${X0 + 11 * PITCH + CW}`, stroke: C.line2, "stroke-width": 3, fill: "none" }, svg);
      // Sweep marker (the bitwise operator walking along the row).
      s.sweep = U.sv("rect", { y: Y_A - 8, width: CW + 12, height: Y_RES + BH - Y_A + 16, rx: 12, fill: "none", stroke: C.hl, "stroke-width": 3 }, svg);

      s.p4 = T(svg, { x: cx(3), y: Y_RES + BH + 50, "font-size": 30, "font-weight": 800, fill: C.teal, "font-family": null }, "payment 4");
      s.p10 = T(svg, { x: cx(9), y: Y_RES + BH + 50, "font-size": 30, "font-weight": 800, fill: C.hl, "font-family": null }, "payment 10");

      // ---- Order chip.
      s.order = K.chip(root, { x: 120, y: 790, text: "Works because every column keeps the same row order", accent: "orange", icon: "check" });
      return s;
    },

    update(t, k, s) {
      const C = K.C;
      // ---- Anchors.
      const tBits = k.word("in", "bitmaps"), tGer = k.word("in", "Germany"), tNeth = k.word("in", "Netherlands");
      const tTwo = k.word("or", "two"), tOr = k.word("or", "or"), tMatch = k.word("or", "every matching");
      const tAnd = k.cue("and"), tCols = k.word("and", "different columns"), tGerP = k.word("and", "German"), tCard = k.word("and", "card");
      const tDEbm = k.word("and", "Germany bitmap"), tAndOp = k.word("and", "and"), tCardBm = k.word("and", "card bitmap");
      const tP10 = k.word("and", "payment", 1);
      const tBecause = k.word("order", "because"), tSame = k.word("order", "same order"), tP4 = k.word("order", "payment");
      const outOr = tAnd - 0.1;

      A.show(s.title, t, 0.3);
      A.show(s.badge, t, 0.4, { dy: 0 });

      // ---- Table (columns of the 12 payments) — present from the start of the scene.
      A.show(s.tbl, t, 0.5, { dy: 10 });
      const pOr = A.prog(t, tMatch, 0.4) * (1 - A.prog(t, outOr, 0.4));  // matching rows (DE or NL) lit
      const pDe = A.prog(t, tGer, 0.4);
      const pNl = A.prog(t, tNeth, 0.4) * (1 - A.prog(t, outOr, 0.4));
      const pCard = A.prog(t, tCard, 0.4);
      const p10 = A.prog(t, tP10, 0.4);
      s.ctry.forEach((c, i) => {
        const on = c.v === "DE" ? Math.min(1, pDe) : c.v === "NL" ? pNl : 0;
        const tone = c.v === "DE" ? "orange" : "purple";
        c.rect.setAttribute("fill", A.mix(C.surface, BG[tone], on));
        c.rect.setAttribute("stroke", A.mix(C.line2, K.toneColor(tone), on));
        c.tx.setAttribute("fill", A.mix(C.muted, K.toneColor(tone), on));
        // Rows that end up in the result get a yellow outline.
        const res = (c.v !== "FR" ? pOr : 0) + (i === 9 ? p10 : 0);
        if (res > 0.5) c.rect.setAttribute("stroke", C.hl);
      });
      s.meth.forEach((c, i) => {
        const on = c.v === "card" ? pCard : 0;
        c.rect.setAttribute("fill", A.mix(C.surface, BG.teal, on));
        c.rect.setAttribute("stroke", i === 9 && p10 > 0.5 ? C.hl : A.mix(C.line2, C.teal, on));
        c.tx.setAttribute("fill", A.mix(C.muted, C.teal, on));
      });
      // "Conditions on different columns": both column labels light up.
      const pCols = A.win(t, tCols, tGerP + 0.6, 0.35);
      s.lCtry.setAttribute("fill", A.mix(C.muted, C.ink, Math.max(pCols, 0)));
      s.lMeth.setAttribute("fill", A.mix(C.muted, C.ink, Math.max(pCols, 0)));

      // ---- Queries.
      A.show(s.q1, t, k.word("in", "wants") - 0.05, { dy: 12, out: outOr });
      A.show(s.q2, t, tGerP, { dy: 12 });

      // ---- Bit rows.
      const paintRow = (row, op, lit, fromBit = 0) => {
        row.g.style.opacity = op.toFixed(3); row.g.style.visibility = op < 0.002 ? "hidden" : "visible";
        row.cells.forEach((c, i) => {
          const one = c.b === "1", L = typeof lit === "function" ? lit(i) : lit;
          c.rect.setAttribute("fill", one ? A.mix(C.bg2, BG[row.tone], L) : C.bg2);
          c.rect.setAttribute("stroke", one ? A.mix(C.line, row.col, L) : C.line);
          c.tx.setAttribute("fill", one ? A.mix(C.muted, row.col, L) : C.faint);
        });
      };
      // DE bitmap: in with "Germany", stays for the AND.
      paintRow(s.de, A.prog(t, tTwo, 0.45), 1);
      paintRow(s.nl, A.prog(t, tTwo + 0.2, 0.45) * (1 - A.prog(t, outOr, 0.4)), 1);
      paintRow(s.card, A.prog(t, tCard, 0.45), 1);
      A.setOpacity(s.rule, A.prog(t, tTwo + 0.3, 0.4));

      // Result rows: bits revealed as the sweep passes.
      const sweepRow = (row, t0, t1, op) => {
        row.g.style.opacity = op.toFixed(3); row.g.style.visibility = op < 0.002 ? "hidden" : "visible";
        A.setOpacity(row.lbl, A.prog(t, t0 - 0.1, 0.35));
        row.cells.forEach((c, i) => {
          const ti = U.lerp(t0, t1, i / 11);
          const p = A.prog(t, ti, 0.2);
          A.setOpacity(c.tx, p); A.setOpacity(c.rect, p);
          const one = c.b === "1";
          c.rect.setAttribute("fill", one ? BG.hl : C.bg2);
          c.rect.setAttribute("stroke", one ? C.hl : C.line);
          c.tx.setAttribute("fill", one ? C.hl : C.faint);
        });
      };
      const orT0 = tOr, orT1 = Math.min(tMatch, tOr + 1.6);
      sweepRow(s.or, orT0, orT1, 1 - A.prog(t, outOr, 0.4));
      const andT0 = tAndOp, andT1 = Math.min(tP10 - 0.2, tAndOp + 1.4);
      sweepRow(s.and, andT0, andT1, 1);
      // Sweep marker: visible while either operator walks the row.
      const sw = (t0, t1) => ({ on: A.win(t, t0 - 0.15, t1 + 0.2, 0.15), x: X0 + U.clamp((t - t0) / (t1 - t0)) * 11 * PITCH - 6 });
      const a = sw(orT0, orT1), b = sw(andT0, andT1);
      const cur = a.on >= b.on ? a : b;
      s.sweep.setAttribute("x", cur.x.toFixed(1));
      A.setOpacity(s.sweep, Math.max(a.on, b.on));

      // Payment 10.
      A.setOpacity(s.band10, p10);
      A.show(s.p10, t, tP10, { dy: 0 });

      // ---- Order: column frames show the shared row order; payment 4 callback.
      A.show(s.order, t, tBecause - 0.1, { dy: 12 });
      s.guides.style.opacity = A.prog(t, tSame - 0.2, 0.6).toFixed(3);
      A.setOpacity(s.band4, A.prog(t, tP4, 0.4));
      A.show(s.p4, t, tP4, { dy: 0 });
    },
  });
})();
