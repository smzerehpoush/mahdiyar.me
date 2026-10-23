# Running the skill in a Claude Code cloud session

A cloud session (claude.ai/code, `claude --cloud`, the mobile or desktop app) is a fresh Ubuntu 24.04 x86_64 VM with 4 vCPUs and
16 GB RAM, and this repo cloned. The session runs as root, `CLAUDE_CODE_REMOTE=true` is set, and local Claude memory isn't available.
Everything up to §7 (brief → render → package) works there. Publishing (§8) doesn't: Studio needs a Chrome profile the user signs into
on their own machine. So a cloud session ends by pushing its work to its branch, and the user publishes locally.

## One-time environment settings (the user does these in the cloud environment's settings dialog)
1. **Network access** → **Custom**, tick **Also include default list of common package managers**, and add:
   ```
   huggingface.co
   *.huggingface.co
   *.hf.co
   ```
   This is only for the whisper and Kokoro model downloads (about 480 MB; `huggingface.co` redirects to `*.hf.co`). apt, npm,
   GitHub and the Chrome download (`storage.googleapis.com`) are already in the default list. **Full** access works too.
2. **Setup script** (optional, recommended). It bakes all dependencies into the environment's cached snapshot, so video sessions start
   ready:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/smzerehpoush/mahdiyar.me/master/.claude/skills/ddia-video/scripts/cloud-setup.sh | bash
   ```
   Without it, §0 installs everything on first use in each new session. The cache rebuilds only when the setup script or the network
   settings change, or after about 7 days. That's why §0 runs `cloud-setup.sh` every time anyway; when everything is present it
   finishes in seconds.

## What changes in a cloud run
- **§0 Setup.** Run `bash "${CLAUDE_SKILL_DIR}/scripts/cloud-setup.sh"` instead of `setup.mjs`. It installs ffmpeg, fallback fonts,
  whisper-cli (built from source, v1.9.5), Chrome for Testing 155 in `~/.cache/ddia-video/chrome`, node_modules, and the models.
  The tools pick up Chrome there automatically and add `--no-sandbox` because the session runs as root. If the last lines report a
  missing model and a log shows 403/blocked, the network settings above are missing: tell the user and stop.
- **Work dir.** `new-video.mjs` puts everything under `<repo>/videos/DDIA-Session-N-Video/` (same layout as `~/Movies/…`:
  `work/<format>/`, deliverables at the top level or in `Short/`). It also writes `videos/.gitignore`, which keeps audio, QA images
  and intermediate mp4s out of git.
- **Long commands.** A foreground command waits at most 10 minutes. Start `tts` (long-form), `sweep` and `render` with
  `run_in_background: true` and `timeout: 7200000` (the 2-hour maximum); you are notified when they finish. Leave `render.mjs`
  `--workers` at its default (one per core, 4 here); 8 Chrome instances on 4 vCPUs only add memory pressure.
- **Checkpoints.** An idle VM can be reclaimed, and uncommitted files are lost with it. After each milestone (brief + storyboard,
  validated script, scenes passing QA, final package) commit only `videos/` to the session's current branch and push:
  `git add videos && git commit -m "DDIA session N video: <milestone>" && git push -u origin HEAD`. Never push to `master`, and never
  commit anything outside `videos/`.
- **Workflows** (§3, §5) are available. The opt-in rule is unchanged.
- **Series state.** Use [series-log.md](series-log.md). Don't edit it in the cloud: it changes when a video is published, which
  happens locally.

## Hand-off (instead of §8–§9)
1. Export the deliverables as usual (pipeline.md → Deliverables) into `videos/DDIA-Session-N-Video[/Short]`.
2. Check the mp4's size. GitHub rejects files over 100 MB (long-form so far: 56–67 MB). If it's over about 95 MB, stop and ask the
   user; Git LFS isn't set up.
3. Commit `videos/` and push the session branch (as above).
4. Tell the user:
   - the branch name;
   - that the repo is public, so the video is visible on GitHub before it's on YouTube;
   - to publish, run `/ddia-video import <branch>` in a local session. That runs
     `node .claude/skills/ddia-video/scripts/import-cloud.mjs --branch <branch>`, which copies the folder into `~/Movies` with
     `out/final.mp4` restored, then continues at §8.

     After publishing, delete the branch on GitHub. A cloud session can't delete it, because the GitHub proxy refuses branch deletions.

The work dir's audio isn't committed. A local tweak after import means re-running `tts` and `words` on the Mac, which can shift word
timings slightly. Re-run the anchor audit and the sweep before re-rendering.
