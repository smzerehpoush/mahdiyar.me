// S28 — Next chapter preview with the deck's tall bands (Relational · Document · Graph), then the credits card.
(function () {
  const NEUTRAL_BANDS = true; // next-chapter bands stay off the pillar palette (teal/orange/purple mean pillars)

  // Small white glyphs for the three data models (64×64, stroke).
  const GLYPH = {
    relational: '<rect x="8" y="12" width="48" height="40" rx="5"/><path d="M8 25h48M8 38h48M26 12v40"/>',
    document: '<path d="M16 6h22l12 12v40H16z"/><path d="M38 6v12h12"/><path d="M27 28c-4 0-4 3-4 6s-2 4-4 4c2 0 4 1 4 4s0 6 4 6M39 28c4 0 4 3 4 6s2 4 4 4c-2 0-4 1-4 4s0 6-4 6"/>',
    graph: '<circle cx="14" cy="18" r="6"/><circle cx="50" cy="14" r="6"/><circle cx="32" cy="46" r="7"/><circle cx="54" cy="50" r="5"/><path d="M19 21l9 19M44 16 20 18M46 19 36 40M39 47l10 2"/>',
  };

  function tallBand(root, o) {
    const n = U.el("div", {}, root);
    Object.assign(n.style, { position: "absolute", left: o.x + "px", top: o.bottom - o.h + "px", width: o.w + "px", height: o.h + "px", background: o.bg, border: o.border || "none", borderRadius: "18px 18px 5px 5px", transformOrigin: "50% 100%", boxShadow: "0 30px 60px -30px rgba(0,0,0,.6)" });
    const lab = U.el("div", { class: "k-text" }, n);
    Object.assign(lab.style, { left: "0px", right: "0px", bottom: "26px", display: "flex", justifyContent: "center" });
    const span = U.el("span", {}, lab, o.label);
    Object.assign(span.style, { writingMode: "vertical-rl", transform: "rotate(180deg)", whiteSpace: "nowrap", fontSize: "34px", fontWeight: 800, letterSpacing: "-0.01em", color: "#FFFFFF" });
    const ic = U.el("div", { html: K.iconSvg("box", 60, o.glyphColor || "rgba(255,255,255,.9)", 3.4).replace(K.ICONS.box, GLYPH[o.glyph]) }, n);
    Object.assign(ic.style, { position: "absolute", left: (o.w - 60) / 2 + "px", top: "30px", width: "60px", height: "60px" });
    return { n, lab, ic };
  }

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
      s.kicker = K.text(root, { x: 120, y: 0, cls: "kicker", text: `Next · Chapter ${(VIDEO.chapter || 1) + 1}`, color: "hl" });
      s.title = K.text(root, { x: 116, y: 0, cls: "h1", html: "Data models &amp;<br>query languages" });
      s.title.style.fontSize = "112px";

      const bands = [
        { label: "Relational", glyph: "relational", h: 0.7 },
        { label: "Document", glyph: "document", h: 1.0 },
        { label: "Graph", glyph: "graph", h: 0.84 },
      ];
      // Same band shapes as the title slide, but slate instead of the pillar colors (those mean pillars throughout the video).
      const fills = NEUTRAL_BANDS ? [C.surface2, A.mix(C.surface2, C.line2, 0.35), C.surface2] : [C.relBg, C.scaBg, C.maiBg];
      s.bands = bands.map((b, i) => tallBand(root, { x: 1186 + i * 214, w: 186, bottom: 900, h: Math.round(760 * b.h), bg: fills[i], label: b.label, glyph: b.glyph,
        border: NEUTRAL_BANDS ? `2px solid ${C.line2}` : null, glyphColor: NEUTRAL_BANDS ? C.hl : null }));

      // Credits card.
      s.card = K.card(root, { x: 120, y: 482, w: 1000, h: 398 });
      Object.assign(s.card.style, { display: "flex", flexDirection: "column", gap: "18px", padding: "28px 34px" });
      s.cHead = U.el("div", {}, s.card, "Based on");
      Object.assign(s.cHead.style, { fontSize: "26px", fontWeight: 750, letterSpacing: "0.04em", color: C.muted, marginBottom: "-2px" });
      const val = { fontSize: "29px", fontWeight: 700, color: C.ink, lineHeight: 1.25 };
      // Deck title and URL come from video.json (window.VIDEO.deck), never hard-coded per chapter.
      const deck = VIDEO.deck || { title: "", url: "" };
      s.rowDeck = creditRow(s.card, "Presentation", [
        [`“${deck.title}”`, val],
        [deck.url.replace(/^https?:\/\//, "").replace(/\/$/, ""), { fontFamily: "JetBrains Mono, monospace", fontSize: "26px", fontWeight: 600, color: C.hl, lineHeight: 1.35 }],
      ]);
      s.rowBook = creditRow(s.card, "Book", [
        ["Designing Data-Intensive Applications", val],
        ["by Martin Kleppmann (O'Reilly) · 1st edition (2017)", { fontSize: "27px", fontWeight: 600, color: C.muted, lineHeight: 1.3, whiteSpace: "nowrap" }],
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
      const cN = k.cue("next"), cC = k.cue("credits");
      // Title block: centered while the chapter is introduced, then moves up to make room for the credits.
      const up = A.prog(t, cC - 0.05, 0.9, A.E.inOutCubic);
      s.kicker.style.top = U.lerp(s.centered.kicker, s.top.kicker, up).toFixed(1) + "px";
      s.title.style.top = U.lerp(s.centered.title, s.top.title, up).toFixed(1) + "px";
      A.show(s.kicker, t, k.word("next", "Next") - 0.05, { dy: 14 });
      A.show(s.title, t, k.word("next", "Data models") - 0.05, { dy: 26 });

      // Bands grow as "relational … document … graph" are spoken.
      const tB = [k.word("next", "Relational"), k.word("next", "Document"), k.word("next", "Graph")].map((x) => x - 0.05);
      s.bands.forEach((b, i) => {
        const g = A.prog(t, tB[i], 0.9, A.E.outQuint);
        b.n.style.transform = `scaleY(${g.toFixed(4)})`;
        A.setOpacity(b.n, A.prog(t, tB[i], 0.25));
        A.setOpacity(b.lab, A.prog(t, tB[i] + 0.25, 0.35));
        A.setOpacity(b.ic, A.prog(t, tB[i] + 0.3, 0.35));
      });

      // Credits, in step with the narration: "…based on" → the DDIA Session 1 presentation → Martin Kleppmann's book.
      const tBased = k.word("credits", "based");
      A.show(s.card, t, tBased - 0.15, { dy: 20, s0: 0.985 });
      A.show(s.cHead, t, tBased, { dy: 0 });
      A.show(s.rowDeck, t, k.word("credits", "DDIA") - 0.05, { dy: 10 });
      A.show(s.rowBook, t, k.word("credits", "Martin") - 0.05, { dy: 10 });
      // "It's not affiliated…": the disclaimer lands with its line and stays up to the end (≈ 7.5 s before the final fade).
      const tDisc = k.word(2, "not");
      A.show(s.rule, t, tDisc - 0.1, { dy: 0 });
      A.show(s.disc, t, tDisc - 0.05, { dy: 10 });
      // Not spoken: the synthetic-voice note follows once the disclaimer sentence has been read out.
      A.show(s.voice, t, k.lines[2].end, { dy: 10 });
    },
  });
})();
