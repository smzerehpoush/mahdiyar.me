// Short S3 — fan-out on write: each new tweet is copied into every follower's cached timeline, so reading is one cheap lookup.
(() => {
  const C = K.C;
  const XS = [90, 300, 510, 720], BW = 190, GY = 720, GH = 214, FY = 798, FH = 112; // group container + boxes

  // A follower's cached timeline: a box with a user icon and three entry bars (the top one is the copied tweet).
  function mailbox(svg, x, y) {
    const b = K.box(svg, { x, y, w: BW, h: FH, label: "" });
    K.svgIcon(b.inner, "user", { x: 16, y: FH / 2 - 22, size: 44, color: "muted" });
    const bars = [0.9, 0.62, 0.78].map((f, i) => U.sv("rect", { x: 74, y: 25 + i * 26, width: (BW - 92) * f, height: 12, rx: 6, fill: C.line2 }, b.inner));
    return Object.assign(b, { bars });
  }

  R.scene("onwrite", {
    build(root, k) {
      const s = {};
      s.badge = K.badge(root, { x: 80, y: 236, text: "Twitter, circa 2012" });
      s.badge.style.fontSize = "36px";
      s.title = K.text(root, { x: 80, y: 316, w: 840, cls: "h2", html: "Flip it: <span style='color:" + C.orange + "'>copy on write</span>" });
      s.title.style.fontSize = "84px";

      const svg = K.svgLayer(root);
      s.tw = K.box(svg, { x: 325, y: 480, w: 350, h: 120, label: "New tweet", icon: "tweet", iconInline: true, iconSize: 50, fs: 44, tone: "orange" });
      s.grp = U.sv("g", {}, svg);
      U.sv("rect", { x: 70, y: GY, width: 860, height: GH, rx: 24, fill: C.bg2, stroke: C.line2, "stroke-width": 2 }, s.grp);
      K.label(s.grp, { x: 500, y: GY + 50, text: "Each follower's cached timeline", size: 38, weight: 650, fill: "muted" });
      s.mb = XS.map((x) => mailbox(svg, x, FY));
      s.arr = s.mb.map((b) => K.arrow(svg, { from: s.tw.bottom, to: [b.cx, GY], gapStart: 10, gapEnd: 6, width: 4, tone: "orange" }));
      s.pk = s.arr.map((a) => K.packets(svg, a, { n: 1, period: 1.3, r: 11, tone: "orange" }));

      // The reader is one of the followers: one short hop from their own cached timeline.
      const mine = s.mb[1];
      s.you = K.box(svg, { x: mine.cx - 110, y: 1064, w: 220, h: 116, label: "You", icon: "user", iconInline: true, iconSize: 46, fs: 42 });
      s.look = K.arrow(svg, { from: [mine.cx, GY + GH], to: s.you.top, gapStart: 6, gapEnd: 12, width: 5, tone: "ok" });
      s.lookP = K.packets(svg, s.look, { n: 1, period: 0.9, r: 10, tone: "ok" });
      s.lookLbl = K.label(svg, { x: mine.cx + 140, y: 1136, text: "1 lookup", size: 44, weight: 750, fill: "ok", anchor: "start" });

      s.pillWrap = U.el("div", { style: { position: "absolute", left: "80px", top: "1270px", width: "840px", display: "flex", justifyContent: "center" } }, root);
      s.pill = K.pill(s.pillWrap, { x: 0, y: 0, text: "Reads became cheap", tone: "ok" });
      Object.assign(s.pill.style, { position: "relative", left: "auto", top: "auto", fontSize: "42px" });
      return s;
    },

    update(t, k, s) {
      A.show(s.badge, t, -1);
      A.show(s.title, t, k.word("onwrite", "flipped") - 0.1);

      // "Each new tweet" → the tweet; "is copied into" → copies fly; "every follower's cached timeline" → the mailboxes.
      const wNew = k.word("onwrite", "new"), wCopy = k.word("onwrite", "copied"), wEvery = k.word("onwrite", "every"), wCached = k.word("onwrite", "cached");
      A.show(s.tw.inner, t, wNew - 0.1, { dy: 14 });
      s.mb.forEach((b, i) => A.show(b.inner, t, wCopy + 0.05 + i * 0.07, { dy: 14 }));
      A.show(s.grp, t, wEvery - 0.1, { dy: 10 });
      s.arr.forEach((a, i) => a.draw(t, wCopy + i * 0.06, 0.5));
      const arrive = wCopy + 0.35 + 1.3 * 0.9;     // first packet reaches the boxes
      s.pk.forEach((p) => p.update(t - wCopy - 0.35, A.prog(t, wCopy + 0.35, 0.2)));
      s.mb.forEach((b) => b.bars[0].setAttribute("fill", A.mix(C.line2, C.orange, A.prog(t, Math.min(arrive, wCached + 0.2), 0.3))));

      // `cheap`: "Reading becomes one cheap lookup."
      const cC = k.cue("cheap"), wCheap = k.word("cheap", "cheap"), wLook = k.word("cheap", "look-up");
      A.show(s.you.inner, t, cC, { dy: 14 });
      s.look.draw(t, cC + 0.2, 0.4);
      s.lookP.update(t - cC - 0.5, A.prog(t, cC + 0.5, 0.2));
      s.you.setTone("ok", A.prog(t, wCheap, 0.4));
      A.show(s.lookLbl.inner, t, wLook - 0.05, { dy: 0, dx: -12 });
      A.show(s.pill, t, wCheap - 0.05, { dy: 12 });
    },
  });
})();
