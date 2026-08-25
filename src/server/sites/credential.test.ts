import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { generateSiteCredential, generateSiteId, hashSiteSecret, verifySiteSecret } from "@/server/sites/credential";

describe("site credentials", () => {
  it("generates a 256-bit production secret and stores only its digest", () => {
    const generated = generateSiteCredential("PRODUCTION");
    expect(generated.secret).toMatch(/^sk_live_[A-Za-z0-9_-]+$/);
    expect(Buffer.from(generated.secret.slice("sk_live_".length), "base64url")).toHaveLength(32);
    expect(generated.secretHash).toMatch(/^[a-f0-9]{64}$/);
    expect(generated.secretHash).not.toContain(generated.secret);
    expect(generated.keyPrefix).toBe(generated.secret.slice(0, 19));
  });

  it("uses the test namespace outside production and generates unique values", () => {
    const first = generateSiteCredential("STAGING");
    const second = generateSiteCredential("DEVELOPMENT");
    expect(first.secret).toMatch(/^sk_test_/);
    expect(second.secret).toMatch(/^sk_test_/);
    expect(first.secret).not.toBe(second.secret);
  });

  it("verifies secrets using their digest", () => {
    const { secret, secretHash } = generateSiteCredential("PRODUCTION");
    expect(hashSiteSecret(secret)).toBe(secretHash);
    expect(verifySiteSecret(secret, secretHash)).toBe(true);
    expect(verifySiteSecret(`${secret}x`, secretHash)).toBe(false);
  });

  it("generates opaque site IDs", () => {
    expect(generateSiteId()).toMatch(/^site_[A-Za-z0-9_-]{16}$/);
  });
});
