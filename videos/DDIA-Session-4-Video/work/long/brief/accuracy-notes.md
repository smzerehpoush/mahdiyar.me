# Accuracy decisions (binding for script and visuals)

Source of truth: DDIA 1st edition (2017), Chapter 3, second half. These override the deck where it is imprecise.

1. **OLTP vs OLAP table** follows the book's Table 3-1 (the deck matches it): main read pattern (small number of records per query,
   fetched by key vs aggregate over a large number of records); main write pattern (random-access, low-latency writes from user input
   vs bulk import (ETL) or event stream); primarily used by (end user/customer via web application vs internal analyst, for decision
   support); data represents (latest state of data, current point in time vs history of events that happened over time); dataset size
   (gigabytes to terabytes vs terabytes to petabytes). These are typical characteristics, not hard rules: say "typically".
2. **"Transaction"** in OLTP means a group of reads and writes forming a logical unit with low latency, from commercial transactions
   historically; it does not necessarily mean ACID. Spell out: OLTP = "online transaction processing", OLAP = "online analytic
   processing". Spoken acronyms: say "O-L-T-P"/"O-L-A-P" only after spelling them out once (`say`: "O L T P", "O L A P").
3. **Why separate**: OLTP systems are expected to be highly available and low-latency; operators are reluctant to let analysts run
   ad hoc analytic queries on them, because those queries are expensive (scan large parts of the dataset) and can harm the performance
   of concurrently executing transactions. Qualitative only; no invented timings.
4. **ETL**: data is extracted from OLTP databases (periodic data dump or continuous stream of updates), transformed into an
   analysis-friendly schema, cleaned up, and loaded into the warehouse. The warehouse is a separate, read-only copy (read-only for
   analysts; the ETL process writes it).
5. **Products** (book's list, circa 2017): commercial warehouses Teradata, Vertica, SAP HANA, ParAccel (Amazon Redshift is a hosted
   version of ParAccel); open-source SQL-on-Hadoop: Apache Hive, Spark SQL, Cloudera Impala, Facebook Presto, Apache Tajo, Apache Drill.
   **Do not show "Trino"** (the deck's "Presto / Trino"): the rename is after the book. Label any product list "as of the book (2017)".
   Same SQL interface on the surface, internals optimised for very different query patterns.
6. **Star schema**: fact table at the centre; each row is an event (book: a customer's purchase; ours: one payment). Some columns are
   attributes (amount, fee), others are foreign keys into dimension tables (who, what, where, when, how, why). The name "star": the
   fact table in the middle, dimension tables around it like rays. Even date and time are dimensions, so extra information such as
   public holidays can be encoded and filtered on. Our payments schema (fact_payments, dim_merchant, dim_method, dim_customer, dim_date,
   dim_region) is the deck's illustration, not the book's example: no label needed beyond it being an example.
7. **Fact table size**: fact tables often have over 100 columns, sometimes several hundred; dimension tables can be wide too. Fact
   tables can become extremely large: the book says a big enterprise may have tens of petabytes of transaction history in its
   warehouse, most of it in fact tables. Say "the book describes…" / on screen "as described in the book (2017)". Do not name companies.
8. **Snowflake schema**: dimensions further broken down into sub-dimensions (more normalised); star schemas are often preferred
   because they are simpler for analysts to work with.
9. **Typical query width**: although fact tables are over 100 columns wide, a typical warehouse query accesses only 4 or 5 of them at a
   time ("SELECT *" is rarely needed for analytics). Row store: even with indexes on the filter columns, it must load all those rows
   (each with 100+ attributes) from disk into memory, parse them, and filter out those that don't meet the conditions.
10. **Column store**: values from each column stored together, each column in its own file; a query reads and parses only the columns
    it uses. It relies on every column file containing the rows in the same order: the k-th entry of each file belongs to the same row.
11. **Lab numbers**: only from `data/numbers.md` (12-row illustrative payments table): 72 vs 24 cells (33%) for the scan; the point
    lookup reads 6 cells either way, from 1 place vs 6 files. The "100 columns, uses 4 → about 4%" figure is illustrative and ignores
    compression. Label "Simplified illustration" on screen.
12. **Column families**: Cassandra and HBase have "column families" (from Bigtable), but within a column family they store all columns
    of a row together with the row key, and don't use column compression: they are mostly row-oriented. Say so briefly if mentioned.
13. **Parquet** (optional mention): a columnar storage format that supports a document data model, based on Google's Dremel.
14. **Compression / bitmaps**: column values are often repetitive. The number of distinct values n is often small compared to the number
    of rows (the book: a retailer may have billions of sales transactions but only 100,000 distinct products). Bitmap encoding: one bitmap
    per distinct value, one bit per row. If n is large the bitmaps are sparse (mostly zeros), and run-length encoding makes them very
    compact. Run notation counts zeros first (deck's example verified: DE 111000000110 → 0, 3, 6, 2, 1; FR 000110000001 → 3, 2, 6, 1;
    NL 000001111000 → 5, 4, 3). Do not claim a compression ratio.
15. **Bitmap queries**: `WHERE country IN ('DE','NL')` = bitwise OR of the two bitmaps; a condition on two columns (`country = 'DE' AND
    method = 'card'`) = bitwise AND of bitmaps from different columns, which works because both columns hold the rows in the same order.
    Values from numbers.md.
16. **Memory bandwidth and vectorised processing**: for warehouse queries scanning millions of rows, a big bottleneck is bandwidth from
    disk into memory; developers also care about bandwidth from main memory into the CPU cache, avoiding branch mispredictions and
    pipeline bubbles, and using SIMD instructions. Column compression lets more rows of a column fit in the CPU's L1 cache; operators
    like bitwise AND/OR can work directly on chunks of compressed column data in a tight loop with no function calls. The book calls
    this vectorized processing. Do not claim speedup factors.
17. **Sort order**: rows are stored in insertion order by default, but you can choose a sort order. Columns can't be sorted
    independently (you'd lose which values belong to the same row): sort entire rows, even though storage is by column. Book example:
    date first (range queries like "last month" only scan that range), then a second key (book: product; ours: merchant) to group values
    within each date. The first sort column compresses best: long runs of repeated values; the book says run-length encoding could
    compress it to a few kilobytes even with billions of rows. The second key compresses less, and later columns look jumbled.
    Demo numbers from numbers.md (date: 12 runs → 3; merchant 8; amount 12).
18. **Several sort orders**: introduced in C-Store and adopted by Vertica. Data must be replicated anyway for fault tolerance, so each
    replica can store data sorted differently; a query uses the version that best fits it. Unlike multiple secondary indexes in a row
    store (which point to rows stored elsewhere), each sort order stores the column values themselves.
19. **Writes**: update-in-place (as B-trees do) is impossible with compressed columns; inserting a row in the middle of a sorted table
    would most likely mean rewriting all the column files. Solution: LSM-trees (call back to Part 1): writes go to an in-memory store,
    sorted; when enough have accumulated they are merged with the column files on disk and written to new files in bulk. Vertica does
    this. Queries examine both the on-disk column data and recent writes in memory, and combine the two; the optimizer hides this, and
    an insert, update or delete is immediately reflected in subsequent queries. (The in-memory store's own layout, row or column, isn't
    important.)
20. **Materialized views**: many warehouse queries involve an aggregate function (COUNT, SUM, AVG, MIN, MAX). A materialized view is an
    actual copy of the query results written to disk; a virtual view is just a shortcut for writing queries, expanded on the fly. When
    the underlying data changes, a materialized view must be updated; that makes writes more expensive, which is why they are not often
    used in OLTP databases; in read-heavy warehouses they can make more sense. Use US spelling on screen and in captions
    ("materialized"); the deck's "materialised" is British — either is correct, use one consistently.
21. **Data cube / OLAP cube**: a special case of a materialized view: a grid of aggregates grouped by different dimensions. 2-D example:
    each cell = SUM(amount) for one date × merchant combination; summing a row or column gives a total reduced by one dimension. Facts
    with five dimensions → a five-dimensional hypercube. Advantage: certain queries become very fast (effectively precomputed).
    Disadvantage: less flexible than raw data: you can't answer a question about an attribute that isn't one of the dimensions (book:
    "the proportion of sales from items that cost more than $100", because price isn't a dimension; ours: payments over $100, because
    amount isn't a dimension). Most warehouses keep as much raw data as possible and use cubes only as a performance boost for certain
    queries. Cube numbers from numbers.md, labeled "Simplified illustration".
22. **Hook**: the monthly-report scenario is an invented illustration; label "Illustration" on screen. No invented durations ("many
    minutes" vs "seconds" only as a qualitative contrast).
23. **Remove team-specific content**: PostgreSQL primary, settlement/finance reports of "our system", "our data". Use the three general
    questions in the brief.
24. **Next chapter**: Chapter 4, "Encoding and Evolution": how data stays readable when it is written by one version of the code and read
    by another (formats such as JSON, Protocol Buffers, Avro).
25. **Credits**: the blog presentation (`VIDEO.deck.title`, `VIDEO.deck.url`), the book (Martin Kleppmann, O'Reilly, 1st edition,
    Chapter 3), the no-affiliation line, "Narration: synthetic voice".
