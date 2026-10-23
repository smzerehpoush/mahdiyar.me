# Why Analytics Uses Columns — DDIA Chapter 3, Part 2 — narration script with timings

Total runtime 12:50 (770.2 s) · rendered 1920×1080 at 60 fps · synthetic voice (Kokoro af_heart) @ 1×

## 0:00 — `hook` (27.8 s, intro)

| Time | Beat | Narration |
|---|---|---|
| 0:01 | `report` | An illustration: on the first of each month, someone runs a quarterly revenue report on the production database. |
| 0:08 | `scan` | It crawls through rows for many minutes. |
| 0:10 | `slow` | Meanwhile, checkout gets slow for every customer. |
| 0:14 | `same` | Same data, same SQL — so why does this one query hurt? |
| 0:18 | `payoff` | By the end, you'll know where that report belongs, why its database stores data in columns, and how answers computed once come back in seconds. |

## 0:27 — `title` (30.8 s, intro)

| Time | Beat | Narration |
|---|---|---|
| 0:28 | `title` | This video covers the second half of Chapter 3 of Martin Kleppmann's book, Designing Data-Intensive Applications. |
| 0:35 | `part1` | The previous video, Part 1, was about storage engines built for looking things up by key — logs, LSM-trees, and B-trees. |
| 0:44 | `q1` | Our monthly report raises three questions. First: why do analytic queries need their own database? |
| 0:50 | `q2` | Second: how should that database lay its data out on disk? |
| 0:54 | `q3` | And third: can we avoid computing the same answer over and over? |

## 0:58 — `oltp-olap` (48.6 s, intro)

| Time | Beat | Narration |
|---|---|---|
| 0:59 | `two` | In our story, checkout is online transaction processing, or OLTP. |
| 1:04 |  | The report is online analytic processing, or OLAP. |
| 1:08 |  | A transaction here just means a quick group of reads and writes — not necessarily full ACID guarantees. |
| 1:14 | `reads` | Typically, a transaction reads a few rows by key, while the report aggregates over a huge number of rows. |
| 1:21 | `writes` | Transactions write small, random updates as users click; analytics gets its data through bulk imports or event streams. |
| 1:29 | `users` | Transactions serve customers through the app; analytics serves analysts making decisions. |
| 1:35 | `history` | Transactions work on the latest state of things; analytics on the history of everything that happened. |
| 1:40 | `size` | And the sizes typically differ: gigabytes to terabytes, versus terabytes to petabytes. |

## 1:47 — `contention` (26.6 s, intro)

| Time | Beat | Narration |
|---|---|---|
| 1:47 | `scan` | Put both on one database, and the report starts a huge scan through the tables. |
| 1:52 | `contend` | It competes for disk, memory, and CPU with the small transactions customers are waiting on, so those queue up and slow down. |
| 2:00 | `reluctant` | That's why the people running OLTP databases are reluctant to let analysts run ad hoc, one-off queries on them. |
| 2:09 | `separate` | The usual answer is to give analytics a database of its own. |

## 2:13 — `wh-intro` (11.0 s, warehousing)

| Time | Beat | Narration |
|---|---|---|
| 2:14 | `divider` | First stop: data warehousing — a separate database, built for answering questions instead of serving customers. So how does our report's data get there? |

## 2:24 — `etl` (35.6 s, warehousing)

| Time | Beat | Narration |
|---|---|---|
| 2:25 | `sources` | In a real company, the data behind our report lives in several OLTP systems: orders, payments, a support tool. |
| 2:33 | `extract` | First, you extract it, with a periodic dump or a continuous stream of changes. |
| 2:38 | `transform` | Then you transform it into a schema that's friendly to analysis, and clean it up along the way. |
| 2:44 | `load` | Finally, you load it into the data warehouse — a separate copy that analysts can read but not write. |
| 2:50 |  | Extract, transform, load — together, that's called ETL. |
| 2:54 | `freely` | Now the monthly report can scan as much as it likes without slowing checkout down. |

## 3:00 — `same-sql` (34.2 s, warehousing)

| Time | Beat | Narration |
|---|---|---|
| 3:00 | `surface` | From the outside, a warehouse looks familiar: you still talk to it in SQL, often with the same tools. |
| 3:07 | `below` | But under the lid, the internals are tuned for a different job — big scans, not quick lookups by key. |
| 3:14 | `vendors` | As of the book in 2017, commercial warehouses included Teradata, Vertica, SAP HANA, and ParAccel — Amazon Redshift is a hosted version of it. |
| 3:25 | `opensource` | And there were open-source SQL-on-Hadoop engines, like Apache Hive, Spark SQL, Cloudera Impala, and Facebook's Presto. |

## 3:34 — `star` (35.3 s, warehousing)

| Time | Beat | Narration |
|---|---|---|
| 3:35 | `fact` | Inside the warehouse, the data usually sits in a star schema, built around one big table in the middle: the fact table. |
| 3:42 |  | Each row is one event — here, one payment. |
| 3:45 | `keys` | Some columns describe the payment itself, like amount and fee; others are keys pointing into smaller tables. |
| 3:52 | `dims` | Those are dimension tables: which merchant, who paid, how they paid, where, and when. |
| 3:57 | `date` | Even the date gets its own dimension, so you can record things like public holidays and filter on them. |
| 4:03 | `star` | Draw the dimensions around the fact table like rays, and you get a star — hence the name. |

## 4:09 — `star-scale` (33.8 s, warehousing)

| Time | Beat | Narration |
|---|---|---|
| 4:10 | `wide` | Real fact tables are wide: often over a hundred columns, sometimes several hundred. |
| 4:16 | `huge` | And they get huge: the book describes how a big enterprise may hold tens of petabytes of transaction history, most of it in fact tables. |
| 4:25 | `snowflake` | A variation, the snowflake schema, breaks dimensions into sub-dimensions — a merchant points to its category and its country. |
| 4:33 | `simpler` | That's more normalized, but stars are often preferred, because they're simpler for analysts to work with. |
| 4:39 |  | Keep that width in mind — it's the root of our next problem. |

## 4:43 — `col-intro` (9.6 s, columns)

| Time | Beat | Narration |
|---|---|---|
| 4:44 | `divider` | Second stop: column storage. Our report touches a few columns of a very wide table — so how should that table sit on disk? |

## 4:53 — `row-problem` (35.6 s, columns)

| Time | Beat | Narration |
|---|---|---|
| 4:53 | `query` | Here's our report as a query: sum the amount, grouped by country, for last quarter's dates. |
| 4:59 | `touched` | Out of a hundred-plus columns, a typical warehouse query like this needs just four or five. |
| 5:05 | `rowstore` | But most databases you know, including the engines from the previous video, store data row by row, with each row's values stored together. |
| 5:14 | `load` | So even with an index on the date, the database loads every matching row from disk, every column of it, and parses it. |
| 5:22 | `waste` | Then it throws away almost everything it just read, keeping only the few values the report asked for. |

## 5:28 — `columnar` (51.6 s, columns)

| Time | Beat | Narration |
|---|---|---|
| 5:29 | `files` | Column storage flips this: each column goes into its own file — here, six files for twelve payments, a simplified illustration. |
| 5:38 | `kth` | The trick is that every file keeps the same order, so the fourth entry in each file belongs to payment four. |
| 5:44 | `scan` | A mini version of our report — total amount for Germany, DE: the row store reads all 72 cells, the column store only the country and amount files — 24. |
| 5:56 | `lookup` | Flip it around and fetch all of payment four: six cells either way, but rows keep them in one place, while columns need six files. |
| 6:05 | `tradeoff` | So it's a trade-off: columns win when you scan many rows but few columns; rows win when you need whole records. |
| 6:12 | `families` | Careful: column families in Cassandra and HBase keep a row's values together, so they're mostly row-oriented. |

## 6:20 — `compress` (47.3 s, columns)

| Time | Beat | Narration |
|---|---|---|
| 6:21 | `column` | Storing by column has a second benefit: values repeat. Here's the country column from our twelve payments. |
| 6:27 | `distinct` | Only three distinct values across twelve rows. |
| 6:31 |  | The book's example is a retailer with billions of sales but only 100,000 distinct products. |
| 6:37 | `bitmaps` | So for each value, keep a bitmap: one bit per row, set to one wherever that row has the value. |
| 6:44 | `runs` | Each bitmap is just runs of zeros and ones, so store how long each run is instead, counting zeros first: Germany becomes 0, 3, 6, 2, 1. |
| 6:55 |  | That's called run-length encoding. |
| 6:57 | `smaller` | With many distinct values, like those 100,000 products, each bitmap is mostly zeros, and run-length encoding makes it very compact. |

## 7:07 — `bitmap-query` (28.3 s, columns)

| Time | Beat | Narration |
|---|---|---|
| 7:08 | `in` | Bitmaps can also answer questions directly. Say the report wants Germany or the Netherlands. |
| 7:14 | `or` | Combine those two bitmaps with a bitwise OR, and you have every matching row. |
| 7:19 | `and` | Conditions on different columns work too: German payments made by card are the Germany bitmap AND the card bitmap — just payment ten. |
| 7:28 | `order` | That only works because every column file keeps the rows in the same order — the same rule that lined up payment four. |

## 7:36 — `vectorized` (33.3 s, columns)

| Time | Beat | Narration |
|---|---|---|
| 7:36 | `bottleneck` | Compression pays off twice. When a warehouse scans millions of rows, a big bottleneck is moving data from disk into memory, and from memory into the CPU. |
| 7:47 | `cache` | A chunk of compressed column holds many rows and fits in the processor's small, fast L1 cache. |
| 7:53 | `loop` | The CPU can then run that bitwise AND straight over the compressed chunk, in a tight loop, without calling a function for every value. |
| 8:01 | `vectorized` | The book calls this vectorized processing, and SIMD instructions let one instruction handle many values at once. |

## 8:09 — `sort-order` (45.8 s, columns)

| Time | Beat | Narration |
|---|---|---|
| 8:10 | `insertion` | So far, our rows sit in the order they arrived, so the date column jumps around: twelve runs for twelve rows. |
| 8:17 | `wholerows` | You can choose a sort order, but not one column on its own — you'd lose track of which amount belongs to which payment. |
| 8:24 | `key` | Instead, you sort whole rows, even though each column is stored separately — here by date first, then by merchant. |
| 8:31 | `skip` | A query for June 2 now reads only that block and skips the rest — just what a last-quarter report wants. |
| 8:39 | `runs` | Sorting helps compression too: the date column drops from twelve runs to three; merchant, sorted only within each day, has eight; amount stays at twelve. |
| 8:49 |  | On billions of rows, the book notes, that first column could shrink to a few kilobytes. |

## 8:55 — `multi-sort` (28.6 s, columns)

| Time | Beat | Narration |
|---|---|---|
| 8:55 | `replicas` | Warehouses keep several copies of the data anyway, so that losing a machine doesn't lose data. |
| 9:01 | `orders` | That means each copy can be sorted differently: one by date, one by merchant, one by country. |
| 9:07 | `route` | Each query then uses the copy that fits it best — an idea from a research system called C-Store, adopted by Vertica. |
| 9:15 | `values` | Unlike secondary indexes, which only point to rows stored elsewhere, each sort order holds the actual column values. |

## 9:23 — `writes` (35.3 s, columns)

| Time | Beat | Narration |
|---|---|---|
| 9:24 | `problem` | All this tidiness has a cost, though, when new payments arrive. |
| 9:28 | `rewrite` | Compressed columns can't be updated in place like a B-tree, and a new row that sorts into the middle would most likely mean rewriting every column file. |
| 9:37 | `memstore` | The fix comes from the LSM-trees in the previous video: new writes go into a sorted buffer in memory first. |
| 9:45 | `merge` | When enough have piled up, they're merged with the column files on disk and written out as new files, in bulk. |
| 9:51 | `both` | Queries read both the files and the buffer and combine them, so new data shows up right away — Vertica works this way. |

## 9:59 — `agg-intro` (10.2 s, aggregates)

| Time | Beat | Narration |
|---|---|---|
| 9:59 | `divider` | Third stop: precomputed aggregates. The monthly report adds up the same kind of totals every month — can we do that work once and reuse it? |

## 10:09 — `matview` (39.1 s, aggregates)

| Time | Beat | Narration |
|---|---|---|
| 10:09 | `repeat` | Warehouse queries keep asking for the same aggregates — counts, sums, averages, minimums, maximums — over and over. |
| 10:17 | `virtual` | A regular, virtual view doesn't help: it's just a saved query that gets expanded and rerun every time you read it. |
| 10:25 | `materialized` | A materialized view is different: it stores an actual copy of the result on disk, so reading it is cheap. |
| 10:32 | `update` | The catch: whenever the underlying data changes, the view has to be updated too, which makes every write more expensive. |
| 10:40 | `warehouses` | That's why they're not often used in OLTP databases, but in a read-heavy warehouse the trade is often worth it. |

## 10:48 — `cube` (51.2 s, aggregates)

| Time | Beat | Narration |
|---|---|---|
| 10:48 | `grid` | A common special case is the data cube: a grid of totals, here revenue by date and merchant, in thousands of dollars, from a larger set of payments. |
| 10:58 |  | It's a simplified illustration. |
| 11:00 | `totals` | Add up a row and you get one day's total; add up a column and you get one merchant's total — 700 thousand overall. |
| 11:09 | `more` | Real fact tables have more dimensions, so the grid grows into a cube, and with five dimensions, a five-dimensional hypercube. |
| 11:17 | `fast` | Back in our grid, Bolt's revenue across all days is a single lookup: 255 thousand, already computed. |
| 11:25 | `rigid` | But ask about payments over 100 dollars, and the cube can't help, because amount isn't one of its dimensions. |
| 11:32 | `raw` | That's why most warehouses keep as much raw data as they can, and treat cubes as a speed-up for common queries. |

## 11:39 — `callback` (29.2 s, ending)

| Time | Beat | Narration |
|---|---|---|
| 11:40 | `report` | Let's go back to the first of the month, and that report slowing down checkout. |
| 11:44 | `map1` | Checkout got slow because analytics and transactions shared one database; ETL into a warehouse separates them. |
| 11:52 | `map2` | The report read whole rows; a column store reads only the columns it needs, compressed and sorted by date. |
| 11:59 | `map3` | And the same totals, recomputed every month, can come from a materialized view or a cube — an answer in seconds, not many minutes. |

## 12:08 — `questions` (20.2 s, ending)

| Time | Beat | Narration |
|---|---|---|
| 12:09 |  | Now, some questions for your own system. |
| 12:11 | `q1` | Where do your heavy reports run — on the database serving your users, or on a copy built for analysis? |
| 12:18 | `q2` | Which of your queries scan millions of rows but use only a few columns? |
| 12:23 | `q3` | And which totals do you recompute on every dashboard load that could be computed once? |

## 12:28 — `next` (21.3 s, ending)

| Time | Beat | Narration |
|---|---|---|
| 12:29 | `next` | Next is Chapter 4, Encoding and Evolution: how data written by one version of your code gets read by another. |
| 12:36 |  | We'll look at formats like JSON, Protocol Buffers, and Avro. |
| 12:40 | `credits` | Martin Kleppmann's book and the blog presentation are credited on screen. Thanks for watching. |

