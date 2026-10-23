// S07 — Hardware faults. A 10,000-disk grid, the one-failure-per-day arithmetic, a seeded day ticker, then the defenses
// (redundant hardware → software that tolerates losing a machine → rolling upgrades).
R.scene("hardware", {
  build(root, k) {
    const s = {};
    const C = K.C, D = k.data.disk; // { disks: 10000, mttfYears: 30, perDay: 0.91 }

    s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Hardware faults" });

    // "Simplified illustration" qualifier, pinned top-right (appears at `ticker`).
    s.illus = U.el("div", {}, root);
    Object.assign(s.illus.style, { position: "absolute", right: "120px", top: "118px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" });
    s.illusBadge = K.badge(s.illus, { x: 0, y: 0, text: "Simplified illustration" });
    s.illusBadge.style.position = "relative"; s.illusBadge.style.left = "auto"; s.illusBadge.style.top = "auto";
    s.illusText = K.text(s.illus, { x: 0, y: 0, cls: "small", text: `assumed MTTF ${D.mttfYears} years, independent failures, constant rate` });
    s.illusText.style.position = "relative"; s.illusText.style.left = "auto"; s.illusText.style.top = "auto"; s.illusText.style.whiteSpace = "nowrap";

    // ---------------------------------------------------------------- the grid (canvas: 125 × 80 = 10,000 disks)
    const COLS = 125, ROWS = 80, P = 7, SQ = 5, PAD = 40;
    const GX = 120, GY = 290;
    s.g = { COLS, ROWS, P, SQ, PAD, GX, GY, W: COLS * P - (P - SQ), H: ROWS * P - (P - SQ) };
    s.cv = U.el("canvas", { width: s.g.W + 2 * PAD, height: s.g.H + 2 * PAD }, root);
    Object.assign(s.cv.style, { position: "absolute", left: GX - PAD + "px", top: GY - PAD + "px" });
    s.ctx = s.cv.getContext("2d");

    s.gridLbl = K.text(root, { x: 120, y: 226, cls: "label", text: `${U.fmt(D.disks)} disks` });
    Object.assign(s.gridLbl.style, { fontSize: "36px", fontWeight: 750 });
    s.gridSub = K.text(root, { x: 360, y: 234, cls: "small", text: "one square = one disk" });

    // Day counter (HTML, mono digits in fixed-width slots so nothing jitters).
    s.counter = K.text(root, { x: GX + s.g.W - 320, y: 228, w: 320, cls: "label", align: "right" });
    s.counter.style.fontSize = "32px";
    const slot = (w) => `display:inline-block;width:${w}ch;text-align:right;font-family:var(--mono);font-weight:700`;
    s.counter.innerHTML = `<span style="color:${C.muted}">Day</span> <span class="d" style="${slot(2)};color:${C.ink}"></span>` +
      `<span style="color:${C.faint}">&nbsp;&nbsp;·&nbsp;&nbsp;</span><span class="f" style="${slot(2)};color:${C.bad}"></span> <span style="color:${C.bad}">failed</span>`;
    s.cDay = s.counter.querySelector(".d"); s.cFail = s.counter.querySelector(".f");

    // Seeded failure events: Poisson(perDay) failures per simulated day, unique disks. Pick the first seed whose running total
    // tracks perDay × day closely, so the counter visibly reads "about one per day".
    s.dayLen = 0.75;
    s.t0 = k.cue("ticker") + 0.45;
    const nDays = Math.ceil((k.dur + 1 - s.t0) / s.dayLen) + 1;
    const gen = (seed) => {
      const rnd = U.rng(seed), used = new Set(), ev = [];
      let cum = 0, worst = 0;
      for (let d = 0; d < nDays; d++) {
        // Knuth Poisson sampler
        let n = 0, p = rnd(); const L = Math.exp(-D.perDay);
        while (p > L) { n++; p *= rnd(); }
        const times = Array.from({ length: n }, () => rnd()).sort((a, b) => a - b);
        for (const f of times) {
          let cell; do { cell = Math.floor(rnd() * COLS * ROWS); } while (used.has(cell));
          used.add(cell);
          ev.push({ t: s.t0 + (d + 0.08 + f * 0.84) * s.dayLen, c: cell % COLS, r: Math.floor(cell / COLS) });
        }
        cum += n;
        worst = Math.max(worst, Math.abs(cum - D.perDay * (d + 1)));
      }
      return { ev, worst };
    };
    let best = null;
    for (let seed = 7; seed < 400; seed++) { const g = gen(seed); if (!best || g.worst < best.worst) best = g; if (g.worst <= 1.6) break; }
    s.events = best.ev;

    // Pre-quantized reveal palette (muted → line2).
    s.pal = Array.from({ length: 9 }, (_, i) => A.mix(C.muted, C.line2, i / 8));

    // ---------------------------------------------------------------- right column, phase 1: the arithmetic
    const RX = 1080, RW = 720;
    s.mttfLbl = K.text(root, { x: RX, y: 290, cls: "label", text: "Mean time to failure (MTTF)", color: "muted" });
    s.mttfVal = K.text(root, { x: RX, y: 334, cls: "h3", html: `<span style="font-family:var(--mono);letter-spacing:-0.03em">${D.mttfYears}</span> years`, color: "hl" });
    s.mttfSub = K.text(root, { x: RX + 246, y: 352, cls: "small", text: "a fleet statistic, not a lifespan" });

    const svg = K.svgLayer(root);
    s.panel = U.sv("g", {}, svg);
    U.sv("rect", { x: RX, y: 438, width: RW, height: 196, rx: 22, fill: C.bg2, stroke: C.line, "stroke-width": 2 }, s.panel);
    const mono = (txt, extra = "") => `<span style="font-family:var(--mono);font-weight:650;letter-spacing:-0.02em${extra}">${txt}</span>`;
    s.num = K.text(root, { x: RX + RW / 2, y: 458, w: RW, align: "center", cls: "label", html: `${mono(U.fmt(D.disks))} disks` });
    s.num.style.fontSize = "42px";
    s.bar = U.sv("path", { d: `M${RX + 150},${531} H${RX + RW - 150}`, stroke: C.muted, "stroke-width": 4, "stroke-linecap": "round", fill: "none" }, svg);
    s.den = K.text(root, { x: RX + RW / 2, y: 548, w: RW, align: "center", cls: "label",
      html: `<span class="a">${mono(D.mttfYears)} years</span><span class="b">&nbsp;×&nbsp;${mono(365)} days</span>` });
    s.den.style.fontSize = "42px";
    s.denA = s.den.querySelector(".a"); s.denB = s.den.querySelector(".b");
    s.res = K.text(root, { x: RX, y: 660, cls: "label", html: `≈ ${mono(D.perDay.toFixed(2))} failures per day` });
    s.res.style.fontSize = "36px";
    s.one = K.text(root, { x: RX, y: 716, cls: "h3", text: "About one failure per day", color: "hl" });
    s.routine = K.text(root, { x: RX, y: 806, cls: "label", html: `At this scale, failure is <span style="color:${C.bad}">routine.</span>` });
    s.routine.style.fontSize = "34px";

    // ---------------------------------------------------------------- right column, phase 2: defenses
    s.h1 = K.text(root, { x: RX, y: 290, cls: "label", text: "Redundant hardware", color: "rel" });
    Object.assign(s.h1.style, { fontSize: "36px", fontWeight: 750 });
    s.chips = K.chips(root, { x: RX, y: 346, w: RW, accent: "rel", size: 28, items: [
      { text: "RAID arrays", icon: "disk" }, { text: "Dual power supplies", icon: "cache" }, { text: "Spare machines", icon: "server" },
    ] });

    s.h2 = K.text(root, { x: RX, y: 528, cls: "label", text: "Software tolerates losing a machine", color: "rel" });
    Object.assign(s.h2.style, { fontSize: "36px", fontWeight: 750 });
    s.cluster = U.sv("g", {}, svg);
    s.nodes = Array.from({ length: 5 }, (_, i) => K.box(s.cluster, { x: RX + i * 150, y: 590, w: 120, h: 104, label: "Node", icon: "server", iconSize: 40, fs: 30 }));
    s.lost = 2;
    s.xLost = K.mark(svg, "x", { x: RX + s.lost * 150 + 114, y: 596, size: 44 });
    s.pill = K.pill(root, { x: RX, y: 722, text: "Service: up", tone: "ok" });
    s.rollLbl = K.text(root, { x: RX, y: 812, cls: "label", text: "Rolling upgrade: one node at a time", color: "rel" });
    s.rollLbl.style.fontSize = "32px";
    return s;
  },

  update(t, k, s) {
    const C = K.C;
    const cPer = k.cue("perday"), cTick = k.cue("ticker"), cRed = k.cue("redundancy"), cRoll = k.cue("rolling");

    A.show(s.title, t, 0.1);
    const w = (line, needle) => k.word(line, needle);

    // ---- grid: diagonal reveal on "Picture 10,000 disks"; dims while the defenses take over.
    const rv0 = w("grid", "Picture"), rvD = 1.3;
    const gridDim = 1 - 0.5 * A.prog(t, cRed + 0.2, 0.8);
    A.setOpacity(s.cv, t >= rv0 ? 1 : 0);
    A.show(s.gridLbl, t, w("grid", "10,000"), { dy: 12, max: gridDim });
    A.show(s.gridSub, t, w("grid", "disks"), { dy: 12, max: gridDim });
    drawGrid(t, s, rv0, rvD, gridDim);

    // ---- day ticker (the ticker line's visual: lands at the line start)
    const ctrOn = A.show(s.counter, t, cTick + 0.3, { dy: 12, max: 0.4 + 0.6 * gridDim });
    if (ctrOn > 0) {
      const day = Math.max(1, Math.floor((t - s.t0) / s.dayLen) + 1);
      let nf = 0; for (const e of s.events) if (e.t <= t) nf++;
      s.cDay.textContent = String(day);
      s.cFail.textContent = String(nf);
    }
    // "Simplified illustration" on "simplified"; the assumptions on "independent failures, constant rate".
    A.show(s.illusBadge, t, w("ticker", "simplified"), { dy: 12 });
    A.show(s.illusText, t, w("ticker", "independent"), { dy: 10 });

    // ---- phase 1 right column: "30 years" on "30-year", its label on "mean time to failure", the qualifier on
    // "statistical figure"; then the division builds word by word; all leave when the defenses arrive.
    const out = cRed + 0.5;
    A.show(s.mttfVal, t, w("formula", "30-year"), { dy: 14, out, s0: 0.92 });
    A.show(s.mttfLbl, t, w("formula", "mean"), { dy: 14, out });
    A.show(s.mttfSub, t, w("formula", "statistical"), { dy: 10, out });
    A.show(s.panel, t, cPer + 0.05, { dy: 0, d: 0.5, out });
    A.show(s.num, t, w("perday", "10,000"), { dy: 14, out });
    A.draw(s.bar, t, w("perday", "divided"), 0.5);
    s.bar.style.opacity = (1 - A.prog(t, out, 0.4, A.E.inOutCubic)).toFixed(3);
    const tDenA = w("perday", "30");
    A.show(s.den, t, tDenA, { dy: 0, d: 0.01, out });
    A.setOpacity(s.denA, A.prog(t, tDenA, 0.4));
    A.setOpacity(s.denB, A.prog(t, w("perday", "times"), 0.4));
    A.show(s.res, t, w("perday", "is"), { dy: 14, out });
    A.show(s.one, t, w("perday", "about"), { dy: 16, out, s0: 0.94 });
    A.show(s.routine, t, w("ticker", "at this scale"), { dy: 12, out });

    // ---- phase 2: defenses
    A.show(s.h1, t, w("redundancy", "redundancy"), { dy: 14 });
    // Whisper heard "RAID" as "rate", so anchor that chip just before "arrays" (≈ when "RAID" starts).
    const chipT = [w("redundancy", "arrays") - 0.25, w("redundancy", "dual"), w("redundancy", "spare")];
    s.chips.chips.forEach((c, i) => A.show(c, t, chipT[i], { dy: 14, s0: 0.92 }));

    A.show(s.h2, t, w("software", "software"), { dy: 14 });
    A.show(s.cluster, t, w("software", "software") + 0.2, { dy: 16 });
    A.show(s.pill, t, w("software", "tolerate"), { dy: 12 });

    // One machine is lost (on "losing"), then replaced just before the rolling upgrade starts.
    const tLost = w("software", "losing");
    const lostP = A.prog(t, tLost, 0.35) * (1 - A.prog(t, cRoll + 0.05, 0.4));
    A.show(s.xLost.inner, t, tLost, { d: 0.45, dy: 0, s0: 0.3, ease: A.E.outBack, out: cRoll + 0.05 });

    // Rolling upgrade: exactly one node offline at a time, starting on "upgrades"; all back on v2 just after "downtime".
    const tRollWord = w("rolling", "rolling");
    const r0 = w("rolling", "upgrades") - 0.2, S = 0.52;
    s.nodes.forEach((n, i) => {
      const off = r0 + i * S, on = off + S * 0.78;
      if (t < off) {
        n.setTone("bad", i === s.lost ? lostP : 0);
        n.label.textContent = t >= tRollWord ? "v1" : "Node"; // versions only once "rolling upgrades" is said
        n.inner.style.opacity = "1";
      } else if (t < on) {
        n.setTone("ghost", A.prog(t, off, 0.12));
        n.label.textContent = "…";
        n.inner.style.opacity = (1 - 0.35 * A.prog(t, off, 0.12)).toFixed(3);
      } else {
        n.setTone("rel", A.prog(t, on, 0.2), "ghost");
        n.label.textContent = "v2";
        n.inner.style.opacity = (0.65 + 0.35 * A.prog(t, on, 0.2)).toFixed(3);
      }
    });
    A.show(s.rollLbl, t, tRollWord, { dy: 12 });
    const noDown = t >= w("rolling", "without");
    K.setPill(s.pill, noDown ? "Service: up · no downtime" : "Service: up", "ok");

    // ---------------------------------------------------------------- canvas painter (pure function of t)
    function drawGrid(t, s, rv0, rvD, dim) {
      const { COLS, ROWS, P, SQ, PAD } = s.g, ctx = s.ctx;
      ctx.clearRect(0, 0, s.cv.width, s.cv.height);
      if (t < rv0) return;
      const done = t >= rv0 + rvD + 0.3;
      if (done) {
        ctx.globalAlpha = dim;
        ctx.fillStyle = C.line2;
        ctx.beginPath();
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) ctx.rect(PAD + c * P, PAD + r * P, SQ, SQ);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          const tc = rv0 + (0.72 * c / COLS + 0.28 * r / ROWS) * rvD;
          const a = U.clamp((t - tc) / 0.3);
          if (a <= 0) continue;
          ctx.globalAlpha = Math.min(1, a * 2.2) * dim;
          ctx.fillStyle = s.pal[Math.round(a * 8)];
          ctx.fillRect(PAD + c * P, PAD + r * P, SQ, SQ);
        }
        ctx.globalAlpha = 1;
      }
      // Failed disks: a flash + expanding ring, then a persistent red square with a soft halo (clipped near the grid so rings
      // never sweep under the label row).
      // Once the defenses take over (grid dimmed), new failures arrive quietly: no ring, no white flash or size pop, and a short
      // fade-in instead of a hard pop. fx = 1 before `redundancy`, 0 once the grid has dimmed.
      const fx = U.clamp((dim - 0.5) * 2);
      ctx.save();
      ctx.beginPath(); ctx.rect(PAD - 12, PAD - 12, s.g.W + 24, s.g.H + 24); ctx.clip();
      for (const e of s.events) {
        if (t < e.t) continue;
        const age = t - e.t, x = PAD + e.c * P + SQ / 2, y = PAD + e.r * P + SQ / 2;
        if (age < 1.3) {
          const q = age / 1.3;
          ctx.globalAlpha = 0.95 * (1 - q) * fx;
          ctx.strokeStyle = C.bad; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(x, y, 7 + 30 * A.E.outCubic(q), 0, Math.PI * 2); ctx.stroke();
        }
        const fin = 1 - (1 - fx) * (1 - A.prog(age, 0, 0.35));
        ctx.globalAlpha = 0.28 * fin;
        ctx.fillStyle = C.bad;
        ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = fin;
        const flash = (1 - A.prog(age, 0, 0.5)) * fx;
        const sz = 9 + 7 * flash;
        ctx.fillStyle = flash > 0.01 ? A.mix(C.bad, "#FFFFFF", flash * 0.85) : C.bad;
        ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  },
});
