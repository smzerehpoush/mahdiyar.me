// S26 — Callback. The three symptom cards from the hook return; each maps to its pillar band.
(function () {
  // ---------------------------------------------------------------------------------------------------------------
  // Symptom cards — IDENTICAL copy in hook.js and callback.js (the callback must visibly return to the opening).
  // buildSymptoms(root, {xs, y, w, h}) → [state]; updateSymptom(state, u) where u = seconds since the card's mini
  // animation started (u < 0 → initial state). Pure function of u.
  // ---------------------------------------------------------------------------------------------------------------
  const SYM_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  function symChip(svg, x, y, w, h, txt) {
    const g = U.sv("g", { transform: `translate(${x},${y})` }, svg);
    const inner = U.sv("g", {}, g);
    const rect = U.sv("rect", { x: 0, y: 0, width: w, height: h, rx: h / 2, "stroke-width": 2.5 }, inner);
    const label = U.sv("text", { x: w / 2, y: h / 2 + 9, "text-anchor": "middle", "font-size": 26, "font-weight": 700, "font-family": "JetBrains Mono, monospace" }, inner, txt);
    return { g, inner, rect, label };
  }
  function symChipTone(c, tone, p) {
    const a = K.TONES.neutral, b = K.TONES[tone];
    c.rect.setAttribute("fill", A.mix(a.fill === "none" ? K.C.surface : a.fill, b.fill, p));
    c.rect.setAttribute("stroke", A.mix(a.stroke, b.stroke, p));
    c.label.setAttribute("fill", A.mix(K.C.ink, b.sub, p));
  }
  function buildSymptoms(root, o) {
    const C = K.C;
    const items = [
      { key: "stale", title: "Stale data" },
      { key: "slow", title: "Requests slowing down" },
      { key: "days", title: "A small change takes days to ship" },
    ];
    // Runtime workaround: tokens.css gives every SVG node transform-box:fill-box + transform-origin:center, which also
    // pivots the icon's scale() attribute around its own bbox (icon drifts right/down). Pivot at user-space 0,0 instead.
    const fixIc = (ic) => { Object.assign(ic.ig.style, { transformBox: "view-box", transformOrigin: "0px 0px" }); return ic; };
    const PW = o.w - 52, PH = 146; // panel inner size (card border 2 + padding 24, panel border 2); art is drawn in 132 px
    return items.map((it, i) => {
      const card = K.card(root, { x: o.xs[i], y: o.y, w: o.w, h: o.h, accent: "bad" });
      card.style.padding = "22px 24px";
      const panel = U.el("div", {}, card);
      Object.assign(panel.style, { position: "relative", height: PH + 4 + "px", borderRadius: "16px", background: C.bg2, border: `2px solid ${C.line}`, overflow: "hidden" });
      const svgEl = U.sv("svg", { viewBox: `0 0 ${PW} ${PH}`, width: PW, height: PH, style: { position: "absolute", left: "0px", top: "0px", overflow: "visible" } }, panel);
      const svg = U.sv("g", { transform: `translate(0,${(PH - 132) / 2})` }, svgEl);
      const title = U.el("div", {}, card, it.title);
      Object.assign(title.style, { fontSize: "40px", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.08, marginTop: "18px", color: C.ink });
      const s = { key: it.key, card, panel, svg, title };
      if (it.key === "stale") {
        // Database holds v2; the user still sees v1.
        fixIc(K.svgIcon(svg, "database", { x: 24, y: 12, size: 42, color: "muted" }));
        U.sv("text", { x: 84, y: 47, "font-size": 28, "font-weight": 650, fill: C.muted }, svg, "Database");
        fixIc(K.svgIcon(svg, "user", { x: 24, y: 71, size: 42, color: "muted" }));
        U.sv("text", { x: 84, y: 107, "font-size": 28, "font-weight": 650, fill: C.muted }, svg, "User sees");
        s.dbChip = symChip(svg, PW - 128, 15, 104, 44, "v1");
        s.userChip = symChip(svg, PW - 128, 75, 104, 44, "v1");
        s.ring = U.sv("rect", { x: PW - 128, y: 75, width: 104, height: 44, rx: 22, fill: "none", stroke: C.bad, "stroke-width": 3 }, svg);
      } else if (it.key === "slow") {
        // Successive requests take longer and longer (a latency bar stretching).
        fixIc(K.svgIcon(svg, "clock", { x: 20, y: 38, size: 54, color: "muted" }));
        const x0 = 96, tw = PW - x0 - 22;
        s.x0 = x0; s.tw = tw; s.bars = [];
        [24, 57, 90].forEach((y, j) => {
          U.sv("rect", { x: x0, y, width: tw, height: 18, rx: 9, fill: C.line }, svg);
          s.bars.push(U.sv("rect", { x: x0, y, width: 0, height: 18, rx: 9, fill: [C.ok, C.hl, C.bad][j] }, svg));
        });
      } else {
        // Calendar pages flip Mon → Fri; the one-line change is still not shipped.
        const cal = U.sv("g", { transform: "translate(22,12)" }, svg);
        U.sv("rect", { x: 0, y: 0, width: 128, height: 110, rx: 14, fill: C.surface2, stroke: C.line2, "stroke-width": 2.5 }, cal);
        U.sv("path", { d: "M1.25,14 Q1.25,1.25 14,1.25 H114 Q126.75,1.25 126.75,14 V32 H1.25 Z", fill: C.bad }, cal);
        [38, 90].forEach((x) => U.sv("path", { d: `M${x},-7 V9`, stroke: C.ink, "stroke-width": 5, "stroke-linecap": "round" }, cal));
        s.dayG = U.sv("g", {}, cal);
        s.day = U.sv("text", { x: 64, y: 87, "text-anchor": "middle", "font-size": 40, "font-weight": 800, fill: C.ink }, s.dayG, "Mon");
        s.chg = U.sv("text", { x: 180, y: 58, "font-size": 30, "font-weight": 700, fill: C.ink }, svg, "1-line change");
        s.wait = U.sv("text", { x: 180, y: 100, "font-size": 26, "font-weight": 650, fill: C.bad }, svg, "not shipped yet");
      }
      return s;
    });
  }
  function updateSymptom(s, u) {
    if (s.key === "stale") {
      const tf = 0.45, flip = U.clamp(Math.abs(u - tf) / 0.12);
      s.dbChip.inner.style.transform = `scaleY(${(u > tf - 0.12 && u < tf + 0.12 ? flip : 1).toFixed(3)})`;
      s.dbChip.label.textContent = u >= tf ? "v2" : "v1";
      symChipTone(s.dbChip, "ok", A.prog(u, tf, 0.25));
      const bad = A.prog(u, 0.8, 0.3);
      symChipTone(s.userChip, "bad", bad);
      const pr = U.clamp((u - 0.85) / 0.7);
      s.ring.setAttribute("opacity", (pr > 0 && pr < 1 ? (1 - pr) * 0.9 : 0).toFixed(3));
      const grow = 1 + 0.35 * A.E.outCubic(pr);
      s.ring.style.transform = `scale(${grow.toFixed(3)})`;
    } else if (s.key === "slow") {
      const L = [0.2, 0.48, 0.82];
      s.bars.forEach((b, j) => {
        let w = s.tw * L[j] * A.prog(u, 0.1 + 0.4 * j, 0.55);
        if (j === 2) w += s.tw * 0.18 * U.clamp((u - 1.1) / 3.5); // the slowest one keeps stretching
        b.setAttribute("width", Math.max(0, w).toFixed(1));
        b.style.visibility = w < 1 ? "hidden" : "visible";
      });
    } else {
      const flips = [0.55, 0.97, 1.39, 1.81];
      let n = 0, sc = 1;
      flips.forEach((tf) => { if (u >= tf) n++; const d = Math.abs(u - tf); if (d < 0.1) sc = Math.min(sc, d / 0.1); });
      s.day.textContent = SYM_DAYS[n];
      s.dayG.style.transform = `scaleY(${sc.toFixed(3)})`;
      A.setOpacity(s.wait, A.prog(u, 0.2, 0.4));
    }
  }
  // ------------------------------------------------------------------------------------------------- end shared

  /** Pillar band (HTML). Grows up from its bottom edge like the title-slide bands. */
  function band(root, o) {
    const n = U.el("div", {}, root);
    Object.assign(n.style, { position: "absolute", left: o.x + "px", top: o.y + "px", width: o.w + "px", height: o.h + "px", background: o.bg, borderRadius: "22px", transformOrigin: "50% 100%", boxShadow: "0 30px 60px -30px rgba(0,0,0,.6)" });
    const name = K.text(n, { x: 30, y: 26, w: o.w - 60, cls: "", html: o.name });
    Object.assign(name.style, { fontSize: "46px", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.04, color: "#FFFFFF" });
    const why = K.text(n, { x: 30, y: 0, w: o.w - 60, cls: "", text: "" });
    Object.assign(why.style, { top: "auto", bottom: "28px", fontSize: "31px", fontWeight: 600, lineHeight: 1.25, color: "rgba(255,255,255,.88)" });
    // The reason is split into parts revealed word-synced; every part is laid out from the start, so nothing reflows.
    const parts = o.why.map(([txt, st]) => { const sp = U.el("span", {}, why, txt); if (st) Object.assign(sp.style, st); return sp; });
    return { n, name, why, parts };
  }

  R.scene("callback", {
    build(root, k) {
      const s = {};
      const C = K.C;
      const xs = [120, 700, 1280], W = 520;
      s.sym = buildSymptoms(root, { xs, y: 150, w: W, h: 300 });
      const svg = K.svgLayer(root);
      const em = { color: C.hl, fontWeight: 800 };
      // `why` parts follow the narration: [text, style?]; each part's word anchor is in update() (WHY_AT).
      const pillars = [
        { tone: "rel", bg: C.relBg, name: "Reliability", why: [["Promised: cache & index match the database"], [" — broken", em]] },
        { tone: "sca", bg: C.scaBg, name: "Scalability &amp; performance", why: [["Growing load,"], [" and a tail hidden by averages"]] },
        { tone: "mai", bg: C.maiBg, name: "Maintainability", why: [["Accidental complexity"], [" makes it hard to operate & change"]] },
      ];
      s.pillars = pillars;
      s.arrows = xs.map((x, i) => K.arrow(svg, { from: [x + W / 2, 450], to: [x + W / 2, 570], gapStart: 14, gapEnd: 12, tone: pillars[i].tone, width: 5 }));
      // Runtime workaround: tokens.css gives every SVG node transform-origin:center (fill-box), which also pivots the
      // arrowhead's rotate() attribute around its own bbox — non-horizontal heads end up misplaced. Pivot at user-space 0,0.
      s.arrows.forEach((a) => { if (a.head) Object.assign(a.head.style, { transformBox: "view-box", transformOrigin: "0px 0px" }); });
      s.bands = xs.map((x, i) => band(root, { x, y: 570, w: W, h: 260, ...pillars[i] }));

      // Closing beat: "running and online" was never "working well" — one centred row in the free strip under the bands,
      // so the symptom → pillar mapping above stays fully visible as the scene's summary.
      s.close = U.el("div", {}, root);
      Object.assign(s.close.style, { position: "absolute", left: "120px", top: "848px", width: "1680px", height: "76px", display: "flex", justifyContent: "center", alignItems: "center", gap: "26px" });
      s.pillRow = U.el("div", {}, s.close);
      Object.assign(s.pillRow.style, { display: "flex", alignItems: "center", gap: "20px" });
      s.pills = ["Database: running", "Servers: online"].map((txt) => {
        const p = K.pill(s.pillRow, { x: 0, y: 0, text: txt, tone: "ok" });
        Object.assign(p.style, { position: "relative", left: "auto", top: "auto", fontSize: "32px" });
        return p;
      });
      s.neq = U.el("div", {}, s.close);
      Object.assign(s.neq.style, { display: "flex", alignItems: "center", gap: "22px", marginLeft: "8px", fontSize: "58px", fontWeight: 800, letterSpacing: "-0.03em", color: C.hl, lineHeight: 1 });
      s.neq.innerHTML = `<svg width="52" height="52" viewBox="0 0 72 72" fill="none" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"><path d="M10 27h52M10 47h52M47 10 25 62"/></svg><span>working well</span>`;
      [s.neqSym, s.neqTxt] = s.neq.children;
      return s;
    },

    update(t, k, s) {
      const C = K.C;
      const maps = ["map1", "map2", "map3"];
      // Word-synced moments per map line: the symptom is named, then its pillar, then the reason (in two parts).
      const SYM_AT = ["stale data", "slowing", "days"];
      const PILLAR_AT = ["reliability", "scalability", "maintainability"];
      const WHY_AT = [["promised", "broke"], ["growing", "and a tail"], ["accidental", "makes"]];
      const tSym = maps.map((m, i) => k.word(m, SYM_AT[i]));
      const tPillar = maps.map((m, i) => k.word(m, PILLAR_AT[i]) - 0.05);
      const tWhy = maps.map((m, i) => WHY_AT[i].map((w) => k.word(m, w) - 0.05));
      // "Back to our three symptoms": the cards return on "three".
      const tCards = k.word("symptoms", "three") - 0.2;

      s.sym.forEach((c, i) => {
        const tIn = tCards + 0.18 * i;
        // Focus: the card being mapped (and those already mapped) stay bright; the rest wait dimmed.
        const active = i === 0 ? 1 : A.prog(t, k.cue(maps[i]), 0.4);
        const waiting = A.prog(t, k.cue("map1"), 0.4) * (1 - active);
        A.show(c.card, t, tIn, { dy: 22, s0: 0.98, max: 1 - 0.55 * waiting });
        updateSymptom(c, (t - tIn - 0.1) * 1.6);
        // The card takes on its pillar color when the pillar is named.
        const p = A.prog(t, tPillar[i], 0.5);
        const col = A.mix(C.bad, K.toneColor(s.pillars[i].tone), p);
        c.card.style.borderColor = col;
        c.card.style.background = `color-mix(in srgb, ${col} 9%, ${C.surface})`;
        // Arrow draws from the symptom as it is named and reaches the band as the pillar is named.
        s.arrows[i].draw(t, tSym[i] + 0.1, Math.max(0.5, tPillar[i] - tSym[i] - 0.1));
        const g = A.prog(t, tPillar[i], 0.5, A.E.outCubic);
        const b = s.bands[i];
        b.n.style.transform = `scaleY(${g.toFixed(4)})`;
        A.setOpacity(b.n, A.prog(t, tPillar[i], 0.2));
        A.show(b.name, t, tPillar[i] + 0.25, { d: 0.5, dy: 12 }); // as the (fast) band growth settles — no squashed text
        A.setOpacity(b.why, A.prog(t, tWhy[i][0], 0.01));
        b.parts.forEach((sp, j) => A.setOpacity(sp, A.prog(t, tWhy[i][j], 0.45)));
        b.why.style.transform = `translateY(${(12 * (1 - A.prog(t, tWhy[i][0], 0.6))).toFixed(2)}px)`;
      });

      // Closing row under the (still fully visible) mapping: "Running and online was never the same as working well."
      A.show(s.pills[0], t, k.word(4, "running") - 0.05, { dy: 10 });
      A.show(s.pills[1], t, k.word(4, "online") - 0.05, { dy: 10 });
      A.show(s.neqSym, t, k.word(4, "never") - 0.05, { dy: 0, s0: 0.6, d: 0.45 });
      A.show(s.neqTxt, t, k.word(4, "working") - 0.05, { dy: 14 });
    },
  });
})();
