#!/bin/sh
set -eu

interval="${BACKUP_INTERVAL_SECONDS:-86400}"
case "$interval" in
  *[!0-9]*|'') printf 'BACKUP_INTERVAL_SECONDS must be a positive integer\n' >&2; exit 1 ;;
esac
[ "$interval" -ge 300 ] || { printf 'BACKUP_INTERVAL_SECONDS must be at least 300\n' >&2; exit 1; }

while true; do
  backup-now
  sleep "$interval"
done
