// S09 — Human errors. A one-line config edit (timeout: 30s → 30ms) rolls out to every service; they fail one after another.
// Then a stat card: one study found operator configuration errors were the leading cause of outages (no percentages).
R.scene("humans", {
  build(root, k) {
    const C = K.C, s = {};
    s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "People cause faults too." });

    // ---- Beat `config`: the operator and the one-line edit (HTML panel on the left).
    s.opIcon = K.icon(root, { name: "user", x: 120, y: 264, size: 54, color: "muted" });
    s.opLbl = K.text(root, { x: 186, y: 272, cls: "label", text: "Operator", color: "muted" });
    s.opLbl.style.fontSize = "34px";

    s.panel = K.card(root, { x: 120, y: 350, w: 600, h: 300 });
    const head = U.el("div", {}, s.panel);
    Object.assign(head.style, { display: "flex", alignItems: "center", gap: "12px", fontSize: "28px", fontWeight: 650, color: C.muted });
    head.innerHTML = K.iconSvg("file", 34, C.muted, 3.5) + "<span>shared config</span>";
    const line = U.el("div", { class: "mono" }, s.panel);
    Object.assign(line.style, { fontSize: "64px", lineHeight: "1.1", marginTop: "46px", whiteSpace: "nowrap", display: "flex", alignItems: "center" });
    U.el("span", { style: { color: C.muted } }, line, "timeout: ");
    s.val = U.el("span", {}, line, "30s");
    Object.assign(s.val.style, { borderRadius: "8px", padding: "0 6px", margin: "0 -6px" });
    s.cur = U.el("span", {}, line);
    Object.assign(s.cur.style, { display: "inline-block", width: "5px", height: "62px", marginLeft: "4px", background: C.hl, borderRadius: "2px" });
    s.note = U.el("div", {}, s.panel);
    Object.assign(s.note.style, { display: "flex", alignItems: "center", gap: "12px", marginTop: "40px", fontSize: "30px", fontWeight: 700, color: C.bad });
    s.note.innerHTML = K.iconSvg("warning", 36, C.bad, 3.5) + "<span>Meant 30 s, typed 30 ms</span>";

    // ---- Beat `ripple`: six services on a rollout bus.
    const svg = K.svgLayer(root);
    s.svc = U.sv("g", {}, svg);
    s.svcHdr = K.label(s.svc, { x: 870, y: 306, text: "Services", anchor: "start", size: 34, weight: 750, fill: "muted" });
    const X0 = 870, BW = 280, GAP = 35, BH = 110, ROWY = [345, 545], BUSY = 500, BUS0 = 734;
    const names = ["A", "B", "C", "D", "E", "F"];
    s.cols = [0, 1, 2].map((c) => X0 + c * (BW + GAP) + BW / 2);
    s.rings = U.sv("g", {}, s.svc);
    s.bus = K.arrow(s.svc, { from: [BUS0, BUSY], to: [s.cols[2], BUSY], head: false });
    s.busHl = K.arrow(s.svc, { from: [BUS0, BUSY], to: [s.cols[2], BUSY], head: false, tone: "hl" });
    s.busRed = K.arrow(s.svc, { from: [BUS0, BUSY], to: [s.cols[2], BUSY], head: false, tone: "bad" });
    s.boxes = []; s.conns = []; s.ringEls = [];
    names.forEach((n, i) => {
      const c = i % 3, r = Math.floor(i / 3), x = X0 + c * (BW + GAP), y = ROWY[r];
      const ring = U.sv("rect", { x, y, width: BW, height: BH, rx: 18, fill: "none", stroke: C.bad, "stroke-width": 4 }, s.rings);
      s.ringEls.push(ring);
      s.boxes.push(K.box(s.svc, { x, y, w: BW, h: BH, label: "Service " + n, sub: "healthy", icon: "server", iconInline: true, iconSize: 40, fs: 33, tone: "ok" }));
      const edge = r === 0 ? y + BH : y;
      s.conns.push(K.arrow(s.svc, { from: [s.cols[c], BUSY], to: [s.cols[c], edge], gapEnd: 11 }));
    });
    // Invisible routes for the one-shot "config" dots (bus → column → box edge).
    const routes = U.sv("g", { opacity: 0 }, svg);
    s.dots = U.sv("g", {}, s.svc);
    s.routes = s.boxes.map((b, i) => {
      const c = i % 3, edge = Math.floor(i / 3) === 0 ? b.y + BH + 10 : b.y - 10;
      const a = K.arrow(routes, { from: [BUS0, BUSY], via: [[s.cols[c], BUSY]], to: [s.cols[c], edge], head: false });
      const dot = U.sv("g", {}, s.dots);
      const halo = U.sv("circle", { r: 22, fill: C.hl, opacity: 0.22 }, dot);
      const core = U.sv("circle", { r: 12, fill: C.hl }, dot);
      return { a, dot, halo, core };
    });
    s.pill = K.pill(root, { x: 0, y: 266, text: "6 of 6 healthy", tone: "ok" });
    s.pill.style.left = "auto"; s.pill.style.right = "140px";

    // ---- Beat `study`: the stat card.
    s.card = K.card(root, { x: 120, y: 705, w: 1680, h: 215 });
    const abs = (parent, css, txt) => { const n = U.el("div", {}, parent, txt); Object.assign(n.style, { position: "absolute", whiteSpace: "nowrap" }, css); return n; };
    // Kicker and source live outside the card (same screen positions) so they read as free lines before the card shell arrives.
    s.kick = abs(root, { left: "172px", top: "741px", fontSize: "30px", fontWeight: 650, color: C.muted }, "One study of large internet services");
    s.main = abs(s.card, { left: "50px", top: "80px", fontSize: "60px", fontWeight: 800, letterSpacing: "-0.02em", color: C.ink }, "Operator configuration errors");
    s.src = abs(root, { left: "172px", top: "871px", fontSize: "26px", fontWeight: 550, color: C.faint }, "Oppenheimer et al., early 2000s");
    s.vr = abs(s.card, { left: "1150px", top: "32px", width: "2px", height: "150px", background: C.line2 });
    s.num = abs(s.card, { left: "1196px", top: "30px", fontSize: "150px", fontWeight: 800, letterSpacing: "-0.045em", lineHeight: "0.95", color: C.hl }, "#1");
    s.numLbl = abs(s.card, { left: "1366px", top: "56px", fontSize: "38px", fontWeight: 700, lineHeight: "1.2", color: C.ink, whiteSpace: "normal", width: "290px" }, "leading cause of outages");
    return s;
  },

  update(t, k, s) {
    const C = K.C;
    const cCfg = k.cue("config"), cStudy = k.cue("study");
    // Word anchors (whisper timings) for every beat.
    const wPeople = k.word("config", "people"), wSomeone = k.word("config", "someone"), wTimeout = k.word("config", "timeout");
    const wMs = k.word("config", "milliseconds"), wMeant = k.word("config", "meant");
    const wRolls = k.word("ripple", "rolls"), wEverywhere = k.word("ripple", "everywhere"), wFailing = k.word("ripple", "failing");
    const wOperator = k.word("study", "operator"), wConfig = k.word("study", "configuration"), wLeading = k.word("study", "leading");
    A.show(s.title, t, 0.1);

    // Operator on "people", the config panel on "someone edits".
    A.show(s.opIcon, t, wPeople - 0.05, { dy: 12 });
    A.show(s.opLbl, t, wPeople + 0.05, { dy: 12 });
    A.show(s.panel, t, wSomeone - 0.05, { dy: 18 });

    // The edit: cursor lands on the value ("one timeout"), "s" is deleted, "ms" typed — "30ms" completes on "milliseconds".
    const e0 = wMs - 0.5;
    let v = "30s";
    if (t >= e0) v = "30";
    if (t >= e0 + 0.3) v = "30m";
    if (t >= e0 + 0.5) v = "30ms";
    s.val.textContent = v;
    const bad = A.prog(t, e0 + 0.6, 0.4);
    s.val.style.color = A.mix(C.ink, C.bad, bad);
    s.val.style.background = `rgba(255,107,127,${(0.16 * bad).toFixed(3)})`;
    const curOn = t >= wTimeout && t < k.cueEnd("config") - 0.35;
    const typing = t >= e0 - 0.1 && t < e0 + 0.7;
    const blink = typing || Math.floor((t - cCfg) * 2.4) % 2 === 0;
    A.setOpacity(s.cur, curOn && blink ? 1 : 0);
    s.cur.style.visibility = curOn && blink ? "visible" : "hidden";
    A.show(s.note, t, wMeant - 0.1, { dy: 10 }); // "where they meant seconds"

    // Ripple: services and the rollout bus on "rolls out everywhere"; config dots travel the bus to every service.
    const dim = 1 - 0.55 * A.prog(t, cStudy + 0.2, 0.6);
    const svcOp = A.prog(t, wRolls - 0.2, 0.5) * dim;
    s.svc.style.opacity = svcOp.toFixed(3);
    s.svc.style.visibility = svcOp > 0.002 ? "visible" : "hidden";
    s.bus.draw(t, wRolls - 0.15, 0.5);
    s.conns.forEach((a) => a.draw(t, wRolls + 0.1, 0.35));
    A.setOpacity(s.pill, A.prog(t, wRolls + 0.05, 0.5) * dim);

    const t0 = wEverywhere - 0.25, speed = 680; // px per second
    const arrive = s.routes.map((r) => t0 + r.a.len / speed);
    s.routes.forEach((r, i) => {
      const p = U.clamp((t - t0) * speed / r.a.len);
      const [x, y] = r.a.point(p);
      [r.halo, r.core].forEach((c) => { c.setAttribute("cx", x.toFixed(1)); c.setAttribute("cy", y.toFixed(1)); });
      const op = t < t0 ? 0 : 1 - A.prog(t, arrive[i] - 0.05, 0.2);
      r.dot.style.opacity = U.clamp(op).toFixed(3);
    });

    // Failures cascade from "failing" through "one after another" (last one lands as the line ends).
    const order = [0, 3, 1, 4, 2, 5], f0 = wFailing - 0.1, step = 0.27;
    const failAt = []; order.forEach((b, j) => { failAt[b] = f0 + j * step; });
    let nFailed = 0;
    s.boxes.forEach((b, i) => {
      const fp = A.prog(t, failAt[i], 0.35);
      if (fp > 0) b.setTone("bad", fp, "ok");
      else {
        const fl = A.prog(t, arrive[i], 0.15) * (1 - A.prog(t, arrive[i] + 0.3, 0.45));
        b.setTone("hl", fl, "ok");
      }
      if (fp > 0.5) nFailed++;
      b.sub.textContent = fp > 0.5 ? "timing out" : "healthy";
      s.conns[i].setTone(fp > 0.5 ? "bad" : t >= arrive[i] - 0.12 ? "hl" : "line");
      // Red ripple ring.
      const rp = U.clamp((t - failAt[i]) / 0.9);
      const ring = s.ringEls[i];
      ring.style.transform = `scale(${(1 + 0.22 * A.E.outCubic(rp)).toFixed(4)})`;
      ring.style.opacity = (t < failAt[i] ? 0 : 0.9 * (1 - rp)).toFixed(3);
    });
    // Red front along the bus, reaching each column as its first service fails.
    const xs = [734, s.cols[0], s.cols[1], s.cols[2]], ts = [failAt[0] - 0.3, failAt[0], failAt[1], failAt[2]];
    let fx = 734;
    for (let j = 0; j < 3; j++) if (t >= ts[j]) fx = U.lerp(xs[j], xs[j + 1], A.E.inOutSine(U.clamp((t - ts[j]) / (ts[j + 1] - ts[j]))));
    // Yellow front: the config change travelling along the bus ahead of the failures.
    const hp = U.clamp(((t - t0) * speed) / (s.cols[2] - 734));
    const LH = s.busHl.len;
    s.busHl.path.style.strokeDasharray = `${LH} ${LH}`;
    s.busHl.path.style.strokeDashoffset = ((1 - hp) * LH).toFixed(2);
    s.busHl.g.style.visibility = hp > 0.001 ? "visible" : "hidden";
    const L = s.busRed.len, rp = (fx - 734) / (s.cols[2] - 734);
    s.busRed.path.style.strokeDasharray = `${L} ${L}`;
    s.busRed.path.style.strokeDashoffset = ((1 - rp) * L).toFixed(2);
    s.busRed.g.style.visibility = rp > 0.001 ? "visible" : "hidden";
    K.setPill(s.pill, nFailed ? `${nFailed} of 6 failing` : "6 of 6 healthy", nFailed ? "bad" : "ok");

    // Study: kicker + source with the line start; finding on "operator configuration errors"; #1 on "leading cause".
    const hlP = A.prog(t, wConfig - 0.05, 0.5); // the config panel is singled out on "configuration"
    s.panel.style.borderColor = A.mix(C.line, C.hl, hlP);
    s.panel.style.boxShadow = `0 0 0 ${(6 * hlP).toFixed(1)}px rgba(255,214,107,${(0.12 * hlP).toFixed(3)}), 0 30px 60px -30px rgba(0,0,0,.6)`;
    A.show(s.kick, t, cStudy, { dy: 8 });
    A.show(s.src, t, cStudy + 0.5, { dy: 8 });
    A.show(s.card, t, wOperator - 0.1, { dy: 0, d: 0.5 }); // shell fades in around the already-visible text, with the finding
    A.show(s.main, t, wOperator - 0.05, { dy: 12 });
    A.show(s.vr, t, wLeading - 0.15, { dy: 0 });
    A.show(s.num, t, wLeading - 0.1, { dy: 0, s0: 0.6, d: 0.55, ease: A.E.outBack });
    A.show(s.numLbl, t, wLeading + 0.05, { dy: 10 });
  },
});
