// Short S1 — hook. Twitter, circa 2012: posting ≈ 4,600 tweets/s vs ≈ 300,000 timeline loads/s, as two columns whose heights
// are to scale (the tweet bar is a sliver). The headline is on screen from frame 0 so the first frame works as the cover.
(() => {
  const C = K.C;
  const CX = 500;            // centre of the Shorts safe area (x 60–940)
  const BASE = 1320, HMAX = 600;

  R.scene("hook", {
    build(root, k) {
      const s = {};
      s.badge = K.badge(root, { x: 80, y: 236, text: "Twitter, circa 2012" });
      s.badge.style.fontSize = "36px";
      s.title = K.text(root, { x: 80, y: 316, w: 840, cls: "h2", html: "Why was <span style='color:" + C.orange + "'>reading</span> Twitter harder than tweeting?" });
      s.title.style.fontSize = "96px";

      const svg = K.svgLayer(root);
      U.sv("path", { d: `M80,${BASE} H920`, stroke: C.line2, "stroke-width": 3 }, svg);
      const col = (cx, w, color, num, lbl) => {
        const g = U.sv("g", {}, svg);
        const bar = U.sv("rect", { x: cx - w / 2, y: BASE, width: w, height: 0, rx: 14, fill: color }, g);
        const n = K.label(g, { x: cx, y: BASE - 24, text: num, size: 80, weight: 800, fill: color });
        n.t.setAttribute("letter-spacing", "-2");
        const l = K.label(g, { x: cx, y: BASE + 64, text: lbl, size: 42, weight: 700, fill: "ink" });
        const sub = K.label(g, { x: cx, y: BASE + 114, text: "per second", size: 36, weight: 600, fill: "muted" });
        return { g, bar, n, l, sub, cx };
      };
      s.post = col(290, 260, C.teal, "4,600", "Tweets posted");
      s.read = col(710, 300, C.orange, "300,000", "Timeline loads");
      s.hPost = Math.max(10, HMAX * 4600 / 300000);
      return s;
    },

    update(t, k, s) {
      // Cover frame: badge + headline are already there at t = 0.
      A.show(s.badge, t, -1);
      A.show(s.title, t, -1);

      // `rates`: "About 4,600 tweets a second went out" → the left column; "timelines were loaded 300,000 times" → the right one.
      const w46 = k.word("rates", "4,600"), wTw = k.word("rates", "tweets");
      A.show(s.post.l.inner, t, w46 - 0.1, { dy: 12 });
      A.show(s.post.sub.inner, t, wTw, { dy: 10 });
      const hp = s.hPost * A.prog(t, w46, 0.5);
      s.post.bar.setAttribute("y", (BASE - hp).toFixed(1)); s.post.bar.setAttribute("height", hp.toFixed(1));
      s.post.n.g.setAttribute("transform", `translate(${s.post.cx},${(BASE - hp - 28).toFixed(1)})`);
      A.show(s.post.n.inner, t, w46, { dy: 14 });

      const wTl = k.word("rates", "timelines"), w300 = k.word("rates", "300,000");
      A.show(s.read.l.inner, t, wTl - 0.05, { dy: 12 });
      A.show(s.read.sub.inner, t, wTl + 0.3, { dy: 10 });
      const g = A.prog(t, w300 - 0.1, 1.1, A.E.inOutCubic);
      const hr = HMAX * g;
      s.read.bar.setAttribute("y", (BASE - hr).toFixed(1)); s.read.bar.setAttribute("height", hr.toFixed(1));
      s.read.n.g.setAttribute("transform", `translate(${s.read.cx},${(BASE - Math.max(hr, 0) - 28).toFixed(1)})`);
      A.show(s.read.n.inner, t, w300 - 0.1, { dy: 0 });
      s.read.n.t.textContent = U.fmt(Math.round(300000 * g / 1000) * 1000);
    },
  });
})();
