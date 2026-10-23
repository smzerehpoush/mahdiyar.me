// S02 — Title. Kicker + "Why analytics uses columns" with three tall part bands (literally columns: teal / orange / purple),
// a callback chip to Part 1 (logs · LSM-trees · B-trees), then the three questions, each tagged with its part's number and colour.
// Static composition: the title card stays put; the Part 1 callback block gives way to the three question rows.
(function () {
  const C = K.C;

  /** Tall band like the deck's title slide: grows from the bottom, label reads bottom-to-top. */
  function tallBand(root, o) {
    const n = U.el("div", {}, root);
    Object.assign(n.style, { position: "absolute", left: o.x + "px", top: o.bottom - o.h + "px", width: o.w + "px", height: o.h + "px",
      background: o.bg, borderRadius: "18px 18px 5px 5px", transformOrigin: "50% 100%", boxShadow: "0 30px 60px -30px rgba(0,0,0,.6)" });
    const num = U.el("div", { class: "k-text" }, n, o.num);
    Object.assign(num.style, { left: "0px", right: "0px", top: "22px", textAlign: "center", fontSize: "34px", fontWeight: 800, color: o.accent });
    const lab = U.el("div", { class: "k-text" }, n);
    Object.assign(lab.style, { left: "0px", right: "0px", bottom: "26px", display: "flex", justifyContent: "center" });
    const span = U.el("span", {}, lab, o.label);
    Object.assign(span.style, { writingMode: "vertical-rl", transform: "rotate(180deg)", whiteSpace: "nowrap", fontSize: "34px",
      fontWeight: 800, letterSpacing: "-0.01em", color: "#FFFFFF" });
    return { n, lab, num };
  }

  R.scene("title", {
    build(root, k) {
      const s = {};
      // Kicker: heading context, lands whole with the headline.
      s.kicker = K.text(root, { x: 120, y: 132, cls: "kicker", text: "Designing Data-Intensive Applications · Chapter 3 · Part 2" });
      s.kicker.style.whiteSpace = "nowrap";
      s.head = K.text(root, { x: 114, y: 186, cls: "h1", html: "Why analytics<br>uses columns" });

      // Beat `part1`: callback to the previous video.
      s.p1Lbl = K.text(root, { x: 120, y: 500, cls: "small", text: "Previous video" });
      s.p1Lbl.style.letterSpacing = "0.04em";
      s.p1 = K.chip(root, { x: 120, y: 548, text: `Part 1&nbsp;<span class="p1desc" style="color:${C.muted};font-weight:550">·&nbsp;storage engines for lookups by key</span>`, accent: "hl", icon: "search" });
      s.p1.style.fontSize = "34px";
      s.p1Desc = s.p1.querySelector(".p1desc");
      s.p1Items = K.chips(root, { x: 120, y: 648, w: 900, items: ["Logs", "LSM-trees", "B-trees"], accent: "muted", size: 28 }).chips;
      s.p1Items.forEach((c) => { c.style.padding = "8px 22px"; });

      // Beats `q1`–`q3`: question rows, tagged with the part number in its colour.
      const qs = [
        ["01", "teal", "Why do analytic queries need their own database?"],
        ["02", "orange", "How should that database lay its data out on disk?"],
        ["03", "purple", "Can we avoid computing the same answer over and over?"],
      ];
      s.rows = qs.map(([n, tone, q], i) => {
        const y = 516 + i * 142;
        const row = U.el("div", {}, root);
        Object.assign(row.style, { position: "absolute", left: "120px", top: y + "px", width: "1040px", height: "112px" });
        const tag = U.el("div", { class: "k-text" }, row, n);
        Object.assign(tag.style, { left: "0px", top: "8px", width: "92px", height: "64px", borderRadius: "14px", background: K.C[tone + "Bg"],
          border: `2.5px solid ${K.C[tone]}`, color: "#FFFFFF", fontSize: "34px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" });
        const txt = U.el("div", { class: "k-text" }, row, q);
        Object.assign(txt.style, { left: "124px", top: "0px", width: "1000px", fontSize: "36px", fontWeight: 600, lineHeight: 1.2, color: C.ink, whiteSpace: "nowrap", paddingTop: "18px" });
        return { row, tag, txt };
      });

      const bands = [
        { bg: C.tealBg, accent: C.teal, num: "01", label: "Data warehousing", h: 0.78 },
        { bg: C.orangeBg, accent: C.orange, num: "02", label: "Column storage", h: 1.0 },
        { bg: C.purpleBg, accent: C.purple, num: "03", label: "Precomputed aggregates", h: 0.88 },
      ];
      s.bands = bands.map((b, i) => tallBand(root, { ...b, x: 1280 + i * 180, w: 160, bottom: 900, h: Math.round(770 * b.h) }));
      return s;
    },

    update(t, k, s) {
      const cT = k.cue("title"), cP1 = k.cue("part1"), cQ1 = k.cue("q1");

      // Title card: headline and kicker land with the scene (heading exception).
      A.show(s.head, t, 0.3, { dy: 30 });
      A.show(s.kicker, t, 0.3, { dy: 12 });

      // Bands grow with the title as abstract columns (staggered); their text appears with each question; they dim when the questions start, each lights when its question is asked.
      const tQ = [k.word("q1", "First"), k.word("q2", "Second"), k.word("q3", "third")].map((x) => x - 0.1);
      const focus = A.prog(t, k.word("q1", "three questions") - 0.1, 0.5);
      s.bands.forEach((b, i) => {
        const tB = cT + 0.4 + 0.15 * i;
        const g = A.prog(t, tB, 1.1, A.E.outQuint);
        b.n.style.transform = `scaleY(${g.toFixed(4)})`;
        const lit = A.prog(t, tQ[i], 0.5);
        A.setOpacity(b.n, A.prog(t, tB, 0.3) * (1 - 0.65 * focus * (1 - lit)));
        A.setOpacity(b.lab, lit);
        A.setOpacity(b.num, lit);
      });

      // `part1`: "The previous video, Part 1…" → chip; then each engine as it is named. Leaves when the questions begin.
      const out = cQ1 - 0.1;
      A.show(s.p1Lbl, t, k.word("part1", "previous") - 0.1, { dy: 12, out });
      A.show(s.p1, t, k.word("part1", "part") - 0.1, { dy: 16, out });
      if (s.p1Desc) A.setOpacity(s.p1Desc, A.prog(t, k.word("part1", "storage engines") - 0.1, 0.4));
      const tItem = [k.word("part1", "logs"), k.word("part1", "LSM"), k.word("part1", "B-trees")];
      s.p1Items.forEach((c, i) => A.show(c, t, tItem[i] - 0.1, { d: 0.5, dy: 12, s0: 0.92, out }));

      // `q1`–`q3`: on "three questions" the three numbered tags appear (dimmed); each question lands as it is asked.
      const tRows = cQ1 + 0.25 > k.word("q1", "three questions") - 0.1 ? cQ1 + 0.25 : k.word("q1", "three questions") - 0.1;
      const tAsk = [k.word("q1", "why"), k.word("q2", "how"), k.word("q3", "can")].map((x) => x - 0.1);
      s.rows.forEach((r, i) => {
        const lit = A.prog(t, tQ[i], 0.5);
        A.show(r.row, t, tRows + 0.12 * i, { d: 0.5, dy: 14 });
        r.tag.style.opacity = (0.35 + 0.65 * lit).toFixed(3);
        A.show(r.txt, t, tAsk[i], { d: 0.6, dy: 10 });
      });
    },
  });
})();
