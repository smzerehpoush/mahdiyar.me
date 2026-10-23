// S10 — Part 02 divider: Column storage (orange).
// Same layout and motion as the other two part dividers (K.divider, Ch.1 rel-intro/sca-intro style); only accent and text differ.
// Number lands with the scene; the part name lands as the narrator names it; the rule draws under it; the subtitle lands on its phrase.
R.scene("col-intro", {
  chrome: false,
  build(root) {
    return K.divider(root, { num: "02", title: "Column storage", sub: "Read only the columns you need.", pillar: "orange" });
  },
  update(t, k, st) {
    const tTitle = k.word("divider", "column storage") - 0.1; // the part name, as spoken after "… stop:"
    const tSub = k.word("divider", "a few columns") - 0.1;
    A.show(st.num, t, 0.1, { d: 0.9, dy: 60 });
    A.show(st.title, t, tTitle, { d: 0.8, dy: 40 });
    const p = A.prog(t, tTitle + 0.35, 0.6);
    st.rule.style.transform = `scaleX(${p.toFixed(3)})`;
    A.show(st.sub, t, tSub, { d: 0.7, dy: 24 });
  },
});
