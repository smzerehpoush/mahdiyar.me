// S01 — Hook. Everything looks healthy (green status), yet users suffer three symptoms. Ends on the question.
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

  /** Speed warp: time runs at 1 until ts, then slows linearly to `slow` over d seconds (keeps packets continuous). */
  function warp(t, ts, d, slow) {
    if (t <= ts) return t;
    const x = Math.min(t - ts, d);
    let tau = ts + x - ((1 - slow) * x * x) / (2 * d);
    if (t > ts + d) tau += (t - ts - d) * slow;
    return tau;
  }
  /** A status pill centered on cx (wrapper is animated, the pill itself is laid out by flexbox). */
  function centeredPill(root, cx, y, text, tone) {
    const wrap = U.el("div", {}, root);
    Object.assign(wrap.style, { position: "absolute", left: cx - 300 + "px", top: y + "px", width: "600px", display: "flex", justifyContent: "center" });
    const pill = K.pill(wrap, { x: 0, y: 0, text, tone });
    Object.assign(pill.style, { position: "relative", left: "auto", top: "auto" });
    return wrap;
  }

  R.scene("hook", {
    build(root, k) {
      const s = {};
      const svg = K.svgLayer(root);
      // Minimal system sketch: Users → App servers → Database.
      s.users = K.box(svg, { x: 200, y: 150, w: 250, h: 140, label: "Users", icon: "users" });
      s.app = K.box(svg, { x: 780, y: 150, w: 320, h: 140, label: "App servers", icon: "server" });
      s.db = K.box(svg, { x: 1400, y: 150, w: 300, h: 140, label: "Database", icon: "database" });
      // Runtime workaround (see fixIc above): K.box icon groups carry translate()+scale() — pivot them at user-space 0,0.
      [s.users, s.app, s.db].forEach((b) => b.icon && Object.assign(b.icon.style, { transformBox: "view-box", transformOrigin: "0px 0px" }));
      s.a1 = K.arrow(svg, { from: s.users.right, to: s.app.left, gapStart: 14, gapEnd: 14 });
      s.a2 = K.arrow(svg, { from: s.app.right, to: s.db.left, gapStart: 14, gapEnd: 14 });
      s.p1 = K.packets(svg, s.a1, { n: 3, period: 1.3 });
      s.p2 = K.packets(svg, s.a2, { n: 3, period: 1.3 });
      s.okDb = K.mark(svg, "check", { x: 1700, y: 150, size: 50 });
      s.okApp = K.mark(svg, "check", { x: 1100, y: 150, size: 50 });
      s.pillDb = centeredPill(root, s.db.cx, 322, "Database: running", "ok");
      s.pillApp = centeredPill(root, s.app.cx, 322, "Servers: online", "ok");

      // Three symptom cards.
      s.sym = buildSymptoms(root, { xs: [120, 700, 1280], y: 450, w: 520, h: 300 });

      s.q = K.text(root, { x: 960, w: 1680, y: 800, cls: "h2", align: "center", html: `Is your system actually <span>working well</span>?` });
      s.qEm = s.q.querySelector("span");
      return s;
    },

    update(t, k, s) {
      // Word anchors: each status turns green as it is said; each symptom card lands with its words.
      const tRun = k.word("running", "running"), tOn = k.word("online", "online");
      const tUsers = k.word("stale", "users"), tStale = k.word("stale", "stale");
      const tReq = k.word("slow", "requests"), tSlowing = k.word("slow", "slowing");
      const tSmall = k.word("days", "one small"), tDays = k.word("days", "days");
      const tQ = k.word("question", "is your system"), tWell = k.word("question", "working well");

      // Sketch establishes during the fade-in (context for the first line, not a beat).
      A.show(s.users.inner, t, 0.05, { dy: 16 });
      A.show(s.app.inner, t, 0.2, { dy: 16 });
      A.show(s.db.inner, t, 0.35, { dy: 16 });
      s.a1.draw(t, 0.45, 0.6);
      s.a2.draw(t, 0.6, 0.6);

      // Request dots: steady, then slower (and redder) from "slowing".
      const slowP = A.prog(t, tSlowing, 1.2);
      const tau = warp(t, tSlowing, 1.6, 0.38);
      const on = A.prog(t, 0.9, 0.4);
      const col = A.mix(K.C.hl, K.C.bad, slowP);
      s.p1.update(tau, on, { tone: col });
      s.p2.update(tau + 0.43, on, { tone: col });

      // "…is running": database goes green, ✓ and status pill.
      s.db.setTone("ok", A.prog(t, tRun - 0.1, 0.4));
      A.show(s.okDb.inner, t, tRun, { d: 0.45, dy: 0, s0: 0.3, ease: A.E.outBack });
      A.show(s.pillDb, t, tRun + 0.05, { dy: 12 });
      // "…are online": app servers go green.
      s.app.setTone("ok", A.prog(t, tOn - 0.1, 0.4));
      A.show(s.okApp.inner, t, tOn, { d: 0.45, dy: 0, s0: 0.3, ease: A.E.outBack });
      A.show(s.pillApp, t, tOn + 0.05, { dy: 12 });

      // Symptoms, one at a time. tIn = card entrance; tAnim = start of the card's mini animation (u = 0).
      const tIn = [tStale - 0.05, tReq, tSmall - 0.05];
      // Stale: DB flips to v2 on "data", the user's v1 turns red. Slow: bars stretch through "slowing down".
      // Days: the calendar's first page flip (u = 0.55) lands on "days".
      const tAnim = [tStale, tReq + 0.15, tDays - 0.55];
      s.sym.forEach((c, i) => {
        A.show(c.card, t, tIn[i], { dy: 22, s0: 0.98 });
        updateSymptom(c, t - tAnim[i]);
      });
      // "But users are seeing…": the Users box picks up a red edge (users are the ones who notice).
      s.users.setTone("bad", 0.55 * A.prog(t, tUsers, 0.5));

      // The closing question; "working well" warms to the highlight color as it is said.
      A.show(s.q, t, tQ, { dy: 18 });
      s.qEm.style.color = A.mix(K.C.ink, K.C.hl, A.prog(t, tWell - 0.05, 0.4));
    },
  });
})();
