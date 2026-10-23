# Brief — DDIA Session 4 (long): Chapter 3, Part 2 — "Why Analytics Uses Columns"

Source deck: "DDIA Session 4: Analytics and column storage" (`brief/deck.html`, public URL https://mahdiyar.me/blog/ddia-session-4/).
Book: Martin Kleppmann, *Designing Data-Intensive Applications*, O'Reilly, 1st edition (2017), Chapter 3 "Storage and Retrieval",
second half: "Transaction Processing or Analytics?", "Column-Oriented Storage", "Aggregation: Data Cubes and Materialized Views".
Series rules: `brief/series-standards.md` (binding). Accuracy decisions: `brief/accuracy-notes.md` (binding).

This is **Part 2** of Chapter 3 (series-log: Chapter 3 is two videos, one per deck). Part 1 (https://youtu.be/Pontu125KTo) covered
storage engines built for looking things up by key: logs, hash indexes, SSTables and LSM-trees, B-trees. This video may call back to
Part 1 briefly ("in Part 1…"), especially for LSM-style writes, but must stand on its own.

## Goal
Help junior-to-mid engineers understand why analytic queries need a different kind of database, why that database stores data by
column instead of by row, and how warehouses precompute answers — so they can recognise these patterns in their own systems.

## Audience and format
Junior to mid-level software engineers. 12–14 min, 16:9, 1080p60, English synthetic narration (Kokoro `af_heart`), captions, diagrams.

## Hook (first ~20 s; labeled "Illustration" on screen)
A real-world problem: at the start of every month, someone runs a report on the production database — total revenue per country for
the last quarter. It runs for many minutes, and while it runs, checkout gets slow for every customer. Same data, same SQL — so why is
one kind of query so painful? Payoff: by the end you'll know why that report belongs in a different database, why that database
stores its data sideways, in columns, and how it can answer the same question in seconds. (No invented timings: say "many minutes",
"seconds" only as the qualitative contrast.)

## Framing questions (one per part)
1. Why do analytic queries need their own database? → **01 · Data warehousing** (teal)
2. How should that database lay data out on disk? → **02 · Column storage** (orange)
3. Can we avoid computing the same answer again and again? → **03 · Precomputed aggregates** (purple)

## Required content
**Intro**
- OLTP vs OLAP (deck table, book Table 3-1): typical read (few rows by key vs aggregate over many rows), typical write (random,
  low-latency from user input vs bulk import / ETL or event stream), used by (end users via the app vs analysts for decision support),
  data represents (latest state vs history of events), size (gigabytes–terabytes vs terabytes–petabytes). Define "transaction" in the
  book's sense (a group of reads and writes, low latency; not necessarily ACID) and OLTP/OLAP spelled out.
- Why not run both on one database: a big scan competes with low-latency transactions; operators are reluctant to let analysts run
  ad hoc queries on the OLTP database (deck notes).

**01 · Data warehousing**
- ETL: extract from each OLTP system (periodic dump or continuous stream of updates), transform into an analysis-friendly schema,
  clean up, load into a separate read-only warehouse. Analysts query freely without affecting OLTP.
- The surface looks the same (SQL), the internals differ — warehouse vendors (Teradata, Vertica, SAP HANA, ParAccel — Amazon Redshift
  is a hosted ParAccel) and open-source SQL-on-Hadoop engines (Apache Hive, Spark SQL, Cloudera Impala, Facebook Presto…).
- Star schema: a central fact table (each row an event: one payment) with foreign keys into dimension tables (merchant, method,
  customer, date, region = who/what/where/when/how). Even the date is a dimension (encode public holidays). Fact tables are wide
  (often 100+ columns, sometimes several hundred) and huge (the book: big enterprises may hold tens of petabytes of transaction
  history, most of it in fact tables). Snowflake schema: dimensions normalised into sub-dimensions; stars are simpler for analysts.

**02 · Column storage**
- The problem: a query touches 4 or 5 of 100+ columns, but a row store keeps all values of a row together, so it loads and parses
  whole rows (even with an index on date).
- Column store: each column in its own file; row k is the k-th entry of every file. Lab → narrated demonstration on the 12-row
  illustrative table: `SUM(amount) WHERE country = 'DE'` reads 72 cells as rows vs 24 as columns; the point lookup `SELECT * WHERE id = 4`
  shows the trade-off (6 files vs 1 place). Cassandra/HBase "column families" are still row-oriented (deck notes). Parquet mention
  optional (column format, based on Google's Dremel).
- Compression: column values repeat; few distinct values vs many rows → one bitmap per value → long runs → run-length encoding
  (deck's DE/FR/NL example, verified). Bitmaps answer `IN` with OR and conditions across columns with AND, because every column keeps
  the same row order.
- Memory bandwidth and vectorised processing: the bottleneck moves to getting data from memory into the CPU; compressed column
  chunks fit in the CPU cache and are processed in tight loops (SIMD), operating directly on compressed data.
- Sort order: rows are sorted as a whole (sorting columns independently would lose which values belong together). Sort key e.g.
  date then merchant: date-range queries skip data; the first sort column compresses into a few long runs; later columns less so.
- Several sort orders: replicas can each keep a different sort order (C-Store, Vertica); unlike secondary indexes, each holds the
  full values, not pointers.
- Writes: update-in-place B-trees don't work with sorted compressed columns; inserting in the middle would rewrite every column file.
  LSM-style: buffer writes in memory, merge into new column files in bulk (Vertica does this); queries combine both transparently.

**03 · Precomputed aggregates**
- Many queries repeat the same aggregates (COUNT, SUM, AVG, MIN, MAX). Materialised view = a stored copy of a query's result,
  vs a virtual view = a saved query expanded when read. Keeping it fresh costs writes — fine in read-heavy warehouses, rare in OLTP.
- Data cube / OLAP cube: a grid of aggregates by dimensions (date × merchant, illustrative numbers from numbers.md), with row and
  column totals; more dimensions → a hypercube. Upside: some queries become a lookup. Downside: only the precomputed dimensions;
  no filtering on an attribute that isn't one (e.g. payments over $100). Warehouses keep raw data and use cubes as a speed-up.

## Labs and team prompts
- The deck's column-layout lab becomes the narrated demonstration in `columnar`. The quiz is not used.
- The team discussion (PostgreSQL primary, settlement/finance reports, "our data") becomes general questions:
  - Where do your heavy reports run — on the database serving your users, or on a copy built for analysis?
  - Which of your queries scan millions of rows but only use a few columns?
  - Which totals do you recompute on every dashboard load that could be computed once?

## Ending
Return to the monthly report: checkout slowing down → the warehouse (separate the workloads, ETL); the report reading every column
→ column storage, compression, sort by date; the same totals recomputed → materialised views / cubes. Three questions above.
Preview Chapter 4, "Encoding and Evolution": how data written by one version of your code is read by another (JSON, Protocol Buffers,
Avro). Credits per series standards.
