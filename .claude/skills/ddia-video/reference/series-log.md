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

All of these are Public, except the three scheduled Shorts, which stay Private until their scheduled time and then turn Public on
their own. The three long-form titles were renamed to the book-first format on 2026-10-23 (they were
"<Topic>: Designing Data-Intensive Applications, Chapter N Explained"). The long-form videos are in the playlist in chapter order, each with an English SRT.
Chapter 3 Part 2 was the first video made in a cloud session (branch `claude/relaxed-goldberg-ryp57l`) and published locally; it got
its custom thumbnail on upload.
Chapter 4 (Session 5) is the first video with the male `am_michael` voice. It was made locally and got its custom thumbnail on upload.
Chapter 5 Part 1 (Session 6) was made locally and got its custom thumbnail on upload. Its end screen uses "Best for viewer" until
Part 2 is published.
On 2026-10-25 the Chapter 1, 2 and 3 Part 1 long-form videos got redesigned thumbnails (v2), whose big words name the hook's problem
rather than the book's terms. Each v1 is kept beside it as `thumbnail.v1.*` (and `stage/thumbnail.v1.html`). The Session 3, 4 and 5
Shorts were made the same day, all with `am_michael`.

## Series decisions
- **Chapter 3 is two videos, one per deck** (the user's choice, 2026-10-21). Session 3 is Part 1 (published), and it ends by previewing
  "Chapter 3, part 2". Session 4, "Analytics and column storage", is **Part 2** (published 2026-10-23), a separate video that ends
  by previewing Chapter 4.
- **Chapter 5 is two videos as well** (the user's choice, 2026-10-25): Session 6 is Part 1 (leaders and followers, replication lag)
  and ends by previewing "Chapter 5, part 2"; Session 7 is Part 2 (multi-leader, leaderless). It is not yet decided whether the other
  split chapters (sessions 9+10, 12+13, 15+16) get one video or two. Ask the user when one comes up.
- A Short's `relatedVideo` is its chapter's long-form URL from the table above.
- **Narration voice: male, Kokoro `am_michael`, from Session 5 on** (the user's choice, 2026-10-24). This includes new Shorts for
  earlier chapters. Sessions 1–4 in the Published table used `af_heart` (female). am_michael speaks about 9% slower, so the
  word budgets went down: long-form 1,550–1,850, Shorts 110–140 (script-format.md).

## Pending Studio edits (local, once the channel allows them)
- Custom thumbnails, refused because of the daily limit. The limit varies: about one per day earlier, while on 2026-10-25 five went
  through before the sixth was refused. None are pending: 0jGFILQlCmg and ho0yWHSOxXk got theirs on 2026-10-27, the same day
  56fysYohb4k got its thumbnail on upload.
- Related-video links, refused with "once you have more history":
  - unP7OnG847Y and dNdS39XkMqA → uCm4lbSYg2Y
  - ho0yWHSOxXk → b-rJ8lzuEZY
  - jQFb9xyO2hk → Pontu125KTo
  - UEuhuITwccI → Dbgfqu1neps
  - 0jGFILQlCmg → gavQQVU2d1w
- End screen: when Chapter 5, Part 2 is published, point 56fysYohb4k's end-screen video element at it (it uses "Best for viewer"
  now). gavQQVU2d1w (Chapter 4) has pointed at 56fysYohb4k since 2026-10-27.
- Description links aren't clickable until the channel has Advanced features. The phone is already verified (Intermediate is
  enabled); on 2026-10-25 Advanced was "Eligible", missing only "Channel history", which YouTube grants over time. This doesn't
  block publishing.
- Chapters: on 2026-10-23 the player showed no chapter segments on uCm4lbSYg2Y and Pontu125KTo, and the page data had no
  `multiMarkersPlayerBarRenderer`. The description timestamps are valid and render as clickable links. Cause unknown; check again later.
