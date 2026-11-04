# Series log: what is published and what was decided

This is the shared record of the series. Cloud sessions can't see local Claude memory, so they rely on this file. Read it before starting
a video. Update it after publishing (SKILL.md §9), and commit it to `master` with the user's OK so the next cloud session sees it.

## Channel
- Playlist: "Designing Data-Intensive Applications, Chapter by Chapter" (Public, sorted oldest first, Studio id `PLNjspVT8HId8`).
  It holds long-form chapter explainers only. Shorts stay out.
- Long-form title: `Designing Data-Intensive Applications, Chapter N: <Topic>`, book first (the user's choice, 2026-10-23). A
  chapter split into two videos: `Designing Data-Intensive Applications, Chapter N, Part K: <Topic>`. N is the book chapter, not an
  episode count. From Ch. 3 Part 2 on, `<Topic>` names the problem or payoff ("Why Analytics Uses Columns"), not the chapter's
  textbook name. The book name stays first (the user's choice, kept after YouTube's analytics suggested problem-first titles).
  Shorts keep hook-style titles.
- YouTube's analytics advice (2026-10-23) is folded into series-standards.md: in the first ~20 s, a real-world problem and the
  payoff; the thumbnail's big words name the problem; the long-form video gets the day's custom thumbnail first.
- Upload defaults (audience, category, language, AI/paid-promotion answers, captions, thumbnails) are in series-standards.md and
  youtube-upload.md.
- The channel is for technical and management content; DDIA is one series on it, not the channel's identity (the user's choice,
  2026-10-25). Channel-level copy (description, banner, Home layout) must not read as DDIA-only, and the user approves it before it
  is saved. No channel trailer yet.
- Home tab (2026-10-25): Videos → the DDIA playlist (Play all) → Shorts → Playlists. Channel description set the same day.
- End screens (2026-10-25): every long-form video ends with a video element (the next chapter) plus Subscribe, both in the right half,
  because the "Next" scene's credits card fills the left. When a new chapter is published, point the previous chapter's video element
  at it; the newest chapter uses "Best for viewer" until then.

## Published
| Session | Format | Title | Link | Date |
|---|---|---|---|---|
| 1 | long (13 min) | Designing Data-Intensive Applications, Chapter 1: Reliable, Scalable, Maintainable | https://youtu.be/uCm4lbSYg2Y | 2026-10-21 |
| 1 | Short | How 1% Slow Calls Become 63% Slow Requests | https://youtube.com/shorts/dNdS39XkMqA | before 2026-10-21 |
| 1 | Short | How Twitter Built Your Timeline: Fan-Out Explained #Shorts | https://youtube.com/shorts/unP7OnG847Y | 2026-10-21 |
| 2 | long (13:45) | Designing Data-Intensive Applications, Chapter 2: Data Models and Query Languages | https://youtu.be/b-rJ8lzuEZY | 2026-10-21 |
| 2 | Short | "Schemaless" Is a Myth: Schema-on-Read vs Schema-on-Write #Shorts | https://youtube.com/shorts/ho0yWHSOxXk | 2026-10-21 |
| 3 | long (13:48) | Designing Data-Intensive Applications, Chapter 3, Part 1: Storage Engines | https://youtu.be/Pontu125KTo | 2026-10-21 |
| 4 | long (12:50) | Designing Data-Intensive Applications, Chapter 3, Part 2: Why Analytics Uses Columns | https://youtu.be/Dbgfqu1neps | 2026-10-23 |
| 5 | long (13:52) | Designing Data-Intensive Applications, Chapter 4: Changing Data Without Breaking Old Code | https://youtu.be/gavQQVU2d1w | 2026-10-25 |
| 3 | Short (0:57) | Why Deleting Data Can Make a Database Bigger #Shorts | https://youtube.com/shorts/jQFb9xyO2hk | scheduled 2026-10-26 18:30 Tehran |
| 4 | Short (0:55) | Why Analytics Databases Read Columns, Not Rows #Shorts | https://youtube.com/shorts/UEuhuITwccI | scheduled 2026-10-27 18:30 Tehran |
| 5 | Short (0:56) | How a Rolling Deploy Can Silently Delete Data #Shorts | https://youtube.com/shorts/0jGFILQlCmg | scheduled 2026-10-28 18:30 Tehran |
| 6 | long (13:52) | Designing Data-Intensive Applications, Chapter 5, Part 1: When Replicas Fall Behind | https://youtu.be/56fysYohb4k | 2026-10-27 |
| 6 | Short (0:56) | How a Database Failover Showed Users Someone Else's Data #Shorts | https://youtube.com/shorts/wLJqdGGSv4o | scheduled 2026-10-31 18:30 Tehran |
| 7 | long (13:39) | Designing Data-Intensive Applications, Chapter 5, Part 2: When Two Writes Collide | https://youtu.be/v7VNukkS3bA | 2026-11-01 |
| 7 | Short (0:56) | Both Phones Said "Added." Then the Tea Vanished. #Shorts | https://youtube.com/shorts/wNt6U4lsYg8 | scheduled 2026-11-04 18:30 Tehran |
| 8 | long (13:22) | Designing Data-Intensive Applications, Chapter 6: Why Adding One Server Moved 91% of the Data | https://youtu.be/n6lwcDeHCP8 | 2026-11-02 |
| 9 | long (13:54) | Designing Data-Intensive Applications, Chapter 7, Part 1: The Races Your Database Lets Through | https://youtu.be/jm2QdtYKAdY | 2026-11-02 |
| 8 | Short (0:58) | Add One Server, Move 91% of the Data: Never Use Hash Mod N #Shorts | https://youtube.com/shorts/za3mF_n4X-Q | scheduled 2026-11-05 18:30 Tehran |
| 9 | Short (0:55) | Both Doctors Checked the Rule. Nobody Was On Call. #Shorts | https://youtube.com/shorts/A3Eu-DooYDc | scheduled 2026-11-06 18:30 Tehran |
| 10 | long (13:50) | Designing Data-Intensive Applications, Chapter 7, Part 2: What Serializable Really Costs | https://youtu.be/hVbc2H4pfT8 | 2026-11-03 |
| 10 | Short (0:59) | One Thread, No Locks, No Races: Why Some Databases Do It #Shorts | https://youtube.com/shorts/1oawD9yt6ss | scheduled 2026-11-07 18:30 Tehran |
| 11 | long (13:44) | Designing Data-Intensive Applications, Chapter 8: No Reply, Wrong Clock, Frozen Process | https://youtu.be/z-4wlzzo9xw | 2026-11-04 |
| 11 | Short (0:45) | No Reply From the Server? It Could Mean Six Things #Shorts | https://youtube.com/shorts/fAEHRojGeLg | scheduled 2026-11-08 18:30 Tehran |

All of these are Public. The scheduled Shorts stay Private until their scheduled time and then turn Public on their own. The
three long-form titles were renamed to the book-first format on 2026-10-23 (they were
"<Topic>: Designing Data-Intensive Applications, Chapter N Explained"). The long-form videos are in the playlist in chapter order, each with an English SRT.
Chapter 3 Part 2 was the first video made in a cloud session (branch `claude/relaxed-goldberg-ryp57l`) and published locally; it got
its custom thumbnail on upload.
Chapter 4 (Session 5) is the first video with the male `am_michael` voice. It was made locally and got its custom thumbnail on upload.
Chapter 5 Part 1 (Session 6) was made locally and got its custom thumbnail on upload. Its end-screen video element has pointed at
Part 2 since 2026-11-01.
Chapter 5 Part 2 (Session 7) is the first video with the warmer script style and the robot narrator (Series decisions below). It
got its custom thumbnail on upload, and its end screen (Subscribe + "Best for viewer") was imported from Part 1.
The Session 7 Short (last write wins, told with Part 2's shopping-list hook and the same timestamps) was made locally on 2026-11-01
and got its custom thumbnail on upload; related-video linking was still refused that day.
Chapter 6 (Session 8, partitioning) was made locally on 2026-11-01/02 with the warm script and the robot narrator. Its hook is
the app's own hash mod N placement (adding an 11th server moves 100 of 110 example keys, about 91%), resolved in the callback by
1,000 fixed partitions (about 9%). It got its custom thumbnail on upload, and its end screen (Subscribe + "Best for viewer") was
imported from Chapter 5, Part 2.
Chapter 7 Part 1 (Session 9, transactions: ACID, weak isolation, lost updates, write skew) was the first video made by the automatic
run (reference/auto.md) on 2026-11-02. Its hook is a simplified lost update (two +10 fees on a balance of 100 leave 110, not 120),
resolved in the callback by `SET balance = balance + 10`. It got its custom thumbnail on upload, and its end screen (Subscribe +
"Best for viewer") was imported from Chapter 6.
The Session 8 Short (hash mod N: 10 → 11 servers moves 100 of 110 keys; 1,000 fixed partitions move about 9%) and the Session 9 Short
(write skew, the book's on-call doctors) were made by the same automatic run on 2026-11-02, with custom thumbnails on upload;
related-video linking was still refused.
Chapter 7 Part 2 (Session 10, serializability: actual serial execution, two-phase locking, SSI) was made by the automatic run on
2026-11-03. Its hook is the book's room-123 booking: a double booking (write skew), fixed with SERIALIZABLE, after which PostgreSQL
throws "could not serialize access" (40001); the callback shows that error is SSI catching the double booking, and the retry.
Its custom thumbnail was refused (daily limit), so it went Public with the auto frame; its end screen (Subscribe + "Best for
viewer") was imported from Chapter 7, Part 1, and jm2QdtYKAdY's video element now points at it. The Session 10 Short (actual serial
execution: one thread, no locks, no races) was made the same run; its thumbnail and related-video link were both refused.
Chapter 8 (Session 11, the trouble with distributed systems: unreliable networks, clocks and process pauses, truth by majority and
fencing tokens) was made by the automatic run on 2026-11-04. Its hook is the book's broken distributed lock (a worker freezes in a GC
pause, its lease expires, a second worker writes, then both write and the file is corrupted), resolved in the callback by fencing
tokens 33 and 34. It got its custom thumbnail on upload, its end screen (Subscribe + "Best for viewer") was imported from Chapter 7,
Part 2, and hVbc2H4pfT8's video element now points at it. The Session 11 Short (no reply can mean six things; a timeout can't tell
which, so retries must be safe to repeat) was made the same run, with its custom cover on upload; related-video linking was still
refused. The same run added the two thumbnails pending from 2026-11-03 (hVbc2H4pfT8 and 1oawD9yt6ss).
The Session 6 Short (the GitHub 2012 failover, as described in the book) was made locally on 2026-10-30. The channel still could
not link a Short to a related video that day ("Build your channel history"), so it relies on the description's "Full video:" line.
On 2026-10-25 the Chapter 1, 2 and 3 Part 1 long-form videos got redesigned thumbnails (v2), whose big words name the hook's problem
rather than the book's terms. Each v1 is kept beside it as `thumbnail.v1.*` (and `stage/thumbnail.v1.html`). The Session 3, 4 and 5
Shorts were made the same day, all with `am_michael`.

## Series decisions
- **Chapter 3 is two videos, one per deck** (the user's choice, 2026-10-21). Session 3 is Part 1 (published), and it ends by previewing
  "Chapter 3, part 2". Session 4, "Analytics and column storage", is **Part 2** (published 2026-10-23), a separate video that ends
  by previewing Chapter 4.
- **Chapter 5 is two videos as well** (the user's choice, 2026-10-25): Session 6 is Part 1 (leaders and followers, replication lag)
  and ends by previewing "Chapter 5, part 2"; Session 7 is Part 2 (multi-leader, leaderless).
- **Chapter 7 is two videos too** (the user's choice, 2026-11-01): Session 9 is Part 1 and Session 10 is Part 2, one per deck. It is
  not yet decided whether the other split chapters (sessions 12+13, 15+16) get one video or two. Ask the user when one comes up.
- A Short's `relatedVideo` is its chapter's long-form URL from the table above.
- **Narration voice: male, Kokoro `am_michael`, from Session 5 on** (the user's choice, 2026-10-24). This includes new Shorts for
  earlier chapters. Sessions 1–4 in the Published table used `af_heart` (female). am_michael speaks about 9% slower, so the
  word budgets went down: long-form 1,550–1,850, Shorts 110–140 (script-format.md).
- **Warmer narration and a robot narrator, long-form from Session 7 on** (the user's choice, 2026-10-31, after finding the
  narration too dry): warm script with short sentences and sentence-level pauses, `am_michael` at speed 1.05 (long-form budget
  1,600–1,950 words), and the robot in the bottom-right corner, gone for the last 20 s (series-standards.md, pipeline.md →
  Narrator robot). Published videos stay as they are; Shorts have no narrator for now.

## Pending Studio edits (local, once the channel allows them)
- Custom thumbnails, refused because of the daily limit. The limit varies: about one per day earlier, while on 2026-10-25 five went
  through before the sixth was refused. On 2026-11-04 four went through (two pending ones, then Chapter 8 and its Short). **None pending.**
- Related-video links, refused with "once you have more history":
  - unP7OnG847Y and dNdS39XkMqA → uCm4lbSYg2Y
  - ho0yWHSOxXk → b-rJ8lzuEZY
  - jQFb9xyO2hk → Pontu125KTo
  - UEuhuITwccI → Dbgfqu1neps
  - 0jGFILQlCmg → gavQQVU2d1w
  - wLJqdGGSv4o → 56fysYohb4k
  - wNt6U4lsYg8 → v7VNukkS3bA
  - za3mF_n4X-Q → n6lwcDeHCP8
  - A3Eu-DooYDc → jm2QdtYKAdY
  - 1oawD9yt6ss → hVbc2H4pfT8
  - fAEHRojGeLg → z-4wlzzo9xw
- End screen: when Chapter 9 is published, point z-4wlzzo9xw's end-screen video element at it (it uses "Best for viewer" now).
  hVbc2H4pfT8 (Chapter 7, Part 2) has pointed at z-4wlzzo9xw since 2026-11-04, jm2QdtYKAdY (Chapter 7, Part 1) has pointed at hVbc2H4pfT8 since 2026-11-03, n6lwcDeHCP8 (Chapter 6) at jm2QdtYKAdY since 2026-11-02,
  v7VNukkS3bA (Chapter 5, Part 2) at n6lwcDeHCP8 since 2026-11-02, 56fysYohb4k (Chapter 5, Part 1) at v7VNukkS3bA since 2026-11-01, and
  gavQQVU2d1w (Chapter 4) at 56fysYohb4k since 2026-10-27.
- Description links aren't clickable until the channel has Advanced features. The phone is already verified (Intermediate is
  enabled); on 2026-10-25 Advanced was "Eligible", missing only "Channel history", which YouTube grants over time. This doesn't
  block publishing.
- Chapters: on 2026-10-23 the player showed no chapter segments on uCm4lbSYg2Y and Pontu125KTo, and the page data had no
  `multiMarkersPlayerBarRenderer`. The description timestamps are valid and render as clickable links. Cause unknown; check again later.
