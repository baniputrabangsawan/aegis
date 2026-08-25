import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/server/db/client";

type TenantActor = { organizationId: string };

function startOfToday(now: Date) {
  const value = new Date(now);
  value.setHours(0, 0, 0, 0);
  return value;
}

const nonTerminal = ["ACTIVE", "IDLE", "INACTIVE"] as const;
const elevatedRisks = ["HIGH", "CRITICAL"] as const;
const adminActionTerms = ["organization.", "member.", "invitation.", "site.", "api_key.", "settings.", "admin."];
const securityActionTerms = ["security.", "security_event.", "blocked_ip.", "session.revoke", "investigation."];
const policyActionTerms = ["policy.", "settings.", "blocked_ip.", "api_key.", "create", "update", "delete", "revoke", "rotate"];

export function effectiveSessionStatus(session: { status: string; lastActiveAt: Date; expiresAt: Date | null }, now = new Date()) {
  if (["EXPIRED", "REVOKED", "LOGGED_OUT"].includes(session.status)) return session.status;
  if (session.expiresAt && session.expiresAt <= now) return "EXPIRED";
  const idleMs = now.getTime() - session.lastActiveAt.getTime();
  if (idleMs < 5 * 60_000) return "ACTIVE";
  if (idleMs <= 30 * 60_000) return "IDLE";
  return "INACTIVE";
}

export async function getUsersMonitoring(actor: TenantActor, now = new Date()) {
  const prisma = getPrisma();
  const today = startOfToday(now);
  const activeSince = new Date(now.getTime() - 5 * 60_000);
  const where: Prisma.ExternalUserWhereInput = { organizationId: actor.organizationId, site: { deletedAt: null } };
  const [rows, total, online, newToday, elevatedRisk] = await Promise.all([
    prisma.externalUser.findMany({ where, orderBy: { lastSeenAt: "desc" }, take: 250, select: { id: true, externalUserId: true, email: true, displayName: true, status: true, riskLevel: true, firstSeenAt: true, lastSeenAt: true, site: { select: { name: true } }, _count: { select: { sessions: true, devices: true } } } }),
    prisma.externalUser.count({ where }),
    prisma.externalUser.count({ where: { ...where, sessions: { some: { status: { in: [...nonTerminal] }, lastActiveAt: { gte: activeSince }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } } } }),
    prisma.externalUser.count({ where: { ...where, firstSeenAt: { gte: today } } }),
    prisma.externalUser.count({ where: { ...where, riskLevel: { in: ["HIGH", "CRITICAL"] } } }),
  ]);
  return { rows, stats: { total, online, newToday, elevatedRisk } };
}

export async function getSessionsMonitoring(actor: TenantActor, now = new Date()) {
  const prisma = getPrisma();
  const today = startOfToday(now);
  const activeSince = new Date(now.getTime() - 5 * 60_000);
  const idleSince = new Date(now.getTime() - 30 * 60_000);
  const where: Prisma.SiteSessionWhereInput = { organizationId: actor.organizationId, site: { deletedAt: null } };
  const live: Prisma.SiteSessionWhereInput = { status: { in: [...nonTerminal] }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] };
  const [rows, active, idle, inactive, endedToday] = await Promise.all([
    prisma.siteSession.findMany({ where, orderBy: { lastActiveAt: "desc" }, take: 250, select: { id: true, externalSessionId: true, status: true, riskLevel: true, startedAt: true, lastActiveAt: true, expiresAt: true, ipAddress: true, site: { select: { name: true } }, externalUser: { select: { externalUserId: true, email: true, displayName: true } }, device: { select: { friendlyName: true } } } }),
    prisma.siteSession.count({ where: { ...where, ...live, lastActiveAt: { gte: activeSince } } }),
    prisma.siteSession.count({ where: { ...where, ...live, lastActiveAt: { gte: idleSince, lt: activeSince } } }),
    prisma.siteSession.count({ where: { ...where, ...live, lastActiveAt: { lt: idleSince } } }),
    prisma.siteSession.count({ where: { ...where, status: { in: ["EXPIRED", "REVOKED", "LOGGED_OUT"] }, updatedAt: { gte: today } } }),
  ]);
  return { rows, stats: { active, idle, inactive, endedToday } };
}

export async function getSessionDetail(actor: TenantActor, sessionId: string) {
  return getPrisma().siteSession.findFirst({
    where: { id: sessionId, organizationId: actor.organizationId, site: { deletedAt: null } },
    select: {
      id: true,
      externalSessionId: true,
      status: true,
      ipAddress: true,
      userAgent: true,
      country: true,
      region: true,
      city: true,
      timezone: true,
      asn: true,
      isp: true,
      riskScore: true,
      riskLevel: true,
      startedAt: true,
      lastActiveAt: true,
      expiresAt: true,
      logoutAt: true,
      revokedAt: true,
      site: { select: { name: true, domain: true, environment: true } },
      externalUser: { select: { externalUserId: true, email: true, displayName: true, status: true } },
      device: { select: { friendlyName: true, type: true, vendor: true, model: true, browser: true, browserVersion: true, os: true, osVersion: true, status: true } },
      securityEvents: {
        orderBy: { occurredAt: "desc" },
        take: 50,
        select: { id: true, eventType: true, ipAddress: true, riskScore: true, riskLevel: true, status: true, occurredAt: true },
      },
    },
  });
}

export async function getLoginActivityMonitoring(actor: TenantActor, now = new Date()) {
  const prisma = getPrisma();
  const today = startOfToday(now);
  const where: Prisma.LoginAttemptWhereInput = { organizationId: actor.organizationId, site: { deletedAt: null } };
  const [rows, successful, failed, highRisk] = await Promise.all([
    prisma.loginAttempt.findMany({ where, orderBy: { occurredAt: "desc" }, take: 250, select: { id: true, externalUserId: true, success: true, failureReason: true, ipAddress: true, riskLevel: true, occurredAt: true, site: { select: { name: true } }, externalUser: { select: { email: true, displayName: true } }, device: { select: { friendlyName: true } } } }),
    prisma.loginAttempt.count({ where: { ...where, success: true, occurredAt: { gte: today } } }),
    prisma.loginAttempt.count({ where: { ...where, success: false, occurredAt: { gte: today } } }),
    prisma.loginAttempt.count({ where: { ...where, riskLevel: { in: ["HIGH", "CRITICAL"] }, occurredAt: { gte: today } } }),
  ]);
  const total = successful + failed;
  return { rows, stats: { successful, failed, successRate: total === 0 ? 0 : successful / total, highRisk } };
}

export async function getDevicesMonitoring(actor: TenantActor, now = new Date()) {
  const prisma = getPrisma();
  const today = startOfToday(now);
  const where: Prisma.DeviceWhereInput = { organizationId: actor.organizationId, site: { deletedAt: null } };
  const [rows, known, newToday, suspicious, revoked] = await Promise.all([
    prisma.device.findMany({ where, orderBy: { lastSeenAt: "desc" }, take: 250, select: { id: true, friendlyName: true, type: true, browser: true, browserVersion: true, os: true, osVersion: true, status: true, firstSeenAt: true, lastSeenAt: true, lastIpAddress: true, site: { select: { name: true } }, externalUser: { select: { externalUserId: true, email: true, displayName: true } }, sessions: { orderBy: { lastActiveAt: "desc" }, take: 1, select: { country: true, region: true, city: true, timezone: true } } } }),
    prisma.device.count({ where: { ...where, status: "KNOWN" } }),
    prisma.device.count({ where: { ...where, firstSeenAt: { gte: today } } }),
    prisma.device.count({ where: { ...where, status: "SUSPICIOUS" } }),
    prisma.device.count({ where: { ...where, status: "REVOKED" } }),
  ]);
  return { rows, stats: { known, newToday, suspicious, revoked } };
}

export async function getSecurityEventsMonitoring(actor: TenantActor, now = new Date()) {
  const prisma = getPrisma();
  const today = startOfToday(now);
  const where: Prisma.SecurityEventWhereInput = { organizationId: actor.organizationId, site: { deletedAt: null } };
  const [rows, open, critical, investigating, resolvedToday] = await Promise.all([
    prisma.securityEvent.findMany({ where, orderBy: { occurredAt: "desc" }, take: 250, select: { id: true, eventType: true, ipAddress: true, riskLevel: true, status: true, occurredAt: true, site: { select: { name: true } }, externalUser: { select: { externalUserId: true, email: true, displayName: true } } } }),
    prisma.securityEvent.count({ where: { ...where, status: "OPEN" } }),
    prisma.securityEvent.count({ where: { ...where, riskLevel: "CRITICAL", status: { notIn: ["RESOLVED", "DISMISSED"] } } }),
    prisma.securityEvent.count({ where: { ...where, status: "INVESTIGATING" } }),
    prisma.securityEvent.count({ where: { ...where, status: "RESOLVED", updatedAt: { gte: today } } }),
  ]);
  return { rows, stats: { open, critical, investigating, resolvedToday } };
}

export async function getBlockedIpsMonitoring(actor: TenantActor, now = new Date()) {
  const prisma = getPrisma();
  const tomorrow = startOfToday(new Date(now.getTime() + 24 * 60 * 60_000));
  const where: Prisma.BlockedIPWhereInput = { organizationId: actor.organizationId };
  const [rows, active, global, siteScoped, expiringToday] = await Promise.all([
    prisma.blockedIP.findMany({ where, orderBy: { createdAt: "desc" }, take: 250, select: { id: true, ipAddress: true, scope: true, reason: true, status: true, createdAt: true, expiresAt: true, site: { select: { name: true } }, blockedBy: { select: { name: true, email: true } } } }),
    prisma.blockedIP.count({ where: { ...where, status: "ACTIVE" } }),
    prisma.blockedIP.count({ where: { ...where, scope: "GLOBAL", status: "ACTIVE" } }),
    prisma.blockedIP.count({ where: { ...where, scope: "SITE", status: "ACTIVE" } }),
    prisma.blockedIP.count({ where: { ...where, status: "ACTIVE", expiresAt: { gte: now, lt: tomorrow } } }),
  ]);
  return { rows, stats: { active, global, siteScoped, expiringToday } };
}

function actionContains(terms: readonly string[]): Prisma.AuditLogWhereInput {
  return { OR: terms.map((term) => ({ action: { contains: term } })) };
}

export async function getAuditLogsMonitoring(actor: TenantActor, now = new Date()) {
  const prisma = getPrisma();
  const today = startOfToday(now);
  const where: Prisma.AuditLogWhereInput = { organizationId: actor.organizationId };
  const todayWhere: Prisma.AuditLogWhereInput = { ...where, createdAt: { gte: today } };
  const [rows, eventsToday, adminActions, securityActions, policyChanges] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 250, select: { id: true, action: true, targetType: true, targetId: true, metadata: true, actorIp: true, createdAt: true, site: { select: { name: true } }, actor: { select: { name: true, email: true } } } }),
    prisma.auditLog.count({ where: todayWhere }),
    prisma.auditLog.count({ where: { ...todayWhere, ...actionContains(adminActionTerms) } }),
    prisma.auditLog.count({ where: { ...todayWhere, ...actionContains(securityActionTerms) } }),
    prisma.auditLog.count({ where: { ...todayWhere, ...actionContains(policyActionTerms) } }),
  ]);
  return { rows, stats: { eventsToday, adminActions, securityActions, policyChanges } };
}

export async function getLiveMonitoring(actor: TenantActor, now = new Date()) {
  const prisma = getPrisma();
  const minuteAgo = new Date(now.getTime() - 60_000);
  const today = startOfToday(now);
  const where: Prisma.SecurityEventWhereInput = { organizationId: actor.organizationId, site: { deletedAt: null } };
  const [rows, eventsPerMinute, connectedSites, totalSites, success, failed, alertsPerMinute] = await Promise.all([
    prisma.securityEvent.findMany({ where, orderBy: { occurredAt: "desc" }, take: 80, select: { id: true, eventType: true, ipAddress: true, riskLevel: true, occurredAt: true, site: { select: { name: true } }, externalUser: { select: { externalUserId: true, email: true, displayName: true } }, device: { select: { friendlyName: true } } } }),
    prisma.securityEvent.count({ where: { ...where, occurredAt: { gte: minuteAgo } } }),
    prisma.site.count({ where: { organizationId: actor.organizationId, deletedAt: null, status: "ACTIVE" } }),
    prisma.site.count({ where: { organizationId: actor.organizationId, deletedAt: null } }),
    prisma.loginAttempt.count({ where: { organizationId: actor.organizationId, site: { deletedAt: null }, success: true, occurredAt: { gte: today } } }),
    prisma.loginAttempt.count({ where: { organizationId: actor.organizationId, site: { deletedAt: null }, success: false, occurredAt: { gte: today } } }),
    prisma.securityEvent.count({ where: { ...where, riskLevel: { in: [...elevatedRisks] }, occurredAt: { gte: minuteAgo } } }),
  ]);
  const totalLogins = success + failed;
  return { rows, stats: { eventsPerMinute, connectedSites, totalSites, loginSuccessRate: totalLogins === 0 ? 0 : success / totalLogins, alertsPerMinute } };
}

export async function getOverviewMonitoring(actor: TenantActor, now = new Date()) {
  const prisma = getPrisma();
  const today = startOfToday(now);
  const activeSince = new Date(now.getTime() - 5 * 60_000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60_000);
  const tenantSites: Prisma.SiteWhereInput = { organizationId: actor.organizationId, deletedAt: null };
  const [siteRows, siteCount, activeSites, users, activeSessions, successful, failed, alerts, deviceGroups, browserGroups, osGroups, hourlyLogins] = await Promise.all([
    prisma.site.findMany({ where: tenantSites, orderBy: { lastEventAt: "desc" }, take: 100, select: { id: true, name: true, domain: true, status: true, lastEventAt: true, _count: { select: { sessions: true, loginAttempts: true, securityEvents: true } } } }),
    prisma.site.count({ where: tenantSites }),
    prisma.site.count({ where: { ...tenantSites, status: "ACTIVE" } }),
    prisma.externalUser.count({ where: { organizationId: actor.organizationId, site: { deletedAt: null } } }),
    prisma.siteSession.count({ where: { organizationId: actor.organizationId, site: { deletedAt: null }, status: { in: [...nonTerminal] }, lastActiveAt: { gte: activeSince }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } }),
    prisma.loginAttempt.count({ where: { organizationId: actor.organizationId, site: { deletedAt: null }, success: true, occurredAt: { gte: today } } }),
    prisma.loginAttempt.count({ where: { organizationId: actor.organizationId, site: { deletedAt: null }, success: false, occurredAt: { gte: today } } }),
    prisma.securityEvent.count({ where: { organizationId: actor.organizationId, site: { deletedAt: null }, riskLevel: { in: [...elevatedRisks] }, status: { notIn: ["RESOLVED", "DISMISSED"] } } }),
    prisma.device.groupBy({ by: ["type"], where: { organizationId: actor.organizationId, site: { deletedAt: null } }, _count: { _all: true } }),
    prisma.device.groupBy({ by: ["browser"], where: { organizationId: actor.organizationId, site: { deletedAt: null } }, _count: { _all: true } }),
    prisma.device.groupBy({ by: ["os"], where: { organizationId: actor.organizationId, site: { deletedAt: null } }, _count: { _all: true } }),
    prisma.loginAttempt.findMany({ where: { organizationId: actor.organizationId, site: { deletedAt: null }, occurredAt: { gte: dayAgo } }, select: { success: true, occurredAt: true } }),
  ]);
  const percentize = (groups: { _count: { _all: number } }[]) => {
    const total = groups.reduce((sum, item) => sum + item._count._all, 0) || 1;
    return (count: number) => Math.round((count / total) * 100);
  };
  const loginChart = Array.from({ length: 8 }, (_, index) => {
    const hour = new Date(now.getTime() - (7 - index) * 3 * 60 * 60_000);
    return { time: hour.toISOString(), success: 0, failed: 0 };
  });
  for (const login of hourlyLogins) {
    const index = Math.min(7, Math.max(0, Math.floor((login.occurredAt.getTime() - dayAgo.getTime()) / (3 * 60 * 60_000))));
    if (login.success) loginChart[index].success += 1; else loginChart[index].failed += 1;
  }
  const totalLogins = successful + failed;
  return {
    successRate: totalLogins === 0 ? 0 : successful / totalLogins,
    metrics: [
      { label: "Sites", value: String(siteCount), trend: `${activeSites} active`, note: "connected collectors", icon: "sites" },
      { label: "Users", value: String(users), trend: "Live", note: "external identities", icon: "users" },
      { label: "Active sessions", value: String(activeSessions), trend: "Now", note: "last 5 minutes", icon: "sessions" },
      { label: "Failed logins", value: String(failed), trend: "Today", note: `${successful} successful`, icon: "failed", danger: failed > 0 },
      { label: "Open alerts", value: String(alerts), trend: "Elevated", note: "high or critical", icon: "alert", danger: alerts > 0 },
    ],
    distributions: {
      device: deviceGroups.map((item) => ({ name: item.type, value: percentize(deviceGroups)(item._count._all) })),
      browser: browserGroups.map((item) => ({ name: item.browser, value: percentize(browserGroups)(item._count._all) })),
      os: osGroups.map((item) => ({ name: item.os, value: percentize(osGroups)(item._count._all) })),
    },
    loginChart,
    sites: siteRows.map((site) => ({ id: site.id, name: site.name, domain: site.domain, status: site.status, online: site.lastEventAt && site.lastEventAt >= activeSince ? 1 : 0, sessions: site._count.sessions, logins: site._count.loginAttempts, failed: 0, alerts: site._count.securityEvents, risk: site._count.securityEvents > 0 ? "Medium" : "Low", lastEvent: site.lastEventAt ? site.lastEventAt.toLocaleString("en") : "Never" })),
  };
}
