// Short S2 — fan-out on read: opening your timeline looks up everyone you follow, then merges their tweets by time.
// "One read fans out into many lookups" names it; "struggled to keep up" turns the read path red.
(() => {
  const C = K.C;
  const XS = [90, 300, 510, 720], BW = 190, GY = 720, GH = 214, FY = 798, FH = 112; // group container + boxes

  // A followed account: user icon + a few bars for their tweets (the top bar lights up when merged).
  function account(svg, x, y) {
    const b = K.box(svg, { x, y, w: BW, h: FH, label: "" });
    K.svgIcon(b.inner, "user", { x: 16, y: FH / 2 - 22, size: 44, color: "muted" });
    const bars = [0.9, 0.62, 0.78].map((f, i) => U.sv("rect", { x: 74, y: 25 + i * 26, width: (BW - 92) * f, height: 12, rx: 6, fill: C.line2 }, b.inner));
    return Object.assign(b, { bars });
  }

  R.scene("onread", {
    build(root, k) {
      const s = {};
      s.badge = K.badge(root, { x: 80, y: 236, text: "Twitter, circa 2012" });
      s.badge.style.fontSize = "36px";
      s.title = K.text(root, { x: 80, y: 316, w: 840, cls: "h2", html: "Build it <span style='color:" + C.orange + "'>when you read</span>" });
      s.title.style.fontSize = "84px";

      const svg = K.svgLayer(root);
      s.you = K.box(svg, { x: 380, y: 480, w: 240, h: 120, label: "You", icon: "user", iconInline: true, iconSize: 50, fs: 44 });
      // "Everyone you follow": a group container whose header sits inside it, clear of the arrows.
      s.grp = U.sv("g", {}, svg);
      U.sv("rect", { x: 70, y: GY, width: 860, height: GH, rx: 24, fill: C.bg2, stroke: C.line2, "stroke-width": 2 }, s.grp);
      K.label(s.grp, { x: 500, y: GY + 50, text: "Everyone you follow", size: 38, weight: 650, fill: "muted" });
      s.fol = XS.map((x) => account(svg, x, FY));
      s.merge = K.box(svg, { x: 300, y: 1064, w: 400, h: 124, label: "Merge by time", icon: "clock", iconInline: true, iconSize: 48, fs: 42 });

      s.out = s.fol.map((b) => K.arrow(svg, { from: s.you.bottom, to: [b.cx, GY], gapStart: 10, gapEnd: 6, width: 4 }));
      s.inn = s.fol.map((b) => K.arrow(svg, { from: [b.cx, GY + GH], to: s.merge.top, gapStart: 6, gapEnd: 12, width: 4 }));
      s.reqP = s.out.map((a) => K.packets(svg, a, { n: 2, period: 1.1, r: 10, tone: "hl" }));
      s.twP = s.inn.map((a) => K.packets(svg, a, { n: 1, period: 1.1, r: 10, tone: "orange" }));

      s.defWrap = U.el("div", { style: { position: "absolute", left: "80px", top: "1236px", width: "840px", display: "flex", justifyContent: "center" } }, root);
      s.def = K.chip(s.defWrap, { text: "Fan-out: 1 read → many lookups", accent: "orange", size: 42 });
      Object.assign(s.def.style, { position: "relative", background: C.bg2 });

      s.pillWrap = U.el("div", { style: { position: "absolute", left: "80px", top: "1352px", width: "840px", display: "flex", justifyContent: "center" } }, root);
      s.pill = K.pill(s.pillWrap, { x: 0, y: 0, text: "Struggled to keep up", tone: "bad" });
      Object.assign(s.pill.style, { position: "relative", left: "auto", top: "auto", fontSize: "42px" });
      return s;
    },

    update(t, k, s) {
      A.show(s.badge, t, -1);                       // pinned across the Twitter scenes
      A.show(s.title, t, 0.3);                      // section heading: lands with the scene

      // `onread`: "when you open your timeline" → You; "look up everyone you follow" → the fan of lookups; "merge" → merge.
      const wOpen = k.word("onread", "open"), wLook = k.word("onread", "look"), wEvery = k.word("onread", "everyone"), wMerge = k.word("onread", "merge");
      A.show(s.you.inner, t, wOpen - 0.1, { dy: 14 });
      s.out.forEach((a, i) => a.draw(t, wLook + i * 0.06, 0.5));
      A.show(s.grp, t, wEvery - 0.1, { dy: 10 });
      s.fol.forEach((b, i) => A.show(b.inner, t, wEvery + i * 0.08, { dy: 14 }));
      A.show(s.merge.inner, t, wMerge - 0.05, { dy: 14 });
      s.inn.forEach((a, i) => a.draw(t, wMerge + i * 0.06, 0.5));

      // `slow`: "One read fans out into many lookups" → busier request traffic + the definition chip;
      // "struggled to keep up" → the read path turns red.
      const wFans = k.word("slow", "fans out"), wMany = k.word("slow", "many"), wStr = k.word("slow", "struggled");
      const busy = A.prog(t, wFans, 0.4);
      const cost = A.prog(t, wStr - 0.05, 0.5);
      s.you.setTone("hl", A.win(t, k.cue("slow") - 0.05, wStr - 0.1, 0.3));
      s.out.concat(s.inn).forEach((a) => a.setTone(A.mix(C.line2, C.bad, cost)));
      s.reqP.forEach((p, i) => p.update(t * (1 + busy) - wLook - i * 0.07, A.prog(t, wLook + 0.45, 0.2), { tone: A.mix(C.hl, C.bad, cost) }));
      s.twP.forEach((p, i) => p.update(t - wMerge - i * 0.07, A.prog(t, wMerge + 0.45, 0.2)));
      s.fol.forEach((b) => b.setTone("orange", 0.6 * A.win(t, wMany - 0.05, wStr, 0.3)));
      s.fol.forEach((b) => b.bars[0].setAttribute("fill", A.mix(C.line2, C.orange, A.prog(t, wMerge + 0.2, 0.4))));  // their tweets are fetched
      s.merge.setTone("bad", cost);
      A.show(s.def, t, wFans - 0.1, { dy: 12 });
      A.show(s.pill, t, wStr, { dy: 12 });
    },
  });
})();
