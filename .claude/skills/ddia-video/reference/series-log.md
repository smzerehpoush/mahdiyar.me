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

## Published
| Session | Format | Title | Link | Date |
|---|---|---|---|---|
| 1 | long (13 min) | Designing Data-Intensive Applications, Chapter 1: Reliable, Scalable, Maintainable | https://youtu.be/uCm4lbSYg2Y | 2026-10-21 |
| 1 | Short | How 1% Slow Calls Become 63% Slow Requests | https://youtube.com/shorts/dNdS39XkMqA | before 2026-10-21 |
| 1 | Short | How Twitter Built Your Timeline: Fan-Out Explained #Shorts | https://youtube.com/shorts/unP7OnG847Y | 2026-10-21 |
| 2 | long (13:45) | Designing Data-Intensive Applications, Chapter 2: Data Models and Query Languages | https://youtu.be/b-rJ8lzuEZY | 2026-10-21 |
| 2 | Short | "Schemaless" Is a Myth: Schema-on-Read vs Schema-on-Write #Shorts | https://youtube.com/shorts/ho0yWHSOxXk | 2026-10-21 |
| 3 | long (13:48) | Designing Data-Intensive Applications, Chapter 3, Part 1: Storage Engines | https://youtu.be/Pontu125KTo | 2026-10-21 |

All of these are Public. The three long-form titles were renamed to the book-first format on 2026-10-23 (they were
"<Topic>: Designing Data-Intensive Applications, Chapter N Explained"). The long-form videos are in the playlist in chapter order, each with an English SRT.

## Series decisions
- **Chapter 3 is two videos, one per deck** (the user's choice, 2026-10-21). Session 3 is Part 1 (published), and it ends by previewing
  "Chapter 3, part 2". Session 4, "Analytics and column storage", is **Part 2**: a separate video, not started yet. Don't merge it into
  Part 1 and don't add `deck2`.
- It is not yet decided whether the other split chapters (sessions 6+7, 9+10, 12+13, 15+16) get one video or two. Ask the user when
  one comes up.
- A Short's `relatedVideo` is its chapter's long-form URL from the table above.

## Pending Studio edits (local, once the channel allows them)
- Custom thumbnails, refused because of the daily limit (expect about one per day on this channel). The files are on the user's Mac:
  - b-rJ8lzuEZY ← `~/Movies/DDIA-Session-2-Video/thumbnail.jpg`
  - ho0yWHSOxXk ← `~/Movies/DDIA-Session-2-Video/Short/thumbnail.jpg`
  - Pontu125KTo ← `~/Movies/DDIA-Session-3-Video/thumbnail.jpg`
- Related-video links, refused with "once you have more history":
  - unP7OnG847Y and dNdS39XkMqA → uCm4lbSYg2Y
  - ho0yWHSOxXk → b-rJ8lzuEZY
- Description links aren't clickable until the channel completes YouTube's one-time verification. This doesn't block publishing.
- Chapters: on 2026-10-23 the player showed no chapter segments on uCm4lbSYg2Y and Pontu125KTo, and the page data had no
  `multiMarkersPlayerBarRenderer`. The description timestamps are valid and render as clickable links. Cause unknown; check again later.
