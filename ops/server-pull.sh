#!/usr/bin/env bash
# Runs ON the server (cron, every 5 minutes): pull the latest master of this repo
# and sync public/ into the directory Caddy serves for mahdiyar.me.
# Pull-based, like TL;DRSS: the repo is public, so the server needs no credentials.
set -euo pipefail

REPO="${REPO:-https://github.com/smzerehpoush/mahdiyar.me.git}"
BRANCH="${BRANCH:-master}"
CHECKOUT="${CHECKOUT:-/opt/mahdiyar-me/checkout}"
DEST="${DEST:-/srv/mahdiyar-me}"

if [ ! -d "$CHECKOUT/.git" ]; then
  mkdir -p "$CHECKOUT"
  git clone -q --depth 1 -b "$BRANCH" "$REPO" "$CHECKOUT"
else
  git -C "$CHECKOUT" fetch -q --depth 1 origin "$BRANCH"
  git -C "$CHECKOUT" reset -q --hard "origin/$BRANCH"
fi

# A commit without public/index.html would otherwise wipe the live site.
if [ ! -f "$CHECKOUT/public/index.html" ]; then
  echo "$(date -Is) refusing to sync: public/index.html missing in $BRANCH" >&2
  exit 1
fi

# .well-known/ holds certbot's HTTP-01 challenge files during a renewal; never delete them.
rsync -a --delete --exclude=/.well-known/ "$CHECKOUT"/public/ "$DEST"/
