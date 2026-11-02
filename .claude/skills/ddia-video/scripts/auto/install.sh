#!/bin/bash
# Install (or remove) the launchd jobs for automatic DDIA runs (reference/auto.md → Machine setup).
#   install.sh [produce-hour] [linkedin-hour]   default 1 (01:00) and 10 (10:00), local time
#   install.sh uninstall
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
AGENTS="$HOME/Library/LaunchAgents"
LOGS="$HOME/Movies/DDIA-Auto/logs"
mkdir -p "$AGENTS" "$LOGS"
chmod +x "$DIR/run.sh"

job() { # label hour arg
  local plist="$AGENTS/$1.plist"
  launchctl bootout "gui/$(id -u)" "$plist" 2>/dev/null || true
  [ "${UNINSTALL:-}" = 1 ] && { rm -f "$plist"; echo "removed $1"; return; }
  cat > "$plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$1</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>$DIR/run.sh</string><string>$3</string></array>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>$2</integer><key>Minute</key><integer>0</integer></dict>
  <key>StandardOutPath</key><string>$LOGS/launchd-$3.log</string>
  <key>StandardErrorPath</key><string>$LOGS/launchd-$3.log</string>
  <key>ProcessType</key><string>Interactive</string>
</dict></plist>
PLIST
  launchctl bootstrap "gui/$(id -u)" "$plist"
  echo "installed $1 (daily at $2:00) → run.sh $3"
}

if [ "${1:-}" = uninstall ]; then UNINSTALL=1; job me.mahdiyar.ddia-auto.produce 0 produce; job me.mahdiyar.ddia-auto.linkedin 0 linkedin; exit 0; fi
job me.mahdiyar.ddia-auto.produce "${1:-1}" produce
job me.mahdiyar.ddia-auto.linkedin "${2:-10}" linkedin
echo "Run one now: launchctl kickstart gui/$(id -u)/me.mahdiyar.ddia-auto.produce"
echo "For a sleeping Mac to wake for the night run: sudo pmset repeat wakeorpoweron MTWRFSU 00:55:00"
