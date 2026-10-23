# Accuracy decisions — Short: Twitter fan-out (binding)

1. All Twitter figures are from a 2012 talk cited by DDIA (1st ed., Chapter 1); say "around 2012" in the first line and keep the
   "Twitter, circa 2012" badge on every Twitter scene.
2. Post tweet ≈ 4,600 requests/s on average (over 12,000 at peak — description only); home timeline ≈ 300,000 requests/s.
3. "Each tweet reaches 75 followers on average" → 345,000 timeline writes/s. 75 is per tweet, not followers per user.
4. "Some accounts have over 30 million followers"; "One tweet, 30 million writes" stands on its own. The cell grid is labelled
   "Simplified illustration" (cells are not to scale).
5. The first version used fan-out on read and "struggled to keep up" (book's wording); then fan-out on write; then a hybrid where most
   users' tweets are fanned out on write and a small number of very-high-follower accounts are fetched at read time and merged.
6. Do not use the deck's "~100×" read/write ratio (it is ≈ 65).
