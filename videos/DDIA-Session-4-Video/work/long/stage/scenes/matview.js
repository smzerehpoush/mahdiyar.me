// S20 — Materialized views. Three readers (dashboard, report, ad-hoc query) keep sending the same SUM(amount) GROUP BY day to the
// fact table: every read is a full scan (sweep + "Full scans" counter). `virtual`: a dashed "Virtual view" card holds the saved query;
// reads go through it and it expands into the same scan. `materialized`: a solid purple card stores the result (daily totals) on disk;
// reads switch to it (green, "Cheap read") and the scan counter freezes. `update`: a new payment lands in the fact table and an extra
// write arrow updates the view (Jun 4 flashes; "Every write costs more"). `warehouses`: "OLTP: rarely used" · "Read-heavy warehouse: worth it".
(function () {
  const C = K.C;
  const FX = 120, FY = 270, FW = 360, FH = 540;            // fact table
  const ROWS = 11, RY0 = FY + 125, RSP = 32, RH = 20;      // fact rows
  const VX = 640, VY = 270, VW = 620, VH = 220;            // virtual view card
  const MX = 640, MY = 540, MW = 620, MH = 265;            // materialized view card
  const DX = 1440, DW = 360, DH = 110, DYS = [300, 455, 610]; // readers
  const NEWY = FY + FH - 58;                               // new payment row (top)
  const WY = NEWY + 20;                                    // write arrow y

  const grp = (parent, x, y) => { const g = U.sv("g", { transform: `translate(${x},${y})` }, parent); const inner = U.sv("g", {}, g); return { g, inner }; };

  R.scene("matview", {
    build(root, k) {
      const s = {};
      const cube = k.data.cube;
      s.title = K.text(root, { x: 120, y: 110, cls: "h3", text: "Materialized views" });
      s.badge = K.badge(root, { x: 0, y: 118, right: 120, text: "Simplified illustration" }); // same spot as in cube.js

      // Aggregate chips (top right), one per spoken aggregate.
      const aggWrap = U.el("div", { style: { position: "absolute", left: "600px", top: "112px", width: "830px", display: "flex", justifyContent: "flex-end", gap: "14px" } }, root);
      s.aggs = ["COUNT", "SUM", "AVG", "MIN", "MAX"].map((a) => {
        const c = K.chip(aggWrap, { text: a, accent: "purple", size: 28 });
        c.style.position = "relative";
        c.querySelector("span").style.fontFamily = "var(--mono)";
        return c;
      });

      const svg = K.svgLayer(root);

      // Arrows first (behind boxes).
      s.rA = DYS.map((y, i) => K.arrow(svg, { from: [DX, y + DH / 2], to: [FX + FW, FY + 190 + i * 110], gapStart: 14, gapEnd: 14, tone: "line" }));
      s.rP = s.rA.map((a) => K.packets(svg, a, { n: 2, period: 1.6 }));
      s.vA = DYS.map((y, i) => K.arrow(svg, { from: [DX, y + DH / 2], to: [VX + VW, VY + 70 + i * 40], gapStart: 14, gapEnd: 14, tone: "line" }));
      s.vP = s.vA.map((a) => K.packets(svg, a, { n: 2, period: 1.6 }));
      s.vF = K.arrow(svg, { from: [VX, VY + 110], to: [FX + FW, VY + 110], gapStart: 12, gapEnd: 12, tone: "purple" });
      s.vFP = K.packets(svg, s.vF, { n: 2, period: 0.8 });
      s.mA = DYS.map((y, i) => K.arrow(svg, { from: [DX, y + DH / 2], to: [MX + MW, MY + 75 + i * 55], gapStart: 14, gapEnd: 14, tone: "ok" }));
      s.mP = s.mA.map((a) => K.packets(svg, a, { n: 2, period: 0.9 }));
      s.wA = K.arrow(svg, { from: [FX + FW, WY], to: [MX, WY], gapStart: 12, gapEnd: 12, tone: "bad" });
      s.wP = K.packets(svg, s.wA, { n: 1, period: 1.4, tone: "bad" });
      s.wLbl = K.label(svg, { x: (FX + FW + MX) / 2, y: WY - 22, text: "update", size: 26, weight: 750, fill: "bad" });

      // Query text above the direct arrows (repeat beat).
      s.q = K.label(svg, { x: 960, y: 262, text: "SUM(amount) GROUP BY day", size: 32, weight: 700, fill: "purple", mono: true });

      // Fact table.
      s.fact = grp(svg, FX, FY);
      U.sv("rect", { x: 0, y: 0, width: FW, height: FH, rx: 20, fill: C.surface, stroke: C.line2, "stroke-width": 3 }, s.fact.inner);
      U.sv("text", { x: 28, y: 52, "font-size": 30, "font-weight": 750, fill: C.ink, "font-family": "JetBrains Mono, monospace" }, s.fact.inner, "fact_payments");
      U.sv("text", { x: 28, y: 90, "font-size": 26, "font-weight": 600, fill: C.muted }, s.fact.inner, "millions of rows");
      U.sv("rect", { x: 22, y: 106, width: FW - 44, height: 2, fill: C.line2 }, s.fact.inner);
      s.rows = [];
      for (let i = 0; i < ROWS; i++) {
        const y = RY0 - FY + i * RSP;
        U.sv("rect", { x: 24, y, width: FW - 48, height: RH, rx: 5, fill: C.surface2 }, s.fact.inner);
        s.rows.push(U.sv("rect", { x: 24, y, width: FW - 48, height: RH, rx: 5, fill: C.purple, opacity: 0 }, s.fact.inner));
      }
      s.newRow = grp(svg, FX + 24, NEWY);
      U.sv("rect", { x: 0, y: 0, width: FW - 48, height: 40, rx: 9, fill: C.hl }, s.newRow.inner);
      U.sv("text", { x: (FW - 48) / 2, y: 29, "text-anchor": "middle", "font-size": 26, "font-weight": 750, fill: "#0F1B2D" }, s.newRow.inner, "+ new payment");

      // Virtual view card (dashed: nothing stored).
      s.virt = grp(svg, VX, VY);
      U.sv("rect", { x: 0, y: 0, width: VW, height: VH, rx: 22, fill: C.bg2, stroke: C.purple, "stroke-width": 3, "stroke-dasharray": "12 10" }, s.virt.inner);
      U.sv("text", { x: 30, y: 54, "font-size": 36, "font-weight": 800, fill: C.ink }, s.virt.inner, "Virtual view");
      U.sv("text", { x: VW - 30, y: 52, "text-anchor": "end", "font-size": 26, "font-weight": 600, fill: C.muted }, s.virt.inner, "a saved query");
      s.vq = U.sv("g", {}, s.virt.inner);
      U.sv("text", { x: 30, y: 108, "font-size": 26, "font-weight": 600, fill: C.purple, "font-family": "JetBrains Mono, monospace" }, s.vq, "SELECT day, SUM(amount)");
      U.sv("text", { x: 30, y: 144, "font-size": 26, "font-weight": 600, fill: C.purple, "font-family": "JetBrains Mono, monospace" }, s.vq, "FROM fact_payments GROUP BY day");
      s.vRerun = U.sv("text", { x: 30, y: 194, "font-size": 28, "font-weight": 750, fill: C.hl }, s.virt.inner, "↻ expanded and rerun on every read");

      // Materialized view card (solid: the result is stored).
      s.mat = grp(svg, MX, MY);
      U.sv("rect", { x: 0, y: 0, width: MW, height: MH, rx: 22, fill: "#241F45", stroke: C.purple, "stroke-width": 3.5 }, s.mat.inner);
      U.sv("text", { x: 30, y: 56, "font-size": 36, "font-weight": 800, fill: C.ink }, s.mat.inner, "Materialized view");
      s.matSub = U.sv("text", { x: 30, y: 98, "font-size": 26, "font-weight": 600, fill: C.muted }, s.mat.inner, "stored result · $ thousands");
      s.disk = K.svgIcon(s.mat.inner, "disk", { x: MW - 82, y: 20, size: 52, color: "purple" });
      s.cells = cube.dates.map((d, i) => {
        const cg = grp(s.mat.inner, 30 + i * 141, 122);
        const r = U.sv("rect", { x: 0, y: 0, width: 129, height: 112, rx: 12, fill: C.bg2, stroke: C.purple, "stroke-width": 2 }, cg.inner);
        U.sv("text", { x: 64.5, y: 38, "text-anchor": "middle", "font-size": 26, "font-weight": 600, fill: C.muted }, cg.inner, d);
        U.sv("text", { x: 64.5, y: 90, "text-anchor": "middle", "font-size": 44, "font-weight": 800, fill: C.ink }, cg.inner, String(cube.rowTotals[i]));
        return { ...cg, r };
      });

      // Readers.
      const names = ["Daily dashboard", "Monthly report", "Ad-hoc query"];
      s.dash = DYS.map((y, i) => K.box(svg, { x: DX, y, w: DW, h: DH, label: names[i], icon: "chart", iconInline: true, iconSize: 40, fs: 28 }));

      // HTML overlays.
      s.counter = K.text(root, { x: FX, y: FY + FH + 16, cls: "label", html: "" });
      s.counter.style.whiteSpace = "nowrap";
      s.cheap = K.pill(root, { x: DX, y: 752, text: "Cheap read", tone: "ok" });

      const row = U.el("div", { style: { position: "absolute", left: "120px", top: "876px", width: "1680px", display: "flex", justifyContent: "flex-end", gap: "18px" } }, root);
      s.cost = K.chip(row, { text: "Every write costs more", accent: "bad", size: 28 });
      s.oltp = K.chip(row, { text: "OLTP: rarely used", accent: "muted", size: 28 });
      s.wh = K.chip(row, { text: "Read-heavy warehouse: worth it", accent: "ok", size: 28 });
      [s.cost, s.oltp, s.wh].forEach((c) => (c.style.position = "relative"));
      return s;
    },

    update(t, k, s) {
      const w = (ref, n, i = 0) => k.word(ref, n, i);
      const tVirt = w("virtual", "virtual") - 0.1;
      const tExp = w("virtual", "expanded") - 0.1;
      const tMat = w("materialized", "materialized") - 0.05;
      const tCopy = w("materialized", "copy") - 0.1;
      const tRead = w("materialized", "reading") - 0.1;
      const tCheap = w("materialized", "cheap") - 0.1;
      const tNew = w("update", "changes") - 0.25;
      const tUpd = w("update", "updated") - 0.15;
      const tEvery = w("update", "every") - 0.1;

      A.show(s.title, t, 0.3);
      A.show(s.badge, t, tCopy, { dy: 10 });
      ["counts", "sums", "averages", "minimums", "maximums"].forEach((wd, i) => A.show(s.aggs[i], t, w("repeat", wd) - 0.1, { dy: 12, d: 0.45 }));

      // Fact table + readers.
      A.show(s.fact.inner, t, w("repeat", "Warehouse") - 0.05, { dy: 16 });
      s.dash.forEach((d, i) => A.show(d.inner, t, w("repeat", "queries") - 0.05 + i * 0.15, { dy: 16 }));

      // Repeat: direct reads to the fact table.
      const tAsk = w("repeat", "keep") - 0.1;
      const directOn = A.prog(t, tAsk + 0.5, 0.4) * (1 - A.prog(t, tVirt - 0.3, 0.4));
      s.rA.forEach((a, i) => { a.draw(t, tAsk + i * 0.1, 0.6); a.setOpacity(1 - A.prog(t, tVirt - 0.3, 0.4)); });
      s.rP.forEach((p, i) => p.update(t + i * 0.53, directOn));
      A.show(s.q.inner, t, w("repeat", "same") - 0.1, { dy: 10, out: tVirt - 0.3 });

      // Virtual: card, then reads go through it and it expands into the scan.
      A.show(s.virt.inner, t, tVirt, { dy: 16 });
      const vDim = 1 - 0.55 * A.prog(t, tRead, 0.5);
      s.virt.g.style.opacity = vDim.toFixed(3);
      A.setOpacity(s.vq, A.prog(t, w("virtual", "saved") - 0.1, 0.5));
      A.setOpacity(s.vRerun, A.prog(t, w("virtual", "rerun") - 0.1, 0.5));
      const vOut = 1 - A.prog(t, tRead, 0.4);
      s.vA.forEach((a, i) => { a.draw(t, tExp + i * 0.1, 0.6); a.setOpacity(vOut); });
      s.vF.draw(t, tExp + 0.45, 0.5); s.vF.setOpacity(vOut);
      const viaOn = A.prog(t, tExp + 0.7, 0.4) * vOut;
      s.vP.forEach((p, i) => p.update(t + i * 0.53, viaOn));
      s.vFP.update(t, A.prog(t, tExp + 1.0, 0.4) * vOut);

      // Fact-table scan sweep while queries hit it (repeat, then through the virtual view).
      const scan = Math.max(directOn, A.prog(t, tExp + 0.9, 0.4) * vOut);
      const ph = ((t / 1.1) % 1 + 1) % 1;
      s.rows.forEach((r, i) => {
        const d = (i + 0.5) / ROWS - (ph * 1.4 - 0.2);
        r.setAttribute("opacity", (0.6 * scan * Math.exp(-d * d * 60)).toFixed(3));
      });
      // Counter: full scans so far (one per 0.6 s of active scanning), frozen once reads move to the materialized view.
      const tC0 = w("repeat", "same") - 0.1;
      const act = Math.max(0, Math.min(t, tVirt - 0.3) - tC0) + Math.max(0, Math.min(t, tRead) - (tExp + 0.9));
      const n = 1 + Math.floor(act / 0.6);
      const frozen = t >= tRead;
      s.counter.innerHTML = `Full scans: <span style="color:${frozen ? C.ink : C.hl};font-weight:800">${n}</span>`;
      s.counter.style.color = C.muted;
      A.show(s.counter, t, tC0, { dy: 10 });

      // Materialized: stored result, then reads switch to it.
      A.show(s.mat.inner, t, tMat, { dy: 16 });
      A.setOpacity(s.matSub, A.prog(t, tCopy, 0.5));
      s.cells.forEach((c, i) => A.show(c.inner, t, tCopy + 0.1 + i * 0.12, { dy: 10, d: 0.45 }));
      A.show(s.disk.inner, t, w("materialized", "disk") - 0.1, { dy: 0, s0: 0.6, d: 0.5, ease: A.E.outBack });
      s.mA.forEach((a, i) => a.draw(t, tRead + 0.1 + i * 0.1, 0.6));
      const matOn = A.prog(t, tRead + 0.6, 0.4);
      s.mP.forEach((p, i) => p.update(t + i * 0.3, matOn));
      s.dash.forEach((d) => d.setTone("ok", 0.6 * A.prog(t, tCheap, 0.5)));
      A.show(s.cheap, t, tCheap, { dy: 10 });

      // Update: new payment → extra write into the view.
      A.show(s.newRow.inner, t, tNew, { dy: -18, d: 0.5 });
      s.wA.draw(t, tUpd - 0.5, 0.5);
      A.show(s.wLbl.inner, t, tUpd, { dy: 8 });
      s.wP.update(t - tUpd, A.prog(t, tUpd, 0.3));
      // Jun 4 flashes on each write arrival (packet reaches the view once per period).
      const ph4 = (((t - tUpd) / 1.4) % 1 + 1) % 1;
      const flash = t > tUpd + 1.2 ? Math.exp(-Math.pow((ph4 - 0.98 + 1) % 1, 2) * 30) : 0;
      const f4 = Math.max(A.win(t, tUpd + 0.4, tUpd + 1.3, 0.3), flash);
      s.cells[3].r.setAttribute("stroke", A.mix(C.purple, C.hl, f4));
      s.cells[3].r.setAttribute("fill", A.mix(C.bg2, "#3A3216", f4));
      s.cells[3].r.setAttribute("stroke-width", (2 + 2 * f4).toFixed(2));
      A.show(s.cost, t, tEvery, { dy: 10 });

      // Verdict.
      A.show(s.oltp, t, w("warehouses", "OLTP") - 0.1, { dy: 10 });
      A.show(s.wh, t, w("warehouses", "read-heavy") - 0.1, { dy: 10 });
    },
  });
})();
