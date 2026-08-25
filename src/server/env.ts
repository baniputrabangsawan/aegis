import "server-only";
import { serverEnvSchema, type ParsedServerEnv } from "@/server/env-schema";

export type ServerEnv = ParsedServerEnv & { trustedOrigins: string[] };

let cachedEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join(".")).filter(Boolean).join(", ");
    throw new Error(`Invalid server environment configuration: ${fields}`);
  }
  const trustedOrigins = (parsed.data.TRUSTED_ORIGINS ?? parsed.data.BETTER_AUTH_URL)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  cachedEnv = { ...parsed.data, trustedOrigins };
  return cachedEnv;
}

export function resetServerEnvForTests() {
  cachedEnv = undefined;
}
