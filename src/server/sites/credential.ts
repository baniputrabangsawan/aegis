import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { SiteEnvironment } from "@/generated/prisma/enums";

const SECRET_BYTES = 32;

function secretNamespace(environment: SiteEnvironment) {
  return environment === "PRODUCTION" ? "sk_live_" : "sk_test_";
}

export function hashSiteSecret(secret: string) {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

export function verifySiteSecret(secret: string, expectedHash: string) {
  const actual = Buffer.from(hashSiteSecret(secret), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function generateSiteCredential(environment: SiteEnvironment) {
  const secret = `${secretNamespace(environment)}${randomBytes(SECRET_BYTES).toString("base64url")}`;
  return {
    secret,
    secretHash: hashSiteSecret(secret),
    keyPrefix: secret.slice(0, 19),
  };
}

export function generateSiteId() {
  return `site_${randomBytes(12).toString("base64url")}`;
}
