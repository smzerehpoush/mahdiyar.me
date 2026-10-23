# Video brief (from the user, verbatim requirements condensed)

Create a complete English-language educational YouTube video based on the blog presentation
"DDIA Session 1: Reliable, Scalable, Maintainable" (source deck: public/blog/ddia-session-1/index.html in the blog repo,
public URL https://mahdiyar.me/blog/ddia-session-1/), covering Chapter 1 of *Designing Data-Intensive Applications* by Martin Kleppmann
(1st edition, O'Reilly, 2017 — Chapter 1 "Reliable, Scalable, and Maintainable Applications").

## Goal
Help software engineers understand what makes a data-intensive application reliable, scalable, and maintainable. Teach with clear
explanations, practical examples, and animated diagrams. Adapt the presentation into a coherent story instead of reading slides aloud.

## Audience and format
- Junior to mid-level software engineers familiar with basic databases and web applications.
- ~12–14 minutes. 16:9, 1080p. English narration, captions, diagrams, on-screen text. No presenter avatar.

## Narration
Natural, clear, conversational teaching style, moderate pace. An experienced engineer explaining ideas to a colleague. No hype, no
robotic delivery, no unnecessary jargon. Explain unfamiliar terms before relying on them.

## Opening hook (use this scenario)
"Your database is running. Your servers are online. But users are seeing stale data, requests are slowing down, and one small change
takes days to ship. Is your system actually working well?"
Then introduce the three questions that structure the video:
1. Does the system keep working when components go wrong?
2. Can it handle growth?
3. Can people understand, operate, and change it over time?

## Content structure (all required)
1. What makes an application data-intensive? Amount of data, its complexity, how quickly it changes. Databases, caches, search indexes,
   streams, batch processing. Animate an architecture: application, primary database, cache, search index, background workers.
   Connecting these tools makes the application team responsible for system-level guarantees (e.g. keeping cached and indexed data
   consistent with the primary database).
2. Reliability: faults do not have to become failures. Fault = a component deviates from its expected behavior. Failure = the overall
   system stops providing the service users expect. Animate a DB replica going down while requests continue through another replica;
   then show the same fault causing a user-visible failure without fault tolerance. Cover hardware faults; systematic software faults that
   hit many machines at once; human errors (esp. configuration/operational mistakes). Explain why redundancy alone cannot protect against
   every software bug. Introduce deliberate fault injection and Chaos Monkey. Mention testing, gradual rollouts, fast rollback, monitoring,
   safe operational tools. Disk example: 10,000 disks, assumed MTTF ~30 years per disk → about one disk failure per day. Present as a
   simplified illustration, not a prediction for a specific fleet.
3. Scalability: growth in which dimension? "Scalable" is not yes/no. Identify load parameters: requests/sec, read/write ratio, concurrent
   users, cache hit rate, skew. Historical Twitter example, explicitly labeled "Twitter, circa 2012". Compare fan-out on read (assemble
   timeline when requested) vs fan-out on write (place tweet into followers' cached timelines when posted). Show write amplification:
   ~4,600 tweets/sec × 75 followers ≈ 345,000 timeline insertions/sec. Then a celebrity with 30 million followers; animate how this
   outlier changes the problem. Hybrid: precompute timelines for most users, merge very-high-follower accounts at read time. Emphasize
   the distribution of followers matters, not just an average rate.
4. Performance: why averages hide bad experiences. Response time as a distribution; histogram with mostly fast requests and a few very
   slow ones. Define p50, p95, p99 in plain language. Show a few long pauses leaving the median nearly unchanged while making p99 much
   worse. Tail latency amplification: request waits for all 100 independent backend calls, each 1% chance slow →
   1 − 0.99^100 ≈ 63%. State the independence assumption and the wait-for-all requirement. Measure what the client experiences,
   including queueing and network delays. Percentiles must not be averaged across servers or time windows; combine compatible
   distributions/histograms first, then compute the percentile.
5. Scaling strategies: scale up vs scale out (simple diagram). Stateless services are easier to distribute than stateful databases.
   Architecture depends on workload characteristics; distributed systems are not the automatic next step for every product.
6. Maintainability: software has a long life after launch. Operability (easy to monitor and run), Simplicity (reduce accidental
   complexity, understandable behavior), Evolvability (future changes easier). A brief practical example for each. Accidental complexity
   = complexity introduced by implementation choices rather than required by the problem. Good abstractions, e.g. SQL hiding storage
   details.

## Ending
Return to the opening scenario and connect each symptom to one of the three pillars. End with three questions:
- Which faults can we tolerate without users noticing?
- Which load parameter would force us to rethink our architecture?
- What makes our system unnecessarily difficult to operate or change?
Briefly preview the next chapter: data models and query languages.

## Visual direction
Clean technical motion graphics, readable typography, consistent visual language, a distinct accent color per pillar. Diagrams build
progressively in sync with narration. Arrows, queues, timelines, request flows, simple charts showing cause and effect. Concise on-screen
text, never paragraphs of narration. Give viewers time to understand each diagram. No stock footage, decorative code, fake dashboards,
or unrelated visuals. Subtle transitions; background music (if any) quiet beneath the voice.

## Accuracy and source handling
- Use the deck as the main source; preserve its concepts while writing an ORIGINAL explanation.
- Treat speaker notes as teaching context. Convert interactive labs into narrated visual demonstrations.
- Replace team-specific discussion prompts (settlement runs, merchants, PostgreSQL, JPA, Java GC logs) with general questions.
- Clearly label historical examples and illustrative assumptions. Do not present historical Twitter figures or Amazon anecdotes as
  current measurements. Omit numerical claims that cannot be accurately qualified.
- Do not reproduce book pages or imply official affiliation with the author or publisher. Include a brief source credit for the blog
  presentation and the book.
