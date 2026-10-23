// S01 — Hook. A monthly report runs on the production database; checkout slows for everyone. Same data, same SQL — why?
(function () {
  // ---------------------------------------------------------------------------------------------------------------
  // Shared layout — IDENTICAL copy in hook.js and callback.js (the callback must visibly return to the opening).
  // buildBase(root) → state with: badge, cal, report (+ reportTitle), db (+ bar, scanTxt), checkout, users, arrows
  // aRep (report → DB), aUC (users → checkout), aCD (checkout → DB), packets pUC / pCD, pill { wrap, pill }.
  // ---------------------------------------------------------------------------------------------------------------
  const BAR_W = 300;
  function buildBase(root) {
    const C = K.C, s = {};
    s.badge = K.badge(root, { x: 0, y: 110, right: 120, text: "Illustration" });
    s.cal = K.chip(root, { x: 120, y: 168, text: "1st of the month", icon: "calendar", accent: "hl" });

    // Report card: small "Report" kicker, title, sub.
    s.report = K.card(root, { x: 120, y: 258, w: 400, h: 164 });
    Object.assign(s.report.style, { padding: "20px 28px" });
    const kick = U.el("div", { html: K.iconSvg("chart", 30, C.muted, 4) + "<span>Report</span>" }, s.report);
    Object.assign(kick.style, { display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700, color: C.muted, letterSpacing: "0.02em" });
    s.reportTitle = U.el("div", {}, s.report, "Revenue per country");
    Object.assign(s.reportTitle.style, { fontSize: "33px", fontWeight: 800, letterSpacing: "-0.015em", color: C.ink, marginTop: "8px", whiteSpace: "nowrap" });
    const sub = U.el("div", {}, s.report, "last quarter");
    Object.assign(sub.style, { fontSize: "28px", fontWeight: 600, color: C.muted, marginTop: "2px" });

    const svg = K.svgLayer(root);
    s.svg = svg;
    s.db = K.box(svg, { x: 680, y: 220, w: 360, h: 240, label: "Production database", icon: "database", iconSize: 52 });
    // Progress bar inside the database box (rows being scanned).
    s.barTrack = U.sv("rect", { x: 30, y: 170, width: BAR_W, height: 20, rx: 10, fill: C.bg2, stroke: C.line2, "stroke-width": 2 }, s.db.inner);
    s.bar = U.sv("rect", { x: 30, y: 170, width: 0, height: 20, rx: 10, fill: C.hl }, s.db.inner);
    s.scanTxt = U.sv("text", { x: 180, y: 222, "text-anchor": "middle", "font-size": 26, "font-weight": 650, fill: C.hl }, s.db.inner, "Scanning rows…");

    s.checkout = K.box(svg, { x: 1220, y: 275, w: 240, h: 130, label: "Checkout", icon: "server" });
    s.users = K.box(svg, { x: 1580, y: 275, w: 220, h: 130, label: "Users", icon: "users" });
    s.aRep = K.arrow(svg, { from: [520, 340], to: s.db.left, gapStart: 14, gapEnd: 14 });
    s.aUC = K.arrow(svg, { from: s.users.left, to: s.checkout.right, gapStart: 14, gapEnd: 14 });
    s.aCD = K.arrow(svg, { from: s.checkout.left, to: s.db.right, gapStart: 14, gapEnd: 14 });
    s.pUC = K.packets(svg, s.aUC, { n: 2, period: 1.2 });
    s.pCD = K.packets(svg, s.aCD, { n: 3, period: 1.2 });

    // Checkout latency pill, centred under the checkout box.
    const wrap = U.el("div", {}, root);
    Object.assign(wrap.style, { position: "absolute", left: s.checkout.cx - 250 + "px", top: "434px", width: "500px", display: "flex", justifyContent: "center" });
    const pill = K.pill(wrap, { x: 0, y: 0, text: "Checkout: fast", tone: "ok" });
    Object.assign(pill.style, { position: "relative", left: "auto", top: "auto" });
    s.pill = { wrap, pill };
    return s;
  }
  /** Scan progress (0..1) u seconds after the scan starts: a slow crawl that never finishes. */
  function crawl(u) { return u <= 0 ? 0 : 0.08 + 0.8 * (1 - Math.exp(-u / 10)); }
  /** ∫ of a 0→1 linear ramp starting at t0 over d seconds (for continuous packet slow-downs). */
  function rampInt(t, t0, d) { if (t <= t0) return 0; if (t <= t0 + d) return ((t - t0) * (t - t0)) / (2 * d); return d / 2 + (t - t0 - d); }
  /** Packet clock: speed 1, eases down to `slow` from tA (over d), back up to 1 from tB. */
  function packetClock(t, tA, tB, d, slow) { return t - (1 - slow) * (rampInt(t, tA, d) - rampInt(t, tB, d)); }
  // ------------------------------------------------------------------------------------------------- end shared

  R.scene("hook", {
    build(root, k) {
      const C = K.C;
      const s = buildBase(root);
      // `same`: one chip, revealed in two parts.
      const sw = U.el("div", {}, root);
      Object.assign(sw.style, { position: "absolute", left: "120px", top: "586px", width: "1680px", display: "flex", justifyContent: "center" });
      s.same = K.chip(sw, { text: `<b class="a">Same data</b><b class="b">&nbsp;·&nbsp;same SQL</b>`, accent: "ink", size: 36 });
      Object.assign(s.same.style, { position: "relative", padding: "14px 34px" });
      s.sameA = s.same.querySelector(".a"); s.sameB = s.same.querySelector(".b");
      [s.sameA, s.sameB].forEach((b) => (b.style.fontWeight = 750));
      // The second span grows with its text (clipped width), so the chip never shows an empty outlined tail.
      Object.assign(s.sameB.style, { display: "inline-block", overflow: "hidden", verticalAlign: "bottom", whiteSpace: "nowrap" });
      // Left-anchored (not flex-centred) so "Same data" does not slide while the chip grows; centred on its final width in update.
      sw.style.justifyContent = "flex-start";

      // `payoff`: "By the end:" + three chips in the part colours.
      s.pay = U.el("div", {}, root);
      Object.assign(s.pay.style, { position: "absolute", left: "120px", top: "760px", width: "1680px", display: "flex", justifyContent: "center", alignItems: "center", gap: "22px" });
      s.payLbl = U.el("div", {}, s.pay, "By the end:");
      Object.assign(s.payLbl.style, { fontSize: "36px", fontWeight: 750, color: C.muted, marginRight: "6px" });
      s.payChips = [["a separate database", "teal"], ["data stored in columns", "orange"], ["answers computed once", "purple"]].map(([txt, tone]) => {
        const c = K.chip(s.pay, { text: txt, accent: tone, size: 32 });
        Object.assign(c.style, { position: "relative" });
        return c;
      });
      return s;
    },

    update(t, k, s) {
      const C = K.C;
      // Word anchors.
      const tIll = k.word("report", "illustration"), tFirst = k.word("report", "first"), tRep = k.word("report", "quarterly");
      const tDB = k.word("report", "production"), tScan = k.word("scan", "crawls");
      const tMean = k.word("slow", "meanwhile"), tCheck = k.word("slow", "check"), tSlow = k.word("slow", "slow");
      const tSame1 = k.word("same", "same"), tSame2 = k.word("same", "same", 1), tHurt = k.word("same", "hurt");
      const tBy = k.word("payoff", "by the end"), tP = [k.word("payoff", "where"), k.word("payoff", "stores"), k.word("payoff", "answers")];

      // Scene label / disclosure: lands with the scene (heading exception), so the video does not open on an empty frame.
      A.show(s.badge, t, 0.2, { dy: 0 });
      A.show(s.cal, t, tFirst - 0.1, { dy: 16 });
      A.show(s.report, t, tRep - 0.1, { dy: 18 });
      A.show(s.db.inner, t, tDB - 0.1, { dy: 16 });
      s.aRep.draw(t, tDB + 0.15, 0.6);

      // Scan: the bar crawls, the DB is busy (yellow edge), the report's arrow glows.
      const scan = A.prog(t, tScan - 0.05, 0.5);
      s.bar.setAttribute("width", (BAR_W * crawl(t - tScan + 0.05)).toFixed(1));
      A.setOpacity(s.barTrack, scan); A.setOpacity(s.bar, scan); A.setOpacity(s.scanTxt, scan);
      s.db.setTone("hl", 0.85 * scan);
      s.aRep.setTone(A.mix(C.line2, C.hl, scan));

      // Users → Checkout → DB.
      A.show(s.users.inner, t, tMean - 0.05, { dy: 16 });
      A.show(s.checkout.inner, t, tCheck - 0.1, { dy: 16 });
      s.aUC.draw(t, tMean + 0.1, 0.5);
      s.aCD.draw(t, tCheck, 0.5);
      const on = A.prog(t, tCheck + 0.2, 0.3);
      const slow = A.prog(t, tSlow - 0.05, 0.6);
      const clk = packetClock(t, tSlow - 0.05, 1e9, 1.4, 0.3);
      const col = A.mix(C.hl, C.bad, slow);
      s.pUC.update(clk, on, { tone: col });
      s.pCD.update(clk + 0.3, on, { tone: col });
      s.aCD.setTone(A.mix(C.line2, C.bad, slow));
      s.checkout.setTone("bad", 0.8 * slow);
      A.show(s.pill.wrap, t, tCheck + 0.1, { dy: 12 });
      K.setPill(s.pill.pill, slow > 0.5 ? "Checkout: slow" : "Checkout: fast", slow > 0.5 ? "bad" : "ok");

      // Same data · same SQL — so why does this one query hurt? (the report card's edge turns red on "hurt")
      A.show(s.same, t, tSame1 - 0.1, { dy: 14 });
      A.setOpacity(s.sameA, A.prog(t, tSame1 - 0.1, 0.3));
      const pB = A.prog(t, tSame2 - 0.05, 0.35);
      const fullB = s.sameB.scrollWidth;
      s.sameB.style.maxWidth = (pB * fullB).toFixed(1) + "px";
      A.setOpacity(s.sameB, pB);
      const fullW = s.same.offsetWidth - s.sameB.offsetWidth + fullB;
      s.same.style.marginLeft = ((1680 - fullW) / 2).toFixed(1) + "px";
      const hurt = A.prog(t, tHurt - 0.1, 0.5);
      s.report.style.borderColor = A.mix(C.line, C.bad, hurt);
      s.report.style.background = `color-mix(in srgb, ${C.bad} ${(9 * hurt).toFixed(1)}%, ${C.surface})`;

      // Payoff.
      A.show(s.payLbl, t, tBy - 0.05, { dy: 12 });
      s.payChips.forEach((c, i) => A.show(c, t, tP[i] - 0.1, { dy: 14 }));
    },
  });
})();
