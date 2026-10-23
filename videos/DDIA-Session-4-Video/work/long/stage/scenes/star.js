// S08 — Star schema. A teal fact table (fact_payments, "one row per payment") builds in the middle: value columns, then key columns.
// Five dimension tables land around it as the narrator names them, each joined by a ray from the fact table (its key row flashes).
// dim_date expands to show date · weekday · is_holiday. Finally a faint star outline joins the rays: "Star schema".
(function () {
  const C = K.C;
  const CX = 960, CY = 545;                          // star centre (fact box centre)
  const FX = 720, FY = 345, FW = 480, FH = 400;       // fact box
  const ROW0 = 490, RS = 38;                          // fact column rows: first baseline, spacing
  const DW = 330, DH = 96;                            // dimension box (collapsed)
  const COLS = [
    { name: "amount", key: false },
    { name: "fee", key: false },
    { name: "merchant_id", key: true, dim: "merchant" },
    { name: "customer_id", key: true, dim: "customer" },
    { name: "method_id", key: true, dim: "method" },
    { name: "region_id", key: true, dim: "region" },
    { name: "date_id", key: true, dim: "date" },
  ];
  // Dimension boxes in angular order (top, then clockwise) = the star's tips. word = when the narrator names it (line `dims`).
  const DIMS = [
    { id: "date", name: "dim_date", sub: "when", x: CX, y: 242, word: "when" },
    { id: "customer", name: "dim_customer", sub: "who paid", x: 1595, y: 450, word: "who" },
    { id: "method", name: "dim_method", sub: "how they paid", x: 1345, y: 858, word: "how" },
    { id: "region", name: "dim_region", sub: "where", x: 575, y: 858, word: "where" },
    { id: "merchant", name: "dim_merchant", sub: "which merchant", x: 325, y: 450, word: "merchant" },
  ];
  const DATE_EXP = { w: 600, h: 180 };               // expanded dim_date (grows upward, bottom edge fixed)

  // Point where the ray from (CX,CY) towards (tx,ty) leaves a rect centred at (rx,ry) with half sizes hw,hh — from inside or outside.
  function exitPoint(ox, oy, tx, ty, rx, ry, hw, hh, fromInside) {
    const dx = tx - ox, dy = ty - oy;
    let best = Infinity;
    const cand = [];
    if (dx) { cand.push((rx - hw - ox) / dx, (rx + hw - ox) / dx); }
    if (dy) { cand.push((ry - hh - oy) / dy, (ry + hh - oy) / dy); }
    let pt = null;
    for (const s of cand) {
      if (s <= 0) continue;
      const x = ox + dx * s, y = oy + dy * s;
      if (x < rx - hw - 0.5 || x > rx + hw + 0.5 || y < ry - hh - 0.5 || y > ry + hh + 0.5) continue;
      if (s < best) { best = s; pt = [x, y]; }
    }
    return pt;
  }

  R.scene("star", {
    build(root, k) {
      const s = {};
      s.title = K.text(root, { x: 120, y: 110, cls: "h3", text: "Inside the warehouse" });
      s.lead = K.text(root, { x: 122, y: 178, cls: "lead", html: `Data sits in a <span style="color:${C.teal}">star schema</span>` });
      s.lead.style.whiteSpace = "nowrap";
      const svg = K.svgLayer(root);

      // Star outline (behind everything): tips at the dimension centres, inner vertices on an ellipse around the fact box.
      const pts = [];
      DIMS.forEach((d, i) => {
        const n = DIMS[(i + 1) % DIMS.length];
        pts.push([d.x, d.y]);
        let a1 = Math.atan2(d.y - CY, d.x - CX), a2 = Math.atan2(n.y - CY, n.x - CX);
        if (a2 < a1) a2 += Math.PI * 2;
        const a = (a1 + a2) / 2;
        // The bottom inner vertex tucks behind the fact box so the outline clears the label.
        pts.push(d.id === "method" ? [CX, FY + FH - 6] : [CX + 330 * Math.cos(a), CY + 255 * Math.sin(a)]);
      });
      s.starG = U.sv("g", {}, svg);
      s.starFill = U.sv("path", { d: "M" + pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" L") + " Z", fill: C.teal, opacity: 0 }, s.starG);
      s.starLine = U.sv("path", { d: s.starFill.getAttribute("d"), fill: "none", stroke: C.teal, "stroke-width": 3, "stroke-linejoin": "round", opacity: 0.55 }, s.starG);

      // Rays: fact box edge → dimension box edge.
      s.rays = {};
      DIMS.forEach((d) => {
        const a = exitPoint(CX, CY, d.x, d.y, CX, CY, FW / 2, FH / 2, true);
        const b = d.id === "date" ? [CX, d.y + DH / 2] : exitPoint(CX, CY, d.x, d.y, d.x, d.y, DW / 2, DH / 2, false);
        s.rays[d.id] = K.arrow(svg, { from: a, to: b, tone: "line", width: 4, head: false, gapStart: 6, gapEnd: 6 });
      });

      // Fact table.
      s.fact = U.sv("g", {}, svg);
      U.sv("rect", { x: FX, y: FY, width: FW, height: FH, rx: 20, fill: "#0F2E2C", stroke: C.teal, "stroke-width": 3.5 }, s.fact);
      s.factName = U.sv("text", { x: FX + 32, y: FY + 54, "font-size": 36, "font-weight": 800, fill: C.teal, "font-family": "JetBrains Mono, monospace" }, s.fact, "fact_payments");
      s.factSub = U.sv("text", { x: FX + 32, y: FY + 92, "font-size": 27, "font-weight": 600, fill: C.muted }, s.fact, "one row per payment");
      s.factRule = U.sv("rect", { x: FX + 24, y: FY + 114, width: FW - 48, height: 2, fill: C.teal, opacity: 0.35 }, s.fact);
      s.rows = COLS.map((c, i) => {
        const y = ROW0 + i * RS;
        const g = U.sv("g", {}, svg);
        const hi = U.sv("rect", { x: FX + 16, y: y - 28, width: FW - 32, height: 37, rx: 8, fill: C.hl, opacity: 0 }, g);
        const t = U.sv("text", { x: FX + 36, y, "font-size": 28, "font-weight": 650, fill: c.key ? C.teal : C.ink, "font-family": "JetBrains Mono, monospace" }, g, c.name);
        const tag = U.sv("text", { x: FX + FW - 34, y, "text-anchor": "end", "font-size": 26, "font-weight": 650, fill: c.key ? C.teal : C.muted }, g, c.key ? "key →" : "value");
        return { g, hi, t, tag, c };
      });

      // Dimension boxes.
      s.dims = {};
      DIMS.forEach((d) => {
        const g = U.sv("g", {}, svg);
        const rect = U.sv("rect", { x: d.x - DW / 2, y: d.y - DH / 2, width: DW, height: DH, rx: 18, fill: C.surface, stroke: C.line2, "stroke-width": 3 }, g);
        const name = U.sv("text", { x: d.x, y: d.y - 4, "text-anchor": "middle", "font-size": 30, "font-weight": 750, fill: C.ink, "font-family": "JetBrains Mono, monospace" }, g, d.name);
        const sub = U.sv("text", { x: d.x, y: d.y + 30, "text-anchor": "middle", "font-size": 26, "font-weight": 600, fill: C.muted }, g, d.sub);
        s.dims[d.id] = { g, rect, name, sub, d };
      });

      // dim_date's columns (shown when it expands).
      s.dateCols = ["date", "weekday", "is_holiday"].map((nm, i) => {
        const w = [130, 180, 220][i];
        const x = [CX - 285, CX - 135, CX + 65][i];
        const g = U.sv("g", {}, svg);
        const r = U.sv("rect", { x, y: 0, width: w, height: 44, rx: 10, fill: C.bg2, stroke: C.line2, "stroke-width": 2 }, g);
        const t = U.sv("text", { x: x + w / 2, y: 0, "text-anchor": "middle", "font-size": 26, "font-weight": 650, fill: C.ink, "font-family": "JetBrains Mono, monospace" }, g, nm);
        return { g, r, t, x, w };
      });

      // Filter chip for holidays.
      s.filter = K.chip(root, { x: 1300, y: 140, text: "WHERE is_holiday", accent: "hl", size: 28 });
      s.filter.querySelector("span").style.fontFamily = "var(--mono)";

      // Final label.
      const wrap = U.el("div", { style: { position: "absolute", left: "740px", top: "812px", width: "440px", display: "flex", justifyContent: "center" } }, root);
      s.label = U.el("div", { class: "k-text h3" }, wrap, "Star schema");
      Object.assign(s.label.style, { position: "relative", color: C.teal, whiteSpace: "nowrap" });
      return s;
    },

    update(t, k, s) {
      A.show(s.title, t, 0.3);
      A.show(s.lead, t, k.word("fact", "star") - 0.1, { dy: 12 });

      // Fact table: box at "one big table", its name at "fact table", "one row per payment" at "row".
      const tBox = k.word("fact", "one") - 0.1;
      A.show(s.fact, t, tBox, { dy: 16, s0: 0.97 });
      A.setOpacity(s.factName, A.prog(t, k.word("fact", "fact table") - 0.1, 0.5));
      A.setOpacity(s.factSub, A.prog(t, k.word(1, "row") - 0.05, 0.5));
      A.setOpacity(s.factRule, 0.35 * A.prog(t, k.word(1, "row") - 0.05, 0.5));

      // Columns: values at "amount"/"fee", keys at "others are keys".
      const tAmt = k.word("keys", "amount") - 0.1, tFee = k.word("keys", "fee") - 0.1, tKeys = k.word("keys", "keys") - 0.1;
      const tDate = k.cue("date"), tStar = k.cue("star");
      s.rows.forEach((r, i) => {
        const t0 = i === 0 ? tAmt : i === 1 ? tFee : tKeys + (i - 2) * 0.14;
        A.show(r.g, t, t0, { dy: 0, dx: -14, d: 0.45 });
        // Value rows glow while "describe the payment itself" is on; key rows flash when their dimension lands.
        let h = 0;
        if (!r.c.key) h = 0.22 * A.win(t, t0, tKeys, 0.3);
        else {
          const d = DIMS.find((x) => x.id === r.c.dim);
          const td = k.word("dims", d.word) - 0.1;
          // Flash ends when the next dimension is named, so only one key row is lit at a time.
          const order = ["merchant", "who", "how", "where", "when"], j = order.indexOf(d.word);
          const tNext = j < 4 ? k.word("dims", order[j + 1]) - 0.1 : td + 1.1;
          h = 0.26 * A.win(t, td, tNext, 0.18);
          if (r.c.dim === "date") h = Math.max(h, 0.26 * A.win(t, k.word("date", "date") - 0.1, tStar, 0.3));
        }
        r.hi.setAttribute("opacity", h.toFixed(3));
      });

      // Dimension boxes + rays, as each is named.
      const tRays = k.word("star", "around") - 0.1;
      const glow = A.prog(t, tRays, 0.6);
      DIMS.forEach((d) => {
        const td = k.word("dims", d.word) - 0.1;
        const dm = s.dims[d.id];
        A.show(dm.g, t, td, { dy: 0, s0: 0.85, d: 0.5, ease: A.E.outBack });
        const ray = s.rays[d.id];
        ray.draw(t, td - 0.05, 0.45);
        ray.path.setAttribute("stroke", A.mix(C.line2, C.teal, 0.35 + 0.65 * glow));
        ray.path.setAttribute("stroke-width", (4 + 2 * glow).toFixed(2));
        const lit = A.prog(t, td, 0.5);
        dm.rect.setAttribute("stroke", A.mix(C.line2, C.teal, lit * (0.55 + 0.45 * glow)));
      });

      // dim_date: highlight at "date", expand at "its own dimension", columns appear, is_holiday lights at "holidays".
      const dd = s.dims.date;
      const pHi = A.prog(t, k.word("date", "date") - 0.1, 0.4);
      const pExp = A.prog(t, k.word("date", "own") - 0.1, 0.7, A.E.inOutCubic);
      const w = U.lerp(DW, DATE_EXP.w, pExp), h = U.lerp(DH, DATE_EXP.h, pExp);
      const bottom = DIMS[0].y + DH / 2, top = bottom - h;
      dd.rect.setAttribute("x", (CX - w / 2).toFixed(1));
      dd.rect.setAttribute("width", w.toFixed(1));
      dd.rect.setAttribute("y", top.toFixed(1));
      dd.rect.setAttribute("height", h.toFixed(1));
      dd.rect.setAttribute("stroke", A.mix(C.teal, C.hl, pHi * (1 - A.prog(t, tStar, 0.6))));
      dd.rect.setAttribute("fill", A.mix(C.surface, "#3A3216", 0.5 * pHi * (1 - A.prog(t, tStar, 0.6))));
      dd.name.setAttribute("y", (top + 40).toFixed(1));
      dd.sub.setAttribute("y", (top + 74).toFixed(1));
      const tHol = k.word("date", "holidays") - 0.1;
      s.dateCols.forEach((c, i) => {
        const y = top + h - 66;
        c.r.setAttribute("y", y.toFixed(1));
        c.t.setAttribute("y", (y + 31).toFixed(1));
        A.setOpacity(c.g, A.prog(t, k.word("date", "own") + 0.35 + i * 0.18, 0.4) * (pExp > 0.6 ? 1 : 0));
        if (i === 2) {
          const ph = A.prog(t, tHol, 0.4);
          c.r.setAttribute("stroke", A.mix(C.line2, C.hl, ph));
          c.r.setAttribute("fill", A.mix(C.bg2, "#3A3216", ph));
          c.t.setAttribute("fill", A.mix(C.ink, C.hl, ph));
        }
      });
      A.show(s.filter, t, k.word("date", "filter") - 0.1, { dy: 10, dx: -10 });

      // Star: outline draws at "like rays", fill eases in, label at "star".
      const pStar = A.draw(s.starLine, t, k.word("star", "rays") - 0.1, 1.0);
      s.starLine.style.visibility = pStar > 0.001 ? "visible" : "hidden";
      s.starFill.setAttribute("opacity", (0.10 * A.prog(t, k.word("star", "rays") + 0.5, 0.8)).toFixed(3));
      A.show(s.label, t, k.word("star", "star") - 0.1, { dy: 12 });
    },
  });
})();
