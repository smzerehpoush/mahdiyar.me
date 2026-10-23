// S24 — Next chapter preview (v1 writes → v2 reads; JSON · Protocol Buffers · Avro), then the credits card.
(function () {
  function creditRow(parent, label, lines) {
    const C = K.C;
    const row = U.el("div", {}, parent);
    Object.assign(row.style, { display: "flex", gap: "24px", alignItems: "baseline" });
    const l = U.el("div", {}, row, label);
    Object.assign(l.style, { flex: "0 0 176px", fontSize: "26px", fontWeight: 650, color: C.muted });
    const v = U.el("div", {}, row);
    lines.forEach(([txt, st]) => { const d = U.el("div", {}, v, txt); Object.assign(d.style, st); });
    return row;
  }

  R.scene("next", {
    build(root, k) {
      const C = K.C;
      const s = {};
      const ch = (VIDEO.chapter || 1) + 1;
      s.kicker = K.text(root, { x: 120, y: 0, cls: "kicker", text: `Next: Chapter ${ch}`, color: "hl" });
      s.title = K.text(root, { x: 116, y: 0, cls: "h1", html: "Encoding and<br>evolution" });
      s.title.style.fontSize = "112px";

      // Right column: one version of the code writes, another reads the same stored data.
      const svg = K.svgLayer(root);
      s.v1 = K.box(svg, { x: 1260, y: 170, w: 480, h: 110, label: "v1 writes", icon: "server", iconInline: true, iconSize: 44, fs: 34 });
      s.data = K.box(svg, { x: 1260, y: 370, w: 480, h: 110, label: "Stored data", icon: "file", iconInline: true, iconSize: 44, fs: 34 });
      s.v2 = K.box(svg, { x: 1260, y: 570, w: 480, h: 110, label: "v2 reads", icon: "server", iconInline: true, iconSize: 44, fs: 34, tone: "hl" });
      s.a1 = K.arrow(svg, { from: s.v1.bottom, to: s.data.top, gapStart: 12, gapEnd: 12, tone: "muted" });
      s.a2 = K.arrow(svg, { from: s.data.bottom, to: s.v2.top, gapStart: 12, gapEnd: 12, tone: "hl" });
      // Arrowheads on vertical arrows: pivot the head's rotate() at user-space 0,0 (already pinned by the runtime; kept explicit).
      [s.a1, s.a2].forEach((a) => a.head && U.pinOrigin(a.head));
      s.p1 = K.packets(svg, s.a1, { n: 1, period: 1.4, r: 8 });
      s.p2 = K.packets(svg, s.a2, { n: 1, period: 1.4, r: 8 });
      s.fmt = K.chips(root, { x: 1220, y: 748, w: 560, items: ["JSON", "Protocol Buffers", "Avro"], accent: "ink", size: 28, justify: "center" });

      // Credits card.
      s.card = K.card(root, { x: 120, y: 482, w: 1080, h: 398 });
      Object.assign(s.card.style, { display: "flex", flexDirection: "column", gap: "18px", padding: "28px 34px" });
      s.cHead = U.el("div", {}, s.card, "Based on");
      Object.assign(s.cHead.style, { fontSize: "26px", fontWeight: 750, letterSpacing: "0.04em", color: C.muted, marginBottom: "-2px" });
      const val = { fontSize: "29px", fontWeight: 700, color: C.ink, lineHeight: 1.25 };
      s.rowBook = creditRow(s.card, "Book", [
        [`Designing Data-Intensive Applications · Chapter ${VIDEO.chapter || 1}`, val],
        ["by Martin Kleppmann (O'Reilly) · 1st edition (2017)", { fontSize: "27px", fontWeight: 600, color: C.muted, lineHeight: 1.3, whiteSpace: "nowrap" }],
      ]);
      // Deck title and URL come from video.json (window.VIDEO.deck), never hard-coded per chapter.
      const deck = VIDEO.deck || { title: "", url: "" };
      s.rowDeck = creditRow(s.card, "Presentation", [
        [`“${deck.title}”`, val],
        [deck.url.replace(/^https?:\/\//, "").replace(/\/$/, ""), { fontFamily: "JetBrains Mono, monospace", fontSize: "26px", fontWeight: 600, color: C.hl, lineHeight: 1.35 }],
      ]);
      s.rule = U.el("div", {}, s.card);
      Object.assign(s.rule.style, { height: "2px", background: C.line2, margin: "4px 0 2px" });
      s.disc = U.el("div", {}, s.card, "Not affiliated with or endorsed by the author or publisher.");
      Object.assign(s.disc.style, { fontSize: "29px", fontWeight: 650, color: C.ink, lineHeight: 1.25 });
      s.voice = U.el("div", {}, s.card, "Narration: synthetic voice");
      Object.assign(s.voice.style, { fontSize: "26px", fontWeight: 600, color: C.muted, marginTop: "-6px" });

      s.centered = { kicker: 330, title: 382 };
      s.top = { kicker: 132, title: 182 };
      return s;
    },

    update(t, k, s) {
      const cC = k.cue("credits");
      // Title block: centred while the chapter is introduced, then moves up to make room for the credits.
      const up = A.prog(t, cC - 0.05, 0.9, A.E.inOutCubic);
      s.kicker.style.top = U.lerp(s.centered.kicker, s.top.kicker, up).toFixed(1) + "px";
      s.title.style.top = U.lerp(s.centered.title, s.top.title, up).toFixed(1) + "px";
      A.show(s.kicker, t, k.word("next", "next") - 0.05, { dy: 14 });
      A.show(s.title, t, k.word("next", "encoding") - 0.1, { dy: 26 });

      // "data written by one version … gets read by another".
      const tW = k.word("next", "written"), tR = k.word("next", "read");
      A.show(s.v1.inner, t, tW - 0.15, { dy: 14 });
      s.a1.draw(t, tW + 0.1, 0.5);
      A.show(s.data.inner, t, tW + 0.3, { dy: 14 });
      A.show(s.v2.inner, t, tR - 0.15, { dy: 14 }); // box lands with its arrow on "read"
      s.a2.draw(t, tR - 0.1, 0.5);
      s.p1.update(t, A.prog(t, tW + 0.6, 0.3));
      s.p2.update(t + 0.7, A.prog(t, tR + 0.4, 0.3));
      // Formats as they are named.
      const tF = [k.word(1, "JSON"), k.word(1, "protocol"), k.word(1, "Avro")];
      s.fmt.chips.forEach((c, i) => A.show(c, t, tF[i] - 0.1, { dy: 12 }));

      // Credits in step with the narration: "Martin Kleppmann's book and the blog presentation are credited on screen."
      const tM = k.word("credits", "Martin");
      A.show(s.card, t, tM - 0.2, { dy: 20, s0: 0.985 });
      A.show(s.cHead, t, tM - 0.1, { dy: 0 });
      A.show(s.rowBook, t, tM - 0.05, { dy: 10 });
      A.show(s.rowDeck, t, k.word("credits", "blog") - 0.05, { dy: 10 });
      // Not spoken: the disclaimer and voice note land on "credited on screen" and stay up to the end (≥ 5 s).
      const tDisc = k.word("credits", "credited");
      A.show(s.rule, t, tDisc - 0.1, { dy: 0 });
      A.show(s.disc, t, tDisc - 0.05, { dy: 10 });
      A.show(s.voice, t, tDisc + 0.5, { dy: 10 });
    },
  });
})();
