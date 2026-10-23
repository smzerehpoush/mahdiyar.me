// S12 — columnar. The deck's lab as a demonstration (12-row payments table, "Simplified illustration").
// Left: the row store (one record per payment). Right: the column store (six files, id.col … amount.col). Row k sits at the same
// height in both, so "the k-th entry of every file" reads across. Beats: files → kth → scan (72 vs 24 cells) → lookup (6 cells,
// 1 place vs 6 files) → trade-off verdicts → column-families note.
(function () {
  const CH = 15.6;               // JetBrains Mono advance at 26 px
  const PITCH = 34, CELL_H = 30; // row pitch / cell height
  const Y_CELLS = 400;           // first row's top
  const ROW_X = 120;             // row-store records start
  const FILE_GAP = 16;
  const rowY = (r) => Y_CELLS + r * PITCH;

  R.scene("columnar", {
    build(root, k) {
      const C = K.C, s = {};
      const cols = k.data.columns, rows = k.data.rows;
      const lab = k.data.lab;
      s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Column storage: a file per column" });
      s.badge = K.badge(root, { x: 0, y: 128, right: 120, text: "Simplified illustration" });

      const svg = K.svgLayer(root);
      const str = (v) => String(v);

      // ---- Row store (records). Cell widths from the longest value in each column.
      const rW = cols.map((c, j) => Math.max(...rows.map((r) => str(r[j]).length)) * CH + 16);
      const rX = []; let x = ROW_X; rW.forEach((w) => { rX.push(x); x += w + 3; });
      const rowEnd = x - 3;
      s.rowEnd = rowEnd;
      s.rowHdr = K.text(root, { x: ROW_X, y: 304, cls: "label", html: `Row store <span style="color:${C.muted};font-weight:550">· a record per payment</span>`, color: "ink" });
      s.rcells = rows.map((r, i) => cols.map((c, j) => {
        const g = U.sv("g", {}, svg);
        const rect = U.sv("rect", { x: rX[j], y: rowY(i), width: rW[j], height: CELL_H, rx: j === 0 ? 8 : j === cols.length - 1 ? 8 : 2 }, g);
        const tx = U.sv("text", { x: rX[j] + rW[j] / 2, y: rowY(i) + CELL_H / 2 + 9, "text-anchor": "middle", "font-size": 26, "font-weight": 600, "font-family": "JetBrains Mono, monospace" }, g, str(r[j]));
        return { g, rect, tx };
      }));
      s.recs = rows.map((r, i) => s.rcells[i]);

      // ---- Column store: six files, width from file name / values.
      const names = cols.map((c) => c + ".col");
      const fW = cols.map((c, j) => Math.max(names[j].length, ...rows.map((r) => str(r[j]).length)) * CH + 28);
      const total = fW.reduce((a, b) => a + b, 0) + FILE_GAP * (cols.length - 1);
      const fx0 = 1800 - total;
      s.fx0 = fx0;
      const fX = []; x = fx0; fW.forEach((w) => { fX.push(x); x += w + FILE_GAP; });
      s.fX = fX; s.fW = fW;
      s.colHdr = K.text(root, { x: fx0, y: 304, cls: "label", html: `Column store <span style="color:${C.muted};font-weight:550">· same 12 payments, 6 files</span>`, color: "orange" });
      s.files = cols.map((c, j) => {
        const g = U.sv("g", {}, svg);
        const frame = U.sv("rect", { x: fX[j], y: Y_CELLS - 50, width: fW[j], height: 50 + rows.length * PITCH + 8, rx: 12, fill: C.bg2, stroke: C.line2, "stroke-width": 2 }, g);
        const nm = U.sv("text", { x: fX[j] + fW[j] / 2, y: Y_CELLS - 16, "text-anchor": "middle", "font-size": 26, "font-weight": 700, "font-family": "JetBrains Mono, monospace", fill: C.orange }, g, names[j]);
        const cells = rows.map((r, i) => {
          const rect = U.sv("rect", { x: fX[j] + 8, y: rowY(i), width: fW[j] - 16, height: CELL_H, rx: 4 }, g);
          const tx = U.sv("text", { x: fX[j] + fW[j] / 2, y: rowY(i) + CELL_H / 2 + 9, "text-anchor": "middle", "font-size": 26, "font-weight": 600, "font-family": "JetBrains Mono, monospace" }, g, str(r[j]));
          return { rect, tx };
        });
        return { g, frame, nm, cells };
      });

      // kth: band across row 4 (index 3) of every file + record 4.
      const r4 = rowY(3);
      s.band = U.sv("rect", { x: ROW_X - 10, y: r4 - 3, width: 1800 - ROW_X + 20, height: CELL_H + 6, rx: 8, fill: "none", stroke: C.hl, "stroke-width": 3, "stroke-dasharray": "10 8" }, svg);
      svg.insertBefore(s.band, svg.firstChild);

      // lookup: hops between the 6 files along row 4.
      s.hops = [];
      for (let j = 0; j < cols.length - 1; j++) {
        // Arc over the top of row 4, from file j's entry to file j+1's entry.
        // Short, flat hop from the top-right corner of entry j to the top-left corner of entry j+1 (stays off row 3's text).
        const a = [fX[j] + fW[j] - 12, r4 - 3], b = [fX[j + 1] + 12, r4 - 3];
        s.hops.push(K.arrow(svg, { from: a, to: b, curve: -26, tone: "hl", width: 4, gapStart: 4, gapEnd: 2 }));
      }
      s.place = U.sv("rect", { x: ROW_X - 6, y: r4 - 6, width: rowEnd - ROW_X + 12, height: CELL_H + 12, rx: 12, fill: "none", stroke: C.hl, "stroke-width": 4 }, svg);

      // ---- Counters (under each store).
      const yCnt = rowY(rows.length) + 14;
      const cnt = (x0, w, align) => {
        const n = K.text(root, { x: x0, y: yCnt, w, cls: "", text: "" });
        Object.assign(n.style, { fontSize: "38px", fontWeight: 800, color: C.hl, textAlign: align, letterSpacing: "-0.01em", whiteSpace: "nowrap" });
        return n;
      };
      s.cRow = cnt(ROW_X, rowEnd - ROW_X, "left");
      s.cCol = cnt(fx0, 1800 - fx0, "left");

      // ---- Query row (y 214): scan → lookup → verdicts / kth note.
      const qchip = (txt, xx) => { const c = K.chip(root, { x: xx, y: 212, text: txt, accent: "orange", icon: "search" }); Object.assign(c.style, { fontFamily: "var(--mono)", fontWeight: 600, fontSize: "28px" }); return c; };
      s.qScan = qchip(lab.scan.sql, 120);
      s.qLook = qchip(lab.lookup.sql, 120);
      s.kth = K.chip(root, { x: 120, y: 212, text: "4th entry of every file = payment 4", accent: "hl" });
      s.vRow = K.chip(root, { x: ROW_X, y: 212, text: "Whole records → rows win", accent: "hl", icon: "check" });
      s.vCol = K.chip(root, { x: fx0, y: 212, text: "Many rows, few columns → columns win", accent: "orange", icon: "check" });

      // ---- Families note (bottom centre).
      const nw = U.el("div", {}, root);
      Object.assign(nw.style, { position: "absolute", left: "120px", top: "872px", width: "1680px", display: "flex", justifyContent: "center" });
      s.note = K.chip(nw, { text: "Cassandra / HBase column families: mostly row-oriented", accent: "muted", icon: "warning", size: 28 });
      Object.assign(s.note.style, { position: "relative", background: C.surface });
      s.lab = lab;
      return s;
    },

    update(t, k, s) {
      const C = K.C, rows = k.data.rows, cols = k.data.columns;
      // Anchors.
      const tFile = k.word("files", "file"), tSix = k.word("files", "six");
      const tOrder = k.word("kth", "same order"), tFourth = k.word("kth", "fourth"), tPay4 = k.word("kth", "payment");
      const tMini = k.word("scan", "mini"), tDE = k.word("scan", "DE"), tReads = k.word("scan", "reads"), t72 = k.word("scan", "72");
      const tColStore = k.word("scan", "column store"), tCountry = k.word("scan", "country"), t24 = k.word("scan", "24");
      const tFetch = k.word("lookup", "fetch"), tCells6 = k.word("lookup", "six cells"), tOne = k.word("lookup", "one place");
      const tSixFiles = k.word("lookup", "six files");
      const tTrade = k.cue("tradeoff"), tColWin = k.word("tradeoff", "columns win"), tRowWin = k.word("tradeoff", "rows win");
      const tCareful = k.word("families", "careful"), tFam = k.word("families", "column families");

      A.show(s.title, t, 0.3);
      A.show(s.badge, t, 0.4, { dy: 0 });
      A.show(s.rowHdr, t, 0.35, { dy: 12 });
      s.recs.forEach((rec, i) => rec.forEach((c) => A.setOpacity(c.g, A.prog(t, 0.3 + i * 0.04, 0.4))));

      // Files appear one by one on "its own file"; the matching row-store column flashes as its file lands.
      const tF = (j) => tFile - 0.15 + j * 0.28;
      A.show(s.colHdr, t, tFile - 0.25, { dy: 12 });
      s.files.forEach((f, j) => A.show(f.g, t, tF(j), { dy: 18 }));

      // Highlight state per cell: 0 = idle, values in [0,1] of "read" (hl), plus a dim factor for unread cells.
      const scan = A.win(t, tReads - 0.1, tFetch - 0.2, 0.4);           // row store: all 72 read
      const scanCol = A.win(t, tCountry - 0.15, tFetch - 0.2, 0.4);     // column store: country + amount
      const colDim = A.win(t, tColStore - 0.1, tFetch - 0.2, 0.4);
      const look = A.win(t, tCells6 - 0.15, tTrade - 0.1, 0.4);         // row 4 everywhere
      const kth = A.win(t, tFourth - 0.15, tMini - 0.2, 0.4);
      const fin = A.prog(t, tTrade, 0.5);
      const vCol = A.prog(t, tColWin - 0.1, 0.5), vRow = A.prog(t, tRowWin - 0.1, 0.5);
      const ci = cols.indexOf("country"), ai = cols.indexOf("amount");

      // Row-store sweep: rows light top → bottom between "reads" and "72".
      const sweep = (i) => A.prog(t, tReads - 0.1 + (i / rows.length) * Math.max(0.3, t72 - tReads - 0.2), 0.2);
      s.recs.forEach((rec, i) => rec.forEach((c, j) => {
        const flash = A.win(t, tF(j), tF(j) + 0.55, 0.2) * (1 - A.prog(t, tFourth - 0.5, 0.2));
        let lit = Math.max(scan * sweep(i), kth * (i === 3 ? 1 : 0), look * (i === 3 ? 1 : 0), vRow * (i === 3 ? 1 : 0));
        const fl = flash * 0.9;
        let fill = A.mix(C.surface, "#3A3216", lit);
        if (fl > 0) fill = A.mix(hex(fill), "#33210F", fl);
        let stroke = lit > 0.01 ? A.mix(C.line, C.hl, lit) : fl > 0.01 ? A.mix(C.line, C.orange, fl) : C.line;
        const dim = Math.max(look, vRow * (1 - 0)) * (i === 3 ? 0 : 1) * 0.55;
        c.rect.setAttribute("fill", fill);
        c.rect.setAttribute("stroke", stroke);
        c.rect.setAttribute("stroke-width", "2");
        c.tx.setAttribute("fill", A.mix(C.muted, C.ink, Math.max(lit, fl)));
        c.g.style.opacity = (A.prog(t, 0.3 + i * 0.04, 0.4) * (1 - dim)).toFixed(3);
      }));

      // Column-store cells.
      const colSweep = (i) => A.prog(t, tCountry - 0.15 + (i / rows.length) * Math.max(0.3, t24 - tCountry - 0.2), 0.2);
      const hopP = (j) => A.prog(t, tSixFiles - 0.35 + j * 0.16, 0.2);   // file j reached on "six files"
      s.files.forEach((f, j) => {
        const isScan = j === ci || j === ai;
        const hopLit = j === 0 ? 1 : hopP(j - 1);
        const fileDim = Math.max(colDim * (isScan ? 0 : 1), vCol * (isScan ? 0 : 1)) * 0.6;
        f.g.style.opacity = (A.prog(t, tF(j), 0.6) * (1 - fileDim)).toFixed(3);
        f.frame.setAttribute("stroke", A.mix(C.line2, C.orange, Math.max(scanCol, vCol) * (isScan ? 1 : 0)));
        f.cells.forEach((c, i) => {
          const r4 = i === 3 ? 1 : 0;
          const lit = Math.max(isScan ? Math.max(scanCol * colSweep(i), vCol) : 0, kth * r4, look * r4 * (0.55 + 0.45 * hopLit));
          c.rect.setAttribute("fill", A.mix(C.surface, "#3A3216", lit));
          c.rect.setAttribute("stroke", A.mix(C.line, C.hl, lit));
          c.rect.setAttribute("stroke-width", "2");
          const lookDim = look * (r4 ? 0 : 0.75);
          c.tx.setAttribute("fill", A.mix(C.muted, C.ink, lit));
          c.rect.style.opacity = c.tx.style.opacity = (1 - lookDim).toFixed(3);
        });
      });

      // kth: dashed band + note chip.
      A.setOpacity(s.band, kth);
      A.show(s.kth, t, tPay4 - 0.15, { dy: 12, out: tMini - 0.35 });

      // Queries.
      A.show(s.qScan, t, tMini - 0.1, { dy: 12, out: tFetch - 0.35 });
      A.show(s.qLook, t, tFetch - 0.1, { dy: 12, out: tTrade - 0.3 });

      // Counters: numbers land on their spoken words.
      const n72 = Math.round(A.tween(t, tReads - 0.1, t72 - tReads + 0.1, 0, 72, A.E.inOutSine));
      const n24 = Math.round(A.tween(t, tCountry - 0.15, t24 - tCountry + 0.15, 0, 24, A.E.inOutSine));
      const scanCnt = A.win(t, tReads - 0.15, tFetch - 0.25, 0.3), scanCnt2 = A.win(t, tCountry - 0.2, tFetch - 0.25, 0.3);
      const lookCnt = A.win(t, tCells6 - 0.15, tTrade - 0.1, 0.3);
      if (t < tFetch - 0.25 + 0.2 || lookCnt < 0.01) {
        s.cRow.innerHTML = `${n72} cells`;
        s.cCol.innerHTML = `${n24} cells` + (t >= t24 - 0.05 ? ` <span style="color:${C.orange}">· 33%</span>` : "");
        A.setOpacity(s.cRow, scanCnt); A.setOpacity(s.cCol, scanCnt2);
      } else {
        s.cRow.innerHTML = `6 cells` + (t >= tOne - 0.1 ? ` <span style="color:${C.ink}">· 1 place</span>` : "");
        s.cCol.innerHTML = `6 cells` + (t >= tSixFiles - 0.1 ? ` <span style="color:${C.ink}">· 6 files</span>` : "");
        A.setOpacity(s.cRow, lookCnt); A.setOpacity(s.cCol, lookCnt);
      }

      // Lookup: one place (record outline) vs six hops.
      A.setOpacity(s.place, A.prog(t, tOne - 0.15, 0.4) * (1 - A.prog(t, tTrade - 0.1, 0.4)));
      s.hops.forEach((h, j) => { const p = h.draw(t, tSixFiles - 0.35 + j * 0.16, 0.25); h.setOpacity(p > 0.001 ? 1 - A.prog(t, tTrade - 0.1, 0.4) : 0); });

      // Trade-off verdicts (above each store) and the families note.
      A.show(s.vCol, t, tColWin - 0.1, { dy: 12 });
      A.show(s.vRow, t, tRowWin - 0.1, { dy: 12 });
      void fin; void tDE; void tCareful;
      A.show(s.note, t, tFam - 0.15, { dy: 12 });
    },
  });

  function hex(c) {
    if (c[0] === "#") return c;
    const m = c.match(/\d+/g).map(Number);
    return "#" + m.slice(0, 3).map((v) => v.toString(16).padStart(2, "0")).join("");
  }
})();
