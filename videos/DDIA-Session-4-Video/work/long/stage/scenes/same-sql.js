// S07 — Same SQL, different engine. One SQL chip feeds both an OLTP database and a data warehouse ("same interface"). Under the
// lid, panels slide out: the OLTP side is built for lookups by key (one row found), the warehouse for big scans (a band sweeps every
// row). Then product chips, labelled "As of the book (2017)": commercial warehouses and open-source SQL-on-Hadoop engines.
// Product list follows the book (2017); "Trino" is deliberately not shown.
(function () {
  const C = K.C;
  const L = { x: 200, w: 680 }, Rt = { x: 1040, w: 680 }; // the two columns
  const LID_Y = 340, LID_H = 96, PAN_Y = 452, PAN_H = 200;

  /** Panel that slides out from under a lid: clipped group + inner sliding group. */
  function panel(svg, col, tone, id) {
    const cp = U.sv("clipPath", { id }, U.sv("defs", {}, svg));
    U.sv("rect", { x: col.x - 4, y: PAN_Y - 12, width: col.w + 8, height: PAN_H + 24 }, cp);
    const clip = U.sv("g", { "clip-path": `url(#${id})` }, svg);
    const inner = U.sv("g", {}, clip);
    U.sv("rect", { x: col.x, y: PAN_Y, width: col.w, height: PAN_H, rx: 18, fill: C.bg2, stroke: tone, "stroke-width": 2.5, "stroke-dasharray": "8 8" }, inner);
    return inner;
  }
  function rows(g, x, y, w, n, gap = 23) {
    return Array.from({ length: n }, (_, i) => U.sv("rect", { x, y: y + i * gap, width: w, height: 14, rx: 7, fill: C.line2 }, g));
  }
  function center(root, cx, y, w) {
    return U.el("div", { style: { position: "absolute", left: cx - w / 2 + "px", top: y + "px", width: w + "px", display: "flex", justifyContent: "center" } }, root);
  }

  R.scene("same-sql", {
    build(root, k) {
      const s = {};
      s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Same SQL, different engine" });
      const svg = K.svgLayer(root);

      // Surface: the same SQL chip over both boxes.
      s.sqlWrap = center(root, 960, 222, 900);
      s.sql = K.chip(s.sqlWrap, { text: "SELECT … FROM … WHERE …", accent: "hl" });
      Object.assign(s.sql.style, { position: "relative", fontFamily: "var(--mono)", fontWeight: 600 });
      s.tools = K.text(root, { x: 1250, y: 234, cls: "label", color: "muted", text: "same tools" });
      s.aL = K.arrow(svg, { from: [960, 288], via: [[960, 310], [L.x + L.w / 2, 310]], to: [L.x + L.w / 2, LID_Y - 6], tone: "hl", width: 3.5 });
      s.aR = K.arrow(svg, { from: [960, 288], via: [[960, 310], [Rt.x + Rt.w / 2, 310]], to: [Rt.x + Rt.w / 2, LID_Y - 6], tone: "hl", width: 3.5 });

      // Below: panels slide out from under the lids (drawn before the lids so the lids cover them).
      s.panL = panel(svg, L, C.line2, "ss-pl");
      s.panR = panel(svg, Rt, C.teal, "ss-pr");
      // Left internals: a key goes straight to one row.
      s.inL = U.sv("g", {}, s.panL);
      s.capL = K.label(s.inL, { x: L.x + 30, y: PAN_Y + 46, text: "Built for lookups by key", anchor: "start", size: 30, weight: 750, fill: "ink" });
      s.key = K.box(s.inL, { x: L.x + 30, y: PAN_Y + 96, w: 170, h: 64, label: "id = 42", fs: 28, tone: "hl", r: 14 });
      s.key.label.setAttribute("font-family", "JetBrains Mono, monospace");
      s.rowsL = rows(s.inL, L.x + 300, PAN_Y + 78, 340, 5);
      s.aKey = K.arrow(s.inL, { from: [L.x + 200, PAN_Y + 128], to: [L.x + 290, PAN_Y + 78 + 2 * 23 + 7], gapStart: 8, gapEnd: 4, tone: "hl", width: 3.5 });
      s.okL = K.label(s.inL, { x: L.x + 650, y: PAN_Y + 46, text: "few rows per query", anchor: "end", size: 26, weight: 650, fill: "muted" });
      // Right internals: a scan band sweeps every row.
      s.inR = U.sv("g", {}, s.panR);
      s.capR = K.label(s.inR, { x: Rt.x + 30, y: PAN_Y + 46, text: "Built for big scans", anchor: "start", size: 30, weight: 750, fill: "teal" });
      s.okR = K.label(s.inR, { x: Rt.x + 650, y: PAN_Y + 46, text: "many rows per query", anchor: "end", size: 26, weight: 650, fill: "muted" });
      s.rowsR = rows(s.inR, Rt.x + 30, PAN_Y + 78, 620, 5);
      const cpS = U.sv("clipPath", { id: "ss-scan" }, U.sv("defs", {}, svg));
      U.sv("rect", { x: Rt.x + 20, y: PAN_Y + 66, width: 640, height: 118 }, cpS);
      s.scanG = U.sv("g", { "clip-path": "url(#ss-scan)" }, s.inR);
      s.scan = U.sv("rect", { x: Rt.x + 20, y: 0, width: 640, height: 36, fill: C.teal, opacity: 0.35 }, s.scanG);
      s.scanEdge = U.sv("rect", { x: Rt.x + 20, y: 0, width: 640, height: 4, fill: C.teal }, s.scanG);

      // Lids (the boxes you talk to).
      s.lidL = K.box(svg, { x: L.x, y: LID_Y, w: L.w, h: LID_H, label: "OLTP database", icon: "database", iconInline: true, iconSize: 42 });
      s.lidR = K.box(svg, { x: Rt.x, y: LID_Y, w: Rt.w, h: LID_H, label: "Data warehouse", icon: "database", iconInline: true, iconSize: 42, tone: "teal" });

      // Products, as of the book (2017).
      s.badge = K.badge(root, { x: 200, y: 666, text: "As of the book (2017)" });
      s.badge.style.padding = "4px 16px"; // compact: heads both product lists in the gap under the panels
      s.comLbl = K.text(root, { x: 200, y: 718, cls: "small", text: "Commercial warehouses" });
      s.com = K.chips(root, { x: 200, y: 754, w: 1520, accent: "teal", size: 28, items: ["Teradata", "Vertica", "SAP HANA", "ParAccel"] });
      s.rs = K.chip(s.com.box, { text: "→ Amazon Redshift (hosted)", accent: "muted", size: 28 });
      s.rs.style.position = "relative"; s.rs.style.borderStyle = "dashed";
      s.osLbl = K.text(root, { x: 200, y: 828, cls: "small", text: "Open-source SQL-on-Hadoop" });
      s.os = K.chips(root, { x: 200, y: 864, w: 1520, accent: "ink", size: 28, items: ["Apache Hive", "Spark SQL", "Cloudera Impala", "Presto"] });
      return s;
    },

    update(t, k, s) {
      const tSql = k.word("surface", "SQL") - 0.1, tTools = k.word("surface", "same tools") - 0.1;
      const tLid = k.word("below", "lid") - 0.1, tInt = k.word("below", "internals") - 0.1;
      const tBig = k.word("below", "big scans") - 0.1, tKey = k.word("below", "lookups") - 0.3;
      const tBook = k.word("vendors", "book") - 0.1, tCom = k.word("vendors", "commercial") - 0.1;
      const tProd = [k.word("vendors", "included") + 0.3, k.word("vendors", "Vertica"), k.word("vendors", "SAP"), k.word("vendors", "ParAccel")].map((x) => x - 0.1);
      const tRs = k.word("vendors", "Amazon") - 0.1;
      const tOs = k.word("opensource", "open-source") - 0.1;
      const tOsP = [k.word("opensource", "Apache"), k.word("opensource", "Spark"), k.word("opensource", "SQL", 1) + 0.55, k.word("opensource", "Presto")].map((x) => x - 0.1);

      A.show(s.title, t, 0.3);
      // Two boxes first ("a warehouse looks familiar"), then the shared SQL chip feeds both.
      A.show(s.lidL.inner, t, k.word("surface", "warehouse") - 0.1, { dy: 14 });
      A.show(s.lidR.inner, t, k.word("surface", "warehouse") + 0.1, { dy: 14 });
      A.show(s.sql, t, tSql, { dy: 12, s0: 0.92 });
      s.aL.draw(t, tSql + 0.2, 0.6);
      s.aR.draw(t, tSql + 0.2, 0.6);
      A.show(s.tools, t, tTools, { dy: 10 });

      // Under the lid: panels slide down from beneath the boxes.
      A.show(s.panL, t, tInt, { dy: -PAN_H * 0.9, d: 0.8 });
      A.show(s.panR, t, tInt + 0.1, { dy: -PAN_H * 0.9, d: 0.8 });
      // Lids get a little "lift" glow while opening.
      const lift = A.win(t, tLid, tInt + 0.9, 0.3);
      s.lidL.label.setAttribute("opacity", 1);
      s.lidL.rect.setAttribute("stroke-width", (3 + 2 * lift).toFixed(2));
      s.lidR.rect.setAttribute("stroke-width", (3 + 2 * lift).toFixed(2));

      // Right: big scans — every row lights as the band sweeps.
      A.setOpacity(s.capR.inner, A.prog(t, tBig, 0.4));
      A.setOpacity(s.okR.inner, A.prog(t, tBig + 0.3, 0.4));
      const scanOn = A.prog(t, tBig, 0.4);
      A.setOpacity(s.scanG, scanOn);
      const P = 1.5, ph = (((t - tBig) / P) % 1 + 1) % 1;
      const by = PAN_Y + 60 + ph * 140 - 36;
      s.scan.setAttribute("y", by.toFixed(1));
      s.scanEdge.setAttribute("y", (by + 36).toFixed(1));
      s.rowsR.forEach((r) => r.setAttribute("fill", A.mix(C.line2, "#2F8C7E", scanOn)));

      // Left: a key goes straight to one row.
      A.setOpacity(s.capL.inner, A.prog(t, tKey, 0.4));
      A.setOpacity(s.okL.inner, A.prog(t, tKey + 0.3, 0.4));
      A.show(s.key.inner, t, tKey, { dy: 0, dx: -14 });
      s.aKey.draw(t, tKey + 0.2, 0.4);
      const hit = A.prog(t, tKey + 0.55, 0.3);
      s.rowsL.forEach((r, i) => r.setAttribute("fill", i === 2 ? A.mix(C.line2, C.hl, hit) : C.line2));

      // Products, as of the book (2017).
      A.show(s.badge, t, tBook, { dy: 10 });
      A.show(s.comLbl, t, tCom, { dy: 10 });
      s.com.chips.forEach((c, i) => A.show(c, t, tProd[i], { dy: 12, d: 0.5 }));
      A.show(s.rs, t, tRs, { dy: 12, d: 0.5 });
      A.show(s.osLbl, t, tOs, { dy: 10 });
      s.os.chips.forEach((c, i) => A.show(c, t, tOsP[i], { dy: 12, d: 0.5 }));
    },
  });
})();
