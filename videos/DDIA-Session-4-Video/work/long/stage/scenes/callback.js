// S22 — Callback. The hook returns; each symptom maps to its part (01 warehouse/ETL, 02 columns, 03 materialized view/cube).
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

  /** One mapping row: red symptom (right-aligned) → arrow → part chip (its text split into word-synced spans). */
  function mapRow(root, y, symptom, parts, tone) {
    const C = K.C;
    const row = U.el("div", {}, root);
    Object.assign(row.style, { position: "absolute", left: "120px", top: y + "px", width: "1680px", height: "62px", display: "flex", alignItems: "center", gap: "26px" });
    const sym = U.el("div", { class: "k-text" }, row, symptom);
    Object.assign(sym.style, { position: "relative", flex: "0 0 640px", textAlign: "right", fontSize: "34px", fontWeight: 750, letterSpacing: "-0.01em", color: C.bad, whiteSpace: "nowrap" });
    const arr = U.el("div", { html: `<svg width="76" height="30" viewBox="0 0 76 30" fill="none" stroke="${K.toneColor(tone)}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15h64M56 5l12 10-12 10"/></svg>` }, row);
    Object.assign(arr.style, { flex: "0 0 76px", height: "30px" });
    const chip = K.chip(row, { text: parts.map((p, i) => `<b class="p${i}">${p}</b>`).join(""), accent: tone, size: 30 });
    Object.assign(chip.style, { position: "relative", padding: "10px 26px" });
    const spans = parts.map((_, i) => {
      const b = chip.querySelector(".p" + i); b.style.fontWeight = 700; b.style.whiteSpace = "pre";
      // Later parts grow with their text (clipped width) so the chip outline never runs ahead of the words.
      if (i > 0) Object.assign(b.style, { display: "inline-block", overflow: "hidden", verticalAlign: "bottom" });
      return b;
    });
    return { row, sym, arr, chip, spans };
  }

  R.scene("callback", {
    build(root, k) {
      const C = K.C;
      const s = buildBase(root);
      const svg = s.svg;
      // 01 — warehouse fed by ETL from the production database.
      s.wh = K.box(svg, { x: 680, y: 560, w: 480, h: 100, label: "Data warehouse", icon: "database", iconInline: true, iconSize: 42, fs: 30 });
      s.aETL = K.arrow(svg, { from: s.db.bottom, to: [860, 560], gapStart: 12, gapEnd: 12, tone: "teal" });
      s.etlLbl = K.label(svg, { x: 884, y: 521, text: "ETL", size: 28, weight: 750, fill: "teal", anchor: "start" });
      s.pETL = K.packets(svg, s.aETL, { n: 1, period: 1.6, tone: "teal", r: 8 });
      // Report now reads the warehouse.
      s.aRepW = K.arrow(svg, { from: [330, 422], via: [[330, 610]], to: s.wh.left, gapStart: 14, gapEnd: 14, tone: "teal" });
      // 02 — orange column stripes inside the warehouse.
      s.cols = [];
      for (let i = 0; i < 6; i++) s.cols.push(U.sv("rect", { x: 352 + i * 19, y: 22, width: 12, height: 56, rx: 4, fill: C.orange }, s.wh.inner));
      s.cols.forEach((r) => { r.style.transformBox = "fill-box"; r.style.transformOrigin = "50% 100%"; });
      // 03 — materialized view / cube between the warehouse and the report.
      s.mv = K.box(svg, { x: 120, y: 560, w: 420, h: 100, label: "Materialized view", icon: "layers", iconInline: true, iconSize: 42, fs: 30 });
      s.aWM = K.arrow(svg, { from: s.wh.left, to: s.mv.right, gapStart: 14, gapEnd: 14, tone: "purple" });
      s.aRM = K.arrow(svg, { from: [330, 422], to: s.mv.top, gapStart: 14, gapEnd: 14, tone: "purple" });
      s.check = K.mark(svg, "check", { x: 520, y: 258, size: 50 });

      // Bottom: three symptom → part mappings.
      s.rows = [
        mapRow(root, 700, "Checkout slows down", ["01 · Warehouse via ETL"], "teal"),
        mapRow(root, 772, "Report reads whole rows", ["02 · Columns", " · compressed", " · sorted by date"], "orange"),
        mapRow(root, 844, "Same totals every month", ["03 · Materialized view", " / cube"], "purple"),
      ];
      return s;
    },

    update(t, k, s) {
      const C = K.C;
      // ---- `report`: rebuild the hook's picture (already in its slow state by "slowing down checkout").
      const tFirst = k.word("report", "first"), tRepW = k.word("report", "report"), tSlowing = k.word("report", "slowing");
      A.show(s.badge, t, 0.3, { dy: 0 });
      A.show(s.cal, t, tFirst - 0.15, { dy: 14 });
      A.show(s.report, t, tFirst + 0.05, { dy: 14 });
      A.show(s.db.inner, t, tFirst + 0.25, { dy: 14 });
      s.aRep.draw(t, tFirst + 0.45, 0.5);
      A.show(s.checkout.inner, t, tRepW - 0.05, { dy: 14 });
      A.show(s.users.inner, t, tRepW + 0.1, { dy: 14 });
      s.aCD.draw(t, tRepW + 0.05, 0.45);
      s.aUC.draw(t, tRepW + 0.2, 0.45);

      // ---- `map1`: shared database → ETL into a warehouse separates them; checkout back to green.
      const tCk = k.word("map1", "checkout"), tShared = k.word("map1", "shared"), tETL = k.word("map1", "ETL");
      const tWh = k.word("map1", "warehouse"), tSep = k.word("map1", "separates");
      const scan = A.prog(t, tRepW, 0.5) * (1 - A.prog(t, tSep, 0.6));
      s.bar.setAttribute("width", (BAR_W * crawl(t - tFirst + 4)).toFixed(1));
      A.setOpacity(s.barTrack, scan); A.setOpacity(s.bar, scan); A.setOpacity(s.scanTxt, scan);
      // "shared one database": the DB edge flashes red, then settles.
      const shared = A.prog(t, tShared - 0.1, 0.4) * (1 - A.prog(t, tSep, 0.6));
      s.db.setTone("hl", 0.85 * scan * (1 - shared));
      if (shared > 0.01) s.db.setTone("bad", 0.8 * shared);
      s.aRep.setTone(A.mix(C.line2, shared > 0.5 ? C.bad : C.hl, Math.max(scan, shared)));
      s.aRep.setOpacity(A.prog(t, tFirst + 0.45, 0.01) * (1 - A.prog(t, tSep, 0.5)));

      const slow = A.prog(t, tSlowing - 0.05, 0.5) * (1 - A.prog(t, tSep + 0.3, 0.6));
      const clk = packetClock(t, tSlowing - 0.05, tSep + 0.3, 1.0, 0.3);
      const on = A.prog(t, tRepW + 0.3, 0.3);
      const col = A.mix(C.hl, C.bad, slow);
      s.pUC.update(clk, on, { tone: col });
      s.pCD.update(clk + 0.3, on, { tone: col });
      s.aCD.setTone(A.mix(C.line2, C.bad, slow));
      const fixed = A.prog(t, tSep + 0.3, 0.6);
      s.checkout.setTone("bad", 0.8 * slow);
      if (fixed > 0.01) s.checkout.setTone("ok", fixed, "neutral");
      A.show(s.pill.wrap, t, tRepW + 0.05, { dy: 12 });
      const pillState = fixed > 0.5 ? ["Checkout: fast", "ok"] : slow > 0.5 ? ["Checkout: slow", "bad"] : ["Checkout: fast", "ok"];
      K.setPill(s.pill.pill, pillState[0], pillState[1]);

      s.aETL.draw(t, tETL - 0.05, 0.5);
      A.show(s.etlLbl.inner, t, tETL, { dy: 8 });
      A.show(s.wh.inner, t, tWh - 0.15, { dy: 14 });
      s.wh.setTone("teal");
      s.pETL.update(t, A.prog(t, tWh + 0.3, 0.3));
      // The report's arrow moves to the warehouse on "separates" (until the materialized view takes over).
      const tMat = k.word("map3", "materialized");
      s.aRepW.draw(t, tSep, 0.7);
      s.aRepW.setOpacity(A.prog(t, tSep, 0.01) * (1 - A.prog(t, tMat - 0.35, 0.3)));

      // ---- `map2`: the warehouse stores columns, compressed and sorted by date.
      const tRead = k.word("map2", "report"), tCol = k.word("map2", "column"), tCmp = k.word("map2", "compressed"), tSort = k.word("map2", "sorted");
      const grow = A.prog(t, tCol - 0.05, 0.6), cmp = A.prog(t, tCmp - 0.05, 0.5);
      // Uncompressed heights vary; compression shrinks them; sorting by date shrinks them further (never grows):
      // the date column (first) compresses best, the others a little more.
      const H0 = [1, 0.8, 0.95, 0.7, 0.9, 0.85];
      const H1 = H0.map((h) => h * 0.7);
      const Hs = H1.map((h, i) => h * (i === 0 ? 0.35 : 0.8));
      const srt = A.prog(t, tSort - 0.05, 0.6);
      s.cols.forEach((r, i) => {
        const h = U.lerp(U.lerp(H0[i], H1[i], cmp), Hs[i], srt) * grow;
        r.style.transform = `scaleY(${Math.max(0.001, h).toFixed(4)})`;
        A.setOpacity(r, A.prog(t, tCol - 0.05, 0.2));
      });

      // ---- `map3`: totals come from a materialized view / cube; the report is answered fast.
      const tSameT = k.word("map3", "same totals"), tCube = k.word("map3", "cube"), tSec = k.word("map3", "seconds");
      A.show(s.mv.inner, t, tMat - 0.1, { dy: 14 });
      s.mv.setTone("purple");
      s.aWM.draw(t, tMat + 0.1, 0.5);
      s.aRM.draw(t, tMat + 0.3, 0.5);
      A.show(s.check.inner, t, tSec - 0.1, { d: 0.45, dy: 0, s0: 0.3, ease: A.E.outBack });
      const okR = A.prog(t, tSec - 0.1, 0.5);
      const hurt = A.prog(t, tShared - 0.1, 0.4) * (1 - okR);
      const rc = okR > 0 ? A.mix(C.bad, C.ok, okR) : A.mix(C.line, C.bad, hurt);
      s.report.style.borderColor = rc;
      s.report.style.background = `color-mix(in srgb, ${rc} ${(9 * Math.max(hurt, okR)).toFixed(1)}%, ${C.surface})`;

      // ---- Mapping rows: symptom when it is named, then the part chip (in word-synced parts).
      const SYM = [tCk, tRead, tSameT];
      const PART = [[tWh], [tCol, tCmp, tSort], [tMat, tCube]];
      s.rows.forEach((r, i) => {
        A.show(r.sym, t, SYM[i] - 0.1, { dy: 10 });
        A.show(r.arr, t, PART[i][0] - 0.2, { dy: 0, dx: -14 });
        A.show(r.chip, t, PART[i][0] - 0.1, { dy: 10 });
        r.spans.forEach((sp, j) => {
          const p = A.prog(t, PART[i][j] - 0.1, 0.35);
          if (j > 0) sp.style.maxWidth = (p * sp.scrollWidth).toFixed(1) + "px";
          A.setOpacity(sp, p);
        });
      });
    },
  });
})();
