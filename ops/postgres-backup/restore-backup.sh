#!/bin/sh
set -eu

[ "${CONFIRM_RESTORE:-}" = "RESTORE" ] || {
  printf 'Set CONFIRM_RESTORE=RESTORE to acknowledge that restore replaces database objects.\n' >&2
  exit 1
}

[ "$#" -eq 1 ] || { printf 'Usage: restore-backup <backup-file-name.dump>\n' >&2; exit 1; }
backup_name="$(basename "$1")"
[ "$backup_name" = "$1" ] || { printf 'Pass a file name from /backups, not a path.\n' >&2; exit 1; }
backup_file="/backups/$backup_name"
[ -f "$backup_file" ] || { printf 'Backup not found: %s\n' "$backup_file" >&2; exit 1; }

pg_restore --list "$backup_file" >/dev/null
pg_restore --clean --if-exists --no-owner --no-privileges --exit-on-error --dbname="$PGDATABASE" "$backup_file"
printf 'restore_completed=%s\n' "$backup_file"
