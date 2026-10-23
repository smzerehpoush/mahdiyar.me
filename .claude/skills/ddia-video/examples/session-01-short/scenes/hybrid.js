// Short S5 — the hybrid: most users' tweets are copied on write into cached timelines; celebrity tweets are fetched on read;
// both are merged by time into your timeline.
(() => {
  const C = K.C;

  R.scene("hybrid", {
    build(root, k) {
      const s = {};
      s.badge = K.badge(root, { x: 80, y: 236, text: "Twitter, circa 2012" });
      s.badge.style.fontSize = "36px";
      s.title = K.text(root, { x: 80, y: 316, w: 840, cls: "h2", html: "The fix: <span style='color:" + C.hl + "'>a hybrid</span>" });
      s.titleB = s.title.querySelector("span");
      s.title.style.fontSize = "84px";

      const svg = K.svgLayer(root);
      // Left lane: most users → copied on write → cached timelines.
      s.most = K.box(svg, { x: 80, y: 470, w: 400, h: 120, label: "Most users", icon: "users", iconInline: true, iconSize: 50, fs: 42 });
      s.cache = K.box(svg, { x: 80, y: 730, w: 400, h: 120, label: "Cached timelines", icon: "layers", iconInline: true, iconSize: 42, fs: 35 });
      s.aL = K.arrow(svg, { from: s.most.bottom, to: s.cache.top, gapStart: 10, gapEnd: 10, width: 5, tone: "orange" });
      s.pL = K.packets(svg, s.aL, { n: 2, period: 1.0, r: 10, tone: "orange" });
      s.lL = K.label(svg, { x: 304, y: 652, text: "copied", size: 36, weight: 750, fill: "orange", anchor: "start" });
      K.label(s.lL.inner, { x: 0, y: 42, text: "on write", size: 36, weight: 750, fill: "orange", anchor: "start" });
      // Right lane: celebrities → fetched on read.
      s.cel = K.box(svg, { x: 520, y: 470, w: 400, h: 120, label: "Celebrities", icon: "star", iconInline: true, iconSize: 50, fs: 42, tone: "hl" });
      s.ctw = K.box(svg, { x: 520, y: 730, w: 400, h: 120, label: "Their tweets", icon: "database", iconInline: true, iconSize: 42, fs: 35 });
      s.aR = K.arrow(svg, { from: s.cel.bottom, to: s.ctw.top, gapStart: 10, gapEnd: 10, width: 5, tone: "hl", dashed: true });
      s.lR = K.label(svg, { x: 744, y: 652, text: "fetched", size: 36, weight: 750, fill: "hl", anchor: "start" });
      K.label(s.lR.inner, { x: 0, y: 42, text: "on read", size: 36, weight: 750, fill: "hl", anchor: "start" });
      // Merge into your timeline.
      s.mL = K.arrow(svg, { from: [280, 862], via: [[280, 905], [440, 905]], to: [440, 958], width: 4, tone: "orange" });
      s.mR = K.arrow(svg, { from: [720, 862], via: [[720, 905], [560, 905]], to: [560, 958], width: 4, tone: "hl" });

      s.panel = K.card(root, { x: 180, y: 966, w: 640, title: "Your timeline" });
      s.panel.style.padding = "22px 26px 26px";
      s.panel.querySelector(".k-card-title").style.fontSize = "42px";
      const items = [{ who: "Celebrity", at: "12:05", cel: true }, { who: "Friend", at: "12:04" }, { who: "Colleague", at: "12:02" }, { who: "Celebrity", at: "11:58", cel: true }];
      s.rows = items.map((it) => {
        const col = it.cel ? C.hl : C.orange;
        const r = U.el("div", { style: { position: "relative", display: "flex", alignItems: "center", gap: "16px", height: "70px", marginTop: "14px",
          padding: "0 20px 0 16px", borderRadius: "16px", background: C.surface2, borderLeft: `7px solid ${col}` } }, s.panel);
        U.el("div", { html: K.iconSvg(it.cel ? "star" : "user", 38, col, 4), style: { width: "38px", height: "38px", flex: "none" } }, r);
        U.el("div", { style: { fontSize: "38px", fontWeight: 700, color: C.ink, flex: "1" } }, r, it.who);
        U.el("div", { style: { fontSize: "34px", fontWeight: 600, color: C.muted, fontFamily: "var(--mono)" } }, r, it.at);
        return r;
      });
      return s;
    },

    update(t, k, s) {
      A.show(s.badge, t, -1);
      A.show(s.title, t, 0.3);                                   // heading lands with the scene; "a hybrid" on the word
      s.titleB.style.opacity = A.prog(t, k.word("hybrid", "hybrid") - 0.15, 0.4).toFixed(3);

      // `most`: "Most tweets are still copied when they're posted."
      const wMost = k.word("most", "Most"), wCopied = k.word("most", "copied"), wPosted = k.word("most", "posted");
      A.show(s.most.inner, t, wMost - 0.05, { dy: 14 });
      s.aL.draw(t, wCopied - 0.1, 0.5);
      A.show(s.lL.inner, t, wCopied, { dy: 0, dx: -10 });
      A.show(s.cache.inner, t, wPosted - 0.2, { dy: 14 });
      s.pL.update(t - wCopied, A.prog(t, wCopied + 0.3, 0.3));

      // `celebs`: "Celebrity tweets are fetched when you read, and merged in."
      const wCel = k.word("celebs", "Celebrity"), wFetch = k.word("celebs", "fetched"), wRead = k.word("celebs", "read"), wMerged = k.word("celebs", "merged");
      A.show(s.cel.inner, t, wCel - 0.05, { dy: 14 });
      s.aR.draw(t, wFetch - 0.1, 0.5);
      A.show(s.lR.inner, t, wFetch, { dy: 0, dx: -10 });
      A.show(s.ctw.inner, t, wRead - 0.15, { dy: 14 });
      // Merge: the card on "you read", rows interleave by time on "merged in".
      A.show(s.panel, t, wRead - 0.05, { dy: 16 });
      s.mL.draw(t, wRead, 0.5);
      s.mR.draw(t, wRead, 0.5);
      s.rows.forEach((r, i) => A.show(r, t, wMerged - 0.05 + i * 0.16, { d: 0.4, dy: 0, dx: i % 3 === 0 ? 28 : -28 }));
    },
  });
})();
