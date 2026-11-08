#!/usr/bin/env bash
# Backs up the docker-compose MongoDB to a dated, gzipped mongodump archive and deletes ones older
# than KEEP_DAYS. Run on the server from cron (see README "Backups").
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/mnt/md0/backups/chromesthesia-visualizer}"
KEEP_DAYS="${KEEP_DAYS:-30}"
# cron's PATH is minimal; docker-compose is often in /usr/local/bin
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

# Run from the repo root, where docker-compose.yml is
cd "$(dirname "$0")/.."

if docker compose version >/dev/null 2>&1; then
    compose=(docker compose)
else
    compose=(docker-compose)
fi

mkdir -p "$BACKUP_DIR"
file="$BACKUP_DIR/colordatabase-$(date +%F-%H%M).archive.gz"
# Write to a temporary name first, so a failed dump never looks like a good backup
tmp="$file.partial"
trap 'rm -f "$tmp"' EXIT

"${compose[@]}" exec -T mongo mongodump --quiet --archive --gzip >"$tmp"
if [[ ! -s "$tmp" ]]; then
    echo "$(date "+%F %T") backup failed: empty dump" >&2
    exit 1
fi
mv "$tmp" "$file"

find "$BACKUP_DIR" -name 'colordatabase-*.archive.gz' -mtime +"$KEEP_DAYS" -delete
echo "$(date "+%F %T") backed up to $file ($(du -h "$file" | cut -f1))"
