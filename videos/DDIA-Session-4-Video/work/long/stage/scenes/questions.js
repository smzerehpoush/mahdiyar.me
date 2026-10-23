// S23 — Three questions for your own system, one per part (teal / orange / purple).
(function () {
  function questionRow(root, o) {
    const C = K.C, acc = K.toneColor(o.tone);
    const card = K.card(root, { x: 120, y: o.y, w: 1680, h: 196, accent: o.tone });
    Object.assign(card.style, { display: "flex", alignItems: "center", gap: "40px", padding: "0 48px 0 40px" });
    const num = U.el("div", {}, card, o.num);
    Object.assign(num.style, { flex: "0 0 104px", height: "104px", borderRadius: "50%", background: o.bg, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px", fontWeight: 800, letterSpacing: "-0.03em" });
    const col = U.el("div", {}, card);
    const kick = U.el("div", {}, col, o.part);
    Object.assign(kick.style, { fontSize: "30px", fontWeight: 750, letterSpacing: "0.02em", color: acc, marginBottom: "8px" });
    const q = U.el("div", {}, col);
    q.innerHTML = o.q;
    Object.assign(q.style, { fontSize: "44px", fontWeight: 750, letterSpacing: "-0.015em", lineHeight: 1.12, color: C.ink, textWrap: "balance" });
    const em = q.querySelector("em");
    if (em) Object.assign(em.style, { fontStyle: "normal" });
    return { card, em, acc };
  }

  R.scene("questions", {
    build(root, k) {
      const C = K.C;
      const s = {};
      s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Questions for your own system" });
      const rows = [
        { tone: "teal", bg: C.tealBg, num: "01", part: "Data warehousing", q: "Where do your heavy reports run — <em>on the database serving your users?</em>" },
        { tone: "orange", bg: C.orangeBg, num: "02", part: "Column storage", q: "Which queries scan millions of rows but use <em>only a few columns?</em>" },
        { tone: "purple", bg: C.purpleBg, num: "03", part: "Precomputed aggregates", q: "Which totals do you recompute on <em>every dashboard load?</em>" },
      ];
      s.rows = rows.map((r, i) => questionRow(root, { ...r, y: 262 + i * 220 }));
      return s;
    },

    update(t, k, s) {
      const C = K.C;
      A.show(s.title, t, k.word(0, "questions") - 0.1);
      // Each card lands as its question starts; the key phrase warms to the part colour as it is said.
      const tIn = [k.word("q1", "where"), k.word("q2", "which"), k.word("q3", "which totals")];
      const tEm = [k.word("q1", "database"), k.word("q2", "only"), k.word("q3", "every")];
      s.rows.forEach((r, i) => {
        A.show(r.card, t, tIn[i] - 0.1, { dy: 22, s0: 0.985 });
        if (r.em) r.em.style.color = A.mix(C.ink, r.acc, A.prog(t, tEm[i] - 0.05, 0.4));
      });
    },
  });
})();
