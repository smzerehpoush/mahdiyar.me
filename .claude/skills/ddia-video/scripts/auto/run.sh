#!/bin/bash
# Automatic DDIA video run (reference/auto.md). Started by launchd (install.sh), or by hand:
#   run.sh            produce: next session's long-form + Short(s), publish to YouTube, queue the LinkedIn post
#   run.sh linkedin   schedule approved LinkedIn posts (Sat/Mon/Wed 11:30 slots)
#   run.sh approve N  release a held LinkedIn post of session N
#   run.sh plan       print what the next produce run would make, and exit
# Env: DDIA_AUTO_MODEL (default: your Claude Code default), DDIA_AUTO_PERMISSION_MODE (default auto),
#      DDIA_AUTO_MAX_HOURS (watchdog, default 20 for produce, 1 for linkedin).
set -uo pipefail
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

JOB="${1:-produce}"
SKILL="$(cd "$(dirname "$0")/../.." && pwd)"
REPO="$(cd "$SKILL/../../.." && pwd)"
STATE="$HOME/.cache/ddia-video/auto"
REPORTS="$HOME/Movies/DDIA-Auto/reports"
LOGS="$HOME/Movies/DDIA-Auto/logs"
mkdir -p "$STATE/linkedin-queue" "$REPORTS" "$LOGS"
TODAY="$(date +%F)"
STAMP="$(date +%F-%H%M)"

notify() { osascript -e "display notification \"${2//\"/\\\"}\" with title \"DDIA auto: ${1//\"/\\\"}\" sound name \"Glass\"" >/dev/null 2>&1 || true; }

if [ "$JOB" = plan ]; then node "$SKILL/scripts/auto/next.mjs"; exit 0; fi
if [ "$JOB" = approve ]; then
  Q="$STATE/linkedin-queue/session-${2:?usage: run.sh approve N}.json"
  [ -f "$Q" ] || { echo "no queued post for session $2"; exit 1; }
  sed -i '' -E 's/"status": *"(draft|hold)"/"status": "approved"/' "$Q"; cat "$Q"; exit 0
fi

# One run at a time (a produce run can take most of a day; launchd's next start just skips).
LOCK="$STATE/$JOB.lock"
if ! mkdir "$LOCK" 2>/dev/null; then
  if [ -f "$LOCK/pid" ] && kill -0 "$(cat "$LOCK/pid")" 2>/dev/null; then echo "another run is active (pid $(cat "$LOCK/pid")); skipping $JOB"; exit 0; fi
  rm -rf "$LOCK"; mkdir "$LOCK"
fi
echo $$ > "$LOCK/pid"
trap 'rm -rf "$LOCK"' EXIT

# Keep the Mac awake for this run (display may sleep; the CDP Chrome flags keep Studio painting).
caffeinate -ims -w $$ &

# Wait for the network (the Mac may wake before Wi-Fi/DNS is back): check every 5 min for up to 6 h before giving up.
for i in $(seq 72); do
  curl -s -m 10 -o /dev/null https://api.anthropic.com && break
  [ "$i" = 1 ] && echo "[$(date)] no network; waiting up to 6 h"
  [ "$i" = 72 ] && { notify "no network" "Gave up after 6 h without internet; the next scheduled run retries."; exit 1; }
  sleep 300
done

# The signed-in CDP Chrome for YouTube Studio and LinkedIn (reference/youtube-upload.md §0).
if ! curl -s -m 3 localhost:9333/json/version >/dev/null; then
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --user-data-dir="$HOME/.cache/ddia-video/yt-profile" \
    --remote-debugging-port=9333 --no-first-run --no-default-browser-check --window-size=1400,1000 \
    --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --disable-background-timer-throttling \
    https://studio.youtube.com >/dev/null 2>&1 &
  for _ in $(seq 30); do curl -s -m 2 localhost:9333/json/version >/dev/null && break; sleep 2; done
fi

if [ "$JOB" = linkedin ]; then
  if ! grep -lq '"status": *"approved"' "$STATE"/linkedin-queue/*.json 2>/dev/null; then echo "no approved LinkedIn post to schedule"; exit 0; fi
  NAME="linkedin"
  PROMPT="/ddia-video auto linkedin — schedule every approved item in ~/.cache/ddia-video/auto/linkedin-queue into its Sat/Mon/Wed 11:30 slot (reference/auto.md → LinkedIn, reference/linkedin.md); Schedule, never Post; never touch drafts. Today is $TODAY. Write the report to $REPORTS/$TODAY-linkedin.md."
  HOURS="${DDIA_AUTO_MAX_HOURS:-1}"
else
  if ! node "$SKILL/scripts/setup.mjs" > "$LOGS/$STAMP-setup.log" 2>&1; then
    notify "setup failed" "Tools or models missing; see $LOGS/$STAMP-setup.log"; exit 1
  fi
  PLAN="$(node "$SKILL/scripts/auto/next.mjs")" || { notify "failed" "next.mjs failed"; exit 1; }
  if echo "$PLAN" | grep -q '"done":true'; then notify "series complete" "Every session has a long-form video and a Short."; exit 0; fi
  N="$(echo "$PLAN" | sed -E 's/.*"long":(null|[0-9]+).*/\1/')"
  NAME="session-${N/null/shorts}"
  PROMPT="/ddia-video auto — automatic run (reference/auto.md; nobody is watching, never ask). Plan from scripts/auto/next.mjs: $PLAN. Today is $TODAY (Tehran time). Write the report to $REPORTS/$TODAY-$NAME.md."
  HOURS="${DDIA_AUTO_MAX_HOURS:-20}"
fi

LOG="$LOGS/$STAMP-$NAME.jsonl"
REPORT="$REPORTS/$TODAY-$NAME.md"
echo "[$(date)] $JOB → $NAME; log $LOG"
notify "started" "$NAME"

cd "$REPO"
ARGS=(-p "$PROMPT" --permission-mode "${DDIA_AUTO_PERMISSION_MODE:-auto}" --disallowedTools AskUserQuestion
      --output-format stream-json --verbose)
[ -n "${DDIA_AUTO_MODEL:-}" ] && ARGS+=(--model "$DDIA_AUTO_MODEL")
claude "${ARGS[@]}" > "$LOG" 2>&1 &
CPID=$!
( sleep $((HOURS * 3600)); kill "$CPID" 2>/dev/null && echo "watchdog: killed after ${HOURS} h" >> "$LOG" ) &
WATCH=$!
wait "$CPID"; CODE=$?
pkill -P "$WATCH" 2>/dev/null; kill "$WATCH" 2>/dev/null

if [ -f "$REPORT" ]; then
  notify "$NAME" "$(head -1 "$REPORT" | sed 's/^STATUS: //')"
else
  notify "$NAME" "No report (exit $CODE). See $LOG"
fi
exit "$CODE"
