// S15 — Response time vs latency: one request split into segments, then the same request repeated 40× with random delays.
R.scene("response-time", {
  build(root, k) {
    const s = {};
    const C = K.C;
    s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "What does “slow” mean?" });
    const svg = K.svgLayer(root);

    // ---- One request as a segmented time bar (left → right = time).
    const BX = 180, BY = 344, BH = 112, GAP = 10;
    const defs = [
      { label: "Network", sub: "to the server", w: 240 },
      { label: "Queue", sub: "waiting its turn", w: 430 },
      { label: "Service time", sub: "the work itself", w: 630 },
      { label: "Network", sub: "back to client", w: 230 },
    ];
    // Faint track for the request's journey (segments cover it as they grow).
    const trackEnd = BX + defs.reduce((a, d) => a + d.w, 0) + GAP * (defs.length - 1);
    s.track = U.sv("line", { x1: BX, x2: trackEnd, y1: BY + BH / 2, y2: BY + BH / 2, stroke: C.line2, "stroke-width": 3, "stroke-dasharray": "3 15", "stroke-linecap": "round" }, svg);
    let x = BX;
    s.segs = defs.map((d) => {
      const g = U.sv("g", { transform: `translate(${x},${BY})` }, svg);
      const rect = U.sv("rect", { x: 0, y: 0, width: d.w, height: BH, rx: 16, "stroke-width": 3 }, g);
      const txt = U.sv("g", {}, g);
      const lab = U.sv("text", { x: d.w / 2, y: BH / 2 - 4, "text-anchor": "middle", "font-size": 34, "font-weight": 750, fill: C.ink }, txt, d.label);
      const sub = U.sv("text", { x: d.w / 2, y: BH / 2 + 30, "text-anchor": "middle", "font-size": 26, "font-weight": 550, fill: C.muted }, txt, d.sub);
      const seg = { g, rect, txt, lab, sub, x, w: d.w };
      x += d.w + GAP;
      return seg;
    });
    s.BX = BX; s.BY = BY; s.BH = BH; s.BX1 = x - GAP;
    // The request itself.
    s.dot = U.sv("circle", { r: 13, fill: C.hl }, svg);

    // ---- Response-time bracket over the whole bar.
    const mid = (BX + s.BX1) / 2, yb = BY - 22, yt = BY - 42;
    s.brL = U.sv("path", { d: `M${mid},${yt} L${BX},${yt} L${BX},${yb}`, fill: "none", stroke: C.sca, "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round" }, svg);
    s.brR = U.sv("path", { d: `M${mid},${yt} L${s.BX1},${yt} L${s.BX1},${yb}`, fill: "none", stroke: C.sca, "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round" }, svg);
    s.respLbl = K.text(root, { x: mid, y: 222, w: 1200, align: "center", cls: "label",
      html: `<span style="font-size:42px;font-weight:800;color:${C.sca}">Response time</span><span class="sub" style="color:${C.muted};font-weight:550;font-size:32px">&nbsp;&nbsp;what the client waits for</span>` });
    s.respSub = s.respLbl.querySelector(".sub");

    // ---- Latency bracket under the queue segment.
    const q = s.segs[1], lyt = BY + BH + 20, lyb = BY + BH + 40;
    s.brLat = U.sv("path", { d: `M${q.x},${lyt} L${q.x},${lyb} L${q.x + q.w},${lyb} L${q.x + q.w},${lyt}`, fill: "none", stroke: C.hl, "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round" }, svg);
    s.latLbl = K.text(root, { x: q.x + q.w / 2 + 40, y: lyb + 14, w: 700, align: "center", cls: "label",
      html: `<span style="font-size:42px;font-weight:800;color:${C.hl}">Latency</span><span class="sub" style="color:${C.muted};font-weight:550;font-size:32px">&nbsp;&nbsp;waiting to be handled</span>` });
    s.latSub = s.latLbl.querySelector(".sub");

    // ---- The same request, repeated 40 times: a strip of response-time columns.
    s.repLbl = K.text(root, { x: 180, y: 596, cls: "label", color: "muted", text: "Response time of the same request, 40 times" });
    s.legend = K.text(root, { x: 1740 - 380, y: 596, w: 380, align: "left", cls: "label",
      html: `<span style="display:inline-block;width:22px;height:22px;border-radius:5px;background:${C.bad};margin-right:12px;vertical-align:-2px"></span><span style="color:${C.ink}">random added delay</span>` });
    s.legend.style.textAlign = "right"; s.legend.style.left = 1740 - 380 + "px";

    // Cause chips: one row, centred over the strip; spikes sit under each chip.
    const causes = ["GC pause", "Context switch", "Lost packet + TCP retransmit", "Page fault", "Rack vibration"];
    const prevDisp = root.style.display; root.style.display = "block";
    s.chips = causes.map((c) => K.chip(root, { x: 0, y: 0, text: c, accent: "bad", size: 28 }));
    const widths = s.chips.map((n) => n.offsetWidth);
    const chipH = s.chips[0].offsetHeight || 62;
    root.style.display = prevDisp;
    const total = widths.reduce((a, b) => a + b, 0);
    const SX0 = 180, SX1 = 1740;
    const gapC = (SX1 - SX0 - total) / (causes.length - 1);
    const CHIP_Y = 640;
    let cx = SX0;
    const centers = widths.map((w, i) => { const c = cx + w / 2; s.chips[i].style.left = cx + "px"; s.chips[i].style.top = CHIP_Y + "px"; cx += w + gapC; return c; });
    s.chipBottom = CHIP_Y + chipH;

    // Columns.
    const N = 40, pitch = (SX1 - SX0) / N, cw = 26, BASE = 912;
    const rnd = U.rng(1517);
    const spikeAt = centers.map((c) => Math.max(0, Math.min(N - 1, Math.round((c - SX0) / pitch - 0.5))));
    s.base = U.sv("line", { x1: SX0 - 8, x2: SX1 + 8, y1: BASE + 1.5, y2: BASE + 1.5, stroke: C.line2, "stroke-width": 3, "stroke-linecap": "round" }, svg);
    // Hex mix (A.mix returns rgb(), which A.mix cannot take back as input).
    const baseFill = "#" + [0, 2, 4].map((j) => Math.round(U.lerp(parseInt(C.bg.slice(1 + j, 3 + j), 16), parseInt(C.sca.slice(1 + j, 3 + j), 16), 0.55)).toString(16).padStart(2, "0")).join("");
    s.baseFill = baseFill;
    s.cols = [];
    for (let i = 0; i < N; i++) {
      const h0 = 58 + rnd() * 34;
      const si = spikeAt.indexOf(i);
      const extra = si >= 0 ? 74 + rnd() * 40 : 0;
      const colX = SX0 + i * pitch + (pitch - cw) / 2;
      const g = U.sv("g", { transform: `translate(${colX.toFixed(1)},${BASE})` }, svg);
      const inner = U.sv("g", {}, g);
      const r0 = U.sv("rect", { x: 0, y: -h0, width: cw, height: h0, rx: 4, fill: baseFill }, inner);
      let r1 = null;
      if (extra) r1 = U.sv("rect", { x: 0, y: -h0 - extra, width: cw, height: extra + 4, rx: 4, fill: baseFill }, inner);
      s.cols.push({ g, inner, r0, r1, h0, extra, si, cx: colX + cw / 2, top: BASE - h0 - extra });
    }
    // Leader lines from each chip down to its spike.
    s.leads = centers.map((c, i) => {
      const col = s.cols[spikeAt[i]];
      return U.sv("path", { d: `M${col.cx.toFixed(1)},${s.chipBottom + 6} L${col.cx.toFixed(1)},${(col.top - 10).toFixed(1)}`, fill: "none", stroke: C.bad, "stroke-width": 3, "stroke-linecap": "round" }, svg);
    });
    return s;
  },

  update(t, k, s) {
    const C = K.C;
    // Word anchor; extra needles are fallbacks (the recognizer heard "queue" as "cue").
    const wd = (ref, ...needles) => { for (const n of needles) { try { return k.word(ref, n); } catch (e) { /* next */ } } throw new Error("no anchor " + needles); };
    const cResp = k.cue("response"), cLat = k.cue("latency"), cRep = k.cue("repeat");

    A.show(s.title, t, 0.1);

    // Segments grow one after another as the narrator names them; a single leading edge sweeps the bar.
    const words = [k.word("segments", "network"), wd("segments", "cue", "queue"), k.word("segments", "work"), k.word("segments", "network", 1)];
    const SPEED = 1000; // px per second
    let prevEnd = -1;
    const sched = s.segs.map((g, i) => { const t0 = Math.max(words[i], prevEnd); const t1 = t0 + g.w / SPEED; prevEnd = t1; return [t0, t1]; });
    const lat = A.prog(t, cLat + 0.1, 0.5);
    let edge = null;
    s.segs.forEach((g, i) => {
      const [t0, t1] = sched[i];
      const p = U.clamp((t - t0) / (t1 - t0));
      const w = Math.max(0.01, g.w * p);
      g.rect.setAttribute("width", w.toFixed(1));
      g.rect.style.visibility = p > 0 ? "visible" : "hidden";
      const tone = i === 1 ? A.mix(K.TONES.neutral.fill, K.TONES.hl.fill, lat) : K.TONES.neutral.fill;
      g.rect.setAttribute("fill", tone);
      g.rect.setAttribute("stroke", i === 1 ? A.mix(K.TONES.neutral.stroke, C.hl, lat) : K.TONES.neutral.stroke);
      A.show(g.txt, t, t1 - 0.05, { d: 0.45, dy: 10 });
      if (p > 0) edge = g.x + w; // last started segment wins: between segments the dot waits at the end of the grown one
    });
    // The request dot rides the leading edge, then rests at the end and fades.
    const tEnd = sched[3][1];
    const dx = edge != null ? edge : s.BX;
    s.dot.setAttribute("cx", dx.toFixed(1));
    s.dot.setAttribute("cy", (s.BY + s.BH / 2).toFixed(1));
    // "Follow one request": the dot and its track appear on "one request", the dot waits at the start.
    const tFollow = k.word("segments", "one request");
    A.setOpacity(s.dot, A.prog(t, tFollow, 0.3) * (1 - A.prog(t, tEnd + 0.3, 0.4)));
    const pulse = t > tFollow && t < sched[0][0] ? 1 + 0.12 * Math.sin((t - tFollow) * 7) : 1;
    s.dot.setAttribute("r", (13 * pulse).toFixed(2));
    A.setOpacity(s.track, 0.9 * A.prog(t, tFollow, 0.5) * (1 - A.prog(t, tEnd, 0.3)));

    // Response time: bracket over everything; the gloss lands on "what the client waits for".
    A.draw(s.brL, t, cResp + 0.1, 0.6);
    A.draw(s.brR, t, cResp + 0.1, 0.6);
    A.show(s.respLbl, t, cResp + 0.2, { dy: 12 });
    A.setOpacity(s.respSub, A.prog(t, k.word("response", "what") - 0.05, 0.45));

    // Latency: queue segment turns yellow; bracket under it; the gloss lands on "waiting to be handled".
    A.draw(s.brLat, t, cLat + 0.15, 0.5);
    A.show(s.latLbl, t, cLat + 0.3, { dy: -12 });
    A.setOpacity(s.latSub, A.prog(t, k.word("latency", "waiting") - 0.05, 0.45));

    // Repeat: 40 columns grow in quick succession (done as "the times still vary").
    A.show(s.repLbl, t, cRep + 0.05, { dy: 10 });
    s.cols.forEach((c, i) => {
      const p = A.prog(t, cRep + 0.25 + i * 0.04, 0.35);
      c.inner.style.transformOrigin = "bottom"; c.inner.style.transformBox = "fill-box";
      c.inner.style.transform = `scaleY(${p.toFixed(4)})`;
      c.inner.style.visibility = p <= 0.001 ? "hidden" : "visible";
    });
    s.base.style.opacity = A.prog(t, cRep + 0.1, 0.4).toFixed(3);

    // Causes: each chip lands as it is named; its spike's extra delay turns red.
    A.show(s.legend, t, k.word("causes", "random"), { dy: 10 });
    ["garbage", "context", "lost", "page", "vibrating"].forEach((needle, i) => {
      const t0 = k.word("causes", needle);
      A.show(s.chips[i], t, t0, { dy: 14, d: 0.5 });
      A.draw(s.leads[i], t, t0 + 0.2, 0.4);
      const col = s.cols.find((c) => c.si === i);
      col.r1.setAttribute("fill", A.mix(s.baseFill, C.bad, A.prog(t, t0 + 0.3, 0.4)));
    });
  },
});
