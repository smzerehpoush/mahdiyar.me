// S24 — Simplicity. Three phases in one content area under a persistent header:
//  1. big ball of mud → accidental complexity (the tangle turns red; only a short "problem" path is essential)
//  2. good abstraction: a SQL query on top, a curtain drops over storage / concurrency / crash recovery
//  3. example: cache-invalidation snippets scattered across modules move into one module.
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
  const hdr = (parent, text, fill) => K.label(parent, { x: 120, y: 424, text, anchor: "start", size: 34, weight: 750, fill });

  R.scene("simplicity", {
    build(root, k) {
      const s = {};
      s.track = tracker(root);
      s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Simplicity" });
      s.def = defCard(root, { y: 236, icon: K.ICONS.eye, html: `Make the system <span style="color:${C.mai}">easy to understand</span>.` });
      const svg = K.svgLayer(root);

      // ================= Phase 1: big ball of mud =================
      s.p1 = U.sv("g", {}, svg);
      s.h1 = hdr(s.p1, "Big ball of mud", "bad");
      const rnd = U.rng(2417);
      const COLS = [210, 430, 650, 870], ROWS = [488, 614, 740, 862];
      s.pts = [];
      ROWS.forEach((y, r) => COLS.forEach((x, c) => s.pts.push([x + (rnd() - 0.5) * 90 + (r % 2 ? 30 : -20), y + (rnd() - 0.5) * 44])));
      const ESS = [4, 5, 10, 11]; // a short essential path through the middle
      const essPairs = [[4, 5], [5, 10], [10, 11]];
      const key = (a, b) => (a < b ? a + "-" + b : b + "-" + a);
      const seen = new Set(essPairs.map(([a, b]) => key(a, b)));
      const pairs = [];
      for (let i = 0; i < 16; i++) {
        const m = 2 + Math.floor(rnd() * 2);
        for (let j = 0; j < m; j++) {
          const b = Math.floor(rnd() * 16);
          if (b === i || seen.has(key(i, b))) continue;
          seen.add(key(i, b)); pairs.push([i, b]);
        }
      }
      s.edgeG = U.sv("g", {}, s.p1);
      s.edges = pairs.map(([a, b], i) => ({
        ess: false, i,
        arr: K.arrow(s.edgeG, { from: s.pts[a], to: s.pts[b], curve: (rnd() - 0.5) * 260, head: false, width: 3, tone: C.faint }),
      }));
      s.ess = essPairs.map(([a, b]) => ({ arr: K.arrow(s.edgeG, { from: s.pts[a], to: s.pts[b], curve: 8, head: false, width: 3, tone: C.faint }) }));
      s.nodeG = U.sv("g", {}, s.p1);
      s.nodes = s.pts.map(([x, y], i) => {
        const g = U.sv("g", { transform: `translate(${x - 35},${y - 21})` }, s.nodeG);
        const inner = U.sv("g", {}, g);
        const rect = U.sv("rect", { x: 0, y: 0, width: 70, height: 42, rx: 10, fill: C.surface, stroke: C.line2, "stroke-width": 3 }, inner);
        return { g, inner, rect, ess: ESS.includes(i) };
      });
      // "special cases": warning markers on a few tangled edges.
      s.marks = [2, 7, 12, 17, 23].filter((i) => i < s.edges.length).map((i) => {
        const [x, y] = s.edges[i].arr.point(0.5);
        const ic = K.svgIcon(s.p1, "warning", { x: x - 17, y: y - 17, size: 34, color: "hl", sw: 4 });
        fixIcon(ic.ig);
        return ic;
      });

      // Accidental-complexity definition + colour legend (matches the graph).
      s.acc = K.card(root, { x: 1080, y: 456, w: 720, accent: "bad", title: "Accidental complexity",
        body: `Comes from <b style="color:${C.ink}">how we built it</b>, not from the problem it solves.` });
      s.leg = U.sv("g", {}, svg);
      s.legRed = U.sv("g", {}, s.leg);
      U.sv("path", { d: "M1092,766 q30,-26 60,0", fill: "none", stroke: C.bad, "stroke-width": 4, "stroke-linecap": "round" }, s.legRed);
      K.label(s.legRed, { x: 1176, y: 770, text: "How we built it: accidental", anchor: "start", size: 30, weight: 650, fill: "ink" });
      s.legInk = U.sv("g", {}, s.leg);
      U.sv("path", { d: "M1092,836 h60", fill: "none", stroke: C.ink, "stroke-width": 6, "stroke-linecap": "round" }, s.legInk);
      K.label(s.legInk, { x: 1176, y: 846, text: "The problem itself", anchor: "start", size: 30, weight: 650, fill: "ink" });

      // ================= Phase 2: SQL on top, a curtain over the layers below =================
      s.p2 = U.sv("g", {}, svg);
      s.h2 = hdr(s.p2, "Good abstractions", "mai");
      // "…remove it": the suffix names what "it" is (phase 1's accidental complexity) and fades in on "remove".
      s.h2rm = [U.sv("tspan", { fill: C.ink }, s.h2.t, " remove "), U.sv("tspan", { fill: C.bad }, s.h2.t, "accidental complexity")];
      s.sqlBox = K.box(s.p2, { x: 120, y: 456, w: 1000, h: 104, label: "", tone: "mai" });
      s.ann1 = U.sv("g", {}, s.p2);
      s.ann1Arr = K.arrow(s.ann1, { from: [1240, 508], to: [1140, 508], tone: "mai" });
      K.label(s.ann1, { x: 1262, y: 520, text: "Say which data you want", anchor: "start", size: 36, weight: 750, fill: "ink" });
      s.rod = U.sv("g", {}, s.p2);
      U.sv("path", { d: "M106,594 H1134", stroke: C.mai, "stroke-width": 8, "stroke-linecap": "round" }, s.rod);
      U.sv("circle", { cx: 106, cy: 594, r: 11, fill: C.mai }, s.rod);
      U.sv("circle", { cx: 1134, cy: 594, r: 11, fill: C.mai }, s.rod);
      s.layers = [["Storage on disk", "disk"], ["Concurrent clients", "users"], ["Crash recovery", "undo"]].map(([label, icon], i) =>
        K.box(s.p2, { x: 140, y: 618 + i * 90, w: 960, h: 76, label, icon, iconInline: true, iconSize: 40, fs: 32 }));
      // Curtain (drops from the rod): translucent panel with folds and a hem.
      s.curtain = U.sv("g", {}, s.p2);
      U.sv("rect", { x: 112, y: 600, width: 1016, height: 292, fill: C.surface2, opacity: 0.84 }, s.curtain);
      for (let x = 136; x < 1120; x += 46) U.sv("path", { d: `M${x},600 V892`, stroke: C.mai, "stroke-width": 14, opacity: 0.09 }, s.curtain);
      let hem = "M112,892";
      for (let x = 112; x + 46 <= 1128; x += 46) hem += ` q11.5,10 23,0 q11.5,-10 23,0`;
      U.sv("path", { d: hem, fill: "none", stroke: C.mai, "stroke-width": 3, opacity: 0.6 }, s.curtain);
      s.curtain.style.transformOrigin = "top";
      s.p2.appendChild(s.rod); // rod in front of the curtain
      s.ann2 = U.sv("g", {}, s.p2);
      U.sv("path", { d: "M1158,618 h22 V874 h-22", fill: "none", stroke: C.mai, "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round" }, s.ann2);
      K.label(s.ann2, { x: 1212, y: 758, text: "Hidden underneath", anchor: "start", size: 36, weight: 750, fill: "ink" });
      // The query itself is HTML so it can use the mono font (SVG text is forced to the display font by tokens.css).
      s.sql = K.text(root, { x: 156, y: 484, cls: "mono", html: `<span style="color:${C.mai}">SELECT</span> * <span style="color:${C.mai}">FROM</span> orders <span style="color:${C.mai}">WHERE</span> customer_id = 42` });
      Object.assign(s.sql.style, { fontSize: "36px", whiteSpace: "nowrap", lineHeight: "1.3" });

      // ================= Phase 3: scattered cache invalidation → one module =================
      s.p3 = U.sv("g", {}, svg);
      s.h3 = hdr(s.p3, "In our example", "ink");
      const MY = (i) => 456 + i * 104, MH = 86, MW = 640, SW = 236;
      s.mods = ["Order writes", "Profile writes", "Background workers", "Admin scripts"].map((label, i) =>
        K.box(s.p3, { x: 120, y: MY(i), w: MW, h: MH, label, icon: "file", iconInline: true, iconSize: 36, fs: 29 }));
      s.cache = K.box(s.p3, { x: 1500, y: 592, w: 300, h: 124, label: "Cache", icon: "cache" });
      s.target = K.box(s.p3, { x: 1040, y: 604, w: 360, h: 100, label: "Cache invalidation", fs: 30, tone: "ghost" });
      s.oldArr = s.mods.map((m, i) => K.arrow(s.p3, { from: [120 + MW - 14, MY(i) + MH / 2], to: s.cache.left, gapStart: 4, gapEnd: 14, tone: "bad", width: 3 }));
      s.newArr = s.mods.map((m) => K.arrow(s.p3, { from: m.right, to: s.target.left, gapStart: 12, gapEnd: 14, tone: "mai", width: 3 }));
      s.tcArr = K.arrow(s.p3, { from: s.target.right, to: s.cache.left, gapStart: 10, gapEnd: 14, tone: "mai", width: 4 });
      s.snips = s.mods.map((m, i) => {
        const x = 120 + MW - 14 - SW, y = MY(i) + 17;
        const g = U.sv("g", { transform: `translate(${x},${y})` }, s.p3);
        const inner = U.sv("g", {}, g);
        const rect = U.sv("rect", { x: 0, y: 0, width: SW, height: 52, rx: 12, fill: K.TONES.bad.fill, stroke: C.bad, "stroke-width": 2.5 }, inner);
        U.sv("text", { x: SW / 2, y: 35, "text-anchor": "middle", "font-size": 26, "font-weight": 650, fill: C.ink }, inner, "invalidate cache");
        return { g, inner, rect, dx: 1040 + 180 - SW / 2 - x, dy: 654 - 26 - y };
      });
      [...s.layers, ...s.mods, s.cache].forEach((b) => fixIcon(b.icon));
      return s;
    },

    update(t, k, s) {
      const w = (line, needle, nth) => k.word(line, needle, nth); // word anchors (whisper timings)
      const cSql = k.cue("sql");

      // Header.
      const tTitle = w("card", "simplicity") - 0.05;
      A.show(s.title, t, tTitle);
      A.setOpacity(s.track.box, 1);
      setTrack(s.track.items[0], 2, 2, 1);
      setTrack(s.track.items[1], 0, 1, A.prog(t, tTitle + 0.2, 0.5));
      setTrack(s.track.items[2], 0, 0, 1);
      // "Simplicity" is revealed with the title (not during the crossfade); "Evolvability" is not named until the next scene.
      s.track.nm[0].style.opacity = 1;
      s.track.nm[1].style.opacity = A.prog(t, tTitle, 0.5).toFixed(3);
      s.track.nm[2].style.opacity = 0;
      A.show(s.def, t, w("card", "make the system") - 0.05, { dy: 14 });

      // ---------- Phase 1 ----------
      // Boxes pop on "big ball", the tangle draws from "mud" through "tangles", warnings on "special cases".
      const out1 = cSql - 0.5;
      const tBig = w("mud", "big ball");
      A.show(s.p1, t, tBig - 0.05, { dy: 0, d: 0.3, out: out1, outD: 0.45 });
      A.show(s.h1.inner, t, tBig, { dy: 10 });
      s.nodes.forEach((n, i) => A.show(n.inner, t, tBig + 0.05 + i * 0.035, { d: 0.4, dy: 0, s0: 0.5, ease: A.E.outBack }));
      const tEdge = w("mud", "mud"), nE = s.edges.length;
      // Red on "how we built", the essential path + its legend on "the problem".
      const tRed = w("accidental", "how we built"), tEss = w("accidental", "the problem");
      const red = A.prog(t, tRed, 0.6), ess = A.prog(t, tEss, 0.5);
      s.edges.forEach((e, i) => {
        e.arr.draw(t, tEdge + (i / nE) * 1.7, 0.5);
        e.arr.setTone(A.mix(C.faint, C.bad, red));
        e.arr.path.setAttribute("stroke-opacity", (1 - 0.25 * red).toFixed(3));
      });
      s.ess.forEach((e, i) => {
        e.arr.draw(t, tEdge + 0.3 + i * 0.5, 0.5);
        e.arr.setTone(A.mix(C.faint, C.ink, ess));
        e.arr.path.setAttribute("stroke-width", (3 + 3 * ess).toFixed(2));
      });
      s.nodes.forEach((n) => {
        n.rect.setAttribute("stroke", n.ess ? A.mix(C.line2, C.ink, ess) : C.line2);
        n.rect.setAttribute("stroke-width", n.ess ? (3 + 1.5 * ess).toFixed(2) : 3);
      });
      const tSpecial = w("mud", "special cases");
      s.marks.forEach((m, i) => A.show(m.inner, t, tSpecial + i * 0.09, { d: 0.4, dy: 0, s0: 0.3, ease: A.E.outBack }));
      A.show(s.acc, t, w("accidental", "accidental") - 0.05, { dy: 14, out: out1, outD: 0.45 });
      A.show(s.legRed, t, tRed, { dy: 10 });
      A.show(s.legInk, t, tEss, { dy: 10 });
      A.show(s.leg, t, tRed - 0.1, { dy: 0, d: 0.1, out: out1, outD: 0.45 });

      // ---------- Phase 2 ----------
      // Narration order: "Good abstractions" → "remove it" → "With SQL" (query types) → "say which data you want" →
      // "Storage on disk", "concurrent clients", "crash recovery" (layers, one per item) → "stay hidden underneath" (curtain).
      // Phase 3's header lands just after "In our example", so phase 2 clears in the pause after the hidden line.
      const t3 = w("example", "example") + 0.15, out2 = t3 - 0.45;
      A.show(s.p2, t, cSql, { dy: 0, d: 0.3, out: out2, outD: 0.45 });
      A.show(s.h2.inner, t, w("sql", "good abstractions"), { dy: 10 });
      const rm = A.prog(t, w("sql", "remove") - 0.05, 0.5);
      s.h2rm.forEach((ts) => ts.setAttribute("fill-opacity", rm.toFixed(3)));
      const tSql = w("sql", "SQL");
      A.show(s.sqlBox.inner, t, tSql - 0.05, { dy: 12, d: 0.5 });
      const typed = A.prog(t, tSql + 0.1, 1.0, A.E.linear);
      A.show(s.sql, t, tSql + 0.05, { dy: 0, d: 0.15, out: out2, outD: 0.45 });
      s.sql.style.clipPath = `inset(-10px ${((1 - typed) * 100).toFixed(2)}% -10px 0)`;
      const tAnn = w("sql", "say");
      A.show(s.ann1, t, tAnn, { dx: 16, dy: 0 });
      s.ann1Arr.draw(t, tAnn, 0.4);
      A.show(s.rod, t, k.cue("hidden"), { dy: 0, d: 0.4 });
      [w("hidden", "storage"), w("hidden", "concurrent"), w("hidden", "crash")]
        .forEach((t0, i) => A.show(s.layers[i].inner, t, t0, { dy: 14, d: 0.5 }));
      const tCur = w("hidden", "stay hidden");
      const drop = A.prog(t, tCur, 0.8, A.E.inOutCubic);
      s.curtain.style.transform = `scaleY(${drop.toFixed(4)})`;
      A.setOpacity(s.curtain, drop > 0.001 ? 1 : 0);
      s.layers.forEach((l) => { l.g.style.opacity = (1 - 0.45 * drop).toFixed(3); });
      A.show(s.ann2, t, w("hidden", "hidden"), { dx: 16, dy: 0 });

      // ---------- Phase 3 ----------
      // Word beats: header + modules on "In our example"; snippets on "scattered"; cache, red wires and a pulse on
      // "cache-invalidation"; the one module on "code"; the move starts just before "into" and lands on "one module".
      const tOld = w("example", "scattered"), tPulse = w("example", "cache");
      const tTarget = w("example", "code"), tFly = w("example", "into") - 0.25, tSolid = tFly + 0.68, tNew = tSolid + 0.05;
      A.show(s.p3, t, t3, { dy: 0, d: 0.3 });
      A.show(s.h3.inner, t, t3, { dy: 10 });
      s.mods.forEach((m, i) => A.show(m.inner, t, t3 + 0.05 + i * 0.1, { dy: 14, d: 0.5 }));
      A.show(s.cache.inner, t, tPulse - 0.05, { dy: 14, d: 0.5 });
      const oldOut = A.prog(t, tTarget - 0.1, 0.45); // scattered links fade as the one module appears
      // (setOpacity re-shows the group, so keep an undrawn arrow at 0: otherwise its round cap leaves a dot.)
      s.oldArr.forEach((a, i) => { const dp = a.draw(t, tPulse + i * 0.08, 0.6); a.setOpacity(dp > 0.001 ? 1 - oldOut : 0); });
      A.show(s.target.inner, t, tTarget, { dy: 0, d: 0.4, s0: 0.92 });
      s.target.setTone("mai", A.prog(t, tSolid, 0.4), "ghost");
      // The slot is unlabeled while snippets fly in (their text would sit on its label); the name appears once they have
      // merged, on "…one module".
      s.target.label.style.opacity = A.prog(t, tFly + 0.72, 0.4).toFixed(3);
      s.snips.forEach((sn, i) => {
        // Fade completes before the snippet reaches the module, so its text never sits on the module's label.
        A.setOpacity(sn.g, A.prog(t, tOld + i * 0.08, 0.4) * (1 - A.prog(t, tFly + 0.3 + i * 0.07, 0.3)));
        const pulse = Math.sin(Math.PI * U.clamp((t - tPulse - i * 0.1) / 0.5));
        const f = A.prog(t, tFly + i * 0.07, 0.75, A.E.inOutCubic);
        const sc = (1 + 0.08 * pulse) * (1 - 0.35 * f);
        sn.inner.style.transform = `translate(${(sn.dx * f).toFixed(1)}px, ${(sn.dy * f).toFixed(1)}px) scale(${sc.toFixed(4)})`;
        sn.rect.setAttribute("stroke-width", (2.5 + 2 * pulse).toFixed(2));
      });
      s.newArr.forEach((a, i) => a.draw(t, tNew + i * 0.04, 0.35));
      s.tcArr.draw(t, tNew + 0.15, 0.35);
    },
  });
})();
