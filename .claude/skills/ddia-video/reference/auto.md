# Automatic run (`/ddia-video auto`)

The user's choice (2026-11-02): the series runs by itself on the Mac, one chapter a day, fully automatic: produce the long-form video
and its Short and publish them to YouTube with no questions; then schedule the LinkedIn post, all with no questions. `scripts/auto/run.sh` (started by launchd every night,
see "Machine setup" below) runs `claude -p "/ddia-video auto …"` headless. Nobody is watching, so nobody can answer. This file says
what replaces each place where SKILL.md would ask or wait. Everything else in SKILL.md and its references still holds (accuracy,
every QA gate, looking at the images yourself).

## What one run makes
The prompt carries the plan from `node scripts/auto/next.mjs`: `long` (the next session with no long-form in series-log.md) and
`shorts` (that session's Short, plus at most one backlog Short for a published long-form without one). Do them in this order:
1. the long-form video for `long`, through §9;
2. its LinkedIn post, written and queued for the morning job (below);
3. each Short in `shorts`, in order, through §9.
If a step fails for good (see "Stop conditions"), skip what depends on it and go on with the rest: a failed long-form still lets a
backlog Short run, but not the same session's Short (its `relatedVideo` would be missing).

## Decisions that would otherwise be asked
- **Workflows**: the user opted in for automatic runs. Run the script and scenes workflows directly, without announcing agent counts.
- **Split chapters** (sessions 12+13, 15+16): two videos, one per deck, like Chapters 3, 5 and 7. Each deck is its own session.
- **Outline**: don't stop to show it. Write it into the run report.
- **Script disputes**: settle every one yourself. When the book or the deck settles it, follow them. When it's a judgment call, apply a
  reviewer's *must* about accuracy or clarity, and otherwise keep the head writer's text. List each decision in the report.
- **Short topic**: the chapter's most memorable example with a number or a contrast (shorts.md), not a topic already on the channel.
- **Publish**: long-form goes **Public** at once, in the playlist, with the end screen imported from the previous chapter (Subscribe +
  "Best for viewer"), and the previous chapter's end-screen video element repointed at it (youtube-upload.md → End screen).
  A Short is **scheduled** for 18:30 Tehran time on the first day after `lastShortDate` (from next.mjs) and after today that has no
  Short yet. With two Shorts in one run, they get consecutive days.
- **Custom thumbnail refused** (daily limit): publish anyway with the auto frame, and record the thumbnail under "Pending Studio edits"
  in series-log.md. The next run adds pending thumbnails on the edit page before uploading anything new.
- **Related video refused** for a Short: as now, record it as pending and rely on the description's "Full video:" line.
- **series-log.md**: update it as §9 says, then commit only that file (and `.claude/handoff/` state you changed) to `master` and push:
  `git -C <repo> commit -m "ddia-video series log: <what was published>" -- .claude/skills/ddia-video/reference/series-log.md && git -C <repo> push origin master`.
  Never stage anything else, and leave the user's other working-tree changes alone. If the push is rejected, don't rebase or force:
  report it.
- **Chrome**: run.sh starts the CDP Chrome if it isn't running. Leave it open at the end.

## Resuming
A run can stop halfway (a gate that needs a human, a sign-in, a crash, the Mac sleeping). The next run gets the same session again,
because series-log.md only changes after publishing. So:
- If `~/Movies/DDIA-Session-N-Video/work/<format>/` exists, don't scaffold again (never `--force`). Read its files, find the first
  step whose output is missing or whose gate fails, and continue from there.
- The YouTube duplicate check finds a Private draft or upload from an interrupted run. Finish that video on its edit page
  instead of uploading again. A finished Public duplicate of the same chapter means a series-log.md row is missing: add the row,
  and don't upload.

## Stop conditions (stop that video, keep its files, report, go on with the rest)
- Google or LinkedIn shows a sign-in page, "Verify it's you", or a security check: the user must do it themselves. Leave the upload
  as a Private draft.
- A QA gate still fails after three rounds of fixes, or the narration runs outside its length range after two rounds of trimming.
- A fact the video needs can't be sourced from the book or deck.
- The deck file `public/blog/ddia-session-N/index.html` is missing.
- A duplicate that isn't from an interrupted run (another video on the same topic): don't upload.
Never delete a video, and never change channel-level settings, in an automatic run.

## LinkedIn (reference/linkedin.md)
No approval step (the user, 2026-11-03). After the long-form video is Public:
1. Write the trimmed post (linkedin.md → The text) to `<deliverables>/linkedin-post.md`, append it to
   `.claude/handoff/linkedin/youtube-video-posts.md`, and queue it as
   `{ "session": N, "videoId": "<id>", "url": "https://youtu.be/<id>", "post": "<abs path>", "status": "approved" }` in
   `~/.cache/ddia-video/auto/linkedin-queue/session-N.json`.
2. The 10:00 job (`run.sh linkedin` → `/ddia-video auto linkedin`) schedules each approved item into its slot as linkedin.md →
   Scheduling says (moves first, last post first, then the new post; **Schedule**, never Post), sets `"status": "scheduled"` and
   `"slot"`, and commits + pushes the updated `.claude/handoff/` files. If it can't finish, it leaves the item approved and reports
   exactly which moves were done, so the next run continues from there.
A post the user wants to hold: `"status": "hold"`; the job skips it.

## The report (always, even when nothing worked)
Write `~/Movies/DDIA-Auto/reports/<YYYY-MM-DD>-<job>.md` (`job` = `session-N` or `linkedin`). Its **first line** is
`STATUS: ok|partial|failed — <one sentence>`; run.sh shows it in the macOS notification. Then: links (YouTube, LinkedIn), lengths,
deliverables folders, the outline, every judgment call and dispute decision, anything pending, and for a stop, exactly what the user
has to do (e.g. "sign in to Google in the Chrome window, then run `run.sh` again").

## Machine setup (once, by the user)
1. `bash .claude/skills/ddia-video/scripts/auto/install.sh` installs two launchd jobs: `produce` daily at 01:00 and `linkedin` daily
   at 10:00 (`install.sh <produce-hour> <linkedin-hour>` changes them; `install.sh uninstall` removes both).
2. Sign in once in the CDP Chrome (`~/.cache/ddia-video/yt-profile`) to YouTube Studio **and** LinkedIn.
3. Keep the Mac on power. To wake it for the night run: `sudo pmset repeat wakeorpoweron MTWRFSU 00:55:00`. run.sh holds a
   `caffeinate` while it runs. A run missed while the Mac slept starts when it wakes.
4. `run.sh plan` shows what the next run will make. Reports go to `~/Movies/DDIA-Auto/reports/`, full transcripts to
   `~/Movies/DDIA-Auto/logs/` (stream-json), and every run ends with a macOS notification carrying the report's STATUS line.
Permissions: run.sh uses `--permission-mode auto`. If the classifier blocks a step the run needs (the report says which),
`DDIA_AUTO_PERMISSION_MODE=bypassPermissions` in the plist's environment is the fallback, at the user's choice.
