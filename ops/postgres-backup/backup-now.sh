#!/bin/sh
set -eu

: "${PGHOST:?PGHOST is required}"
: "${PGUSER:?PGUSER is required}"
: "${PGDATABASE:?PGDATABASE is required}"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="/backups/${PGDATABASE}_${timestamp}.dump"
temporary="${target}.partial"

pg_dump --format=custom --no-owner --no-privileges --file="$temporary"
pg_restore --list "$temporary" >/dev/null
mv "$temporary" "$target"

retention_days="${BACKUP_RETENTION_DAYS:-30}"
find /backups -type f -name "${PGDATABASE}_*.dump" -mtime "+${retention_days}" -delete
printf 'backup_created=%s\n' "$target"
