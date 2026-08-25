import "server-only";
import { createHash } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import type { RiskLevel } from "@/generated/prisma/enums";
import type { NormalizedCollectorEvent } from "@/server/collector/service";

const SESSION_REFRESH_THROTTLE_MS = 60_000;
const TERMINAL_SESSION_STATUSES = ["EXPIRED", "REVOKED", "LOGGED_OUT"] as const;
const RISKY_EVENT_TYPES = new Set(["auth.login.failed", "auth.mfa.failed", "security.rate_limited", "security.turnstile_failed", "security.suspicious"]);

function textMetadata(event: NormalizedCollectorEvent, key: string, maxLength: number) {
  const value = event.metadata[key];
  return typeof value === "string" && value.trim() && value.length <= maxLength ? value.trim() : undefined;
}

function dateMetadata(event: NormalizedCollectorEvent, key: string) {
  const value = textMetadata(event, key, 100);
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

async function upsertExternalUser(transaction: Prisma.TransactionClient, event: NormalizedCollectorEvent) {
  if (!event.externalUserId) return undefined;
  const email = textMetadata(event, "email", 320);
  const displayName = textMetadata(event, "displayName", 160);
  const user = await transaction.externalUser.upsert({
    where: { siteId_externalUserId: { siteId: event.siteId, externalUserId: event.externalUserId } },
    create: { organizationId: event.organizationId, siteId: event.siteId, externalUserId: event.externalUserId, email, displayName, firstSeenAt: event.occurredAt, lastSeenAt: event.occurredAt },
    update: { ...(email ? { email } : {}), ...(displayName ? { displayName } : {}) },
    select: { id: true },
  });
  await transaction.externalUser.updateMany({ where: { id: user.id, lastSeenAt: { lt: event.occurredAt } }, data: { lastSeenAt: event.occurredAt } });
  return user.id;
}

function riskLevel(score: number): RiskLevel {
  if (score >= 80) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 20) return "MEDIUM";
  return "LOW";
}

async function scoreEvent(transaction: Prisma.TransactionClient, event: NormalizedCollectorEvent, existingDeviceId?: string) {
  const reasons: string[] = [];
  let score = RISKY_EVENT_TYPES.has(event.eventType) ? 20 : 0;
  const since = new Date(event.occurredAt.getTime() - 15 * 60_000);
  if (event.eventType === "auth.login.failed") {
    const repeatedFailures = await transaction.loginAttempt.count({ where: { organizationId: event.organizationId, siteId: event.siteId, externalUserId: event.externalUserId, success: false, occurredAt: { gte: since } } });
    if (repeatedFailures >= 5) { score += 40; reasons.push("Repeated failed login"); }
  }
  if (!existingDeviceId && event.eventType === "auth.login.success") { score += 20; reasons.push("New device"); }
  if (event.externalUserId && event.enrichment.geo.country) {
    const knownCountry = await transaction.loginAttempt.findFirst({ where: { organizationId: event.organizationId, siteId: event.siteId, externalUserId: event.externalUserId, success: true, country: { not: null, notIn: [event.enrichment.geo.country] } }, select: { id: true } });
    if (knownCountry) { score += 20; reasons.push("New country"); }
  }
  if (event.eventType === "session.refreshed" && event.externalSessionId) {
    const revoked = await transaction.siteSession.findUnique({ where: { siteId_externalSessionId: { siteId: event.siteId, externalSessionId: event.externalSessionId } }, select: { status: true } });
    if (revoked?.status === "REVOKED") { score += 60; reasons.push("Revoked session reuse"); }
  }
  if (event.eventType.startsWith("security.")) reasons.push("Security signal reported");
  const cappedScore = Math.min(score, 100);
  return { riskScore: cappedScore, riskLevel: riskLevel(cappedScore), riskReasons: reasons };
}

async function upsertDevice(transaction: Prisma.TransactionClient, event: NormalizedCollectorEvent, externalUserRecordId: string) {
  const suppliedDeviceId = textMetadata(event, "deviceId", 256);
  const fallback = createHash("sha256").update(`${event.siteId}:${event.externalSessionId}`).digest("hex").slice(0, 32);
  const deviceKey = suppliedDeviceId ?? `unknown_${fallback}`;
  const friendlyName = textMetadata(event, "deviceName", 160) ?? event.enrichment.device.friendlyName;
  const device = await transaction.device.upsert({
    where: { siteId_deviceKey: { siteId: event.siteId, deviceKey } },
    create: { organizationId: event.organizationId, siteId: event.siteId, externalUserRecordId, deviceKey, friendlyName, type: event.enrichment.device.type, vendor: event.enrichment.device.vendor, model: event.enrichment.device.model, browser: event.enrichment.device.browser, browserVersion: event.enrichment.device.browserVersion, os: event.enrichment.device.os, osVersion: event.enrichment.device.osVersion, firstSeenAt: event.occurredAt, lastSeenAt: event.occurredAt, lastIpAddress: event.enrichment.ipAddress },
    update: { externalUserRecordId, friendlyName, type: event.enrichment.device.type, vendor: event.enrichment.device.vendor, model: event.enrichment.device.model, browser: event.enrichment.device.browser, browserVersion: event.enrichment.device.browserVersion, os: event.enrichment.device.os, osVersion: event.enrichment.device.osVersion, lastIpAddress: event.enrichment.ipAddress },
    select: { id: true, firstSeenAt: true },
  });
  await transaction.device.updateMany({ where: { id: device.id, lastSeenAt: { lt: event.occurredAt } }, data: { lastSeenAt: event.occurredAt } });
  return { id: device.id, isNew: device.firstSeenAt.getTime() === event.occurredAt.getTime() };
}

async function upsertSession(transaction: Prisma.TransactionClient, event: NormalizedCollectorEvent, externalUserRecordId?: string, deviceId?: string, risk?: Awaited<ReturnType<typeof scoreEvent>>) {
  if (!event.externalSessionId) return undefined;
  const expiresAt = dateMetadata(event, "expiresAt");
  const session = await transaction.siteSession.upsert({
    where: { siteId_externalSessionId: { siteId: event.siteId, externalSessionId: event.externalSessionId } },
    create: { organizationId: event.organizationId, siteId: event.siteId, externalSessionId: event.externalSessionId, externalUserRecordId, deviceId, status: "ACTIVE", startedAt: event.occurredAt, lastActiveAt: event.occurredAt, expiresAt, ipAddress: event.enrichment.ipAddress, userAgent: event.enrichment.userAgent, country: event.enrichment.geo.country, region: event.enrichment.geo.region, city: event.enrichment.geo.city, timezone: event.enrichment.geo.timezone, asn: event.enrichment.geo.asn, isp: event.enrichment.geo.isp, ...(risk ? { riskScore: risk.riskScore, riskLevel: risk.riskLevel } : {}) },
    update: { ...(externalUserRecordId ? { externalUserRecordId } : {}), ...(deviceId ? { deviceId } : {}), ...(expiresAt ? { expiresAt } : {}), ipAddress: event.enrichment.ipAddress, userAgent: event.enrichment.userAgent, country: event.enrichment.geo.country, region: event.enrichment.geo.region, city: event.enrichment.geo.city, timezone: event.enrichment.geo.timezone, asn: event.enrichment.geo.asn, isp: event.enrichment.geo.isp, ...(risk ? { riskScore: risk.riskScore, riskLevel: risk.riskLevel } : {}) },
    select: { id: true },
  });
  await transaction.siteSession.updateMany({ where: { id: session.id, status: { notIn: [...TERMINAL_SESSION_STATUSES] }, lastActiveAt: { lt: event.occurredAt } }, data: { lastActiveAt: event.occurredAt, status: "ACTIVE" } });
  return session.id;
}

async function processLoginSuccess(transaction: Prisma.TransactionClient, securityEventId: string, event: NormalizedCollectorEvent) {
  const externalUserRecordId = await upsertExternalUser(transaction, event);
  if (!externalUserRecordId) return;
  const device = await upsertDevice(transaction, event, externalUserRecordId);
  const risk = await scoreEvent(transaction, event, device.isNew ? undefined : device.id);
  const siteSessionId = await upsertSession(transaction, event, externalUserRecordId, device.id, risk);
  await transaction.loginAttempt.create({ data: { organizationId: event.organizationId, siteId: event.siteId, eventId: event.eventId, externalUserRecordId, deviceId: device.id, externalUserId: event.externalUserId, success: true, occurredAt: event.occurredAt, ipAddress: event.enrichment.ipAddress, userAgent: event.enrichment.userAgent, country: event.enrichment.geo.country, region: event.enrichment.geo.region, city: event.enrichment.geo.city, riskScore: risk.riskScore, riskLevel: risk.riskLevel } });
  await transaction.securityEvent.update({ where: { id: securityEventId }, data: { externalUserRecordId, deviceId: device.id, siteSessionId, riskScore: risk.riskScore, riskLevel: risk.riskLevel, riskReasons: risk.riskReasons as Prisma.InputJsonValue } });
}

async function processLoginFailure(transaction: Prisma.TransactionClient, securityEventId: string, event: NormalizedCollectorEvent) {
  const existingUser = event.externalUserId ? await transaction.externalUser.findUnique({ where: { siteId_externalUserId: { siteId: event.siteId, externalUserId: event.externalUserId } }, select: { id: true } }) : null;
  const risk = await scoreEvent(transaction, event);
  await transaction.loginAttempt.create({ data: { organizationId: event.organizationId, siteId: event.siteId, eventId: event.eventId, externalUserRecordId: existingUser?.id, externalUserId: event.externalUserId, success: false, failureReason: textMetadata(event, "failureReason", 250) ?? "Unspecified", occurredAt: event.occurredAt, ipAddress: event.enrichment.ipAddress, userAgent: event.enrichment.userAgent, country: event.enrichment.geo.country, region: event.enrichment.geo.region, city: event.enrichment.geo.city, riskScore: risk.riskScore, riskLevel: risk.riskLevel } });
  await transaction.securityEvent.update({ where: { id: securityEventId }, data: { ...(existingUser ? { externalUserRecordId: existingUser.id } : {}), riskScore: risk.riskScore, riskLevel: risk.riskLevel, riskReasons: risk.riskReasons as Prisma.InputJsonValue } });
}

async function refreshSession(transaction: Prisma.TransactionClient, securityEventId: string, event: NormalizedCollectorEvent) {
  if (!event.externalSessionId) return;
  const session = await transaction.siteSession.findUnique({ where: { siteId_externalSessionId: { siteId: event.siteId, externalSessionId: event.externalSessionId } }, select: { id: true, externalUserRecordId: true, deviceId: true, lastActiveAt: true, status: true } });
  const risk = await scoreEvent(transaction, event);
  if (!session || TERMINAL_SESSION_STATUSES.includes(session.status as (typeof TERMINAL_SESSION_STATUSES)[number])) {
    await transaction.securityEvent.update({ where: { id: securityEventId }, data: { riskScore: risk.riskScore, riskLevel: risk.riskLevel, riskReasons: risk.riskReasons as Prisma.InputJsonValue } });
    return;
  }
  await transaction.securityEvent.update({ where: { id: securityEventId }, data: { siteSessionId: session.id, externalUserRecordId: session.externalUserRecordId, deviceId: session.deviceId, riskScore: risk.riskScore, riskLevel: risk.riskLevel, riskReasons: risk.riskReasons as Prisma.InputJsonValue } });
  if (event.occurredAt.getTime() - session.lastActiveAt.getTime() < SESSION_REFRESH_THROTTLE_MS) return;
  await transaction.siteSession.updateMany({ where: { id: session.id, lastActiveAt: session.lastActiveAt }, data: { lastActiveAt: event.occurredAt, status: "ACTIVE", ipAddress: event.enrichment.ipAddress, userAgent: event.enrichment.userAgent, country: event.enrichment.geo.country, region: event.enrichment.geo.region, city: event.enrichment.geo.city, timezone: event.enrichment.geo.timezone, asn: event.enrichment.geo.asn, isp: event.enrichment.geo.isp } });
}

async function endSession(transaction: Prisma.TransactionClient, securityEventId: string, event: NormalizedCollectorEvent, status: "LOGGED_OUT" | "REVOKED" | "EXPIRED") {
  if (!event.externalSessionId) return;
  const session = await transaction.siteSession.findUnique({ where: { siteId_externalSessionId: { siteId: event.siteId, externalSessionId: event.externalSessionId } }, select: { id: true, externalUserRecordId: true, deviceId: true } });
  if (!session) return;
  await transaction.siteSession.updateMany({
    where: { id: session.id, lastActiveAt: { lte: event.occurredAt } },
    data: { status, lastActiveAt: event.occurredAt, ...(status === "LOGGED_OUT" ? { logoutAt: event.occurredAt } : {}), ...(status === "REVOKED" ? { revokedAt: event.occurredAt } : {}) },
  });
  await transaction.securityEvent.update({ where: { id: securityEventId }, data: { siteSessionId: session.id, externalUserRecordId: session.externalUserRecordId, deviceId: session.deviceId } });
}

async function scoreGenericEvent(transaction: Prisma.TransactionClient, securityEventId: string, event: NormalizedCollectorEvent) {
  const risk = await scoreEvent(transaction, event);
  if (risk.riskScore === 0) return;
  await transaction.securityEvent.update({ where: { id: securityEventId }, data: { riskScore: risk.riskScore, riskLevel: risk.riskLevel, riskReasons: risk.riskReasons as Prisma.InputJsonValue } });
}

export async function processCollectorEvent(transaction: Prisma.TransactionClient, securityEventId: string, event: NormalizedCollectorEvent) {
  switch (event.eventType) {
    case "auth.login.success": return processLoginSuccess(transaction, securityEventId, event);
    case "auth.login.failed": return processLoginFailure(transaction, securityEventId, event);
    case "session.created": {
      const externalUserRecordId = await upsertExternalUser(transaction, event);
      const device = externalUserRecordId ? await upsertDevice(transaction, event, externalUserRecordId) : undefined;
      const risk = await scoreEvent(transaction, event, device?.isNew ? undefined : device?.id);
      const siteSessionId = await upsertSession(transaction, event, externalUserRecordId, device?.id, risk);
      if (siteSessionId || externalUserRecordId || device) await transaction.securityEvent.update({ where: { id: securityEventId }, data: { siteSessionId, externalUserRecordId, deviceId: device?.id, riskScore: risk.riskScore, riskLevel: risk.riskLevel, riskReasons: risk.riskReasons as Prisma.InputJsonValue } });
      return;
    }
    case "session.refreshed": return refreshSession(transaction, securityEventId, event);
    case "auth.logout": return endSession(transaction, securityEventId, event, "LOGGED_OUT");
    case "session.revoked": return endSession(transaction, securityEventId, event, "REVOKED");
    case "session.expired": return endSession(transaction, securityEventId, event, "EXPIRED");
    default: return scoreGenericEvent(transaction, securityEventId, event);
  }
}
