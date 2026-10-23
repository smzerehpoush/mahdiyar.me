// S13 — compress. The country column of the 12-row illustration, one bitmap per distinct value (bits aligned under each row),
// each bitmap as run lengths (zeros first), then a long sparse bitmap collapsing into a short run list.
// Beats: column → distinct → bitmaps → runs → smaller.
(function () {
  const X0 = 320, CW = 84, PITCH = 94;          // cell grid (12 rows, left edge / width / pitch)
  const Y_IDX = 228, Y_COL = 262, COL_H = 64;   // row index / country column
  const Y_CHIP = 362;                            // chip row
  const ROW_Y = [478, 618, 758], BIT_H = 60;     // bitmap rows
  const RX = 1494, RP = 60;                      // run-list column (x, pitch)
  const MONO = "JetBrains Mono, monospace";
  const cx = (i) => X0 + i * PITCH + CW / 2;
  const TONE = { DE: "orange", FR: "teal", NL: "purple" };

  /** Runs of a bit string, zeros first: [{bit, start, len}] (first run may be a zero-run of length 0). */
  function runsOf(bits) {
    const out = []; let cur = "0", start = 0, len = 0;
    for (let i = 0; i < bits.length; i++) {
      if (bits[i] === cur) len++;
      else { out.push({ bit: cur, start, len }); cur = bits[i]; start = i; len = 1; }
    }
    out.push({ bit: cur, start, len });
    return out;
  }

  R.scene("compress", {
    build(root, k) {
      const C = K.C, s = {};
      const rows = k.data.rows, bm = k.data.bitmaps;
      const country = rows.map((r) => r[3]);
      s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Column values repeat" });
      s.badge = K.badge(root, { x: 0, y: 128, right: 120, text: "Simplified illustration" });
      const svg = K.svgLayer(root);
      const T = (parent, o, txt) => U.sv("text", { "text-anchor": "middle", "font-weight": 650, "font-family": MONO, ...o }, parent, txt);

      // ---- Country column (laid out horizontally) + row numbers.
      s.colG = U.sv("g", {}, svg);
      s.idxLbl = T(s.colG, { x: 120, y: Y_IDX + 22, "text-anchor": "start", "font-size": 26, fill: C.faint, "font-family": null, "font-weight": 600 }, "row");
      s.colLbl = T(s.colG, { x: 120, y: Y_COL + COL_H / 2 + 10, "text-anchor": "start", "font-size": 30, fill: C.muted }, "country");
      s.idx = country.map((c, i) => T(s.colG, { x: cx(i), y: Y_IDX + 22, "font-size": 26, fill: C.faint }, String(i + 1)));
      s.cells = country.map((c, i) => {
        const g = U.sv("g", {}, s.colG);
        const rect = U.sv("rect", { x: X0 + i * PITCH, y: Y_COL, width: CW, height: COL_H, rx: 10, "stroke-width": 2.5 }, g);
        const tx = T(g, { x: cx(i), y: Y_COL + COL_H / 2 + 11, "font-size": 30, "font-weight": 700 }, c);
        return { g, rect, tx, c };
      });

      // ---- Chips (distinct, book) and later the RLE chip.
      s.chipD = K.chip(root, { x: X0, y: Y_CHIP, text: "3 distinct values · 12 rows", accent: "orange" });
      s.chipB = K.chip(root, { x: X0 + 470, y: Y_CHIP, text: "Book: billions of sales", accent: "muted", icon: "file" });
      // "· 100,000 products" lands on "100,000": the chip grows to reveal it (inline in the label span, clipped by max-width).
      s.chipB100k = U.el("span", {}, s.chipB.querySelector("span"), "\u00a0· 100,000 products");
      Object.assign(s.chipB100k.style, { display: "inline-block", overflow: "hidden", verticalAlign: "bottom", whiteSpace: "nowrap" });
      s.chipRLE = K.chip(root, { x: X0, y: Y_CHIP, text: "Run-length encoding: store run lengths, not bits", accent: "orange" });

      // ---- Bitmaps: one row per distinct value, bits under the rows they describe.
      s.bms = ["DE", "FR", "NL"].map((v, r) => {
        const y = ROW_Y[r], tone = TONE[v], col = K.toneColor(tone), bits = bm[v].bits;
        const g = U.sv("g", {}, svg);
        const lbl = U.sv("text", { x: 120, y: y + 30, "font-size": 40, "font-weight": 800, fill: col }, g, v);
        const sub = U.sv("text", { x: 120, y: y + 62, "font-size": 26, "font-weight": 600, fill: C.muted }, g, "bitmap");
        const bitsG = U.sv("g", {}, g);
        const cells = [...bits].map((b, i) => {
          const rect = U.sv("rect", { x: X0 + i * PITCH, y, width: CW, height: BIT_H, rx: 8, "stroke-width": 2 }, bitsG);
          const tx = T(bitsG, { x: cx(i), y: y + BIT_H / 2 + 12, "font-size": 34, "font-weight": 700 }, b);
          return { rect, tx, b };
        });
        // Run brackets + counts.
        const runs = runsOf(bits);
        const brG = U.sv("g", {}, g);
        const br = runs.map((ru, j) => {
          const rg = U.sv("g", {}, brG);
          const c = ru.bit === "1" ? col : C.muted;
          let x1, x2, path = null;
          if (ru.len === 0) { x1 = x2 = X0 - 24; }
          else {
            x1 = X0 + ru.start * PITCH + 4; x2 = X0 + (ru.start + ru.len - 1) * PITCH + CW - 4;
            path = U.sv("path", { d: `M${x1},${y + BIT_H + 8} v10 H${x2} v-10`, fill: "none", stroke: c, "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" }, rg);
          }
          const num = T(rg, { x: (x1 + x2) / 2, y: y + BIT_H + 48, "font-size": 28, "font-weight": 700, fill: ru.len === 0 ? C.hl : c }, String(ru.len));
          U.pinOrigin(num);
          return { rg, path, num, ru };
        });
        // Run list (right column).
        const list = bm[v].runs.map((n, j) => {
          const lg = U.sv("g", {}, g);
          U.sv("rect", { x: RX + j * RP, y: y + 4, width: RP - 8, height: BIT_H - 8, rx: 10, fill: C.surface2, stroke: col, "stroke-width": 2.5 }, lg);
          T(lg, { x: RX + j * RP + (RP - 8) / 2, y: y + BIT_H / 2 + 12, "font-size": 32, "font-weight": 800, fill: C.ink }, String(n));
          return lg;
        });
        return { v, g, lbl, sub, cells, br, list, col, tone };
      });
      s.runHdr = U.sv("text", { x: RX, y: ROW_Y[0] - 22, "font-size": 28, "font-weight": 700, fill: C.orange }, svg, "Runs · zeros first");

      // ---- Smaller: a long, mostly-zero bitmap (one product among many) collapsing into its run list.
      s.sm = U.sv("g", {}, svg);
      const N = 64, ONES = [22, 47], SW = 20, SP = 25, SX = 120 + (1680 - N * SP + 5) / 2, SY = 520, SH = 44;
      s.smLbl = K.text(root, { x: 120, y: 436, cls: "label", html: `One product's bitmap <span style="color:${C.muted};font-weight:550">· one bit per sale</span>`, color: "orange" });
      s.smBits = [];
      for (let i = 0; i < N; i++) {
        const one = ONES.includes(i);
        s.smBits.push(U.sv("rect", { x: SX + i * SP, y: SY, width: SW, height: SH, rx: 4, fill: one ? C.orange : C.surface, stroke: one ? C.orange : C.line2, "stroke-width": 2 }, s.sm));
      }
      const smStr = Array.from({ length: N }, (_, i) => (ONES.includes(i) ? "1" : "0")).join("");
      const smRuns = runsOf(smStr);
      const PW = 112, PG = 18, PY = 650, PH = 72;
      const pX0 = 960 - (smRuns.length * (PW + PG) - PG) / 2;
      s.smRuns = smRuns.map((ru, j) => {
        const one = ru.bit === "1";
        const rect = U.sv("rect", { rx: 10, "stroke-width": 3, fill: one ? "#33210F" : C.bg2, stroke: one ? C.orange : C.muted }, s.sm);
        const tx = T(s.sm, { "font-size": 36, "font-weight": 800, fill: one ? C.orange : C.ink }, String(ru.len));
        const from = { x: SX + ru.start * SP - 2, w: ru.len * SP - 1, y: SY - 2, h: SH + 4 };
        const to = { x: pX0 + j * (PW + PG), w: PW, y: PY, h: PH };
        return { rect, tx, from, to };
      });
      s.smBitsLbl = U.sv("text", { x: SX + N * SP - 5, y: SY - 22, "text-anchor": "end", "font-size": 28, "font-weight": 650, fill: C.muted }, s.sm, "64 bits, almost all 0");
      s.smArrow = K.arrow(s.sm, { from: [960, SY + SH + 14], to: [960, PY - 12], tone: "orange", width: 4 });
      s.smRunLbl = U.sv("text", { x: pX0 + smRuns.length * (PW + PG) + 10, y: PY + PH / 2 + 10, "font-size": 28, "font-weight": 650, fill: C.orange }, s.sm, "5 run lengths");

      const wrap = U.el("div", {}, root);
      Object.assign(wrap.style, { position: "absolute", left: "120px", top: "800px", width: "1680px", display: "flex", justifyContent: "center" });
      wrap.style.alignItems = "center"; wrap.style.gap = "14px";
      s.chain = [["Many distinct values", "ink"], ["sparse bitmaps", "ink"], ["run-length encoding", "ink"], ["compact", "orange"]].map(([txt, tone], i) => {
        const nodes = [];
        if (i > 0) { const a = U.el("div", {}, wrap, "→"); Object.assign(a.style, { position: "relative", fontSize: "36px", fontWeight: 700, color: C.orange }); nodes.push(a); }
        const c = K.chip(wrap, { text: txt, accent: tone === "orange" ? "orange" : "ink", size: 30 });
        Object.assign(c.style, { position: "relative", background: tone === "orange" ? "#33210F" : C.surface, borderColor: tone === "orange" ? C.orange : C.line2 });
        nodes.push(c);
        return nodes;
      });
      return s;
    },

    update(t, k, s) {
      const C = K.C;
      // ---- Anchors.
      const tCol = k.word("column", "country");
      const tDistinct = k.word("distinct", "distinct"), tBillions = k.word(2, "billions");
      const tBitmap = k.word("bitmaps", "bitmap"), tOneBit = k.word("bitmaps", "one bit"), tSet = k.word("bitmaps", "set");
      const tWhere = k.word("bitmaps", "wherever");
      const tRuns = k.word("runs", "runs"), tHow = k.word("runs", "how long"), tCount = k.word("runs", "counting");
      const tGer = k.word("runs", "Germany");
      const tNums = [k.word("runs", "zero", 2), k.word("runs", "three"), k.word("runs", "six"), k.word("runs", "two"), k.word("runs", "one", 1)];
      const tRLE = k.word(5, "run");
      const tSm = k.cue("smaller"), tMany = k.word("smaller", "many"), t100k = k.word("smaller", "100,000");
      const tZeros = k.word("smaller", "mostly"), tEnc = k.word("smaller", "run length"), tCompact = k.word("smaller", "compact");
      const out1 = tMany - 0.1; // the 12-row bitmaps make way for the long bitmap

      A.show(s.title, t, 0.3);
      A.show(s.badge, t, 0.4, { dy: 0 });

      // ---- Column: cells land left to right; colored by value on "distinct".
      const colDim = 1 - 0.65 * A.prog(t, out1, 0.5);
      s.colG.style.opacity = colDim.toFixed(3);
      A.setOpacity(s.idxLbl, A.prog(t, tCol, 0.4)); A.setOpacity(s.colLbl, A.prog(t, tCol, 0.4));
      const colorP = A.prog(t, tDistinct, 0.5);
      s.cells.forEach((c, i) => {
        const t0 = tCol + 0.1 + i * 0.07;
        A.setOpacity(c.g, A.prog(t, t0, 0.35));
        A.setOpacity(s.idx[i], A.prog(t, t0, 0.35));
        const col = K.toneColor(TONE[c.c]);
        // On "wherever that row has the value": DE cells pulse with the DE bitmap's ones.
        c.rect.setAttribute("fill", A.mix(C.surface, { DE: "#33210F", FR: "#0F2E2C", NL: "#241F45" }[c.c], colorP));
        c.rect.setAttribute("stroke", A.mix(C.line2, col, colorP));
        c.tx.setAttribute("fill", A.mix(C.ink, col, colorP));
      });

      // ---- Chips.
      A.show(s.chipD, t, tDistinct, { dy: 12, out: tRLE - 0.5 });
      A.show(s.chipB, t, tBillions - 0.05, { dy: 12, out: tRLE - 0.5 });
      const p100k = A.prog(t, k.word(2, "100,000") - 0.05, 0.45);
      s.chipB100k.style.maxWidth = (300 * p100k).toFixed(1) + "px";
      A.setOpacity(s.chipB100k, p100k);
      A.show(s.chipRLE, t, tRLE, { dy: 12, out: out1 });

      // ---- Bitmaps.
      s.bms.forEach((b, r) => {
        const t0 = tBitmap + r * 0.25;
        A.show(b.g, t, t0, { dy: 14, out: out1 });
        const onP = A.prog(t, tSet + r * 0.25, 0.45);
        b.cells.forEach((c, i) => {
          const typed = A.prog(t, tOneBit + r * 0.18 + i * 0.07, 0.25);
          A.setOpacity(c.tx, typed);
          const one = c.b === "1";
          c.rect.setAttribute("fill", one ? A.mix("#0F1824", { DE: "#33210F", FR: "#0F2E2C", NL: "#241F45" }[b.v], onP) : C.bg2);
          c.rect.setAttribute("stroke", one ? A.mix(C.line, b.col, onP) : C.line);
          c.tx.setAttribute("fill", one ? A.mix(C.muted, b.col, onP) : C.faint);
        });
        // Brackets on "runs"; counts on "how long".
        b.br.forEach((x, j) => {
          const tb = tRuns + r * 0.2 + j * 0.06;
          if (x.path) A.draw(x.path, t, tb, 0.35);
          const tn = tHow + r * 0.25 + j * 0.08;
          const lead = x.ru.len === 0 ? tCount + 0.3 : tn;
          const op = A.prog(t, lead, 0.35);
          A.setOpacity(x.num, op);
          if (x.ru.len === 0) { // the leading zero-run of DE pulses on "counting zeros first"
            const pulse = A.win(t, tCount + 0.3, tGer, 0.3) * (0.5 + 0.5 * Math.sin((t - tCount) * 7));
            x.num.setAttribute("font-size", (28 + 8 * pulse).toFixed(1));
          }
        });
        // Run list: DE number by number on the narration; FR, NL on "run-length encoding".
        b.list.forEach((lg, j) => {
          const tl = r === 0 ? tNums[j] - 0.1 : tRLE + 0.2 + (r - 1) * 0.35 + j * 0.08;
          A.show(lg, t, tl, { d: 0.35, dy: 0, dx: -10 });
        });
      });
      A.show(s.runHdr, t, tCount, { dy: 0, out: out1 });

      // ---- Smaller: long sparse bitmap → runs → short list.
      A.show(s.smLbl, t, tMany + 0.1, { dy: 12 });
      s.sm.style.opacity = A.prog(t, tMany + 0.1, 0.4).toFixed(3);
      s.smBits.forEach((r, i) => A.setOpacity(r, A.prog(t, tMany + 0.1 + i * 0.012, 0.3) * (1 - 0.45 * A.prog(t, tEnc + 0.9, 0.5))));
      A.setOpacity(s.smBitsLbl, A.prog(t, tZeros, 0.4));
      const showRuns = A.prog(t, tZeros + 0.3, 0.4);
      const col = A.prog(t, tEnc + 0.1, 1.1, A.E.inOutCubic);
      s.smRuns.forEach((ru, j) => {
        const x = U.lerp(ru.from.x, ru.to.x, col), w = U.lerp(ru.from.w, ru.to.w, col);
        const y = U.lerp(ru.from.y, ru.to.y, col), h = U.lerp(ru.from.h, ru.to.h, col);
        ru.rect.setAttribute("x", x.toFixed(1)); ru.rect.setAttribute("width", w.toFixed(1));
        ru.rect.setAttribute("y", y.toFixed(1)); ru.rect.setAttribute("height", h.toFixed(1));
        ru.rect.setAttribute("fill-opacity", (0.0 + 1.0 * col).toFixed(3));
        A.setOpacity(ru.rect, showRuns);
        ru.tx.setAttribute("x", (x + w / 2).toFixed(1));
        ru.tx.setAttribute("y", (y + h / 2 + 12).toFixed(1));
        A.setOpacity(ru.tx, A.prog(t, tEnc + 0.9, 0.4));
      });
      s.smArrow.draw(t, tEnc + 0.1, 0.8);
      A.setOpacity(s.smRunLbl, A.prog(t, tEnc + 1.0, 0.4));

      // Chain builds with the narration: many values → sparse → RLE → compact.
      const segT = [tMany + 0.1, tZeros, tEnc, tCompact - 0.1];
      s.chain.forEach((nodes, i) => nodes.forEach((n) => A.show(n, t, segT[i], { dy: 0, dx: -12, d: 0.45 })));
    },
  });
})();
