# Storyboard — "Reliable, Scalable, Maintainable" (DDIA Chapter 1)

Canvas: 1920×1080, dark background. Pillar accents: Reliability = teal `#4FD1BC`, Scalability (incl. performance) = orange `#FFA24D`,
Maintainability = purple `#B3A2FF`. Danger red `#FF6B7F`, highlight yellow `#FFD66B`. Fonts: Bricolage Grotesque (display/body),
JetBrains Mono (numbers/code-ish labels). Keep key text above y≈940 (YouTube captions sit at the bottom).

Each scene lists **beats**. A beat is a named cue (`cue: name`) that a narration line triggers; the visual change happens when that
line starts. Target seconds are for narration + holds. Total target ≈ 13–13.5 minutes.

Total target: ~800 s.

---

## Part 0 — Opening (≈ 75 s)

### S01 `hook` (≈ 28 s)
Visual: a minimal system sketch (Users → App servers → Database). Two green status pills: "Database: running ✓", "Servers: online ✓".
Then three symptom cards appear one at a time, each with a small icon: **Stale data** (user sees an old value), **Requests slowing
down** (a latency bar stretching), **A small change takes days to ship** (calendar pages flipping). End on the question
"Is your system actually working well?"
Beats: `running`, `online`, `stale`, `slow`, `days`, `question`.
Narration: the user's hook text (may be lightly split into sentences), nothing more.

### S02 `title` (≈ 30 s)
Visual: Title "Reliable. Scalable. Maintainable." in the three accent colors, kicker "Designing Data-Intensive Applications ·
Chapter 1". Three tall colored bands grow. Then the three questions appear, each tagged by its pillar color:
1. Does it keep working when components go wrong? → Reliability
2. Can it handle growth? → Scalability
3. Can people understand, operate, and change it over time? → Maintainability
Beats: `title`, `q1`, `q2`, `q3`.
Narration: introduce the video's spine — three questions; mention it follows Chapter 1 of Martin Kleppmann's book (no affiliation
claims; just "based on").

---

## Part 1 — What makes an application data-intensive? (≈ 70 s)

### S03 `blocks` (≈ 25 s)
Visual: A dim "CPU" chip fades back; three words light up: **amount**, **complexity**, **speed of change**. Then five building-block
cards appear in a row with simple line icons: Database (store data, find it later) · Cache (remember the result of expensive work) ·
Search index (search and filter by keyword) · Stream processing (send messages, handle them asynchronously) · Batch processing
(periodically crunch a large pile of data).
Beats: `cpu`, `three`, `db`, `cache`, `search`, `stream`, `batch`.

### S04 `composite` (≈ 45 s)
Visual: Architecture builds progressively: Client → Application code → Primary database. Add Cache (left), Search index (right),
Change queue + Background workers (below) that update the cache and index from database changes. Animated request dots along arrows.
Then a write lands in the database while the cache still holds the old value → the stale entry glows red, a read returns the old value.
Caption chip: "Keeping these in sync is now your job." Final title: "You are now a data system designer."
Optional brief aside: categories blur (Redis can be a store and a queue; Kafka is a queue with database-like durability).
Beats: `app`, `db`, `cache`, `index`, `workers`, `write`, `stale`, `yourjob`.

---

## Part 2 — Reliability (≈ 180 s) — teal

### S05 `rel-intro` (≈ 14 s)
Visual: full-bleed teal divider "01 Reliability", subtitle "Continuing to work correctly, even when things go wrong."
Narration: what "working correctly" means in plain terms (does what users expect, tolerates mistakes, performs well enough, prevents
abuse) — one or two sentences only.
Beats: `divider`.

### S06 `fault-failure` (≈ 45 s)
Visual: two definitions as compact cards: **Fault** — one component deviates from its spec. **Failure** — the system as a whole stops
providing the service users expect.
Animation A ("With fault tolerance"): Users → App → Replica A + Replica B. Request dots flow to both. Replica A breaks (red ✕). Dots
reroute to Replica B; user indicator stays green "Users fine ✓". Label: "Fault — tolerated".
Animation B ("Without fault tolerance"): same layout with no failover path; Replica breaks → request dots stop / turn red at the user
→ "Errors / outage". Label: "Fault → Failure".
Close: "You can't prevent every fault. Design so faults don't become failures." (Tolerate specific kinds of faults, not every
possible one.)
Beats: `defs`, `flowA`, `breakA`, `rerouteA`, `flowB`, `breakB`, `failB`, `goal`.

### S07 `hardware` (≈ 42 s)
Visual: a grid of 10,000 tiny squares (e.g. 125×80), label "10,000 disks". A formula builds:
10,000 disks ÷ (30 years × 365 days) ≈ 0.9 failures per day ≈ **about one per day**. A day counter ticks while random squares flash red
(seeded PRNG, ~1 per simulated day). Small label: "Simplified illustration: assumed MTTF 30 years, independent failures, constant rate."
Then a response strip: "Redundancy: RAID, dual power supplies, spare machines" → "Software that tolerates losing whole machines" →
"bonus: rolling upgrades, one node at a time".
Explain MTTF = mean time to failure before using the acronym (or avoid the acronym in narration).
Beats: `grid`, `formula`, `perday`, `ticker`, `redundancy`, `software`, `rolling`.

### S08 `software` (≈ 32 s)
Visual: five identical nodes, each labeled "same code". A single "bad input" token (or "leap second, June 30 2012") arrives and ALL five
fail at the same moment (contrast with hardware: random, independent). Text: "Redundancy assumes independent faults. Software bugs are
often correlated." Small list: runaway process eating shared resources · slow or corrupted dependency · cascading failures.
Beats: `nodes`, `trigger`, `allfail`, `correlated`, `examples`.

### S09 `humans` (≈ 25 s)
Visual: a config file line being edited (e.g. `timeout: 30s → 30ms`) — keep it tiny and illustrative, not decorative code — then a
ripple of red across services. Stat card: "One study of large internet services: operator configuration errors were the leading
cause of outages."
Beats: `config`, `ripple`, `study`.

### S10 `chaos` (≈ 40 s)
Visual: a cluster of 9 nodes; a "Chaos Monkey" pointer randomly terminates a node; the system detects it and replaces it automatically
(new node fades in). Then a checklist of practices appears as chips, each with a small icon: Tests at every level · Sandboxes with
real data · Gradual rollouts · Fast rollback · Monitoring & telemetry · Safe operational tools (e.g. tools to recompute data).
Text: "Many critical bugs hide in error handling that rarely runs."
Beats: `errhandling`, `monkey`, `kill`, `heal`, `practices`.

---

## Part 3 — Scalability (≈ 170 s) — orange

### S11 `sca-intro` (≈ 32 s)
Visual: orange divider "02 Scalability — Not a label. A question about growth." Then the phrase "Our system is scalable." gets
struck through and replaced by "If load grows like this, what are our options?". Load parameter chips appear: requests / sec ·
read : write ratio · concurrent users · cache hit rate · skew (a few extreme cases).
Beats: `divider`, `strike`, `question`, `params`.

### S12 `twitter` (≈ 55 s)
Visual: badge "Twitter, circa 2012" pinned top-right for the whole Twitter sequence (S12–S14). Two operations with numbers:
Post tweet ≈ 4.6k requests/s (avg; >12k peak) · Home timeline ≈ 300k requests/s.
Split screen:
- **Fan-out on read**: a timeline request triggers lookups of everyone you follow → fetch their tweets → merge by time. Visually
  many arrows converge at read time. Verdict: "expensive on every read — struggled to keep up".
- **Fan-out on write**: each user has a cached home timeline ("mailbox"). Posting copies the tweet into each follower's mailbox.
  Reading is a cheap lookup. Verdict: "reads became cheap".
Then the ratio: 300k ÷ 4.6k ≈ **65 timeline reads per tweet** → do more work at write time.
Beats: `badge`, `ops`, `onread`, `onread-cost`, `onwrite`, `onwrite-cheap`, `ratio`.

### S13 `celebrity` (≈ 50 s)
Visual: multiplication builds: 4,600 tweets/s × 75 followers ≈ **345,000** timeline insertions/s (counter rolls up). Then a
celebrity avatar with 30,000,000 followers: one tweet → 30 million insertions — a bar for "average user: 75" vs a bar that grows far
off the chart for "celebrity: 30,000,000" (use a broken axis or a scale callout). Then a long-tail histogram of followers per user: most
users small, a tiny number enormous. Text: "The distribution matters, not just the average."
Beats: `multiply`, `result`, `celebrity`, `oneTweet`, `bars`, `distribution`.

### S14 `hybrid` (≈ 32 s)
Visual: timeline assembly diagram: precomputed home timeline (from fan-out on write) + celebrity tweets fetched at read time → merge →
your timeline. Label both paths. Lesson card: "Describe load by its distribution, not just its average."
Beats: `precomputed`, `celebs`, `merge`, `lesson`.

---

## Part 4 — Performance (≈ 170 s) — orange (sub-section "Describing performance")

### S15 `response-time` (≈ 32 s)
Visual: a horizontal segmented bar for one request: network → waiting in queue → service time → network. Bracket over the whole bar:
"Response time — what the client sees". Bracket under the queue segment: "Latency — time spent waiting to be handled". Then a strip of
dots: the same request repeated 40 times shows jitter, with chips for random causes: GC pause · context switch · lost packet + TCP
retransmit · page fault · rack vibration.
Beats: `segments`, `response`, `latency`, `repeat`, `causes`.

### S16 `percentiles` (≈ 55 s)
Visual: histogram of 1,000 response times (seeded), mostly ~60–250 ms. Vertical markers animate in: p50 ("half are faster"), p95
("95 of 100 are faster"), p99 ("99 of 100 are faster"). Readouts: Mean, p50, p95, p99. Then "add a few long pauses": ~2% of requests
become 0.8–2.0 s pauses (bars appear far to the right on a broken/extended axis). The readouts update: median barely moves, mean rises
a bit, p99 jumps several times over. The narration may only quote numbers produced from the seeded dataset (provided in data file).
Beats: `hist`, `p50`, `p95`, `p99`, `pauses`, `compare`.

### S17 `tails` (≈ 30 s)
Visual: "Why the tail matters". Card: "Amazon (historically): internal service targets at the 99.9th percentile" — note: the slowest
requests often belong to the customers with the most data. Card: example SLA: "median < 200 ms and p99 < 1 s". Small note:
"p99.99 — diminishing returns".
Beats: `amazon`, `valuable`, `sla`.

### S18 `amplification` (≈ 42 s)
Visual: one user request fans out to 100 backend calls drawn as a column of small boxes; each call independently has a 1% chance of
being slow (red). The user waits for all of them. Formula: P(at least one slow) = 1 − 0.99^100 ≈ **63%**. A 10×10 dot grid fills to 63
red dots. Assumption chips: "calls are independent" · "the request waits for all calls". Optional mini curve: probability vs number of
calls (1 → 100).
Beats: `fanout`, `onepct`, `waitall`, `formula`, `grid`, `assumptions`.

### S19 `client-side` (≈ 25 s)
Visual: a server queue (one worker lane). A big slow request enters first; small fast requests pile up behind it (head-of-line
blocking). Server-side timer shows "service time: fast" for small ones, client-side stopwatch shows them slow. Text: "Measure response
time on the client side." Note: "load generators must keep sending, regardless of responses".
Beats: `queue`, `blocked`, `clientside`, `loadtest`.

### S20 `aggregate` (≈ 28 s)
Visual: three servers each with a small histogram and its own p99. Wrong path: "average of p99s" with a red ✕. Right path: histograms
stack into one combined histogram → p99 read from that (numbers from the provided dataset, chosen so the naive average is clearly
wrong). Tool chips: HdrHistogram · t-digest.
Beats: `servers`, `wrong`, `right`, `tools`.

---

## Part 5 — Scaling strategies (≈ 55 s) — orange

### S21 `scaling` (≈ 55 s)
Visual: left: "Scale up" — one machine box grows bigger. Right: "Scale out" — a grid of small machines appears (shared-nothing).
Then: stateless app instances clone freely behind a load balancer (easy) vs a stateful database that must be split (shards) and
replicated with arrows (hard). Then two workload cards with identical throughput badge (~100 MB/s): "100,000 requests/s × 1 kB" vs
"3 requests/min × 2 GB" → "Same throughput. Very different systems." Final: "There is no magic scaling sauce." Rule-of-thumb chip:
"keep the database on one node until cost or availability forces distribution".
Beats: `up`, `out`, `stateless`, `stateful`, `workloads`, `nosauce`.

---

## Part 6 — Maintainability (≈ 95 s) — purple

### S22 `mai-intro` (≈ 15 s)
Visual: purple divider "03 Maintainability — Most of the cost of software comes after launch." A timeline bar: a short "build" segment
followed by a very long "maintain" segment with small labels (fix bugs · keep it running · adapt · repay tech debt · add features).
Beats: `divider`, `lifetime`.

### S23 `operability` (≈ 25 s)
Visual: card "Operability — make it easy to keep healthy". Example animation: a node is drained, patched, and returned while traffic
keeps flowing (no single machine is special). Chips: visibility into runtime behavior · automation · good defaults you can override ·
predictable behavior.
Beats: `card`, `drain`, `chips`.

### S24 `simplicity` (≈ 38 s)
Visual: card "Simplicity — make it easy to understand". A tangled "big ball of mud" graph (many crossing edges). Definition:
"Accidental complexity: arises from the implementation, not from the problem." Then the abstraction example: a clean SQL query on top
(`SELECT … FROM orders WHERE …`) with a curtain hiding layers below: on-disk data structures · concurrent clients · crash recovery.
Practical example: scattered cache-invalidation logic consolidated behind one module.
Beats: `card`, `mud`, `accidental`, `sql`, `hidden`, `example`.

### S25 `evolvability` (≈ 22 s)
Visual: card "Evolvability — make change easy". Changing requirement chips drift in (new use cases · business priorities · regulations
· growth). Callback: the Twitter timeline moving from fan-out on read to fan-out on write — an architecture-level change; the
system should make such changes safe (e.g., backward-compatible, incremental steps).
Beats: `card`, `changes`, `callback`.

---

## Part 7 — Ending (≈ 75 s)

### S26 `callback` (≈ 32 s)
Visual: the three symptom cards from S01 return, then connecting lines map each to a pillar band: Stale data → Reliability (a promised
guarantee broke: cache/index consistent with the database) · Requests slowing down → Scalability & performance · Small change takes
days → Maintainability.
Beats: `symptoms`, `map1`, `map2`, `map3`.

### S27 `questions` (≈ 25 s)
Visual: three question cards with pillar colors:
- Which faults can we tolerate without users noticing?
- Which load parameter would force us to rethink our architecture?
- What makes our system unnecessarily difficult to operate or change?
Beats: `q1`, `q2`, `q3`.

### S28 `next` (≈ 20 s)
Visual: "Next: Data models & query languages" with three bands Relational · Document · Graph. Then a credits card:
"Based on the presentation 'DDIA Session 1: Reliable, Scalable, Maintainable' — mahdiyar.me/blog/ddia-session-1" ·
"Designing Data-Intensive Applications by Martin Kleppmann (O'Reilly)" · "Not affiliated with or endorsed by the author or
publisher." · "Narration: synthetic voice".
Beats: `next`, `credits`.
