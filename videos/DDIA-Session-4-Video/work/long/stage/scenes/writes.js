// S18 — writes. Left: sorted, compressed column files on disk (each block = a run of equal values, "×n"). Right: the new payment, the
// in-memory sorted buffer, chips. Beats: problem (a new payment arrives) → rewrite (it sorts into the middle: every file splits and goes
// red) → memstore (it goes into a sorted buffer instead; more rows pile up, kept sorted) → merge (rows merged into new files, in bulk)
// → both (a query reads files + buffer; new data visible right away · Vertica).
(function () {
  const DX0 = 120, DX1 = 1010, DY0 = 250, DY1 = 845;    // disk container
  const FW = 136, FG = 10, FY = 352, RH = 32;          // files: width, gap, body top, row height
  const RX0 = 1074, RCW = 108, RCG = 6, RCH = 40;       // record / buffer cells
  const REC_Y = 300;
  const BUF = { x: 1054, y: 410, w: 746, h: 250 };
  const slotY = (s) => BUF.y + 64 + s * 58;
  const NEW = [
    [13, "Jun 3", "Acme", "DE", "card", 120],
    [14, "Jun 3", "Cora", "NL", "wallet", 95],
    [15, "Jun 3", "Bolt", "FR", "card", 75],
    [16, "Jun 3", "Acme", "FR", "wallet", 65],
  ];
  const fx = (j) => DX0 + (DX1 - DX0 - (6 * FW + 5 * FG)) / 2 + j * (FW + FG);

  function sortRows(rows, cols) {
    const di = cols.indexOf("date"), mi = cols.indexOf("merchant");
    return rows.slice().sort((a, b) => (a[di] < b[di] ? -1 : a[di] > b[di] ? 1 : a[mi] < b[mi] ? -1 : a[mi] > b[mi] ? 1 : a[0] - b[0]));
  }
  function runs(vals) {
    const out = [];
    vals.forEach((v, i) => { if (i && vals[i - 1].v === v.v) { const r = out[out.length - 1]; r.len++; r.isNew = r.isNew || v.isNew; } else out.push({ start: i, len: 1, val: v.v, isNew: v.isNew }); });
    return out;
  }

  R.scene("writes", {
    build(root, k) {
      const C = K.C, s = {};
      const cols = k.data.columns;
      const oldRows = k.data.sorted;
      const newRows = sortRows(oldRows.concat(NEW.slice(0, 3)), cols);
      s.newPos = NEW.slice(0, 3).map((r) => newRows.indexOf(r));
      s.insAt = sortRows(oldRows.concat([NEW[0]]), cols).indexOf(NEW[0]);
      s.nOld = oldRows.length; s.nNew = newRows.length;

      s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Writing to a column store" });
      s.badge = K.badge(root, { x: 0, y: 128, right: 120, text: "Simplified illustration" });
      const svg = K.svgLayer(root);

      // ---- Disk.
      s.disk = U.sv("rect", { x: DX0, y: DY0, width: DX1 - DX0, height: DY1 - DY0, rx: 22, fill: C.bg2, stroke: C.line, "stroke-width": 2.5 }, svg);
      s.diskLbl = K.text(root, { x: DX0 + 24, y: DY0 + 14, cls: "label", html: `On disk <span style="color:${C.muted};font-weight:550">· sorted, compressed column files</span>`, color: "ink" });
      const gFiles = U.sv("g", {}, svg);
      s.files = cols.map((c, j) => {
        const frame = U.sv("rect", { x: fx(j), y: FY - 46, width: FW, height: 0, rx: 12, fill: C.surface, stroke: C.line2, "stroke-width": 2 }, gFiles);
        U.sv("text", { x: fx(j) + FW / 2, y: FY - 14, "text-anchor": "middle", "font-size": 26, "font-weight": 700, "font-family": "JetBrains Mono, monospace", fill: C.orange }, gFiles, c);
        return { frame };
      });
      const mkBlocks = (rows, newSet) => cols.map((c, j) => {
        const g = U.sv("g", {}, gFiles);
        const list = runs(rows.map((r) => ({ v: r[j], isNew: newSet.includes(r) }))).map((ru) => {
          const bg = U.sv("g", {}, g);
          const rect = U.sv("rect", { x: fx(j) + 6, y: 0, width: FW - 12, height: ru.len * RH - 4, rx: 6, "stroke-width": 2 }, bg);
          const tx = U.sv("text", { x: fx(j) + FW / 2, y: (ru.len * RH - 4) / 2 + 9, "text-anchor": "middle", "font-size": 26, "font-weight": 650 }, bg, ru.len > 1 ? `${ru.val} ×${ru.len}` : String(ru.val));
          return { ...ru, bg, rect, tx };
        });
        return { g, list };
      });
      s.oldB = mkBlocks(oldRows, []);
      s.newB = mkBlocks(newRows, NEW);

      // ---- Right side: new payment record, buffer.
      s.newLbl = K.text(root, { x: RX0, y: REC_Y - 50, cls: "label", text: "New payment", color: "hl" });
      s.buf = U.sv("rect", { x: BUF.x, y: BUF.y, width: BUF.w, height: BUF.h, rx: 22, fill: C.bg2, stroke: C.line2, "stroke-width": 2.5 }, svg);
      s.bufLbl = K.text(root, { x: BUF.x + 24, y: BUF.y + 14, cls: "label", html: `In memory <span style="color:${C.muted};font-weight:550">· sorted buffer</span>`, color: "ink" });
      const gRows = U.sv("g", {}, svg);
      s.recs = NEW.map((r) => r.map((v, j) => {
        const g = U.sv("g", {}, gRows);
        const rect = U.sv("rect", { rx: 6, "stroke-width": 2, fill: "#3A3216", stroke: C.hl }, g);
        const tx = U.sv("text", { "text-anchor": "middle", "font-size": 26, "font-weight": 650, fill: C.ink }, g, String(v));
        return { g, rect, tx };
      }));

      // ---- Chips.
      s.noPlace = K.chip(root, { x: RX0, y: 400, text: "No update in place (unlike a B-tree)", accent: "bad", icon: "x" });
      s.rewrite = K.chip(root, { x: RX0, y: 490, text: "Rewrite every column file", accent: "bad", icon: "warning" });
      s.lsm = K.chip(root, { x: BUF.x, y: 684, text: "Like LSM-trees · previous video", accent: "orange", icon: "layers" });
      s.bulk = K.chip(root, { x: BUF.x, y: 764, text: "New files, written in bulk", accent: "orange", icon: "file" });
      s.merge = K.arrow(svg, { from: [BUF.x - 6, BUF.y + BUF.h / 2], to: [DX1 + 4, BUF.y + BUF.h / 2], tone: "orange", width: 5 });

      // ---- Both: query reads files + buffer.
      s.query = K.box(svg, { x: 1110, y: 236, w: 270, h: 84, label: "Query", icon: "search", iconInline: true, iconSize: 40, tone: "hl" });
      s.qDisk = K.arrow(svg, { from: [DX1 + 4, 278], to: [1110, 278], tone: "hl", gapEnd: 10 });
      s.qBuf = K.arrow(svg, { from: [1245, BUF.y - 4], to: [1245, 320], tone: "hl", gapEnd: 10 });
      s.pDisk = K.packets(svg, s.qDisk, { n: 2, period: 1.0, r: 8 });
      s.pBuf = K.packets(svg, s.qBuf, { n: 2, period: 0.9, r: 8 });
      s.result = K.pill(root, { x: 1420, y: 248, text: "files + buffer", tone: "ok" });
      const fw = U.el("div", {}, root);
      Object.assign(fw.style, { position: "absolute", left: "120px", top: "870px", width: "1680px", display: "flex", justifyContent: "center" });
      s.fin = K.chip(fw, { text: "New data visible right away<span class=v> · Vertica works this way</span>", accent: "ok", icon: "check" });
      s.finV = s.fin.querySelector(".v");
      Object.assign(s.fin.style, { position: "relative", background: C.surface });
      return s;
    },

    update(t, k, s) {
      const C = K.C;
      const tArrive = k.word("problem", "new"), tPlace = k.word("rewrite", "updated"), tNewRow = k.word("rewrite", "new row");
      const tSorts = k.word("rewrite", "sorts"), tMiddle = k.word("rewrite", "middle"), tRewr = k.word("rewrite", "rewriting");
      const tMem = k.cue("memstore"), tLSM = k.word("memstore", "trees"), tWrites = k.word("memstore", "new"), tBuffer = k.word("memstore", "buffer");
      const tMemEnd = k.cueEnd("memstore");
      const tMergeC = k.cue("merge"), tPiled = k.word("merge", "piled"), tMerged = k.word("merge", "merged"), tWritten = k.word("merge", "written");
      const tBoth = k.cue("both"), tReadFiles = k.word("both", "files"), tReadBuf = k.word("both", "buffer"), tCombine = k.word("both", "combine");
      const tAway = k.word("both", "right away");

      A.show(s.title, t, 0.3);
      A.show(s.badge, t, 0.4, { dy: 0 });
      A.show(s.diskLbl, t, 0.3, { dy: 10 });
      A.setOpacity(s.disk, A.prog(t, 0.2, 0.5));

      // Insertion (rewrite beat): blocks below the insertion point shift down; undone at memstore.
      const ins = A.prog(t, tMiddle - 0.1, 0.8, A.E.inOutCubic) * (1 - A.prog(t, tMem + 0.1, 0.8, A.E.inOutCubic));
      const red = (j) => A.prog(t, tRewr - 0.1 + j * 0.12, 0.35) * (1 - A.prog(t, tMem + 0.1, 0.6));
      const newL = A.prog(t, tWritten - 0.1, 0.8);              // new files replace the old ones
      const ghost = A.prog(t, tMerged + 0.6, 0.8) * (1 - newL);  // old files being rewritten
      const fresh = 1 - A.prog(t, tBoth + 1.5, 1.5);             // new rows' highlight fades
      const nRows = s.nOld + ins + (s.nNew - s.nOld) * newL;
      s.files.forEach((f, j) => {
        const r = red(j);
        f.frame.setAttribute("height", (46 + nRows * RH + 6).toFixed(2));
        f.frame.setAttribute("fill", A.mix(C.surface, "#3A1620", r));
        f.frame.setAttribute("stroke", r > 0.01 ? A.mix(C.line2, C.bad, r) : A.mix(C.line2, C.orange, A.win(t, tWritten - 0.1, tBoth + 1.5, 0.5)));
        f.frame.setAttribute("stroke-width", r > 0.01 ? 3 : 2);
        f.frame.parentNode.style.opacity = A.prog(t, 0.2, 0.6).toFixed(3);
      });
      const paintBlock = (b, y, op, isNewLayout) => {
        b.bg.setAttribute("transform", `translate(0,${y.toFixed(2)})`);
        const hl = isNewLayout && b.isNew ? fresh : 0;
        b.rect.setAttribute("fill", A.mix(C.bg2, "#3A3216", hl));
        b.rect.setAttribute("stroke", A.mix(C.line, C.hl, hl));
        b.tx.setAttribute("fill", C.ink);
        b.bg.style.opacity = op.toFixed(3);
      };
      s.oldB.forEach((col, j) => col.list.forEach((b, i) => {
        const y = FY + b.start * RH + (b.start >= s.insAt ? ins * RH : 0);
        paintBlock(b, y, A.prog(t, 0.3 + j * 0.06, 0.5) * (1 - 0.65 * ghost) * (1 - newL), false);
      }));
      s.newB.forEach((col) => col.list.forEach((b) => paintBlock(b, FY + b.start * RH, newL, true)));

      // Rows (cells) of new payments: positions per time.
      const recPos = (j) => ({ x: RX0 + j * (RCW + RCG), y: REC_Y, w: RCW, h: RCH });
      const bufPos = (j, slot) => ({ x: BUF.x + 24 + j * (RCW + RCG), y: slotY(slot), w: RCW, h: RCH });
      const filePos = (j, row, ofsRows = 0) => ({ x: fx(j) + 6, y: FY + (row + ofsRows) * RH, w: FW - 12, h: RH - 4 });
      const L = (a, b, p) => ({ x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, w: a.w + (b.w - a.w) * p, h: a.h + (b.h - a.h) * p });
      const draw = (c, p, op, tone) => {
        c.rect.setAttribute("x", p.x.toFixed(2)); c.rect.setAttribute("y", p.y.toFixed(2));
        c.rect.setAttribute("width", p.w.toFixed(2)); c.rect.setAttribute("height", p.h.toFixed(2));
        c.tx.setAttribute("x", (p.x + p.w / 2).toFixed(2)); c.tx.setAttribute("y", (p.y + p.h / 2 + 9).toFixed(2));
        c.rect.setAttribute("fill", tone === "bad" ? "#3A1620" : "#3A3216");
        c.rect.setAttribute("stroke", tone === "bad" ? C.bad : C.hl);
        A.setOpacity(c.g, op);
      };
      // Slots in the buffer: 13 → 0; 14 → 1, then 2 once 15 (Bolt) sorts in between; 16 → 0 after the merge.
      // 14 lands right after 13; at the merge cue 14 slides down to slot 2, then 15 (Bolt) sorts into the emptied slot 1; the
      // sorted buffer (Acme, Bolt, Cora) holds ~1 s, then each row's cells fly to their final slots in the new files.
      const t14 = k.word("memstore", "memory") + 0.2, t15 = tMergeC + 0.35;
      const slide = A.prog(t, tMergeC - 0.1, 0.5, A.E.inOutCubic);
      const mergeP = (i) => A.prog(t, tMerged + 0.2 + i * 0.4, 0.8, A.E.inOutCubic);
      const cellsOut = A.prog(t, tWritten - 0.1 + 0.8, 0.4);   // after newL reaches 1, the fresh blocks take over
      s.recs.forEach((cells, i) => cells.forEach((c, j) => {
        let p, op = 1, tone = "hl";
        if (i === 0) {
          op = A.prog(t, tArrive - 0.1, 0.5);
          const flyIn = A.prog(t, tSorts - 0.1 + j * 0.06, 0.8, A.E.inOutCubic) * (1 - A.prog(t, tMem + 0.1, 0.7, A.E.inOutCubic));
          p = L(recPos(j), filePos(j, s.insAt), flyIn);
          if (red(j) > 0.3 && flyIn > 0.9) tone = "bad";
          const toBuf = A.prog(t, tBuffer - 0.35, 0.7, A.E.inOutCubic);
          if (toBuf > 0) p = L(recPos(j), bufPos(j, 0), toBuf);
        } else if (i === 1) {
          op = A.prog(t, t14, 0.5);
          p = bufPos(j, 0 + 1); p = L(p, bufPos(j, 2), slide);
          p = { ...p, x: p.x + (1 - op) * 60 };
        } else if (i === 2) {
          op = A.prog(t, t15, 0.5);
          p = bufPos(j, 1); p = { ...p, x: p.x + (1 - op) * 60 };
        } else {
          op = A.prog(t, tBoth - 0.5, 0.5);
          p = bufPos(j, 0); p = { ...p, x: p.x + (1 - op) * 60 };
        }
        if (i < 3) {
          const order = [0, 2, 1][i];          // buffer slot order: 13, 15, 14
          const m = mergeP(order);
          if (m > 0) { const from = i === 0 ? bufPos(j, 0) : i === 1 ? bufPos(j, 2) : bufPos(j, 1); p = L(from, filePos(j, s.newPos[i]), m); }
          op *= 1 - cellsOut;
        }
        draw(c, p, op, tone);
        // While the fresh blocks fade in underneath, the cell text hands over to the block text (runs like "Bolt ×2").
        c.tx.style.opacity = i < 3 ? (1 - newL).toFixed(3) : "1";
      }));

      // Labels / containers on the right.
      A.show(s.newLbl, t, tArrive - 0.1, { dy: 10, out: tBuffer - 0.3 });
      const bufOn = A.prog(t, tLSM - 0.15, 0.5);
      A.setOpacity(s.buf, bufOn);
      A.show(s.bufLbl, t, tWrites - 0.1, { dy: 10 });
      const reading = A.win(t, tReadFiles - 0.15, k.dur + 5, 0.4);
      s.buf.setAttribute("stroke", A.mix(C.line2, C.hl, A.prog(t, tReadBuf - 0.15, 0.4)));
      s.disk.setAttribute("stroke", A.mix(C.line, C.hl, reading));

      A.show(s.noPlace, t, tPlace - 0.1, { dy: 12, out: tMem + 0.1 });
      A.show(s.rewrite, t, tRewr - 0.1, { dy: 12, out: tMem + 0.1 });
      A.show(s.lsm, t, tLSM - 0.15, { dy: 12 });
      A.show(s.bulk, t, tWritten - 0.1, { dy: 12 });
      const mp = s.merge.draw(t, tMerged - 0.2, 0.5);
      s.merge.setOpacity(mp > 0.001 ? 1 - A.prog(t, tWritten + 0.8, 0.5) : 0);

      // Both.
      A.show(s.query.inner, t, tBoth - 0.05, { dy: 12 });
      s.qDisk.draw(t, tReadFiles - 0.15, 0.5);
      s.qBuf.draw(t, tReadBuf - 0.15, 0.5);
      s.pDisk.update(t, A.prog(t, tReadFiles + 0.2, 0.4));
      s.pBuf.update(t, A.prog(t, tReadBuf + 0.2, 0.4));
      A.show(s.result, t, tCombine - 0.1, { dy: 10 });
      A.show(s.fin, t, tAway - 0.15, { dy: 12 });
      s.finV.style.opacity = A.prog(t, k.word("both", "Vertica") - 0.1, 0.4).toFixed(3);
      void tNewRow; void tMemEnd; void tPiled;
    },
  });
})();
