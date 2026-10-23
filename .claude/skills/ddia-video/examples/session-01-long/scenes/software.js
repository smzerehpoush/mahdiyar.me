// S08 — Software faults are correlated. Five identical nodes; one trigger (the June 30, 2012 leap second → Linux kernel bug)
// reaches all of them at once and they all hang together. Contrast: disks fail independently, a shared bug does not. A spare
// running the same code fails too. Then other correlated-fault examples.
R.scene("software", {
  build(root, k) {
    const s = {};
    s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Software faults" });
    const svg = K.svgLayer(root);

    // ---- trigger + bug
    const TX = 960;
    s.trig = K.box(svg, { x: TX - 235, y: 226, w: 470, h: 104, label: "June 30, 2012", sub: "Leap second", icon: "clock", iconInline: true, iconSize: 50, fs: 34, tone: "hl" });
    s.bugArrow = K.arrow(svg, { from: [TX + 235, 278], to: [1286, 278], gapStart: 12, gapEnd: 10, tone: "bad" });
    s.bug = K.chip(root, { x: 1290, y: 246, text: "Linux kernel bug", icon: "warning", accent: "bad" });

    // ---- five identical nodes (+ a spare slot at the right)
    const NW = 200, NH = 150, NY = 470;
    s.nodes = Array.from({ length: 5 }, (_, i) => {
      const x = 400 + i * 230;
      const b = K.box(svg, { x, y: NY, w: NW, h: NH, label: `Node ${i + 1}`, sub: "same code", icon: "server", iconSize: 44, fs: 34 });
      b.arrow = K.arrow(svg, { from: [TX + (x + NW / 2 - TX) * 0.28, 340], to: [x + NW / 2, NY - 10], tone: "line" });
      b.x = K.mark(svg, "x", { x: x + NW - 6, y: NY + 6, size: 48 });
      return b;
    });
    const SX = 1590;
    s.spare = K.box(svg, { x: SX, y: NY, w: NW, h: NH, label: "Spare", sub: "same code", icon: "server", iconSize: 44, fs: 34, tone: "ghost" });
    s.spare.arrow = K.arrow(svg, { from: [TX + (SX + NW / 2 - TX) * 0.28, 340], to: [SX + NW / 2, NY - 10], tone: "line" });
    s.spare.x = K.mark(svg, "x", { x: SX + NW - 6, y: NY + 6, size: 48 });

    // One-shot trigger pulses (custom circles: K.packets loops, these must not).
    s.pulses = [...s.nodes, s.spare].map(() => {
      const g = U.sv("g", {}, svg);
      U.sv("circle", { r: 20, fill: K.C.hl, opacity: 0.25 }, g);
      U.sv("circle", { r: 10, fill: K.C.hl }, g);
      return g;
    });

    s.hung = K.text(root, { x: 960, y: 646, w: 900, align: "center", cls: "label", text: "All five hung at the same moment", color: "bad" });
    Object.assign(s.hung.style, { fontSize: "34px", fontWeight: 750 });

    // ---- takeaway (left)
    s.take1 = K.text(root, { x: 120, y: 742, cls: "label", text: "Redundancy assumes independent faults.", color: "muted" });
    s.take1.style.fontSize = "34px";
    s.take2 = K.text(root, { x: 120, y: 800, cls: "label", html: `Software bugs are often <span style="color:${K.C.bad}">correlated.</span>` });
    Object.assign(s.take2.style, { fontSize: "44px", fontWeight: 800, letterSpacing: "-0.015em" });

    // ---- contrast chart (right): when do 5 machines fail?
    const LX0 = 1200, LX1 = 1790;
    s.lx = [LX0, LX1];
    s.chart = U.sv("g", {}, svg);
    s.rows = [
      { y: 742, name: "Disks", tag: "independent", tone: "rel", f: [0.12, 0.81, 0.4, 0.62, 0.25] },
      { y: 846, name: "Same bug", tag: "all at once", tone: "bad", f: [0.55, 0.55, 0.55, 0.55, 0.55] },
    ].map((r) => {
      const g = U.sv("g", {}, s.chart);
      const nm = K.label(g, { x: 980, y: r.y + 22, text: r.name, anchor: "start", size: 30, weight: 700 });
      const tg = K.label(g, { x: 980, y: r.y + 54, text: r.tag, anchor: "start", size: 26, weight: 650, fill: r.tone });
      for (let j = 0; j < 5; j++) U.sv("line", { x1: LX0, x2: LX1, y1: r.y + 6 + j * 13, y2: r.y + 6 + j * 13, stroke: K.C.line, "stroke-width": 2 }, g);
      const cursor = U.sv("line", { x1: 0, x2: 0, y1: r.y - 6, y2: r.y + 70, stroke: K.C.hl, "stroke-width": 3, "stroke-linecap": "round" }, g);
      const dots = r.f.map((f, j) => {
        const dg = U.sv("g", { transform: `translate(${LX0 + f * (LX1 - LX0)},${r.y + 6 + j * 13})` }, g);
        const inner = U.sv("g", {}, dg);
        U.sv("circle", { r: 7.5, fill: K.C.bad }, inner);
        return inner;
      });
      return { ...r, g, nm, tg, cursor, dots };
    });
    s.timeLbl = K.label(s.chart, { x: LX1, y: 722, text: "time →", anchor: "end", size: 26, weight: 600, fill: "faint" });

    // ---- other correlated faults (right, replaces the chart)
    const ex = [
      { text: "Runaway process eating shared resources", icon: "cpu" },
      { text: "Slow dependency", icon: "database" },
      { text: "Cascading failures", icon: "layers" },
    ];
    s.ex = ex.map((e, i) => K.chip(root, { x: 980, y: 716 + i * 72, text: e.text, icon: e.icon, accent: "ink", size: 28 }));
    return s;
  },

  update(t, k, s) {
    const cCorr = k.cue("correlated"), cEx = k.cue("examples");
    const lSpare = k.lines.findIndex((l) => !l.cue && l.start > cCorr); // "A spare doesn't help if it runs the same bug."
    const w = (line, needle) => k.word(line, needle);

    A.show(s.title, t, 0.1);

    // ---- nodes appear on "five nodes"; "same code" lands on "same code"
    const tFive = w("nodes", "five"), tSame = w("nodes", "same code");
    s.nodes.forEach((n, i) => {
      A.show(n.inner, t, tFive + i * 0.07, { dy: 16 });
      n.sub.style.opacity = A.prog(t, tSame, 0.4).toFixed(3);
    });

    // ---- trigger: date on "June", "leap second" on "leap", arrows on "triggered", kernel bug on "Linux kernel bug"
    A.show(s.trig.inner, t, w("trigger", "June"), { dy: 14 });
    s.trig.sub.style.opacity = A.prog(t, w("trigger", "leap"), 0.4).toFixed(3);
    const tLinux = w("trigger", "Linux");
    s.bugArrow.draw(t, tLinux - 0.1, 0.35);
    A.show(s.bug, t, tLinux, { dy: 0, dx: -14 });
    const tTrig = w("trigger", "triggered");
    s.nodes.forEach((n, i) => n.arrow.draw(t, tTrig + i * 0.04, 0.6));

    // ---- one synchronized pulse down every arrow; all five nodes hang at the same instant, on "hung"
    const pD = 0.7, tHang = w("allfail", "hung"), pT0 = tHang - pD;
    const pulse = (g, arr, t0) => {
      const p = A.prog(t, t0, pD, A.E.inOutSine);
      const [x, y] = arr.point(p);
      g.setAttribute("transform", `translate(${x.toFixed(1)},${y.toFixed(1)})`);
      A.setOpacity(g, t >= t0 && t < t0 + pD + 0.12 ? Math.min(1, (t - t0) * 8, (t0 + pD + 0.12 - t) * 8) : 0);
    };
    s.nodes.forEach((n, i) => {
      pulse(s.pulses[i], n.arrow, pT0);
      const hp = A.prog(t, tHang, 0.2);
      n.setTone("bad", hp);
      A.show(n.x.inner, t, tHang, { d: 0.4, dy: 0, s0: 0.3, ease: A.E.outBack });
      n.arrow.setTone(hp > 0.5 ? "bad" : "line");
    });
    A.show(s.hung, t, w("allfail", "same moment"), { dy: 12 });

    // ---- takeaway + contrast chart: disks row on "like those disks", same-bug row on "Software faults",
    // the correlated takeaway on "often aren't".
    A.show(s.take1, t, cCorr + 0.1, { dy: 12 });
    A.show(s.take2, t, w("correlated", "often"), { dy: 14 });
    const tDisks = w("correlated", "like those disks");
    const chartOn = A.show(s.chart, t, tDisks - 0.05, { dy: 10, out: cEx - 0.4 });
    const sweeps = [[tDisks + 0.05, 1.1], [w("correlated", "Software"), 1.0]];
    s.rows.forEach((r, ri) => {
      const [t0, d] = sweeps[ri];
      A.setOpacity(r.g, A.prog(t, t0 - 0.1, 0.35));
      const p = U.clamp((t - t0) / d);
      const cx = s.lx[0] + p * (s.lx[1] - s.lx[0]);
      r.cursor.setAttribute("x1", cx.toFixed(1)); r.cursor.setAttribute("x2", cx.toFixed(1));
      A.setOpacity(r.cursor, t >= t0 && p < 1 ? 1 : 0);
      r.dots.forEach((dot, j) => A.show(dot, t, t0 + r.f[j] * d, { d: 0.35, dy: 0, s0: 0.2, ease: A.E.outBack }));
    });
    A.setOpacity(s.timeLbl.inner, chartOn > 0 ? 1 : 0);

    // ---- the spare runs the same code → same bug: box on "spare", link on "help", hangs on "same bug"
    A.show(s.spare.inner, t, w(lSpare, "spare"), { dy: 16 });
    s.spare.arrow.draw(t, w(lSpare, "help"), 0.45);
    const tSpHang = w(lSpare, "same");
    pulse(s.pulses[5], s.spare.arrow, tSpHang - pD);
    const sp = A.prog(t, tSpHang, 0.2);
    s.spare.setTone("bad", sp, "ghost");
    s.spare.arrow.setTone(sp > 0.5 ? "bad" : "line");
    A.show(s.spare.x.inner, t, tSpHang, { d: 0.4, dy: 0, s0: 0.3, ease: A.E.outBack });

    // ---- other correlated faults, each on its own words
    const exT = [w("examples", "Runaway"), w("examples", "slow"), w("examples", "cascading")];
    s.ex.forEach((c, i) => A.show(c, t, exT[i], { dy: 14 }));
  },
});
