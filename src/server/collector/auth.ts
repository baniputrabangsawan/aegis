import "server-only";
import { getPrisma } from "@/server/db/client";
import { AppError } from "@/server/http/errors";
import { verifySiteSecret } from "@/server/sites/credential";

export type CollectorCredential = {
  id: string;
  organizationId: string;
  siteId: string;
  siteStatus: "PENDING_VERIFICATION" | "ACTIVE";
};

function unauthorized(): never {
  throw new AppError("UNAUTHENTICATED", 401, "Invalid collector credentials");
}

export async function authenticateCollector(request: Request): Promise<CollectorCredential> {
  const siteId = request.headers.get("x-site-id")?.trim();
  const authorization = request.headers.get("authorization");
  if (!siteId || !/^site_[A-Za-z0-9_-]{16}$/.test(siteId) || !authorization?.startsWith("Bearer ")) unauthorized();
  const secret = authorization.slice(7);
  if (secret.length < 40 || secret.length > 100 || !/^sk_(live|test)_[A-Za-z0-9_-]+$/.test(secret)) unauthorized();
  const keyPrefix = secret.slice(0, 19);
  const credential = await getPrisma().siteApiCredential.findFirst({
    where: { siteId, keyPrefix, revokedAt: null, site: { deletedAt: null, status: { in: ["PENDING_VERIFICATION", "ACTIVE"] } } },
    select: { id: true, organizationId: true, siteId: true, secretHash: true, expiresAt: true, environment: true, site: { select: { status: true, environment: true } } },
  });
  if (!credential || credential.environment !== credential.site.environment || (credential.expiresAt && credential.expiresAt <= new Date()) || !verifySiteSecret(secret, credential.secretHash)) unauthorized();
  return { id: credential.id, organizationId: credential.organizationId, siteId: credential.siteId, siteStatus: credential.site.status as CollectorCredential["siteStatus"] };
}
