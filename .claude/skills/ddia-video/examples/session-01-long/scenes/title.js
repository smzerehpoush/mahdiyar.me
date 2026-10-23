// S02 — Title. "Reliable. Scalable. Maintainable." with the deck's three tall pillar bands; each word unfolds into its question.
(function () {
  /** Tall band like the deck's title slide: grows from the bottom, label reads bottom-to-top. */
  function tallBand(root, o) {
    const n = U.el("div", {}, root);
    Object.assign(n.style, { position: "absolute", left: o.x + "px", top: o.bottom - o.h + "px", width: o.w + "px", height: o.h + "px", background: o.bg, borderRadius: "18px 18px 5px 5px", transformOrigin: "50% 100%", boxShadow: "0 30px 60px -30px rgba(0,0,0,.6)" });
    const lab = U.el("div", { class: "k-text" }, n);
    Object.assign(lab.style, { left: "0px", right: "0px", bottom: "26px", display: "flex", justifyContent: "center" });
    const span = U.el("span", {}, lab, o.label);
    Object.assign(span.style, { writingMode: "vertical-rl", transform: "rotate(180deg)", whiteSpace: "nowrap", fontSize: "34px", fontWeight: 800, letterSpacing: "-0.01em", color: "#FFFFFF" });
    return { n, lab };
  }

  R.scene("title", {
    build(root, k) {
      const s = {};
      const C = K.C;
      // Kicker in narration order ("…Chapter 1 of Martin Kleppmann's Designing Data-Intensive Applications, first edition"),
      // built segment by segment as each part is spoken. One line; all segments are laid out up front so nothing shifts.
      s.kicker = K.text(root, { x: 120, y: 0, cls: "kicker", text: "" });
      s.kicker.style.whiteSpace = "nowrap";
      s.kSeg = ["Chapter 1", " · Designing Data-Intensive Applications", " · 1st edition (2017)"].map((txt) => U.el("span", {}, s.kicker, txt));
      const words = [["Reliable.", "rel"], ["Scalable.", "sca"], ["Maintainable.", "mai"]];
      const qs = [
        "Does your system keep working when components go wrong?", // two lines (balanced), like q3
        "Can it handle growth?",
        "Can people understand, operate, and change it over time?",
      ];
      s.words = words.map(([w, tone]) => K.text(root, { x: 116, y: 0, cls: "h1", text: w, color: tone }));
      s.qs = qs.map((q) => {
        const n = K.text(root, { x: 120, y: 0, w: 1040, cls: "body", text: q });
        Object.assign(n.style, { fontSize: "40px", fontWeight: 600, lineHeight: 1.22, color: C.ink, textWrap: "balance" });
        return n;
      });
      const bands = [
        { bg: C.relBg, label: "Reliability", h: 0.7 },
        { bg: C.scaBg, label: "Scalability", h: 1.0 },
        { bg: C.maiBg, label: "Maintainability", h: 0.84 },
      ];
      s.bands = bands.map((b, i) => tallBand(root, { x: 1186 + i * 214, w: 186, bottom: 900, h: Math.round(760 * b.h), bg: b.bg, label: b.label }));
      // "each one really a question": a placeholder "?" waits in each question slot until the question is asked.
      s.marks = words.map(([, tone]) => K.text(root, { x: 120, y: 0, cls: "h3", text: "?", color: "muted" }));
      // Layouts: compact title card → spread rows (word + its question).
      s.compact = { kicker: 266, words: [316, 453, 590], size: 140 };
      s.spread = { kicker: 132, words: [182, 440, 650], size: 100, qOff: 112 }; // equal gaps below the 2-line q1 and the 1-line q2
      return s;
    },

    update(t, k, s) {
      const cT = k.cue("title"), cq = [k.cue("q1"), k.cue("q2"), k.cue("q3")];
      // "That's reliability / scalability / maintainability" — the band lights when its pillar is named.
      const tName = [k.word("q1", "reliability"), k.word("q2", "scalability"), k.word("q3", "maintainability")].map((x) => x - 0.05);
      // "The chapter rests on three words…" — the title card opens into three rows (one per word).
      const tSpread = k.word(1, "three words") - 0.1;

      const p = A.prog(t, tSpread, 1.0, A.E.inOutCubic);
      const L = (a, b) => U.lerp(a, b, p);
      s.kicker.style.top = L(s.compact.kicker, s.spread.kicker).toFixed(1) + "px";
      // Kicker builds with the narration: "Chapter 1" → "Designing Data-Intensive Applications" → "first edition".
      const tK = [k.word("title", "Chapter"), k.word("title", "Designing"), k.word("title", "first edition")].map((x) => x - 0.05);
      A.show(s.kicker, t, tK[0], { dy: 14 });
      s.kSeg.forEach((seg, i) => A.setOpacity(seg, i === 0 ? 1 : A.prog(t, tK[i], 0.45)));

      const focusOn = A.prog(t, cq[0], 0.5); // from q1 on, rows not yet introduced wait dimmed
      // "each really a question": a placeholder "?" waits in each question slot until its question is asked.
      const tMark = k.word(1, "question") - 0.05;
      s.words.forEach((w, i) => {
        w.style.top = L(s.compact.words[i], s.spread.words[i]).toFixed(1) + "px";
        w.style.fontSize = L(s.compact.size, s.spread.size).toFixed(2) + "px";
        const intro = i === 0 ? 1 : A.prog(t, cq[i], 0.5);
        const dim = 1 - 0.62 * focusOn * (1 - intro);
        A.show(w, t, cT + 0.1 + 0.15 * i, { dy: 30, max: dim }); // title card: lands with the scene's first line
        const q = s.qs[i];
        q.style.top = (s.spread.words[i] + s.spread.qOff).toFixed(1) + "px";
        // Each question lands as it is asked: "(First:) does…", "(Second:) can…", "(Third:) can…".
        const tq = k.word(["q1", "q2", "q3"][i], ["does", "can", "can"][i]) - 0.05;
        A.show(q, t, tq, { dy: 14 });
        const m = s.marks[i];
        m.style.top = (s.spread.words[i] + s.spread.qOff - 6).toFixed(1) + "px";
        A.show(m, t, tMark + 0.12 * i, { dy: 10, out: tq - 0.25, outD: 0.25, max: dim });
      });

      s.bands.forEach((b, i) => {
        // Title card: bands grow with the first line (staggered); each label fades in once its band is ~90% grown.
        const tBand = cT + 0.3 + 0.15 * i;
        const g = A.prog(t, tBand, 1.1, A.E.outQuint);
        b.n.style.transform = `scaleY(${g.toFixed(4)})`;
        // Dim all bands when the questions start; each lights again when its pillar is named.
        const lit = A.prog(t, tName[i], 0.5);
        const op = A.prog(t, tBand, 0.3) * (1 - 0.6 * focusOn * (1 - lit));
        A.setOpacity(b.n, op);
        A.setOpacity(b.lab, A.prog(t, tBand + 0.6, 0.5));
      });
    },
  });
})();
