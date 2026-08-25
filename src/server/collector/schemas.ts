import { z } from "zod";
import { AppError } from "@/server/http/errors";

export const COLLECTOR_EVENT_TYPES = [
  "auth.login.success", "auth.login.failed", "auth.logout", "auth.mfa.success", "auth.mfa.failed",
  "user.registered",
  "session.created", "session.refreshed", "session.revoked", "session.expired",
  "security.rate_limited", "security.turnstile_failed", "security.suspicious",
  "custom",
] as const;

const identifier = z.string().trim().min(1).max(256).regex(/^[A-Za-z0-9._:@/-]+$/, "Identifier contains unsupported characters");
const timestamp = z.iso.datetime({ offset: true }).transform((value, context) => {
  const date = new Date(value);
  const now = Date.now();
  if (date.getTime() > now + 5 * 60_000) context.addIssue({ code: "custom", message: "Timestamp cannot be more than 5 minutes in the future" });
  if (date.getTime() < now - 7 * 24 * 60 * 60_000) context.addIssue({ code: "custom", message: "Timestamp cannot be older than 7 days" });
  return date;
});

export const collectorEventSchema = z.object({
  eventId: z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9._:-]+$/, "Event ID contains unsupported characters"),
  event: z.enum(COLLECTOR_EVENT_TYPES),
  externalUserId: identifier.optional(),
  externalSessionId: identifier.optional(),
  timestamp,
  metadata: z.record(z.string().max(100), z.unknown()).default({}),
}).strict().superRefine((value, context) => {
  if (value.event === "auth.login.success" && !value.externalUserId) context.addIssue({ code: "custom", path: ["externalUserId"], message: "externalUserId is required for a successful login" });
  if (["auth.login.success", "auth.logout", "session.created", "session.refreshed", "session.revoked", "session.expired"].includes(value.event) && !value.externalSessionId) {
    context.addIssue({ code: "custom", path: ["externalSessionId"], message: "externalSessionId is required for this event" });
  }
});

export const collectorBatchSchema = z.object({ events: z.array(collectorEventSchema).min(1).max(100) }).strict();

export type CollectorEventInput = z.output<typeof collectorEventSchema>;

export type SafeJson = null | boolean | number | string | SafeJson[] | { [key: string]: SafeJson };

export function normalizeMetadata(value: Record<string, unknown>): { [key: string]: SafeJson } {
  return normalizeJson(value, 0) as { [key: string]: SafeJson };
}

function normalizeJson(value: unknown, depth: number): SafeJson {
  if (depth > 8) throw new AppError("BAD_REQUEST", 400, "Metadata nesting is too deep");
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new AppError("BAD_REQUEST", 400, "Metadata contains a non-finite number");
    return value;
  }
  if (typeof value === "string") {
    if (value.length > 4_096) throw new AppError("BAD_REQUEST", 400, "Metadata string is too long");
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length > 100) throw new AppError("BAD_REQUEST", 400, "Metadata array has too many items");
    return value.map((item) => normalizeJson(item, depth + 1));
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length > 50) throw new AppError("BAD_REQUEST", 400, "Metadata object has too many fields");
    const normalized: { [key: string]: SafeJson } = Object.create(null);
    for (const [key, item] of entries) {
      if (["__proto__", "prototype", "constructor"].includes(key)) throw new AppError("BAD_REQUEST", 400, "Metadata contains a reserved field");
      if (key.length > 100) throw new AppError("BAD_REQUEST", 400, "Metadata field name is too long");
      normalized[key] = normalizeJson(item, depth + 1);
    }
    return normalized;
  }
  throw new AppError("BAD_REQUEST", 400, "Metadata contains an unsupported value");
}
