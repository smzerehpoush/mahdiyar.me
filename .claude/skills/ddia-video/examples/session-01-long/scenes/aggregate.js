// S20 — Don't average percentiles. Three servers (window.DATA.aggregate) each with a histogram and its own p99.
// Wrong: average of the p99s = 571 ms (✕). Right: add the histograms (stacked, shared count scale), read p99 = 208 ms (✓).
// Then the tools: HdrHistogram · t-digest. Histograms use a two-scale x axis: 0–400 ms wide, 400–1600 ms compressed.
// Every beat is anchored to the spoken word it depicts (k.word), see update().
(function () {
  const C = K.C;
  const SEG1 = 0.62, GAPF = 0.05, SEG2 = 1 - SEG1 - GAPF; // axis fractions: 0–400 ms | break | 400–1600 ms
  const SPLIT = 400, MAXMS = 1600, BIN = 10;
  const toHex = (rgb) => "#" + rgb.match(/\d+/g).map((v) => (+v).toString(16).padStart(2, "0")).join("");
  const COLORS = [C.sca, toHex(A.mix(C.sca, C.bg, 0.5)), C.hl];  // Server A, B (darker orange), C
  const fmt = (n) => U.fmt(n);

  /** x position of `ms` on a two-scale axis starting at x0 with width w. */
  const xOf = (x0, w, ms) => (ms <= SPLIT ? x0 + (ms / SPLIT) * SEG1 * w : x0 + (SEG1 + GAPF) * w + ((ms - SPLIT) / (MAXMS - SPLIT)) * SEG2 * w);
  /** Bar geometry (x, width) for 10 ms bin i. */
  function binX(x0, w, i) {
    const a = xOf(x0, w, i * BIN), b = xOf(x0, w, (i + 1) * BIN);
    if (i * BIN < SPLIT) return [a + 0.8, Math.max(1, b - a - 1.6)];
    return [a, Math.max(2.4, b - a)]; // compressed region: keep sparse tail bars visible
  }
  /** Axis line with a break mark in the gap. */
  function axis(g, x0, w, y) {
    const s1 = x0 + SEG1 * w, s2 = x0 + (SEG1 + GAPF) * w;
    U.sv("path", { d: `M${x0},${y} H${s1} M${s2},${y} H${x0 + w}`, stroke: C.line2, "stroke-width": 3, fill: "none", "stroke-linecap": "round" }, g);
    const m = (cx) => `M${cx - 5},${y + 8} L${cx + 4},${y - 10}`;
    U.sv("path", { d: m(s1 + 6) + " " + m(s2 - 6), stroke: C.muted, "stroke-width": 3, fill: "none", "stroke-linecap": "round" }, g);
  }
  const minH = (v, scale) => (v > 0 ? Math.max(3, v * scale) : 0);

  R.scene("aggregate", {
    build(root, k) {
      const s = {}, D = k.data.aggregate;
      s.D = D;
      s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Combining measurements." });
      s.badge = K.badge(root, { x: 0, y: 130, right: 120, text: "Simplified illustration" });
      const svg = K.svgLayer(root);
      const NB = MAXMS / BIN;

      // ---- Three server cards.
      s.cards = D.servers.map((sv, j) => {
        const x = 120 + j * 580, y = 236, w = 520, h = 290;
        const g = U.sv("g", { transform: `translate(${x},${y})` }, svg);
        const inner = U.sv("g", {}, g);
        const frame = U.sv("rect", { x: 0, y: 0, width: w, height: h, rx: 22, fill: C.surface, stroke: C.line2, "stroke-width": 3 }, inner);
        const sw = U.sv("rect", { x: 28, y: 26, width: 14, height: 28, rx: 4, fill: COLORS[j] }, inner);
        U.sv("text", { x: 54, y: 50, "font-size": 32, "font-weight": 750, fill: C.ink }, inner, sv.name);
        U.sv("text", { x: w - 28, y: 50, "font-size": 26, "font-weight": 600, fill: C.muted, "text-anchor": "end" }, inner, `${fmt(sv.n)} requests`);
        const px0 = 28, pw = w - 56, top = 74, ph = 118, base = top + ph;
        const max = Math.max(...sv.hist);
        const bars = [];
        for (let i = 0; i < NB; i++) {
          if (!sv.hist[i]) continue;
          const [bx, bw] = binX(px0, pw, i);
          bars.push({ r: U.sv("rect", { x: bx.toFixed(2), width: bw.toFixed(2), fill: COLORS[j] }, inner), h: minH(sv.hist[i], ph / max) });
        }
        axis(inner, px0, pw, base + 2);
        const tick = (ms, txt, anchor) => U.sv("text", { x: xOf(px0, pw, ms), y: base + 36, "font-size": 26, "font-weight": 600, fill: C.faint, "text-anchor": anchor }, inner, txt);
        tick(0, "0", "start"); tick(SPLIT, "400", "middle"); tick(MAXMS, "1,600 ms", "end");
        const mx = xOf(px0, pw, sv.p99);
        const marker = U.sv("path", { d: "", stroke: C.ink, "stroke-width": 3, "stroke-dasharray": "7 6", fill: "none" }, inner);
        const ro = U.sv("text", { x: 28, y: 266, "font-size": 32, "font-weight": 750, fill: C.ink }, inner);
        ro.innerHTML = `<tspan fill="${C.muted}" font-weight="650">p99 </tspan><tspan>${fmt(sv.p99)} ms</tspan>`;
        return { g, inner, frame, bars, base, top, mx, marker, ro, num: ro.lastChild };
      });

      // ---- Wrong: average of the p99s.
      const p = D.servers.map((x) => x.p99);
      s.wHdr = K.label(svg, { x: 120, y: 606, text: "Average of the p99s", anchor: "start", size: 32, weight: 750, fill: "bad" });
      s.wExpr = K.text(root, { x: 120, y: 632, cls: "mono", size: 40, text: `(${p.map(fmt).join(" + ")}) ÷ ${p.length}` });
      s.wRes = K.text(root, { x: 120, y: 694, cls: "", text: `= ${fmt(D.avgOfP99)} ms`, color: "bad" });
      Object.assign(s.wRes.style, { fontSize: "96px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: "1" });
      s.wX = K.mark(svg, "x", { x: 640, y: 744, size: 72 });
      s.wNote = K.text(root, { x: 120, y: 812, cls: "label", text: "Averaging percentiles is meaningless.", color: "muted" });

      // ---- Right: stacked combined histogram (shared count scale), p99 read from it.
      const X0 = 800, W = 980, TOP = 632, PH = 158, BASE = TOP + PH;
      s.BASE = BASE;
      s.rHdr = K.label(svg, { x: X0, y: 606, text: "Merge the histograms, then read p99", anchor: "start", size: 32, weight: 750, fill: "ok" });
      s.rTot = K.label(svg, { x: X0 + W, y: 606, text: `all ${fmt(D.combined.n)} requests`, anchor: "end", size: 26, weight: 600, fill: "muted" });
      s.plot = U.sv("g", {}, svg);
      const cmax = Math.max(...D.combinedHist), sc = PH / cmax;
      s.stack = [];
      for (let i = 0; i < NB; i++) {
        if (!D.combinedHist[i]) continue;
        const [bx, bw] = binX(X0, W, i);
        s.stack.push({ hs: D.servers.map((sv) => minH(sv.hist[i], sc)), rs: D.servers.map((_, j) => U.sv("rect", { x: bx.toFixed(2), width: bw.toFixed(2), fill: COLORS[j] }, s.plot)) });
      }
      s.axis = U.sv("g", {}, svg);
      axis(s.axis, X0, W, BASE + 2);
      [[0, "0", "start"], [100, "100"], [200, "200"], [300, "300"], [400, "400"], [1000, "1,000"], [1600, "1,600 ms", "end"]].forEach(([ms, txt, an]) =>
        U.sv("text", { x: xOf(X0, W, ms), y: BASE + 34, "font-size": 26, "font-weight": 600, fill: C.faint, "text-anchor": an || "middle" }, s.axis, txt));
      const mx = xOf(X0, W, D.combined.p99);
      s.rMark = U.sv("path", { d: `M${mx},${TOP - 14} V${BASE}`, stroke: C.ok, "stroke-width": 4, fill: "none", "stroke-linecap": "round" }, svg);
      s.rRes = K.label(svg, { x: mx + 22, y: TOP + 34, text: `p99 = ${fmt(D.combined.p99)} ms`, anchor: "start", size: 40, weight: 800, fill: "ok" });
      s.rOk = K.mark(svg, "check", { x: mx + 22 + 300, y: TOP + 20, size: 56 });

      // ---- Tools.
      s.tools = K.chips(root, { x: X0, y: 852, w: 460, items: [{ text: "HdrHistogram", accent: "sca" }, { text: "t-digest", accent: "sca" }] });
      s.toolNote = K.text(root, { x: X0 + 476, y: 868, cls: "label", size: 28, text: "cheap to merge across servers & time", color: "muted" });
      s.toolNote.style.fontWeight = 600;
      return s;
    },

    update(t, k, s) {
      const cW = k.cue("wrong");
      A.show(s.title, t, 0.3); // section heading: lands with the scene, ahead of the voice
      A.show(s.badge, t, k.word("servers", "illustration") - 0.05, { dy: 10 });

      // ---- servers: cards build on "three servers", then each reports its own p99 on "p99".
      const tCards = k.word("servers", "three servers") - 0.1;
      const tP99 = k.word("servers", "p99") - 0.05;
      const tExpr = k.word("wrong", "them") - 0.05; // "Averaging them"
      // Layer timing for the merge ("merge the histograms first"; also highlights the source card as its layer is added).
      const tMerge = k.word("right", "merge") - 0.05;
      const tLayer = (j) => tMerge + 0.15 + j * 0.5;
      s.cards.forEach((c, j) => {
        const t0 = tCards + j * 0.2;
        A.show(c.inner, t, t0, { dy: 18 });
        const gp = A.prog(t, t0 + 0.2, 0.9);
        c.bars.forEach((b) => { const h = b.h * gp; b.r.setAttribute("y", (c.base - h).toFixed(2)); b.r.setAttribute("height", h.toFixed(2)); });
        const mp = A.prog(t, tP99 + j * 0.15, 0.45);
        c.marker.setAttribute("d", `M${c.mx},${c.base} V${(c.base - (c.base - c.top + 8) * mp).toFixed(1)}`);
        A.setOpacity(c.marker, mp > 0.01 ? 1 : 0);
        A.setOpacity(c.ro, A.prog(t, tP99 + j * 0.15 + 0.1, 0.4));
        // p99 values glow (yellow: inputs) while the average is built from them; frame glows while its histogram is merged.
        c.num.setAttribute("fill", A.mix(C.ink, C.hl, A.win(t, tExpr + j * 0.2, tExpr + 1.6, 0.3)));
        c.frame.setAttribute("stroke", A.mix(C.line2, COLORS[j], A.win(t, tLayer(j), tLayer(j) + 0.9, 0.25)));
      });

      // ---- wrong
      A.show(s.wHdr.inner, t, cW + 0.2, { dy: 10 });
      A.show(s.wExpr, t, tExpr, { dy: 12 });
      A.show(s.wRes, t, k.word("wrong", "571") - 0.05, { dy: 14, s0: 0.95 });
      // "…but averaging percentiles is meaningless": the note on its clause, the ✕ on "meaningless".
      A.show(s.wNote, t, k.word("wrong", "averaging percentiles") - 0.05, { dy: 10 });
      A.show(s.wX.inner, t, k.word("wrong", "meaningless") - 0.05, { d: 0.45, dy: 0, s0: 0.3, ease: A.E.outBack });

      // ---- right: merge the histograms (stack A, then B, then C), then read p99.
      A.show(s.rHdr.inner, t, tMerge, { dy: 10 });
      A.show(s.rTot.inner, t, tMerge + 0.2, { dy: 10 });
      A.show(s.axis, t, tMerge + 0.1, { dy: 0 });
      const lp = [0, 1, 2].map((j) => A.prog(t, tLayer(j), 0.8, A.E.inOutCubic));
      s.stack.forEach((b) => {
        let y = s.BASE;
        b.rs.forEach((r, j) => {
          const h = b.hs[j] * lp[j];
          y -= h;
          r.setAttribute("y", y.toFixed(2)); r.setAttribute("height", h.toFixed(2));
          A.setOpacity(r, h > 0.05 ? 1 : 0);
        });
      });
      A.draw(s.rMark, t, k.word("right", "p99") - 0.05, 0.5); // "then read the p99"
      const tRead = k.word("right", "208") - 0.05;
      A.show(s.rRes.inner, t, tRead, { dy: 10 });
      A.show(s.rOk.inner, t, tRead + 0.2, { d: 0.45, dy: 0, s0: 0.3, ease: A.E.outBack });

      // ---- tools
      A.show(s.tools.chips[0], t, k.word("tools", "HdrHistogram") - 0.05, { dy: 12 });
      A.show(s.tools.chips[1], t, k.word("tools", "t-digest") - 0.05, { dy: 12 });
      A.show(s.toolNote, t, k.word("tools", "merging") - 0.05, { dy: 10 }); // "make merging cheap, across servers and time windows"
    },
  });
})();
