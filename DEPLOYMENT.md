# Aegis Control Production Deployment

This deployment uses one HTTPS origin for the dashboard and server APIs. The collector can be split to a dedicated subdomain later when that service exists.

```text
Internet
  └─ Caddy :80/:443 (automatic HTTPS)
       └─ Next.js standalone :3000
            └─ PostgreSQL :5432 (private Docker network)
                 └─ automated pg_dump backups (private volume)
```

The migrator must finish successfully before the application starts. PostgreSQL and the application are not published directly to the host network.

## Prerequisites

- A Linux server with Docker Engine and Docker Compose
- A public IPv4/IPv6 address
- DNS `A`/`AAAA` record for `DASHBOARD_DOMAIN` pointing to the server
- Inbound TCP 80 and TCP/UDP 443 allowed
- An off-host destination for copying database backups

## Environment separation

Use only the template for the target environment:

```bash
cp .env.production.example .env.production
chmod 600 .env.production
```

Staging uses `.env.staging.example` → `.env.staging`. Development continues to use `.env` based on `.env.development.example`.

Generate secrets independently for each environment:

```bash
openssl rand -base64 48
openssl rand -hex 32
```

Set a unique `BETTER_AUTH_SECRET`, PostgreSQL password, domain, ACME email, and matching HTTPS origins. If the database password contains URL-special characters, percent-encode it in `DATABASE_URL`. Never commit a populated `.env`, database dump, or private key.

## Deploy

Verify DNS first:

```bash
getent hosts security.example.com
```

Then run:

```bash
pnpm deploy:production
```

The deployment workflow:

1. validates Compose and rejects placeholder secrets;
2. builds the standalone app, migrator, and backup images;
3. starts the private PostgreSQL service;
4. creates and validates a pre-migration backup;
5. applies committed migrations with `prisma migrate deploy`;
6. starts the app and waits for its database-aware health check;
7. starts Caddy and verifies the public HTTPS health endpoint.

For staging:

```bash
cp .env.staging.example .env.staging
chmod 600 .env.staging
pnpm deploy:staging
```

## HTTPS and health verification

Caddy obtains and renews certificates automatically after DNS and ports are correct. Verify both the endpoint and certificate:

```bash
curl --fail --show-error https://security.example.com/api/health
openssl s_client -connect security.example.com:443 -servername security.example.com </dev/null
```

A healthy response is HTTP 200 with `status: ok` and `database: reachable`. Do not route production traffic directly to port 3000.

## Database pooling and migrations

`DB_POOL_MAX` limits connections per application replica. Ensure:

```text
DB_POOL_MAX × application replicas + migration/backup headroom < PostgreSQL max_connections
```

Production migrations are committed under `prisma/migrations` and applied with `prisma migrate deploy`. Review generated SQL for `DROP`, table rewrites, long locks, and irreversible data changes before deployment. Never run `prisma migrate dev` in production.

## Backups

The backup container runs `pg_dump --format=custom`, validates every dump with `pg_restore --list`, and removes files older than `BACKUP_RETENTION_DAYS`. It writes to the `postgres_backups` Docker volume.

Create an on-demand backup:

```bash
DEPLOY_ENV_FILE=.env.production docker compose --env-file .env.production -f compose.production.yaml exec backup backup-now
```

List backups:

```bash
DEPLOY_ENV_FILE=.env.production docker compose --env-file .env.production -f compose.production.yaml exec backup ls -lh /backups
```

The Docker volume protects against application mistakes, not server loss. Copy backups to encrypted object storage or another server and periodically test restoration there.

## Restore procedure

Restoration replaces database objects. Take a fresh backup and stop traffic first:

```bash
DEPLOY_ENV_FILE=.env.production docker compose --env-file .env.production -f compose.production.yaml stop caddy app
DEPLOY_ENV_FILE=.env.production docker compose --env-file .env.production -f compose.production.yaml exec backup backup-now
DEPLOY_ENV_FILE=.env.production docker compose --env-file .env.production -f compose.production.yaml exec -e CONFIRM_RESTORE=RESTORE backup restore-backup aegis_control_YYYYMMDDTHHMMSSZ.dump
DEPLOY_ENV_FILE=.env.production docker compose --env-file .env.production -f compose.production.yaml run --rm migrate
DEPLOY_ENV_FILE=.env.production docker compose --env-file .env.production -f compose.production.yaml up -d app caddy
```

Verify `/api/health`, login, and one protected dashboard route after restoration.

## Rollback plan

1. Stop Caddy to prevent new traffic while preserving containers and volumes.
2. Capture logs and create an on-demand database backup.
3. Redeploy the previous reviewed application revision/image.
4. Keep the database at the newer migration when it is backward-compatible; prefer a forward-fix migration.
5. Only restore a pre-migration dump when the migration is incompatible and the resulting data loss window is explicitly accepted.
6. Run HTTPS health, login, and protected-route checks before restoring traffic.

Useful diagnostics:

```bash
DEPLOY_ENV_FILE=.env.production docker compose --env-file .env.production -f compose.production.yaml ps
DEPLOY_ENV_FILE=.env.production docker compose --env-file .env.production -f compose.production.yaml logs --tail=200 app caddy migrate postgres backup
```
