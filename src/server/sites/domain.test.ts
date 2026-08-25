import { describe, expect, it } from "vitest";
import { normalizeSiteDomain, siteSlug } from "@/server/sites/domain";

describe("site domain validation", () => {
  it("normalizes a secure origin", () => expect(normalizeSiteDomain("https://Example.COM/", "PRODUCTION")).toBe("https://example.com"));
  it("allows HTTP only for local development", () => expect(normalizeSiteDomain("http://localhost:3001", "DEVELOPMENT")).toBe("http://localhost:3001"));
  it.each([
    ["http://example.com", "PRODUCTION"],
    ["https://example.com/path", "PRODUCTION"],
    ["https://example.com?token=a", "STAGING"],
    ["https://user:pass@example.com", "PRODUCTION"],
  ] as const)("rejects unsafe origin %s", (origin, environment) => expect(() => normalizeSiteDomain(origin, environment)).toThrow());
  it("creates stable URL-safe slugs", () => expect(siteSlug("  Áegis Commerce / Bali ")).toBe("aegis-commerce-bali"));
});
