// Short S6 — the lesson ("A few outliers can decide your whole design"), the source (DDIA Chapter 1) and the pointer to the
// full explainer (the Short's related-video link).
(() => {
  const C = K.C;

  R.scene("lesson", {
    build(root, k) {
      const s = {};
      s.kick = K.text(root, { x: 80, y: 300, cls: "h3", text: "The lesson", color: "orange" });
      s.kick.style.fontSize = "52px";
      const parts = ["A few <span style='color:" + C.orange + "'>outliers</span>", "can decide", "your whole design."];
      s.big = U.el("div", { style: { position: "absolute", left: "80px", top: "380px", width: "840px" } }, root);
      s.parts = parts.map((h) => U.el("div", { class: "k-text", html: h, style: { position: "relative", fontSize: "104px", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: "1.02" } }, s.big));

      // Outlier strip: many small dots, one huge one.
      const svg = K.svgLayer(root);
      s.dots = [];
      for (let i = 0; i < 13; i++) s.dots.push(U.sv("circle", { cx: 100 + i * 46, cy: 860, r: 12, fill: C.line2 }, svg));
      s.huge = U.sv("circle", { cx: 840, cy: 860, r: 72, fill: C.orange }, svg);

      // Source card.
      s.src = K.card(root, { x: 80, y: 1000, w: 840, accent: "hl", title: "DDIA · Chapter 1",
        body: "<div style='font-size:46px;color:#E9EEF5;font-weight:750;letter-spacing:-0.02em;line-height:1.12'>Designing Data-Intensive Applications</div>" +
          "<div style='font-size:36px;margin-top:10px'>Martin Kleppmann · O'Reilly</div>" });
      s.src.querySelector(".k-card-title").style.fontSize = "38px";
      s.chipWrap = U.el("div", { style: { position: "absolute", left: "80px", top: "1352px", width: "840px", display: "flex", justifyContent: "center" } }, root);
      s.chip = K.chip(s.chipWrap, { text: "Full chapter explainer: linked below ↓", accent: "hl", size: 40 });
      Object.assign(s.chip.style, { position: "relative", background: C.bg2 });
      return s;
    },

    update(t, k, s) {
      // `lesson`: "The lesson" → kicker; "a few outliers" / "can decide" / "your whole design" build the line.
      A.show(s.kick, t, k.word("lesson", "lesson") - 0.15, { dy: 12 });
      const wFew = k.word("lesson", "few"), wOut = k.word("lesson", "outliers"), wCan = k.word("lesson", "can"), wYour = k.word("lesson", "your");
      A.show(s.parts[0], t, wFew - 0.15, { dy: 18 });
      A.show(s.parts[1], t, wCan - 0.1, { dy: 18 });
      A.show(s.parts[2], t, wYour - 0.1, { dy: 18 });
      s.dots.forEach((d, i) => A.setOpacity(d, A.prog(t, wOut - 0.2 + i * 0.025, 0.3)));
      const g = A.prog(t, wOut + 0.15, 0.6, A.E.outBack);
      s.huge.setAttribute("r", (72 * Math.max(0, g)).toFixed(2));
      A.setOpacity(s.huge, A.prog(t, wOut + 0.15, 0.2));

      // `source`: "From Chapter 1 of Designing Data-Intensive Applications" → card; "full explainer linked below" → chip.
      A.show(s.src, t, k.cue("source") + 0.05, { dy: 16 });
      A.show(s.chip, t, k.word("source", "explainer") - 0.2, { dy: 12 });
    },
  });
})();
