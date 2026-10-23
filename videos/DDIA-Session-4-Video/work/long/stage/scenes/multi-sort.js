// S17 — multi-sort. Three copies of the same 12 payments (kept for fault tolerance) each sorted differently: by date, merchant,
// country. Each copy is a strip of 12 rows (id on top, its sort-key value below, tinted by value). Queries route to the copy that fits
// them; C-Store → Vertica chip; contrast: secondary index (pointer) vs sort order (full copy of the values).
(function () {
  const BX = 780, BW = 1020, BH = 144, BY = [250, 420, 590];
  const CW = 80, CG = 3, CY = 56, CHT = 76;
  const KEYS = [
    { col: "date", label: "sorted by date", vals: ["Jun 1", "Jun 2", "Jun 3"] },
    { col: "merchant", label: "sorted by merchant", vals: ["Acme", "Bolt", "Cora"] },
    { col: "country", label: "sorted by country", vals: ["DE", "FR", "NL"] },
  ];
  const TONE = ["teal", "orange", "purple"];

  R.scene("multi-sort", {
    build(root, k) {
      const C = K.C, s = {};
      const cols = k.data.columns, rows = k.data.rows, n = rows.length;
      const di = cols.indexOf("date"), mi = cols.indexOf("merchant");
      s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Several copies, several sort orders" });
      s.badge = K.badge(root, { x: 0, y: 128, right: 120, text: "Simplified illustration" });
      const svg = K.svgLayer(root);
      const x0 = BX + (BW - (n * CW + (n - 1) * CG)) / 2;

      s.copies = KEYS.map((key, c) => {
        const ci = cols.indexOf(key.col);
        // Sort: key, then date, then merchant, then id (copy 1 = date, then merchant = the sort-order scene's order).
        const idx = rows.map((r, i) => i).sort((a, b) => {
          const A_ = rows[a], B_ = rows[b];
          const ks = [ci, di, mi];
          for (const j of ks) { if (A_[j] < B_[j]) return -1; if (A_[j] > B_[j]) return 1; }
          return A_[0] - B_[0];
        });
        const pos = rows.map((r, i) => idx.indexOf(i));
        const y = BY[c];
        const g = U.sv("g", {}, svg);
        const frame = U.sv("rect", { x: BX, y, width: BW, height: BH, rx: 18, fill: C.bg2, stroke: C.line2, "stroke-width": 2.5 }, g);
        const ic = U.sv("g", { transform: `translate(${BX + 22},${y + 12}) scale(${34 / 64})`, fill: "none", stroke: C.muted, "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
        ic.innerHTML = K.ICONS.database; U.pinOrigin(ic);
        const lbl = U.sv("text", { x: BX + 66, y: y + 40, "font-size": 30, "font-weight": 750, fill: C.ink }, g);
        U.sv("tspan", {}, lbl, `Copy ${c + 1}`);
        const sub = U.sv("tspan", { fill: C.orange, dx: 14 }, lbl, `· ${key.label}`);
        const cells = rows.map((r, i) => {
          const cg = U.sv("g", {}, g);
          const rect = U.sv("rect", { x: 0, y: y + CY, width: CW, height: CHT, rx: 8, "stroke-width": 2 }, cg);
          const idt = U.sv("text", { x: CW / 2, y: y + CY + 30, "text-anchor": "middle", "font-size": 26, "font-weight": 650, fill: C.muted }, cg, String(r[0]));
          const vt = U.sv("text", { x: CW / 2, y: y + CY + 64, "text-anchor": "middle", "font-size": 26, "font-weight": 700, fill: C.ink }, cg, String(r[ci]));
          const tone = K.TONES[TONE[key.vals.indexOf(r[ci])]];
          return { cg, rect, idt, vt, tone, from: x0 + i * (CW + CG), to: x0 + pos[i] * (CW + CG), rank: pos[i] };
        });
        const x = K.mark(svg, "x", { x: BX + BW - 40, y: y + 34, size: 46 });
        return { g, frame, sub, cells, x, y, left: [BX, y + BH / 2] };
      });

      // Left side: fault-tolerance chip, queries, C-Store chip.
      s.ftChip = K.chip(root, { x: 120, y: 290, text: "Copies for fault tolerance", accent: "muted", icon: "server" });
      s.ftNote = K.text(root, { x: 120, y: 380, w: 640, cls: "label", text: "Lose a machine, keep the data", color: "ok" });
      const q = (txt, c) => K.chip(root, { x: 120, y: BY[c] + BH / 2 - 31, text: txt, accent: "orange", icon: "search" });
      s.q1 = q("Last week's revenue", 0);
      s.q2 = q("One merchant's history", 1);
      s.a1 = K.arrow(svg, { from: [560, BY[0] + BH / 2], to: [BX, BY[0] + BH / 2], tone: "orange", gapEnd: 12 });
      s.a2 = K.arrow(svg, { from: [610, BY[1] + BH / 2], to: [BX, BY[1] + BH / 2], tone: "orange", gapEnd: 12 });
      s.p1 = K.packets(svg, s.a1, { n: 2, period: 1.2, tone: "hl" });
      s.p2 = K.packets(svg, s.a2, { n: 2, period: 1.2, tone: "hl" });
      // Provenance, not a query: a badge under the title.
      s.cstore = K.badge(root, { x: 120, y: 206, text: "Idea: C-Store (research) → Vertica", tone: "hl" });

      // Contrast cards.
      s.idxCard = K.card(root, { x: 120, y: 772, w: 810, accent: "muted", title: "Secondary index", body: "A pointer to the row, stored elsewhere" });
      s.sortCard = K.card(root, { x: 990, y: 772, w: 810, accent: "orange", title: "Sort order", body: `A <span style="color:${C.ink}">full copy</span> of the column values` });

      // Mini glyphs on each card's title line: index = key cell → pointer to a row elsewhere; sort order = a strip of real values.
      const gl = K.svgLayer(root);
      const GY = 772 + 2 + 30 + 2;           // card top + border + padding: title line
      const gIdx = U.sv("g", {}, gl), gIdxIn = U.sv("g", {}, gIdx);
      const kx = 500;
      U.sv("rect", { x: kx, y: GY, width: 90, height: 40, rx: 7, fill: C.surface, stroke: C.line2, "stroke-width": 2 }, gIdxIn);
      U.sv("text", { x: kx + 45, y: GY + 29, "text-anchor": "middle", "font-size": 26, "font-weight": 650, fill: C.muted }, gIdxIn, "Cora");
      s.idxArrow = K.arrow(gIdxIn, { from: [kx + 96, GY + 20], to: [kx + 152, GY + 20], tone: "muted", width: 3 });
      U.sv("rect", { x: kx + 158, y: GY, width: 236, height: 40, rx: 7, fill: "none", stroke: C.muted, "stroke-width": 2, "stroke-dasharray": "7 6" }, gIdxIn);
      U.sv("text", { x: kx + 158 + 118, y: GY + 29, "text-anchor": "middle", "font-size": 26, "font-weight": 600, fill: C.muted }, gIdxIn, "row 7, elsewhere");
      const gSort = U.sv("g", {}, gl), gSortIn = U.sv("g", {}, gSort);
      const vals = ["Acme", "Acme", "Bolt", "Cora"], tones = ["teal", "teal", "orange", "purple"];
      vals.forEach((v, i) => {
        const x = 1360 + i * (CW + CG) + i * 6;
        U.sv("rect", { x, y: GY, width: CW + 6, height: 40, rx: 7, fill: K.TONES[tones[i]].fill, stroke: K.TONES[tones[i]].stroke, "stroke-width": 2 }, gSortIn);
        U.sv("text", { x: x + (CW + 6) / 2, y: GY + 29, "text-anchor": "middle", "font-size": 26, "font-weight": 700, fill: C.ink }, gSortIn, v);
      });
      U.sv("text", { x: 1360 + 4 * (CW + CG + 6) + 4, y: GY + 29, "font-size": 26, "font-weight": 700, fill: C.muted }, gSortIn, "…");
      s.gIdxIn = gIdxIn; s.gSortIn = gSortIn;
      return s;
    },

    update(t, k, s) {
      const C = K.C;
      const tSev = k.word("replicas", "several"), tLosing = k.word("replicas", "losing"), tDoesnt = k.word("replicas", "doesn't");
      const tOrders = k.cue("orders");
      const tBy = [k.word("orders", "date"), k.word("orders", "merchant"), k.word("orders", "country")];
      const tRoute = k.cue("route"), tUses = k.word("route", "uses"), tFits = k.word("route", "fits"), tCS = k.word("route", "C-Store");
      const tSec = k.word("values", "secondary"), tEach = k.word("values", "each sort order");

      A.show(s.title, t, 0.3);
      A.show(s.badge, t, 0.4, { dy: 0 });

      // Fault tolerance: copy 3 goes down briefly, the others carry on.
      const down = A.win(t, tLosing - 0.1, tOrders - 0.2, 0.35);
      const safe = A.win(t, tDoesnt - 0.1, tOrders - 0.2, 0.35);
      A.show(s.ftChip, t, tSev - 0.1, { dy: 12, out: tRoute - 0.4 });
      A.show(s.ftNote, t, tDoesnt - 0.1, { dy: 10, out: tOrders - 0.1 });

      s.copies.forEach((cp, c) => {
        A.show(cp.g, t, tSev - 0.2 + c * 0.25, { dy: 18 });
        const isDown = c === 2 ? down : 0;
        const isSafe = c < 2 ? safe : 0;
        const sorted = A.prog(t, tBy[c] - 0.1, 0.3);
        const routed = c === 0 ? A.prog(t, tFits - 0.1, 0.4) : c === 1 ? A.prog(t, tFits + 0.1, 0.4) : 0;
        let stroke = C.line2;
        if (isDown > 0) stroke = A.mix(C.line2, C.bad, isDown);
        else if (isSafe > 0) stroke = A.mix(C.line2, C.ok, isSafe);
        else if (routed > 0) stroke = A.mix(C.line2, C.orange, routed * (1 - A.prog(t, tSec - 0.2, 0.5) * 0.6));
        cp.frame.setAttribute("stroke", stroke);
        cp.frame.setAttribute("stroke-width", routed > 0.5 ? 3.5 : 2.5);
        cp.frame.setAttribute("fill", A.mix(C.bg2, "#3A1620", isDown * 0.8));
        A.show(cp.x.inner, t, tLosing - 0.1, { d: 0.4, dy: 0, s0: 0.3, ease: A.E.outBack, out: tOrders - 0.2, max: c === 2 ? 1 : 0 });
        cp.sub.setAttribute("fill-opacity", sorted.toFixed(3));
        const move = (cell) => A.prog(t, tBy[c] + 0.1 + cell.rank * 0.035, 0.9, A.E.inOutCubic);
        cp.cells.forEach((cell) => {
          const m = move(cell);
          const x = cell.from + (cell.to - cell.from) * m;
          // Moving cells arc slightly up/down so they don't pass through each other.
          const dy = Math.sin(Math.PI * m) * (cell.to > cell.from ? 10 : -10);
          cell.cg.setAttribute("transform", `translate(${x.toFixed(2)},${dy.toFixed(2)})`);
          cell.rect.setAttribute("fill", A.mix(C.surface, cell.tone.fill, sorted));
          cell.rect.setAttribute("stroke", A.mix(C.line, cell.tone.stroke, sorted));
          cell.vt.style.opacity = sorted.toFixed(3);
          cell.cg.style.opacity = (1 - 0.6 * isDown).toFixed(3);
        });
      });

      // Routing.
      A.show(s.q1, t, tRoute + 0.05, { dy: 12 });
      A.show(s.q2, t, tRoute + 0.45, { dy: 12 });
      s.a1.draw(t, tUses - 0.1, 0.6);
      s.a2.draw(t, tUses + 0.15, 0.6);
      const flow = A.prog(t, tFits - 0.2, 0.4) * (1 - 0.7 * A.prog(t, tSec - 0.2, 0.5));
      s.p1.update(t, flow); s.p2.update(t + 0.4, flow);
      A.show(s.cstore, t, tCS - 0.1, { dy: 12 });

      // Contrast.
      A.show(s.idxCard, t, tSec - 0.1, { dy: 14 });
      A.show(s.sortCard, t, tEach - 0.1, { dy: 14 });
      A.show(s.gIdxIn, t, tSec - 0.1, { dy: 14 });
      s.idxArrow.draw(t, tSec + 0.2, 0.4);
      A.show(s.gSortIn, t, tEach - 0.1, { dy: 14 });
    },
  });
})();
