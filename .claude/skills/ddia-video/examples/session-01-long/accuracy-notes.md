# Accuracy decisions (binding for script and visuals)

These override the source deck where the deck is imprecise.

1. **Reads per tweet.** 300,000 timeline reads/s ÷ 4,600 tweets/s ≈ **65 reads per tweet** (the deck says "~100×" — do NOT use 100×).
   Say "roughly sixty-five timeline reads for every tweet posted" or "reads outnumber posts by more than sixty to one".
2. **Disk math.** 10,000 disks ÷ (30 years × 365 days) ≈ **0.91 failures/day → "about one per day"**. Use MTTF = 30 years (not the
   deck's 27). Label on screen: "Simplified illustration: independent failures, constant rate". The book says disk MTTF is reported
   as roughly 10 to 50 years.
3. **Amazon "100 ms = 1% of sales"** — DROP entirely.
4. **Human-error study.** Attribute as "one study of large internet services" (Oppenheimer et al., early 2000s): configuration errors by
   operators were the leading cause of outages. Do NOT quote "10–25%".
5. **Twitter figures** (all from a 2012 talk cited by the book; label "Twitter, circa 2012" on screen wherever they appear):
   post tweet ≈ 4,600 requests/s on average (over 12,000 at peak); home timeline ≈ 300,000 requests/s; average 75 followers per tweet
   → 345,000 writes/s to home-timeline caches; some users had over 30 million followers. The 5-second delivery target may be mentioned
   only as "Twitter aimed to deliver tweets to followers within about five seconds" (circa 2012) — do not derive "6 million writes/s".
   "30 million timeline insertions for one tweet" stands on its own.
6. **Amazon p99.9.** Allowed with qualification: "Amazon, for example, has described response-time requirements for its internal
   services in terms of the 99.9th percentile" (historical; from its Dynamo paper era). The rationale from the book: the slowest requests
   often come from customers with the most data — often the most valuable customers. p99.99 was considered too expensive (diminishing
   returns). Do not present as current Amazon practice.
7. **Leap second.** "A leap second on June 30, 2012 triggered a Linux kernel bug that made many applications hang at the same time."
8. **Chaos Monkey.** Netflix's Chaos Monkey randomly terminates instances (servers/VMs) so that recovery paths are exercised. Generic
   principle from the book: deliberately inducing faults (e.g., randomly killing processes) keeps fault-tolerance machinery exercised.
9. **Tail amplification.** 1 − 0.99^100 = 0.634 → "about 63 percent". On screen state both assumptions: calls are independent; the
   request waits for all calls.
10. **SLA example** (book's illustrative example): median < 200 ms and p99 < 1 s. Optional; label as an example.
11. **Throughput example** (book): 100,000 requests/s × 1 kB vs 3 requests/min × 2 GB → same ~100 MB/s throughput, very different systems.
12. **Database scaling rule of thumb**: "a long-standing rule of thumb was to keep your database on a single node — scale up — until
    cost or high-availability requirements force you to distribute it." Frame as rule of thumb, not law; tools are improving.
13. **Accidental complexity**: Moseley and Marks ("Out of the Tar Pit") — complexity that is not inherent in the problem the software
    solves (as seen by users) but arises only from the implementation.
14. **Maintenance cost**: "the majority of the cost of software is not in its initial development but in its ongoing maintenance"
    (qualitative; no percentage).
15. **Response time vs latency** (book's definitions): response time = what the client sees (service time + network delays + queueing
    delays). Latency = the duration a request is waiting to be handled ("latent").
16. **Random added latency sources** (book): context switch to a background process, loss of a network packet and TCP retransmission,
    a garbage-collection pause, a page fault forcing a read from disk, mechanical vibrations in the server rack.
17. **Head-of-line blocking**: a server can process only a small number of things in parallel (e.g., limited by CPU cores); a few slow
    requests hold up the processing of subsequent requests; so measure on the client side. Load generators must keep sending requests
    independently of response time.
18. **Percentile aggregation**: averaging percentiles is mathematically meaningless; add the histograms. Approximation algorithms:
    forward decay, t-digest, HdrHistogram.
19. **Remove team-specific content**: settlement runs, merchants, PostgreSQL, JPA, "Java team", GC logs prompts, Micrometer.
20. **Edition**: content follows the 1st edition (2017) of DDIA, Chapter 1. Next chapter = Chapter 2 "Data Models and Query Languages"
    (relational vs document vs graph; declarative query languages like SQL).
21. **Credits**: "Based on the presentation 'DDIA Session 1: Reliable, Scalable, Maintainable' (mahdiyar.me/blog/ddia-session-1) and on
    Designing Data-Intensive Applications by Martin Kleppmann (O'Reilly). Not affiliated with or endorsed by the author or publisher."
22. **Ending mapping**: stale data → Reliability (a guarantee the system promised — cache/index consistent with the database — is broken;
    the app team owns that guarantee); requests slowing down → Scalability/performance (load growth, tail latency); one small change
    takes days → Maintainability (accidental complexity; operability/evolvability).
