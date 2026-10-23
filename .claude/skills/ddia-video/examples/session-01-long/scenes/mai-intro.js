// S22 — Maintainability divider. Full-bleed purple divider; at `lifetime` the title block lifts to make room for a
// software-lifetime bar: a short "build" segment, a launch marker, then a much longer "maintain" segment with its chores.
R.scene("mai-intro", {
  chrome: false,
  build(root, k) {
    const s = {};
    const { C } = K;
    root.style.background = C.maiBg;
    // The divider lives in a wrapper so the whole title block can lift as one piece.
    s.wrap = U.el("div", { style: { position: "absolute", left: "0px", top: "0px", width: "1920px", height: "1080px" } }, root);
    s.div = K.divider(s.wrap, { num: "03", title: "Maintainability", sub: "Most of the cost of software comes after launch.", pillar: "mai" });
    s.wrap.style.background = "transparent";

    // Callback to the hook's third symptom, in the sub slot while the divider holds.
    s.sym = K.chip(root, { x: 154, y: 790, text: "Symptom: a small change takes days to ship", accent: "ink", icon: "calendar", size: 34 });
    s.sym.style.background = "rgba(255,255,255,.06)";

    // Lifetime bar (SVG, positioned for the lifted layout).
    const svg = K.svgLayer(root);
    s.bar = U.sv("g", {}, svg);
    const X0 = 156, X1 = 1764, BY = 664, BH = 60, XB = 376; // build: X0..XB, maintain: XB+8..X1
    s.geo = { X0, X1, BY, BH, XB };
    const defs = U.sv("defs", {}, svg);
    const grad = U.sv("linearGradient", { id: "mai-intro-fade", gradientUnits: "userSpaceOnUse", x1: 1380, y1: 0, x2: X1, y2: 0 }, defs);
    U.sv("stop", { offset: "0", "stop-color": C.mai, "stop-opacity": 1 }, grad);
    U.sv("stop", { offset: "1", "stop-color": C.mai, "stop-opacity": 0.12 }, grad);
    s.track = U.sv("rect", { x: X0, y: BY, width: X1 - X0, height: BH, rx: 14, fill: "rgba(255,255,255,.07)" }, s.bar);
    s.build = U.sv("rect", { x: X0, y: BY, height: BH, rx: 14, fill: C.ink }, s.bar);
    s.maint = U.sv("rect", { x: XB + 8, y: BY, height: BH, rx: 14, fill: "url(#mai-intro-fade)" }, s.bar);
    s.buildLbl = K.label(s.bar, { x: (X0 + XB) / 2, y: BY - 26, text: "Build", size: 36, weight: 750, fill: "#FFFFFF" });
    s.maintLbl = K.label(s.bar, { x: XB + 30, y: BY - 26, text: "Maintain", size: 36, weight: 750, fill: C.mai, anchor: "start" });

    // Launch marker at the boundary.
    s.launch = U.sv("g", {}, s.bar);
    s.launchLine = U.sv("line", { x1: XB + 4, y1: BY - 18, x2: XB + 4, y2: BY + BH + 40, stroke: C.hl, "stroke-width": 5, "stroke-linecap": "round" }, s.launch);
    s.launchLbl = K.label(s.launch, { x: XB + 4, y: BY + BH + 82, text: "Launch", size: 32, weight: 750, fill: "hl" });

    // Chores along the maintain segment: tick + small label each.
    const chores = [["fix bugs", 640], ["keep it running", 930], ["adapt", 1220], ["add features", 1470]];
    s.chores = chores.map(([txt, x]) => {
      const g = U.sv("g", { transform: `translate(${x},0)` }, s.bar);
      const inner = U.sv("g", {}, g);
      U.sv("line", { x1: 0, y1: BY + BH + 10, x2: 0, y2: BY + BH + 40, stroke: "rgba(255,255,255,.7)", "stroke-width": 3, "stroke-linecap": "round" }, inner);
      U.sv("text", { x: 0, y: BY + BH + 82, "text-anchor": "middle", "font-size": 30, "font-weight": 650, fill: "rgba(255,255,255,.9)" }, inner, txt);
      return { g, inner };
    });
    return s;
  },

  update(t, k, s) {
    const cLife = k.cue("lifetime");
    const w = (ref, needle) => k.word(ref, needle);
    const st = s.div;
    // Same reveal timing as the other two section dividers (K.dividerUpdate with t0 = 0.1).
    const tNum = 0.1, tTitle = 0.25;
    A.show(st.num, t, tNum, { d: 0.9, dy: 60, out: cLife, outD: 0.5 });  // the big numeral steps aside for the timeline
    A.show(st.title, t, tTitle, { d: 0.8, dy: 40 });
    st.rule.style.transform = `scaleX(${A.prog(t, 0.55, 0.6).toFixed(3)})`;
    // The sub is the `lifetime` sentence: it lands as that line starts, once the lift has settled.
    A.show(st.sub, t, cLife + 0.55, { d: 0.6, dy: 20 });

    A.show(s.sym, t, w("divider", "symptom") - 0.05, { dy: 14, out: cLife, outD: 0.35 }); // "our last symptom"

    // Lift the title block to the top of the frame.
    const lift = A.prog(t, cLife + 0.05, 0.55, A.E.inOutCubic);
    s.wrap.style.transform = lift > 0 ? `translateY(${(-382 * lift).toFixed(2)}px)` : "";

    const g = s.geo;
    // Build segment on "…cost of software", launch marker on "launch", then the long maintain stretch.
    const tSoft = w("lifetime", "software"), tLaunch = w("lifetime", "launch");
    A.setOpacity(s.bar, A.prog(t, tSoft - 0.2, 0.4));
    const pb = A.prog(t, tSoft, 0.55, A.E.inOutCubic);
    s.build.setAttribute("width", Math.max(0, (g.XB - g.X0) * pb).toFixed(1));
    A.show(s.buildLbl.inner, t, tSoft + 0.1, { dy: 10 });
    A.show(s.launch, t, tLaunch - 0.12, { d: 0.45, dy: 0, s0: 0.6, ease: A.E.outBack });
    const pm = A.prog(t, tLaunch, 1.5, A.E.inOutCubic);
    s.maint.setAttribute("width", Math.max(0, (g.X1 - g.XB - 8) * pm).toFixed(1));
    A.show(s.maintLbl.inner, t, tLaunch + 0.15, { dy: 10 });
    // Each chore lands on its phrase.
    const words = ["Fixing", "keeping", "adapting", "adding"];             // fixing bugs · keeping it running · adapting it · adding features
    s.chores.forEach((c, i) => A.show(c.inner, t, w("lifetime", words[i]) - 0.05, { d: 0.45, dy: 12 }));
  },
});
