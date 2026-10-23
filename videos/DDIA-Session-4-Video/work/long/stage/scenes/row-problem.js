// S11 — row-problem. The report as a query uses 4 of 100+ columns; a row store still loads whole rows, parses them, and throws
// almost everything away. One shared column grid: the wide "schema" strip on top and the stored records below line up, so the
// four orange columns read straight down into the records.
(function () {
  const NCOL = 100;
  const X0 = 136, X1 = 1784, PITCH = (X1 - X0) / NCOL, CW = PITCH - 4; // column grid (shared by strip and records)
  const USED = [
    { i: 4, name: "date" },
    { i: 23, name: "country" },
    { i: 52, name: "amount" },
    { i: 79, name: "status" },
  ];
  const isUsed = (i) => USED.some((u) => u.i === i);
  const colX = (i) => X0 + i * PITCH + 2;
  const NREC = 6, REC_Y0 = 632, REC_H = 34, REC_GAP = 12;
  const STRIP_Y = 380, STRIP_H = 80;

  R.scene("row-problem", {
    build(root, k) {
      const C = K.C, s = {};
      s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Analytics needs a few columns" });
      s.badge = K.badge(root, { x: 0, y: 128, right: 120, text: "Simplified illustration" });

      // Beat `query`: the report as SQL + "last quarter".
      s.qrow = U.el("div", {}, root);
      Object.assign(s.qrow.style, { position: "absolute", left: "120px", top: "222px", display: "flex", gap: "18px", alignItems: "center" });
      s.query = K.chip(s.qrow, { text: "SELECT country, SUM(amount) … WHERE status = 'paid' GROUP BY country", accent: "orange", icon: "search" });
      Object.assign(s.query.style, { position: "relative", fontFamily: "var(--mono)", fontWeight: 600, fontSize: "28px" });
      s.quarter = K.chip(s.qrow, { text: "last quarter", accent: "hl", icon: "calendar" });
      Object.assign(s.quarter.style, { position: "relative" });

      const svg = K.svgLayer(root);
      // Beat `touched`: one wide row, 100 column stripes; 4 light up.
      s.stripLbl = K.text(root, { x: 120, y: 322, cls: "label", text: "One fact-table row: 100+ columns", color: "muted" });
      const cw = U.el("div", {}, root);
      Object.assign(cw.style, { position: "absolute", left: "1000px", top: "306px", width: "800px", display: "flex", justifyContent: "flex-end" });
      s.need = K.chip(cw, { text: "needs 4 or 5 of 100+ columns", accent: "orange" });
      Object.assign(s.need.style, { position: "relative" });
      s.needWrap = cw;

      s.strip = U.sv("g", {}, svg);
      s.stripes = [];
      for (let i = 0; i < NCOL; i++) {
        s.stripes.push(U.sv("rect", { x: colX(i).toFixed(2), y: STRIP_Y, width: CW.toFixed(2), height: STRIP_H, rx: 3, fill: C.surface2 }, s.strip));
      }
      s.usedLbl = USED.map((u) => K.label(svg, { x: colX(u.i) + CW / 2, y: STRIP_Y + STRIP_H + 36, text: u.name, size: 26, weight: 650, fill: "orange", mono: true }));

      // Beat `rowstore`: the row store on disk, records stacked.
      s.panel = U.sv("rect", { x: 120, y: 540, width: 1680, height: 382, rx: 22, fill: C.bg2, stroke: C.line, "stroke-width": 2 }, svg);
      s.panelLbl = K.text(root, { x: 140, y: 562, cls: "label", html: `Row store on disk: <span style="color:${C.ink}">each row's values together</span>`, color: "muted" });
      s.recs = [];
      for (let r = 0; r < NREC; r++) {
        const g = U.sv("g", {}, svg);
        const y = REC_Y0 + r * (REC_H + REC_GAP);
        const cells = [];
        // Strike line sits under the cells: it shows through the faded (thrown-away) cells, not the kept orange ones.
        const strike = U.sv("path", { d: `M${X0 - 6},${y + REC_H / 2} L${X1 + 6},${y + REC_H / 2}`, stroke: C.bad, "stroke-width": 4, "stroke-linecap": "round", fill: "none" }, g);
        for (let i = 0; i < NCOL; i++) cells.push(U.sv("rect", { x: colX(i).toFixed(2), y, width: CW.toFixed(2), height: REC_H, rx: 2 }, g));
        s.recs.push({ g, cells, strike, y });
      }

      // Header pills (right side of the panel header).
      const pw = U.el("div", {}, root);
      Object.assign(pw.style, { position: "absolute", left: "900px", top: "552px", width: "884px", display: "flex", justifyContent: "flex-end", gap: "16px" });
      // Fixed slots (no reflow): slot A stacks index / load / waste in one grid cell, right-aligned; pKeep always takes its space.
      const slot = U.el("div", {}, pw);
      Object.assign(slot.style, { position: "relative", display: "grid", justifyItems: "end", alignItems: "center" });
      const mk = (parent, txt, tone, stack) => { const p = K.pill(parent, { x: 0, y: 0, text: txt, tone }); Object.assign(p.style, { position: "relative", left: "auto", top: "auto", fontSize: "28px", padding: "8px 22px 8px 16px" }); if (stack) p.style.gridArea = "1 / 1"; return p; };
      s.pIndex = mk(slot, "Index on date: finds the rows", "hl", true);
      s.pLoad = mk(slot, "Loads + parses every column", "hl", true);
      s.pWaste = mk(slot, "Thrown away", "bad", true);
      s.pKeep = mk(pw, "Kept: 4 per row", "orange", false);
      return s;
    },

    update(t, k, s) {
      const C = K.C;
      const tQuery = k.word("query", "query"), tQuarter = k.word("query", "last");
      const tCols = k.word("touched", "100+"), tFour = k.word("touched", "4");
      const tStore = k.word("rowstore", "store"), tRows = k.word("rowstore", "row by row"), tTogether = k.word("rowstore", "each");
      const tIndex = k.word("load", "index"), tLoads = k.word("load", "loads"), tEveryCol = k.word("load", "every column");
      const tThrow = k.word("waste", "throws"), tKeep = k.word("waste", "keeping");

      A.show(s.title, t, 0.3);
      A.show(s.badge, t, 0.4, { dy: 0 });
      A.show(s.query, t, tQuery - 0.1, { dy: 14 });
      A.show(s.quarter, t, tQuarter - 0.1, { dy: 14 });

      // Strip: stripes sweep in left → right on "hundred-plus"; the used four turn orange on "four".
      A.show(s.stripLbl, t, tCols - 0.1, { dy: 12 });
      const four = A.prog(t, tFour - 0.1, 0.5);
      s.stripes.forEach((r, i) => {
        const p = A.prog(t, tCols - 0.1 + (i / NCOL) * 0.8, 0.3);
        r.style.opacity = p.toFixed(3);
        r.setAttribute("fill", isUsed(i) ? A.mix(C.surface2, C.orange, four) : A.mix(C.surface2, "#18253A", four));
      });
      s.usedLbl.forEach((l) => A.show(l.inner, t, tFour, { dy: 10 }));
      A.show(s.need, t, tFour - 0.1, { dy: 12 });

      // Row store: panel + records cascade in on "row by row".
      A.setOpacity(s.panel, A.prog(t, tStore - 0.1, 0.5));
      A.show(s.panelLbl, t, tTogether - 0.2, { dy: 12 });
      const waste = A.prog(t, tThrow - 0.05, 0.6);
      const keep = A.prog(t, tKeep - 0.1, 0.5);
      s.recs.forEach((rec, r) => {
        A.setOpacity(rec.g, A.prog(t, tRows - 0.15 + r * 0.14, 0.4));
        rec.cells.forEach((c, i) => {
          // Load: each record lights left → right (every column), one record after another.
          const lit = A.prog(t, tLoads + r * 0.32 + (i / NCOL) * 0.35, 0.18);
          let fill = A.mix("#22324A", C.hl, lit * 0.85);
          let op = 1;
          if (isUsed(i)) {
            fill = A.mix(rgbToHex(fill), C.orange, keep);
          } else {
            fill = A.mix(rgbToHex(fill), C.bad, waste);
            op = 1 - 0.72 * waste;
          }
          c.setAttribute("fill", fill);
          c.style.opacity = op.toFixed(3);
        });
        A.draw(rec.strike, t, tThrow + 0.1 + r * 0.12, 0.5);
        rec.strike.style.opacity = "0.9";
      });

      // Header pills, one idea at a time; the last two stay as the summary.
      A.show(s.pIndex, t, tIndex - 0.1, { dy: 10, out: tLoads - 0.2 });
      A.show(s.pLoad, t, tEveryCol - 0.1, { dy: 10, out: tThrow - 0.3 });
      A.show(s.pWaste, t, tThrow, { dy: 10 });
      A.show(s.pKeep, t, tKeep - 0.1, { dy: 10 });
    },
  });

  function rgbToHex(c) {
    if (c[0] === "#") return c;
    const m = c.match(/\d+/g).map(Number);
    return "#" + m.slice(0, 3).map((v) => v.toString(16).padStart(2, "0")).join("");
  }
})();
