// S21 — Scaling strategies. Four phases: scale up vs scale out → stateless vs stateful → two workloads with the same
// throughput → "no magic scaling sauce" + the long-standing rule of thumb (one database node until forced to distribute).
R.scene("scaling", {
  build(root, k) {
    const s = {};
    const { C, TONES } = K;
    // Runtime quirk: tokens.css gives every svg node `transform-origin: center` (fill-box), so an icon's
    // translate()+scale() attribute scales around the icon's own center and drifts off its slot. Restore SVG semantics.
    const origin0 = (n) => { if (n) Object.assign(n.style, { transformBox: "view-box", transformOrigin: "0 0" }); return n; };
    const box = (parent, o) => { const b = K.box(parent, o); origin0(b.icon); return b; };

    // Small centered-icon machine (no label) — used for the scale-out grid and the "distributed" cluster.
    const mini = (parent, x, y, w, h, tone, isz = 44) => {
      const g = U.sv("g", { transform: `translate(${x},${y})` }, parent);
      const inner = U.sv("g", {}, g);
      const T = TONES[tone];
      U.sv("rect", { x: 0, y: 0, width: w, height: h, rx: 16, "stroke-width": 3, fill: T.fill, stroke: T.stroke, "stroke-dasharray": T.dash || null }, inner);
      const ic = U.sv("g", { transform: `translate(${w / 2 - isz / 2},${h / 2 - isz / 2}) scale(${isz / 64})`, fill: "none", stroke: tone === "ghost" ? C.faint : T.sub, "stroke-width": 3.5, "stroke-linecap": "round", "stroke-linejoin": "round" }, inner);
      ic.innerHTML = K.ICONS.server;
      origin0(ic);
      return { g, inner };
    };

    // ---------------------------------------------------------------- titles (one per phase, same slot)
    s.t1 = K.text(root, { x: 120, y: 110, cls: "h2", text: "Two ways to grow" });
    s.t2 = K.text(root, { x: 120, y: 110, cls: "h2", text: "Scaling out depends on state" });
    s.t3 = K.text(root, { x: 120, y: 110, cls: "h2", text: "Workloads differ" });
    s.t4 = K.text(root, { x: 120, y: 110, cls: "h2", text: "There is no magic scaling sauce." });

    // ---------------------------------------------------------------- phase 1: scale up vs scale out
    s.upHdr = K.text(root, { x: 500, w: 420, y: 262, cls: "h3", align: "center", color: "sca", text: "Scale up" });
    s.upSub = K.text(root, { x: 500, w: 700, y: 330, cls: "label", align: "center", color: "muted", text: "One bigger machine" });
    s.outHdr = K.text(root, { x: 1420, w: 420, y: 262, cls: "h3", align: "center", color: "sca", text: "Scale out" });
    s.outSub = K.text(root, { x: 1420, w: 700, y: 330, cls: "label", align: "center", color: "muted", text: "Many smaller machines" });
    // "Real systems often mix both": a chip bridging the two headers, on the divider (which starts below it).
    s.mix = K.chips(root, { x: 660, y: 257, w: 600, justify: "center", items: [{ text: "Real systems mix both", icon: "layers", accent: "hl" }] });
    s.mixChip = s.mix.chips[0];
    s.mixChip.style.background = C.bg;

    const svg1 = K.svgLayer(root);
    s.p1 = U.sv("g", {}, svg1);
    s.split = U.sv("line", { x1: 960, y1: 345, x2: 960, y2: 900, stroke: C.line, "stroke-width": 2 }, s.p1);
    // The growing machine: rect + icon tweened by attributes every frame (A.show owns the inner group's CSS transform).
    s.machG = U.sv("g", {}, s.p1);
    s.machInner = U.sv("g", {}, s.machG);
    s.machRect = U.sv("rect", { rx: 22, "stroke-width": 3, fill: TONES.sca.fill, stroke: C.sca }, s.machInner);
    s.machIcon = U.sv("g", { fill: "none", stroke: C.sca, "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" }, s.machInner);
    s.machIcon.innerHTML = K.ICONS.server;
    origin0(s.machIcon);
    s.upCap = K.label(s.p1, { x: 500, y: 892, text: "More CPU, RAM and disk", size: 30, weight: 600, fill: "muted" });

    s.grid = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) s.grid.push(mini(s.p1, 1155 + c * 190, 458 + r * 136, 150, 100, "sca", 46));
    s.outCap = K.label(s.p1, { x: 1420, y: 892, text: "Shared-nothing: no shared CPU, RAM, disk", size: 30, weight: 600, fill: "muted" });

    // ---------------------------------------------------------------- phase 2: stateless vs stateful
    s.p2 = U.sv("g", {}, svg1);
    // Row A — stateless services behind a load balancer.
    s.rowA = U.sv("g", {}, s.p2);
    s.hdrA = K.label(s.rowA, { x: 120, y: 302, text: "Stateless services", anchor: "start", size: 36, weight: 750, fill: "sca" });
    s.users = box(s.rowA, { x: 120, y: 380, w: 230, h: 140, label: "Users", icon: "users" });
    s.apps = []; s.aLA = []; s.pLA = [];
    // Before the load balancer is named, Users talk straight to the first copy. Built before the LB so the LB box
    // covers this arrow while it fades out.
    const app0 = { x: 1000, y: 313, h: 58 };
    s.aUA0 = K.arrow(s.rowA, { from: s.users.right, to: [app0.x, app0.y + app0.h / 2], gapStart: 14, gapEnd: 14 });
    s.pUA0 = K.packets(s.rowA, s.aUA0, { n: 3, period: 1.4 });
    s.lb = box(s.rowA, { x: 470, y: 380, w: 300, h: 140, label: "Load balancer", icon: "lb" });
    s.aUL = K.arrow(s.rowA, { from: s.users.right, to: s.lb.left, gapStart: 14, gapEnd: 14 });
    s.pUL = K.packets(s.rowA, s.aUL, { n: 3, period: 1.2 });
    for (let i = 0; i < 4; i++) {
      const b = box(s.rowA, { x: 1000, y: 313 + i * 72, w: 290, h: 58, r: 14, fs: 28, label: `App copy ${i + 1}`, icon: "server", iconInline: true, iconSize: 32 });
      s.apps.push(b);
      const a = K.arrow(s.rowA, { from: s.lb.right, to: b.left, gapStart: 14, gapEnd: 14 });
      s.aLA.push(a);
      s.pLA.push(K.packets(s.rowA, a, { n: 2, period: 1.2 }));
    }
    s.pillA = K.pill(root, { x: 1335, y: 418, text: "Fairly easy to scale out", tone: "ok" });

    // Row B — a stateful database: split into shards, each shard copied to a replica.
    s.rowB = U.sv("g", {}, s.p2);
    s.hdrB = K.label(s.rowB, { x: 120, y: 662, text: "Stateful database", anchor: "start", size: 36, weight: 750, fill: "sca" });
    s.db = box(s.rowB, { x: 120, y: 720, w: 330, h: 150, label: "Database", icon: "database" });
    s.shards = []; s.reps = []; s.aSplit = []; s.aRep = []; s.pRep = []; s.chunks = [];
    for (let i = 0; i < 3; i++) {
      const y = 692 + i * 74;
      const sh = box(s.rowB, { x: 1000, y, w: 290, h: 58, r: 14, fs: 28, label: `Shard ${i + 1}`, icon: "database", iconInline: true, iconSize: 32, tone: "sca" });
      const rp = box(s.rowB, { x: 1450, y, w: 290, h: 58, r: 14, fs: 28, label: `Replica ${i + 1}`, icon: "database", iconInline: true, iconSize: 32 });
      s.shards.push(sh); s.reps.push(rp);
      const a = K.arrow(s.rowB, { from: s.db.right, to: sh.left, gapStart: 14, gapEnd: 14 });
      s.aSplit.push(a);
      const ar = K.arrow(s.rowB, { from: sh.right, to: rp.left, gapStart: 14, gapEnd: 14, tone: "sca" });
      s.aRep.push(ar);
      s.pRep.push(K.packets(s.rowB, ar, { n: 2, period: 1.1, r: 7 }));
      // one-shot "chunk of data" travelling along the split arrow
      s.chunks.push(U.sv("rect", { width: 30, height: 20, rx: 5, fill: C.sca }, s.rowB));
    }
    s.splitLbl = K.label(s.rowB, { x: 725, y: 736, text: "split", size: 28, weight: 650, fill: "muted" });
    s.copyLbl = K.label(s.rowB, { x: 1370, y: 680, text: "copy", size: 28, weight: 650, fill: "muted" });
    s.pillB = K.pill(root, { x: 450, y: 620, text: "Harder to scale out", tone: "hl" });

    // ---------------------------------------------------------------- phase 3: two workloads, same throughput
    const workCard = (x, kicker, big, small) => {
      const c = K.card(root, { x, y: 262, w: 800, h: 530 });
      U.el("div", { class: "kicker", style: { color: C.sca } }, c, kicker);
      const b = U.el("div", { class: "mono", style: { fontSize: "62px", lineHeight: "1.1", marginTop: "14px", color: C.ink } }, c, big);
      b.style.fontWeight = 700;
      U.el("div", { style: { fontSize: "40px", fontWeight: 600, marginTop: "6px", color: C.muted } }, c, small);
      const bd = K.badge(c, { x: 34, y: 418, text: "≈ 100 MB/s" });
      Object.assign(bd.style, { fontSize: "40px", fontFamily: "var(--mono)", padding: "12px 26px", letterSpacing: "0" });
      return { c, bd };
    };
    s.wA = workCard(120, "Many small requests", "100,000 requests/s", "× 1 kB each");
    s.wB = workCard(1000, "A few huge requests", "3 requests/min", "× 2 GB each");
    s.eq = K.text(root, { x: 960, w: 80, y: 670, cls: "h2", align: "center", color: "hl", text: "=" });
    s.take = K.text(root, { x: 960, w: 1680, y: 826, cls: "h3", align: "center", html: "<span class='a'>Same throughput.</span> <span class='b' style='color:#FFA24D'>Very different designs.</span>" });
    s.takeA = s.take.querySelector(".a"); s.takeB = s.take.querySelector(".b");

    const svg3 = K.svgLayer(root); // above the cards
    s.p3 = U.sv("g", {}, svg3);
    const lane = (x) => {
      const g = U.sv("g", {}, s.p3);
      U.sv("rect", { x, y: 568, width: 732, height: 84, rx: 42, fill: C.bg2, stroke: C.line2, "stroke-width": 2 }, g);
      return g;
    };
    s.laneA = lane(154);
    const rnd = U.rng(21);
    s.dotsA = Array.from({ length: 30 }, (_, i) => ({ c: U.sv("circle", { r: 6.5, fill: C.hl }, s.laneA), off: i / 30 + (rnd() - 0.5) * 0.02, dy: (rnd() - 0.5) * 44 }));
    s.laneB = lane(1034);
    s.blk = U.sv("g", {}, s.laneB); // stays inside the lane's rounded ends (x 1050..1750): fades in, never clipped
    U.sv("rect", { x: 0, y: -27, width: 190, height: 54, rx: 14, fill: C.hl }, s.blk);
    U.sv("text", { x: 95, y: 10, "text-anchor": "middle", "font-size": 28, "font-weight": 800, fill: "#0F1B2D", "font-family": "JetBrains Mono, monospace" }, s.blk, "2 GB");

    // ---------------------------------------------------------------- phase 4: no magic sauce + rule of thumb
    s.thumb = K.chip(root, { x: 120, y: 262, text: "A long-standing rule of thumb", accent: "hl", icon: "star" });
    s.rule = K.text(root, { x: 120, y: 360, cls: "h3", html: "Keep the database on <span style='color:#FFA24D'>one node</span>" });
    s.p4 = U.sv("g", {}, svg3);
    s.one = box(s.p4, { x: 120, y: 530, w: 420, h: 250, label: "One node", sub: "scale up", icon: "database", iconSize: 72, fs: 36, tone: "sca" });
    s.aDist = K.arrow(s.p4, { from: [560, 655], to: [1270, 655], dashed: true, tone: "line" });
    s.condLbl = K.label(s.p4, { x: 915, y: 622, text: "until cost or availability forced it", size: 30, weight: 650 });
    s.noteLbl = K.label(s.p4, { x: 915, y: 712, text: "not the automatic next step", size: 30, weight: 700, fill: "hl" });
    s.cluster = [];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) s.cluster.push(mini(s.p4, 1300 + c * 170, 548 + r * 116, 140, 92, "ghost", 40));
    s.distLbl = K.label(s.p4, { x: 1550, y: 822, text: "Distributed", size: 34, weight: 700, fill: "muted" });
    s.distSub = K.label(s.p4, { x: 1550, y: 862, text: "scale out", size: 28, weight: 550, fill: "faint" });
    return s;
  },

  update(t, k, s) {
    const cUp = k.cue("up"), cSl = k.cue("stateless"), cW = k.cue("workloads"), cN = k.cue("nosauce");
    const w = (ref, needle) => k.word(ref, needle);
    const lerp = U.lerp;

    // Phase boundaries (fade the previous phase as the next line starts).
    const end1 = cSl + 0.25, end2 = cW + 0.05, end3 = cN - 0.1;

    // ---------------------------------------------------------------- titles
    A.show(s.t1, t, cUp, { out: end1, outD: 0.35 });                    // "Back to growth"
    A.show(s.t2, t, cSl + 0.5, { out: end2, outD: 0.35 });
    A.show(s.t3, t, cW + 0.3, { out: end3, outD: 0.35 });
    A.show(s.t4, t, cN + 0.2);

    // ---------------------------------------------------------------- phase 1
    const p1 = 1 - A.prog(t, end1, 0.35, A.E.inOutCubic);
    A.setOpacity(s.p1, p1);
    const tUp = w("up", "Scaling up"), tBig = w("up", "one bigger");
    A.show(s.upHdr, t, tUp - 0.05, { out: end1, outD: 0.35 });            // "Scaling up"
    A.show(s.upSub, t, tBig - 0.05, { out: end1, outD: 0.35 });           // "one bigger machine"
    // machine: appears small with "scaling up", grows on "bigger"
    A.show(s.machInner, t, tUp + 0.1, { d: 0.5, dy: 16 });
    const gp = A.prog(t, w("up", "bigger") - 0.1, 1.3, A.E.inOutCubic);
    const mw = lerp(200, 440, gp), mh = lerp(150, 390, gp), mcx = 500, mb = 836;
    s.machRect.setAttribute("x", (mcx - mw / 2).toFixed(1)); s.machRect.setAttribute("y", (mb - mh).toFixed(1));
    s.machRect.setAttribute("width", mw.toFixed(1)); s.machRect.setAttribute("height", mh.toFixed(1));
    const isz = lerp(64, 160, gp);
    s.machIcon.setAttribute("transform", `translate(${(mcx - isz / 2).toFixed(1)},${(mb - mh / 2 - isz / 2).toFixed(1)}) scale(${(isz / 64).toFixed(4)})`);
    s.machIcon.setAttribute("stroke-width", (3.4 * 64 / isz * lerp(1, 1.6, gp)).toFixed(2));
    A.show(s.upCap.inner, t, w("up", "machine") + 0.3, { dy: 10 });      // detail of "bigger machine", once it has grown
    // scale out
    const tOut = w("out", "Scaling out"), tMany = w("out", "many smaller");
    A.show(s.outHdr, t, tOut + 0.1, { out: end1, outD: 0.35 });           // "Scaling out"
    A.draw(s.split, t, tOut, 0.6);
    A.show(s.outSub, t, tMany - 0.05, { out: end1, outD: 0.35 });         // "many smaller machines"
    s.grid.forEach((m, i) => A.show(m.inner, t, tMany + i * 0.07, { d: 0.4, dy: 0, s0: 0.8 }));
    A.show(s.outCap.inner, t, w("out", "share nothing") - 0.05, { dy: 10 }); // "share nothing"
    A.show(s.mixChip, t, w("out", "Real systems") - 0.05, { dy: 10, out: end1, outD: 0.35 }); // "Real systems often mix both"

    // ---------------------------------------------------------------- phase 2
    const p2 = A.prog(t, cSl + 0.5, 0.4) * (1 - A.prog(t, end2, 0.35, A.E.inOutCubic));
    A.setOpacity(s.p2, p2);
    // Row A at "Stateless services"
    A.show(s.rowA, t, cSl + 0.5, { dy: 16 });
    A.show(s.apps[0].inner, t, cSl + 0.7, { dy: 10 });
    // Users → App copy 1 directly, until the load balancer is named.
    const tLB = w("stateless", "load balancer");
    const direct = 1 - A.prog(t, tLB, 0.3);
    s.aUA0.draw(t, cSl + 0.8, 0.6); s.aUA0.setOpacity(direct);
    s.pUA0.update(t, A.prog(t, cSl + 1.1, 0.4) * direct * p2);            // "…between requests"
    const tAdd = w("stateless", "adding copies");
    for (let i = 1; i < 4; i++) A.show(s.apps[i].inner, t, tAdd + (i - 1) * 0.22, { d: 0.45, dx: -30, dy: 0 }); // "adding copies"
    // The load balancer lands on its word; all four LB → copy arrows draw together.
    A.show(s.lb.inner, t, tLB, { d: 0.45, dy: 0, s0: 0.85 });
    s.aUL.draw(t, tLB + 0.1, 0.4);
    s.aLA.forEach((a) => a.draw(t, tLB + 0.15, 0.45));
    const flowLB = A.prog(t, tLB + 0.5, 0.3) * p2;
    s.pUL.update(t, flowLB);
    s.pLA.forEach((p, i) => p.update(t + i * 0.3, flowLB));
    A.show(s.pillA, t, w("stateless", "fairly easy") - 0.05, { out: end2, outD: 0.35, dy: 12 }); // "fairly easy"

    // Row B at "A stateful database"
    A.show(s.rowB, t, k.cue("stateful") + 0.2, { dy: 16 });
    A.show(s.pillB, t, w("stateful", "harder") - 0.05, { out: end2, outD: 0.35, dy: 12 }); // "harder"
    const tSplit = w("stateful", "split"), tCopy = w("stateful", "copied");
    s.aSplit.forEach((a, i) => {
      a.draw(t, tSplit, 0.5);
      A.show(s.shards[i].inner, t, tSplit + 0.3 + i * 0.1, { d: 0.4, dx: -24, dy: 0 });
      const cp = A.prog(t, tSplit + 0.05, 0.7, A.E.inOutCubic);
      const [x, y] = a.point(cp);
      s.chunks[i].setAttribute("x", (x - 15).toFixed(1)); s.chunks[i].setAttribute("y", (y - 10).toFixed(1));
      A.setOpacity(s.chunks[i], Math.min(1, cp * 6) * (1 - A.prog(t, tSplit + 0.65, 0.2)));
    });
    A.show(s.splitLbl.inner, t, tSplit + 0.1, { dy: 8 });
    s.aRep.forEach((a, i) => {
      a.draw(t, tCopy + i * 0.08, 0.35);
      A.show(s.reps[i].inner, t, tCopy + 0.2 + i * 0.08, { d: 0.4, dx: -24, dy: 0 });
      s.pRep[i].update(t + i * 0.37, A.prog(t, tCopy + 0.5, 0.3) * p2);
    });
    A.show(s.copyLbl.inner, t, tCopy + 0.1, { dy: 8 });

    // ---------------------------------------------------------------- phase 3
    const p3 = 1 - A.prog(t, end3, 0.35, A.E.inOutCubic);
    A.setOpacity(s.p3, p3);
    const tA = w("workloads", "100,000"), tB = w("workloads", "versus");
    A.show(s.wA.c, t, tA - 0.05, { out: end3, outD: 0.35 });
    A.show(s.wB.c, t, tB, { out: end3, outD: 0.35 });
    A.show(s.laneA, t, tA + 0.15, { dy: 24 });
    s.dotsA.forEach((d) => {
      const f = (((t / 1.6 + d.off) % 1) + 1) % 1;
      d.c.setAttribute("cx", (154 + 26 + f * 680).toFixed(1));
      d.c.setAttribute("cy", (610 + d.dy).toFixed(1));
      d.c.style.opacity = Math.min(1, f * 10, (1 - f) * 10).toFixed(3);
    });
    A.show(s.laneB, t, tB + 0.15, { dy: 24 });
    const fb = U.clamp((t - (tB + 0.3)) / (end3 - tB - 0.3));             // one huge request crawls across, inside the lane
    s.blk.setAttribute("transform", `translate(${(1050 + fb * 510).toFixed(1)},610)`);
    A.setOpacity(s.blk, A.prog(t, tB + 0.3, 0.4));
    // identical badges land together on "about 100 megabytes per second"
    const tMB = w(5, "about");
    [s.wA.bd, s.wB.bd].forEach((b) => A.show(b, t, tMB, { d: 0.5, dy: 0, s0: 0.85, ease: A.E.outBack }));
    A.show(s.eq, t, tMB + 0.3, { dy: 0, s0: 0.6, out: end3, outD: 0.35 });
    A.show(s.take, t, w(5, "second"), { dy: 12, out: end3, outD: 0.35 });  // "Same throughput" once the figure is said
    A.setOpacity(s.takeA, 1);
    A.setOpacity(s.takeB, A.prog(t, w(5, "very different") - 0.05, 0.5)); // "very different designs"

    // ---------------------------------------------------------------- phase 4
    A.show(s.thumb, t, w(7, "long-standing") - 0.05, { dy: 12 });         // "a long-standing rule of thumb"
    A.show(s.rule, t, w(7, "keep") - 0.05, { dy: 16 });                    // "keep the database on one node"
    A.show(s.one.inner, t, w(7, "one node") - 0.05, { dy: 16 });
    const tUntil = w(7, "until");
    s.aDist.draw(t, tUntil, 0.6);                                          // "until cost or availability…"
    A.show(s.condLbl.inner, t, tUntil + 0.05, { dy: 8 });
    const tDist = w(7, "distribution");
    s.cluster.forEach((m, i) => A.show(m.inner, t, tDist - 0.05 + i * 0.06, { d: 0.4, dy: 0, s0: 0.85 })); // "…forced distribution"
    A.show(s.distLbl.inner, t, tDist + 0.15, { dy: 8 });
    A.show(s.distSub.inner, t, tDist + 0.25, { dy: 8 });
    A.show(s.noteLbl.inner, t, w(8, "isn't") - 0.05, { dy: 8 });           // "isn't the automatic next step"
  },
});
