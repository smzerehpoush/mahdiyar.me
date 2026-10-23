// S19 — Part 03 divider: Precomputed aggregates (purple).
// Same layout and motion as the other two part dividers (K.divider, Ch.1 rel-intro/sca-intro style); only accent and text differ.
// Number lands with the scene; the part name lands as the narrator names it; the rule draws under it; the subtitle lands on its phrase.
R.scene("agg-intro", {
  chrome: false,
  build(root) {
    return K.divider(root, { num: "03", title: "Precomputed aggregates", sub: "Do the work once, read many times.", pillar: "purple" });
  },
  update(t, k, st) {
    const tTitle = k.word("divider", "pre-computed") - 0.1; // the part name, as spoken after "… stop:"
    const tSub = k.word("divider", "do that work once") - 0.1;
    A.show(st.num, t, 0.1, { d: 0.9, dy: 60 });
    A.show(st.title, t, tTitle, { d: 0.8, dy: 40 });
    const p = A.prog(t, tTitle + 0.35, 0.6);
    st.rule.style.transform = `scaleX(${p.toFixed(3)})`;
    A.show(st.sub, t, tSub, { d: 0.7, dy: 24 });
  },
});
