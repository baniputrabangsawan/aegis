-- CreateEnum
CREATE TYPE "SiteEnvironment" AS ENUM ('PRODUCTION', 'STAGING', 'DEVELOPMENT');

-- CreateEnum
CREATE TYPE "SiteStatus" AS ENUM ('DRAFT', 'PENDING_VERIFICATION', 'ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SecurityMode" AS ENUM ('MONITOR_ONLY', 'MONITOR_AND_ENFORCE');

-- CreateEnum
CREATE TYPE "ExternalUserStatus" AS ENUM ('ACTIVE', 'SUSPICIOUS', 'BLOCKED');

-- CreateEnum
CREATE TYPE "SiteSessionStatus" AS ENUM ('ACTIVE', 'IDLE', 'INACTIVE', 'EXPIRED', 'REVOKED', 'LOGGED_OUT');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('KNOWN', 'NEW', 'SUSPICIOUS', 'REVOKED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SecurityEventStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "BlockedIPScope" AS ENUM ('GLOBAL', 'SITE');

-- CreateEnum
CREATE TYPE "BlockedIPStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "environment" "SiteEnvironment" NOT NULL,
    "status" "SiteStatus" NOT NULL DEFAULT 'DRAFT',
    "securityMode" "SecurityMode" NOT NULL DEFAULT 'MONITOR_ONLY',
    "retentionDays" INTEGER NOT NULL DEFAULT 90,
    "verifiedAt" TIMESTAMP(3),
    "lastEventAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_api_credentials" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "environment" "SiteEnvironment" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "site_api_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_users" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "externalUserId" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "status" "ExternalUserStatus" NOT NULL DEFAULT 'ACTIVE',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_sessions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "externalSessionId" TEXT NOT NULL,
    "externalUserRecordId" TEXT,
    "deviceId" TEXT,
    "status" "SiteSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "timezone" TEXT,
    "asn" TEXT,
    "isp" TEXT,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "logoutAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "externalUserRecordId" TEXT,
    "deviceKey" TEXT NOT NULL,
    "friendlyName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "vendor" TEXT,
    "model" TEXT,
    "browser" TEXT NOT NULL,
    "browserVersion" TEXT,
    "os" TEXT NOT NULL,
    "osVersion" TEXT,
    "status" "DeviceStatus" NOT NULL DEFAULT 'NEW',
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastIpAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "eventId" TEXT,
    "externalUserRecordId" TEXT,
    "deviceId" TEXT,
    "externalUserId" TEXT,
    "success" BOOLEAN NOT NULL,
    "failureReason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "externalUserId" TEXT,
    "externalSessionId" TEXT,
    "externalUserRecordId" TEXT,
    "siteSessionId" TEXT,
    "deviceId" TEXT,
    "ipAddress" TEXT,
    "metadata" JSONB,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "riskReasons" JSONB,
    "status" "SecurityEventStatus" NOT NULL DEFAULT 'OPEN',
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_ips" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "siteId" TEXT,
    "ipAddress" TEXT NOT NULL,
    "scope" "BlockedIPScope" NOT NULL,
    "reason" TEXT NOT NULL,
    "enforcement" "SecurityMode" NOT NULL DEFAULT 'MONITOR_ONLY',
    "status" "BlockedIPStatus" NOT NULL DEFAULT 'ACTIVE',
    "blockedById" TEXT,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocked_ips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "siteId" TEXT,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB,
    "actorIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sites_organizationId_status_idx" ON "sites"("organizationId", "status");

-- CreateIndex
CREATE INDEX "sites_organizationId_deletedAt_idx" ON "sites"("organizationId", "deletedAt");

-- CreateIndex
CREATE INDEX "sites_status_idx" ON "sites"("status");

-- CreateIndex
CREATE INDEX "sites_lastEventAt_idx" ON "sites"("lastEventAt");

-- CreateIndex
CREATE INDEX "sites_createdAt_idx" ON "sites"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "sites_organizationId_slug_key" ON "sites"("organizationId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "sites_organizationId_domain_environment_key" ON "sites"("organizationId", "domain", "environment");

-- CreateIndex
CREATE UNIQUE INDEX "sites_organizationId_id_key" ON "sites"("organizationId", "id");

-- CreateIndex
CREATE INDEX "site_api_credentials_organizationId_siteId_idx" ON "site_api_credentials"("organizationId", "siteId");

-- CreateIndex
CREATE INDEX "site_api_credentials_siteId_revokedAt_idx" ON "site_api_credentials"("siteId", "revokedAt");

-- CreateIndex
CREATE INDEX "site_api_credentials_createdAt_idx" ON "site_api_credentials"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "site_api_credentials_organizationId_keyPrefix_key" ON "site_api_credentials"("organizationId", "keyPrefix");

-- CreateIndex
CREATE INDEX "external_users_organizationId_siteId_idx" ON "external_users"("organizationId", "siteId");

-- CreateIndex
CREATE INDEX "external_users_externalUserId_idx" ON "external_users"("externalUserId");

-- CreateIndex
CREATE INDEX "external_users_status_idx" ON "external_users"("status");

-- CreateIndex
CREATE INDEX "external_users_lastSeenAt_idx" ON "external_users"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "external_users_siteId_externalUserId_key" ON "external_users"("siteId", "externalUserId");

-- CreateIndex
CREATE UNIQUE INDEX "external_users_organizationId_siteId_id_key" ON "external_users"("organizationId", "siteId", "id");

-- CreateIndex
CREATE INDEX "site_sessions_organizationId_siteId_idx" ON "site_sessions"("organizationId", "siteId");

-- CreateIndex
CREATE INDEX "site_sessions_externalUserRecordId_idx" ON "site_sessions"("externalUserRecordId");

-- CreateIndex
CREATE INDEX "site_sessions_deviceId_idx" ON "site_sessions"("deviceId");

-- CreateIndex
CREATE INDEX "site_sessions_ipAddress_idx" ON "site_sessions"("ipAddress");

-- CreateIndex
CREATE INDEX "site_sessions_status_lastActiveAt_idx" ON "site_sessions"("status", "lastActiveAt");

-- CreateIndex
CREATE INDEX "site_sessions_createdAt_idx" ON "site_sessions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "site_sessions_siteId_externalSessionId_key" ON "site_sessions"("siteId", "externalSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "site_sessions_organizationId_siteId_id_key" ON "site_sessions"("organizationId", "siteId", "id");

-- CreateIndex
CREATE INDEX "devices_organizationId_siteId_idx" ON "devices"("organizationId", "siteId");

-- CreateIndex
CREATE INDEX "devices_externalUserRecordId_idx" ON "devices"("externalUserRecordId");

-- CreateIndex
CREATE INDEX "devices_lastIpAddress_idx" ON "devices"("lastIpAddress");

-- CreateIndex
CREATE INDEX "devices_status_idx" ON "devices"("status");

-- CreateIndex
CREATE INDEX "devices_lastSeenAt_idx" ON "devices"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "devices_siteId_deviceKey_key" ON "devices"("siteId", "deviceKey");

-- CreateIndex
CREATE UNIQUE INDEX "devices_organizationId_siteId_id_key" ON "devices"("organizationId", "siteId", "id");

-- CreateIndex
CREATE INDEX "login_attempts_organizationId_siteId_idx" ON "login_attempts"("organizationId", "siteId");

-- CreateIndex
CREATE INDEX "login_attempts_externalUserId_idx" ON "login_attempts"("externalUserId");

-- CreateIndex
CREATE INDEX "login_attempts_externalUserRecordId_idx" ON "login_attempts"("externalUserRecordId");

-- CreateIndex
CREATE INDEX "login_attempts_deviceId_idx" ON "login_attempts"("deviceId");

-- CreateIndex
CREATE INDEX "login_attempts_ipAddress_idx" ON "login_attempts"("ipAddress");

-- CreateIndex
CREATE INDEX "login_attempts_success_occurredAt_idx" ON "login_attempts"("success", "occurredAt");

-- CreateIndex
CREATE INDEX "login_attempts_riskLevel_idx" ON "login_attempts"("riskLevel");

-- CreateIndex
CREATE INDEX "login_attempts_createdAt_idx" ON "login_attempts"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "login_attempts_siteId_eventId_key" ON "login_attempts"("siteId", "eventId");

-- CreateIndex
CREATE INDEX "security_events_organizationId_siteId_idx" ON "security_events"("organizationId", "siteId");

-- CreateIndex
CREATE INDEX "security_events_externalUserId_idx" ON "security_events"("externalUserId");

-- CreateIndex
CREATE INDEX "security_events_externalUserRecordId_idx" ON "security_events"("externalUserRecordId");

-- CreateIndex
CREATE INDEX "security_events_externalSessionId_idx" ON "security_events"("externalSessionId");

-- CreateIndex
CREATE INDEX "security_events_siteSessionId_idx" ON "security_events"("siteSessionId");

-- CreateIndex
CREATE INDEX "security_events_deviceId_idx" ON "security_events"("deviceId");

-- CreateIndex
CREATE INDEX "security_events_ipAddress_idx" ON "security_events"("ipAddress");

-- CreateIndex
CREATE INDEX "security_events_eventType_occurredAt_idx" ON "security_events"("eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "security_events_riskLevel_status_idx" ON "security_events"("riskLevel", "status");

-- CreateIndex
CREATE INDEX "security_events_createdAt_idx" ON "security_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "security_events_siteId_eventId_key" ON "security_events"("siteId", "eventId");

-- CreateIndex
CREATE INDEX "blocked_ips_organizationId_siteId_idx" ON "blocked_ips"("organizationId", "siteId");

-- CreateIndex
CREATE INDEX "blocked_ips_ipAddress_idx" ON "blocked_ips"("ipAddress");

-- CreateIndex
CREATE INDEX "blocked_ips_scope_status_idx" ON "blocked_ips"("scope", "status");

-- CreateIndex
CREATE INDEX "blocked_ips_status_expiresAt_idx" ON "blocked_ips"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "blocked_ips_createdAt_idx" ON "blocked_ips"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_siteId_idx" ON "audit_logs"("organizationId", "siteId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_targetType_targetId_idx" ON "audit_logs"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "audit_logs_actorIp_idx" ON "audit_logs"("actorIp");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_api_credentials" ADD CONSTRAINT "site_api_credentials_organizationId_siteId_fkey" FOREIGN KEY ("organizationId", "siteId") REFERENCES "sites"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_users" ADD CONSTRAINT "external_users_organizationId_siteId_fkey" FOREIGN KEY ("organizationId", "siteId") REFERENCES "sites"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_sessions" ADD CONSTRAINT "site_sessions_organizationId_siteId_fkey" FOREIGN KEY ("organizationId", "siteId") REFERENCES "sites"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_sessions" ADD CONSTRAINT "site_sessions_organizationId_siteId_externalUserRecordId_fkey" FOREIGN KEY ("organizationId", "siteId", "externalUserRecordId") REFERENCES "external_users"("organizationId", "siteId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_sessions" ADD CONSTRAINT "site_sessions_organizationId_siteId_deviceId_fkey" FOREIGN KEY ("organizationId", "siteId", "deviceId") REFERENCES "devices"("organizationId", "siteId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_organizationId_siteId_fkey" FOREIGN KEY ("organizationId", "siteId") REFERENCES "sites"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_organizationId_siteId_externalUserRecordId_fkey" FOREIGN KEY ("organizationId", "siteId", "externalUserRecordId") REFERENCES "external_users"("organizationId", "siteId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_organizationId_siteId_fkey" FOREIGN KEY ("organizationId", "siteId") REFERENCES "sites"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_organizationId_siteId_externalUserRecordId_fkey" FOREIGN KEY ("organizationId", "siteId", "externalUserRecordId") REFERENCES "external_users"("organizationId", "siteId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_organizationId_siteId_deviceId_fkey" FOREIGN KEY ("organizationId", "siteId", "deviceId") REFERENCES "devices"("organizationId", "siteId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_organizationId_siteId_fkey" FOREIGN KEY ("organizationId", "siteId") REFERENCES "sites"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_organizationId_siteId_externalUserRecordId_fkey" FOREIGN KEY ("organizationId", "siteId", "externalUserRecordId") REFERENCES "external_users"("organizationId", "siteId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_organizationId_siteId_siteSessionId_fkey" FOREIGN KEY ("organizationId", "siteId", "siteSessionId") REFERENCES "site_sessions"("organizationId", "siteId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_organizationId_siteId_deviceId_fkey" FOREIGN KEY ("organizationId", "siteId", "deviceId") REFERENCES "devices"("organizationId", "siteId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_ips" ADD CONSTRAINT "blocked_ips_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_ips" ADD CONSTRAINT "blocked_ips_organizationId_siteId_fkey" FOREIGN KEY ("organizationId", "siteId") REFERENCES "sites"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_ips" ADD CONSTRAINT "blocked_ips_blockedById_fkey" FOREIGN KEY ("blockedById") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organizationId_siteId_fkey" FOREIGN KEY ("organizationId", "siteId") REFERENCES "sites"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
