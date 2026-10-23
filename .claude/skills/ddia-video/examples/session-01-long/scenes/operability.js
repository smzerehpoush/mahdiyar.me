// S23 — Operability. A node is drained, patched and returned while traffic keeps flowing (no machine is special);
// then the four things that make that routine: visibility, automation, overridable defaults, predictable behavior.
(function () {
  const C = K.C;

  // Header pieces shared (by copy) with simplicity.js / evolvability.js: "three ideas" tracker + one-line definition card.
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
  /** state: 0 upcoming (faint), 1 active (purple), 2 done (muted); p mixes from → to. */
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

  R.scene("operability", {
    build(root, k) {
      const s = {};
      s.track = tracker(root);
      s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Operability" });
      s.def = defCard(root, { y: 236, icon: K.ICONS.gear, html: `Make life easy for the people who <span style="color:${C.mai}">keep it running</span>.` });

      const svg = K.svgLayer(root);
      // ---- Diagram: Users → Load balancer → 4 nodes.
      const CY = 600;
      s.diag = U.sv("g", {}, svg);
      s.users = K.box(s.diag, { x: 120, y: CY - 70, w: 220, h: 140, label: "Users", icon: "users" });
      s.lb = K.box(s.diag, { x: 480, y: CY - 70, w: 270, h: 140, label: "Load balancer", icon: "lb" });
      s.nodes = [0, 1, 2, 3].map((i) => K.box(s.diag, { x: 940, y: CY - 195 + i * 102, w: 320, h: 84, label: "Node " + (i + 1), icon: "server", iconInline: true, iconSize: 40 }));
      s.aUL = K.arrow(s.diag, { from: s.users.right, to: s.lb.left, gapStart: 14, gapEnd: 14 });
      s.aN = s.nodes.map((n, i) => K.arrow(s.diag, { from: [s.lb.x + s.lb.w, CY - 39 + i * 26], to: n.left, gapStart: 14, gapEnd: 14 }));
      s.pUL = K.packets(s.diag, s.aUL, { n: 3, period: 1.0 });
      s.pN = s.aN.map((a) => K.packets(s.diag, a, { n: 2, period: 1.2 }));
      s.pX = s.aN.map((a) => K.packets(s.diag, a, { n: 1, period: 1.2 })); // extra share while node 3 is out

      // Node 3 work: wrench + progress bar while patching, then a check.
      const n3 = s.nodes[2];
      s.wrench = K.svgIcon(s.diag, "wrench", { x: n3.x + n3.w - 64, y: n3.y + 20, size: 44, color: "mai", sw: 3.6 });
      s.bar = U.sv("g", {}, s.diag);
      U.sv("rect", { x: n3.x + 78, y: n3.y + n3.h - 17, width: n3.w - 150, height: 7, rx: 3.5, fill: C.line }, s.bar);
      s.barFill = U.sv("rect", { x: n3.x + 78, y: n3.y + n3.h - 17, width: 0, height: 7, rx: 3.5, fill: C.mai }, s.bar);
      s.barW = n3.w - 150;
      s.check3 = K.mark(s.diag, "check", { x: n3.x + n3.w - 40, y: n3.cy, size: 42 });

      s.pill = K.pill(root, { x: 120, y: CY + 92, text: "Users: unaffected", tone: "ok" });

      // ---- Runbook: the three steps in the narrator's words ("move its traffic away, update it, and bring it back").
      const RX = 1370;
      s.rbHdr = K.label(svg, { x: RX, y: 470, text: "Node 3 needs a patch", anchor: "start", size: 32, weight: 700, fill: "muted" });
      s.steps = ["Move traffic away", "Update it", "Bring it back"].map((w, i) => {
        const y = 540 + i * 80;
        const g = U.sv("g", { transform: `translate(${RX},${y})` }, svg);
        const inner = U.sv("g", {}, g);
        const ring = U.sv("circle", { cx: 24, cy: 0, r: 24, fill: "none", "stroke-width": 3 }, inner);
        const num = U.sv("text", { x: 24, y: 10, "text-anchor": "middle", "font-size": 27, "font-weight": 750 }, inner, String(i + 1));
        const tick = U.sv("path", { d: "M13,1 L21,9 L35,-8", fill: "none", stroke: C.bg, "stroke-width": 4.5, "stroke-linecap": "round", "stroke-linejoin": "round" }, inner);
        const lbl = U.sv("text", { x: 68, y: 12, "font-size": 36, "font-weight": 750 }, inner, w);
        return { g, inner, ring, num, tick, lbl };
      });
      s.special = K.label(svg, { x: RX, y: 812, text: "No machine is special.", anchor: "start", size: 38, weight: 800, fill: "mai" });

      // ---- Beat `chips`: what makes this routine.
      s.needs = K.text(root, { x: 120, y: 862, cls: "label", text: "It takes:", color: "muted" });
      s.chips = K.chips(root, {
        x: 270, y: 848, w: 1560, accent: "mai",
        items: [
          { text: "Visibility", icon: "eye" },
          { text: "Automation", icon: "gear" },
          { text: "Defaults you can override", icon: "wrench" },
          { text: "Predictable behavior", icon: "check" },
        ],
      });
      [s.users, s.lb, ...s.nodes].forEach((b) => fixIcon(b.icon));
      fixIcon(s.wrench.ig);
      return s;
    },

    update(t, k, s) {
      const w = (line, needle, nth) => k.word(line, needle, nth); // word anchors (whisper timings)
      const cCard = k.cue("card");

      // Header: tracker on "Three ideas", title + highlight on "operability", definition on "make life easy…".
      A.show(s.track.box, t, cCard + 0.05, { dy: 0, d: 0.5 });
      const tTitle = w("card", "operability") - 0.05;
      A.show(s.title, t, tTitle);
      const act = A.prog(t, tTitle + 0.1, 0.5);
      setTrack(s.track.items[0], 0, 1, act);
      setTrack(s.track.items[1], 0, 0, 1);
      setTrack(s.track.items[2], 0, 0, 1);
      // Names appear only once narrated: "Operability" with the title; the other two stay as numbered slots.
      s.track.nm[0].style.opacity = A.prog(t, tTitle, 0.5).toFixed(3);
      s.track.nm[1].style.opacity = s.track.nm[2].style.opacity = 0;
      A.show(s.def, t, w("card", "make life") - 0.05, { dy: 14 });

      // Diagram enters on "…keep the system running"; traffic flows from then on.
      const tDiag = w("card", "keep the system");
      A.show(s.diag, t, tDiag, { dy: 16 });
      s.aUL.draw(t, tDiag + 0.15, 0.5);
      const drawn = s.aN.map((a, i) => a.draw(t, tDiag + 0.4 + i * 0.06, 0.5));
      const flow = A.prog(t, tDiag + 0.8, 0.4);

      // Drain line beats, each on its spoken words: "a node needs a patch", "move its traffic away", "update it",
      // "bring it back", "No machine is special".
      const tSel = w("drain", "node"), tDrain = w("drain", "move"), tPatch = w("drain", "update"), tRet = w("drain", "bring");
      const tBack = w("drain", "back"), tSpecial = w("drain", "no machine"), tMachine = w("drain", "machine");
      const drainP = A.prog(t, tDrain, 0.5), retP = A.prog(t, tRet, 0.5);
      const out3 = drainP * (1 - retP); // 1 while node 3 is out of rotation

      // Node 3 tone chain: neutral → mai (selected) → dark (drained) → mai (patching) → ok (back) → neutral ("no machine…").
      const chain = [[tSel, "mai", 0.4], [tDrain, "dark", 0.5], [tPatch, "mai", 0.3], [tRet, "ok", 0.4], [tMachine, "neutral", 0.8]];
      let from = "neutral", cur = "neutral", p = 1;
      for (const [t0, tone, d] of chain) if (t >= t0) { from = cur; cur = tone; p = A.prog(t, t0, d); }
      s.nodes[2].setTone(cur, p, from);
      [0, 1, 3].forEach((i) => s.nodes[i].setTone("neutral"));

      s.aN[2].setOpacity(drawn[2] > 0.001 ? 1 - 0.8 * out3 : 0); // keep undrawn arrow hidden (setOpacity re-shows it)
      s.pUL.update(t, flow);
      s.pN.forEach((pk, i) => pk.update(t + i * 0.37, flow * (i === 2 ? 1 - out3 : 1)));
      s.pX.forEach((pk, i) => pk.update(t + i * 0.37 + 0.6, i === 2 ? 0 : flow * out3)); // others absorb node 3's share

      // Patch: wrench wobble + progress bar; then a check that stays.
      const wr = A.prog(t, tPatch, 0.25) * (1 - A.prog(t, tRet, 0.3));
      A.setOpacity(s.wrench.g, wr);
      s.wrench.inner.style.transform = `rotate(${(16 * Math.sin((t - tPatch) * 2 * Math.PI * 1.5)).toFixed(2)}deg)`;
      A.setOpacity(s.bar, wr);
      s.barFill.setAttribute("width", (s.barW * A.prog(t, tPatch + 0.1, Math.max(0.2, tRet - tPatch - 0.15), A.E.inOutSine)).toFixed(1));
      A.show(s.check3.inner, t, tRet + 0.25, { d: 0.45, dy: 0, s0: 0.3, ease: A.E.outBack });

      A.show(s.pill, t, tDrain + 0.3, { dy: 10 });

      // Runbook: header on "a node needs a patch", each step lights as it is narrated, then gets a check.
      A.show(s.rbHdr.inner, t, tSel, { dy: 10 });
      const tStep = [tDrain, tPatch, tRet], tDone = [tPatch, tRet, tBack + 0.2];
      s.steps.forEach((st, i) => {
        A.show(st.inner, t, tStep[i], { dy: 10, d: 0.45 });
        const done = A.prog(t, tDone[i], 0.3);
        st.ring.setAttribute("stroke", A.mix(C.mai, C.ok, done));
        st.ring.setAttribute("fill", done > 0.5 ? C.ok : "none");
        st.num.setAttribute("fill", C.mai);
        st.num.style.opacity = (1 - done).toFixed(3);
        st.tick.style.opacity = done.toFixed(3);
        st.lbl.setAttribute("fill", A.mix(C.ink, C.muted, done * 0.35));
      });
      A.show(s.special.inner, t, tSpecial, { dy: 12 });

      // Chips, each on its spoken word ("It takes:" summarizes the line, so it lands at the line start).
      A.show(s.needs, t, k.cue("chips"), { dy: 10 });
      [w("chips", "visibility"), w("chips", "automation"), w("chips", "defaults"), w("chips", "predictable")]
        .forEach((t0, i) => A.show(s.chips.chips[i], t, t0 - 0.05, { dy: 14, d: 0.5 }));
    },
  });
})();
