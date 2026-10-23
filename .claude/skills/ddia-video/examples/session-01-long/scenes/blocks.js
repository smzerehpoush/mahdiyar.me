// S03 — What makes an application data-intensive? CPU fades back, "Data" lights up with its three dimensions, then the five
// familiar building blocks arrive as a row of cards (each highlighted while it is narrated).
R.scene("blocks", {
  build(root, k) {
    const s = {};
    const C = K.C;
    s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "What makes an application data-intensive?" });

    const svg = K.svgLayer(root);
    // Workaround: tokens.css gives every SVG node `transform-box: fill-box; transform-origin: center`, so the attribute
    // transforms of box icons (scale) and arrow heads (rotate) pivot around their bbox centre. Restore SVG semantics.
    const pin = (n) => { if (n) { n.style.transformBox = "view-box"; n.style.transformOrigin = "0 0"; } };

    // Beat `cpu`: CPU power (fades back) vs Data (the main challenge).
    s.cpu = K.box(svg, { x: 120, y: 290, w: 280, h: 180, label: "CPU power", icon: "cpu", fs: 32, iconSize: 52 });
    pin(s.cpu.icon);
    s.data = K.box(svg, { x: 540, y: 270, w: 360, h: 220, label: "Data", tone: "hl", fs: 72 });
    s.data.label.setAttribute("y", 112);
    s.data.label.setAttribute("letter-spacing", "-2");
    s.dataSub = U.sv("text", { x: 180, y: 172, "text-anchor": "middle", "font-size": 30, "font-weight": 650, fill: C.hl }, s.data.inner, "the main challenge");

    // Beat `three`: volume, complexity, speed of change — fanned out from the Data box.
    const chipX = 1060, ys = [290, 380, 470];
    s.fan = ys.map((y) => K.arrow(svg, { from: [900, 380], to: [chipX, y], gapStart: 12, gapEnd: 14, tone: "hl", width: 3.5, curve: y === 380 ? 0 : (y < 380 ? -18 : 18) }));
    s.fan.forEach((a) => pin(a.head));
    s.words = [
      { text: "Volume", icon: "chart" },
      { text: "Complexity", icon: "lb" },
      { text: "Speed of change", icon: "clock" },
    ].map((o, i) => {
      const n = K.chip(root, { x: chipX, y: ys[i] - 35, text: o.text, icon: o.icon, accent: "hl", size: 34 });
      return n;
    });

    // Beat `db`…`batch`: the five building blocks.
    s.kicker = K.text(root, { x: 120, y: 554, cls: "label", text: "Familiar building blocks", color: "muted" });
    const cw = 316, gap = 25, cy = 612, ch = 276;
    const defs = [
      { cue: "db", title: "Databases", body: "Store data for later", icon: "database" },
      { cue: "cache", title: "Caches", body: "Remember expensive results", icon: "cache" },
      { cue: "search", title: "Search indexes", body: "Find records by keyword", icon: "search" },
      { cue: "stream", title: "Streams", body: "Pass messages asynchronously", icon: "stream" },
      { cue: "batch", title: "Batch jobs", body: "Crunch large piles of data", icon: "batch" },
    ];
    s.slots = defs.map((d, i) => {
      const g = U.sv("rect", { x: 120 + i * (cw + gap), y: cy, width: cw, height: ch, rx: 26, fill: "none", stroke: C.line2, "stroke-width": 2.5, "stroke-dasharray": "10 10" }, svg);
      return g;
    });
    s.cards = defs.map((d, i) => {
      const n = K.card(root, { x: 120 + i * (cw + gap), y: cy, w: cw, h: ch, title: d.title, body: d.body, icon: d.icon });
      n.style.padding = "30px 30px";
      const t = n.querySelector(".k-card-title"); t.style.fontSize = "34px";
      const b = n.querySelector(".k-card-body"); b.style.fontSize = "29px"; b.style.marginTop = "10px";
      return { n, t, icon: n.querySelector(".k-card-icon svg"), cue: d.cue };
    });
    return s;
  },

  update(t, k, s) {
    const C = K.C;
    // Every beat is anchored to the narrator's word (whisper timings via k.word); nothing lands before it is said.
    // --- cpu: the question, then Data (bright) and CPU (shown, then dimmed back).
    A.show(s.title, t, k.word("cpu", "What"));
    // "Data" is the 2nd hit: the 1st is "data-intensive" in the question.
    const tData = k.word("cpu", "Data", 1), tCpu = k.word("cpu", "CPU"), tMain = k.word("cpu", "main challenge");
    A.show(s.data.inner, t, tData, { d: 0.6, dy: 16, s0: 0.94 });
    A.show(s.dataSub, t, tMain, { d: 0.5, dy: 8 });
    const cpuIn = A.show(s.cpu.inner, t, tCpu, { d: 0.5, dy: 16 });
    const back = A.prog(t, k.word("cpu", "power") + 0.25, 0.8, A.E.inOutCubic); // "not CPU power" → fades back
    s.cpu.setTone("dark", back);
    s.cpu.inner.style.opacity = (cpuIn * (1 - 0.45 * back)).toFixed(4);
    if (back > 0) s.cpu.inner.style.transform = `scale(${(1 - 0.07 * back).toFixed(4)})`;

    // --- three: volume / complexity / speed of change light up one by one.
    const tw = [k.word("three", "volume"), k.word("three", "complexity"), k.word("three", "how fast")];
    s.words.forEach((n, i) => {
      s.fan[i].draw(t, tw[i] - 0.05, 0.4);
      A.show(n, t, tw[i], { d: 0.5, dy: 0, dx: -18 });
      const lit = A.prog(t, tw[i], 0.5);
      // Lit flash that settles: bright fill fades back to a soft tint.
      const flash = A.win(t, tw[i], tw[i] + 0.7, 0.3);
      n.style.color = A.mix(C.muted, C.hl, lit);
      n.style.background = `color-mix(in srgb, ${C.hl} ${(8 + 14 * flash).toFixed(1)}%, ${C.bg})`;
      n.style.boxShadow = `0 0 ${(28 * flash).toFixed(1)}px rgba(255,214,107,${(0.35 * flash).toFixed(3)})`;
    });

    // --- db…batch: header + ghost slots at "building blocks", then each card at its word; active card highlighted.
    const tSlots = k.word("db", "building blocks");
    A.show(s.kicker, t, tSlots, { d: 0.5, dy: 10 });
    const tCards = [k.word("db", "Databases"), k.word("cache", "Caches"), k.word("search", "Search"), k.word("stream", "Streams"), k.word("batch", "Batch")];
    const tEnd = k.cueEnd("batch") - 0.35;
    s.cards.forEach((c, i) => {
      const t0 = tCards[i], t1 = i < 4 ? tCards[i + 1] : tEnd;
      const inP = A.show(c.n, t, t0, { d: 0.55, dy: 22 });
      const slotOn = A.prog(t, tSlots + i * 0.08, 0.5) * (1 - A.prog(t, t0, 0.3));
      A.setOpacity(s.slots[i], 0.9 * slotOn);
      const a = A.win(t, t0, t1, 0.35) * (inP > 0 ? 1 : 0);
      c.n.style.borderColor = A.mix(C.line, C.hl, a);
      c.n.style.background = `color-mix(in srgb, ${C.hl} ${(10 * a).toFixed(1)}%, ${C.surface})`;
      c.t.style.color = A.mix(C.ink, C.hl, a);
      c.icon.setAttribute("stroke", A.mix(C.muted, C.hl, a));
    });
  },
});
