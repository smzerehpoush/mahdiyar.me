/*
 * Narrator character (long-form, from Ch. 5 Part 2 on; the user's choice, 2026-10-31): a small original robot in the bottom-right
 * corner that "presents" the video. Its screen face has two eyes and a mouth drawn as five sound bars that follow the narration's
 * loudness (stage/mouth.js, written by build/tts.mjs), it blinks on a seeded schedule, bobs, and points up-left at the diagram near
 * the start of each scene. Its colour follows the current section's accent. It pops up after the opening second and slides out
 * before the end screen (video.json narrator.exitBefore, default 20 s). Everything is a pure function of T: no Date, no
 * Math.random, no requestAnimationFrame.
 *
 * Enabled by video.json → "narrator": { "character": "robot", "box": [x, y, w, h], "exitBefore": 20 }. Scenes keep `box` clear;
 * R.layoutReport flags anything that enters it (NARRATOR).
 */
(function () {
  const N = window.VIDEO && VIDEO.narrator;
  if (!N) return;
  const BOX = N.box || [1752, 874, 152, 198];
  const EXIT = N.exitBefore ?? 20;
  const FPS = 30;
  const f2 = (v) => v.toFixed(2);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const frac = (v) => v - Math.floor(v);
  const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const mixHex = (a, b, p) => { const x = hex(a), y = hex(b); return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * clamp(p)).toString(16).padStart(2, "0")).join(""); };
  const outBack = (p) => { const c = 1.6; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
  const inOut = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

  /** Mouth opening 0..1 at time T from the per-frame loudness envelope (0 when silent). */
  function mouthAt(T) {
    const v = (window.MOUTH && MOUTH.v) || [], f = T * (MOUTH && MOUTH.fps || FPS), i = Math.floor(f);
    if (i < 0 || i >= v.length - 1) return 0;
    return clamp((v[i] + (v[i + 1] - v[i]) * (f - i) - 0.08) / 0.8);
  }
  /** Blink 0..1: one 0.16 s blink every 2.6–4.6 s, from a fixed hash sequence. */
  function blinkAt(T) {
    let x = 1.3;
    for (let k = 0; x < T + 1 && k < 4000; k++) {
      const d = T - x;
      if (d >= 0 && d < 0.16) return Math.sin(Math.PI * d / 0.16);
      x += 2.6 + 2.0 * frac(Math.sin((k + 1) * 12.9898 + 31.4) * 43758.5453);
    }
    return 0;
  }
  /** Pointing gesture 0..1: once per scene, on its first cued line (or 1 s in), for 1.6 s; never within 5 s of the previous one. */
  let GEST = null;
  function gestures() {
    const out = []; let last = -99;
    for (const sc of R.timeline.scenes) {
      const cue = sc.lines.find((l) => l.cue && l.start >= 0.6);
      const t = sc.start + (cue ? cue.start : Math.min(1, sc.dur / 2));
      if (t - last >= 5) { out.push(t); last = t; }
    }
    return out;
  }
  function gestureAt(T) {
    if (!GEST) GEST = gestures();
    for (const g of GEST) { const d = T - g; if (d >= 0 && d < 1.6) return Math.pow(Math.sin(Math.PI * d / 1.6), 0.6); }
    return 0;
  }

  function robot(s) {
    const a = s.accent, ey = Math.max(0.06, 1 - s.blink), g = s.gest, o = s.open;
    const bob = Math.sin(s.t * 2.3) * 3;
    const lh = { x: 30 - 12 * g, y: 214 - 86 * g }, rh = { x: 170, y: 214 + Math.sin(s.t * 2.3 + 1) * 3 };
    const tilt = Math.sin(s.t * 1.3) * 2.5 * (0.3 + o);
    let bars = "";
    for (let i = 0; i < 5; i++) {
      const h = 3 + 22 * o * (0.55 + 0.45 * Math.abs(Math.sin(s.t * 9 + i * 1.7)));
      bars += `<rect x="${77 + i * 10}" y="${f2(130 - h / 2)}" width="6" height="${f2(h)}" rx="3" fill="${a}"/>`;
    }
    return `<svg viewBox="0 0 200 260" width="100%" height="100%" overflow="visible">
      <ellipse cx="100" cy="250" rx="60" ry="7" fill="#000" opacity=".35"/>
      <g transform="translate(0 ${f2(bob)})">
        <rect x="72" y="234" width="22" height="10" rx="5" fill="#3A4D63"/><rect x="106" y="234" width="22" height="10" rx="5" fill="#3A4D63"/>
        <path d="M62 190 L${f2(lh.x)} ${f2(lh.y)}" stroke="#3A4D63" stroke-width="10" stroke-linecap="round"/><circle cx="${f2(lh.x)}" cy="${f2(lh.y)}" r="8" fill="${a}"/>
        <path d="M138 190 L${f2(rh.x)} ${f2(rh.y)}" stroke="#3A4D63" stroke-width="10" stroke-linecap="round"/><circle cx="${f2(rh.x)}" cy="${f2(rh.y)}" r="8" fill="${a}"/>
        <rect x="58" y="172" width="84" height="64" rx="20" fill="#2A3D57" stroke="${a}" stroke-width="4"/>
        <circle cx="100" cy="204" r="8" fill="${a}" opacity="${f2(0.35 + 0.65 * o)}"/>
        <rect x="88" y="158" width="24" height="16" fill="#3A4D63"/>
        <g transform="rotate(${f2(tilt)} 100 160)">
          <path d="M100 52 V28" stroke="#9AAABD" stroke-width="4"/><circle cx="100" cy="23" r="7" fill="${a}" opacity="${f2(0.6 + 0.4 * Math.sin(s.t * 3))}"/>
          <rect x="20" y="88" width="16" height="40" rx="6" fill="#2A3D57" stroke="${a}" stroke-width="3"/>
          <rect x="164" y="88" width="16" height="40" rx="6" fill="#2A3D57" stroke="${a}" stroke-width="3"/>
          <rect x="32" y="50" width="136" height="112" rx="34" fill="#2A3D57" stroke="${a}" stroke-width="4"/>
          <rect x="48" y="66" width="104" height="80" rx="20" fill="#060A10"/>
          <rect x="62" y="${f2(100 - 12 * ey)}" width="18" height="${f2(24 * ey)}" rx="8" fill="${a}"/>
          <rect x="116" y="${f2(100 - 12 * ey)}" width="18" height="${f2(24 * ey)}" rx="8" fill="${a}"/>
          ${bars}
        </g>
      </g></svg>`;
  }

  let el = null;
  window.NARRATOR = {
    box: BOX,
    /** Called by R.seek every frame. sections: [{ start, accent }] in time order (accent = #rrggbb). */
    update(T, accentNow, accentPrev, sinceChange) {
      if (!el) {
        el = document.createElement("div");
        el.id = "narrator";
        Object.assign(el.style, { position: "absolute", left: BOX[0] + "px", top: BOX[1] + "px", width: BOX[2] + "px", height: BOX[3] + "px",
          zIndex: 60, pointerEvents: "none" });
        document.getElementById("stage").appendChild(el);
      }
      const total = R.timeline.total;
      const pin = clamp((T - 0.9) / 0.6), pout = clamp((T - (total - EXIT - 0.7)) / 0.7);
      const y = (1 - outBack(pin)) * 1.15 + inOut(pout) * 1.15; // in box heights
      if (pin <= 0 || pout >= 1) { el.style.display = "none"; return; }
      el.style.display = "block";
      el.style.transform = `translateY(${f2(y * BOX[3])}px)`;
      const accent = sinceChange < 0.5 ? mixHex(accentPrev, accentNow, sinceChange / 0.5) : accentNow;
      el.innerHTML = robot({ t: T, open: mouthAt(T), blink: blinkAt(T), gest: gestureAt(T), accent });
    },
  };
})();
