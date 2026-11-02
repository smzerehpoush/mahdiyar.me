# Notes for Claude

This repo is public, and pushing to `master` publishes the site. Only `public/` is served; `.claude/` is not, but anyone can read it on GitHub. Never put passwords, tokens, email addresses or anything private in it.

## Working state (shared by every machine)

The DDIA video series and its promotion keep their state in [.claude/handoff/](.claude/handoff/). Those files are the canonical copy: they replace local auto-memory for this work, so they reach every machine that pulls the repo.

- On a new machine, follow [.claude/handoff/README.md](.claude/handoff/README.md) once.
- At the start of DDIA work, read the to-do list [.claude/handoff/ddia-todo.md](.claude/handoff/ddia-todo.md) (Persian), then the notes below that fit the task.
- Update these files whenever the state changes, not only local memory. They sync only through git, so commit and push them when the user says so.

Notes in [.claude/handoff/memory/](.claude/handoff/memory/):
- [DDIA YouTube series](.claude/handoff/memory/ddia-youtube-series.md): Studio/CDP notes and progress. The published record is [series-log.md](.claude/skills/ddia-video/reference/series-log.md). Ch6 was published 2026-11-02 (n6lwcDeHCP8); Ch7 Part 1 is next.
- [DDIA LinkedIn posts](.claude/handoff/memory/ddia-linkedin-posts.md): posts go out Sat/Mon/Wed at 11:30 Tehran, and 10 are scheduled through Nov 25. Video posts go first and in order. Editing a scheduled post's text duplicates it. The state is in [posts-v2.md](.claude/handoff/linkedin/posts-v2.md) and the helpers are in [linkedin/tools/](.claude/handoff/linkedin/tools/).
- [DDIA TODO file](.claude/handoff/memory/ddia-todo-file.md): how to keep the one to-do list.
- [DDIA YouTube growth](.claude/handoff/memory/ddia-youtube-growth.md): the 2026-10-25 analytics baseline (browse CTR ~1%) and how to read Studio analytics. Re-check around 2026-11-08.
- [YouTube channel scope](.claude/handoff/memory/youtube-channel-scope.md): the channel covers technical and management content, and DDIA is one series. Draft channel copy for approval.
- [Narration tone + character](.claude/handoff/memory/narration-tone-character.md): a warm, paced script (am_michael ×1.05) and the robot narrator bottom-right, from Ch5 Part 2 on.
- [Telegram stories](.claude/handoff/memory/telegram-stories.md): DDIA Shorts as daily 18:30 stories. The kit is in iCloud Drive and the user posts them from their phone.
- [Push when needed](.claude/handoff/memory/push-when-needed.md): send a PushNotification whenever the user's input is needed.
- [HTML pages stay local](.claude/handoff/memory/html-pages-local.md): build HTML as local files and open them; don't publish artifacts unless asked.

## Standing rules

- Never commit or push without asking. Leave unrelated working-tree changes alone.
- No cloud sessions; everything runs locally.
- The user signs in to Google, LinkedIn and Telegram themselves. Never ask for or type a password, and never send their email address anywhere.
- YouTube: confirm right before making a video Public. Never delete, re-render or replace a published video without a yes.
- LinkedIn: posting and scheduling need the user's explicit approval of the text and the time. Click "Schedule", never "Post". Don't touch published posts, never abbreviate the book title, and never accept the cookie banner.
- Don't automate the user's personal Telegram account. Tick Telegram and Reddit items only after the user says they posted them.
- Ask before downloading files. Run multi-agent workflows only when the user opts in.
- Persian text for the user follows the persian-writing skill (install it per the handoff README).
