// S25 — Evolvability. Requirement chips drift in and push on "your system"; then the callback to Twitter's switch from
// fan-out on read to fan-out on write (an architecture-level change), made in small, safe, backward-compatible steps.
(function () {
  const C = K.C;

  // Header pieces (copied from operability.js): "three ideas" tracker + one-line definition card.
  function tracker(root) {
    const box = U.el("div", {}, root);
    Object.assign(box.style, { position: "absolute", right: "120px", top: "124px", display: "flex", gap: "14px" });
    const items = ["Operability", "Simplicity", "Evolvability"].map((n, i) => {
      // The name sits in its own span so it can stay hidden (opacity only: no reflow) until the narrator says it.
      const c = K.chip(box, { text: `<span style="opacity:.6">${i + 1}</span>&nbsp;&nbsp;<span class="nm">${n}</span>`, accent: "faint", size: 26 });
      c.style.position = "relative";
      return c;
    });
    return { box, items, nm: items.map((c) => c.querySelector(".nm")) };
  }
  function setTrack(chip, from, to, p) {
    const col = [C.faint, C.mai, C.muted];
    chip.style.color = A.mix(col[from], col[to], p);
    const a = (st) => (st === 1 ? 16 : 0);
    chip.style.background = `color-mix(in srgb, ${C.mai} ${U.lerp(a(from), a(to), p).toFixed(1)}%, transparent)`;
  }
  function defCard(root, o) {
    const n = K.card(root, { x: 120, y: o.y, w: 100, accent: "mai" });
    Object.assign(n.style, { width: "auto", display: "flex", alignItems: "center", gap: "24px", padding: "22px 36px 22px 28px" });
    n.innerHTML = `<svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="${C.mai}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">${o.icon}</svg>` +
      `<div style="font-size:40px;font-weight:750;letter-spacing:-0.015em;color:${C.ink};white-space:nowrap">${o.html}</div>`;
    return n;
  }
  // Runtime quirk: tokens.css gives every SVG element transform-origin:center (fill-box), which also applies to the icon's
  // scale() transform attribute and pushes K.box / K.svgIcon icons ~10-14 px right and down. Reset the origin locally.
  const fixIcon = (g) => { if (g) { g.style.transformBox = "view-box"; g.style.transformOrigin = "0 0"; } return g; };
  const STEPS_ICON = '<path d="M6 56h13V43h13V30h13V17h11"/><path d="m50 9 8 8-8 8"/>';
  /** S12's list box (user icon + three entry bars: a user's tweets, or a cached timeline), so the callback echoes S12. */
  function listBox(parent, o) {
    const isz = 28, bh = 7, pad = 12;
    const b = K.box(parent, { x: o.x, y: o.y, w: o.w, h: o.h, label: "", icon: "user", iconInline: true, iconSize: isz, r: 14 });
    fixIcon(b.icon);
    const x0 = 22 + isz + 14, x1 = o.w - 18, gap = (o.h - 2 * pad - 3 * bh) / 2;
    b.bars = [0.9, 0.66, 0.8].map((wf, i) => U.sv("rect", { x: x0, y: pad + i * (bh + gap), width: (x1 - x0) * wf, height: bh, rx: 3.5,
      fill: i === 0 && o.top ? o.top : C.line2 }, b.inner));
    return b;
  }

  R.scene("evolvability", {
    build(root, k) {
      const s = {};
      s.track = tracker(root);
      s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Evolvability" });
      s.def = defCard(root, { y: 236, icon: STEPS_ICON, html: `Make <span style="color:${C.mai}">future change</span> easy.` });
      const svg = K.svgLayer(root);

      // ================= Phase 1: requirements keep moving =================
      s.p1 = U.sv("g", {}, svg);
      s.h1 = K.label(s.p1, { x: 120, y: 424, text: "Requirements keep moving", anchor: "start", size: 34, weight: 750, fill: "mai" });
      s.sysWrap = U.sv("g", {}, s.p1);
      s.sys = K.box(s.sysWrap, { x: 800, y: 560, w: 320, h: 140, label: "Your system", icon: "server" });
      fixIcon(s.sys.icon);
      // [text, icon, side (-1 left / +1 right), row (0 top / 1 bottom)] in narration order.
      const REQ = [["New use cases", "star", -1, 0], ["Business priorities", "queue", 1, 0], ["New regulations", "file", -1, 1], ["Growth", "chart", 1, 1]];
      const XL = 690, XR = 1230, ROWY = [478, 718];
      s.req = REQ.map(([text, icon, side, row]) => {
        const c = K.chip(root, { text, icon, accent: "mai" });
        if (side < 0) { c.style.left = "auto"; c.style.right = 1920 - XL + "px"; } else c.style.left = XR + "px";
        c.style.top = ROWY[row] + "px";
        const cy = ROWY[row] + 32;
        const arr = K.arrow(s.p1, { from: [side < 0 ? XL : XR, cy], to: [side < 0 ? 800 : 1120, row ? 664 : 596], gapStart: 14, gapEnd: 12, tone: "mai", width: 3 });
        return { c, arr, side, row };
      });

      // ================= Phase 2: the Twitter callback =================
      s.p2 = U.sv("g", {}, svg);
      // Badge sits above the header row (headers at y=452) so it does not crowd "Fan-out on write".
      s.badge = K.badge(root, { x: 0, y: 360, right: 120, text: "Twitter, circa 2012" });
      const FY = (i) => 520 + i * 68, CYD = 650;
      // Fan-out on read: tweets of everyone you follow converge when you open your timeline.
      s.readG = U.sv("g", {}, s.p2);
      K.label(s.readG, { x: 120, y: 452, text: "Fan-out on read", anchor: "start", size: 34, weight: 750, fill: "ink" });
      K.label(s.readG, { x: 120, y: 500, text: "Everyone you follow", anchor: "start", size: 26, weight: 600, fill: "muted" });
      s.fol = [0, 1, 2, 3].map((i) => listBox(s.readG, { x: 120, y: FY(i), w: 150, h: 56 }));
      s.tl = K.box(s.readG, { x: 430, y: CYD - 60, w: 250, h: 120, label: "Your timeline", icon: "user", fs: 28 });
      fixIcon(s.tl.icon);
      s.rArr = s.fol.map((f) => K.arrow(s.readG, { from: f.right, to: s.tl.left, gapStart: 10, gapEnd: 12 }));
      s.rPk = s.rArr.map((a) => K.packets(s.readG, a, { n: 2, period: 1.3, r: 8 }));
      // Fan-out on write: a new tweet is copied into each follower's cached timeline.
      s.writeG = U.sv("g", {}, s.p2);
      K.label(s.writeG, { x: 1240, y: 452, text: "Fan-out on write", anchor: "start", size: 34, weight: 750, fill: "ink" });
      K.label(s.writeG, { x: 1800, y: 500, text: "Each follower’s cached timeline", anchor: "end", size: 26, weight: 600, fill: "muted" });
      s.tw = K.box(s.writeG, { x: 1240, y: CYD - 60, w: 230, h: 120, label: "New tweet", icon: "tweet", fs: 28 });
      fixIcon(s.tw.icon);
      s.mb = [0, 1, 2, 3].map((i) => listBox(s.writeG, { x: 1650, y: FY(i), w: 150, h: 56, top: C.mai })); // new tweet on top
      s.wArr = s.mb.map((m) => K.arrow(s.writeG, { from: s.tw.right, to: m.left, gapStart: 12, gapEnd: 10 }));
      s.wPk = s.wArr.map((a) => K.packets(s.writeG, a, { n: 2, period: 1.3, r: 8 }));
      // The switch.
      s.big = K.arrow(s.p2, { from: [680, CYD], to: [1240, CYD], gapStart: 30, gapEnd: 30, tone: "mai", width: 6 });
      s.bigLbl = K.label(s.p2, { x: 960, y: CYD - 28, text: "Architecture-level change", size: 30, weight: 750, fill: "mai" });

      // ================= Phase 3: small, safe, backward-compatible steps =================
      s.p3 = U.sv("g", {}, svg);
      const SY = 832, SX = [400, 680, 960, 1240, 1520];
      s.base = K.arrow(s.p3, { from: [SX[0], SY], to: [SX[4], SY], head: false, width: 4, tone: "line" });
      s.prog = U.sv("path", { d: `M${SX[0]},${SY} H${SX[4]}`, stroke: C.mai, "stroke-width": 6, "stroke-linecap": "round", fill: "none" }, s.p3);
      s.prog.setAttribute("pathLength", "1");
      s.prog.style.strokeDasharray = "1 1";
      s.stepX = SX;
      s.dots = SX.map((x) => {
        const g = U.sv("g", { transform: `translate(${x},${SY})` }, s.p3);
        const inner = U.sv("g", {}, g);
        const ring = U.sv("circle", { cx: 0, cy: 0, r: 20, fill: C.bg, stroke: C.line2, "stroke-width": 3.5 }, inner);
        const tick = U.sv("path", { d: "M-9,1 L-3,7 L9,-6", fill: "none", stroke: C.bg, "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round" }, inner);
        return { g, inner, ring, tick };
      });
      s.words = K.text(root, { x: 960, y: 868, w: 1200, align: "center", cls: "label",
        html: ["Small,", "safe,", "backward-compatible", "steps"].map((w) => `<span>${w}</span>`).join(" ") });
      s.words.style.fontSize = "34px";
      s.words.style.color = C.mai;
      s.wordSpans = [...s.words.querySelectorAll("span")];
      return s;
    },

    update(t, k, s) {
      const w = (line, needle, nth) => k.word(line, needle, nth); // word anchors (whisper timings)
      const L3 = k.lines[3];
      const cCh = k.cue("changes"), cCb = k.cue("callback");

      // Header. ("evol" also matches the recognizer's "Evolveability" spelling.)
      const tTitle = w("card", "evol") - 0.05;
      A.show(s.title, t, tTitle);
      A.setOpacity(s.track.box, 1);
      setTrack(s.track.items[0], 2, 2, 1);
      setTrack(s.track.items[1], 2, 2, 1);
      setTrack(s.track.items[2], 0, 1, A.prog(t, tTitle + 0.2, 0.5));
      s.track.nm[0].style.opacity = s.track.nm[1].style.opacity = 1;
      s.track.nm[2].style.opacity = A.prog(t, tTitle, 0.5).toFixed(3);
      A.show(s.def, t, w("card", "make future") - 0.05, { dy: 14 });

      // ---------- Phase 1: chips drift in and dock around the system, each on its spoken words ----------
      const out1 = w("callback", "switching"); // linger through "Remember Twitter…", clear before the diagrams
      A.show(s.p1, t, cCh, { dy: 0, d: 0.3, out: out1, outD: 0.45 });
      A.show(s.h1.inner, t, cCh + 0.05, { dy: 10 });
      A.show(s.sysWrap, t, cCh + 0.2, { dy: 14, d: 0.5 });
      let px = 0, py = 0;
      [w("changes", "new use"), w("changes", "business"), w("changes", "new regulations"), w("changes", "growth")].forEach((tw, i) => {
        const r = s.req[i], t0 = tw - 0.05, D = 1.0;
        A.show(r.c, t, t0, { d: D, dx: 360 * r.side, dy: r.row ? 60 : -60, ease: A.E.outCubic, out: out1, outD: 0.45 });
        r.arr.draw(t, t0 + D - 0.15, 0.35);
        const x = (t - (t0 + D)) / 0.4; // a small push when the arrow lands
        const bump = x > 0 && x < 1 ? Math.sin(Math.PI * x) : 0;
        px -= r.side * 7 * bump; py -= (r.row ? -1 : 1) * 5 * bump;
      });
      s.sys.inner.style.transform = `translate(${px.toFixed(2)}px, ${py.toFixed(2)}px)`;

      // ---------- Phase 2: Twitter callback ----------
      A.show(s.p2, t, cCb + 0.3, { dy: 0, d: 0.3 });
      A.show(s.badge, t, w("callback", "twitter"), { dy: 10 });
      const tRead = w("callback", "fan-out on read"), tWrite = w("callback", "fan-out on write"), tBig = w("callback", "to fan-out");
      const tLbl = w("callback", "architecture") - 0.05;
      const dimRead = 1 - 0.45 * A.prog(t, tWrite + 0.3, 0.6);
      A.show(s.readG, t, tRead, { dy: 14, max: dimRead });
      s.rArr.forEach((a, i) => a.draw(t, tRead + 0.2 + i * 0.05, 0.5));
      s.rPk.forEach((p, i) => p.update(t + i * 0.33, A.prog(t, tRead + 0.7, 0.4)));
      A.show(s.writeG, t, tWrite, { dy: 14 });
      s.wArr.forEach((a, i) => a.draw(t, tWrite + 0.2 + i * 0.05, 0.5));
      s.wPk.forEach((p, i) => p.update(t + i * 0.33, A.prog(t, tWrite + 0.7, 0.4)));
      s.big.draw(t, tBig, 0.7);
      A.show(s.bigLbl.inner, t, tLbl, { dy: 10 });

      // ---------- Phase 3: the change, done in small steps ----------
      // The track summarizes the line, so it enters at the line start; dots turn green and words light on
      // "small", "safe", "backward", "compatible", "steps".
      A.show(s.p3, t, L3.start + 0.05, { dy: 0, d: 0.3 });
      s.base.draw(t, L3.start + 0.1, 0.8);
      const tStep = ["small", "safe", "backward", "compatible", "steps"].map((n) => w(3, n));
      // Segment i (dot i-1 → dot i) fills in the 0.35 s before dot i turns green, so the line never runs ahead of the checks.
      const lit = [1, 2, 3, 4].reduce((a, i) => a + A.prog(t, tStep[i] - 0.35, 0.35, A.E.inOutCubic), 0) / 4;
      s.dots.forEach((d, i) => {
        A.show(d.inner, t, L3.start + 0.1 + i * 0.16, { d: 0.35, dy: 0, s0: 0.4, ease: A.E.outBack });
        const p = A.prog(t, tStep[i], 0.3);
        d.ring.setAttribute("stroke", A.mix(C.line2, C.ok, p));
        d.ring.setAttribute("fill", A.mix(C.bg, C.ok, p));
        d.tick.style.opacity = p.toFixed(3);
      });
      s.prog.style.strokeDashoffset = (1 - lit).toFixed(4);
      s.prog.style.visibility = lit <= 0.001 ? "hidden" : "visible";
      A.setOpacity(s.words, 1);
      ["small", "safe", "backward", "steps"].forEach((n, i) => A.setOpacity(s.wordSpans[i], A.prog(t, w(3, n) - 0.05, 0.35)));
    },
  });
})();
