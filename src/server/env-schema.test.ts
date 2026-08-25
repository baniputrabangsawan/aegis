import { describe, expect, it } from "vitest";
import { serverEnvSchema } from "./env-schema";

const validEnvironment = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://aegis:secret@postgres:5432/aegis",
  BETTER_AUTH_SECRET: "a-production-secret-that-is-long-enough",
  BETTER_AUTH_URL: "https://security.example.com",
  TRUSTED_ORIGINS: "https://security.example.com",
  ALLOW_ADMIN_SIGNUP: "false",
};

describe("production environment policy", () => {
  it("accepts HTTPS origins and applies pool defaults", () => {
    const parsed = serverEnvSchema.parse(validEnvironment);
    expect(parsed.DB_POOL_MAX).toBe(10);
    expect(parsed.ALLOW_ADMIN_SIGNUP).toBe(false);
  });

  it("rejects HTTP auth origins in production", () => {
    const parsed = serverEnvSchema.safeParse({
      ...validEnvironment,
      BETTER_AUTH_URL: "http://security.example.com",
      TRUSTED_ORIGINS: "http://security.example.com",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects enabled administrator signup in production", () => {
    const parsed = serverEnvSchema.safeParse({ ...validEnvironment, ALLOW_ADMIN_SIGNUP: "true" });
    expect(parsed.success).toBe(false);
  });

  it("rejects an excessive database pool", () => {
    const parsed = serverEnvSchema.safeParse({ ...validEnvironment, DB_POOL_MAX: "101" });
    expect(parsed.success).toBe(false);
  });
});
