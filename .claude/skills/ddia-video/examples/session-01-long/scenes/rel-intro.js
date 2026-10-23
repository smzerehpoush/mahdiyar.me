// S05 — Reliability divider.
R.scene("rel-intro", {
  chrome: false,
  build(root) {
    return K.divider(root, { num: "01", title: "Reliability", sub: "Continuing to work correctly, even when things go wrong.", pillar: "rel" });
  },
  update(t, k, st) {
    K.dividerUpdate(t, st);
  },
});
