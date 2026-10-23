// S06 — ETL. Three OLTP sources (Orders DB, Payments DB, Support tool) feed a pipeline Extract → Transform → Load into a teal
// "Data warehouse" cylinder (read-only for analysts). The "ETL" bracket lands when the narrator names it. Then the report scans the
// warehouse freely while the sources stay green: checkout is unaffected. Qualitative only: no numbers.
(function () {
  const C = K.C;

  /** Cylinder (database) with table-row stripes. o: x, y, w, h, ry, rows → { g, inner, stripes, clipId, w, h, ry } */
  function cylinder(svg, o, id) {
    const { x, y, w, h, ry = 30 } = o;
    const g = U.sv("g", { transform: `translate(${x},${y})` }, svg);
    const inner = U.sv("g", {}, g);
    const d = `M0 ${ry} V${h - ry} A${w / 2} ${ry} 0 0 0 ${w} ${h - ry} V${ry}`;
    U.sv("path", { d: d + ` A${w / 2} ${ry} 0 0 0 0 ${ry} Z`, fill: o.fill, stroke: o.stroke, "stroke-width": 3 }, inner);
    U.sv("ellipse", { cx: w / 2, cy: ry, rx: w / 2, ry, fill: o.topFill, stroke: o.stroke, "stroke-width": 3 }, inner);
    const clipId = "etl-cyl-" + id;
    const cp = U.sv("clipPath", { id: clipId }, U.sv("defs", {}, inner));
    U.sv("path", { d: d + " Z" }, cp);
    const stripes = [];
    for (let i = 0; i < (o.rows || 0); i++) {
      stripes.push(U.sv("rect", { x: 36, y: 2 * ry + 24 + i * 32, width: w - 72, height: 13, rx: 6.5, fill: C.line2 }, inner));
    }
    return { g, inner, stripes, clipId, w, h, ry };
  }

  /** Horizontally centred HTML holder (for chips/badges/pills). */
  function center(root, cx, y, w) {
    return U.el("div", { style: { position: "absolute", left: cx - w / 2 + "px", top: y + "px", width: w + "px", display: "flex", justifyContent: "center" } }, root);
  }

  R.scene("etl", {
    build(root, k) {
      const s = {};
      s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "From OLTP systems to a warehouse" });
      const svg = K.svgLayer(root);
      const Y = 560; // pipeline axis

      // Sources: three OLTP systems (healthy = green).
      s.srcHdr = K.label(svg, { x: 120, y: 346, text: "OLTP systems", anchor: "start", size: 30, weight: 700, fill: "muted" });
      s.src = ["Orders DB", "Payments DB", "Support tool"].map((name, i) =>
        K.box(svg, { x: 120, y: 372 + i * 140, w: 280, h: 96, label: name, icon: "database", iconInline: true, iconSize: 38, fs: 29, tone: "ok" }));

      // Pipeline stages.
      s.ext = K.box(svg, { x: 470, y: Y - 75, w: 200, h: 150, label: "Extract", icon: "stream" });
      s.tra = K.box(svg, { x: 740, y: Y - 75, w: 220, h: 150, label: "Transform", icon: "gear" });
      s.lod = K.box(svg, { x: 1030, y: Y - 75, w: 160, h: 150, label: "Load", icon: "batch" });
      s.extSub = K.text(root, { x: 570, y: 652, w: 236, cls: "small", align: "center", text: "periodic dump or stream of changes" });
      s.traSub1 = K.text(root, { x: 850, y: 652, w: 250, cls: "small", align: "center", text: "analysis-friendly schema" });
      s.traSub2 = K.text(root, { x: 850, y: 724, w: 220, cls: "small", align: "center", text: "+ cleaned up" });

      // Warehouse.
      s.wh = cylinder(svg, { x: 1270, y: 380, w: 250, h: 360, rows: 8, fill: "#0F2E2C", topFill: "#123B37", stroke: C.teal }, "wh");
      s.whLbl = K.label(svg, { x: 1395, y: 358, text: "Data warehouse", size: 32, weight: 800, fill: "teal" });
      s.scanG = U.sv("g", { "clip-path": `url(#${s.wh.clipId})` }, s.wh.inner);
      s.scan = U.sv("rect", { x: 0, y: 0, width: 250, height: 56, fill: C.teal, opacity: 0.4 }, s.scanG);
      s.scanEdge = U.sv("rect", { x: 0, y: 0, width: 250, height: 5, fill: C.teal }, s.scanG);
      s.roWrap = center(root, 1395, 764, 420);
      s.ro = K.badge(s.roWrap, { x: 0, y: 0, text: "Read-only for analysts", tone: "teal" });
      s.ro.style.position = "relative";
      s.copyLbl = K.text(root, { x: 1395, y: 830, w: 420, cls: "small", align: "center", text: "a separate copy" });

      // Report / analysts on the right.
      s.rep = K.box(svg, { x: 1610, y: Y - 75, w: 190, h: 150, label: "Report", icon: "chart", tone: "teal" });
      s.repSub = K.text(root, { x: 1705, y: 652, w: 200, cls: "small", align: "center", color: "teal", text: "scans freely" });

      // Arrows.
      s.aSrc = s.src.map((b) => K.arrow(svg, { from: b.right, to: s.ext.left, gapStart: 12, gapEnd: 12, curve: 0 }));
      s.aET = K.arrow(svg, { from: s.ext.right, to: s.tra.left, gapStart: 10, gapEnd: 10 });
      s.aTL = K.arrow(svg, { from: s.tra.right, to: s.lod.left, gapStart: 10, gapEnd: 10 });
      s.aLW = K.arrow(svg, { from: s.lod.right, to: [1270, Y], gapStart: 10, gapEnd: 10, tone: "teal" });
      s.aRep = K.arrow(svg, { from: s.rep.left, to: [1520, Y], gapStart: 12, gapEnd: 12, tone: "teal", width: 5 });
      s.pSrc = s.aSrc.map((a) => K.packets(svg, a, { n: 2, period: 1.5, r: 8 }));
      s.pET = K.packets(svg, s.aET, { n: 2, period: 1.1, r: 8 });
      s.pTL = K.packets(svg, s.aTL, { n: 2, period: 1.1, r: 8 });
      s.pLW = K.packets(svg, s.aLW, { n: 2, period: 1.1, r: 8 });
      s.pRep = K.packets(svg, s.aRep, { n: 2, period: 0.9, r: 9, tone: "teal" });

      // ETL bracket over the three stages.
      s.brG = U.sv("g", {}, svg);
      s.br = U.sv("path", { d: "M470,468 V444 H1190 V468", fill: "none", stroke: C.teal, "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round" }, s.brG);
      s.etl = K.label(svg, { x: 830, y: 424, text: "ETL", size: 60, weight: 800, fill: "teal", letterSpacing: "0.06em" });

      // Checkout unaffected.
      s.checks = s.src.map((b) => K.mark(svg, "check", { x: b.x + b.w - 4, y: b.y + 4, size: 40 }));
      s.pill = K.pill(root, { x: 120, y: 812, text: "Checkout: still fast", tone: "ok" });
      return s;
    },

    update(t, k, s) {
      const tOltp = k.word("sources", "OLTP") - 0.1;
      const tSrc = [k.word("sources", "orders"), k.word("sources", "payments"), k.word("sources", "support")].map((x) => x - 0.1);
      const tExt = k.word("extract", "extract") - 0.1, tDump = k.word("extract", "periodic") - 0.1;
      const tTra = k.word("transform", "transform") - 0.1, tSchema = k.word("transform", "schema") - 0.1, tClean = k.word("transform", "clean") - 0.1;
      const tLoad = k.word("load", "load") - 0.1, tWh = k.word("load", "warehouse") - 0.1, tCopy = k.word("load", "separate") - 0.1;
      const tRead = k.word("load", "analysts") - 0.1;
      const recap = [k.word(4, "extract"), k.word(4, "transform"), k.word(4, "load")].map((x) => x - 0.05);
      recap[1] = (recap[0] + recap[2]) / 2; // whisper puts "transform" too close to "extract,": space the flashes evenly
      const tEtl = k.word(4, "ETL") - 0.1;
      const tRep = k.word("freely", "report") - 0.1, tScan = k.word("freely", "scan") - 0.1, tCheck = k.word("freely", "without") - 0.1;

      A.show(s.title, t, 0.3);

      // Sources.
      A.show(s.srcHdr.inner, t, tOltp, { dy: 10 });
      s.src.forEach((b, i) => A.show(b.inner, t, tSrc[i], { dy: 14 }));

      // Extract.
      A.show(s.ext.inner, t, tExt, { dy: 14 });
      s.aSrc.forEach((a, i) => a.draw(t, tExt + 0.1 + i * 0.08, 0.6));
      const flowSrc = A.prog(t, tExt + 0.6, 0.4);
      s.pSrc.forEach((p, i) => p.update(t + i * 0.5, flowSrc));
      A.show(s.extSub, t, tDump, { dy: 10 });

      // Transform.
      A.show(s.tra.inner, t, tTra, { dy: 14 });
      s.aET.draw(t, tTra + 0.1, 0.5);
      s.pET.update(t, A.prog(t, tTra + 0.5, 0.4));
      A.show(s.traSub1, t, tSchema, { dy: 10 });
      A.show(s.traSub2, t, tClean, { dy: 10 });

      // Load → warehouse.
      A.show(s.lod.inner, t, tLoad, { dy: 14 });
      s.aTL.draw(t, tLoad + 0.1, 0.5);
      s.pTL.update(t, A.prog(t, tLoad + 0.5, 0.4));
      A.show(s.wh.inner, t, tWh, { dy: 16, s0: 0.94 });
      A.show(s.whLbl.inner, t, tWh, { dy: 10 });
      s.aLW.draw(t, tWh + 0.2, 0.5);
      s.pLW.update(t, A.prog(t, tWh + 0.6, 0.4));
      // Rows fill the warehouse as data arrives.
      s.wh.stripes.forEach((r, i) => {
        const f = A.prog(t, tWh + 0.6 + i * 0.22, 0.3);
        r.setAttribute("fill", A.mix(C.line2, "#2F8C7E", f));
      });
      A.show(s.copyLbl, t, tCopy, { dy: 10 });
      A.show(s.ro, t, tRead, { dy: 10 });

      // "Extract, transform, load": each stage pulses as it is named; then the ETL bracket lands.
      [s.ext, s.tra, s.lod].forEach((b, i) => {
        const p = A.win(t, recap[i], recap[i] + 0.55, 0.2);
        const etl = A.prog(t, tEtl, 0.5);
        if (etl > 0) b.setTone("teal", etl);
        else b.setTone("hl", p);
      });
      A.show(s.brG, t, tEtl, { dy: 10 });
      A.show(s.etl.inner, t, tEtl, { dy: 14, s0: 0.85, ease: A.E.outBack });

      // Report scans the warehouse freely.
      A.show(s.rep.inner, t, tRep, { dy: 14 });
      s.aRep.draw(t, tScan - 0.2, 0.5);
      const scanOn = A.prog(t, tScan, 0.4);
      s.pRep.update(t, A.prog(t, tScan + 0.2, 0.3));
      A.show(s.repSub, t, tScan, { dy: 10 });
      const P = 1.6, ph = (((t - tScan) / P) % 1 + 1) % 1;
      const y0 = s.wh.ry * 2 + 8, y1 = s.wh.h - s.wh.ry;
      const by = y0 + ph * (y1 - y0) - 36;
      s.scan.setAttribute("y", by.toFixed(1));
      s.scanEdge.setAttribute("y", (by + 56).toFixed(1));
      A.setOpacity(s.scanG, scanOn);

      // Sources stay green: checkout unaffected.
      s.checks.forEach((m, i) => A.show(m.inner, t, tCheck + i * 0.1, { d: 0.45, dy: 0, s0: 0.3, ease: A.E.outBack }));
      A.show(s.pill, t, k.word("freely", "checkout") - 0.1, { dy: 10 });
    },
  });
})();
