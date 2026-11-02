# Handoff: DDIA work on any machine

This folder holds the working state that used to live only on the first Mac (local auto-memory, `~/Downloads`). It is the
canonical copy. The repo-root `CLAUDE.md` indexes it, so a session on any machine that has pulled the repo sees it.

| Path | What |
|---|---|
| `ddia-todo.md` | The one to-do list (Persian). Read it first. |
| `memory/` | Project notes: series progress, Studio/CDP gotchas, LinkedIn rules, analytics baseline, narration, Telegram kit. |
| `linkedin/posts-v2.md` | LinkedIn chapter posts and the current Scheduled queue. |
| `linkedin/youtube-video-posts.md` | LinkedIn posts for the YouTube videos (the trimmed versions are what was scheduled). |
| `linkedin/tools/` | CDP helpers for LinkedIn's scheduler: `li2.mjs` (find/click/type/eval), `list.sh` (print the queue), `move.sh` (one date-only reschedule). |
| `promo/english-community-posts.md` | Reddit drafts the user posts from their own account. |

Left out on purpose:
- Video work folders and deliverables (`~/Movies/DDIA-Session-N-Video/`, about 6.5 GB). They exist only on the first Mac and are
  needed only to re-render or re-export a published video. A new video is scaffolded fresh by the skill.
- The LinkedIn post videos (`~/Downloads/ddia-linkedin/**/*.mp4`) and the stale `posts.md`. Every chapter post is already scheduled with its video.
- The Telegram stories kit: it is in iCloud Drive (`Telegram Stories - DDIA Shorts`). Any Mac on the same Apple ID has it.
- Sign-ins: the CDP Chrome profile (`~/.cache/ddia-video/yt-profile`) stays on each machine.
- Personal notes unrelated to this repo.

## One-time setup on a new machine

1. Clone or pull the repo and open Claude Code in it.
2. Install the tools.
   - macOS: Google Chrome, plus `brew install node ffmpeg whisper-cpp`.
   - Linux: `bash .claude/skills/ddia-video/scripts/cloud-setup.sh`.
   - Windows: not supported by the scripts. Use WSL2 with the Linux route.
3. Run `node .claude/skills/ddia-video/scripts/setup.mjs --prefetch-tts`. It installs the shared node_modules and downloads the
   Kokoro and whisper models into `~/.cache/ddia-video`, so ask the user before running it.
4. Install the Persian writing skill (MIT, public), with the user's OK:
   `git clone https://github.com/ali2000hos/persian-writing ~/.claude/skills/persian-writing`
5. Start the CDP Chrome as `.claude/skills/ddia-video/reference/youtube-upload.md` describes (port 9333). The user signs in to YouTube
   Studio and LinkedIn there themselves. The LinkedIn helpers drive the tab whose URL contains `linkedin.com`.
6. Optional: if old habits point at `~/Downloads`, link the files back, as on the first Mac:
   `ln -s "$PWD/.claude/handoff/ddia-todo.md" ~/Downloads/ddia-todo.md`

## Rules for working across machines

- Work on one machine at a time. Before switching, commit and push this folder (and `series-log.md`) with the user's OK. On the
  other machine, `git pull` before touching anything.
- Write new project notes into `memory/` here and add a line to the index in `CLAUDE.md`. Local auto-memory stays on its machine.
- The repo is public. Notes stay factual and impersonal: no passwords, tokens, email addresses, or private details.
- The `move.sh` and `list.sh` regexes match "2026" dates. Update them when the queue reaches 2027.
