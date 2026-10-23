// S14 — Twitter's hybrid: most tweets fan out on write into precomputed timelines; celebrity tweets skip fan-out and are
// fetched at read time; the two are merged by time into your timeline. Lesson: a few outliers can decide the whole design —
// and that's true for speed, too (bridge to response times). Every beat is anchored to the spoken word (k.word).
R.scene("hybrid", {
  build(root, k) {
    const s = {}, C = K.C;
    s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "A hybrid: two paths, one timeline." });
    s.badge = K.badge(root, { right: 120, y: 52, text: "Twitter, circa 2012" }); // same spot as in the twitter scene (pinned top-right)

    const svg = K.svgLayer(root);
    s.diag = U.sv("g", {}, svg);
    const fixHead = (a) => { if (a.head) { a.head.style.transformBox = "view-box"; a.head.style.transformOrigin = "0 0"; } return a; };
    // Same runtime quirk for box icons: the global `svg * { transform-box: fill-box; transform-origin: center }` makes the
    // icon's `scale()` attribute scale about its own centre (~10 px offset). Restore plain SVG semantics, as twitter.js does.
    const fixIcon = (b) => { if (b.icon) { b.icon.style.transformBox = "view-box"; b.icon.style.transformOrigin = "0 0"; } return b; };

    // ---- Lane A (beat `precomputed`): most accounts → fan-out on write → precomputed timelines.
    s.laneA = K.label(s.diag, { x: 120, y: 298, text: "Fan-out on write · most users", anchor: "start", size: 32, weight: 750, fill: "sca" });
    s.users = fixIcon(K.box(s.diag, { x: 120, y: 322, w: 300, h: 136, label: "Most users", icon: "users" }));
    s.pre = fixIcon(K.box(s.diag, { x: 600, y: 322, w: 400, h: 136, label: "Precomputed timelines", icon: "layers" }));
    s.aA = K.arrow(s.diag, { from: s.users.right, to: s.pre.left, gapStart: 14, gapEnd: 14, tone: "sca" });
    s.pA = K.packets(s.diag, s.aA, { n: 3, period: 1.3, tone: "sca" });

    // ---- Lane B (beat `celebs`): celebrities skip fan-out; their tweets are fetched at read time.
    s.cel = fixIcon(K.box(s.diag, { x: 120, y: 612, w: 300, h: 136, label: "Celebrities", icon: "star", tone: "hl" }));
    s.ctw = fixIcon(K.box(s.diag, { x: 600, y: 612, w: 400, h: 136, label: "Celebrity tweets", icon: "database" }));
    s.aB = K.arrow(s.diag, { from: s.cel.right, to: s.ctw.left, gapStart: 14, gapEnd: 14, tone: "hl" });
    s.pB = K.packets(s.diag, s.aB, { n: 1, period: 2.2, tone: "hl" });
    s.laneB = K.label(s.diag, { x: 120, y: 800, text: "Fetched at read time · a few huge accounts", anchor: "start", size: 32, weight: 750, fill: "hl" });
    // The skipped step: a dashed fan-out arrow towards the precomputed timelines, crossed out.
    s.skip = U.sv("g", {}, s.diag);
    s.aSkip = fixHead(K.arrow(s.skip, { from: [330, 604], to: [650, 470], dashed: true, tone: "bad", width: 3 }));
    s.xSkip = K.mark(s.skip, "x", { x: 490, y: 537, size: 46 });
    s.skipLbl = K.label(s.skip, { x: 506, y: 588, text: "skips fan-out", anchor: "start", size: 28, weight: 700, fill: "bad" });

    // ---- Beat `merge`: both sources → merge by time → your timeline.
    s.merge = fixIcon(K.box(s.diag, { x: 1110, y: 467, w: 260, h: 136, label: "Merge by time", icon: "clock" }));
    s.m1 = K.arrow(s.diag, { from: [1014, 390], via: [[1056, 390], [1056, 505]], to: [1098, 505], tone: "sca" });
    s.m2 = K.arrow(s.diag, { from: [1014, 680], via: [[1056, 680], [1056, 565]], to: [1098, 565], tone: "hl" });
    s.m3 = K.arrow(s.diag, { from: [1382, 535], to: [1432, 535], width: 4, tone: "ink" });
    s.pm1 = K.packets(s.diag, s.m1, { n: 2, period: 1.2, tone: "sca" });
    s.pm2 = K.packets(s.diag, s.m2, { n: 2, period: 1.2, tone: "hl" });

    // Your timeline: a panel whose rows arrive interleaved, newest first.
    s.panel = K.card(root, { x: 1440, y: 296, w: 360, title: "Your timeline" });
    s.panel.style.padding = "24px 22px 26px";
    s.panel.querySelector(".k-card-title").style.fontSize = "36px";
    const items = [
      { who: "Celebrity", at: "12:05", cel: true },
      { who: "Friend", at: "12:04" },
      { who: "Colleague", at: "12:02" },
      { who: "Celebrity", at: "11:58", cel: true },
      { who: "Neighbor", at: "11:55" },
    ];
    s.rows = items.map((it) => {
      const col = it.cel ? C.hl : C.sca;
      const r = U.el("div", { style: { position: "relative", display: "flex", alignItems: "center", gap: "12px", height: "60px", marginTop: "12px",
        padding: "0 16px 0 14px", borderRadius: "14px", background: C.surface2, borderLeft: `6px solid ${col}` } }, s.panel);
      U.el("div", { html: K.iconSvg(it.cel ? "star" : "user", 30, col, 4), style: { width: "30px", height: "30px", flex: "none" } }, r);
      U.el("div", { style: { fontSize: "28px", fontWeight: 700, color: C.ink, flex: "1" } }, r, it.who);
      U.el("div", { style: { fontSize: "26px", fontWeight: 600, color: C.muted, fontFamily: "var(--mono)" } }, r, it.at);
      return r;
    });

    // ---- Beat `lesson`: "The lesson: a few outliers can decide the whole design. That's true for speed, too."
    // Card + follow-up chip stacked in a centred column (no measuring needed).
    s.lessonCol = U.el("div", { style: { position: "absolute", left: "260px", top: "392px", width: "1400px", display: "flex",
      flexDirection: "column", alignItems: "center", gap: "34px" } }, root);
    s.lesson = K.card(s.lessonCol, { x: 0, y: 0, w: 1400, accent: "sca", title: "The lesson",
      body: "<span style='font-size:58px;color:#E9EEF5;font-weight:750;letter-spacing:-0.02em;line-height:1.15'>A few outliers can decide the whole design.</span>" });
    Object.assign(s.lesson.style, { position: "relative", left: "auto", top: "auto", textAlign: "center", padding: "30px 40px 36px" });
    s.lesson.querySelector(".k-card-title").style.fontSize = "32px";
    s.speed = K.chip(s.lessonCol, { text: "That’s true for speed, too.", icon: "clock", accent: "hl", size: 34 });
    Object.assign(s.speed.style, { position: "relative", background: C.bg2 });
    return s;
  },

  update(t, k, s) {
    const cL = k.cue("lesson");

    A.show(s.title, t, 0.3); // section heading: lands with the scene, ahead of the voice
    A.setOpacity(s.badge, 1); // pinned: no entrance, so it stays put across the Twitter scenes

    // Everything dims as the lesson starts; the card lands on "a few outliers".
    const dim = 1 - 0.78 * A.prog(t, cL, 0.6);
    A.setOpacity(s.diag, dim);

    // Lane A: "Most users' tweets still fan out on write, into precomputed timelines."
    const wMost = k.word("precomputed", "Most"), wFan = k.word("precomputed", "fan out"), wPre = k.word("precomputed", "precomputed");
    A.show(s.users.inner, t, wMost - 0.05, { dy: 14 });
    A.show(s.laneA.inner, t, wFan - 0.05, { dy: 10 });
    s.aA.draw(t, wFan, 0.7);
    A.show(s.pre.inner, t, wPre - 0.1, { dy: 14 });
    s.pA.update(t, A.prog(t, wPre, 0.4));

    // Lane B: "Tweets from the few accounts with huge followings skip that step and are fetched when you read."
    const wFew = k.word("celebs", "few"), wSkip = k.word("celebs", "skip"), wStep = k.word("celebs", "that step"), wFetch = k.word("celebs", "fetched");
    A.show(s.cel.inner, t, wFew - 0.05, { dy: 14 });
    s.aSkip.draw(t, wSkip - 0.05, 0.5);
    A.show(s.xSkip.inner, t, wStep, { d: 0.45, dy: 0, s0: 0.3, ease: A.E.outBack });
    A.show(s.skipLbl.inner, t, wSkip + 0.1, { dy: 8 });
    s.aB.draw(t, wFetch - 0.25, 0.5);
    A.show(s.ctw.inner, t, wFetch - 0.05, { dy: 14 });
    A.show(s.laneB.inner, t, wFetch, { dy: -10 });
    s.pB.update(t, A.prog(t, wFetch + 0.3, 0.4));

    // Merge: "When you open your timeline, the two are merged by time."
    const wYour = k.word("merge", "your timeline"), wTwo = k.word("merge", "the two"), wMerged = k.word("merge", "merged"), wByTime = k.word("merge", "by time");
    const pOp = A.show(s.panel, t, wYour - 0.05, { dy: 16 });
    s.panel.style.opacity = (pOp * dim).toFixed(4);
    s.m1.draw(t, wTwo, 0.6);
    s.m2.draw(t, wTwo, 0.6);
    A.show(s.merge.inner, t, wMerged - 0.05, { dy: 14 });
    s.m3.draw(t, wMerged + 0.25, 0.4);
    const flow = A.prog(t, wMerged + 0.25, 0.4);
    s.pm1.update(t, flow);
    s.pm2.update(t + 0.6, flow);
    s.rows.forEach((r, i) => A.show(r, t, wByTime + 0.1 + i * 0.22, { d: 0.45, dy: 0, dx: -28 }));

    // Lesson: the card on "a few outliers can decide the whole design"; the bridge chip on "true for speed, too".
    A.show(s.lesson, t, k.word("lesson", "few outliers") - 0.15, { s0: 0.96, dy: 10 });
    A.show(s.speed, t, k.word("lesson", "speed") - 0.1, { dy: 12, s0: 0.94 });
  },
});
