# Storyboard — "Why Analytics Uses Columns" (DDIA Chapter 3, Part 2)

Canvas 1920×1080, dark. Section accents: 01 Data warehousing = teal, 02 Column storage = orange, 03 Precomputed aggregates = purple;
intro/ending = hl yellow. `bad` red = slow / contention / wasted reads, `ok` green = fine. Key text above y≈940.
Recurring visual: the 12-row illustrative payments table from `numbers.md` (id · date · merchant · country · method · amount), drawn as a
grid of mono cells. Wherever it appears: small "Simplified illustration" label. Cells "read from disk" light up in `hl`.
Beats are cue names; a beat's visual lands on its line (use `k.word` for anything naming a specific word or number).
Total target ≈ 800 s.

---

## Intro (≈ 150 s)

### S01 `hook` (≈ 25 s)
Visual: badge "Illustration" top-right. Left: a calendar chip "1st of the month" and a report card "Revenue per country · last quarter".
An arrow from it into a single "Production database" box; the box fills with a progress bar that crawls (rows being scanned).
Right of the database: Users → Checkout flow with request dots; when `slow` lands the dots slow down and a latency pill turns red
"Checkout: slow". Then `payoff`: three small chips appear under a line "By the end:" — "a separate database" · "data stored in columns"
· "answers computed once".
Beats: `report`, `scan`, `slow`, `same`, `payoff`.

### S02 `title` (≈ 32 s)
Visual: kicker "Designing Data-Intensive Applications · Chapter 3 · Part 2", title "Why analytics uses columns". A small chip
"Part 1: storage engines for lookups by key" (callback). Then three question rows tagged by part colour:
1. Why do analytic queries need their own database? → 01 Data warehousing (teal)
2. How should that database lay out its data? → 02 Column storage (orange)
3. Can we stop computing the same answer twice? → 03 Precomputed aggregates (purple)
Beats: `title`, `part1`, `q1`, `q2`, `q3`.

### S03 `oltp-olap` (≈ 45 s)
Visual: two columns headed "Transaction processing · OLTP" and "Analytics · OLAP" (spell-out under each acronym). Rows build one at a
time like the deck's table: typical read (icon: one key → one row | many rows → Σ), typical write (random, small, from users |
bulk import or stream), used by (customers via the app | analysts, for decisions), data means (latest state | history of events),
size (gigabytes–terabytes | terabytes–petabytes). Footnote "Typical characteristics (book, Table 3-1)".
Beats: `two`, `reads`, `writes`, `users`, `history`, `size`.

### S04 `contention` (≈ 28 s)
Visual: one database cylinder. Small yellow request dots (transactions) flow in quickly from the left. A huge "scan" bar sweeps through
the database from the right (analyst query); the transaction dots queue up and turn red; latency pill rises. Then the bar fades, a
guard chip "Keep ad hoc analytics off the OLTP database" appears, and the database splits into two: "OLTP" and "?" (teal outline) —
setting up Part 01.
Beats: `scan`, `contend`, `reluctant`, `separate`.

---

## Part 01 — Data warehousing (≈ 175 s) — teal

### S05 `wh-intro` (≈ 12 s)
Visual: teal divider "01 Data warehousing" + subtitle "A separate database, built for questions."
Beats: `divider`.

### S06 `etl` (≈ 42 s)
Visual: left: three OLTP source boxes "Orders DB", "Payments DB", "Support tool". Arrows converge into three stages in a pipeline row:
**Extract** (dump or stream of changes) → **Transform** (analysis-friendly schema, cleaned) → **Load**, into a large teal "Data warehouse"
cylinder (read-only badge for analysts). Packets flow along. Then analyst icons on the right fire queries at the warehouse, while the
source boxes stay green ("unaffected").
Beats: `sources`, `extract`, `transform`, `load`, `freely`.

### S07 `same-sql` (≈ 35 s)
Visual: a horizontal split. Top band: the same SQL chip `SELECT … FROM … WHERE …` over both an OLTP box and a warehouse box ("Same
interface"). Bottom band, revealed like lifting a lid: different internals ("built for lookups by key" vs "built for big scans").
Then product chips appear, labeled "as of the book (2017)": Teradata · Vertica · SAP HANA · ParAccel (Amazon Redshift); open-source
SQL-on-Hadoop: Apache Hive · Spark SQL · Cloudera Impala · Presto.
Beats: `surface`, `below`, `vendors`, `opensource`.

### S08 `star` (≈ 48 s)
Visual: star schema builds: central teal box `fact_payments` "one row per payment" with sample columns (amount, fee, merchant_id,
method_id, date_id, …). Dimension boxes appear around it with connecting key lines: dim_merchant (who), dim_method (how), dim_date
(when), dim_customer (who paid), dim_region (where). The `dim_date` box expands to show columns: date · weekday · is_holiday.
Final: faint star outline connecting dimensions; label "Star schema".
Beats: `fact`, `keys`, `dims`, `date`, `star`.

### S09 `star-scale` (≈ 38 s)
Visual: the fact table stretches sideways into a very wide strip: "100+ columns, sometimes several hundred". Then it stretches down:
"tens of petabytes in large enterprises — as described in the book (2017)". Then a small snowflake variant: dim_merchant breaks into
dim_merchant → dim_category, dim_country (sub-dimensions); label "Snowflake: more normalized". Chip: "Star: simpler for analysts".
Beats: `wide`, `huge`, `snowflake`, `simpler`.

---

## Part 02 — Column storage (≈ 340 s) — orange

### S10 `col-intro` (≈ 12 s)
Visual: orange divider "02 Column storage" + "Read only the columns you need."
Beats: `divider`.

### S11 `row-problem` (≈ 42 s)
Visual: the query chip `SELECT country, SUM(amount) … GROUP BY country` (hook's report). Below, a wide row-store strip: 100 narrow
column stripes; the 4 used (date, country, amount, status… — show 4 stripes) light up orange: "uses 4 of 100+ columns". Then the row
store on disk: rows as long horizontal records stacked; a read head pulls whole rows into memory (all stripes light up red =
"loaded, parsed, then thrown away"). Label "Row-oriented: all values of a row stored together".
Beats: `query`, `touched`, `rowstore`, `load`, `waste`.

### S12 `columnar` (≈ 55 s)
Visual (the deck's lab as a demonstration; "Simplified illustration" label): the 12-row payments table from numbers.md. Layout toggle:
left "Row store" (rows as records), right "Column store" (six vertical files: id.col, date.col, …). `kth`: one row highlighted across all
column files (row 4 is the 4th entry in every file). `scan`: query `SUM(amount) WHERE country = 'DE'`: row store lights all 72 cells,
column store only the country + amount files: 24 cells (counters: "72 cells" vs "24 cells · 33%"). `lookup`: query `SELECT * WHERE id = 4`:
row store reads one record (6 cells, 1 place); column store has to visit 6 files (6 small hops). `tradeoff`: verdict chips "Scans of few
columns → columns win" / "Fetch whole rows → rows win". Small note chip: "Cassandra/HBase 'column families' are still row-oriented".
Beats: `files`, `kth`, `scan`, `lookup`, `tradeoff`, `families`.

### S13 `compress` (≈ 50 s)
Visual: the country column (DE DE DE FR FR NL NL NL NL DE DE FR) laid out horizontally as chips. `distinct`: chip "3 distinct values,
12 rows" → "a few hundred countries, billions of rows". `bitmaps`: three bit rows appear under it (DE 111000000110, FR …, NL …), each bit
aligned under its chip. `runs`: each bitmap collapses into its run list (DE → 0, 3, 6, 2, 1 …), with a note "count zeros first".
`smaller`: big many-row column → tiny run list; chip "Few distinct values → long runs → tiny".
Beats: `column`, `distinct`, `bitmaps`, `runs`, `smaller`.

### S14 `bitmap-query` (≈ 38 s)
Visual: `in`: `WHERE country IN ('DE','NL')`: DE and NL bitmaps stacked; an OR bar computes 111001111110 bit by bit. `and`: `country = 'DE'
AND method = 'card'`: DE bitmap and the method=card bitmap (000110111100) from a different column → AND = 000000000100 → row 10 lights in
the table. `order`: label "Works because every column keeps the same row order".
Beats: `in`, `or`, `and`, `order`.

### S15 `vectorized` (≈ 45 s)
Visual: a horizontal hardware pipeline: Disk → Memory → CPU cache → CPU core. `bottleneck`: wide data flow narrows at disk→memory, then
at memory→cache (pinch points glow). `cache`: compressed column chunks (small blocks) fit into the "L1 cache" box, many more rows than
uncompressed rows would. `loop`: a tight loop icon spins over chunks applying `AND` to bit chunks (no per-row function calls). `vectorized`:
label "Vectorized processing" + SIMD chip "one instruction, many values".
Beats: `bottleneck`, `cache`, `loop`, `vectorized`.

### S16 `sort-order` (≈ 55 s)
Visual: the 12-row table again (column view). `insertion`: "Stored in insertion order" — date column shows 12 runs (mixed Jun 1/2/3).
`wholerows`: animate a wrong attempt: sorting only the date column scrambles the rows (red ✕ "which amount belongs to which date?");
undo. `key`: chip "Sort key: date, then merchant"; whole rows reorder (ids 4, 10, 2, 7, 3, 11, 6, 9, 1, 5, 8, 12). `skip`: a query "date =
Jun 2" reads only the Jun 2 block; other blocks dim. `runs`: date column → 3 runs; merchant → 8 runs; amount stays 12 (jumbled). Chip
"First sort key: long runs → compresses best".
Beats: `insertion`, `wholerows`, `key`, `skip`, `runs`.

### S17 `multi-sort` (≈ 32 s)
Visual: three replica boxes (needed anyway for fault tolerance). Each gets a different sort-order label: "by date", "by merchant", "by
country". Two queries come in and route to their best replica ("last week's revenue" → by date; "one merchant's history" → by merchant).
Chip "C-Store, Vertica". Contrast mini-diagram: "secondary index → pointer to the row" vs "sort order → full copy of the values".
Beats: `replicas`, `orders`, `route`, `values`.

### S18 `writes` (≈ 48 s)
Visual: sorted compressed column files on disk. `problem`: a new row arrives that belongs in the middle; inserting means every column file
splits and rewrites (all files flash red: "rewrite every column file"). `memstore`: callback "Part 1: LSM-trees": the new row goes into an
in-memory buffer instead (sorted); more rows accumulate. `merge`: buffer merges with the column files in bulk, producing new files.
`both`: a query reads both disk files and the in-memory buffer and combines them; chip "Writes show up immediately (Vertica does this)".
Beats: `problem`, `rewrite`, `memstore`, `merge`, `both`.

---

## Part 03 — Precomputed aggregates (≈ 115 s) — purple

### S19 `agg-intro` (≈ 12 s)
Visual: purple divider "03 Precomputed aggregates" + "Do the work once, read many times."
Beats: `divider`.

### S20 `matview` (≈ 45 s)
Visual: several dashboards/queries repeatedly hitting the fact table with the same `SUM(amount) GROUP BY day` (repeat counter). `virtual`:
a "virtual view" card: a saved query that expands into the full query on every read (arrow to the fact table each time). `materialized`:
"materialized view" card: result stored on disk as a small table; reads hit it directly. `update`: a new payment lands in the fact table →
the materialized view must update too (extra write arrow, cost chip). `warehouses`: "Read-heavy warehouse: worth it · Write-heavy OLTP:
rarely".
Beats: `repeat`, `virtual`, `materialized`, `update`, `warehouses`.

### S21 `cube` (≈ 55 s)
Visual (Simplified illustration, values from numbers.md, thousands of dollars): a 4×3 grid: rows Jun 1–4, columns Acme / Bolt / Cora;
cells fill in. `totals`: row totals (218, 116, 187, 179) and column totals (181, 255, 264), grand total 700. `more`: the grid extrudes into a
3-D cube silhouette with a third axis "method" and a label "5 dimensions → 5-D hypercube". `fast`: query "Bolt, all days" → one lookup
(255) lights instantly. `rigid`: query "payments over $100?" → red ✕ "amount isn't a dimension". `raw`: chip "Keep raw data; cubes are a
speed-up".
Beats: `grid`, `totals`, `more`, `fast`, `rigid`, `raw`.

---

## Ending (≈ 85 s)

### S22 `callback` (≈ 38 s)
Visual: the hook returns (report card, production database, slow checkout). Then three mappings with part colours: "Checkout slows down"
→ 01 Warehouse via ETL (teal); "Report reads every column" → 02 Columns, compression, sorted by date (orange); "Same totals every month"
→ 03 Materialized view / cube (purple). End state: report → warehouse, answering in seconds (qualitative), checkout green.
Beats: `report`, `map1`, `map2`, `map3`.

### S23 `questions` (≈ 28 s)
Visual: three question cards in part colours:
- Where do your heavy reports run — on the database serving your users?
- Which queries scan millions of rows but use only a few columns?
- Which totals do you recompute on every dashboard load?
Beats: `q1`, `q2`, `q3`.

### S24 `next` (≈ 22 s)
Visual: "Next: Chapter 4 · Encoding and evolution" with a small diagram: "v1 writes → v2 reads" and three format chips JSON · Protocol
Buffers · Avro. Then the credits card (deck title + URL from VIDEO, book, no-affiliation line, "Narration: synthetic voice").
Beats: `next`, `credits`.
