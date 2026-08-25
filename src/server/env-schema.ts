import { z } from "zod";

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url().refine((value) => value.startsWith("postgresql://") || value.startsWith("postgres://"), "DATABASE_URL must use PostgreSQL"),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  DB_IDLE_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(300_000).default(30_000),
  DB_CONNECTION_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(60_000).default(10_000),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must contain at least 32 characters"),
  BETTER_AUTH_URL: z.string().url(),
  TRUSTED_ORIGINS: z.string().optional(),
  APP_NAME: z.string().min(1).default("Aegis Control"),
  ALLOW_ADMIN_SIGNUP: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  COLLECTOR_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(10).max(100_000).default(120),
  COLLECTOR_SINGLE_MAX_BYTES: z.coerce.number().int().min(1_024).max(1_000_000).default(65_536),
  COLLECTOR_BATCH_MAX_BYTES: z.coerce.number().int().min(8_192).max(5_000_000).default(524_288),
  COLLECTOR_TRUSTED_PROXIES: z.string().default(""),
  COLLECTOR_PROXY_SECRET: z.string().optional(),
  GEOIP_IPINFO_TOKEN: z.string().optional(),
  GEOIP_CACHE_TTL_HOURS: z.coerce.number().int().min(1).max(24 * 30).default(168),
}).superRefine((env, context) => {
  if (env.NODE_ENV !== "production") return;
  if (!env.BETTER_AUTH_URL.startsWith("https://")) {
    context.addIssue({ code: "custom", path: ["BETTER_AUTH_URL"], message: "BETTER_AUTH_URL must use HTTPS in production" });
  }
  const origins = (env.TRUSTED_ORIGINS ?? env.BETTER_AUTH_URL).split(",").map((origin) => origin.trim()).filter(Boolean);
  if (origins.some((origin) => !origin.startsWith("https://"))) {
    context.addIssue({ code: "custom", path: ["TRUSTED_ORIGINS"], message: "Trusted origins must use HTTPS in production" });
  }
  if (env.ALLOW_ADMIN_SIGNUP) {
    context.addIssue({ code: "custom", path: ["ALLOW_ADMIN_SIGNUP"], message: "Admin signup must be disabled in production" });
  }
  if (!env.COLLECTOR_PROXY_SECRET || env.COLLECTOR_PROXY_SECRET.length < 32) {
    context.addIssue({ code: "custom", path: ["COLLECTOR_PROXY_SECRET"], message: "COLLECTOR_PROXY_SECRET must contain at least 32 characters in production" });
  }
});

export type ParsedServerEnv = z.infer<typeof serverEnvSchema>;
