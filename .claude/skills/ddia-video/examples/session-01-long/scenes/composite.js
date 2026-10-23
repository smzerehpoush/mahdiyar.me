// S04 — A composite data system: Client → Application code → Primary DB, plus Cache, Search index, Change queue and Background
// workers. Then a write lands in the DB while the change is still queued, so the cache serves a stale value. Each data store
// shows its copy of the same record ("price: $18") so the divergence is visible.
R.scene("composite", {
  build(root, k) {
    const s = {};
    const C = K.C;
    s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Real applications combine them." });

    const svg = K.svgLayer(root);
    const defs = U.sv("defs", {}, svg);
    const f = U.sv("filter", { id: "composite-glow", x: "-30%", y: "-40%", width: "160%", height: "180%" }, defs);
    U.sv("feGaussianBlur", { stdDeviation: 9 }, f);
    s.dia = U.sv("g", {}, svg);
    const D = s.dia;
    // Workaround: tokens.css sets `svg * { transform-box: fill-box; transform-origin: center }`, which makes the *attribute*
    // transforms of box icons (scale) and arrow heads (rotate) pivot around their bbox centre: icons sit ~12 px low and arrow
    // heads on vertical arrows drift ~8 px sideways. Restore SVG attribute semantics on those nodes only.
    const pin = (n) => { if (n) { n.style.transformBox = "view-box"; n.style.transformOrigin = "0 0"; } };

    // Data store node: icon + name, a role line, and a record row holding this store's copy of the value.
    function store(o) {
      const b = K.box(D, { x: o.x, y: o.y, w: o.w, h: 160, label: o.label, icon: o.icon, iconInline: true, iconSize: 40 });
      pin(b.icon);
      b.icon.setAttribute("transform", `translate(22,23) scale(${40 / 64})`);
      b.label.setAttribute("y", 54);
      const glow = U.sv("rect", { x: -2, y: -2, width: o.w + 4, height: 164, rx: 20, fill: "none", stroke: C.bad, "stroke-width": 12, filter: "url(#composite-glow)" });
      b.inner.insertBefore(glow, b.rect);
      const role = U.sv("text", { x: 78, y: 90, "font-size": 26, "font-weight": 550, fill: C.muted }, b.inner, o.role);
      const rowG = U.sv("g", {}, b.inner);
      const row = U.sv("rect", { x: 18, y: 106, width: o.w - 36, height: 40, rx: 10, fill: C.bg2, "stroke-width": 2 }, rowG);
      const txt = U.sv("text", { x: 34, y: 135, "font-size": 26, "font-weight": 600, "font-family": "JetBrains Mono, monospace" }, rowG);
      U.sv("tspan", { fill: C.muted }, txt, "price: ");
      const val = U.sv("tspan", { fill: C.ink }, txt, "$18");
      const status = U.sv("text", { x: o.w - 34, y: 135, "text-anchor": "end", "font-size": 26, "font-weight": 700 }, rowG, "");
      // Secondary status (cache only: "old" before the narrator says "stale").
      const status2 = U.sv("text", { x: o.w - 34, y: 135, "text-anchor": "end", "font-size": 26, "font-weight": 700 }, rowG, "");
      return Object.assign(b, { glow, role, rowG, row, val, status, status2 });
    }

    // ----- nodes (vertical spine at x = 960)
    s.client = K.box(D, { x: 855, y: 248, w: 210, h: 88, label: "Client", icon: "user", iconInline: true, iconSize: 40 });
    s.app = K.box(D, { x: 780, y: 404, w: 360, h: 100, label: "Application code", icon: "server", iconInline: true, iconSize: 40 });
    s.cache = store({ x: 230, y: 578, w: 380, label: "Cache", icon: "cache", role: "fast reads" });
    s.db = store({ x: 760, y: 578, w: 400, label: "Primary database", icon: "database", role: "the official copy" });
    s.index = store({ x: 1310, y: 578, w: 380, label: "Search index", icon: "search", role: "keyword search" });
    s.queue = K.box(D, { x: 745, y: 806, w: 430, h: 92, label: "Change queue", icon: "queue", iconInline: true, iconSize: 40 });
    s.wL = K.box(D, { x: 235, y: 806, w: 370, h: 92, label: "Background worker", icon: "gear", iconInline: true, iconSize: 40, fs: 28 });
    s.wR = K.box(D, { x: 1315, y: 806, w: 370, h: 92, label: "Background worker", icon: "gear", iconInline: true, iconSize: 40, fs: 28 });

    // ----- arrows (drawn under the boxes' text, above nothing else)
    const A_ = (o) => K.arrow(D, { gapStart: 10, gapEnd: 12, ...o });
    s.aCA = A_({ from: [960, 336], to: [960, 404] });
    s.aAD = A_({ from: [960, 504], to: [960, 578] });
    s.aAC = A_({ from: [780, 454], via: [[420, 454]], to: [420, 578] });
    s.aAI = A_({ from: [1140, 454], via: [[1500, 454]], to: [1500, 578] });
    s.aDQ = A_({ from: [960, 738], to: [960, 806] });
    s.aQL = A_({ from: [745, 852], to: [605, 852] });
    s.aQR = A_({ from: [1175, 852], to: [1315, 852] });
    s.aWC = A_({ from: [420, 806], to: [420, 738] });
    s.aWI = A_({ from: [1500, 806], to: [1500, 738] });
    // Move arrows behind the nodes so heads/dots never cover labels.
    [s.aCA, s.aAD, s.aAC, s.aAI, s.aDQ, s.aQL, s.aQR, s.aWC, s.aWI].forEach((a) => { D.insertBefore(a.g, D.firstChild); pin(a.head); });
    [s.client, s.app, s.queue, s.wL, s.wR].forEach((b) => pin(b.icon));

    s.lWrites = K.label(D, { x: 982, y: 550, text: "writes", size: 26, weight: 600, fill: "muted", anchor: "start" });
    s.lChanges = K.label(D, { x: 982, y: 781, text: "changes", size: 26, weight: 600, fill: "muted", anchor: "start" });
    s.lUpdL = K.label(D, { x: 396, y: 781, text: "update", size: 26, weight: 600, fill: "muted", anchor: "end" });
    s.lUpdR = K.label(D, { x: 1524, y: 781, text: "update", size: 26, weight: 600, fill: "muted", anchor: "start" });
    // Stale beat: the cache's worker is still catching up (its update has not reached the cache yet).
    s.lLag = K.label(D, { x: 444, y: 781, text: "catching up…", size: 26, weight: 700, fill: "hl", anchor: "start" });
    s.wLIconT = s.wL.icon.getAttribute("transform");

    // ----- ambient request flow
    const P = (a, n, period) => K.packets(D, a, { n, period, r: 8 });
    s.pCA = P(s.aCA, 2, 1.2);
    s.pAD = P(s.aAD, 2, 1.2);
    s.pAC = P(s.aAC, 3, 1.8);
    s.pAI = P(s.aAI, 3, 1.8);
    s.pDQ = P(s.aDQ, 2, 1.2);
    s.pQL = P(s.aQL, 2, 1.4);
    s.pQR = P(s.aQR, 2, 1.4);
    s.pWC = P(s.aWC, 2, 1.2);
    s.pWI = P(s.aWI, 2, 1.2);

    // ----- the write / stale-read story tokens
    s.tokWrite = U.sv("circle", { r: 12, fill: C.hl }, D);
    s.tokChange = U.sv("circle", { r: 11, fill: C.hl }, D);
    s.tokRead = U.sv("circle", { r: 12, fill: C.hl }, D);
    s.tokResp = U.sv("circle", { r: 12, fill: C.bad }, D);
    // Pending change parked in the queue.
    s.pend = U.sv("g", { transform: "translate(1077,832)" }, D);
    s.pendIn = U.sv("g", {}, s.pend);
    U.sv("rect", { x: 0, y: 0, width: 76, height: 40, rx: 10, fill: "#3A3216", stroke: C.hl, "stroke-width": 2.5 }, s.pendIn);
    U.sv("text", { x: 38, y: 29, "text-anchor": "middle", "font-size": 26, "font-weight": 700, "font-family": "JetBrains Mono, monospace", fill: C.hl }, s.pendIn, "$20");
    // "≠" marks between the copies (yourjob beat).
    s.neq = [685, 1235].map((x) => {
      const g = U.sv("g", { transform: `translate(${x},708)` }, D);
      const inner = U.sv("g", {}, g);
      U.sv("path", { d: "M-20,-8 H20 M-20,8 H20 M8,-22 L-8,22", stroke: C.bad, "stroke-width": 5, "stroke-linecap": "round", fill: "none" }, inner);
      return inner;
    });

    // ----- HTML overlays (after the SVG so they sit on top)
    s.writePill = K.pill(root, { x: 470, y: 260, text: "write: price = $20", tone: "hl" });
    s.readPill = K.pill(root, { x: 1160, y: 260, text: "read: price = $18", tone: "bad" });
    s.symptom = K.badge(root, { x: 1160, y: 340, text: "Symptom #1: stale data", tone: "bad" });
    s.job = K.chip(root, { x: 120, y: 258, text: "Keeping these in sync is now your job.", accent: "hl" });

    s.goal = K.card(root, { x: 360, y: 392, w: 1200, accent: "hl", title: "You are now a data system designer.", body: "<span style='font-size:40px;color:#E9EEF5;font-weight:600'>Not just using data systems — designing one.</span>" });
    s.goal.style.textAlign = "center";
    s.goal.querySelector(".k-card-title").style.fontSize = "64px";
    return s;
  },

  update(t, k, s) {
    const C = K.C;
    // Every beat is anchored to the narrator's word (whisper timings via k.word); nothing lands before it is said.
    const W = (cue, needle, nth = 0) => k.word(cue, needle, nth);
    const tTitle = W("app", "Real");
    const tClient = W("app", "client"), tCalls = W("app", "calls"), tApp = W("app", "your code");
    const tWrites = W("db", "writes"), tDB = W("db", "primary database"), tOfficial = W("db", "the official");
    const tCache = W("cache", "cache"), tFast = W("cache", "reads");
    // "searchable" is the 2nd hit: the matcher also accepts "search" (in "search index") as a prefix of it.
    const tIndex = W("index", "search index"), tSame = W("index", "same data"), tSearchable = W("index", "searchable", 1);
    const tWorkers = W("workers", "Background"), tChanges = W("workers", "changes"), tQ = W("workers", "queue"), tUpdate = W("workers", "update");
    const tW = k.cue("write");
    // stale: worker lagging → cache holds the old value → next read returns it (stale) → symptom tag.
    const tLag = W("stale", "worker"), tCatch = W("stale", "catches"), tHolds = W("stale", "still holds"), tOld = W("stale", "old value");
    const tRead = W("stale", "next read"), tStaleW = W("stale", "stale"), tSym = W("stale", "our first symptom");
    const tCopies = W("yourjob", "these copies"), tAgree = W("yourjob", "agree"), tWire = W("yourjob", "wiring"), tPromise = W("yourjob", "you made");
    const tFinal = k.lines[k.lines.length - 1].start + 0.1;

    A.show(s.title, t, tTitle);
    const dim = 1 - 0.74 * A.prog(t, tFinal, 0.6);
    s.dia.style.opacity = dim.toFixed(4);

    // ----- build-up
    A.show(s.client.inner, t, tClient, { d: 0.5, dy: 14 });
    s.aCA.draw(t, tCalls, 0.35);
    A.show(s.app.inner, t, tApp, { d: 0.5, dy: 14 });

    s.aAD.draw(t, tWrites, 0.45);
    A.show(s.lWrites.inner, t, tWrites + 0.2, { d: 0.4, dy: 6 });
    A.show(s.db.inner, t, tDB, { d: 0.55, dy: 14 });
    A.show(s.db.role, t, tOfficial, { d: 0.4, dy: 6 });
    A.show(s.db.rowG, t, tOfficial + 0.2, { d: 0.4, dy: 6 });

    const tCacheBox = tCache + 0.25;
    s.aAC.draw(t, tCache - 0.05, 0.5);
    A.show(s.cache.inner, t, tCacheBox, { d: 0.55, dy: 14 });
    A.show(s.cache.rowG, t, tCacheBox + 0.3, { d: 0.4, dy: 6 });
    A.show(s.cache.role, t, tFast, { d: 0.4, dy: 6 });

    const tIndexBox = tIndex + 0.25;
    s.aAI.draw(t, tIndex - 0.05, 0.5);
    A.show(s.index.inner, t, tIndexBox, { d: 0.55, dy: 14 });
    A.show(s.index.rowG, t, tSame, { d: 0.4, dy: 6 });
    A.show(s.index.role, t, tSearchable, { d: 0.4, dy: 6 });

    A.show(s.wL.inner, t, tWorkers, { d: 0.5, dy: 14 });
    A.show(s.wR.inner, t, tWorkers + 0.1, { d: 0.5, dy: 14 });
    s.aDQ.draw(t, tChanges, 0.5);
    A.show(s.lChanges.inner, t, tChanges + 0.2, { d: 0.4, dy: 6 });
    A.show(s.queue.inner, t, tQ, { d: 0.5, dy: 14 });
    s.aQL.draw(t, tQ + 0.3, 0.4);
    s.aQR.draw(t, tQ + 0.3, 0.4);
    s.aWC.draw(t, tUpdate, 0.4);
    s.aWI.draw(t, tUpdate, 0.4);
    A.show(s.lUpdL.inner, t, tUpdate + 0.2, { d: 0.4, dy: 6 });
    A.show(s.lUpdR.inner, t, tUpdate + 0.2, { d: 0.4, dy: 6 });

    // ----- ambient flow; stops when the write demo starts
    const off = 1 - A.prog(t, tW, 0.4);
    const on = (t0) => A.prog(t, t0, 0.4) * off;
    s.pCA.update(t, on(tApp + 0.3));
    s.pAD.update(t, on(tDB + 0.3));
    s.pAC.update(t, on(tCacheBox + 0.3));
    s.pAI.update(t, on(tIndexBox + 0.3));
    s.pDQ.update(t, on(tQ + 0.1));
    s.pQL.update(t, on(tQ + 0.5));
    s.pQR.update(t, on(tQ + 0.5));
    s.pWC.update(t, on(tUpdate + 0.4));
    s.pWI.update(t, on(tUpdate + 0.4));

    // ----- write: Client → App → DB, landing on "database"; DB value flips to $20; the change event parks in the queue.
    // ("write" is heard as "right" by the recognizer, so this anchor uses the caption-position fallback, ±0.1 s.)
    const tWp = W("write", "a write"), tLand = W("write", "database");
    A.show(s.writePill, t, tWp, { d: 0.45, dy: 10, out: k.cue("yourjob"), max: dim });
    travel(s.tokWrite, t, [{ a: s.aCA, t0: tWp + 0.1, d: 0.35 }, { a: s.aAD, t0: tLand - 0.5, d: 0.5 }]);
    const landed = t >= tLand;
    const flash = A.win(t, tLand, tLand + 0.6, 0.25);
    const fresh = A.prog(t, tLand, 0.3);
    s.db.val.textContent = landed ? "$20" : "$18";
    s.db.val.setAttribute("fill", landed ? C.hl : C.ink);
    s.db.row.setAttribute("stroke", A.mix(C.line, C.hl, fresh));
    s.db.row.setAttribute("fill", A.mix(C.bg2, "#5A4A1C", flash));
    s.db.status.textContent = "new";
    s.db.status.setAttribute("fill", C.hl);
    A.setOpacity(s.db.status, fresh);
    A.setOpacity(s.db.status2, 0);
    const tChg = tLand + 0.25, tParked = tChg + 0.45;
    travel(s.tokChange, t, [{ a: s.aDQ, t0: tChg, d: 0.45 }]);
    A.show(s.pendIn, t, tParked - 0.05, { d: 0.4, dy: 0, s0: 0.5, ease: A.E.outBack });

    // ----- stale ①: "Until a worker catches up" — the cache's worker is busy (gear turning, amber) and the $20 change still
    // waits in the queue; it never reaches the cache in this scene.
    const lag = A.prog(t, tLag, 0.5);
    const spin = 150 * Math.max(0, t - tLag) * Math.min(1, Math.max(0, t - tLag) / 0.6 + 0.4);
    s.wL.icon.setAttribute("transform", `${s.wLIconT} rotate(${(spin % 360).toFixed(2)} 32 32)`);
    A.show(s.lLag.inner, t, tCatch, { d: 0.45, dx: -10, dy: 0 });
    const wait = A.prog(t, tLag, 0.4) * (0.5 + 0.5 * Math.sin((t - tLag) * 5.2));
    s.pendIn.querySelector("rect").setAttribute("stroke-width", (2.5 + 2 * wait).toFixed(2));

    // ----- stale ②: "the cache still holds the old value" — its $18 is flagged "old" (not yet called stale).
    const hold = A.prog(t, tHolds, 0.5);
    const stale = A.prog(t, tStaleW, 0.35);
    s.cache.row.setAttribute("stroke", A.mix(A.mix(C.line, C.bad, 0.75 * hold), C.bad, stale));
    s.cache.row.setAttribute("fill", A.mix(C.bg2, "#3A1620", Math.max(0.6 * hold, stale)));
    s.cache.val.textContent = "$18";
    s.cache.val.setAttribute("fill", A.mix(C.ink, C.bad, hold));
    s.cache.status2.textContent = "old";
    s.cache.status2.setAttribute("fill", C.bad);
    // "old" hands over to "stale" in place: fade out first, then fade in (no double-printed text mid-swap).
    A.setOpacity(s.cache.status2, A.prog(t, tOld, 0.4) * (1 - A.prog(t, tStaleW, 0.15, A.E.inOutCubic)));
    // ----- stale ③: the next read is served from the cache: the reply leaves with $18 as the narrator says "stale".
    s.cache.status.textContent = "stale";
    s.cache.status.setAttribute("fill", C.bad);
    A.setOpacity(s.cache.status, A.prog(t, tStaleW + 0.15, 0.3));
    s.cache.setTone("bad", stale);
    s.cache.glow.setAttribute("opacity", (stale * (0.42 + 0.18 * Math.sin(t * 4.2))).toFixed(3));
    const stI = A.prog(t, tCopies, 0.5);
    staleRow(s.index, stI);
    s.index.glow.setAttribute("opacity", "0");
    s.db.glow.setAttribute("opacity", "0");

    // Request leaves on "next read"; the reply (with $18) reaches the client on "data" (legs derived backward from it).
    const tGot = W("stale", "data"), tRespOut = tGot - 0.6;
    travel(s.tokRead, t, [{ a: s.aCA, t0: tRead, d: 0.2 }, { a: s.aAC, t0: tRead + 0.2, d: 0.4 }]);
    travel(s.tokResp, t, [{ a: s.aAC, t0: tRespOut, d: 0.4, rev: true }, { a: s.aCA, t0: tRespOut + 0.4, d: 0.2, rev: true }]);
    s.client.setTone("bad", A.prog(t, tGot, 0.4));
    // Both leave as the takeaway card arrives, so nothing rests on the card's top edge.
    A.show(s.readPill, t, tGot, { d: 0.45, dx: -14, dy: 0, max: dim, out: tFinal });
    // ----- stale ④: the symptom tag, on "our first symptom".
    A.show(s.symptom, t, tSym, { d: 0.45, dy: 10, max: dim, out: tFinal });

    // ----- yourjob: the copies disagree; the wiring (your code) is what owns keeping them in sync.
    s.neq.forEach((n, i) => A.show(n, t, tAgree - 0.1 + i * 0.15, { d: 0.4, dy: 0, s0: 0.5, ease: A.E.outBack }));
    const wire = A.prog(t, tWire, 0.6);
    const wireCol = A.mix(C.line2, C.hl, wire);
    [s.aAC, s.aAI, s.aAD, s.aDQ, s.aQL, s.aQR, s.aWC, s.aWI].forEach((a) => a.setTone(wireCol));
    [s.app, s.queue, s.wR].forEach((b) => b.setTone("hl", wire));
    s.wL.setTone("hl", Math.max(lag, wire));
    // The scene's takeaway: stays at full strength through the end card (not dimmed with the diagram).
    A.show(s.job, t, tPromise, { d: 0.5, dy: 10 });

    // ----- final line: the takeaway card over the dimmed diagram.
    A.show(s.goal, t, tFinal + 0.1, { s0: 0.96, dy: 10 });
    // The Client→App arrow tip lands exactly on the card's top edge (y≈392); fade it so no outline touches the card.
    // (Opacity only: draw() owns its visibility.)
    s.aCA.g.style.opacity = (1 - A.prog(t, tFinal, 0.4)).toFixed(4);

    function staleRow(n, p) {
      n.row.setAttribute("stroke", A.mix(C.line, C.bad, p));
      n.row.setAttribute("fill", A.mix(C.bg2, "#3A1620", p));
      n.val.textContent = "$18";
      n.val.setAttribute("fill", A.mix(C.ink, C.bad, p));
      n.status.textContent = "stale";
      n.status.setAttribute("fill", C.bad);
      A.setOpacity(n.status, p);
      A.setOpacity(n.status2, 0);
    }
    // Move a single token along a sequence of arrow legs; hidden outside its journey.
    function travel(node, tt, legs) {
      let pos = null;
      for (const L of legs) {
        if (tt >= L.t0 && tt <= L.t0 + L.d) {
          const p = A.E.inOutSine((tt - L.t0) / L.d);
          pos = L.a.point(L.rev ? 1 - p : p);
        }
      }
      // Also bridge tiny gaps between legs (keep the token at the joint).
      if (!pos) {
        for (let i = 0; i < legs.length - 1; i++) {
          const a = legs[i], b = legs[i + 1];
          if (tt > a.t0 + a.d && tt < b.t0) pos = a.a.point(a.rev ? 0 : 1);
        }
      }
      if (pos) { node.setAttribute("cx", pos[0].toFixed(1)); node.setAttribute("cy", pos[1].toFixed(1)); }
      node.style.opacity = pos ? "1" : "0";
      node.style.visibility = pos ? "visible" : "hidden";
    }
  },
});
