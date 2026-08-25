#!/bin/sh
set -eu

environment_file="${1:-.env.production}"
compose_file="compose.production.yaml"

[ -f "$environment_file" ] || {
  printf 'Environment file not found: %s\n' "$environment_file" >&2
  exit 1
}

if grep -q 'replace-with' "$environment_file"; then
  printf 'Replace every placeholder secret in %s before deployment.\n' "$environment_file" >&2
  exit 1
fi

dashboard_domain="$(awk -F= '$1 == "DASHBOARD_DOMAIN" { print $2; exit }' "$environment_file" | tr -d '\r\"')"
[ -n "$dashboard_domain" ] || { printf 'DASHBOARD_DOMAIN is required.\n' >&2; exit 1; }

export DEPLOY_ENV_FILE="$environment_file"
compose() {
  docker compose --env-file "$environment_file" -f "$compose_file" "$@"
}

# Validate first, then build immutable release artifacts.
compose config --quiet
compose build app migrate backup

# Database is private. A verified backup is taken before additive migrations.
compose up -d postgres
compose run --rm backup backup-now
compose run --rm migrate

# The proxy is started only after the app health check passes.
compose up -d app backup caddy

attempt=1
while [ "$attempt" -le 24 ]; do
  if curl --fail --silent --show-error "https://${dashboard_domain}/api/health" >/dev/null; then
    printf 'deployment_healthy=https://%s/api/health\n' "$dashboard_domain"
    exit 0
  fi
  attempt=$((attempt + 1))
  sleep 5
done

printf 'Deployment started, but HTTPS health verification failed. Check DNS and Caddy logs.\n' >&2
printf 'Command: DEPLOY_ENV_FILE=%s docker compose --env-file %s -f %s logs caddy app\n' "$environment_file" "$environment_file" "$compose_file" >&2
exit 1
