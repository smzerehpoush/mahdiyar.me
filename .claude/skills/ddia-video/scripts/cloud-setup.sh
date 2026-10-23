#!/usr/bin/env bash
# System dependencies for the ddia-video skill on Ubuntu 24.04 x86_64 (Claude Code cloud sessions), then scripts/setup.mjs
# (node_modules + whisper and Kokoro models in ~/.cache/ddia-video). Idempotent: a fast no-op when everything is present, so
# SKILL.md §0 runs it in every cloud session. To bake it into a cloud environment's cached snapshot, set the environment's
# setup script to:
#   curl -fsSL https://raw.githubusercontent.com/smzerehpoush/mahdiyar.me/master/.claude/skills/ddia-video/scripts/cloud-setup.sh | bash
# Network: the models come from huggingface.co (redirects to *.hf.co), which is NOT in the default Trusted list; see
# reference/cloud.md. Everything else (apt, GitHub, storage.googleapis.com, npm) is.
# Always exits 0 (a failing environment setup script blocks the session); the last lines say what is still missing.
set -uo pipefail

if [ "$(uname -s)" != Linux ]; then echo "cloud-setup.sh is for Linux; on macOS: brew install ffmpeg whisper-cpp && node scripts/setup.mjs"; exit 0; fi
SUDO=""; [ "$(id -u)" -eq 0 ] || SUDO="sudo"
CACHE="${DDIA_VIDEO_CACHE:-$HOME/.cache/ddia-video}"
WHISPER_TAG="${WHISPER_TAG:-v1.9.5}"             # same whisper.cpp as the macOS (Homebrew) build the series was made with
CHROME_VERSION="${CHROME_VERSION:-155.0.8059.84}" # the Chrome that puppeteer-core 25.15.0 (template/package-lock.json) targets
REPO_URL="https://github.com/smzerehpoush/mahdiyar.me.git"
LOGS="$CACHE/setup-logs"; mkdir -p "$LOGS" "$CACHE/chrome"
t0=$(date +%s)

# The skill: next to this script, else a shallow clone of the (public) repo, for when this runs piped from curl.
here="$(cd "$(dirname "${BASH_SOURCE[0]:-}")" 2>/dev/null && pwd || true)"
if [ -n "$here" ] && [ -f "$here/setup.mjs" ]; then SKILL="$(dirname "$here")"
else
  src="$CACHE/skill-src"; rm -rf "$src"
  git clone -q --depth 1 "$REPO_URL" "$src" || { echo "✗ could not clone $REPO_URL"; exit 0; }
  SKILL="$src/.claude/skills/ddia-video"
fi

# 1. apt: ffmpeg, fallback fonts for glyphs the bundled fonts lack (→ ≈ ✓ ✕ ①), unzip, and Chrome's shared libraries.
APT_PKGS="ffmpeg fonts-dejavu-core fonts-noto-core unzip ca-certificates libnss3 libnspr4 libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64
  libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2t64 libpango-1.0-0 libcairo2 libdbus-1-3
  libxshmfence1 libx11-xcb1 libxcb1 libxext6 libexpat1 libglib2.0-0t64"
need_apt=0
for p in $APT_PKGS; do dpkg -s "$p" >/dev/null 2>&1 || { need_apt=1; break; }; done
if [ $need_apt = 1 ]; then
  ( export DEBIAN_FRONTEND=noninteractive
    $SUDO apt-get update -qq && $SUDO apt-get install -y -qq --no-install-recommends $APT_PKGS ) >"$LOGS/apt.log" 2>&1 &
fi

# 2. whisper-cli, built from source (no Ubuntu 24.04 package). Static binary; GGML_NATIVE=OFF with an explicit AVX2 baseline, so a
#    binary baked into an environment snapshot never hits an illegal instruction on a different host CPU.
if ! command -v whisper-cli >/dev/null; then
  SIMD=""; [ "$(uname -m)" = x86_64 ] && SIMD="-DGGML_AVX=ON -DGGML_AVX2=ON -DGGML_FMA=ON -DGGML_F16C=ON"
  ( set -e; b="$CACHE/whisper.cpp"; rm -rf "$b"
    git clone -q --depth 1 -b "$WHISPER_TAG" https://github.com/ggml-org/whisper.cpp "$b"
    cmake -S "$b" -B "$b/build" -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF -DGGML_NATIVE=OFF $SIMD \
      -DWHISPER_BUILD_TESTS=OFF -DWHISPER_BUILD_SERVER=OFF -DWHISPER_SDL2=OFF
    cmake --build "$b/build" -j "$(nproc)" --target whisper-cli
    $SUDO install -m 755 "$b/build/bin/whisper-cli" /usr/local/bin/whisper-cli
    rm -rf "$b" ) >"$LOGS/whisper.log" 2>&1 &
fi

# 3. Chrome for Testing (full Chrome: puppeteer's headless: true is the new headless mode, same as macOS Chrome).
CHROME_ZIP="$CACHE/chrome/chrome-linux64-$CHROME_VERSION.zip"
if [ ! -x "$CACHE/chrome/chrome-linux64/chrome" ] && [ ! -f "$CHROME_ZIP" ]; then
  curl -fsSL --retry 5 -o "$CHROME_ZIP.part" \
    "https://storage.googleapis.com/chrome-for-testing-public/$CHROME_VERSION/linux64/chrome-linux64.zip" \
    >"$LOGS/chrome.log" 2>&1 && mv "$CHROME_ZIP.part" "$CHROME_ZIP" &
fi

# 4. node_modules + whisper model + Kokoro model (scripts/setup.mjs; its tool checks may fail until the jobs above finish).
node "$SKILL/scripts/setup.mjs" --prefetch-tts >"$LOGS/setup-mjs.log" 2>&1 &

wait
if [ ! -x "$CACHE/chrome/chrome-linux64/chrome" ] && [ -f "$CHROME_ZIP" ]; then
  (cd "$CACHE/chrome" && unzip -q -o "$CHROME_ZIP" && rm -f "$CHROME_ZIP") >>"$LOGS/chrome.log" 2>&1
fi
CHROME_BIN="${CHROME_PATH:-$CACHE/chrome/chrome-linux64/chrome}"
chrome_ok=""
if [ -x "$CHROME_BIN" ]; then
  missing=$(ldd "$CHROME_BIN" 2>/dev/null | awk '/not found/{print $1}' | tr '\n' ' ')
  [ -n "$missing" ] && echo "✗ Chrome is missing shared libraries: $missing"
  # Start it the way the tools do (root → --no-sandbox), so a sandbox/GPU problem shows here, not at the first still.
  if timeout 90 "$CHROME_BIN" --headless --no-sandbox --disable-dev-shm-usage --dump-dom "data:text/html,<p>chrome-ok</p>" 2>"$LOGS/chrome-start.log" \
    | grep -q chrome-ok; then chrome_ok="✓ Chrome starts headless"
  else chrome_ok="✗ Chrome did not start headless (see $LOGS/chrome-start.log)"; fi
fi

echo "ddia-video cloud setup ($(( $(date +%s) - t0 )) s; logs in $LOGS):"
node "$SKILL/scripts/setup.mjs" 2>&1 | sed 's/^/  /'
[ -n "$chrome_ok" ] && echo "  $chrome_ok"
grep -h -i -m3 "error\|fail\|denied\|403" "$LOGS"/*.log 2>/dev/null | sed 's/^/  log: /' || true
exit 0
