// S04 — Contention. One database serves checkout (yellow transaction dots) and the report (a teal scan sweeping every row). The scan
// takes disk, memory and CPU; the dots queue up and turn red. Then: keep ad hoc analytics off the OLTP database, and give analytics a
// database of its own (teal "?" placeholder that Part 01 fills in). Qualitative only: no numbers.
(function () {
  const C = K.C;

  /** Cylinder (database) with table-row stripes. o: x, y, w, h, ry, rows → { g, inner, body, top, stripes, clipId, setStroke } */
  function cylinder(svg, o, id) {
    const { x, y, w, h, ry = 34 } = o;
    const g = U.sv("g", { transform: `translate(${x},${y})` }, svg);
    const inner = U.sv("g", {}, g);
    const d = `M0 ${ry} V${h - ry} A${w / 2} ${ry} 0 0 0 ${w} ${h - ry} V${ry}`;
    const body = U.sv("path", { d: d + ` A${w / 2} ${ry} 0 0 0 0 ${ry} Z`, fill: o.fill || C.surface, stroke: o.stroke || C.line2, "stroke-width": 3,
      "stroke-dasharray": o.dash || null }, inner);
    const top = U.sv("ellipse", { cx: w / 2, cy: ry, rx: w / 2, ry, fill: o.topFill || C.surface2, stroke: o.stroke || C.line2, "stroke-width": 3,
      "stroke-dasharray": o.dash || null }, inner);
    const clipId = "cyl-" + id;
    const cp = U.sv("clipPath", { id: clipId }, U.sv("defs", {}, inner));
    U.sv("path", { d: d + " Z" }, cp);
    const stripes = [];
    const n = o.rows || 0;
    for (let i = 0; i < n; i++) {
      stripes.push(U.sv("rect", { x: 40, y: 2 * ry + 26 + i * 34, width: w - 80, height: 14, rx: 7, fill: C.line2 }, inner));
    }
    return {
      g, inner, body, top, stripes, clipId, w, h, ry,
      setStroke(c) { body.setAttribute("stroke", c); top.setAttribute("stroke", c); },
    };
  }

  R.scene("contention", {
    build(root, k) {
      const s = {};
      s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "One database, two workloads" });
      const svg = K.svgLayer(root);
      const Y = 520; // flow axis

      // Left: customers / checkout.
      s.cust = K.box(svg, { x: 120, y: Y - 75, w: 230, h: 150, label: "Customers", icon: "users" });
      // Centre: the one database.
      s.db = cylinder(svg, { x: 600, y: 330, w: 360, h: 380, rows: 8 }, "main");
      s.dbLbl = K.label(svg, { x: 780, y: 304, text: "Production database", size: 32, weight: 750, fill: "ink" });
      s.dbLbl2 = K.label(svg, { x: 780, y: 304, text: "OLTP database", size: 32, weight: 800, fill: "hl" });
      // Scan band, clipped to the database body.
      s.scanG = U.sv("g", { "clip-path": `url(#${s.db.clipId})` }, s.db.inner);
      s.scan = U.sv("rect", { x: 0, y: 0, width: 360, height: 64, fill: C.teal, opacity: 0.42 }, s.scanG);
      s.scanEdge = U.sv("rect", { x: 0, y: 0, width: 360, height: 5, fill: C.teal }, s.scanG);

      // Right: the report.
      s.rep = K.box(svg, { x: 1570, y: Y - 75, w: 230, h: 150, label: "Report", icon: "chart", tone: "teal" });

      s.aCust = K.arrow(svg, { from: s.cust.right, to: [600, Y], gapStart: 14, gapEnd: 14 });
      s.aRep = K.arrow(svg, { from: s.rep.left, to: [960, Y], gapStart: 14, gapEnd: 14, tone: "teal", width: 10 });
      s.scanLbl = K.label(svg, { x: 1265, y: Y - 34, text: "Scan every row", size: 30, weight: 700, fill: "teal" });
      s.pCust = K.packets(svg, s.aCust, { n: 3, period: 0.9, r: 10 });
      s.xRep = K.mark(svg, "x", { x: 1265, y: Y, size: 58 });

      // Queue of waiting transactions at the database's door.
      s.queue = Array.from({ length: 7 }, (_, i) => U.sv("circle", { cx: 556 - i * 28, cy: Y, r: 10, fill: C.hl }, svg));

      // Shared resources under the database: yellow = transactions, teal = the scan.
      s.meters = ["Disk", "Memory", "CPU"].map((name, i) => {
        const cx = 660 + i * 120;
        const g = U.sv("g", {}, svg);
        K.label(g, { x: cx, y: 760, text: name, size: 26, weight: 650, fill: "muted" });
        U.sv("rect", { x: cx - 52, y: 776, width: 104, height: 16, rx: 8, fill: C.line }, g);
        const tx = U.sv("rect", { x: cx - 52, y: 776, width: 20, height: 16, rx: 8, fill: C.hl }, g);
        const sc = U.sv("rect", { x: cx - 32, y: 776, width: 0, height: 16, rx: 6, fill: C.teal }, g);
        return { g, sc, cx, name };
      });

      s.pill = K.pill(root, { x: 120, y: Y + 102, text: "Checkout: fast", tone: "ok" });

      // Policy chip.
      const wrap = U.el("div", { style: { position: "absolute", left: "120px", top: "838px", width: "1680px", display: "flex", justifyContent: "center" } }, root);
      s.chip = K.chip(wrap, { text: "Keep ad hoc analytics off the OLTP database", accent: "hl", icon: "warning" });
      s.chip.style.position = "relative";

      // Separate: analytics gets its own database (placeholder for Part 01).
      s.wh = cylinder(svg, { x: 1040, y: 330, w: 300, h: 380, fill: "#0F2E2C", topFill: "#123B37", stroke: C.teal, dash: "12 10" }, "wh");
      s.whQ = K.label(s.wh.inner, { x: 150, y: 270, text: "?", size: 150, weight: 800, fill: "teal" });
      s.whLbl = K.label(svg, { x: 1190, y: 304, text: "Its own database", size: 32, weight: 800, fill: "teal" });
      s.aWh = K.arrow(svg, { from: s.rep.left, to: [1340, Y], gapStart: 14, gapEnd: 14, tone: "teal" });
      s.pWh = K.packets(svg, s.aWh, { n: 2, period: 1.1, r: 9, tone: "teal" });
      return s;
    },

    update(t, k, s) {
      const tScan = k.word("scan", "scan") - 0.1, tRep = k.word("scan", "report") - 0.1;
      const tQueue = k.word("contend", "queue") - 0.1, tSlow = k.word("contend", "slow") - 0.1;
      const tRel = k.word("reluctant", "reluctant") - 0.1, tSep = k.word("separate", "database") - 0.1;
      const tGive = k.word("separate", "give") - 0.1;

      A.show(s.title, t, 0.1);
      A.show(s.cust.inner, t, 0.3, { dy: 14 });
      A.show(s.db.inner, t, k.word("scan", "one database") - 0.1, { dy: 14 });
      // Label switches from "Production database" to "OLTP database" when analytics moves out.
      const sep = A.prog(t, tSep, 0.6);
      A.show(s.dbLbl.inner, t, k.word("scan", "one database"), { dy: 10, out: tSep });
      A.show(s.dbLbl2.inner, t, tSep + 0.1, { dy: 10 });
      s.aCust.draw(t, 0.5, 0.6);
      A.setOpacity(s.pill, A.prog(t, 0.8, 0.5));

      // Report + scan arrow.
      A.show(s.rep.inner, t, tRep, { dy: 14 });
      s.aRep.draw(t, tScan, 0.6);
      const offOld = 1 - A.prog(t, tGive, 0.5);
      s.aRep.setOpacity(Math.min(A.prog(t, tScan, 0.1), 1 - 0.55 * A.prog(t, tRel + 0.3, 0.4)) * offOld);
      A.show(s.scanLbl.inner, t, tScan + 0.2, { dy: 8, out: tRel });
      A.show(s.xRep.inner, t, tRel + 0.3, { d: 0.45, dy: 0, s0: 0.3, ease: A.E.outBack, out: tGive });

      // Scan sweeps every row top → bottom, again and again, until analytics leaves.
      const scanOn = A.prog(t, tScan, 0.4) * (1 - A.prog(t, tGive, 0.5));
      const P = 1.7, ph = ((t - tScan) / P % 1 + 1) % 1;
      const y0 = s.db.ry * 2 + 10, y1 = s.db.h - s.db.ry;
      const by = y0 + ph * (y1 - y0) - 40;
      s.scan.setAttribute("y", by.toFixed(1));
      s.scanEdge.setAttribute("y", (by + 64).toFixed(1));
      A.setOpacity(s.scanG, scanOn * Math.min(1, ph / 0.15));
      s.db.stripes.forEach((r) => {
        const ry = +r.getAttribute("y");
        // Decaying trail behind the band: rows fade gradually, never all reset in one frame.
        const span = y1 - y0, d = ((by + 64 - ry) % span + span) % span, trail = 1 - d / span; // cyclic: no jump on wrap
        r.setAttribute("fill", A.mix(C.line2, C.teal, scanOn * (0.35 + 0.4 * trail)));
      });

      // Contention: shared resources fill with the scan, as each is named.
      const tRes = [k.word("contend", "disk"), k.word("contend", "memory"), k.word("contend", "CPU")].map((x) => x - 0.1);
      const metersOn = A.prog(t, k.word("contend", "competes") - 0.1, 0.5);
      s.meters.forEach((m, i) => {
        A.setOpacity(m.g, metersOn);
        const f = A.prog(t, tRes[i], 0.7) * (1 - A.prog(t, tGive + 0.3, 0.8));
        m.sc.setAttribute("width", (f * 84).toFixed(1));
      });

      // Transactions: flowing dots → a growing red queue → flowing again once analytics has its own database.
      const queued = A.prog(t, tQueue, 0.4) * (1 - A.prog(t, tSep + 0.2, 0.5));
      const red = A.prog(t, tSlow, 0.6) * (1 - sep);
      s.pCust.update(t, (1 - queued) * A.prog(t, 1.0, 0.4), { tone: "hl" });
      s.queue.forEach((c, i) => {
        const on = A.prog(t, tQueue + i * 0.16, 0.3) * (1 - A.prog(t, tSep + 0.1 + (6 - i) * 0.03, 0.4));
        A.setOpacity(c, on);
        c.setAttribute("fill", A.mix(C.hl, C.bad, red));
      });
      const slowNow = red > 0.5;
      K.setPill(s.pill, slowNow ? "Checkout: slow" : "Checkout: fast", slowNow ? "bad" : "ok");
      s.aCust.setTone(slowNow ? "bad" : "line");
      s.cust.setTone("bad", red);
      s.db.setStroke(A.mix(C.line2, C.bad, red));

      // Policy chip.
      A.show(s.chip, t, tRel, { dy: 12 });

      // Separate: analytics gets a database of its own (teal placeholder).
      A.show(s.wh.inner, t, tGive + 0.2, { dy: 16, s0: 0.92 });
      A.show(s.whLbl.inner, t, tSep, { dy: 10 });
      s.aWh.draw(t, tSep + 0.1, 0.5);
      s.pWh.update(t, A.prog(t, tSep + 0.5, 0.4));
    },
  });
})();
