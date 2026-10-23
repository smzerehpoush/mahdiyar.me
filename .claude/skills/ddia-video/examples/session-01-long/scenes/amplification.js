// S18 — Tail latency amplification. Left: one user request scatters to 100 backend calls and must gather all of them;
// one slow call makes the whole response slow. Right: P(at least one slow) = 1 − 0.99¹⁰⁰ ≈ 63% and a grid of 100 user
// requests filling to 63 red. Bottom: the two assumptions, then the name of the effect.
// Every beat is anchored to the spoken word it depicts (k.word), see update().
(function () {
  const C = K.C;
  const hx = (c) => { c = c.replace("#", ""); return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16)); };
  const mixA = (a, b, p) => a.map((v, i) => v + (b[i] - v) * p);
  const css = (a) => `rgb(${a.map((v) => Math.round(v)).join(",")})`;
  const tone = (n) => ({ fill: hx(K.TONES[n].fill), stroke: hx(K.TONES[n].stroke) });
  const TN = tone("neutral"), TH = tone("hl"), TG = tone("ok"), TB = tone("bad");

  // Geometry of the call strip: 5 × 20 thin bars.
  const COLS = 5, ROWS = 20, CW = 30, CH = 14, PX = 40, PY = 24, X0 = 470, Y0 = 330;
  const CY = Y0 + ((ROWS - 1) * PY + CH) / 2; // vertical centre of the strip
  const COL_L = X0, COL_R = X0 + (COLS - 1) * PX + CW;
  const REQ_X = 120, RESP_X = 800, BOX_W = 210, BOX_H = 140;
  const SLOW = 7 * COLS + 3; // the one call that happens to be slow in this request
  // Workaround: tokens.css gives every SVG node transform-box: fill-box / origin: center, which also applies to K.box's icon
  // `translate(..) scale(..)` attribute and shifts the icon ~10 px off-centre. Restore SVG's default attribute semantics.
  const fixIcon = (b) => { if (b.icon) Object.assign(b.icon.style, { transformBox: "view-box", transformOrigin: "0 0" }); };

  R.scene("amplification", {
    build(root, k) {
      const s = {};
      const amp = k.data.amp;
      s.nSlow = Math.round(amp.pAnySlow * 100); // 63
      s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Fan-out makes tails worse." });
      const svg = K.svgLayer(root);

      // Scatter (request → each row) and gather (each row → response) hairlines.
      s.fan = []; s.join = [];
      for (let r = 0; r < ROWS; r++) {
        const ry = Y0 + r * PY + CH / 2;
        s.fan.push(K.arrow(svg, { from: [REQ_X + BOX_W, CY], to: [COL_L, ry], gapStart: 12, gapEnd: 10, width: 2, head: false }));
        s.join.push(K.arrow(svg, { from: [COL_R, ry], to: [RESP_X, CY], gapStart: 10, gapEnd: 12, width: 2, head: false }));
      }
      s.req = K.box(svg, { x: REQ_X, y: CY - BOX_H / 2, w: BOX_W, h: BOX_H, label: "Request", icon: "user" });
      s.resp = K.box(svg, { x: RESP_X, y: CY - BOX_H / 2, w: BOX_W, h: BOX_H, label: "Response", icon: "clock", tone: "ghost" });
      fixIcon(s.req); fixIcon(s.resp);
      // Stopwatch: replace the clock icon's fixed hands with one hand that sweeps while the request waits.
      s.resp.icon.innerHTML = '<circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="2" fill="currentColor"/>';
      s.hand = U.sv("path", { d: "M32 32V16" }, s.resp.icon);

      // The 100 calls.
      s.cells = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++)
        s.cells.push(U.sv("rect", { x: X0 + c * PX, y: Y0 + r * PY, width: CW, height: CH, rx: 4, "stroke-width": 2 }, svg));
      const sr = Math.floor(SLOW / COLS), sc = SLOW % COLS;
      s.ring = U.sv("rect", { x: X0 + sc * PX - 7, y: Y0 + sr * PY - 7, width: CW + 14, height: CH + 14, rx: 8, fill: "none", stroke: C.bad, "stroke-width": 3 }, svg);
      s.slowRow = sr;
      // Seeded return order for the 99 fast calls (0..1 → spread over the return window).
      const rng = U.rng(1803);
      s.ret = s.cells.map(() => rng());
      s.rowRet = Array.from({ length: ROWS }, (_, r) => {
        let m = 0; for (let c = 0; c < COLS; c++) { const i = r * COLS + c; if (i !== SLOW) m = Math.max(m, s.ret[i]); } return m;
      });

      // Single-shot request dots: out along the fan, back along the join (green), the slow one red.
      s.outDots = s.fan.map(() => U.sv("circle", { r: 6, fill: C.hl }, svg));
      s.inDots = s.join.map(() => U.sv("circle", { r: 6, fill: C.ok }, svg));
      s.slowDot = U.sv("circle", { r: 8, fill: C.bad }, svg);

      const mid = (COL_L + COL_R) / 2;
      s.hdr = K.label(svg, { x: mid, y: 270, text: `${amp.calls} backend calls`, size: 32, weight: 750 });
      s.sub = K.label(svg, { x: mid, y: 308, text: `each: ${Math.round(amp.pSlow * 100)}% chance of being slow`, size: 28, weight: 650, fill: "bad" });

      s.pill = K.pill(root, { x: RESP_X + BOX_W / 2, y: CY + BOX_H / 2 + 28, text: "0/100 returned", tone: "hl" });
      s.pill.style.transform = "translateX(-50%)";

      // Right panel: the formula.
      s.kicker = K.text(root, { x: 1100, y: 236, cls: "kicker", text: "Chance at least one call is slow" });
      const f = U.el("div", { class: "k-text" }, root);
      Object.assign(f.style, { left: "1100px", top: "290px", fontSize: "80px", fontWeight: 700, lineHeight: "1", whiteSpace: "nowrap", color: C.ink, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" });
      const span = (parent, txt, st = {}) => { const n = U.el("span", {}, parent, txt); Object.assign(n.style, { display: "inline-block", ...st }); return n; };
      // "1 \u2212 ": Bricolage draws U+2212 as a short hyphen-like dash, so the glyph stays in the DOM (text reads "1 \u2212 0.99\u00b9\u2070\u2070")
      // but is painted transparent, and a bar of the digits' stroke weight is drawn in its place.
      s.f1 = span(f, "1 ", { marginRight: "0.18em" });
      const minus = span(s.f1, "\u2212", { position: "relative", width: "0.62em", textAlign: "center", color: "transparent" });
      const bar = U.el("div", {}, minus);
      Object.assign(bar.style, { position: "absolute", left: "0.07em", right: "0.07em", top: "0.47em", height: "0.12em", borderRadius: "0.03em", background: C.ink });
      const grp = span(f, "", { position: "relative" });
      s.f2 = span(grp, "0.99");
      s.f3 = span(grp, "100", { fontSize: "0.5em", position: "relative", top: "-0.95em", marginLeft: "0.05em" }); // superscript ¹⁰⁰
      s.brace = U.el("div", {}, grp);
      Object.assign(s.brace.style, { position: "absolute", left: "4px", right: "0px", top: "calc(100% + 10px)", height: "14px", border: `3px solid ${C.muted}`, borderTop: "none", borderRadius: "0 0 10px 10px" });
      s.note = U.el("div", {}, grp, "all 100 calls fast");
      Object.assign(s.note.style, { position: "absolute", left: "50%", top: "calc(100% + 34px)", transform: "translateX(-50%)", fontFamily: "var(--font)", fontSize: "28px", fontWeight: 600, color: C.muted, whiteSpace: "nowrap", letterSpacing: "0" });
      s.f4 = span(f, `\u2248 ${s.nSlow}%`, { color: C.bad, fontWeight: 800, letterSpacing: "-0.02em", marginLeft: "0.3em" });

      // Right panel: 100 user requests, 63 slow (seeded scatter).
      s.dots = [];
      for (let i = 0; i < 100; i++) {
        const r = Math.floor(i / 10), c = i % 10;
        s.dots.push(U.sv("circle", { cx: 1100 + 13 + c * 32, cy: 486 + 13 + r * 32, r: 12 }, svg));
      }
      const order = Array.from({ length: 100 }, (_, i) => i);
      const rng2 = U.rng(63);
      for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng2() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
      s.rank = new Array(100).fill(1e9); // fill rank of each dot (only the first 63 in `order` turn red)
      order.slice(0, s.nSlow).forEach((d, i) => { s.rank[d] = i; });

      s.of = K.text(root, { x: 1468, y: 480, cls: "label", text: "Of 100 user requests", color: "muted" });
      s.count = K.text(root, { x: 1462, y: 528, cls: "big-num", text: "0", color: "bad" });
      s.slowLbl = K.text(root, { x: 1468, y: 682, cls: "body", text: "are slow" });

      // Bottom strip: assumptions, then the name.
      s.strip = U.el("div", { class: "k-chips" }, root);
      Object.assign(s.strip.style, { left: "120px", top: "846px", width: "1180px", alignItems: "center" });
      s.assumes = U.el("div", { class: "k-text kicker" }, s.strip, "Assumes:");
      s.assumes.style.position = "relative";
      s.c1 = K.chip(s.strip, { text: "calls are independent", accent: "ink" });
      s.c2 = K.chip(s.strip, { text: "the request waits for all calls", accent: "ink" });
      s.name = K.chip(root, { x: 0, y: 846, text: "Tail latency amplification", accent: "hl", size: 32 });
      Object.assign(s.name.style, { left: "auto", right: "120px", background: "var(--hl-soft)" });
      return s;
    },

    update(t, k, s) {
      const cWait = k.cue("waitall");
      A.show(s.title, t, k.cue("fanout")); // "Tails get worse with fan-out."

      // ---- fanout: "Say one user request…" → the request; "…makes 100 backend calls" → the strip.
      const tReq = k.word("fanout", "user request") - 0.1;
      const tFan = k.word("fanout", "100") - 0.05;
      A.show(s.req.inner, t, tReq, { dy: 16 });
      s.fan.forEach((a, r) => a.draw(t, tFan + r * 0.015, 0.55));
      A.show(s.hdr.inner, t, tFan + 0.05, { dy: 10 });
      const tArr = (r) => tFan + 0.45 + 0.7; // all calls go out at once; the dots reach every row together // when the request dot reaches row r
      s.outDots.forEach((d, r) => {
        const t0 = tFan + 0.45, p = A.prog(t, t0, 0.7, A.E.inOutSine);
        const on = t > t0 && t < t0 + 0.7;
        const [x, y] = s.fan[r].point(p);
        d.setAttribute("cx", x.toFixed(1)); d.setAttribute("cy", y.toFixed(1));
        A.setOpacity(d, on ? Math.min(1, (1 - p) * 6) : 0);
      });

      // ---- onepct: label on "1%", then exactly one call turns red on "slow".
      A.show(s.sub.inner, t, k.word("onepct", "1%") - 0.05, { dy: 10 });
      const tSlowMark = k.word("onepct", "slow") - 0.05;
      const pSlow = A.prog(t, tSlowMark, 0.35);

      // ---- waitall: gather lines + response ("The request can't finish"); 99 calls return fast from "every call returns";
      // the slow one leaves on "one slow call" and arrives on "makes it slow".
      const tJoin = cWait + 0.15, tR0 = k.word("waitall", "every"), tRD = 1.3;
      const tSlowRet = k.word("waitall", "one slow");
      const tSlowDone = Math.max(tSlowRet + 0.5, k.word("waitall", "makes"));
      s.join.forEach((a, r) => a.draw(t, tJoin + r * 0.015, 0.55));
      A.show(s.resp.inner, t, tJoin, { dy: 16 });
      const slowArrived = A.prog(t, tSlowDone - 0.1, 0.35);
      s.resp.setTone("bad", slowArrived, "ghost");
      // The stopwatch runs from the moment the gather starts until the last (slow) call is back.
      const sweep = (U.clamp(t, tJoin, tSlowDone) - tJoin) * 300;
      const ang = (sweep * Math.PI) / 180;
      s.hand.setAttribute("d", `M32 32L${(32 + 16 * Math.sin(ang)).toFixed(2)} ${(32 - 16 * Math.cos(ang)).toFixed(2)}`);
      s.join[s.slowRow].setTone(t >= tSlowRet ? "bad" : "line");

      let returned = 0;
      s.cells.forEach((rc, i) => {
        const r = Math.floor(i / COLS);
        const appear = A.prog(t, tFan + 0.1 + r * 0.03, 0.35);
        let col = { fill: mixA(TN.fill, TH.fill, A.prog(t, tArr(r), 0.25)), stroke: mixA(TN.stroke, TH.stroke, A.prog(t, tArr(r), 0.25)) };
        if (i === SLOW) col = { fill: mixA(col.fill, hx(C.bad), pSlow), stroke: mixA(col.stroke, TB.stroke, pSlow) };
        else {
          const tr = tR0 + s.ret[i] * tRD;
          if (t >= tr) returned++;
          const g = A.prog(t, tr, 0.2);
          col = { fill: mixA(col.fill, TG.fill, g), stroke: mixA(col.stroke, TG.stroke, g) };
        }
        rc.setAttribute("fill", css(col.fill)); rc.setAttribute("stroke", css(col.stroke));
        A.setOpacity(rc, appear);
      });
      if (t >= tSlowDone) returned++;
      // Pulsing ring on the slow call while everyone waits for it.
      const pulse = 0.55 + 0.45 * Math.sin((t - tSlowMark) * Math.PI * 2 * 0.9);
      A.setOpacity(s.ring, pSlow * (1 - A.prog(t, tSlowDone, 0.4)) * pulse);

      s.inDots.forEach((d, r) => {
        const t0 = tR0 + s.rowRet[r] * tRD + 0.05, p = A.prog(t, t0, 0.5, A.E.inOutSine);
        const on = t > t0 && t < t0 + 0.5;
        const [x, y] = s.join[r].point(p);
        d.setAttribute("cx", x.toFixed(1)); d.setAttribute("cy", y.toFixed(1));
        A.setOpacity(d, on ? Math.min(1, (1 - p) * 6) : 0);
      });
      {
        const p = A.prog(t, tSlowRet, tSlowDone - tSlowRet, A.E.inOutSine), on = t > tSlowRet && t < tSlowDone;
        const [x, y] = s.join[s.slowRow].point(p);
        s.slowDot.setAttribute("cx", x.toFixed(1)); s.slowDot.setAttribute("cy", y.toFixed(1));
        A.setOpacity(s.slowDot, on ? Math.min(1, (1 - p) * 6) : 0);
      }
      A.setOpacity(s.pill, A.prog(t, tJoin + 0.3, 0.4));
      if (t >= tSlowDone) K.setPill(s.pill, "Slow response", "bad");
      else K.setPill(s.pill, `${Math.min(returned, 99)}/100 returned`, "hl");

      // ---- formula: kicker on "chance", then the expression as it is spoken: "1 minus" · "0.99" · "to the power of 100".
      A.show(s.kicker, t, k.word("formula", "chance") - 0.05, { dy: 12 });
      const tPow = k.word("formula", "100") - 0.1;
      A.show(s.f1, t, k.word("formula", "1 minus") - 0.05, { dy: 14 });
      A.show(s.f2, t, k.word("formula", "0.99") - 0.05, { dy: 14 });
      A.show(s.f3, t, tPow, { dy: 10 });
      const pb = A.prog(t, tPow + 0.4, 0.5);
      A.setOpacity(s.brace, pb); A.setOpacity(s.note, pb);

      // ---- grid: "≈ 63%" lands on "63%"; then 100 requests fill to 63 red.
      const tPct = k.word("grid", "63%") - 0.1;
      A.show(s.f4, t, tPct, { dy: 14, s0: 0.92 });
      const tFill = tPct + 0.5;
      const q = A.prog(t, tFill, 2.4, A.E.inOutSine) * s.nSlow;
      s.dots.forEach((d, i) => {
        A.setOpacity(d, A.prog(t, tPct + 0.1 + i * 0.004, 0.3));
        d.setAttribute("fill", css(mixA(hx(C.line2), hx(C.bad), U.clamp(q - s.rank[i]))));
      });
      A.show(s.of, t, tPct + 0.2, { dy: 10 });
      // The counter enters once the first dot is red (q ≥ 0.5 at ~tFill + 0.14), so it never reads "0".
      A.show(s.count, t, tFill + 0.2, { dy: 14 });
      s.count.textContent = String(Math.min(s.nSlow, Math.floor(q + 0.5)));
      A.show(s.slowLbl, t, tFill + 0.4, { dy: 10 });

      // ---- assumptions (each chip on its own words), then the name of the effect.
      A.show(s.assumes, t, k.word("assumptions", "assumes") - 0.05, { dy: 10 });
      A.show(s.c1, t, k.word("assumptions", "calls are independent") - 0.1, { dy: 12 });
      A.show(s.c2, t, k.word("assumptions", "the request waits") - 0.1, { dy: 12 });
      A.show(s.name, t, k.word("assumptions", "tail latency") - 0.05, { dy: 12, s0: 0.94 });
    },
  });
})();
