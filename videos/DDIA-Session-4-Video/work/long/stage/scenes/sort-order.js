// S16 — sort-order. The 12-payment table as six column files (Simplified illustration). Date cells are tinted by value so runs read
// at a glance. Beats: insertion (12 date runs) → wholerows (sorting the date column alone scrambles rows: red ✕) → key (whole rows
// reorder: date, then merchant) → skip (a June 2 query reads one block) → runs (date 12 → 3, merchant 8, amount 12; book note).
(function () {
  const FS = 30, CH = FS * 0.6;     // JetBrains Mono advance
  const PITCH = 40, CELL_H = 34;
  const Y0 = 400;                   // first row's top
  const X0 = 120, GAP = 22;
  const PX = 1110;                  // right-hand panel
  const rowY = (r) => Y0 + r * PITCH;
  const DATE_TONE = { "Jun 1": "teal", "Jun 2": "orange", "Jun 3": "purple" };

  function runsOf(vals) {
    const out = [];
    vals.forEach((v, i) => { if (i && vals[i - 1] === v) out[out.length - 1].len++; else out.push({ start: i, len: 1 }); });
    return out;
  }

  R.scene("sort-order", {
    build(root, k) {
      const C = K.C, s = {};
      const cols = k.data.columns, rows = k.data.rows, order = k.data.sortDemo.order;
      const n = rows.length;
      s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Sort order: whole rows move" });
      s.badge = K.badge(root, { x: 0, y: 128, right: 120, text: "Simplified illustration" });

      // State line above the table.
      s.stateIns = K.text(root, { x: 120, y: 262, cls: "label", text: "Stored in insertion order", color: "muted" });
      s.keyChip = K.chip(root, { x: 120, y: 250, text: "Sort key: date, then merchant", accent: "orange", icon: "layers" });

      const svg = K.svgLayer(root);
      const gFrames = U.sv("g", {}, svg), gBands = U.sv("g", {}, svg), gCells = U.sv("g", {}, svg), gOver = U.sv("g", {}, svg);

      // File geometry.
      const fW = cols.map((c, j) => Math.max(c.length, ...rows.map((r) => String(r[j]).length)) * CH + 40);
      const fX = []; let x = X0; fW.forEach((w) => { fX.push(x); x += w + GAP; });
      const xEnd = x - GAP;
      s.fX = fX; s.fW = fW; s.xEnd = xEnd;
      s.frames = cols.map((c, j) => {
        const frame = U.sv("rect", { x: fX[j], y: Y0 - 56, width: fW[j], height: 56 + n * PITCH + 2, rx: 12, fill: C.bg2, stroke: C.line2, "stroke-width": 2 }, gFrames);
        U.sv("text", { x: fX[j] + fW[j] / 2, y: Y0 - 18, "text-anchor": "middle", "font-size": 26, "font-weight": 700, "font-family": "JetBrains Mono, monospace", fill: C.orange }, gFrames, c);
        return frame;
      });

      // Positions: sorted slot per original row; date-only (wrong) slot per original row (stable by date).
      s.pos = rows.map((r) => order.indexOf(r[0]));
      const di = cols.indexOf("date");
      const byDate = rows.map((r, i) => i).sort((a, b) => (rows[a][di] < rows[b][di] ? -1 : rows[a][di] > rows[b][di] ? 1 : a - b));
      s.dpos = rows.map((r, i) => byDate.indexOf(i));
      s.di = di;

      // Row bands (one per payment), move with the row.
      s.bands = rows.map(() => U.sv("rect", { x: X0 - 8, y: 0, width: xEnd - X0 + 16, height: CELL_H + 6, rx: 9, fill: "none", stroke: C.line2, "stroke-width": 2.5 }, gBands));

      // Cells.
      s.cells = rows.map((r, i) => cols.map((c, j) => {
        const g = U.sv("g", {}, gCells);
        const rect = U.sv("rect", { x: fX[j] + 7, y: 0, width: fW[j] - 14, height: CELL_H, rx: 5, "stroke-width": 2 }, g);
        const tx = U.sv("text", { x: fX[j] + fW[j] / 2, y: CELL_H / 2 + 10, "text-anchor": "middle", "font-size": FS, "font-weight": 600, "font-family": "JetBrains Mono, monospace" }, g, String(r[j]));
        const tone = j === di ? K.TONES[DATE_TONE[r[j]]] : null;
        return { g, rect, tx, tone };
      }));

      // Run outlines.
      const runRects = (j, slots) => runsOf(slots.map((i) => rows[i][j])).map((ru) =>
        U.sv("rect", { x: fX[j] + 3, y: rowY(ru.start) - 3, width: fW[j] - 6, height: (ru.len - 1) * PITCH + CELL_H + 6, rx: 9, fill: "none", stroke: C.hl, "stroke-width": 3 }, gOver));
      const insSlots = rows.map((r, i) => i);
      const sortSlots = order.map((id) => rows.findIndex((r) => r[0] === id));
      s.insDateRuns = runRects(di, insSlots);
      s.mi = cols.indexOf("merchant"); s.ai = cols.indexOf("amount");
      s.dateRuns = runRects(di, sortSlots);
      s.merchRuns = runRects(s.mi, sortSlots);
      s.amtRuns = runRects(s.ai, sortSlots);

      // Run counters under columns.
      const cnt = (j) => {
        const node = K.text(root, { x: fX[j] + fW[j] / 2, y: Y0 + n * PITCH + 12, w: fW[j] + GAP, align: "center", cls: "label", text: "", color: "hl" });
        node.style.fontWeight = 750; node.style.whiteSpace = "nowrap";
        return node;
      };
      s.cDate = cnt(di); s.cMerch = cnt(s.mi); s.cAmt = cnt(s.ai);

      // Wrong attempt.
      s.wrongBand = U.sv("rect", { x: X0 - 8, y: rowY(0) - 3, width: xEnd - X0 + 16, height: CELL_H + 6, rx: 9, fill: "none", stroke: C.bad, "stroke-width": 3.5, "stroke-dasharray": "10 8" }, gOver);
      s.wrongFrame = U.sv("rect", { x: fX[di] - 4, y: Y0 - 60, width: fW[di] + 8, height: 64 + n * PITCH, rx: 14, fill: "none", stroke: C.bad, "stroke-width": 3.5 }, gOver);
      s.xMark = K.mark(svg, "x", { x: xEnd + 40, y: rowY(0) + CELL_H / 2, size: 52 });
      s.wrongTry = K.text(root, { x: PX + 40, y: 322, cls: "label", text: "Sort the date column alone?", color: "muted" });
      s.wrongQ = K.text(root, { x: PX + 60, y: rowY(0) - 4, w: 1800 - PX - 60, cls: "label", text: "Which amount belongs to which payment?", color: "bad" });
      s.wrongQ.style.fontSize = "32px"; s.wrongQ.style.fontWeight = 750;

      // Skip: Jun 2 block.
      s.block = U.sv("rect", { x: X0 - 10, y: rowY(4) - 6, width: xEnd - X0 + 20, height: 3 * PITCH + CELL_H + 12, rx: 12, fill: "none", stroke: C.hl, "stroke-width": 4 }, gOver);
      s.qArrow = K.arrow(svg, { from: [PX + 30, rowY(5) + PITCH / 2 + 2], to: [xEnd + 12, rowY(5) + PITCH / 2 + 2], tone: "hl", width: 4 });
      s.query = K.chip(root, { x: PX + 40, y: rowY(5) - 12, text: "WHERE date = 'Jun 2'", accent: "hl", icon: "search" });
      Object.assign(s.query.style, { fontFamily: "var(--mono)", fontWeight: 600, fontSize: "28px" });
      s.qNote = K.text(root, { x: PX + 40, y: rowY(5) + 64, cls: "label", text: "reads 4 rows · skips 8", color: "muted" });

      // Runs: compression chip + book note.
      s.cmp = K.chip(root, { x: PX + 40, y: 400, text: "Long runs → best compression", accent: "orange", icon: "check" });
      s.cmp.style.fontSize = "28px";
      s.book = K.card(root, { x: PX + 40, y: 520, w: 650, accent: "hl", title: "Book: first sort column → a few kilobytes", body: "even with billions of rows" });
      return s;
    },

    update(t, k, s) {
      const C = K.C, rows = k.data.rows, n = rows.length;
      // Anchors.
      const tJumps = k.word("insertion", "jumps"), t12 = k.word("insertion", "12");
      const tNot = k.word("wholerows", "not"), tOne = k.word("wholerows", "one"), tLose = k.word("wholerows", "lose");
      const tUndo = Math.min(k.cueEnd("wholerows") + 0.05, k.cue("key") - 0.2);
      const tWhole = k.word("key", "whole"), tHere = k.word("key", "here"), tDate = k.word("key", "date");
      const tSkipC = k.cue("skip"), tQuery = k.word("skip", "query"), tOnly = k.word("skip", "only"), tSkips = k.word("skip", "skips");
      const tRunsC = k.cue("runs"), tR12 = k.word("runs", "12"), tR3 = k.word("runs", "3");
      const tMerch = k.word("runs", "merchant"), tR8 = k.word("runs", "8"), tAmt = k.word("runs", "amount"), tA12 = k.word("runs", "12", 1);
      const tBill = k.word(5, "billions");

      A.show(s.title, t, 0.3);
      A.show(s.badge, t, 0.4, { dy: 0 });
      A.show(s.stateIns, t, 0.4, { dy: 12, out: tHere - 0.35 });
      A.show(s.keyChip, t, tHere - 0.05, { dy: 12 });
      const tableOn = A.prog(t, 0.2, 0.6);
      s.frames.forEach((f) => (f.parentNode.style.opacity = tableOn.toFixed(3)));

      // Motion: wrong (date column only) and sort (whole rows).
      const wrongP = A.prog(t, tOne - 0.05, 1.0, A.E.inOutCubic) * (1 - A.prog(t, tUndo, 0.7, A.E.inOutCubic));
      const sortP = (i) => A.prog(t, tDate - 0.1 + s.pos[i] * 0.06, 1.1, A.E.inOutCubic);
      const yOf = (i, j) => {
        const base = rowY(i) + (rowY(s.pos[i]) - rowY(i)) * sortP(i);
        return j === s.di ? base + (rowY(s.dpos[i]) - rowY(i)) * wrongP : base;
      };

      // Skip highlight / dim.
      const hlBlock = A.win(t, tOnly - 0.1, tRunsC - 0.2, 0.4);
      const dimOthers = A.win(t, tSkips - 0.1, tRunsC - 0.2, 0.4);
      const isJun2 = (i) => rows[i][s.di] === "Jun 2";
      const wrongRow = A.win(t, tLose - 0.15, tUndo, 0.35);

      s.cells.forEach((rc, i) => rc.forEach((c, j) => {
        c.g.setAttribute("transform", `translate(0,${yOf(i, j).toFixed(2)})`);
        const appear = A.prog(t, 0.3 + i * 0.04, 0.4);
        let fill = C.surface, stroke = C.line, ink = C.ink;
        if (c.tone) { fill = c.tone.fill; stroke = A.mix(C.line, c.tone.stroke, A.prog(t, tJumps - 0.2, 0.5)); }
        const lit = hlBlock * (isJun2(i) ? 1 : 0);
        if (lit > 0 && !c.tone) { fill = A.mix(C.surface, "#3A3216", lit); stroke = A.mix(C.line, C.hl, lit); }
        // Row 0 in the wrong attempt (the slot that now shows a stranger's date).
        const bad = wrongRow * (i === 0 && j !== s.di ? 1 : 0);
        if (bad > 0) { fill = A.mix(fill[0] === "#" ? fill : "#152131", "#3A1620", bad); }
        c.rect.setAttribute("fill", fill);
        c.rect.setAttribute("stroke", stroke);
        c.tx.setAttribute("fill", ink);
        const dim = dimOthers * (isJun2(i) ? 0 : 0.7);
        c.g.style.opacity = (appear * (1 - dim)).toFixed(3);
      }));

      // Whole-row bands.
      const bandOn = A.win(t, tWhole - 0.1, tSkipC - 0.3, 0.4);
      s.bands.forEach((b, i) => {
        b.setAttribute("y", (yOf(i, 0) - 3).toFixed(2));
        A.setOpacity(b, bandOn);
      });

      // Insertion: one outline per date cell (12 runs).
      // On "12" (runs beat) the twelve single outlines return at the sorted slots, then cross-fade into the three runs on "3".
      const re12 = A.prog(t, tR12 - 0.1, 0.3) * (1 - A.prog(t, tR3 - 0.15, 0.35));
      s.insDateRuns.forEach((r, i) => A.setOpacity(r, Math.max(A.prog(t, tJumps + (i / n) * Math.max(0.4, t12 - tJumps), 0.25) * (1 - A.prog(t, tNot - 0.3, 0.4)), re12)));
      // Counters.
      const insCnt = A.win(t, t12 - 0.1, tNot - 0.3, 0.35);
      const runCnt = A.prog(t, tR12 - 0.1, 0.35);
      if (t < tRunsC - 1) { s.cDate.textContent = "12 runs"; s.cDate.style.color = C.hl; A.setOpacity(s.cDate, insCnt); }
      else {
        const three = t >= tR3 - 0.1;
        s.cDate.textContent = three ? "3 runs" : "12 runs";
        s.cDate.style.color = three ? C.hl : C.muted;
        A.setOpacity(s.cDate, runCnt);
      }
      s.cMerch.textContent = "8 runs"; A.setOpacity(s.cMerch, A.prog(t, tR8 - 0.15, 0.4));
      s.cAmt.textContent = "12 runs"; A.setOpacity(s.cAmt, A.prog(t, tA12 - 0.15, 0.4));
      s.dateRuns.forEach((r) => A.setOpacity(r, A.prog(t, tR3 - 0.15, 0.35)));
      s.merchRuns.forEach((r, i) => A.setOpacity(r, A.prog(t, tMerch + (i / s.merchRuns.length) * Math.max(0.5, tR8 - tMerch), 0.25)));
      s.amtRuns.forEach((r, i) => A.setOpacity(r, A.prog(t, tAmt + (i / s.amtRuns.length) * Math.max(0.5, tA12 - tAmt), 0.2)));

      // Wrong attempt overlays.
      const wrongOn = A.win(t, tNot - 0.1, tUndo + 0.2, 0.35);
      A.setOpacity(s.wrongFrame, wrongOn);
      A.show(s.wrongTry, t, tNot - 0.1, { dy: 12, out: tUndo + 0.1 });
      A.setOpacity(s.wrongBand, wrongRow);
      A.show(s.xMark.inner, t, tLose - 0.15, { d: 0.45, dy: 0, s0: 0.3, ease: A.E.outBack, out: tUndo + 0.1 });
      A.show(s.wrongQ, t, tLose - 0.1, { dy: 12, out: tUndo + 0.1 });

      // Skip.
      A.setOpacity(s.block, hlBlock);
      A.show(s.query, t, tQuery - 0.1, { dy: 12, out: tRunsC - 0.3 });
      const ap = s.qArrow.draw(t, tOnly - 0.1, 0.5); s.qArrow.setOpacity(ap > 0.001 ? 1 - A.prog(t, tRunsC - 0.3, 0.4) : 0);
      A.show(s.qNote, t, tSkips - 0.1, { dy: 10, out: tRunsC - 0.3 });

      // Runs panel.
      A.show(s.cmp, t, tR3 - 0.1, { dy: 12 });
      A.show(s.book, t, tBill - 0.1, { dy: 14 });
    },
  });
})();
