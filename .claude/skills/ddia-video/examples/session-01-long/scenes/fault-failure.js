// S06 — A fault is not a failure. Exemplar scene: definitions, then two request-flow diagrams (with / without fault tolerance).
R.scene("fault-failure", {
  build(root, k) {
    const s = {};
    s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "A fault is not a failure." });

    // Beat `defs`: two definition cards.
    s.fault = K.card(root, { x: 120, y: 300, w: 800, title: "Fault", icon: "warning", accent: "hl", body: "One component deviates from its spec." });
    s.failure = K.card(root, { x: 1000, y: 300, w: 800, title: "Failure", icon: "x", accent: "bad", body: "The system as a whole stops providing the service users expect." });

    const svg = K.svgLayer(root);
    // Row A — with fault tolerance (two replicas).
    s.rowA = U.sv("g", {}, svg);
    s.hdrA = K.label(s.rowA, { x: 120, y: 330, text: "With fault tolerance", anchor: "start", size: 34, weight: 750, fill: "rel" });
    s.usersA = K.box(s.rowA, { x: 120, y: 392, w: 250, h: 140, label: "Users", icon: "users" });
    s.appA = K.box(s.rowA, { x: 520, y: 392, w: 280, h: 140, label: "App server", icon: "server" });
    s.repA = K.box(s.rowA, { x: 980, y: 362, w: 320, h: 92, label: "Replica A", icon: "database", iconInline: true, iconSize: 40 });
    s.repB = K.box(s.rowA, { x: 980, y: 472, w: 320, h: 92, label: "Replica B", icon: "database", iconInline: true, iconSize: 40 });
    s.aUA = K.arrow(s.rowA, { from: s.usersA.right, to: s.appA.left, gapStart: 14, gapEnd: 14 });
    s.aAA = K.arrow(s.rowA, { from: s.appA.right, to: s.repA.left, gapStart: 14, gapEnd: 14 });
    s.aAB = K.arrow(s.rowA, { from: s.appA.right, to: s.repB.left, gapStart: 14, gapEnd: 14 });
    s.pUA = K.packets(s.rowA, s.aUA, { n: 3, period: 1.3 });
    s.pAA = K.packets(s.rowA, s.aAA, { n: 2, period: 1.3 });
    s.pAB = K.packets(s.rowA, s.aAB, { n: 2, period: 1.3 });
    s.pAB2 = K.packets(s.rowA, s.aAB, { n: 2, period: 1.3, from: 0, to: 1 });
    s.xA = K.mark(s.rowA, "x", { x: 1300, y: 362, size: 56 });
    s.tolA = K.label(s.rowA, { x: 1140, y: 610, text: "Fault — tolerated", size: 30, weight: 700, fill: "rel" });

    // Row B — without fault tolerance (single copy).
    s.rowB = U.sv("g", {}, svg);
    s.hdrB = K.label(s.rowB, { x: 120, y: 690, text: "Without fault tolerance", anchor: "start", size: 34, weight: 750, fill: "bad" });
    s.usersB = K.box(s.rowB, { x: 120, y: 742, w: 250, h: 140, label: "Users", icon: "users" });
    s.appB = K.box(s.rowB, { x: 520, y: 742, w: 280, h: 140, label: "App server", icon: "server" });
    s.db = K.box(s.rowB, { x: 980, y: 766, w: 320, h: 92, label: "Only replica", icon: "database", iconInline: true, iconSize: 40 });
    s.bUA = K.arrow(s.rowB, { from: s.usersB.right, to: s.appB.left, gapStart: 14, gapEnd: 14 });
    s.bAD = K.arrow(s.rowB, { from: s.appB.right, to: s.db.left, gapStart: 14, gapEnd: 14 });
    s.pBU = K.packets(s.rowB, s.bUA, { n: 3, period: 1.3 });
    s.pBD = K.packets(s.rowB, s.bAD, { n: 2, period: 1.3 });
    s.xB = K.mark(s.rowB, "x", { x: 1300, y: 766, size: 56 });
    s.failLbl = K.label(s.rowB, { x: 1140, y: 908, text: "Fault → failure", size: 30, weight: 700, fill: "bad" });

    // Outcome pills (HTML, on top of the SVG).
    s.pillA = K.pill(root, { x: 1440, y: 432, text: "Users: fine", tone: "ok" });
    s.pillB = K.pill(root, { x: 1440, y: 782, text: "Users: fine", tone: "ok" });

    // Beat `goal`: the takeaway.
    s.goal = K.card(root, { x: 360, y: 380, w: 1200, accent: "rel", title: "Faults will happen.", body: "<span style='font-size:44px;color:#E9EEF5;font-weight:650'>Design so they don't become failures.</span>" });
    s.goal.style.textAlign = "center";
    s.goal.querySelector(".k-card-title").style.fontSize = "64px";
    return s;
  },

  update(t, k, s) {
    const cDefs = k.cue("defs"), cFlowA = k.cue("flowA"), cBreakA = k.cue("breakA"), cReroute = k.cue("rerouteA");
    const cFlowB = k.cue("flowB"), cBreakB = k.cue("breakB"), cFailB = k.cue("failB"), cGoal = k.cue("goal");

    A.show(s.title, t, 0.1);
    // Definitions: in at `defs` (failure card a beat later), out when the first diagram arrives.
    A.show(s.fault, t, cDefs + 0.2, { out: cFlowA - 0.4 });
    // The failure card lands with the line after `defs` (the failure definition).
    const iDefs = k.lines.findIndex((l) => l.cue === "defs");
    const tFailure = Math.min(k.lines[iDefs + 1].start + 0.3, cFlowA - 1.5);
    A.show(s.failure, t, tFailure, { out: cFlowA - 0.4 });

    // Row A builds at `flowA`; everything dims under the goal card.
    const dim = 1 - 0.78 * A.prog(t, cGoal, 0.6);
    const rowA = A.show(s.rowA, t, cFlowA, { dy: 16 }) * dim;
    s.rowA.style.opacity = rowA.toFixed(3);
    A.setOpacity(s.pillA, A.prog(t, cFlowA + 0.6, 0.5) * dim);
    [s.aUA, s.aAA, s.aAB].forEach((a) => a.draw(t, cFlowA + 0.2, 0.7));

    const brokeA = A.prog(t, cBreakA + 0.3, 0.4);
    s.repA.setTone("bad", brokeA);
    A.show(s.xA.inner, t, cBreakA + 0.3, { d: 0.45, dy: 0, s0: 0.3, ease: A.E.outBack });
    s.aAA.setTone(brokeA > 0.5 ? "bad" : "line");
    s.aAA.setOpacity(1 - 0.6 * brokeA);
    const flowOn = A.prog(t, cFlowA + 0.9, 0.4);
    s.pUA.update(t, flowOn);
    s.pAA.update(t, flowOn * (1 - brokeA));
    s.pAB.update(t, flowOn);
    // Reroute: replica B takes the extra traffic (second packet stream fades in, offset by half a period).
    const rer = A.prog(t, cReroute + 0.2, 0.5);
    s.pAB2.update(t + 0.33, flowOn * rer);
    s.repB.setTone("ok", rer);
    A.show(s.tolA.inner, t, cReroute + 0.5, { dy: 10 });

    // Row B builds at `flowB`.
    const rowB = A.show(s.rowB, t, cFlowB, { dy: 16 }) * dim;
    s.rowB.style.opacity = rowB.toFixed(3);
    [s.bUA, s.bAD].forEach((a) => a.draw(t, cFlowB + 0.2, 0.7));
    const brokeB = A.prog(t, cBreakB + 0.2, 0.4);
    s.db.setTone("bad", brokeB);
    A.show(s.xB.inner, t, cBreakB + 0.2, { d: 0.45, dy: 0, s0: 0.3, ease: A.E.outBack });
    s.bAD.setTone(brokeB > 0.5 ? "bad" : "line");
    const failed = A.prog(t, cFailB + 0.2, 0.5);
    const flowB = A.prog(t, cFlowB + 0.9, 0.4);
    s.pBD.update(t, flowB * (1 - brokeB));
    s.pBU.update(t, flowB, { tone: failed > 0.5 ? "bad" : "hl" });
    s.bUA.setTone(failed > 0.5 ? "bad" : "line");
    s.usersB.setTone("bad", failed);
    A.setOpacity(s.pillB, A.prog(t, cFlowB + 0.6, 0.5) * dim);
    K.setPill(s.pillB, failed > 0.5 ? "Users: errors" : "Users: fine", failed > 0.5 ? "bad" : "ok");
    A.show(s.failLbl.inner, t, cFailB + 0.5, { dy: 10 });

    A.show(s.goal, t, cGoal + 0.2, { s0: 0.96, dy: 10 });
  },
});
