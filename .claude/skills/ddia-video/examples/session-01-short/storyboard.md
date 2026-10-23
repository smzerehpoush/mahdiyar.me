# Storyboard — Short: "How Twitter Built Your Timeline" (DDIA Chapter 1)

Canvas 1080×1920; readable area x 80–920, y 220–1480; centre column x = 500. Badge "Twitter, circa 2012" pinned at (80, 236) in every
Twitter scene. Accent orange; teal for writes in the hook, yellow (`hl`) for celebrities, red for overload, green for cheap reads.
Final length 59.5 s (af_heart at 1.08×, 146 words).

### `hook` (≈ 11 s) — cover frame
Headline from frame 0: "Why was **reading** Twitter harder than tweeting?" Two columns on one baseline, heights to scale:
"4,600 / Tweets posted / per second" (a teal sliver) and "300,000 / Timeline loads / per second" (orange bar that grows while the number
counts up). Beats: `hook`, `rates`.

### `onread` (≈ 11 s)
Title "Build it **when you read**". You → arrows to a container "Everyone you follow" (4 accounts with tweet bars) → "Merge by time".
Yellow request dots go down, orange tweet dots come back. "One read fans out into many lookups" → chip "Fan-out: 1 read → many
lookups"; "struggled to keep up" → arrows + merge turn red, pill "Struggled to keep up". Beats: `onread`, `slow`.

### `onwrite` (≈ 7 s)
Title "Flip it: **copy on write**". "New tweet" → copies fly into a container "Each follower's cached timeline" (top bar of each turns
orange as the copy lands). "Reading becomes one cheap lookup" → You under one timeline, green arrow, "1 lookup", pill "Reads became
cheap". Beats: `onwrite`, `cheap`.

### `celebrity` (≈ 12 s)
Title "Writes aren't free". "4,600 × 75" then "≈ 345,000 timeline writes / s" (counter). Then a yellow "Celebrity account ·
30,000,000+ followers" box; "One tweet, 30 million writes" → a grid of cells floods from the top-left, callout "1 tweet → 30,000,000
writes", label "Simplified illustration". Beats: `avg`, `celeb`, `flood`.

### `hybrid` (≈ 8 s)
Title "The fix: **a hybrid**". Two lanes: Most users → "copied on write" → Cached timelines; Celebrities → "fetched on read" (dashed) →
Their tweets. Both merge into a "Your timeline" card whose rows interleave (Celebrity 12:05, Friend 12:04, Colleague 12:02,
Celebrity 11:58). Beats: `hybrid`, `most`, `celebs`.

### `lesson` (≈ 11 s)
Kicker "The lesson"; big text "A few **outliers** / can decide / your whole design." builds word by word; a row of small dots and one
large orange dot. Book card "DDIA · Chapter 1 — Designing Data-Intensive Applications — Martin Kleppmann · O'Reilly"; chip "Full
chapter explainer: linked below ↓". Beats: `lesson`, `source`.
