# English community posts (drafts)

For: engineers on Reddit. You post these yourself, from your own account.
Before posting, read each subreddit's self-promotion rule (many want most of your activity to be non-promotional) and use a text
post where the explanation stands on its own, with the link at the end. Space them out: one post, wait a few days, then the next.
Don't post the same text to several subreddits on the same day.

Suggested places: r/softwarearchitecture or r/ExperiencedDevs (post 1, if their rules allow it), r/dataengineering or r/Database
(post 2), r/systemdesign (either).

---

## Post 1: Chapter 4 (rolling deploy)

**Title:** A rolling deploy can silently delete a field: the read-modify-write trap from Designing Data-Intensive Applications, ch. 4

**Body:**

During a rolling deploy, the old and new versions of your service run side by side and read each other's data. Here's a failure
that produces no error at all.

User profiles are stored as JSON documents. v2 adds a `timeZone` field. Mid-rollout, a v2 server saves a user's time zone. Then a
v1 server handles a display-name change: it decodes the document into its `Profile` class, which has no `timeZone` property,
changes the name, and writes the whole document back. The time zone is gone. No exception, no failed request.

Kleppmann calls the property you need here forward compatibility: old code has to cope with data that new code wrote. Two ways out:

- old code keeps the fields it doesn't recognize when it decodes and re-encodes a record, or
- writes are partial updates that only touch the field that changed.

This needs a store where the record is one encoded document or blob (a document database, a JSON column, Protobuf bytes). With a
plain relational table, an old ORM's UPDATE only lists its own columns, so the new column survives.

I made a 14-minute animated walkthrough of the whole chapter: JSON pitfalls, field tags in Thrift and Protocol Buffers, Avro's
writer and reader schemas, which schema changes are safe, and how data flows through databases, services and message brokers:
https://youtu.be/gavQQVU2d1w

Has anyone hit this in production? I'm curious what made it show up for you.

---

## Post 2: Chapter 3, Part 2 (column storage)

**Title:** Why analytics databases store columns, with numbers small enough to count

**Body:**

Take a 12-row payments table with 6 columns: id, date, merchant, country, method, amount. The query is
`SELECT SUM(amount) FROM payments WHERE country = 'DE'`.

- Stored row by row, the database reads all 72 cells to answer it.
- Stored column by column, it reads only the country and amount columns: 24 cells, a third of the data.

That's a toy table. Designing Data-Intensive Applications notes that fact tables in a data warehouse are often over 100 columns
wide, while a typical query touches 4 or 5 of them. Reading 4 of 100 columns is about 4% of the data, before compression, and
column files compress well because each one holds values of a single type, often repeated.

The trade-off is writes: inserting one row now means touching every column file, which is why column stores buffer writes in memory
first (the same LSM-tree idea from the storage engine chapter).

I made a 13-minute animated explainer of this part of the chapter (OLTP vs. OLAP, star schemas, column storage, compression, sort
order, materialized views): https://youtu.be/Dbgfqu1neps

If your reports run on the same database your customers use, this is the reason to split them.

---

Notes:
- Post 1's one-minute version, https://youtube.com/shorts/0jGFILQlCmg, is scheduled for 2026-10-28 18:30 Tehran; don't link it
  before then.
- Post 2's one-minute version is https://youtube.com/shorts/UEuhuITwccI (public from 2026-10-27 18:30 Tehran).
