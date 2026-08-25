import "server-only";
import { randomBytes } from "node:crypto";
import { getPrisma } from "@/server/db/client";
import { AppError } from "@/server/http/errors";
import { generateSiteCredential, generateSiteId } from "@/server/sites/credential";
import { normalizeSiteDomain, siteSlug } from "@/server/sites/domain";
import type { CreateCredentialInput, CreateSiteInput, UpdateSiteInput } from "@/server/sites/schemas";

type Actor = { organizationId: string; userId: string };

function isUniqueConflict(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

async function availableSlug(organizationId: string, name: string) {
  const base = siteSlug(name);
  const prisma = getPrisma();
  const exists = await prisma.site.findUnique({ where: { organizationId_slug: { organizationId, slug: base } }, select: { id: true } });
  return exists ? `${base}-${randomBytes(3).toString("hex")}` : base;
}

export async function listSites(actor: Actor) {
  return getPrisma().site.findMany({
    where: { organizationId: actor.organizationId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, slug: true, domain: true, environment: true, status: true,
      securityMode: true, retentionDays: true, verifiedAt: true, lastEventAt: true,
      createdAt: true, updatedAt: true,
      _count: { select: { sessions: true, securityEvents: true, credentials: true } },
    },
  });
}

export async function createSiteWithCredential(actor: Actor, input: CreateSiteInput) {
  const domain = normalizeSiteDomain(input.domain, input.environment);
  const slug = await availableSlug(actor.organizationId, input.name);
  const siteId = generateSiteId();
  const generated = generateSiteCredential(input.environment);
  try {
    const result = await getPrisma().$transaction(async (transaction) => {
      const site = await transaction.site.create({
        data: {
          id: siteId,
          organizationId: actor.organizationId,
          name: input.name,
          slug,
          domain,
          environment: input.environment,
          status: "PENDING_VERIFICATION",
          securityMode: input.securityMode,
          retentionDays: input.retentionDays,
        },
        select: { id: true, name: true, slug: true, domain: true, environment: true, status: true, securityMode: true, retentionDays: true, createdAt: true },
      });
      const credential = await transaction.siteApiCredential.create({
        data: {
          organizationId: actor.organizationId,
          siteId,
          name: `${input.name} collector`,
          keyPrefix: generated.keyPrefix,
          secretHash: generated.secretHash,
          environment: input.environment,
        },
        select: { id: true, name: true, keyPrefix: true, environment: true, createdAt: true },
      });
      await transaction.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          siteId,
          actorId: actor.userId,
          action: "SITE_CREATED",
          targetType: "SITE",
          targetId: siteId,
          metadata: { name: input.name, domain, environment: input.environment, initialKeyPrefix: generated.keyPrefix },
        },
      });
      return { site, credential };
    });
    return { ...result, secret: generated.secret };
  } catch (error) {
    if (isUniqueConflict(error)) throw new AppError("CONFLICT", 409, "A website with this domain, environment, or credential prefix already exists");
    throw error;
  }
}

export async function updateSite(actor: Actor, siteId: string, input: UpdateSiteInput) {
  const current = await getPrisma().site.findFirst({ where: { id: siteId, organizationId: actor.organizationId, deletedAt: null }, select: { environment: true, domain: true } });
  if (!current) throw new AppError("NOT_FOUND", 404, "Website not found");
  const environment = input.environment ?? current.environment;
  const data = {
    ...input,
    ...((input.domain || input.environment) ? { domain: normalizeSiteDomain(input.domain ?? current.domain, environment) } : {}),
  };
  try {
    return await getPrisma().$transaction(async (transaction) => {
      const site = await transaction.site.update({ where: { id: siteId }, data, select: { id: true, name: true, slug: true, domain: true, environment: true, status: true, securityMode: true, retentionDays: true, updatedAt: true } });
      await transaction.auditLog.create({ data: { organizationId: actor.organizationId, siteId, actorId: actor.userId, action: "SITE_UPDATED", targetType: "SITE", targetId: siteId, metadata: { fields: Object.keys(input) } } });
      return site;
    });
  } catch (error) {
    if (isUniqueConflict(error)) throw new AppError("CONFLICT", 409, "A website with this domain and environment already exists");
    throw error;
  }
}

export async function softDeleteSite(actor: Actor, siteId: string) {
  return getPrisma().$transaction(async (transaction) => {
    const updated = await transaction.site.updateMany({ where: { id: siteId, organizationId: actor.organizationId, deletedAt: null }, data: { deletedAt: new Date(), status: "INACTIVE" } });
    if (updated.count === 0) throw new AppError("NOT_FOUND", 404, "Website not found");
    await transaction.siteApiCredential.updateMany({ where: { organizationId: actor.organizationId, siteId, revokedAt: null }, data: { revokedAt: new Date() } });
    await transaction.auditLog.create({ data: { organizationId: actor.organizationId, siteId, actorId: actor.userId, action: "SITE_DELETED", targetType: "SITE", targetId: siteId } });
    return { id: siteId, deleted: true };
  });
}

export async function listCredentials(actor: Actor) {
  return getPrisma().siteApiCredential.findMany({
    where: { organizationId: actor.organizationId, site: { deletedAt: null } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, siteId: true, name: true, keyPrefix: true, environment: true,
      createdAt: true, lastUsedAt: true, expiresAt: true, revokedAt: true,
      site: { select: { name: true } },
    },
  });
}

export async function createCredential(actor: Actor, input: CreateCredentialInput) {
  const site = await getPrisma().site.findFirst({ where: { id: input.siteId, organizationId: actor.organizationId, deletedAt: null }, select: { id: true } });
  if (!site) throw new AppError("NOT_FOUND", 404, "Website not found");
  const generated = generateSiteCredential(input.environment);
  const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
  if (expiresAt && expiresAt <= new Date()) throw new AppError("BAD_REQUEST", 400, "Credential expiration must be in the future");
  const credential = await getPrisma().$transaction(async (transaction) => {
    const created = await transaction.siteApiCredential.create({ data: { organizationId: actor.organizationId, siteId: input.siteId, name: input.name, keyPrefix: generated.keyPrefix, secretHash: generated.secretHash, environment: input.environment, expiresAt }, select: { id: true, siteId: true, name: true, keyPrefix: true, environment: true, createdAt: true, expiresAt: true } });
    await transaction.auditLog.create({ data: { organizationId: actor.organizationId, siteId: input.siteId, actorId: actor.userId, action: "API_KEY_CREATED", targetType: "SITE_API_CREDENTIAL", targetId: created.id, metadata: { name: input.name, keyPrefix: generated.keyPrefix, environment: input.environment } } });
    return created;
  });
  return { credential, secret: generated.secret };
}

export async function rotateCredential(actor: Actor, credentialId: string) {
  const current = await getPrisma().siteApiCredential.findFirst({ where: { id: credentialId, organizationId: actor.organizationId, revokedAt: null, site: { deletedAt: null } }, select: { id: true, siteId: true, name: true, environment: true, expiresAt: true, keyPrefix: true } });
  if (!current) throw new AppError("NOT_FOUND", 404, "Active credential not found");
  const generated = generateSiteCredential(current.environment);
  const credential = await getPrisma().$transaction(async (transaction) => {
    const revoked = await transaction.siteApiCredential.updateMany({ where: { id: current.id, organizationId: actor.organizationId, revokedAt: null }, data: { revokedAt: new Date() } });
    if (revoked.count !== 1) throw new AppError("CONFLICT", 409, "Credential was already changed");
    const created = await transaction.siteApiCredential.create({ data: { organizationId: actor.organizationId, siteId: current.siteId, name: current.name, keyPrefix: generated.keyPrefix, secretHash: generated.secretHash, environment: current.environment, expiresAt: current.expiresAt }, select: { id: true, siteId: true, name: true, keyPrefix: true, environment: true, createdAt: true, expiresAt: true } });
    await transaction.auditLog.create({ data: { organizationId: actor.organizationId, siteId: current.siteId, actorId: actor.userId, action: "API_KEY_ROTATED", targetType: "SITE_API_CREDENTIAL", targetId: created.id, metadata: { previousCredentialId: current.id, previousKeyPrefix: current.keyPrefix, newKeyPrefix: generated.keyPrefix } } });
    return created;
  });
  return { credential, secret: generated.secret };
}

export async function revokeCredential(actor: Actor, credentialId: string) {
  return getPrisma().$transaction(async (transaction) => {
    const current = await transaction.siteApiCredential.findFirst({ where: { id: credentialId, organizationId: actor.organizationId }, select: { id: true, siteId: true, keyPrefix: true, revokedAt: true } });
    if (!current) throw new AppError("NOT_FOUND", 404, "Credential not found");
    if (current.revokedAt) return { id: current.id, revokedAt: current.revokedAt };
    const revokedAt = new Date();
    await transaction.siteApiCredential.update({ where: { id: current.id }, data: { revokedAt } });
    await transaction.auditLog.create({ data: { organizationId: actor.organizationId, siteId: current.siteId, actorId: actor.userId, action: "API_KEY_REVOKED", targetType: "SITE_API_CREDENTIAL", targetId: current.id, metadata: { keyPrefix: current.keyPrefix } } });
    return { id: current.id, revokedAt };
  });
}
