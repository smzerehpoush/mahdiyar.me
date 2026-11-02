# LinkedIn post for a long-form video (Persian)

The user's LinkedIn routine is the canonical one: `.claude/handoff/memory/ddia-linkedin-posts.md` (rules, cadence, LinkedIn gotchas),
`.claude/handoff/linkedin/posts-v2.md` (the Scheduled queue), `.claude/handoff/linkedin/youtube-video-posts.md` (video-post texts) and
the helpers in `.claude/handoff/linkedin/tools/` (`li2.mjs`, `list.sh`, `move.sh`). Read the memory note before touching LinkedIn.
In short:
- Posts go out **Sat / Mon / Wed at 11:30 Tehran**, one a day. Video posts count as slots.
- Video posts go first and in video order: a new one takes the slot right after the last video post, and every chapter post behind
  it moves back one slot (date-only moves with `move.sh`, last post first).
- **Schedule, never Post.** Video posts need no approval (the user, 2026-11-03; repo-root CLAUDE.md → the automatic-run exception).
- Never abbreviate the book title. Don't touch published posts. Never accept the cookie banner.

## The text (trimmed video-post format, the user's own)
Write it to `<deliverables>/linkedin-post.md` and append it to `youtube-video-posts.md` under
`## نسخه‌ی کوتاه‌شده (پیش‌نویس): قسمت N (فصل C[، پارت K])`. Copy the shape of the last entries there exactly:
```
قسمت <N به حروف> ویدیو Designing Data-Intensive Applications هم آماده شد 🎬
ویدیو با <the hook scenario, 1–3 sentences, colloquial Persian>.

<the tension as a question, its own paragraph>

اگه <who it is for: a situation in the reader's own code or system>، این قسمت به کارتون میاد. اگه دیدید، بگید کدوم بخشش براتون جالب‌تر بود.

https://youtu.be/<id>
```
`N` is the video's episode number on the channel (long-form videos in publish order: Session 9 = قسمت نهم). Colloquial register
("می‌شه"، "دیتابیس"، "کد")، same as the earlier posts; figures only from `brief/accuracy-notes.md`.

## Scheduling
From `.claude/handoff/linkedin/tools/`, with the LinkedIn tab open in the CDP Chrome (`scripts/linkedin.mjs status` opens one):
1. `zsh list.sh` twice (the list renders stale) and compare with `posts-v2.md`.
2. Move the chapter posts behind the new slot back one slot each, last first:
   `zsh move.sh '<Posting header>' 'M/D/YYYY' '<expected "Posting at …" text>'`. It stops on any mismatch; fix and rerun only that move.
3. Compose the new post in the composer (real keystrokes, read back and diff against the approved text), set the slot's date and
   11:30 AM from the composer's clock, check the link-preview card in the DOM, click **Schedule**.
4. `list.sh` again: the count is one higher and the order is right. Update the state at the top of `posts-v2.md`,
   `youtube-video-posts.md` (draft → scheduled with its date) and the memory note's queue line.
If LinkedIn shows a security check or "Something went wrong" three times, stop and report; never click "Post".
