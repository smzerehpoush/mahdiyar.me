// Short S4 — writes add up: 4,600 tweets/s × 75 followers ≈ 345,000 timeline writes/s; then a celebrity with 30M+ followers,
// whose single tweet floods the frame (one cell = one timeline write; simplified illustration).
(() => {
  const C = K.C;
  const GX = 80, GY = 1090, COLS = 35, ROWS = 13, STEP = 24, CELL = 18;

  R.scene("celebrity", {
    build(root, k) {
      const s = {};
      s.badge = K.badge(root, { x: 80, y: 236, text: "Twitter, circa 2012" });
      s.badge.style.fontSize = "36px";
      s.title = K.text(root, { x: 80, y: 316, w: 840, cls: "h2", text: "Writes aren't free" });
      s.title.style.fontSize = "84px";

      // Equation: "4,600 × 75" on one row, "≈ 345,000" below it.
      const big = (parent, txt, size, color) => {
        const n = U.el("div", { class: "k-text", style: { position: "relative", fontSize: size + "px", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: "1", color, fontVariantNumeric: "tabular-nums" } }, parent, txt);
        return n;
      };
      const small = (parent, txt) => U.el("div", { class: "k-text", style: { position: "relative", marginTop: "10px", fontSize: "38px", fontWeight: 600, color: C.muted, whiteSpace: "nowrap" } }, parent, txt);
      s.row = U.el("div", { style: { position: "absolute", left: "80px", top: "470px", width: "840px", display: "flex", alignItems: "flex-start", gap: "36px" } }, root);
      s.a = U.el("div", { style: { position: "relative" } }, s.row); big(s.a, "4,600", 116, C.ink); small(s.a, "tweets / s");
      s.x = big(s.row, "×", 96, C.faint); s.x.style.lineHeight = "1.15";
      s.b = U.el("div", { style: { position: "relative" } }, s.row); big(s.b, "75", 116, C.ink); small(s.b, "followers each (avg)");
      s.res = U.el("div", { style: { position: "absolute", left: "80px", top: "690px", width: "840px" } }, root);
      s.resN = big(s.res, "≈ 345,000", 132, C.orange);
      small(s.res, "timeline writes / s");

      // Celebrity.
      const svg = K.svgLayer(root);
      s.cel = K.box(svg, { x: 80, y: 930, w: 840, h: 128, label: "Celebrity account", sub: "30,000,000+ followers", icon: "star", iconInline: true, iconSize: 60, fs: 46, tone: "hl" });
      s.cells = [];
      s.grid = U.sv("g", {}, svg);
      for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
        const n = U.sv("rect", { x: GX + c * STEP, y: GY + r * STEP, width: CELL, height: CELL, rx: 4, fill: C.orange }, s.grid);
        s.cells.push({ c, r, n, d: Math.hypot(c / (COLS - 1), r / (ROWS - 1) * 0.6) });
      }
      s.pillWrap = U.el("div", { style: { position: "absolute", left: "80px", top: "1180px", width: "840px", display: "flex", justifyContent: "center" } }, root);
      s.pill = U.el("div", { class: "k-text", style: { position: "relative", padding: "18px 34px", borderRadius: "22px", background: C.bg, border: `3px solid ${C.orange}`,
        fontSize: "50px", fontWeight: 800, letterSpacing: "-0.02em", color: C.ink, whiteSpace: "nowrap", boxShadow: "0 20px 50px rgba(0,0,0,.6)" } }, s.pillWrap);
      s.pill.innerHTML = `1 tweet → <span style="color:${C.orange}">30,000,000</span> writes`;
      s.note = K.text(root, { x: 920, y: 1404, cls: "small", text: "Simplified illustration" });
      Object.assign(s.note.style, { left: "auto", right: "160px", fontSize: "30px" });
      return s;
    },

    update(t, k, s) {
      A.show(s.badge, t, -1);
      A.show(s.title, t, 0.3);

      // `avg`: "Each tweet" → 4,600; "75 followers" → × 75; "345,000 writes a second" → the result counts up.
      const w75 = k.word("avg", "75"), wFol = k.word("avg", "followers"), w345 = k.word("avg", "345,000"), wWr = k.word("avg", "writes");
      const cCel = k.cue("celeb");
      const dimEq = 1 - 0.6 * A.prog(t, cCel, 0.5);
      A.show(s.a, t, k.cue("avg") + 0.05, { dy: 16, max: dimEq });
      A.show(s.x, t, w75 - 0.1, { dy: 0, s0: 0.6, max: dimEq });
      A.show(s.b, t, w75 - 0.05, { dy: 16, max: dimEq });
      s.b.lastChild.style.opacity = A.prog(t, wFol, 0.4).toFixed(3);
      A.show(s.res, t, w345 - 0.1, { dy: 16, max: dimEq });
      const v = A.tween(t, w345 - 0.1, Math.max(0.6, wWr - w345), 0, 345000, A.E.outCubic);
      s.resN.textContent = "≈ " + U.fmt(Math.round(v / 1000) * 1000);
      s.res.lastChild.style.opacity = A.prog(t, wWr - 0.05, 0.4).toFixed(3);

      // `celeb`: "some accounts" → the celebrity; "30 million followers" → its follower count.
      A.show(s.cel.inner, t, k.word("celeb", "accounts") - 0.1, { dy: 14 });
      A.setOpacity(s.cel.sub, A.prog(t, k.word("celeb", "30") - 0.05, 0.4));

      // `flood`: "One tweet" → cells flood out from the celebrity; "30 million writes" → the callout.
      const cF = k.cue("flood");
      s.cells.forEach((cell) => {
        const td = cF + 0.05 + cell.d * 1.1;
        const p = A.prog(t, td, 0.18);
        cell.n.style.opacity = p.toFixed(3);
        cell.n.setAttribute("fill", A.mix(C.hl, C.orange, A.prog(t, td + 0.1, 0.4)));
      });
      A.show(s.pill, t, k.word("flood", "30") - 0.05, { dy: 0, s0: 0.85, ease: A.E.outBack, d: 0.5 });
      A.show(s.note, t, cF + 0.6, { dy: 0 });
    },
  });
})();
