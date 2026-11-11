#!/usr/bin/env bash
# Watch the vault's blog folder and run sync_blog.py once edits settle.
# Obsidian autosaves every few seconds while typing, so we wait for
# QUIET_SECS with no changes before publishing.
set -uo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLOG="${VAULT:-$HOME/Dropbox/membrain}/blog"
QUIET_SECS="${QUIET_SECS:-60}"

# systemd doesn't load nvm, so put the newest nvm node on PATH for `npm run build`.
NODE_BIN="$(ls -d "$HOME"/.nvm/versions/node/*/bin 2>/dev/null | sort -V | tail -1)"
[ -n "$NODE_BIN" ] && export PATH="$NODE_BIN:$PATH"

sync() { /usr/bin/python3 "$DIR/sync_blog.py" || echo "sync exited with $?"; }

while [ ! -d "$BLOG" ]; do echo "waiting for $BLOG"; sleep 30; done

echo "watching $BLOG (quiet period ${QUIET_SECS}s)"
sync  # catch anything changed while we weren't running

inotifywait -m -r -q -e close_write,create,delete,moved_to,moved_from \
  --exclude '(/\.|~$|\.tmp$|\.swp$)' --format '%w%f' "$BLOG" |
while read -r first; do
  echo "change: $first"
  # Drain events until the folder has been quiet for QUIET_SECS.
  while read -r -t "$QUIET_SECS" next; do :; done
  sync
done
