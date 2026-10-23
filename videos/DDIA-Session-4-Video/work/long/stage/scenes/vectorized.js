// S15 — vectorized. Hardware pipeline Disk → Memory → CPU cache (L1) → CPU core with two pinch points; compressed chunks fit in
// L1 (vs a few uncompressed rows); the core runs bitwise AND over the chunk in a tight loop; vectorized processing / SIMD.
// Beats: bottleneck → cache → loop → vectorized. No speed-up numbers (accuracy note 16).
(function () {
  const BY = 250, BHt = 160, CY = BY + BHt / 2;   // pipeline boxes
  const PX0 = 120, PX1 = 1800, PY0 = 498, PY1 = 800; // lower panel
  const MONO = "JetBrains Mono, monospace";
  const BG = { orange: "#33210F", teal: "#0F2E2C", hl: "#3A3216" };

  R.scene("vectorized", {
    build(root, k) {
      const C = K.C, s = {}, D = k.data;
      s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Compression pays off twice" });
      const svg = K.svgLayer(root);
      const T = (parent, o, txt) => U.sv("text", { "text-anchor": "middle", "font-weight": 650, ...o }, parent, txt);

      // ---- Pipeline.
      s.funnels = U.sv("g", {}, svg);
      s.disk = K.box(svg, { x: 120, y: BY, w: 250, h: BHt, label: "Disk", icon: "disk" });
      s.mem = K.box(svg, { x: 590, y: BY, w: 280, h: BHt, label: "Memory", icon: "layers" });
      s.l1 = K.box(svg, { x: 1090, y: BY, w: 290, h: BHt, label: "CPU cache", sub: "L1", icon: "cache", fs: 34 });
      s.core = K.box(svg, { x: 1560, y: BY, w: 240, h: BHt, label: "CPU core", icon: "cpu" });
      // Funnel (pinch) between two boxes.
      const funnel = (a, b) => {
        const g = U.sv("g", {}, s.funnels), m = (a + b) / 2, H0 = 56, H1 = 11;
        const d = `M${a},${CY - H0} C${m - 30},${CY - H0} ${m - 40},${CY - H1} ${m},${CY - H1} C${m + 40},${CY - H1} ${m + 30},${CY - H0} ${b},${CY - H0}` +
          ` L${b},${CY + H0} C${m + 30},${CY + H0} ${m + 40},${CY + H1} ${m},${CY + H1} C${m - 40},${CY + H1} ${m - 30},${CY + H0} ${a},${CY + H0} Z`;
        const glow = U.sv("ellipse", { cx: m, cy: CY, rx: 34, ry: 46, fill: C.bad }, g);
        glow.style.filter = "blur(10px)";
        const shape = U.sv("path", { d, fill: C.surface2, stroke: C.line2, "stroke-width": 2.5 }, g);
        const lbl = T(g, { x: m, y: BY + BHt + 48, "font-size": 28, "font-weight": 750, fill: C.bad }, "bottleneck");
        return { g, glow, shape, lbl };
      };
      s.f1 = funnel(370, 590);
      s.f2 = funnel(870, 1090);
      s.a3 = K.arrow(svg, { from: s.l1.right, to: s.core.left, gapStart: 12, gapEnd: 12, tone: "line" });
      // Packets through the whole pipeline.
      s.flow = K.arrow(svg, { from: [250, CY], to: [1680, CY], head: false, tone: "line", width: 1 });
      s.flow.g.style.opacity = 0;
      s.pk = K.packets(svg, s.flow, { n: 7, period: 3.2, r: 8 });
      // Re-append boxes on top of packets.
      [s.disk, s.mem, s.l1, s.core].forEach((b) => svg.appendChild(b.g));

      // ---- Scan chip (beat 1, lower area).
      const wrap = U.el("div", {}, root);
      Object.assign(wrap.style, { position: "absolute", left: "120px", top: "560px", width: "1680px", display: "flex", justifyContent: "center" });
      s.scan = K.chip(wrap, { text: "Warehouse scan: millions of rows", accent: "orange", icon: "search", size: 34 });
      Object.assign(s.scan.style, { position: "relative", background: C.surface });

      // ---- Cache panel: same L1 capacity, uncompressed rows vs one compressed column chunk.
      s.cache = U.sv("g", {}, svg);
      U.sv("rect", { x: PX0, y: PY0, width: PX1 - PX0, height: PY1 - PY0, rx: 22, fill: C.bg2, stroke: C.line2, "stroke-width": 2 }, s.cache);
      s.link = U.sv("path", { d: `M1235,${BY + BHt + 6} V${PY0 - 4}`, stroke: C.orange, "stroke-width": 3, "stroke-dasharray": "8 8", fill: "none" }, svg);
      s.cacheHdr = T(s.cache, { x: PX0 + 30, y: PY0 + 50, "text-anchor": "start", "font-size": 32, "font-weight": 750, fill: C.orange }, "What fits in the small, fast L1 cache?");
      const FW = 640, FH = 140, FY = PY0 + 112;
      const fA = 240, fB = 1040;
      // Left: uncompressed rows (whole records, 6 fields each).
      s.uncG = U.sv("g", {}, s.cache);
      const ut = T(s.uncG, { x: fA, y: FY - 16, "text-anchor": "start", "font-size": 28, fill: C.muted }, "Uncompressed rows");
      s.uncCap = U.sv("tspan", { fill: C.bad, "font-weight": 750 }, ut, " · only a few fit");
      U.sv("rect", { x: fA, y: FY, width: FW, height: FH, rx: 12, fill: "none", stroke: C.line2, "stroke-width": 2.5, "stroke-dasharray": "10 8" }, s.uncG);
      const segW = [64, 120, 120, 76, 130, 98], fieldCol = [C.line2, C.muted, C.line2, C.muted, C.line2, C.muted];
      s.recs = [0, 1, 2, 3].map((r) => {
        const g = U.sv("g", {}, s.uncG);
        let x = fA + 16;
        segW.forEach((w, j) => { U.sv("rect", { x, y: FY + 10 + r * 42 + (r === 3 ? 8 : 0), width: w - 4, height: 32, rx: 5, fill: r === 3 ? C.bad : fieldCol[j], "fill-opacity": r === 3 ? 0.55 : 0.7 }, g); x += w; });
        return g;
      });
      // Right: one compressed column chunk (bits for many rows).
      s.cmpG = U.sv("g", {}, s.cache);
      const ct = T(s.cmpG, { x: fB, y: FY - 16, "text-anchor": "start", "font-size": 28, fill: C.orange }, "Compressed column chunk");
      s.cmpCap = U.sv("tspan", { fill: C.ok, "font-weight": 750 }, ct, " · many rows");
      U.sv("rect", { x: fB, y: FY, width: FW, height: FH, rx: 12, fill: "none", stroke: C.orange, "stroke-width": 2.5 }, s.cmpG);
      const rng = U.rng(15);
      s.bits = [];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 26; c++) {
        const on = rng() < 0.3;
        s.bits.push(U.sv("rect", { x: fB + 16 + c * 23.6, y: FY + 12 + r * 30, width: 19, height: 24, rx: 3, fill: on ? C.orange : C.surface2 }, s.cmpG));
      }

      // ---- Loop panel: bitwise AND over the chunk in a tight loop.
      s.loop = U.sv("g", {}, svg);
      U.sv("rect", { x: PX0, y: PY0, width: PX1 - PX0, height: PY1 - PY0, rx: 22, fill: C.bg2, stroke: C.line2, "stroke-width": 2 }, s.loop);
      s.link2 = U.sv("path", { d: `M1680,${BY + BHt + 6} V${PY0 - 4}`, stroke: C.orange, "stroke-width": 3, "stroke-dasharray": "8 8", fill: "none" }, svg);
      T(s.loop, { x: PX0 + 30, y: PY0 + 50, "text-anchor": "start", "font-size": 32, "font-weight": 750, fill: C.orange }, "CPU core · bitwise AND over the chunk");
      const BW = 58, BP = 64, CG = 26, RX0 = 760, RY = [PY0 + 86, PY0 + 150, PY0 + 226], RH = 50;
      const bx = (i) => RX0 + i * BP + Math.floor(i / 4) * CG;
      s.bx = bx; s.BW = BW;
      const rowsDef = [["country = DE", D.bitmaps.DE.bits, "orange"], ["method = card", D.cardBits, "teal"], ["AND", D.andBits, "hl"]];
      s.lrows = rowsDef.map(([lbl, bits, tone], r) => {
        const g = U.sv("g", {}, s.loop), col = K.toneColor(tone);
        T(g, { x: RX0 - 30, y: RY[r] + RH / 2 + 10, "text-anchor": "end", "font-size": 28, "font-weight": 700, fill: col, "font-family": MONO }, lbl);
        const cells = [...bits].map((b, i) => {
          const rect = U.sv("rect", { x: bx(i), y: RY[r], width: BW, height: RH, rx: 7, "stroke-width": 2.5, fill: b === "1" ? BG[tone] : C.surface, stroke: b === "1" ? col : C.line }, g);
          const tx = T(g, { x: bx(i) + BW / 2, y: RY[r] + RH / 2 + 11, "font-size": 30, "font-weight": 700, fill: b === "1" ? col : C.faint, "font-family": MONO }, b);
          return { rect, tx };
        });
        return { g, cells };
      });
      s.andRule = U.sv("path", { d: `M${RX0 - 220},${RY[2] - 13} H${bx(11) + BW}`, stroke: C.line2, "stroke-width": 3 }, s.loop);
      // Iteration window (one chunk of 4 values at a time).
      s.win = U.sv("rect", { y: RY[0] - 10, width: 4 * BP - (BP - BW) + 20, height: RY[2] + RH - RY[0] + 20, rx: 12, fill: "none", stroke: C.hl, "stroke-width": 4 }, s.loop);
      s.winLbl = T(s.loop, { y: RY[0] - 22, "font-size": 26, "font-weight": 750, fill: C.hl }, "one instruction");
      // Loop icon (circular arrow) left of the rows.
      const lx = 270, ly = (RY[0] + RY[2] + RH) / 2, lr = 52;
      s.loopIconG = U.sv("g", { transform: `translate(${lx},${ly})` }, s.loop);
      s.loopShow = U.sv("g", {}, s.loopIconG);
      s.loopIcon = U.sv("g", {}, s.loopShow);
      U.pinOrigin(s.loopIcon);
      U.sv("path", { d: `M${lr},0 A${lr},${lr} 0 1 1 ${lr * Math.cos(-0.6)},${lr * Math.sin(-0.6)}`, fill: "none", stroke: C.orange, "stroke-width": 6, "stroke-linecap": "round" }, s.loopIcon);
      const ea = -0.6, ax = lr * Math.cos(ea), ay = lr * Math.sin(ea), adeg = (ea * 180) / Math.PI; // chevron below points +y; rotating by the end angle aligns it with the clockwise tangent
      U.sv("path", { d: `M-16,-12 L0,6 L16,-12`, transform: `translate(${ax.toFixed(2)},${ay.toFixed(2)}) rotate(${adeg.toFixed(1)})`, fill: "none", stroke: C.orange, "stroke-width": 6, "stroke-linecap": "round", "stroke-linejoin": "round" }, s.loopIcon);
      s.loopLbl = T(s.loop, { x: lx, y: ly + lr + 46, "font-size": 28, "font-weight": 750, fill: C.orange }, "tight loop");
      s.noCall = K.chip(root, { x: 790, y: PY0 + 16, text: "No function call per value", accent: "ok", icon: "check", size: 28 });

      // ---- Vectorized / SIMD.
      s.vec = K.text(root, { x: 120, y: 826, cls: "h3", text: "Vectorized processing", color: "orange" });
      s.simd = K.chip(root, { x: 760, y: 832, text: "SIMD: one instruction, many values", accent: "ink", icon: "cpu" });
      s.badge = K.badge(root, { x: 0, y: 128, right: 120, text: "Simplified illustration" });
      return s;
    },

    update(t, k, s) {
      const C = K.C;
      // ---- Anchors.
      const tScans = k.word("bottleneck", "scans"), tNeck = k.word("bottleneck", "bottleneck");
      const tDisk = k.word("bottleneck", "disk"), tMem = k.word("bottleneck", "memory"), tInto2 = k.word("bottleneck", "into", 1);
      const tCPU = k.word("bottleneck", "CPU");
      const tChunk = k.word("cache", "compressed"), tMany = k.word("cache", "many rows"), tFits = k.word("cache", "fits"), tL1 = k.word("cache", "L1");
      const tLoop = k.cue("loop"), tAnd = k.word("loop", "bitwise"), tTight = k.word("loop", "tight loop"), tWithout = k.word("loop", "without");
      const tVecW = k.word("vectorized", "vectorized"), tSimd = k.word("vectorized", "SIMD"), tOneI = k.word("vectorized", "one instruction"), tManyV = k.word("vectorized", "many values");

      A.show(s.title, t, 0.3);

      // ---- Pipeline builds with the narration.
      A.show(s.disk.inner, t, tDisk - 0.1, { dy: 14 });
      A.show(s.mem.inner, t, tMem - 0.1, { dy: 14 });
      A.show(s.l1.inner, t, tInto2, { dy: 14 });
      A.show(s.core.inner, t, tCPU - 0.1, { dy: 14 });
      A.show(s.f1.g, t, tMem, { dy: 0 });
      A.show(s.f2.g, t, tInto2 + 0.1, { dy: 0 });
      s.a3.draw(t, tCPU, 0.5);
      // Pinch points glow (deterministic pulse) once each link is named.
      [[s.f1, tMem + 0.2], [s.f2, tCPU]].forEach(([f, t0]) => {
        const on = A.prog(t, t0, 0.5) * (1 - 0.6 * A.prog(t, tLoop, 0.6));
        const pulse = 0.55 + 0.25 * Math.sin((t - t0) * 4.2);
        f.glow.style.opacity = (on * pulse).toFixed(3);
        f.shape.setAttribute("stroke", A.mix(C.line2, C.bad, on));
        A.setOpacity(f.lbl, on);
      });
      // Packets: orange (compressed chunks) from the cache beat on.
      const flowOn = A.prog(t, tCPU + 0.3, 0.5);
      s.pk.update(t, flowOn, { tone: t > tChunk ? "orange" : "hl" });

      // ---- Scan chip.
      A.show(s.scan, t, tScans, { dy: 12, out: tChunk - 0.3 });

      // ---- Cache panel.
      const cacheOut = tLoop - 0.1;
      A.show(s.cache, t, tChunk, { dy: 14, out: cacheOut });
      A.show(s.link, t, tChunk, { dy: 0, out: cacheOut });
      // Compressed chunk on "compressed column", filled with bits on "many rows".
      A.show(s.cmpG, t, tChunk + 0.1, { dy: 10 });
      s.bits.forEach((b, i) => A.setOpacity(b, A.prog(t, tMany - 0.1 + i * 0.008, 0.25)));
      s.cmpCap.setAttribute("fill-opacity", A.prog(t, tMany + 0.3, 0.4).toFixed(3));
      // Uncompressed comparison on "fits": three records fit, the fourth does not.
      A.show(s.uncG, t, tFits - 0.1, { dy: 10 });
      s.recs.forEach((g, r) => A.show(g, t, tFits + r * 0.15, { dy: 0, dx: -16, d: 0.35 }));
      s.uncCap.setAttribute("fill-opacity", A.prog(t, tFits + 0.7, 0.4).toFixed(3));
      s.l1.setTone("orange", A.prog(t, tL1, 0.4) * (1 - A.prog(t, tLoop, 0.5)));
      s.cacheHdr.setAttribute("fill-opacity", A.prog(t, tFits - 0.1, 0.4).toFixed(3));

      // ---- Loop panel.
      A.show(s.loop, t, tLoop + 0.05, { dy: 14 });
      A.show(s.link2, t, tLoop + 0.05, { dy: 0 });
      s.core.setTone("orange", A.prog(t, tLoop + 0.1, 0.4));
      // Operand rows in on "bitwise AND"; the AND row fills chunk by chunk as the loop runs.
      A.setOpacity(s.lrows[0].g, A.prog(t, tAnd - 0.1, 0.35));
      A.setOpacity(s.lrows[1].g, A.prog(t, tAnd + 0.1, 0.35));
      const it = 0.55;                                 // seconds per loop iteration (one chunk)
      const t0 = tAnd + 0.6;
      s.lrows[2].g.style.opacity = A.prog(t, t0 - 0.1, 0.3).toFixed(3);
      s.lrows[2].cells.forEach((c, i) => {
        const p = A.prog(t, t0 + Math.floor(i / 4) * it + 0.15, 0.2);
        A.setOpacity(c.rect, p); A.setOpacity(c.tx, p);
      });
      A.setOpacity(s.andRule, A.prog(t, t0 - 0.1, 0.3));
      // Iteration window: eases chunk to chunk (fade on the wrap 2 → 0); from "vectorized" it eases onto the last chunk and holds.
      const settle = A.prog(t, tOneI - 0.1, 0.3);
      const tStop = tVecW - 0.1;
      const winX = (tt) => {
        const u = Math.max(0, tt - t0) / it, step = Math.floor(u), f = A.E.inOutCubic(U.clamp((u - step - 0.65) / 0.35)); // hold, then slide in the last 35% of the step
        const a = step % 3, b = (step + 1) % 3;
        if (b === 0) return { x: s.bx(a * 4) - 10, fade: f < 1 ? 1 - Math.min(1, f * 2) + Math.max(0, f * 2 - 1) : 1, x2: s.bx(0) - 10, f };
        return { x: U.lerp(s.bx(a * 4), s.bx(b * 4), f) - 10, fade: 1 };
      };
      let w = winX(t), wx, wFade = 1;
      if (w.x2 != null) { wx = w.f < 0.5 ? w.x : w.x2; wFade = Math.abs(1 - 2 * w.f); } else wx = w.x;
      if (t >= tStop) {
        const w0 = winX(tStop), x0 = w0.x2 != null ? (w0.f < 0.5 ? w0.x : w0.x2) : w0.x;
        const g = A.E.inOutCubic(A.prog(t, tStop, 0.5));
        wx = U.lerp(x0, s.bx(8) - 10, g);
        wFade = w0.x2 != null ? Math.max(Math.abs(1 - 2 * w0.f), g) : 1;
      }
      s.win.setAttribute("x", wx.toFixed(1));
      A.setOpacity(s.win, A.prog(t, t0 - 0.1, 0.2) * wFade);
      s.win.setAttribute("stroke-width", (4 + 2 * settle).toFixed(1));
      s.winLbl.setAttribute("x", (wx + (4 * 64 - 6 + 20) / 2).toFixed(1));
      A.setOpacity(s.winLbl, settle);
      // Loop icon spins from "tight loop".
      A.show(s.loopShow, t, tTight - 0.1, { dy: 0, s0: 0.6 });
      const spin = 180 * Math.max(0, Math.min(t, tVecW) - (tTight - 0.1)) + 180 * A.E.outCubic(A.prog(t, tVecW, 1.0));
      s.loopIcon.setAttribute("transform", `rotate(${spin.toFixed(1)})`);
      A.setOpacity(s.loopLbl, A.prog(t, tTight, 0.4));
      A.show(s.noCall, t, tWithout, { dy: 10 });
      // "many values": the four lanes inside the window pulse.
      const lanes = A.win(t, tManyV - 0.05, k.dur + 1, 0.3);
      for (let r = 0; r < 3; r++) for (let i = 8; i < 12; i++) {
        const c = s.lrows[r].cells[i];
        c.rect.setAttribute("stroke-width", (2.5 + 2 * lanes).toFixed(1));
      }

      // ---- Vectorized / SIMD.
      A.show(s.vec, t, tVecW - 0.05, { dy: 14 });
      A.show(s.simd, t, tSimd - 0.05, { dy: 14 });
      A.show(s.badge, t, tAnd, { dy: 0 });
    },
  });
})();
