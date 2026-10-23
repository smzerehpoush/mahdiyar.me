// S11 — Scalability divider, then: "scalable" is not a yes/no label → "if load grows like this, what are our options?" →
// describe today's load with load parameters (chips).
(() => {
  const C = K.C;

  // Local copy of the engine's section tag (#chrome, tokens.css). The scene runs with chrome:false so the tag does not sit on
  // the orange divider; this copy fades in when the divider leaves.
  function sectionTag(root, text, color) {
    const n = U.el("div", {}, root);
    Object.assign(n.style, { position: "absolute", left: "72px", top: "52px", display: "flex", alignItems: "center", gap: "14px",
      fontSize: "26px", fontWeight: 700, letterSpacing: "0.04em", color: C.muted, whiteSpace: "nowrap", pointerEvents: "none" });
    const sw = U.el("span", {}, n);
    Object.assign(sw.style, { width: "14px", height: "14px", borderRadius: "4px", background: color });
    U.el("span", {}, n, text);
    return n;
  }

  R.scene("sca-intro", {
    chrome: false,
    build(root, k) {
      const s = {};
      s.tag = sectionTag(root, "02 · Scalability", C.sca);

      // ---- Canvas part (sits under the divider until `strike`).
      // Beat `strike`: the yes/no label, struck through.
      s.phrase = K.text(root, { x: 120, y: 110, cls: "h2", text: "“Our system is scalable.”" });
      s.strike = U.el("div", {}, s.phrase);
      Object.assign(s.strike.style, { position: "absolute", left: "-10px", right: "-10px", top: "44px", height: "8px", borderRadius: "4px",
        background: C.bad, transformOrigin: "left center" });

      // Beat `question`: the better question + a load-growth sketch ("like this").
      s.q = K.text(root, { x: 120, y: 250, w: 1180, cls: "h3", html: `If load grows <span style="color:${C.sca}">like this</span>,<br>what are our options?` });

      const svg = K.svgLayer(root);
      const O = [1060, 470]; // chart origin
      s.chart = U.sv("g", {}, svg);
      s.axes = U.sv("g", {}, s.chart);
      K.arrow(s.axes, { from: O, to: [O[0], 150], tone: "line", width: 3 });
      K.arrow(s.axes, { from: O, to: [1795, O[1]], tone: "line", width: 3 });
      K.label(s.axes, { x: O[0] + 22, y: 166, text: "load", size: 28, weight: 600, fill: "muted", anchor: "start" });
      K.label(s.axes, { x: 1795, y: O[1] + 42, text: "time", size: 28, weight: 600, fill: "muted", anchor: "end" });
      const today = [1450, 402];
      s.curve = U.sv("path", { d: `M${O[0] + 16},${O[1] - 18} Q1300,${O[1] - 26} ${today[0]},${today[1]}`, fill: "none", stroke: C.sca, "stroke-width": 7, "stroke-linecap": "round" }, s.chart);
      // Projected growth (dotted): sampled quadratic so it can be revealed progressively without breaking the dot pattern.
      const qb = (a, c, b, u) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * c + u * u * b;
      s.projPts = Array.from({ length: 61 }, (_, i) => [qb(today[0], 1660, 1770, i / 60), qb(today[1], 340, 168, i / 60)]);
      s.proj = U.sv("path", { d: "", fill: "none", stroke: C.sca, "stroke-width": 7, "stroke-linecap": "round", "stroke-dasharray": "2 17" }, s.chart);
      s.todayG = U.sv("g", { transform: `translate(${today[0]},${today[1]})` }, s.chart);
      s.todayIn = U.sv("g", {}, s.todayG);
      s.halo = U.sv("circle", { cx: 0, cy: 0, r: 22, fill: C.hl, opacity: 0.18 }, s.todayIn);
      U.sv("circle", { cx: 0, cy: 0, r: 11, fill: C.hl }, s.todayIn);
      K.label(s.todayIn, { x: -26, y: -24, text: "today", size: 26, weight: 700, fill: "hl", anchor: "end" });

      // Beat `params`: header + chips, one per parameter as the narrator names it.
      s.hdr = K.text(root, { x: 120, y: 560, cls: "label", html: `<span style="color:${C.sca};font-size:40px;font-weight:800;letter-spacing:-0.01em">Load parameters</span><span style="color:${C.muted};font-size:32px;font-weight:550">&nbsp;&nbsp;— a few numbers that describe today’s load</span>` });
      const mk = (x, y, items) => K.chips(root, { x, y, w: 1680, size: 36, accent: "sca", items }).chips;
      s.chips = [
        ...mk(120, 650, [
          { text: "Requests / sec", icon: "stream" },
          { text: "Read : write ratio", icon: "database" },
          { text: "Concurrent users", icon: "users" },
        ]),
        ...mk(120, 752, [
          { text: "Cache hit rate", icon: "cache" },
          { text: `Skew <span style="color:${C.muted};font-weight:550">— a few extreme cases</span>`, icon: "chart" },
        ]),
      ];
      s.chips.forEach((c) => { c.style.padding = "14px 30px 14px 24px"; c.style.gap = "16px"; });

      // ---- Divider on top (own full-bleed layer so it can fade out at `strike`).
      s.divBox = U.el("div", {}, root);
      Object.assign(s.divBox.style, { position: "absolute", left: "0", top: "0", width: "1920px", height: "1080px" });
      s.div = K.divider(s.divBox, { num: "02", title: "Scalability", sub: "Not a label. A question about growth.", pillar: "sca" });
      return s;
    },

    update(t, k, s) {
      const cStrike = k.cue("strike");
      // Word anchors (scene-local seconds from whisper word timings; see tools/word-probe.mjs).
      const w = {
        phrase: k.word("strike", "our system"),       // "Saying 'our system is scalable'…"
        isnt: k.word("strike", "isn't"),              // "…It isn't."
        ifLoad: k.word("question", "if load"),        // "Ask instead: if load grows…"
        grows: k.word("question", "grows"),
        particular: k.word("question", "particular"), // "…in a particular way"
        today: k.word("params", "today's"),           // "describe today's load"
        params: k.word("params", "load parameters"),  // "…called load parameters."
      };

      // Divider: builds at the top of the scene, fades out at `strike`.
      K.dividerUpdate(t, s.div, 0.1);
      A.setOpacity(s.divBox, 1 - A.prog(t, cStrike, 0.6, A.E.inOutCubic));
      A.setOpacity(s.tag, A.prog(t, cStrike + 0.2, 0.5));

      // `strike`: the label appears with "our system is scalable", then is struck through on "It isn't."
      A.show(s.phrase, t, w.phrase, { dy: 18 });
      const ps = A.prog(t, w.isnt - 0.05, 0.45, A.E.inOutCubic);
      s.strike.style.transform = `scaleX(${ps.toFixed(4)})`;
      s.strike.style.visibility = ps <= 0.001 ? "hidden" : "visible";
      s.phrase.style.color = A.mix(C.ink, C.faint, 0.75 * A.prog(t, w.isnt + 0.2, 0.5));

      // `question`: the reframed question on "if load grows…"; the axes come with "load", today's curve draws on "grows",
      // and the projected growth (dotted) on "in a particular way".
      A.show(s.q, t, w.ifLoad - 0.1, { dy: 18 });
      A.show(s.axes, t, w.ifLoad, { dy: 0 });
      A.draw(s.curve, t, w.grows - 0.05, 0.7, A.E.inOutSine);
      const pp = A.prog(t, w.particular - 0.1, 0.9, A.E.inOutSine);
      const np = Math.round(pp * 60);
      s.proj.setAttribute("d", np < 1 ? "" : "M" + s.projPts.slice(0, np + 1).map((q) => q[0].toFixed(1) + "," + q[1].toFixed(1)).join(" L"));

      // `params`: "today's load" is marked on the curve; the header lands on "load parameters"; then one chip per parameter
      // exactly as the narrator names it.
      A.show(s.todayIn, t, w.today, { d: 0.5, dy: 0, s0: 0.4, ease: A.E.outBack });
      s.halo.setAttribute("r", (22 + 6 * Math.sin(Math.max(0, t - w.today) * 3.2)).toFixed(2));
      A.show(s.hdr, t, w.params - 0.05, { dy: 16 });
      const chipAt = [
        k.word(4, "Requests"),
        k.word(4, "reads versus"),
        k.word(4, "users online"),
        k.word(4, "cache"), // whisper heard "cash"; the caption fallback lands ~0.15 s after the spoken word
        k.word(4, "skew"),
      ];
      s.chips.forEach((c, i) => A.show(c, t, chipAt[i] - 0.05, { d: 0.5, dy: 14, s0: 0.92 }));
    },
  });
})();
