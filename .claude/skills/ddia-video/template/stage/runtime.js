/*
 * Deterministic motion-graphics runtime.
 *
 * Every visible property must be a pure function of the time passed to R.seek(T). No CSS animations or transitions, no
 * Date/Math.random, no requestAnimationFrame. Scenes register with R.scene(id, def):
 *
 *   R.scene('fault-failure', {
 *     chrome: true,                       // show the section tag (default true)
 *     build(root, k) { ...; return state },  // once: create DOM inside `root` (a U.W×U.H absolutely positioned div:
 *                                         //   1920×1080 long-form, 1080×1920 Shorts — from window.VIDEO / video.json)
 *     update(t, k, state) { ... },        // every frame: t = seconds since scene start (may be slightly < 0 or > k.dur)
 *   })
 *
 * `k` is the scene context: k.cue(name) → local start time of the line carrying that cue; k.cueEnd(name) → its end;
 * k.lines (with start/end/text), k.dur, k.data (window.DATA), k.id, k.section.
 * k.word(line, 'needle') → local time the narrator starts saying a word (whisper timings, window.WORDS); k.at(line, p).
 * Helpers: A (animation), K (components), U (DOM/math utils) — see below.
 * Accent colors (series palette): teal, orange, purple (+ hl yellow, bad red, ok green). The Chapter 1 names rel/sca/mai
 * are aliases of teal/orange/purple. Section tags and their accent come from video.json → window.VIDEO.sections.
 */
(function () {
  const VIDEO = window.VIDEO || { W: 1920, H: 1080, safe: { x0: 0, y0: 0, x1: 1920, y1: 950 }, sections: {} };
  const W = VIDEO.W, H = VIDEO.H, SAFE = VIDEO.safe, XF = 0.5; // canvas size; crossfade between scenes (seconds), centered on the boundary
  const NS = "http://www.w3.org/2000/svg";

  // ---------------------------------------------------------------- utils
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const E = {
    linear: (x) => x,
    inCubic: (x) => x * x * x,
    outCubic: (x) => 1 - Math.pow(1 - x, 3),
    outQuint: (x) => 1 - Math.pow(1 - x, 5),
    inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    inOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
    outBack: (x) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  };
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function el(tag, attrs = {}, parent = null, text = null) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      if (k === "style" && typeof v === "object") Object.assign(n.style, v);
      else if (k === "class") n.className = v;
      else if (k === "html") n.innerHTML = v;
      else n.setAttribute(k, v);
    }
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  function sv(tag, attrs = {}, parent = null, text = null) {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      if (k === "style" && typeof v === "object") Object.assign(n.style, v);
      else n.setAttribute(k, v);
    }
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  const fmt = (n, o) => Number(n).toLocaleString("en-US", o);
  /** SVG transform *attributes* must pivot at the user-space origin (tokens.css sets fill-box/center for CSS-animated nodes). */
  const pinOrigin = (n) => { if (n) { n.style.transformBox = "view-box"; n.style.transformOrigin = "0px 0px"; } return n; };
  const U = { clamp, lerp, E, rng: mulberry32, el, sv, fmt, pinOrigin, W, H, NS };

  // ---------------------------------------------------------------- animation
  /** 0→1 progress of an eased tween that starts at t0 and lasts d seconds. */
  function prog(t, t0, d = 0.6, ease = E.outCubic) {
    if (d <= 0) return t >= t0 ? 1 : 0;
    return ease(clamp((t - t0) / d));
  }
  /** 1 while t in [t0, t1), with eased ramps of length d at both ends. */
  function win(t, t0, t1, d = 0.5) {
    return prog(t, t0, d) * (1 - prog(t, t1, d, E.inOutCubic));
  }
  /**
   * Entrance (and optional exit) for an HTML or SVG node: opacity + translate + scale, eased.
   * IMPORTANT for SVG: style.transform overrides the element's transform attribute. Position SVG groups with an outer <g
   * transform="translate(..)"> and animate an inner <g> (all K.* SVG components expose `.inner` for this).
   * opts: d (0.6), dy (24), dx (0), s0 (1 = no scale), ease, out (exit start time), outD (0.4), min (opacity floor)
   */
  function show(node, t, t0, o = {}) {
    const { d = 0.6, dy = 24, dx = 0, s0 = 1, ease = E.outCubic, out = null, outD = 0.4, max = 1 } = o;
    let p = prog(t, t0, d, ease);
    let q = out == null ? 1 : 1 - prog(t, out, outD, E.inOutCubic);
    const op = Math.min(p, q) * max;
    node.style.opacity = op.toFixed(4);
    const s = lerp(s0, 1, p);
    const tx = (1 - p) * dx, ty = (1 - p) * dy;
    node.style.transform = tx || ty || s !== 1 ? `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${s.toFixed(4)})` : "";
    node.style.visibility = op <= 0.002 ? "hidden" : "visible";
    return op;
  }
  function setOpacity(node, op) {
    node.style.opacity = clamp(op).toFixed(4);
    node.style.visibility = op <= 0.002 ? "hidden" : "visible";
  }
  /** Progressive stroke draw for an SVG path (sets pathLength=1). */
  function draw(path, t, t0, d = 0.8, ease = E.inOutCubic) {
    path.setAttribute("pathLength", "1");
    const p = prog(t, t0, d, ease);
    path.style.strokeDasharray = "1 1";
    path.style.strokeDashoffset = (1 - p).toFixed(4);
    path.style.visibility = p <= 0.001 ? "hidden" : "visible";
    return p;
  }
  /** Numeric tween with easing; returns the value. */
  function tween(t, t0, d, from, to, ease = E.outCubic) { return lerp(from, to, prog(t, t0, d, ease)); }
  /** Mix two #rrggbb colors. */
  function mix(c1, c2, p) {
    const a = hex(c1), b = hex(c2);
    return `rgb(${Math.round(lerp(a[0], b[0], p))},${Math.round(lerp(a[1], b[1], p))},${Math.round(lerp(a[2], b[2], p))})`;
  }
  function hex(c) { c = c.replace("#", ""); return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16)); }
  /** Typewriter: returns substring of `text` revealed between t0 and t0+d. */
  function type(t, t0, d, text) { const n = Math.round(prog(t, t0, d, E.linear) * text.length); return text.slice(0, n); }
  const A = { prog, win, show, setOpacity, draw, tween, mix, type, E };

  // ---------------------------------------------------------------- colors
  const C = {
    bg: "#0B121B", bg2: "#0F1824", surface: "#152131", surface2: "#1D2C40", ink: "#E9EEF5", muted: "#9AAABD", faint: "#5F7186",
    line: "#2A394B", line2: "#3A4D63",
    teal: "#4FD1BC", tealBg: "#0A5A4E", orange: "#FFA24D", orangeBg: "#8A3606", purple: "#B3A2FF", purpleBg: "#36247E",
    bad: "#FF6B7F", ok: "#7EE2A8", hl: "#FFD66B", on: "#FFFFFF",
  };
  // Chapter 1 names for the three accents (kept as aliases so its scenes work unchanged).
  Object.assign(C, { rel: C.teal, relBg: C.tealBg, sca: C.orange, scaBg: C.orangeBg, mai: C.purple, maiBg: C.purpleBg });
  const TONES = {
    neutral: { fill: C.surface, stroke: C.line2, text: C.ink, sub: C.muted },
    dark: { fill: C.bg2, stroke: C.line, text: C.muted, sub: C.faint },
    ink: { fill: C.ink, stroke: C.ink, text: "#0F1B2D", sub: "#33475E" },
    teal: { fill: "#0F2E2C", stroke: C.teal, text: C.ink, sub: C.teal },
    orange: { fill: "#33210F", stroke: C.orange, text: C.ink, sub: C.orange },
    purple: { fill: "#241F45", stroke: C.purple, text: C.ink, sub: C.purple },
    bad: { fill: "#3A1620", stroke: C.bad, text: C.ink, sub: C.bad },
    ok: { fill: "#12301F", stroke: C.ok, text: C.ink, sub: C.ok },
    hl: { fill: "#3A3216", stroke: C.hl, text: C.ink, sub: C.hl },
    ghost: { fill: "none", stroke: C.line2, text: C.muted, sub: C.faint, dash: "10 10" },
  };
  Object.assign(TONES, { rel: TONES.teal, sca: TONES.orange, mai: TONES.purple });
  const toneColor = (tone) => ({ teal: C.teal, orange: C.orange, purple: C.purple, rel: C.rel, sca: C.sca, mai: C.mai, bad: C.bad, ok: C.ok, hl: C.hl, ink: C.ink, muted: C.muted, faint: C.faint, line: C.line2 }[tone] || tone || C.ink);
  // Section → accent color, from video.json "sections": { "<section>": { "label": "01 · Reliability", "accent": "teal" } }.
  const PILLAR = Object.fromEntries(Object.entries(VIDEO.sections || {}).map(([k, v]) => [k, toneColor(v.accent || "hl")]));
  const SECTION_LABEL = Object.fromEntries(Object.entries(VIDEO.sections || {}).map(([k, v]) => [k, v.label || ""]));

  // ---------------------------------------------------------------- icons (64×64 line icons, stroke = currentColor)
  const ICONS = {
    database: '<ellipse cx="32" cy="14" rx="20" ry="7"/><path d="M12 14v36c0 4 9 7 20 7s20-3 20-7V14"/><path d="M12 32c0 4 9 7 20 7s20-3 20-7"/>',
    cache: '<path d="M36 6 16 36h14l-4 22 22-32H34z"/>',
    search: '<circle cx="27" cy="27" r="16"/><path d="m39 39 15 15"/>',
    stream: '<path d="M6 20h40m-8-8 8 8-8 8M6 44h40m-8-8 8 8-8 8"/><circle cx="54" cy="20" r="3"/><circle cx="54" cy="44" r="3"/>',
    batch: '<path d="M8 20 32 8l24 12-24 12z"/><path d="m8 32 24 12 24-12M8 44l24 12 24-12"/>',
    server: '<rect x="10" y="8" width="44" height="20" rx="4"/><rect x="10" y="36" width="44" height="20" rx="4"/><circle cx="20" cy="18" r="2.5"/><circle cx="20" cy="46" r="2.5"/><path d="M30 18h16M30 46h16"/>',
    user: '<circle cx="32" cy="22" r="11"/><path d="M12 56c2-11 10-17 20-17s18 6 20 17"/>',
    users: '<circle cx="24" cy="24" r="9"/><path d="M8 54c1.5-9 8-14 16-14s14.5 5 16 14"/><circle cx="44" cy="20" r="7.5"/><path d="M40 35c7 0 13 4 15 12"/>',
    disk: '<rect x="10" y="8" width="44" height="48" rx="6"/><circle cx="32" cy="30" r="12"/><circle cx="32" cy="30" r="3"/><path d="M44 48h4"/>',
    clock: '<circle cx="32" cy="32" r="22"/><path d="M32 18v15l10 6"/>',
    calendar: '<rect x="8" y="12" width="48" height="44" rx="6"/><path d="M8 24h48M20 6v12M44 6v12"/><path d="M18 34h8M30 34h8M42 34h4M18 44h8M30 44h8"/>',
    warning: '<path d="M32 8 58 54H6z"/><path d="M32 24v14"/><circle cx="32" cy="46" r="1.8"/>',
    check: '<path d="m14 33 12 12 24-26"/>',
    x: '<path d="m16 16 32 32M48 16 16 48"/>',
    cpu: '<rect x="16" y="16" width="32" height="32" rx="4"/><rect x="25" y="25" width="14" height="14" rx="2"/><path d="M24 8v8M32 8v8M40 8v8M24 48v8M32 48v8M40 48v8M8 24h8M8 32h8M8 40h8M48 24h8M48 32h8M48 40h8"/>',
    gear: '<circle cx="32" cy="32" r="9"/><path d="M32 6v9M32 49v9M6 32h9M49 32h9M13.6 13.6l6.4 6.4M44 44l6.4 6.4M13.6 50.4l6.4-6.4M44 20l6.4-6.4"/>',
    file: '<path d="M16 6h22l12 12v40H16z"/><path d="M38 6v12h12M22 32h20M22 42h20"/>',
    queue: '<rect x="6" y="22" width="12" height="20" rx="3"/><rect x="22" y="22" width="12" height="20" rx="3"/><rect x="38" y="22" width="12" height="20" rx="3"/><path d="M54 32h6m-3-3 3 3-3 3"/>',
    chart: '<path d="M8 56h48"/><rect x="12" y="34" width="8" height="18"/><rect x="26" y="22" width="8" height="30"/><rect x="40" y="12" width="8" height="40"/>',
    eye: '<path d="M4 32s10-18 28-18 28 18 28 18-10 18-28 18S4 32 4 32z"/><circle cx="32" cy="32" r="8"/>',
    rocket: '<path d="M32 6c10 8 14 20 12 32H20C18 26 22 14 32 6z"/><circle cx="32" cy="24" r="5"/><path d="M20 38l-8 10h12M44 38l8 10H40M28 46l4 10 4-10"/>',
    undo: '<path d="M18 22H40a14 14 0 0 1 0 28H24"/><path d="m26 12-10 10 10 10"/>',
    flask: '<path d="M24 6h16M28 6v18L12 54a4 4 0 0 0 4 4h32a4 4 0 0 0 4-4L36 24V6"/><path d="M18 42h28"/>',
    wrench: '<path d="M40 8a14 14 0 0 0-13 19L8 46l10 10 19-19a14 14 0 0 0 19-13l-8 8-8-2-2-8z"/>',
    tweet: '<path d="M10 14h44v30H30l-12 10v-10h-8z"/>',
    star: '<path d="m32 6 7.6 16.4L58 24.6 44.5 37l3.6 17.9L32 46l-16.1 8.9L19.5 37 6 24.6l18.4-2.2z"/>',
    layers: '<path d="M8 20 32 8l24 12-24 12z"/><path d="m8 32 24 12 24-12M8 44l24 12 24-12"/>',
    monkey: '<circle cx="32" cy="34" r="16"/><circle cx="12" cy="30" r="6"/><circle cx="52" cy="30" r="6"/><circle cx="26" cy="30" r="2.5"/><circle cx="38" cy="30" r="2.5"/><path d="M25 41c4 4 10 4 14 0"/>',
    lb: '<circle cx="32" cy="14" r="8"/><path d="M32 22v10M14 44V36h36v8M32 32v12"/><circle cx="14" cy="50" r="6"/><circle cx="32" cy="50" r="6"/><circle cx="50" cy="50" r="6"/>',
    box: '<rect x="10" y="10" width="44" height="44" rx="8"/>',
  };
  function iconSvg(name, size = 64, color = "currentColor", sw = 3) {
    return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ""}</svg>`;
  }

  // ---------------------------------------------------------------- HTML components (absolute, in canvas px)
  /** Text block. o: x, y, w, text|html, cls ('h1','h2','h3','lead','body','label','small','mono','kicker'), color, align, weight, size */
  function text(root, o) {
    const n = el("div", { class: "k-text " + (o.cls || "body") }, root);
    Object.assign(n.style, { left: o.x + "px", top: o.y + "px" });
    if (o.w) n.style.width = o.w + "px";
    if (o.color) n.style.color = toneColor(o.color);
    if (o.align) n.style.textAlign = o.align;
    if (o.weight) n.style.fontWeight = o.weight;
    if (o.size) n.style.fontSize = o.size + "px";
    if (o.align === "center" && o.w) n.style.left = o.x - o.w / 2 + "px";
    if (o.html != null) n.innerHTML = o.html; else n.textContent = o.text ?? "";
    return n;
  }
  /** Card. o: x, y, w, h?, title, body?, accent (tone name or color), icon?, titleColor? */
  function card(root, o) {
    const n = el("div", { class: "k-card" }, root);
    Object.assign(n.style, { left: o.x + "px", top: o.y + "px", width: o.w + "px" });
    if (o.h) n.style.height = o.h + "px";
    const acc = toneColor(o.accent || "line");
    if (o.accent) { n.style.borderColor = acc; n.style.background = `color-mix(in srgb, ${acc} 9%, ${C.surface})`; }
    if (o.icon) el("div", { class: "k-card-icon", html: iconSvg(o.icon, 64, acc) }, n);
    if (o.title) { const t = el("div", { class: "k-card-title" }, n, o.title); t.style.color = o.titleColor ? toneColor(o.titleColor) : o.accent ? acc : C.ink; }
    if (o.body) el("div", { class: "k-card-body", html: o.body }, n);
    return n;
  }
  /** Chip (rounded outline label). o: x, y, text, accent, icon?, size? */
  function chip(root, o) {
    const n = el("div", { class: "k-chip" }, root);
    if (o.x != null) Object.assign(n.style, { left: o.x + "px", top: o.y + "px" });
    n.style.color = toneColor(o.accent || "ink");
    if (o.size) n.style.fontSize = o.size + "px";
    n.innerHTML = (o.icon ? iconSvg(o.icon, 34, "currentColor", 3.5) : "") + `<span>${o.text}</span>`;
    return n;
  }
  /** Wrapping row of chips. o: x, y, w, items: [string|{text,accent,icon}], accent, size?, justify? → { box, chips:[nodes] } */
  function chips(root, o) {
    const box = el("div", { class: "k-chips" }, root);
    Object.assign(box.style, { left: o.x + "px", top: o.y + "px", width: o.w + "px", justifyContent: o.justify || "flex-start" });
    const nodes = o.items.map((it) => chip(box, { ...(typeof it === "string" ? { text: it } : it), accent: (it && it.accent) || o.accent, size: o.size }));
    return { box, chips: nodes };
  }
  /** Status pill with a colored dot. o: x, y, text, tone ('ok'|'bad'|'hl'|...) → node; use setPill(node, text, tone) to change. */
  function pill(root, o) {
    const n = el("div", { class: "k-pill" }, root);
    Object.assign(n.style, { left: o.x + "px", top: o.y + "px" });
    n.innerHTML = `<span class="dot"></span><span class="t"></span>`;
    setPill(n, o.text, o.tone);
    return n;
  }
  function setPill(n, txt, tone) {
    const c = toneColor(tone || "ok");
    n.style.color = c; n.style.borderColor = c;
    n.style.background = `color-mix(in srgb, ${c} 12%, ${C.surface})`;
    const t = n.querySelector(".t"); t.textContent = txt; t.style.color = C.ink;
  }
  /** Small highlighted badge, e.g. "Twitter, circa 2012" or "Illustration". */
  function badge(root, o) {
    const n = el("div", { class: "k-badge" }, root, o.text);
    Object.assign(n.style, { left: o.x + "px", top: o.y + "px" });
    if (o.right != null) { n.style.left = "auto"; n.style.right = o.right + "px"; }
    if (o.tone) { const c = toneColor(o.tone); n.style.color = c; n.style.borderColor = c; n.style.background = `color-mix(in srgb, ${c} 14%, transparent)`; }
    return n;
  }
  /** Inline icon element positioned absolutely. */
  function icon(root, o) {
    const n = el("div", { class: "k-text", html: iconSvg(o.name, o.size || 64, toneColor(o.color || "ink"), o.sw || 3) }, root);
    Object.assign(n.style, { left: o.x + "px", top: o.y + "px", width: (o.size || 64) + "px", height: (o.size || 64) + "px" });
    return n;
  }

  // ---------------------------------------------------------------- SVG components
  /** Full-frame SVG layer for diagrams (1920×1080 user units = px). */
  function svgLayer(root) { return sv("svg", { class: "k-svg", viewBox: `0 0 ${W} ${H}` }, root); }

  /**
   * Node box. o: x, y (top-left), w, h, label, sub?, tone, icon?, r (radius 18), fs (font size 30), iconSize (44)
   * → { g, inner, rect, label, sub, cx, cy, top:[x,y], bottom, left, right, setTone(tone, p=1) }
   * Animate `inner` (A.show) — never `g`.
   */
  function box(svg, o) {
    const { x, y, w, h, r = 18, fs = 30 } = o;
    const g = sv("g", { transform: `translate(${x},${y})` }, svg);
    const inner = sv("g", {}, g);
    const rect = sv("rect", { x: 0, y: 0, width: w, height: h, rx: r, "stroke-width": 3 }, inner);
    let ic = null;
    const hasIcon = !!o.icon, isz = o.iconSize || 44;
    if (hasIcon) {
      ic = sv("g", { transform: `translate(${o.iconInline ? 22 : w / 2 - isz / 2},${o.iconInline ? h / 2 - isz / 2 : (o.sub ? h / 2 - isz - 18 : h / 2 - isz - 4)}) scale(${isz / 64})`, fill: "none", "stroke-width": 3.5, "stroke-linecap": "round", "stroke-linejoin": "round" }, inner);
      ic.innerHTML = ICONS[o.icon] || "";
      pinOrigin(ic);
    }
    const lx = o.iconInline ? 22 + isz + 16 : w / 2;
    const anchor = o.iconInline ? "start" : "middle";
    let ly = h / 2 + fs * 0.36;
    if (hasIcon && !o.iconInline) ly = h / 2 + fs * 0.9 + (o.sub ? -6 : 4);
    if (o.sub && !hasIcon) ly = h / 2 - 4;
    if (o.sub && o.iconInline) ly = h / 2 - 4;
    const label = sv("text", { x: lx, y: ly, "text-anchor": anchor, "font-size": fs, "font-weight": 700 }, inner, o.label ?? "");
    let sub = null;
    if (o.sub) sub = sv("text", { x: lx, y: ly + fs * 0.95, "text-anchor": anchor, "font-size": Math.round(fs * 0.78), "font-weight": 550 }, inner, o.sub);
    const api = {
      g, inner, rect, label, sub, icon: ic, w, h, x, y,
      cx: x + w / 2, cy: y + h / 2, top: [x + w / 2, y], bottom: [x + w / 2, y + h], left: [x, y + h / 2], right: [x + w, y + h / 2],
      setTone(tone, p = 1, from = "neutral") {
        const a = TONES[from] || TONES.neutral, b = TONES[tone] || TONES.neutral;
        const m = (u, v) => (u === "none" || v === "none" ? (p < 0.5 ? u : v) : mix(u, v, p));
        rect.setAttribute("fill", m(a.fill, b.fill));
        rect.setAttribute("stroke", m(a.stroke, b.stroke));
        rect.setAttribute("stroke-dasharray", (p < 0.5 ? a.dash : b.dash) || "");
        label.setAttribute("fill", m(a.text, b.text));
        if (sub) sub.setAttribute("fill", m(a.sub, b.sub));
        if (ic) ic.setAttribute("stroke", m(a.sub === C.muted ? C.ink : a.sub, b.sub === C.muted ? C.ink : b.sub));
      },
    };
    api.setTone(o.tone || "neutral");
    return api;
  }

  /**
   * Arrow from → to (optionally through `via` points, or a quadratic `curve` offset). o: from, to, via?, curve?, tone ('line'),
   * width (4), head (true), dashed?, gapStart (0), gapEnd (0) → { g, path, head, d, len, point(p), draw(t,t0,d), setTone(tone), setOpacity(op) }
   */
  function arrow(svg, o) {
    const g = sv("g", {}, svg);
    let [x1, y1] = o.from, [x2, y2] = o.to;
    const pts = [[x1, y1], ...(o.via || []), [x2, y2]];
    // shorten ends
    const shorten = (a, b, dist) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [a[0] + (dx / L) * dist, a[1] + (dy / L) * dist]; };
    if (o.gapStart) pts[0] = shorten(pts[0], pts[1], o.gapStart);
    if (o.gapEnd) pts[pts.length - 1] = shorten(pts[pts.length - 1], pts[pts.length - 2], o.gapEnd);
    let d;
    if (o.curve && pts.length === 2) {
      const [a, b] = pts, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
      const cx = mx - (dy / L) * o.curve, cy = my + (dx / L) * o.curve;
      d = `M${a[0]},${a[1]} Q${cx},${cy} ${b[0]},${b[1]}`;
    } else d = "M" + pts.map((p) => p.join(",")).join(" L");
    const col = toneColor(o.tone || "line");
    const path = sv("path", { d, fill: "none", stroke: col, "stroke-width": o.width || 4, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
    if (o.dashed) path.setAttribute("stroke-dasharray", "10 12");
    const len = path.getTotalLength();
    let head = null;
    if (o.head !== false) {
      head = pinOrigin(sv("path", { d: "M-16,-10 L0,0 L-16,10", fill: "none", stroke: col, "stroke-width": o.width || 4, "stroke-linecap": "round", "stroke-linejoin": "round" }, g));
      placeHead(1);
    }
    function point(p) { const q = path.getPointAtLength(clamp(p) * len); return [q.x, q.y]; }
    function placeHead(p) {
      if (!head) return;
      const a = path.getPointAtLength(Math.max(0, clamp(p) * len - 2)), b = path.getPointAtLength(clamp(p) * len);
      const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      head.setAttribute("transform", `translate(${b.x},${b.y}) rotate(${ang})`);
    }
    return {
      g, path, head, d, len, point,
      /** progressive draw (head travels with the tip); returns progress */
      draw(t, t0, dd = 0.7) {
        const p = prog(t, t0, dd, E.inOutCubic);
        if (o.dashed) { path.style.opacity = p > 0 ? 1 : 0; path.style.clipPath = ""; path.setAttribute("stroke-dasharray", "10 12"); g.style.opacity = p; }
        else { path.style.strokeDasharray = `${len} ${len}`; path.style.strokeDashoffset = ((1 - p) * len).toFixed(2); }
        placeHead(Math.max(p, 0.001));
        if (head) head.style.opacity = p > 0.02 ? 1 : 0;
        g.style.visibility = p <= 0.001 ? "hidden" : "visible";
        return p;
      },
      setTone(tone) { const c = toneColor(tone); path.setAttribute("stroke", c); if (head) head.setAttribute("stroke", c); },
      setOpacity(op) { setOpacity(g, op); },
    };
  }

  /**
   * Request "packets" (dots) travelling along an arrow. Deterministic in t.
   * o: n (3), period (1.4 s per trip), r (9), tone ('hl'), from (0), to (1) (path fraction range)
   * update(t, on = 1, opts) — on: 0..1 visibility; opts.stopAt (0..1): packets pile up and fade at that fraction (failure);
   * opts.tone overrides color for this frame.
   */
  function packets(svg, arr, o = {}) {
    const n = o.n || 3, period = o.period || 1.4, r = o.r || 9;
    const g = sv("g", {}, svg);
    const dots = Array.from({ length: n }, () => sv("circle", { r, fill: toneColor(o.tone || "hl") }, g));
    return {
      g,
      update(t, on = 1, opts = {}) {
        const col = toneColor(opts.tone || o.tone || "hl");
        dots.forEach((c, i) => {
          let f = ((t / period + i / n) % 1 + 1) % 1;
          let op = on * Math.min(1, f * 8, (1 - f) * 8);
          if (opts.stopAt != null && f > opts.stopAt) { f = opts.stopAt; op *= 0.0; }
          const p = (o.from ?? 0) + f * ((o.to ?? 1) - (o.from ?? 0));
          const [x, y] = arr.point(p);
          c.setAttribute("cx", x.toFixed(1)); c.setAttribute("cy", y.toFixed(1)); c.setAttribute("fill", col);
          c.style.opacity = clamp(op).toFixed(3);
        });
      },
    };
  }

  /** SVG text. o: x, y, text, size (30), weight (650), fill (ink), anchor ('middle'), mono?, opacity? → { g, inner, t } */
  function label(svg, o) {
    const g = sv("g", { transform: `translate(${o.x},${o.y})` }, svg);
    const inner = sv("g", {}, g);
    const t = sv("text", { x: 0, y: 0, "text-anchor": o.anchor || "middle", "font-size": o.size || 30, "font-weight": o.weight || 650,
      fill: toneColor(o.fill || "ink"), "font-family": o.mono ? "JetBrains Mono, monospace" : null }, inner, o.text ?? "");
    if (o.letterSpacing) t.setAttribute("letter-spacing", o.letterSpacing);
    return { g, inner, t };
  }
  /** Red ✕ or green ✓ mark (SVG). o: x, y (center), size (56), tone → { g, inner } */
  function mark(svg, kind, o) {
    const s = o.size || 56;
    const g = sv("g", { transform: `translate(${o.x - s / 2},${o.y - s / 2})` }, svg);
    const inner = sv("g", {}, g);
    sv("circle", { cx: s / 2, cy: s / 2, r: s / 2, fill: toneColor(o.tone || (kind === "x" ? "bad" : "ok")) }, inner);
    const p = kind === "x" ? `M${s * 0.32},${s * 0.32} L${s * 0.68},${s * 0.68} M${s * 0.68},${s * 0.32} L${s * 0.32},${s * 0.68}` : `M${s * 0.27},${s * 0.52} L${s * 0.44},${s * 0.68} L${s * 0.74},${s * 0.34}`;
    sv("path", { d: p, stroke: "#0B121B", "stroke-width": s * 0.11, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" }, inner);
    return { g, inner };
  }
  /** SVG icon. o: x, y (top-left), size (64), color, sw → { g, inner } */
  function svgIcon(svg, name, o) {
    const s = o.size || 64;
    const g = sv("g", { transform: `translate(${o.x},${o.y})` }, svg);
    const inner = sv("g", {}, g);
    const ig = sv("g", { transform: `scale(${s / 64})`, fill: "none", stroke: toneColor(o.color || "ink"), "stroke-width": o.sw || 3.2, "stroke-linecap": "round", "stroke-linejoin": "round" }, inner);
    ig.innerHTML = ICONS[name] || "";
    pinOrigin(ig);
    return { g, inner, ig };
  }
  /**
   * Bar histogram. o: x, y (top-left of plot), w, h, bins: number[], maxCount?, color, gap (2), from (0), to (bins.length)
   * → { g, bars:[rect], setReveal(p) (bars grow 0→1 left to right), xOf(binIndexFloat), base }
   */
  function histogram(svg, o) {
    const g = sv("g", {}, svg);
    const bins = o.bins, from = o.from || 0, to = o.to ?? bins.length, n = to - from;
    const max = o.maxCount || Math.max(...bins.slice(from, to));
    const bw = o.w / n, gap = o.gap ?? 2;
    const bars = [];
    for (let i = 0; i < n; i++) {
      const v = bins[from + i];
      const bh = (v / max) * o.h;
      bars.push(sv("rect", { x: (o.x + i * bw + gap / 2).toFixed(2), y: (o.y + o.h - bh).toFixed(2), width: Math.max(1, bw - gap).toFixed(2), height: bh.toFixed(2), rx: Math.min(4, bw / 3), fill: toneColor(o.color || "line") }, g));
    }
    return {
      g, bars, base: o.y + o.h,
      xOf: (b) => o.x + (b - from) * bw,
      setReveal(p, ease = E.outCubic) {
        bars.forEach((r, i) => {
          const local = clamp(p * 1.4 - (i / n) * 0.4);
          const k = ease(local);
          r.style.transformOrigin = "bottom"; r.style.transformBox = "fill-box";
          r.style.transform = `scaleY(${k.toFixed(4)})`;
        });
      },
    };
  }

  // ---------------------------------------------------------------- divider scene template
  /**
   * Full-bleed pillar divider. o: num ('01'), title, sub, pillar ('teal'|'orange'|'purple'; Ch.1 aliases rel/sca/mai)
   * → state; call dividerUpdate(t, st). Laid out for 16:9; on a 9:16 canvas reposition st.num/title/rule/sub after creating it.
   */
  function divider(root, o) {
    const bg = { teal: C.tealBg, orange: C.orangeBg, purple: C.purpleBg, rel: C.relBg, sca: C.scaBg, mai: C.maiBg }[o.pillar];
    root.style.background = bg;
    const num = text(root, { x: 140, y: 150, cls: "", text: o.num });
    Object.assign(num.style, { fontSize: "420px", fontWeight: 800, lineHeight: 0.8, letterSpacing: "-0.06em", color: "rgba(255,255,255,.16)" });
    const title = text(root, { x: 150, y: 560, cls: "h1", text: o.title, color: "#FFFFFF" });
    title.style.fontSize = "150px";
    const rule = el("div", {}, root); Object.assign(rule.style, { position: "absolute", left: "156px", top: "745px", height: "8px", width: "220px", background: C.hl, borderRadius: "4px", transformOrigin: "left" });
    const sub = text(root, { x: 154, y: 790, w: 1500, cls: "lead", text: o.sub, color: "rgba(255,255,255,.86)" });
    return { num, title, rule, sub };
  }
  function dividerUpdate(t, st, t0 = 0.1) {
    show(st.num, t, t0, { d: 0.9, dy: 60 });
    show(st.title, t, t0 + 0.15, { d: 0.8, dy: 40 });
    const p = prog(t, t0 + 0.45, 0.6);
    st.rule.style.transform = `scaleX(${p.toFixed(3)})`;
    show(st.sub, t, t0 + 0.6, { d: 0.7, dy: 24 });
  }

  const K = { C, PILLAR, TONES, ICONS, iconSvg, toneColor, text, card, chip, chips, pill, setPill, badge, icon, svgLayer, box, arrow, packets, label, mark, svgIcon, histogram, divider, dividerUpdate };

  // ---------------------------------------------------------------- engine
  const R = { defs: {}, inst: {}, timeline: null, U, A, K };
  R.scene = (id, def) => { R.defs[id] = def; };

  function ctxFor(sc) {
    const cues = {}, cueEnds = {};
    for (const l of sc.lines) if (l.cue) { cues[l.cue] = l.start; cueEnds[l.cue] = l.end; }
    return {
      id: sc.id, section: sc.section, dur: sc.dur, lines: sc.lines, data: window.DATA,
      cue(name) { if (!(name in cues)) throw new Error(`scene ${sc.id}: unknown cue "${name}"`); return cues[name]; },
      cueEnd(name) { if (!(name in cueEnds)) throw new Error(`scene ${sc.id}: unknown cue "${name}"`); return cueEnds[name]; },
      has(name) { return name in cues; },
      /** Line index for a cue name or index. */
      lineIndex(ref) { const i = typeof ref === "number" ? ref : sc.lines.findIndex((l) => l.cue === ref); if (i < 0 || !sc.lines[i]) throw new Error(`scene ${sc.id}: no line ${ref}`); return i; },
      /** Time at fraction p (0..1) through a line's audio. */
      at(ref, p) { const l = sc.lines[this.lineIndex(ref)]; return l.start + (l.end - l.start) * p; },
      /**
       * Scene-local time when `needle` (a word or short phrase from the caption text, e.g. "65", "fan-out", "p99", "Chaos Monkey")
       * is spoken in a line (cue name or index), from whisper word timings (window.WORDS). nth selects a repeated word.
       * Falls back to the needle's proportional position in the caption text if the recognizer spelled it differently.
       */
      word(ref, needle, nth = 0) {
        const li = this.lineIndex(ref), line = sc.lines[li];
        const ws = ((window.WORDS || {})[sc.id] || [])[li] || [];
        const norm = (w) => w.toLowerCase().replace(/[’']/g, "").replace(/,(?=\d)/g, "").replace(/[^a-z0-9.%-]/g, "").replace(/[.-]+$/, "");
        const parts = needle.split(/\s+/).map(norm).filter(Boolean);
        let hit = 0;
        for (let i = 0; i < ws.length; i++) {
          if (parts.every((p, j) => ws[i + j] && (ws[i + j].w === p || ws[i + j].w.startsWith(p) || p.startsWith(ws[i + j].w) && ws[i + j].w.length >= 3))) {
            if (hit++ === nth) return ws[i].s;
          }
        }
        const txt = line.text.toLowerCase(); let idx = -1, from = 0;
        for (let k = 0; k <= nth; k++) { idx = txt.indexOf(needle.toLowerCase(), from); if (idx < 0) break; from = idx + 1; }
        if (idx >= 0) return line.start + (idx / txt.length) * (line.end - line.start);
        throw new Error(`scene ${sc.id}: word "${needle}" not found in line ${li}: ${line.text}`);
      },
    };
  }

  R.init = function (timeline) {
    R.timeline = timeline;
    const stage = document.getElementById("stage");
    R.chrome = document.getElementById("chrome");
    R.fade = document.getElementById("fade");
    for (const sc of timeline.scenes) {
      const root = el("div", { class: "scene", "data-id": sc.id }, stage);
      R.inst[sc.id] = { sc, root, built: false, state: null, k: ctxFor(sc), def: R.defs[sc.id] };
    }
  };


  R.seek = function (T) {
    const tl = R.timeline;
    let chromeOp = 0, chromeText = "", chromeColor = C.muted;
    for (const sc of tl.scenes) {
      const I = R.inst[sc.id];
      const a = sc.start - XF / 2, b = sc.start + sc.dur + XF / 2;
      const isFirst = sc === tl.scenes[0], isLast = sc === tl.scenes[tl.scenes.length - 1];
      if (T < a && !isFirst || T >= b && !isLast) { I.root.style.display = "none"; continue; }
      if (!I.def) { I.root.style.display = "none"; continue; }
      if (!I.built) { I.state = I.def.build(I.root, I.k) || {}; I.built = true; }
      I.root.style.display = "block";
      const fin = isFirst ? 1 : clamp((T - a) / XF), fout = isLast ? 1 : clamp((b - T) / XF);
      const op = Math.min(fin, fout);
      I.root.style.opacity = op.toFixed(4);
      I.root.style.zIndex = fin < 1 ? 2 : 1; // incoming scene on top during crossfade
      I.def.update(T - sc.start, I.k, I.state);
      if (I.def.chrome !== false && SECTION_LABEL[sc.section]) {
        if (op > chromeOp) { chromeOp = op; chromeText = SECTION_LABEL[sc.section]; chromeColor = PILLAR[sc.section]; }
      }
    }
    R.chrome.querySelector(".t").textContent = chromeText;
    R.chrome.querySelector(".sw").style.background = chromeColor;
    setOpacity(R.chrome, chromeOp);
    // global fade from/to black at the very start and end
    const F = VIDEO.fade || { in: 0.6, out: 1.2 };
    const fadeIn = F.in > 0 ? 1 - clamp(T / F.in) : 0, fadeOut = F.out > 0 ? clamp((T - (tl.total - F.out)) / F.out) : 0;
    R.fade.style.opacity = Math.max(fadeIn, fadeOut).toFixed(4);
    const dbg = document.getElementById("debug");
    if (dbg && document.body.classList.contains("qa")) {
      const cur = tl.scenes.find((s) => T >= s.start && T < s.start + s.dur) || tl.scenes[tl.scenes.length - 1];
      const lt = T - cur.start;
      const line = cur.lines.filter((l) => l.start <= lt).pop();
      dbg.textContent = `${cur.id}  t=${lt.toFixed(2)}  T=${T.toFixed(2)}${line && line.cue ? "  cue:" + line.cue : ""}`;
    }
  };

  /** Seek to the start of a scene's cue (+offset) — used by QA tools. */
  R.cueTime = function (sceneId, cue, offset = 0) {
    const sc = R.timeline.scenes.find((s) => s.id === sceneId);
    if (!sc) throw new Error("no scene " + sceneId);
    if (cue == null) return sc.start + offset;
    const l = sc.lines.find((x) => x.cue === cue);
    if (!l) throw new Error(`no cue ${cue} in ${sceneId}`);
    return sc.start + l.start + offset;
  };

  /**
   * Layout QA: visible text elements that leave the frame, leave the safe area (VIDEO.safe: long-form = above y 950;
   * Shorts = x 60–940, y 220–1480), or overlap other text of the same scene. Returns an array of strings. Elements inside
   * [data-allow-safe] may leave the safe area (decoration, full-bleed backgrounds).
   */
  R.layoutReport = function () {
    const out = [];
    const stage = document.getElementById("stage").getBoundingClientRect();
    const visible = (n) => { for (let e = n; e && e.id !== "stage"; e = e.parentElement || e.parentNode) { const cs = getComputedStyle(e); if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity < 0.05) return false; } return true; };
    const nodes = [...document.querySelectorAll(".scene .k-text, .scene .k-card, .scene .k-chip, .scene .k-pill, .scene .k-badge, .scene svg text")].filter(visible);
    const boxes = nodes.map((n) => ({ n, r: n.getBoundingClientRect() })).filter((b) => b.r.width > 2 && b.r.height > 2);
    const desc = (n) => (n.textContent || "").trim().slice(0, 40) || n.className?.baseVal || n.className || n.tagName;
    for (const { n, r } of boxes) {
      if (r.left < stage.left - 1 || r.right > stage.right + 1 || r.top < stage.top - 1 || r.bottom > stage.bottom + 1) out.push(`OFF-FRAME: "${desc(n)}" [${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}]`);
      else if (!n.closest("[data-allow-safe]") && (r.bottom > stage.top + SAFE.y1 || r.top < stage.top + SAFE.y0 || r.left < stage.left + SAFE.x0 || r.right > stage.left + SAFE.x1))
        out.push(`${SAFE.y1 < H && SAFE.y0 === 0 && SAFE.x0 === 0 ? "CAPTION-BAND" : "UNSAFE"}: "${desc(n)}" [${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}]`);
    }
    const leafText = boxes.filter((b) => b.n.matches(".k-text, svg text, .k-chip, .k-pill, .k-badge") && !b.n.closest(".k-card"));
    for (let i = 0; i < leafText.length; i++) for (let j = i + 1; j < leafText.length; j++) {
      const a = leafText[i], b = leafText[j];
      if (a.n.contains(b.n) || b.n.contains(a.n)) continue;
      if (a.n.closest(".scene") !== b.n.closest(".scene")) continue; // outgoing vs incoming scene during a crossfade
      const ix = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), iy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (ix > 6 && iy > 6) out.push(`OVERLAP: "${desc(a.n)}" × "${desc(b.n)}" (${Math.round(ix)}×${Math.round(iy)})`);
    }
    return out;
  };

  window.R = R; window.A = A; window.K = K; window.U = U;
})();
