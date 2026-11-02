# LinkedIn post for a long-form chapter (Persian)

One post per **long-form** video, in **Persian**, on the user's personal profile (the user's choice, 2026-11-02). Shorts get no post.
It goes out after the video is Public. In an automatic run (auto.md) the production run writes the post and queues it, and the
morning LinkedIn job publishes it.

## The post (`<deliverables>/linkedin-post.md`)
Plain text, no Markdown (LinkedIn shows `**` and `#` headings literally). 900–1,500 characters. Shape:
1. **Hook line** (one sentence): the video's real-world problem, in Persian, the same stake as the video's first 20 seconds.
   Visible before "…see more", so no greeting, no "in this video".
2. A blank line, then 2–4 short paragraphs or `•` bullets: what the chapter answers, the one number or contrast people remember
   (with its label: "به عنوان نمونهٔ ساده‌شده", "توییتر، حدود ۲۰۱۲"), and one question the reader can ask about their own system.
3. `ویدیوی کامل (انگلیسی، ~۱۳ دقیقه): https://youtu.be/<id>` on its own line. Put the link only here, once; LinkedIn builds the
   preview card from it.
4. `اسلایدهای جلسه: https://mahdiyar.me/blog/ddia-session-N/` (and the second deck for a split chapter).
5. One line crediting the book: `بر اساس فصل N کتاب Designing Data-Intensive Applications نوشتهٔ Martin Kleppmann.`
6. 3–5 hashtags, Latin script: `#SystemDesign #DDIA #DistributedSystems #SoftwareEngineering`, plus one for the chapter's topic.

Write natural Persian, the way an engineer talks to colleagues (the Blog's register), not a translation of the YouTube description.
Technical terms stay in English where Persian engineers use them that way (replication, partition, B-tree), the first time with a
short Persian gloss if needed. Same accuracy rules as the video: only figures from `brief/accuracy-notes.md` / `data/numbers.md`,
with their labels. Use Persian digits in prose, Latin digits in URLs.

## Publishing (CDP, the same Chrome profile as YouTube Studio)
The user signs in to LinkedIn in that Chrome window once, themselves; never type a password. `scripts/linkedin.mjs` drives its own
LinkedIn tab in a separate window, so it does not disturb the Studio tab.
```bash
L="node ${CLAUDE_SKILL_DIR}/scripts/linkedin.mjs"
$L status                 # {"signedIn": true} — false: stop and report "sign in to LinkedIn in the CDP Chrome"
$L shot                   # → ~/.cache/ddia-video/auto/linkedin.png (Read it after every step)
```
1. Duplicate check: `$L goto https://www.linkedin.com/in/me/recent-activity/all/`, `shot`, and `eval` the visible post texts. If a
   post with the same YouTube link exists, do not post again; mark the queue item done.
2. `$L goto https://www.linkedin.com/feed/`, then open the composer: `click 'button.share-box-feed-entry__trigger'` (or eval-click
   the button whose text is "Start a post"; LinkedIn renames classes, so fall back to text and `shot` + `clickxy`).
3. `fill '.ql-editor[contenteditable=true]' @<linkedin-post.md>` (fallback selector: `div[role=textbox][contenteditable=true]`
   inside the dialog). Wait ~5 s for the link preview card, then `shot` and Read it: the whole text is there, line breaks kept, the
   YouTube preview card shows. A hashtag or mention dropdown left open: `key Escape` once, and check the dialog is still open.
4. Click Post: `click 'button.share-actions__primary-action'` (fallback: eval-click the dialog's enabled button with text "Post").
5. Verify: wait ~5 s, `goto` the recent-activity page, `shot`, and find the post by its YouTube link. Record the post's URL if the
   page shows it (`eval` for `a[href*="/feed/update/"]`), otherwise the time it went out.

If LinkedIn shows a security check, a "Verify it's you" page, or the composer fails three times, stop, leave the queue item pending,
and report it; the user finishes it by hand from `linkedin-post.md`.
