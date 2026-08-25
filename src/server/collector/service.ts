import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/server/db/client";
import type { CollectorCredential } from "@/server/collector/auth";
import { normalizeMetadata, type CollectorEventInput, type SafeJson } from "@/server/collector/schemas";
import { enrichmentMetadata, type RequestEnrichment } from "@/server/collector/enrichment";
import { processCollectorEvent } from "@/server/collector/processor";
import { AppError } from "@/server/http/errors";

export type NormalizedCollectorEvent = {
  organizationId: string; siteId: string; eventId: string; eventType: string;
  externalUserId?: string; externalSessionId?: string; occurredAt: Date; metadata: { [key: string]: SafeJson };
  enrichment: RequestEnrichment;
};

function normalizeEvent(credential: CollectorCredential, event: CollectorEventInput, enrichment: RequestEnrichment): NormalizedCollectorEvent {
  return {
    organizationId: credential.organizationId,
    siteId: credential.siteId,
    eventId: event.eventId,
    eventType: event.event,
    externalUserId: event.externalUserId,
    externalSessionId: event.externalSessionId,
    occurredAt: event.timestamp,
    metadata: { ...normalizeMetadata(event.metadata), ...enrichmentMetadata(enrichment) },
    enrichment,
  };
}

async function markCollectorActivity(transaction: Prisma.TransactionClient, credential: CollectorCredential, occurredAt: Date) {
  await transaction.siteApiCredential.update({ where: { id: credential.id }, data: { lastUsedAt: new Date() } });
  const site = await transaction.site.findUniqueOrThrow({ where: { id: credential.siteId }, select: { lastEventAt: true, verifiedAt: true, status: true } });
  await transaction.site.update({
    where: { id: credential.siteId },
    data: {
      lastEventAt: !site.lastEventAt || occurredAt > site.lastEventAt ? occurredAt : site.lastEventAt,
      ...(site.status === "PENDING_VERIFICATION" ? { status: "ACTIVE", verifiedAt: site.verifiedAt ?? new Date() } : {}),
    },
  });
}

async function assertCredentialStillActive(transaction: Prisma.TransactionClient, credential: CollectorCredential) {
  const active = await transaction.siteApiCredential.findFirst({
    where: {
      id: credential.id,
      organizationId: credential.organizationId,
      siteId: credential.siteId,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      site: { deletedAt: null, status: { in: ["PENDING_VERIFICATION", "ACTIVE"] } },
    },
    select: { id: true },
  });
  if (!active) throw new AppError("UNAUTHENTICATED", 401, "Invalid collector credentials");
}

function isUniqueConflict(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

export async function persistCollectorEvent(credential: CollectorCredential, input: CollectorEventInput, enrichment: RequestEnrichment) {
  const event = normalizeEvent(credential, input, enrichment);
  const existing = await getPrisma().securityEvent.findUnique({ where: { siteId_eventId: { siteId: credential.siteId, eventId: event.eventId } }, select: { id: true } });
  if (existing) {
    await getPrisma().$transaction(async (transaction) => {
      await assertCredentialStillActive(transaction, credential);
      await transaction.siteApiCredential.update({ where: { id: credential.id }, data: { lastUsedAt: new Date() } });
    });
    return { eventId: event.eventId, accepted: true, duplicate: true };
  }
  try {
    await getPrisma().$transaction(async (transaction) => {
      await assertCredentialStillActive(transaction, credential);
      const created = await transaction.securityEvent.create({ data: { organizationId: event.organizationId, siteId: event.siteId, eventId: event.eventId, eventType: event.eventType, externalUserId: event.externalUserId, externalSessionId: event.externalSessionId, occurredAt: event.occurredAt, metadata: event.metadata as Prisma.InputJsonValue, ipAddress: event.enrichment.ipAddress }, select: { id: true } });
      await processCollectorEvent(transaction, created.id, event);
      await markCollectorActivity(transaction, credential, event.occurredAt);
    });
    return { eventId: event.eventId, accepted: true, duplicate: false };
  } catch (error) {
    if (isUniqueConflict(error)) return { eventId: event.eventId, accepted: true, duplicate: true };
    throw error;
  }
}

export async function persistCollectorBatch(credential: CollectorCredential, inputs: CollectorEventInput[], enrichment: RequestEnrichment) {
  const events = inputs.map((event) => normalizeEvent(credential, event, enrichment));
  const latestOccurredAt = events.reduce((latest, event) => event.occurredAt > latest ? event.occurredAt : latest, events[0].occurredAt);
  const inserted = await getPrisma().$transaction(async (transaction) => {
    await assertCredentialStillActive(transaction, credential);
    const uniqueEvents = [...new Map(events.map((event) => [event.eventId, event])).values()];
    const created = await transaction.securityEvent.createManyAndReturn({ data: uniqueEvents.map((event) => ({ organizationId: event.organizationId, siteId: event.siteId, eventId: event.eventId, eventType: event.eventType, externalUserId: event.externalUserId, externalSessionId: event.externalSessionId, occurredAt: event.occurredAt, metadata: event.metadata as Prisma.InputJsonValue, ipAddress: event.enrichment.ipAddress })), skipDuplicates: true, select: { id: true, eventId: true } });
    const byEventId = new Map(uniqueEvents.map((event) => [event.eventId, event]));
    for (const row of created) await processCollectorEvent(transaction, row.id, byEventId.get(row.eventId)!);
    await markCollectorActivity(transaction, credential, latestOccurredAt);
    return created.length;
  });
  return { received: events.length, accepted: inserted, duplicates: events.length - inserted };
}
