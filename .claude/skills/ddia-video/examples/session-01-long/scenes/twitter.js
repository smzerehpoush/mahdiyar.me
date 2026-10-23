// S12 — Twitter, circa 2012. Two operations as a rate strip (4,600 posts/s vs 300,000 timeline reads/s), what "fan-out" means
// in general (one request → many lookups or writes), then fan-out on read (left) vs fan-out on write (right), and the ratio:
// ≈ 65 timeline reads per tweet. Every beat is anchored to the spoken word (k.word).
(() => {
  const C = K.C;

  // A small box with an inline icon and short entry bars (a user's tweets, or a cached timeline).
  function listBox(svg, o) {
    const isz = o.iconSize || 30, rows = 3, bh = 7, pad = 12;
    const b = box(svg, { x: o.x, y: o.y, w: o.w, h: o.h, label: "", icon: o.icon, iconInline: true, iconSize: isz, r: 14 });
    const x0 = 22 + isz + 16, x1 = o.w - 20, gap = (o.h - 2 * pad - rows * bh) / (rows - 1);
    const bars = [0.9, 0.66, 0.8].map((wf, i) => U.sv("rect", { x: x0, y: pad + i * (bh + gap), width: (x1 - x0) * wf, height: bh, rx: 3.5, fill: C.line2 }, b.inner));
    return Object.assign(b, { bars });
  }
  // Workaround: tokens.css gives every SVG node `transform-origin: center; transform-box: fill-box`, which shifts the
  // `scale()` attribute that K.box / K.svgIcon put on their icons (by ~10–17 px). Restore plain SVG transform semantics.
  const fixIcon = (n) => { if (n) { n.style.transformBox = "view-box"; n.style.transformOrigin = "0 0"; } return n; };
  const box = (svg, o) => { const b = K.box(svg, o); fixIcon(b.icon); return b; };
  const icon = (svg, name, o) => { const i = K.svgIcon(svg, name, o); fixIcon(i.ig); return i; };
  const stackYs = (top, n, h, gap) => Array.from({ length: n }, (_, i) => top + i * (h + gap));

  R.scene("twitter", {
    build(root, k) {
      const s = {};
      s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Twitter’s home timeline" });
      const svg = K.svgLayer(root);

      // ---- Beat `ops`: the two operations as a rate strip (bar length ∝ requests/s).
      const BX = 540, BMAX = 560;
      s.barW = [BMAX * 4600 / 300000, BMAX];
      const row = (y, ic, name, sub, value) => {
        const g = U.sv("g", {}, svg);
        const head = U.sv("g", {}, g);
        icon(head, ic, { x: 120, y: y - 24, size: 48, color: "sca" });
        K.label(head, { x: 190, y: y + 10, text: name, size: 32, weight: 750, anchor: "start" });
        K.label(head, { x: 190, y: y + 44, text: sub, size: 26, weight: 550, fill: "muted", anchor: "start" });
        U.sv("rect", { x: BX, y: y - 17, width: BMAX, height: 34, rx: 8, fill: C.bg2 }, g); // track
        const bar = U.sv("rect", { x: BX, y: y - 17, width: 0, height: 34, rx: 6, fill: C.sca }, g);
        const val = K.label(g, { x: 0, y: y + 12, text: value, size: 36, weight: 700, mono: true, anchor: "start" });
        return { g, head, bar, val };
      };
      s.r1 = row(262, "tweet", "Post a tweet", "average; peak over 12,000", "≈ 4,600 / s");
      s.r2 = row(356, "eye", "Home timeline read", "your feed", "≈ 300,000 / s");
      s.r1.val.g.setAttribute("transform", `translate(${BX + s.barW[0] + 22},${262 + 12})`);
      s.r2.val.g.setAttribute("transform", `translate(${BX + BMAX + 22},${356 + 12})`);

      // ---- Beat `ratio` (built here, shown last): brace over both rows → ≈ 65 reads per tweet.
      const bx = 1420, by0 = 236, by1 = 384, bm = (by0 + by1) / 2;
      s.brace = U.sv("path", { d: `M${bx},${by0} q16,0 16,16 v${bm - by0 - 32} q0,16 16,16 q-16,0 -16,16 v${by1 - bm - 32} q0,16 -16,16`, fill: "none", stroke: C.hl, "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round" }, svg);

      // ---- Line 3: what "fan-out" means in general — one request multiplying into many lookups or writes. Neutral data-store
      // targets and yellow request dots, so it does not pre-empt fan-out on write. The header reveals phrase by phrase.
      s.pre = U.sv("g", {}, svg);
      const hdrG = U.sv("g", { transform: "translate(960,486)" }, s.pre);
      s.preHdr = U.sv("g", {}, hdrG);
      const FANOUT = "Fan-out: one request → many lookups or writes";
      const [h0, h1, h2] = [FANOUT.slice(0, 8), FANOUT.slice(8, 20), FANOUT.slice(20)]; // "Fan-out:" | " one request" | " → many lookups or writes"
      const hdrT = U.sv("text", { x: 0, y: 0, "text-anchor": "middle", "font-size": 38, "font-weight": 750, fill: C.ink }, s.preHdr);
      U.sv("tspan", { fill: C.sca, "font-weight": 800 }, hdrT, h0);
      s.preHdrA = U.sv("tspan", {}, hdrT, h1);
      s.preHdrB = U.sv("tspan", {}, hdrT, h2);
      s.preTweet = box(s.pre, { x: 590, y: 650, w: 230, h: 124, label: "1 request", icon: "stream", tone: "hl" });
      const preYs = stackYs(556, 5, 50, 14);
      s.preTl = preYs.map((y) => listBox(s.pre, { x: 1100, y, w: 230, h: 50, icon: "database", iconSize: 28 }));
      s.preArr = s.preTl.map((b) => K.arrow(s.pre, { from: s.preTweet.right, to: b.left, gapStart: 14, gapEnd: 12, width: 3 }));
      s.prePk = s.preArr.map((a) => K.packets(s.pre, a, { n: 1, period: 1.0, r: 8, tone: "hl" }));

      // ---- Beat `onread` (left panel): your request looks up everyone you follow, then merges their tweets.
      const LY = stackYs(572, 4, 54, 14), CY = 701;
      s.left = U.sv("g", {}, svg);
      s.lHdr = U.sv("g", {}, s.left);
      K.label(s.lHdr, { x: 120, y: 470, text: "Fan-out on read", size: 40, weight: 800, fill: "sca", anchor: "start" });
      s.lSub = K.label(s.left, { x: 120, y: 510, text: "Build the timeline when it’s opened", size: 28, weight: 550, fill: "muted", anchor: "start" });
      s.you = box(s.left, { x: 120, y: CY - 64, w: 170, h: 128, label: "You", icon: "user" });
      s.fGroup = K.label(s.left, { x: 515, y: 556, text: "Everyone you follow", size: 26, weight: 600, fill: "muted" });
      s.fol = LY.map((y) => listBox(s.left, { x: 410, y, w: 210, h: 54, icon: "user" }));
      s.merge = box(s.left, { x: 724, y: CY - 65, w: 176, h: 130, label: "Merge", sub: "by time", fs: 34 }); // fs 34 → sub 27 px (K.box sub = 0.78·fs)
      s.lArrOut = s.fol.map((b) => K.arrow(s.left, { from: s.you.right, to: b.left, gapStart: 12, gapEnd: 12, width: 3 }));
      s.lArrIn = s.fol.map((b) => K.arrow(s.left, { from: b.right, to: s.merge.left, gapStart: 12, gapEnd: 12, width: 3 }));
      s.reqP = s.lArrOut.map((a) => K.packets(s.left, a, { n: 1, period: 1.2, r: 8, tone: "hl" }));
      s.reqP2 = s.lArrOut.map((a) => K.packets(s.left, a, { n: 1, period: 1.2, r: 8, tone: "bad" }));
      s.twP = s.lArrIn.map((a) => K.packets(s.left, a, { n: 1, period: 1.2, r: 8, tone: "sca" }));

      // ---- Beat `onwrite` (right panel): a new tweet is copied into every follower's cached timeline ("mailbox").
      s.sep = U.sv("line", { x1: 960, y1: 446, x2: 960, y2: 918, stroke: C.line, "stroke-width": 2 }, svg);
      s.right = U.sv("g", {}, svg);
      s.rHdr = U.sv("g", {}, s.right);
      K.label(s.rHdr, { x: 1020, y: 470, text: "Fan-out on write", size: 40, weight: 800, fill: "sca", anchor: "start" });
      s.rSub = K.label(s.right, { x: 1020, y: 510, text: "Copy each tweet when it’s posted", size: 28, weight: 550, fill: "muted", anchor: "start" });
      s.newTw = box(s.right, { x: 1020, y: CY - 64, w: 196, h: 128, label: "New tweet", icon: "tweet" });
      s.mGroup = K.label(s.right, { x: 1445, y: 556, text: "Each user’s cached timeline", size: 26, weight: 600, fill: "muted" });
      s.mbox = LY.map((y) => listBox(s.right, { x: 1340, y, w: 210, h: 54, icon: "user" }));
      s.mbox.forEach((b) => b.bars[0].setAttribute("fill", C.sca));
      s.wArr = s.mbox.map((b) => K.arrow(s.right, { from: s.newTw.right, to: b.left, gapStart: 12, gapEnd: 12, width: 3 }));
      s.cpP = s.wArr.map((a) => K.packets(s.right, a, { n: 1, period: 1.6, r: 8, tone: "sca" }));
      // The reader is one of the followers: a single short lookup from their own mailbox.
      const mine = s.mbox[1];
      s.you2 = box(s.right, { x: 1660, y: mine.cy - 64, w: 140, h: 128, label: "You", icon: "user" });
      s.lookArr = K.arrow(s.right, { from: mine.right, to: s.you2.left, gapStart: 12, gapEnd: 12, width: 4 });
      s.lookP = K.packets(s.right, s.lookArr, { n: 1, period: 1.0, r: 8, tone: "ok" });
      s.lookLbl = K.label(s.right, { x: s.you2.cx, y: s.you2.y + 128 + 40, text: "1 lookup", size: 28, weight: 750, fill: "ok" });
      s.check = K.mark(svg, "check", { x: 1388, y: 457, size: 46 });

      // ---- Verdicts (HTML pills) and the ratio callout.
      s.pillL = K.pill(root, { x: 120, y: 860, text: "Heavy work on every read", tone: "bad" });
      s.strug = K.text(root, { x: 590, y: 872, cls: "small", text: "→ struggled to keep up", color: "bad" });
      s.pillR = K.pill(root, { x: 1020, y: 860, text: "Reads became cheap", tone: "ok" });
      s.ratio = U.el("div", {}, root);
      Object.assign(s.ratio.style, { position: "absolute", left: "1462px", top: "222px", width: "338px" });
      s.ratioNum = U.el("div", { class: "k-text" }, s.ratio, "≈ 65");
      Object.assign(s.ratioNum.style, { position: "relative", fontSize: "96px", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: "0.98", color: C.hl, fontVariantNumeric: "tabular-nums" });
      s.ratioSub = U.el("div", { class: "k-text label" }, s.ratio, "timeline reads per tweet");
      Object.assign(s.ratioSub.style, { position: "relative", fontSize: "28px", fontWeight: 700, marginTop: "6px", whiteSpace: "nowrap" });
      s.ratioTake = U.el("div", { class: "k-text small" }, s.ratio, "→ do the work on write");
      Object.assign(s.ratioTake.style, { position: "relative", marginTop: "4px", whiteSpace: "nowrap" });
      s.badge = K.badge(root, { right: 120, y: 52, text: "Twitter, circa 2012" });
      return s;
    },

    update(t, k, s) {
      const cRead = k.cue("onread"), cWrite = k.cue("onwrite"), cCheap = k.cue("onwrite-cheap"), cRatio = k.cue("ratio");

      // Title and badge land on "Twitter" ("A historical example: Twitter, around 2012").
      const wTw = k.word("badge", "Twitter");
      A.show(s.title, t, 0.3); // section heading: lands with the scene, ahead of the voice
      A.show(s.badge, t, wTw + 0.05, { d: 0.5, dy: 0 });

      // `ops`: post-a-tweet row, then the timeline-read row whose bar dwarfs it. Values land on the spoken numbers.
      const cOps = k.cue("ops"), L2 = k.lines[2].start;
      A.show(s.r1.head, t, cOps + 0.05, { dy: 12 });
      const w46 = k.word("ops", "4,600");
      s.r1.bar.setAttribute("width", (s.barW[0] * A.prog(t, w46 - 0.05, 0.4)).toFixed(2));
      A.show(s.r1.val.inner, t, w46, { dy: 10 });
      A.show(s.r2.head, t, L2 + 0.05, { dy: 12 });
      const w300 = k.word(2, "300,000");
      s.r2.bar.setAttribute("width", (s.barW[1] * A.prog(t, w300 - 0.05, 0.9, A.E.inOutCubic)).toFixed(2));
      A.show(s.r2.val.inner, t, w300 + 0.15, { dy: 10 });
      s.r1.g.style.opacity = A.prog(t, cOps + 0.05, 0.4).toFixed(3);
      s.r2.g.style.opacity = A.prog(t, L2 + 0.05, 0.4).toFixed(3);

      // Line 3: "fan-out: one request multiplying into many lookups or writes". Gone before the comparison starts.
      const wFan = k.word(3, "fan-out"), wOne = k.word(3, "one request"), wMul = k.word(3, "multiplying"), wMany = k.word(3, "many");
      A.show(s.preHdr, t, wFan - 0.05, { dy: 12 });
      s.preHdrA.setAttribute("fill-opacity", A.prog(t, wOne - 0.05, 0.35).toFixed(3));
      s.preHdrB.setAttribute("fill-opacity", A.prog(t, wMany - 0.05, 0.35).toFixed(3));
      A.show(s.preTweet.inner, t, wOne, { dy: 12 });
      s.preArr.forEach((a, i) => a.draw(t, wMul + i * 0.06, 0.5));
      s.preTl.forEach((b, i) => A.show(b.inner, t, wMul + 0.2 + i * 0.08, { dy: 0, dx: -12 }));
      s.prePk.forEach((p, i) => p.update(t - wMul - 0.35 - i * 0.08, A.prog(t, wMul + 0.35 + i * 0.08, 0.15)));
      A.setOpacity(s.pre, 1 - A.prog(t, cRead - 0.05, 0.4, A.E.inOutCubic));

      // `onread`: the left panel builds as the narrator walks the read path.
      // Dim the left panel while the right one is explained, but keep it legible in the side-by-side final frame (floor ≈ 0.62);
      // its verdict lines are half the takeaway, so they keep a higher floor.
      const lDim = 1 - 0.3 * A.prog(t, cWrite + 0.1, 0.6) - 0.08 * A.prog(t, cRatio + 0.2, 0.6);
      const vDim = Math.max(lDim, 0.8);
      A.show(s.left, t, cRead + 0.1, { dy: 0, d: 0.3, max: lDim });
      A.show(s.lHdr, t, k.word("onread", "fan-out") - 0.05, { dy: 14 });     // "fan-out on read"
      const wOpen = k.word("onread", "opening");                              // "opening your timeline"
      A.show(s.lSub.inner, t, wOpen, { dy: 10 });
      A.show(s.you.inner, t, wOpen, { dy: 14 });
      const tLook = k.word("onread", "looking"), tMerge = k.word("onread", "merging");
      A.show(s.fGroup.inner, t, k.word("onread", "everyone") - 0.05, { dy: 10 });
      s.fol.forEach((b, i) => A.show(b.inner, t, tLook + 0.1 + i * 0.07, { dy: 0, dx: -12 }));
      s.lArrOut.forEach((a, i) => a.draw(t, tLook + i * 0.06, 0.5));
      A.show(s.merge.inner, t, tMerge, { dy: 14 });
      s.lArrIn.forEach((a, i) => a.draw(t, tMerge + i * 0.06, 0.5));
      // Fetched tweets light up in each followed account.
      s.fol.forEach((b) => b.bars[0].setAttribute("fill", A.mix(C.line2, C.sca, A.prog(t, tMerge + 0.2, 0.4))));
      // `onread-cost`: on "heavy work" the read path goes red and gets busier; verdict; "struggled to keep up".
      const wHeavy = k.word("onread-cost", "heavy");
      const cost = A.prog(t, wHeavy - 0.05, 0.5);
      const leftFlow = 1 - A.prog(t, cWrite + 0.1, 0.5);
      s.lArrOut.concat(s.lArrIn).forEach((a) => a.setTone(A.mix(C.line2, C.bad, cost)));
      s.reqP.forEach((p) => p.update(t - tLook - 0.4, A.prog(t, tLook + 0.4, 0.2) * leftFlow, { tone: A.mix(C.hl, C.bad, cost) }));
      s.reqP2.forEach((p) => p.update(t - tLook - 0.4 + 0.6, cost * leftFlow));
      s.twP.forEach((p) => p.update(t - tMerge - 0.4, A.prog(t, tMerge + 0.4, 0.2) * leftFlow));
      s.merge.setTone("bad", cost);
      A.show(s.pillL, t, wHeavy, { dy: 12, max: vDim });
      A.show(s.strug, t, k.word("onread-cost", "struggled"), { dy: 10, max: vDim });

      // `onwrite`: the right panel — header on "fan-out on write", users' mailboxes on "each user gets a cached timeline",
      // then the new tweet is copied into each of them on "copied".
      A.setOpacity(s.sep, A.prog(t, cWrite + 0.3, 0.6));
      A.show(s.rHdr, t, k.word("onwrite", "fan-out") - 0.05, { dy: 14 });
      const wEach = k.word("onwrite", "Each user");
      s.mbox.forEach((b, i) => A.show(b.inner, t, wEach + 0.05 + i * 0.08, { dy: 0, dx: -12 }));
      A.show(s.mGroup.inner, t, k.word("onwrite", "cached"), { dy: 10 });
      A.show(s.newTw.inner, t, k.word(7, "new tweet"), { dy: 14 });
      const tCopy = k.word(7, "copied");
      A.show(s.rSub.inner, t, tCopy, { dy: 10 });
      s.wArr.forEach((a, i) => a.draw(t, tCopy + i * 0.06, 0.5));
      s.cpP.forEach((p) => p.update(t - tCopy - 0.35, A.prog(t, tCopy + 0.35, 0.2)));
      // The copied tweet lands at the top of each mailbox when the first packet arrives (one packet period later).
      s.mbox.forEach((b) => A.setOpacity(b.bars[0], A.prog(t, tCopy + 0.35 + 1.6 * 0.95, 0.3)));
      // `onwrite-cheap`: the reader's lookup is one short hop; "cheap" → verdict, "lookup" → label.
      A.show(s.you2.inner, t, cCheap + 0.05, { dy: 14 });
      s.lookArr.draw(t, cCheap + 0.3, 0.4);
      s.lookArr.setTone("ok");
      s.lookP.update(t - cCheap - 0.6, A.prog(t, cCheap + 0.6, 0.2));
      const wCheap = k.word("onwrite-cheap", "cheap");
      s.you2.setTone("ok", A.prog(t, wCheap, 0.4));
      A.show(s.pillR, t, wCheap, { dy: 12 });
      A.show(s.lookLbl.inner, t, k.word("onwrite-cheap", "lookup"), { dy: 10 });

      // `ratio`: "That trade paid off" → check on fan-out on write; "because reads dominate" → the read bar flares and the brace
      // spans both rows; "roughly 65" → the counter; "timeline reads" → its unit; "…every tweet posted" → the takeaway.
      A.show(s.check.inner, t, k.word("ratio", "paid off"), { d: 0.45, dy: 0, s0: 0.3, ease: A.E.outBack });
      const wDom = k.word("ratio", "reads dominate"), w65 = k.word("ratio", "65");
      s.r2.bar.setAttribute("fill", A.mix(C.sca, C.hl, 0.8 * A.win(t, wDom, w65 + 0.3, 0.35)));
      A.draw(s.brace, t, wDom, 0.5);
      A.show(s.ratio, t, w65 - 0.05, { d: 0.4, dy: 0, dx: -14 });
      s.ratioNum.textContent = "≈ " + Math.round(65 * A.prog(t, w65 - 0.05, 0.5, A.E.outCubic));
      A.show(s.ratioSub, t, k.word("ratio", "timeline reads"), { dy: 8 });
      A.show(s.ratioTake, t, k.word("ratio", "posted") - 0.1, { dy: 8 });
    },
  });
})();
