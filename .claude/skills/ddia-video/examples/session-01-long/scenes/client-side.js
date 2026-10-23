// S19 — Measure on the client side. A server with one worker lane (simplified): a slow request at the front blocks four fast
// ones (head-of-line blocking). Request 1 measured two ways: the server logs a short service time, the client waited the
// whole time. Then: measure on the client; load tests must keep sending regardless of replies.
// Every beat is anchored to the spoken word it depicts (k.word), see update().
(function () {
  const C = K.C;

  // Layout
  const LANE_Y = 365;                       // centre line of the request flow
  const CLIENT = { x: 120, y: LANE_Y - 75, w: 220, h: 150 };
  const FRAME = { x: 470, y: 245, w: 1330, h: 250 };
  const LANE = { x: 520, w: 780, h: 76 };    // queue lane
  const WORK = { x: 1340, w: 430, h: 120 };  // worker slot
  const TOK = 64, GAP = 14;                  // fast token size and spacing
  const SLOW_W = 380;
  const SPAWN_X = CLIENT.x + CLIENT.w + 12;
  const qx = (slot) => LANE.x + LANE.w - 12 - TOK - slot * (TOK + GAP); // left x of queue slot (0 = front)
  const WX_FAST = WORK.x + (WORK.w - TOK) / 2, WX_SLOW = WORK.x + (WORK.w - SLOW_W) / 2;
  const N_FAST = 4;
  // Gantt for request 1
  const GX0 = 480, GX1 = 1690, ROW_C = 560, ROW_S = 640, ROW_H = 54;

  function token(svg, w, toneName, txt, fs) {
    const g = U.sv("g", {}, svg);
    const tn = K.TONES[toneName];
    const rect = U.sv("rect", { x: 0, y: 0, width: w, height: TOK, rx: 14, fill: tn.fill, stroke: tn.stroke, "stroke-width": 3 }, g);
    const tx = U.sv("text", { x: w / 2, y: TOK / 2 + fs * 0.36, "text-anchor": "middle", "font-size": fs, "font-weight": 750, fill: C.ink }, g, txt);
    return { g, rect, tx };
  }
  const place = (tk, x, y, op) => { tk.g.setAttribute("transform", `translate(${x.toFixed(1)},${y.toFixed(1)})`); A.setOpacity(tk.g, op); };

  R.scene("client-side", {
    build(root, k) {
      const s = {};
      s.title = K.text(root, { x: 120, y: 110, cls: "h2", text: "Where you measure matters." });
      s.badge = K.badge(root, { x: 0, y: 128, right: 120, text: "Simplified illustration" });
      const svg = K.svgLayer(root);

      // Server frame with queue lane and one worker slot.
      s.srv = U.sv("g", {}, svg);
      U.sv("rect", { x: FRAME.x, y: FRAME.y, width: FRAME.w, height: FRAME.h, rx: 24, fill: C.bg2, stroke: C.line2, "stroke-width": 3 }, s.srv);
      s.srvName = K.label(svg, { x: FRAME.x + 30, y: FRAME.y + 46, text: "Server", anchor: "start", size: 32, weight: 750 });
      s.srvNote = K.label(svg, { x: FRAME.x + 150, y: FRAME.y + 46, text: "works on only a few requests at once", anchor: "start", size: 28, weight: 600, fill: "muted" });
      s.lane = U.sv("g", {}, svg);
      U.sv("rect", { x: LANE.x, y: LANE_Y - LANE.h / 2, width: LANE.w, height: LANE.h, rx: 16, fill: "none", stroke: C.line2, "stroke-width": 2.5, "stroke-dasharray": "10 10" }, s.lane);
      s.laneLbl = K.label(svg, { x: LANE.x + 24, y: LANE_Y + 10, text: "queue", anchor: "start", size: 28, weight: 600, fill: "faint" });
      s.work = U.sv("rect", { x: WORK.x, y: LANE_Y - WORK.h / 2, width: WORK.w, height: WORK.h, rx: 18, "stroke-width": 3 }, svg);
      s.workLbl = K.label(svg, { x: WORK.x + WORK.w / 2, y: FRAME.y + 46, text: "worker", size: 28, weight: 650, fill: "muted" });
      s.bar = U.sv("rect", { x: WORK.x + 20, y: LANE_Y + WORK.h / 2 - 16, width: 0, height: 8, rx: 4, fill: C.sca }, svg);

      s.client = K.box(svg, { ...CLIENT, label: "Client", icon: "user" });
      // Workaround: tokens.css transform-origin/fill-box also hits K.box's icon transform attribute (~10 px offset).
      Object.assign(s.client.icon.style, { transformBox: "view-box", transformOrigin: "0 0" });
      s.genLbl = K.label(svg, { x: CLIENT.x + CLIENT.w / 2, y: CLIENT.y + CLIENT.h + 42, text: "load generator", size: 26, weight: 700, fill: "hl" });
      s.send = K.arrow(svg, { from: [CLIENT.x + CLIENT.w, LANE_Y], to: [LANE.x, LANE_Y], gapStart: 12, gapEnd: 10 });
      s.stream = K.packets(svg, s.send, { n: 3, period: 0.9, r: 8 });

      // Requests.
      s.slow = token(svg, SLOW_W, "bad", "slow request", 28);
      s.fast = Array.from({ length: N_FAST }, (_, i) => token(svg, TOK, "hl", String(i + 1), 30));
      // Load test: the generator keeps sending; the first request occupies the worker, the next ones pile up in the queue.
      s.lw = token(svg, TOK, "hl", "", 30);
      s.lq = [0, 1, 2].map(() => token(svg, TOK, "hl", "", 30));

      // Head-of-line blocking bracket (under the queue and worker).
      s.hol = U.sv("g", {}, svg);
      const bx0 = qx(N_FAST - 1) - 8, bx1 = WORK.x + WORK.w, by = LANE_Y + WORK.h / 2 + 8;
      U.sv("path", { d: `M${bx0},${by - 10} L${bx0},${by} L${bx1},${by} L${bx1},${by - 10}`, fill: "none", stroke: C.bad, "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" }, s.hol);
      s.holLbl = K.label(svg, { x: (bx0 + bx1) / 2, y: by + 38, text: "head-of-line blocking", size: 30, weight: 750, fill: "bad" });

      // Request 1 measured two ways.
      s.g1 = token(svg, TOK, "hl", "1", 30);
      s.rowC = K.label(svg, { x: 210, y: ROW_C + ROW_H / 2 + 11, text: "Client waited", anchor: "start", size: 30, weight: 700 });
      s.rowS = K.label(svg, { x: 210, y: ROW_S + ROW_H / 2 + 11, text: "Server logged", anchor: "start", size: 30, weight: 700 });
      const tb = K.TONES.bad, to = K.TONES.ok;
      s.barC = U.sv("rect", { x: GX0, y: ROW_C, width: 0, height: ROW_H, rx: 12, fill: tb.fill, stroke: tb.stroke, "stroke-width": 3 }, svg);
      s.barS = U.sv("rect", { x: GX0, y: ROW_S, width: 0, height: ROW_H, rx: 12, fill: to.fill, stroke: to.stroke, "stroke-width": 3 }, svg);
      s.waitLbl = K.label(svg, { x: GX0 + 24, y: ROW_C + ROW_H / 2 + 10, text: "waiting in the queue", anchor: "start", size: 28, weight: 650, fill: "bad" });
      s.fastLbl = K.label(svg, { x: 0, y: ROW_S + ROW_H / 2 + 10, text: "service time: fast", anchor: "end", size: 28, weight: 700, fill: "ok" });
      s.slowLbl = K.label(svg, { x: 0, y: ROW_C + ROW_H / 2 + 10, text: "response time: slow", anchor: "end", size: 28, weight: 700, fill: "bad" });
      s.mC = K.mark(svg, "x", { x: GX1 + 52, y: ROW_C + ROW_H / 2, size: 50 });
      s.mS = K.mark(svg, "check", { x: GX1 + 52, y: ROW_S + ROW_H / 2, size: 50 });

      // Takeaways.
      s.take = K.card(root, { x: 120, y: 752, w: 820, accent: "hl", title: "Measure on the client side.", body: "That's where users feel the queue." });
      s.load = K.card(root, { x: 980, y: 752, w: 820, accent: "sca", title: "Load tests: keep sending.", body: "Waiting for replies makes queues look short." });
      s.loadBody = s.load.querySelector(".k-card-body");
      return s;
    },

    update(t, k, s) {
      const cQ = k.cue("queue"), cB = k.cue("blocked"), cC = k.cue("clientside"), cL = k.cue("loadtest");
      A.show(s.title, t, cQ); // "Where you measure matters."

      // ---- queue: client ("where you measure"), the server on "server", its note on "works on only a few…".
      A.show(s.client.inner, t, cQ + 0.2, { dy: 16 });
      const tSrv = k.word("queue", "server") - 0.05;
      A.show(s.srv, t, tSrv, { dy: 0 });
      A.show(s.srvName.inner, t, tSrv + 0.1, { dy: 10 });
      A.show(s.lane, t, tSrv + 0.25, { dy: 0 });
      A.show(s.laneLbl.inner, t, tSrv + 0.3, { dy: 0 });
      A.show(s.workLbl.inner, t, tSrv + 0.35, { dy: 10 });
      A.setOpacity(s.work, A.prog(t, tSrv + 0.35, 0.5));
      const tNote = k.word("queue", "works") - 0.05;
      A.show(s.srvNote.inner, t, tNote, { dy: 10 });
      A.show(s.badge, t, tNote + 0.4, { dy: 10 });
      s.send.draw(t, tSrv + 0.2, 0.6);

      // ---- schedule (pure function of cues)
      const tS0 = cB + 0.15, tSa = tS0 + 1.1;             // slow request sent / reaches the worker
      const tSd = cC + 0.35;                                // slow request finished
      const tF = (i) => k.word("blocked", "the fast") - 0.1 + i * 0.4; // fast request i sent ("the fast ones wait")
      const tE = (i) => tSd + 0.3 + i * 0.65;               // fast i moves into the worker
      const SV = 0.3, MOVE = 0.25;                          // fast service time, move-in time
      const svc0 = (i) => tE(i) + MOVE, svc1 = (i) => svc0(i) + SV;

      // Slow request.
      {
        const p = A.prog(t, tS0, 1.1, A.E.inOutCubic);
        let x = U.lerp(SPAWN_X, WX_SLOW, p);
        x += 50 * A.prog(t, tSd, 0.35);
        const op = A.prog(t, tS0, 0.2) * (1 - A.prog(t, tSd + 0.05, 0.3));
        place(s.slow, x, LANE_Y - TOK / 2, op);
      }
      // Fast requests.
      s.fast.forEach((tk, i) => {
        let x = U.lerp(SPAWN_X, qx(i), A.prog(t, tF(i), 0.9, A.E.inOutCubic));
        for (let j = 0; j < i; j++) x += (TOK + GAP) * A.prog(t, tE(j), 0.3, A.E.inOutCubic); // shuffle forward
        x = U.lerp(x, WX_FAST, A.prog(t, tE(i), MOVE, A.E.inOutCubic));
        const done = A.prog(t, svc1(i), 0.15);
        const exit = A.prog(t, svc1(i) + 0.05, 0.25);
        const op = A.prog(t, tF(i), 0.2) * (1 - exit);
        place(tk, x + 70 * exit, LANE_Y - TOK / 2 - 0 * exit, op);
        const tn = K.TONES;
        tk.rect.setAttribute("fill", A.mix(tn.hl.fill, tn.ok.fill, done));
        tk.rect.setAttribute("stroke", A.mix(tn.hl.stroke, tn.ok.stroke, done));
      });
      // Worker: busy outline + progress of whatever is being served.
      let prog = 0, busy = 0;
      if (t >= tSa && t < tSd) { prog = (t - tSa) / (tSd - tSa); busy = 1; }
      for (let i = 0; i < N_FAST; i++) if (t >= svc0(i) && t < svc1(i)) { prog = (t - svc0(i)) / SV; busy = 1; }
      s.bar.setAttribute("width", (390 * U.clamp(prog)).toFixed(1));
      A.setOpacity(s.bar, busy);
      const busyP = A.prog(t, tSa, 0.2) * (1 - A.prog(t, svc1(N_FAST - 1), 0.3));
      // ---- loadtest: the generator keeps sending, so a queue forms and the worker stays busy.
      const tW = k.word("loadtest", "sending") - 0.1, WMOVE = 1.1; // first request sent ("keep sending") / travel to the worker
      const tQ = (i) => tW + 0.5 + i * 0.6;                 // queued request i sent; queue is full on "queues"
      place(s.lw, U.lerp(SPAWN_X, WX_FAST, A.prog(t, tW, WMOVE, A.E.inOutCubic)), LANE_Y - TOK / 2, A.prog(t, tW, 0.3));
      s.lq.forEach((tk, i) => {
        const x = U.lerp(SPAWN_X, qx(i), A.prog(t, tQ(i), 0.9, A.E.inOutCubic));
        place(tk, x, LANE_Y - TOK / 2, A.prog(t, tQ(i), 0.3));
      });
      const busyAll = Math.max(busyP, A.prog(t, tW + WMOVE - 0.1, 0.3));
      s.work.setAttribute("fill", A.mix(C.surface, "#33210F", busyAll));
      s.work.setAttribute("stroke", A.mix(C.line2, C.sca, busyAll));

      // Head-of-line blocking: lands as it is named, clears once the queue drains.
      const tHol = k.word("blocked", "head") - 0.05;     // "head-of-line blocking"
      const holOp = A.prog(t, tHol, 0.5) * (1 - A.prog(t, tSd + 0.1, 0.4));
      A.setOpacity(s.hol, holOp);
      A.show(s.holLbl.inner, t, tHol, { dy: 10, out: tSd + 0.1 });

      // ---- Request 1, measured two ways.
      const ts = tF(0), tr = svc1(0) + 0.15;              // sent / response received by the client
      const pxs = (GX1 - GX0) / (tr - ts);
      const xOf = (tt) => GX0 + (tt - ts) * pxs;
      // Server row first ("The server logs them as fast"), client row on its own words ("but the client waited"): the
      // client bar catches up to the full time request 1 waited, then ✕ lands on "waited".
      const tRows = k.word("clientside", "server logs");      // "The server logs them as fast"
      const tCli = k.word("clientside", "client") - 0.05;     // "the client waited"
      const tX = k.word("clientside", "waited");              // on "waited"
      const rev = A.prog(t, tCli, 0.6);
      place(s.g1, 120, (ROW_C + ROW_S + ROW_H) / 2 - TOK / 2, A.prog(t, tRows, 0.4));
      A.show(s.rowC.inner, t, tCli, { dy: 8 });
      const wC = Math.max(0, Math.min(t, tr) - ts) * pxs * rev;
      s.barC.setAttribute("width", wC.toFixed(1));
      A.setOpacity(s.barC, wC > 0.5 ? 1 : 0);
      A.setOpacity(s.waitLbl.g, A.prog(t, tX + 0.05, 0.4));
      A.show(s.rowS.inner, t, tRows, { dy: 8 });
      const wS = Math.max(0, Math.min(t, svc1(0)) - svc0(0)) * pxs;
      s.barS.setAttribute("x", xOf(svc0(0)).toFixed(1));
      s.barS.setAttribute("width", wS.toFixed(1));
      A.setOpacity(s.barS, t > svc0(0) ? 1 : 0);
      s.fastLbl.g.setAttribute("transform", `translate(${(xOf(svc0(0)) - 22).toFixed(1)},${ROW_S + ROW_H / 2 + 10})`);
      A.show(s.fastLbl.inner, t, svc1(0) + 0.1, { dy: 0, dx: 12 });
      A.show(s.mS.inner, t, svc1(0) + 0.15, { d: 0.45, dy: 0, s0: 0.3, ease: A.E.outBack });
      A.show(s.mC.inner, t, tX, { d: 0.45, dy: 0, s0: 0.3, ease: A.E.outBack });
      // "response time: slow" sits inside the long client bar, right-aligned to its end.
      s.slowLbl.g.setAttribute("transform", `translate(${(GX1 - 24).toFixed(1)},${ROW_C + ROW_H / 2 + 10})`);
      A.show(s.slowLbl.inner, t, tX, { dy: 0, dx: -12 });

      // ---- Takeaway, then load testing.
      A.show(s.take, t, k.word("clientside", "Measure") - 0.05, { dy: 16 }); // on "Measure"
      A.show(s.genLbl.inner, t, k.word("loadtest", "load tests") + 0.1, { dy: 8 });
      const tKeep = k.word("loadtest", "keep sending");
      s.stream.update(t - cL, A.prog(t, tKeep, 0.5));
      // Card title on "keep sending", its body ("Waiting for replies makes queues look short.") on "without waiting".
      A.show(s.load, t, tKeep - 0.1, { dy: 12 });
      A.show(s.loadBody, t, k.word("loadtest", "without waiting") - 0.05, { dy: 8 });
    },
  });
})();
