// S03 — OLTP vs OLAP. Two tinted columns (yellow = transactions, teal = analytics) under spelled-out headers; the book's Table 3-1
// builds one row per narration line, each cell = a small glyph + a short phrase. A chip defines "transaction" (not necessarily ACID).
(function () {
  const C = K.C;
  const svgWrap = (w, h, body) => `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="none" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  // Five table rows (thin bars) at x0..x1.
  const rows5 = (x0, x1, fills) => fills.map((f, i) => `<rect x="${x0}" y="${8 + i * 12}" width="${x1 - x0}" height="7" rx="3" fill="${f}"/>`).join("");

  // Mini glyphs, 110×70.
  const G = {
    readOltp: svgWrap(110, 70,
      `<circle cx="12" cy="32" r="8" stroke="${C.hl}" stroke-width="3.5"/><path d="M20 32h18M30 32v7M36 32v5" stroke="${C.hl}" stroke-width="3.5"/>` +
      `<path d="M44 32h8m-5-4 5 4-5 4" stroke="${C.muted}" stroke-width="2.5"/>` +
      rows5(60, 106, [C.line2, C.line2, C.hl, C.line2, C.line2])),
    readOlap: svgWrap(110, 70,
      rows5(4, 64, [C.teal, C.teal, C.teal, C.teal, C.teal]) +
      `<path d="M72 8q6 0 6 6v14l5 4-5 4v14q0 6-6 6" stroke="${C.teal}" stroke-width="3"/>` +
      `<text x="100" y="45" text-anchor="middle" font-size="34" font-weight="800" fill="${C.teal}" stroke="none">Σ</text>`),
    writeOltp: svgWrap(110, 70,
      rows5(14, 96, [C.line2, C.line2, C.line2, C.line2, C.line2]) +
      [[30, 11.5], [76, 35.5], [50, 59.5]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6.5" fill="${C.hl}" stroke="${C.bg}" stroke-width="2.5"/>`).join("")),
    writeOlap: svgWrap(110, 70,
      `<g style="transform-box:view-box;transform-origin:0 0" transform="translate(6,6) scale(0.9)" stroke="${C.teal}" stroke-width="3.6">${K.ICONS.batch}</g>` +
      `<path d="M70 22h30m-7-6 7 6-7 6M70 46h30m-7-6 7 6-7 6" stroke="${C.teal}" stroke-width="3.5"/>`),
    usersOltp: svgWrap(110, 70, `<g style="transform-box:view-box;transform-origin:0 0" transform="translate(25,3) scale(0.94)" stroke="${C.hl}" stroke-width="3.5">${K.ICONS.users}</g>`),
    usersOlap: svgWrap(110, 70, `<g style="transform-box:view-box;transform-origin:0 0" transform="translate(25,3) scale(0.94)" stroke="${C.teal}" stroke-width="3.5">${K.ICONS.chart}</g>`),
    // Timeline: only "now" matters vs every event kept.
    stateOltp: svgWrap(110, 70,
      `<path d="M6 35h96" stroke="${C.line2}" stroke-width="3"/>` +
      [18, 38, 58, 78].map((x) => `<circle cx="${x}" cy="35" r="5.5" fill="${C.bg}" stroke="${C.line2}" stroke-width="2.5"/>`).join("") +
      `<circle cx="98" cy="35" r="10" fill="${C.hl}"/>`),
    stateOlap: svgWrap(110, 70,
      `<path d="M6 35h96" stroke="${C.teal}" stroke-width="3" opacity=".6"/>` +
      [14, 35, 56, 77, 98].map((x) => `<circle cx="${x}" cy="35" r="8" fill="${C.teal}"/>`).join("")),
    sizeOltp: svgWrap(110, 70, `<g style="transform-box:view-box;transform-origin:0 0" transform="translate(37,17) scale(0.56)" stroke="${C.hl}" stroke-width="5">${K.ICONS.database}</g>`),
    sizeOlap: svgWrap(110, 70, `<g style="transform-box:view-box;transform-origin:0 0" transform="translate(21,0) scale(1.06)" stroke="${C.teal}" stroke-width="3.2">${K.ICONS.database}</g>`),
  };

  const ROWS = [
    { cue: "reads", label: "Typical read", a: ["readOltp", "A few rows, by key"], b: ["readOlap", "Aggregate over many rows"], ta: ["reads", "transaction"], tb: ["reads", "report"] },
    { cue: "writes", label: "Typical write", a: ["writeOltp", "Small, random, from users"], b: ["writeOlap", "Bulk import or event stream"], ta: ["writes", "Transactions"], tb: ["writes", "bulk"] },
    { cue: "users", label: "Used by", a: ["usersOltp", "Customers, via the app"], b: ["usersOlap", "Analysts, for decisions"], ta: ["users", "customers"], tb: ["users", "analysts"] },
    { cue: "history", label: "Data means", a: ["stateOltp", "Latest state"], b: ["stateOlap", "History of events"], ta: ["history", "latest"], tb: ["history", "history"] },
    { cue: "size", label: "Size", a: ["sizeOltp", "Gigabytes – terabytes"], b: ["sizeOlap", "Terabytes – petabytes"], ta: ["size", "Gigabytes"], tb: ["size", "versus"] },
  ];

  const COL = { a: { x: 490, w: 640, tone: "hl" }, b: { x: 1160, w: 640, tone: "teal" } };
  const Y0 = 236, HEAD = 122, RH = 98, PANEL_B = Y0 + HEAD + ROWS.length * RH + 16;

  R.scene("oltp-olap", {
    build(root, k) {
      const s = {};
      s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Two kinds of workload" });

      // Definition chip (top right): what "transaction" means here.
      s.def = U.el("div", {}, root);
      Object.assign(s.def.style, { position: "absolute", left: "1060px", top: "112px", width: "740px", padding: "14px 24px",
        borderRadius: "18px", border: `2px solid ${C.line2}`, background: C.bg2 });
      s.def1 = U.el("div", { class: "k-text label" }, s.def);
      Object.assign(s.def1.style, { position: "relative", fontSize: "29px", color: C.ink, whiteSpace: "nowrap" });
      s.def1.innerHTML = `<span style="color:${C.hl}">Transaction</span> = a quick group of reads and writes`;
      s.def2 = U.el("div", { class: "k-text small" }, s.def);
      Object.assign(s.def2.style, { position: "relative", marginTop: "4px", whiteSpace: "nowrap" });
      s.def2.textContent = "not necessarily full ACID guarantees";

      // Column panels with headers.
      s.cols = {};
      for (const key of ["a", "b"]) {
        const c = COL[key], acc = C[c.tone];
        const p = U.el("div", {}, root);
        Object.assign(p.style, { position: "absolute", left: c.x + "px", top: Y0 + "px", width: c.w + "px", height: PANEL_B - Y0 + "px",
          borderRadius: "22px", border: `2px solid color-mix(in srgb, ${acc} 45%, transparent)`, background: `color-mix(in srgb, ${acc} 6%, ${C.bg})` });
        const h1 = U.el("div", { class: "k-text" }, p);
        Object.assign(h1.style, { left: "30px", top: "20px", fontSize: "38px", fontWeight: 800, letterSpacing: "-0.01em", color: C.ink, whiteSpace: "nowrap" });
        h1.innerHTML = key === "a" ? `Transaction processing <span style="color:${C.faint}">·</span> <span style="color:${acc}">OLTP</span>`
          : `Analytics <span style="color:${C.faint}">·</span> <span style="color:${acc}">OLAP</span>`;
        const h2 = U.el("div", { class: "k-text small" }, p, key === "a" ? "Online Transaction Processing" : "Online Analytic Processing");
        Object.assign(h2.style, { left: "30px", top: "72px", whiteSpace: "nowrap" });
        const rule = U.el("div", {}, p);
        Object.assign(rule.style, { position: "absolute", left: "0px", right: "0px", top: HEAD + "px", height: "2px", background: `color-mix(in srgb, ${acc} 35%, transparent)` });
        s.cols[key] = { p, h1, h2 };
      }

      // Rows.
      s.rows = ROWS.map((r, i) => {
        const y = Y0 + HEAD + 8 + i * RH;
        const lab = K.text(root, { x: 120, y: y + RH / 2 - 20, cls: "label", text: r.label, color: "muted" });
        lab.style.whiteSpace = "nowrap";
        const sep = i < ROWS.length - 1 ? U.el("div", {}, root) : null;
        if (sep) Object.assign(sep.style, { position: "absolute", left: "120px", width: "1680px", top: y + RH + "px", height: "1.5px", background: C.line, transformOrigin: "left" });
        const cell = (key, [g, txt]) => {
          const c = COL[key];
          const n = U.el("div", {}, root);
          Object.assign(n.style, { position: "absolute", left: c.x + 26 + "px", top: y + "px", width: c.w - 40 + "px", height: RH + "px", display: "flex", alignItems: "center", gap: "26px" });
          U.el("div", { html: G[g] }, n).style.flex = "0 0 110px";
          const tx = U.el("div", { class: "k-text body" }, n, txt);
          Object.assign(tx.style, { position: "relative", fontSize: "33px", fontWeight: 650, color: C.ink, whiteSpace: "nowrap" });
          return n;
        };
        return { lab, sep, a: cell("a", r.a), b: cell("b", r.b) };
      });

      s.foot = K.text(root, { x: 120, y: PANEL_B + 20, cls: "small", text: "Typical characteristics (book, Table 3-1)" });
      s.foot.style.color = C.faint;
      return s;
    },

    update(t, k, s) {
      A.show(s.title, t, 0.3);
      // Headers as each workload is named ("online transaction processing" / "online analytic processing").
      const tA = k.word("two", "online") - 0.1, tB = k.word(1, "online") - 0.1;
      A.show(s.cols.a.p, t, tA, { dy: 16 });
      A.show(s.cols.b.p, t, tB, { dy: 16 });
      // Transaction definition: chip, then its caveat.
      A.show(s.def, t, k.word(2, "transaction") - 0.1, { dy: 12 });
      A.setOpacity(s.def2, A.prog(t, k.word(2, "not necessarily") - 0.1, 0.5));

      // Panels grow with the rows instead of sitting empty at full height.
      const revealed = ROWS.reduce((acc, r) => acc + A.prog(t, Math.min(k.word(r.ta[0], r.ta[1]) - 0.1, k.cue(r.cue)), 0.5), 0);
      const ph = HEAD + 16 + RH * revealed + "px";
      s.cols.a.p.style.height = ph; s.cols.b.p.style.height = ph;
      const tEnd = k.cueEnd("size") + 0.2;
      ROWS.forEach((r, i) => {
        const row = s.rows[i];
        const ta = k.word(r.ta[0], r.ta[1]) - 0.1, tb = k.word(r.tb[0], r.tb[1]) - 0.1;
        A.show(row.lab, t, Math.min(ta, k.cue(r.cue)), { dy: 12, dx: -10 });
        // Active row label blends to ink while its line plays; all labels settle back to muted at the end.
        const nextT = i < ROWS.length - 1 ? k.cue(ROWS[i + 1].cue) : tEnd;
        const act = A.prog(t, k.cue(r.cue) - 0.1, 0.3) * (1 - A.prog(t, nextT - 0.1, 0.3));
        row.lab.style.color = A.mix(C.muted, C.ink, act);
        A.show(row.a, t, ta, { dy: 14 });
        A.show(row.b, t, tb, { dy: 14 });
        if (row.sep) { A.setOpacity(row.sep, A.prog(t, ta, 0.5)); }
      });
      A.show(s.foot, t, k.word("reads", "Typically") - 0.1, { dy: 8 });
    },
  });
})();
