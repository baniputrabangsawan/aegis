import "server-only";
import { getPrisma } from "@/server/db/client";
import { getServerEnv } from "@/server/env";
import { AppError } from "@/server/http/errors";

export async function consumeCollectorRateLimit(credentialId: string, weight = 1, now = new Date()) {
  const limit = getServerEnv().COLLECTOR_RATE_LIMIT_PER_MINUTE;
  const windowStart = new Date(Math.floor(now.getTime() / 60_000) * 60_000);
  const expiresAt = new Date(windowStart.getTime() + 2 * 60_000);
  const bucket = await getPrisma().$transaction(async (transaction) => {
    await transaction.collectorRateLimit.deleteMany({ where: { expiresAt: { lt: now } } });
    return transaction.collectorRateLimit.upsert({
      where: { credentialId_windowStart: { credentialId, windowStart } },
      create: { credentialId, windowStart, count: weight, expiresAt },
      update: { count: { increment: weight }, expiresAt },
      select: { count: true },
    });
  });
  if (bucket.count > limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((windowStart.getTime() + 60_000 - now.getTime()) / 1_000));
    throw new AppError("RATE_LIMITED", 429, "Collector rate limit exceeded", { retryAfterSeconds, limit });
  }
  return { remaining: Math.max(0, limit - bucket.count), limit };
}
