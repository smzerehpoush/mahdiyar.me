// S27 — Three questions to take back to your team, one per pillar.
(function () {
  function questionRow(root, o) {
    const C = K.C, acc = K.toneColor(o.tone);
    const card = K.card(root, { x: 120, y: o.y, w: 1680, h: 196, accent: o.tone });
    Object.assign(card.style, { display: "flex", alignItems: "center", gap: "40px", padding: "0 48px 0 40px" });
    const num = U.el("div", {}, card, o.num);
    Object.assign(num.style, { flex: "0 0 104px", height: "104px", borderRadius: "50%", background: o.bg, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "56px", fontWeight: 800, letterSpacing: "-0.03em" });
    const col = U.el("div", {}, card);
    const kick = U.el("div", {}, col, o.pillar);
    Object.assign(kick.style, { fontSize: "30px", fontWeight: 750, letterSpacing: "0.02em", color: acc, marginBottom: "8px" });
    const q = U.el("div", {}, col, o.q);
    Object.assign(q.style, { fontSize: "44px", fontWeight: 750, letterSpacing: "-0.015em", lineHeight: 1.12, color: C.ink, textWrap: "balance" });
    return card;
  }

  R.scene("questions", {
    build(root, k) {
      const C = K.C;
      const s = {};
      s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Three questions for your team" });
      const rows = [
        { tone: "rel", bg: C.relBg, num: "1", pillar: "Reliability", q: "Which faults can we tolerate without users noticing?" },
        { tone: "sca", bg: C.scaBg, num: "2", pillar: "Scalability", q: "Which load parameter would force us to rethink our architecture?" },
        { tone: "mai", bg: C.maiBg, num: "3", pillar: "Maintainability", q: "What makes our system unnecessarily difficult to operate or change?" },
      ];
      s.rows = rows.map((r, i) => questionRow(root, { ...r, y: 262 + i * 212 }));
      return s;
    },

    update(t, k, s) {
      // Heading on "…take three questions back to your team".
      A.show(s.title, t, k.word("q1", "three") - 0.05);
      // Each card lands as its question starts: "Which faults…", "Which load…", "(and) what makes…".
      const tIn = [k.word("q1", "which faults"), k.word("q2", "which load"), k.word("q3", "what makes")];
      s.rows.forEach((r, i) => A.show(r, t, tIn[i] - 0.05, { dy: 22, s0: 0.985 }));
    },
  });
})();
