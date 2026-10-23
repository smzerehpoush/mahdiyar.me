// S10 — Chaos engineering + safety nets. Error-handling code rarely runs, so bugs hide there; Chaos Monkey terminates a random
// node, the recovery path runs and the cluster replaces the node automatically. Callback: deliberately killing a cache worker tests
// whether stale data is caught before users see it. Then the safety nets for human mistakes, as chips, with a tiny echo of the
// `humans` scene: a gradual rollout means the bad "timeout: 30ms" hits only one of six servers (there it hit all six).
// Every beat is anchored to its spoken word with k.word().
R.scene("chaos", {
  build(root, k) {
    const C = K.C, s = {};
    s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Make recovery routine." });
    const svg = K.svgLayer(root);

    // ---- Beat `errhandling` (left): code paths — the normal path runs all the time, error handling rarely.
    s.code = U.sv("g", {}, svg);
    s.codeHdr = K.label(s.code, { x: 120, y: 306, text: "Code paths", anchor: "start", size: 34, weight: 750, fill: "muted" });
    s.req = K.box(s.code, { x: 120, y: 410, w: 200, h: 100, label: "Request", fs: 32 });
    s.norm = K.box(s.code, { x: 470, y: 350, w: 330, h: 90, label: "Normal path", fs: 32 });
    s.err = K.box(s.code, { x: 470, y: 480, w: 330, h: 110, label: "Error handling", sub: "rarely runs", fs: 33, tone: "ghost" });
    s.aNorm = K.arrow(s.code, { from: s.req.right, to: s.norm.left, gapStart: 14, gapEnd: 14 });
    s.aErrD = K.arrow(s.code, { from: s.req.right, to: s.err.left, gapStart: 14, gapEnd: 14, dashed: true });
    s.aErr = K.arrow(s.code, { from: s.req.right, to: s.err.left, gapStart: 14, gapEnd: 14, tone: "rel" });
    s.pNorm = K.packets(s.code, s.aNorm, { n: 3, period: 1.2 });
    s.pErr = K.packets(s.code, s.aErr, { n: 2, period: 1.2, tone: "rel" });
    // Bug badge on the error-handling box (red disc + small bug glyph, in the style of K.mark).
    s.bug = (() => {
      const g = U.sv("g", { transform: "translate(800,480)" }, s.code);
      const inner = U.sv("g", {}, g);
      U.sv("circle", { r: 30, fill: C.bad }, inner);
      const ink = { stroke: C.bg, "stroke-width": 3.2, "stroke-linecap": "round", fill: "none" };
      U.sv("ellipse", { cx: 0, cy: 5, rx: 8.5, ry: 11.5, fill: C.bg }, inner);
      U.sv("circle", { cx: 0, cy: -10, r: 5.5, fill: C.bg }, inner);
      U.sv("path", { d: "M-8,0 L-17,-6 M-8,6 L-18,6 M-7,12 L-16,18 M8,0 L17,-6 M8,6 L18,6 M7,12 L16,18 M-3,-14 L-8,-21 M3,-14 L8,-21", ...ink }, inner);
      return { g, inner };
    })();
    s.bugLbl = K.label(s.code, { x: 120, y: 650, text: "Bugs hide in code that rarely runs", anchor: "start", size: 32, weight: 700, fill: "bad" });

    // ---- Beat `monkey` (right): a 3×3 cluster and Chaos Monkey.
    s.clu = U.sv("g", {}, svg);
    s.cluHdr = K.label(s.clu, { x: 940, y: 306, text: "Cluster", anchor: "start", size: 34, weight: 750, fill: "muted" });
    const NW = 140, NH = 80, G = 28, CX0 = 940, CY0 = 350;
    s.nodes = [];
    for (let i = 0; i < 9; i++) {
      const x = CX0 + (i % 3) * (NW + G), y = CY0 + Math.floor(i / 3) * (NH + G);
      const b = K.box(s.clu, { x, y, w: NW, h: NH, label: "", r: 16 });
      b.ic = K.svgIcon(b.inner, "server", { x: NW / 2 - 22, y: NH / 2 - 22, size: 44, color: "ink", sw: 3.5 });
      s.nodes.push(b);
    }
    // Seeded "random" choice: three hover hops, then the target.
    const rnd = U.rng(7), pool = [...Array(9).keys()], pick = () => pool.splice(Math.floor(rnd() * pool.length), 1)[0];
    s.hops = [pick(), pick(), pick()];
    s.target = pick();
    const T = s.nodes[s.target];
    // Replacement node (fades into the dead node's slot) and status rings.
    s.ringDet = U.sv("rect", { x: T.x, y: T.y, width: NW, height: NH, rx: 16, fill: "none", stroke: C.hl, "stroke-width": 4 }, s.clu);
    s.fresh = K.box(s.clu, { x: T.x, y: T.y, w: NW, h: NH, label: "", r: 16, tone: "ok" });
    s.fresh.ic = K.svgIcon(s.fresh.inner, "server", { x: NW / 2 - 22, y: NH / 2 - 22, size: 44, color: "ok", sw: 3.5 });
    s.ringNew = U.sv("rect", { x: T.x, y: T.y, width: NW, height: NH, rx: 16, fill: "none", stroke: C.ok, "stroke-width": 4 }, s.clu);
    s.xMark = K.mark(s.clu, "x", { x: T.x + NW - 4, y: T.y + 4, size: 44 });

    // Chaos Monkey token (stays home) + pointer line + reticle that hops over nodes.
    s.mon = U.sv("g", {}, svg);
    s.ptr = U.sv("line", { stroke: C.hl, "stroke-width": 3, "stroke-dasharray": "8 10", "stroke-linecap": "round" }, s.mon);
    s.monTok = (() => {
      const g = U.sv("g", { transform: "translate(1650,440)" }, s.mon);
      const inner = U.sv("g", {}, g);
      U.sv("circle", { r: 64, fill: "#3A3216", stroke: C.hl, "stroke-width": 3 }, inner);
      const ic = K.svgIcon(inner, "monkey", { x: -42, y: -44, size: 84, color: "hl", sw: 3.4 });
      return { g, inner, ic };
    })();
    s.monLbl = K.label(s.mon, { x: 1650, y: 562, text: "Chaos Monkey", size: 34, weight: 750, fill: "hl" });
    s.monSub = K.label(s.mon, { x: 1650, y: 600, text: "Netflix", size: 28, weight: 600, fill: "muted" });
    s.ret = U.sv("g", {}, s.mon);
    s.retStroke = [
      U.sv("circle", { r: 30, fill: "none", stroke: C.hl, "stroke-width": 4 }, s.ret),
      U.sv("path", { d: "M0,-44 V-20 M0,20 V44 M-44,0 H-20 M20,0 H44", stroke: C.hl, "stroke-width": 4, "stroke-linecap": "round" }, s.ret),
    ];
    s.retDot = U.sv("circle", { r: 5, fill: C.hl }, s.ret);

    s.pill = K.pill(root, { x: 0, y: 268, text: "9/9 nodes healthy", tone: "ok" });
    s.pill.style.left = "auto"; s.pill.style.right = "140px";

    // ---- Uncued line after `heal`: a deliberate chaos experiment on the composite example's cache worker.
    s.cb = U.el("div", {}, root);
    Object.assign(s.cb.style, { position: "absolute", inset: "0" });
    s.cbKick = K.text(s.cb, { x: 120, y: 700, cls: "label", color: "muted", html: `<span style="color:${C.hl}">Chaos experiment</span> on our example` });
    const cbSvg = K.svgLayer(s.cb);
    Object.assign(cbSvg.style, { position: "absolute", left: "0", top: "0", width: "1920px", height: "1080px", overflow: "visible" });
    s.wk = K.box(cbSvg, { x: 120, y: 760, w: 380, h: 110, label: "Cache worker", sub: "updating cache", icon: "gear", iconInline: true, iconSize: 42, fs: 33 });
    s.cache = K.box(cbSvg, { x: 640, y: 760, w: 330, h: 110, label: "Cache", sub: "up to date", icon: "cache", iconInline: true, iconSize: 42, fs: 33 });
    s.aWC = K.arrow(cbSvg, { from: s.wk.right, to: s.cache.left, gapStart: 14, gapEnd: 14 });
    s.pWC = K.packets(cbSvg, s.aWC, { n: 2, period: 1.1 });
    s.aCU = K.arrow(cbSvg, { from: s.cache.right, to: [1110, s.cache.cy], gapStart: 14, gapEnd: 14 });
    s.wkX = K.mark(cbSvg, "x", { x: 500 - 4, y: 764, size: 44 });
    // Aiming reticle (Chaos Monkey's, scaled to fit inside the box), centred on the worker's gear icon: the kill is deliberate.
    s.ret2 = U.sv("g", { transform: "translate(163,815)" }, cbSvg);
    s.ret2In = U.sv("g", {}, s.ret2);
    s.ret2Stroke = [
      U.sv("circle", { r: 22, fill: "none", stroke: C.hl, "stroke-width": 4 }, s.ret2In),
      U.sv("path", { d: "M0,-31 V-14 M0,14 V31 M-31,0 H-14 M14,0 H31", stroke: C.hl, "stroke-width": 4, "stroke-linecap": "round" }, s.ret2In),
    ];
    s.stale = K.pill(s.cb, { x: 1120, y: 783, text: "Caught before users?", tone: "hl" });

    // ---- Beat `practices`: safety nets as chips (two rows, revealed as each is named).
    s.prHdr = K.text(root, { x: 120, y: 694, cls: "label", text: "Safety nets for human mistakes", color: "rel" });
    s.prHdr.style.fontSize = "34px"; s.prHdr.style.fontWeight = 750;
    const r1 = K.chips(root, { x: 120, y: 756, w: 1680, accent: "rel", size: 34, items: [
      { text: "Tests", icon: "check" }, { text: "Sandboxes", icon: "flask" }, { text: "Gradual rollouts", icon: "rocket" }] });
    const r2 = K.chips(root, { x: 120, y: 850, w: 1680, accent: "rel", size: 34, items: [
      { text: "Fast rollback", icon: "undo" }, { text: "Monitoring", icon: "eye" }, { text: "Safe tools to recompute data", icon: "wrench" }] });
    s.chips = [...r1.chips, ...r2.chips];

    // "…so a bad timeout hits only a few servers": the `humans` typo again, now rolled out gradually (flows after the rollout chip).
    s.link = U.el("div", {}, r1.box);
    Object.assign(s.link.style, { position: "relative", display: "flex", alignItems: "center", gap: "14px", marginLeft: "14px" });
    s.lTag = U.el("div", { class: "mono" }, s.link);
    Object.assign(s.lTag.style, { fontSize: "32px", whiteSpace: "nowrap", color: C.muted });
    s.lTag.innerHTML = `timeout: <span style="color:${C.bad};background:rgba(255,107,127,.16);border-radius:6px;padding:0 5px">30ms</span>`;
    s.lArrow = U.el("div", {}, s.link);
    s.lArrow.innerHTML = `<svg width="46" height="24" viewBox="0 0 46 24" style="display:block"><path d="M2 12 H40 M31 4 L41 12 L31 20" fill="none" stroke="${C.muted}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    s.lSrv = U.el("div", {}, s.link);
    Object.assign(s.lSrv.style, { display: "flex", gap: "10px" });
    s.minis = [0, 1, 2, 3, 4, 5].map(() => {
      const m = U.el("div", {}, s.lSrv);
      Object.assign(m.style, { width: "52px", height: "52px", boxSizing: "border-box", borderRadius: "12px", border: "3px solid", display: "flex", alignItems: "center", justifyContent: "center" });
      m.innerHTML = K.iconSvg("server", 30, "currentColor", 4);
      return m;
    });
    return s;
  },

  update(t, k, s) {
    const C = K.C;
    const iHeal = k.lineIndex("heal"), iPr = k.lineIndex("practices");
    const iCb = iHeal + 1, iPr2 = iPr + 1, cCb = k.lines[iCb].start, cPr = k.cue("practices");
    // Word anchors (whisper timings) for every beat.
    const wFault = k.word("errhandling", "Fault"), wErr = k.word("errhandling", "error"), wRarely = k.word("errhandling", "rarely");
    const wBugs = k.word("errhandling", "bugs");
    const wInject = k.word("monkey", "inject"), wNetflix = k.word("monkey", "Netflix"), wChaos = k.word("monkey", "Chaos Monkey");
    const wRand = k.word("kill", "randomly"), wTerm = k.word("kill", "terminates"), wRec = k.word("kill", "recovery"), wRuns = k.word("kill", "runs");
    const wNotices = k.word("heal", "notices"), wRepl = k.word("heal", "replaces");
    // "cache" is transcribed as "cash", so the experiment anchors on "worker".
    const wKilling = k.word(iCb, "Killing"), wWorker = k.word(iCb, "worker"), wPurpose = k.word(iCb, "on purpose");
    const wStale = k.word(iCb, "stale"), wBefore = k.word(iCb, "before");
    const wHuman = k.word("practices", "human"), wBad = k.word("practices", "bad timeout"), wHits = k.word("practices", "hits");
    const chipAt = [k.word("practices", "tests"), k.word("practices", "sandboxes"), k.word("practices", "gradual"),
      k.word(iPr2, "fast"), k.word(iPr2, "monitoring"), k.word(iPr2, "safe tools")];
    A.show(s.title, t, 0.1);

    // The upper diagram recedes in two steps: once for the experiment row, again for the practices.
    const dim = 1 - 0.3 * A.prog(t, cCb + 0.1, 0.6) - 0.3 * A.prog(t, cPr + 0.1, 0.6);
    const calm = 1 - A.prog(t, cPr, 0.6); // packet loops stop once the practices start

    // Left: code paths. Normal path with "Fault tolerance…"; error handling on "error-handling"; "rarely runs"; bug on "bugs hide".
    const codeOp = A.prog(t, wFault - 0.05, 0.5) * dim;
    s.code.style.opacity = codeOp.toFixed(3);
    s.code.style.visibility = codeOp > 0.002 ? "visible" : "hidden";
    A.show(s.codeHdr.inner, t, wFault - 0.05, { dy: 8 });
    A.show(s.req.inner, t, wFault + 0.05, { dy: 12 });
    A.show(s.norm.inner, t, wFault + 0.25, { dy: 12 });
    s.aNorm.draw(t, wFault + 0.25, 0.5);
    s.pNorm.update(t, A.prog(t, wFault + 0.55, 0.4) * calm);
    A.show(s.err.inner, t, wErr - 0.05, { dy: 12 });
    s.aErrD.draw(t, wErr - 0.05, 0.5);
    A.show(s.bug.inner, t, wBugs - 0.05, { d: 0.45, dy: 0, s0: 0.3, ease: A.E.outBack });
    A.show(s.bugLbl.inner, t, wBugs + 0.1, { dy: 10 });

    // Recovery path lights up on "recovery code"; the sub-label flips to "runs regularly" as it is said.
    const run = A.prog(t, wRec, 0.5);
    s.err.setTone("rel", run, "ghost");
    const swap = wRuns - 0.05;
    s.err.sub.textContent = t >= swap ? "runs regularly" : "rarely runs";
    const dip = A.prog(t, swap - 0.15, 0.15) * (1 - A.prog(t, swap, 0.25));
    A.setOpacity(s.err.sub, A.prog(t, wRarely - 0.05, 0.4) * (1 - dip));
    s.aErr.draw(t, wRec, 0.5);
    s.aErrD.setOpacity(t < wRec ? A.prog(t, wErr - 0.05, 0.5) : 1 - run);
    s.pErr.update(t, A.prog(t, wRec + 0.35, 0.4) * calm);
    A.setOpacity(s.bug.g, 1 - A.prog(t, wRuns, 0.6));

    // Right: cluster on "inject faults"; Chaos Monkey token + "Netflix" on "Netflix's", its name on "Chaos Monkey".
    const cluOp = A.prog(t, wInject - 0.05, 0.5) * dim;
    s.clu.style.opacity = cluOp.toFixed(3);
    s.clu.style.visibility = cluOp > 0.002 ? "visible" : "hidden";
    s.nodes.forEach((b, i) => A.show(b.inner, t, wInject + i * 0.06, { dy: 10, d: 0.5 }));
    const monOp = A.prog(t, wNetflix - 0.05, 0.5) * dim;
    s.mon.style.opacity = monOp.toFixed(3);
    s.mon.style.visibility = monOp > 0.002 ? "visible" : "hidden";
    A.show(s.monTok.inner, t, wNetflix - 0.05, { dy: 0, s0: 0.6, d: 0.55, ease: A.E.outBack });
    A.show(s.monSub.inner, t, wNetflix + 0.05, { dy: 10 });
    A.show(s.monLbl.inner, t, wChaos - 0.05, { dy: 10 });

    // Kill: the reticle hops at random over nodes on "randomly" and strikes the target during "terminates".
    const tStrike = wTerm + 0.35, md = 0.22;
    const centers = s.nodes.map((b) => [b.cx, b.cy]);
    const path = [...s.hops, s.target].map((i) => centers[i]);
    const hopT = [wRand, tStrike - 0.56, tStrike - 0.31, tStrike - 0.06]; // time the reticle settles on each position
    let [rx, ry] = path[0];
    for (let j = 1; j < path.length; j++) {
      const p = A.prog(t, hopT[j] - md, md, A.E.inOutCubic);
      if (p > 0) { rx = U.lerp(path[j - 1][0], path[j][0], p); ry = U.lerp(path[j - 1][1], path[j][1], p); }
    }
    s.ret.setAttribute("transform", `translate(${rx.toFixed(1)},${ry.toFixed(1)})`);
    const retOp = A.prog(t, wRand - 0.03, 0.25) * (1 - A.prog(t, tStrike + 0.9, 0.4));
    A.setOpacity(s.ret, retOp);
    const strike = A.prog(t, tStrike, 0.15) * (1 - A.prog(t, tStrike + 0.4, 0.4));
    s.ptr.setAttribute("x1", 1650 - 66); s.ptr.setAttribute("y1", 440);
    s.ptr.setAttribute("x2", rx.toFixed(1)); s.ptr.setAttribute("y2", ry.toFixed(1));
    s.ptr.setAttribute("stroke", strike > 0.5 ? C.bad : C.hl);
    A.setOpacity(s.ptr, retOp * (0.55 + 0.45 * strike));
    const retCol = strike > 0.5 ? C.bad : C.hl;
    s.retStroke.forEach((n) => n.setAttribute("stroke", retCol));
    s.retDot.setAttribute("fill", retCol);

    // Target node: red → empty slot; detection pings on "notices"; the replacement lands on "replaces".
    const T = s.nodes[s.target];
    const dead = A.prog(t, tStrike + 0.05, 0.3), gone = A.prog(t, wRec - 0.3, 0.6); // slot empties as "recovery" starts
    if (gone > 0) T.setTone("ghost", gone, "bad"); else T.setTone("bad", dead, "neutral");
    T.ic.ig.setAttribute("stroke", dead > 0.5 ? C.bad : C.ink);
    T.ic.inner.style.opacity = (1 - gone).toFixed(3);
    A.show(s.xMark.inner, t, tStrike + 0.05, { d: 0.45, dy: 0, s0: 0.3, ease: A.E.outBack, out: wRepl - 0.15 });
    A.show(s.fresh.inner, t, wRepl + 0.05, { d: 0.55, dy: 0, s0: 0.6, ease: A.E.outBack });
    const pulse = (ring, t0) => {
      const p = U.clamp((t - t0) / 0.9);
      ring.style.transform = `scale(${(1 + 0.3 * A.E.outCubic(p)).toFixed(4)})`;
      ring.style.opacity = (t < t0 ? 0 : 0.95 * (1 - p)).toFixed(3);
    };
    pulse(s.ringDet, t < wNotices + 0.45 ? wNotices : wNotices + 0.45); // two detection pings
    pulse(s.ringNew, wRepl + 0.35);

    // Status pill.
    A.setOpacity(s.pill, A.prog(t, wInject + 0.25, 0.5) * dim);
    if (t >= wRepl + 0.5) K.setPill(s.pill, "9/9 nodes healthy", "ok");
    else if (t >= wNotices) K.setPill(s.pill, "Node lost: detected", "hl");
    else if (t >= tStrike + 0.15) K.setPill(s.pill, "8/9 nodes healthy", "bad");
    else K.setPill(s.pill, "9/9 nodes healthy", "ok");

    // Chaos experiment: the worker runs, is targeted on "worker", killed on "on purpose"; the cache goes stale on "stale";
    // the open question lands on "before users". The row fades just before the practices header takes its place.
    const cbOut = k.lines[iCb].end + 0.3;
    A.show(s.cbKick, t, wKilling - 0.05, { dy: 8, out: cbOut });
    const cbIn = wWorker - 0.33;
    const cbOp = A.prog(t, cbIn, 0.5) * (1 - A.prog(t, cbOut, 0.4, A.E.inOutCubic));
    A.setOpacity(s.cb.querySelector("svg"), cbOp);
    A.show(s.ret2In, t, wWorker + 0.05, { d: 0.45, dy: 0, s0: 1.5, out: wPurpose + 0.6 });
    const hit = A.prog(t, wPurpose, 0.15) > 0.5;
    s.ret2Stroke.forEach((n) => n.setAttribute("stroke", hit ? C.bad : C.hl));
    const died = A.prog(t, wPurpose + 0.05, 0.35);
    s.wk.setTone("bad", died, "neutral");
    s.wk.sub.textContent = died > 0.5 ? "killed on purpose" : "updating cache";
    A.show(s.wkX.inner, t, wPurpose + 0.05, { d: 0.45, dy: 0, s0: 0.3, ease: A.E.outBack });
    s.aWC.draw(t, cbIn + 0.1, 0.4);
    s.aWC.setTone(died > 0.5 ? "bad" : "line");
    s.aWC.setOpacity(t < cbIn + 0.1 ? 0 : 1 - 0.55 * died);
    s.pWC.update(t, A.prog(t, cbIn + 0.3, 0.3) * (1 - died));
    const stale = A.prog(t, wStale - 0.05, 0.4);
    s.cache.setTone("neutral"); // stale = red status text (as in the composite scene); the box stays neutral, unlike the dead worker
    s.cache.sub.setAttribute("fill", A.mix(C.muted, C.bad, stale));
    s.cache.sub.textContent = stale > 0.5 ? "stale data" : "up to date";
    s.aCU.draw(t, wStale + 0.1, 0.4);
    A.show(s.stale, t, wBefore - 0.05, { dy: 8, d: 0.45, out: cbOut });

    // Practices: header with "human mistakes", each chip on its spoken word.
    A.show(s.prHdr, t, wHuman - 0.05, { dy: 10 });
    s.chips.forEach((c, i) => A.show(c, t, chipAt[i] - 0.05, { dy: 12, d: 0.5 }));
    // "…so a bad timeout hits only a few servers": the typo from `humans`, rolled out gradually, takes down one server of six.
    A.show(s.lTag, t, wBad - 0.05, { dy: 10, d: 0.5 });
    A.show(s.lArrow, t, wHits - 0.15, { dy: 0, dx: -10, d: 0.4 });
    s.minis.forEach((m, i) => {
      A.show(m, t, wHits + i * 0.04, { dy: 8, d: 0.4 });
      const p = i === 0 ? A.prog(t, wHits + 0.3, 0.35) : 0;
      const col = A.mix(C.ok, C.bad, p);
      m.style.color = col; m.style.borderColor = col;
      m.style.background = A.mix("#12301F", "#3A1620", p);
    });
  },
});
