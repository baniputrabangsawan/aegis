import { afterEach, describe, expect, it, vi } from "vitest";
import { createIPInfoGeoIPProvider, enrichCollectorRequest, enrichmentMetadata, isTrustedProxy, parseUserAgent, resolveClientIp } from "@/server/collector/enrichment";

afterEach(() => vi.restoreAllMocks());

describe("collector request enrichment", () => {
  it("parses desktop and mobile user agents without guessing models", () => {
    expect(parseUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")).toMatchObject({ friendlyName: "Chrome on Linux", browser: "Chrome", os: "Linux", type: "Desktop" });
    expect(parseUserAgent("Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36")).toMatchObject({ friendlyName: "Chrome Mobile on Android", browser: "Chrome Mobile", os: "Android", type: "Mobile" });
    expect(parseUserAgent(undefined)).toMatchObject({ friendlyName: "Unknown device", browser: "Unknown", os: "Unknown" });
  });

  it("ignores spoofable forwarding headers from untrusted sources", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.9", "cf-connecting-ip": "2001:db8::1" });
    expect(resolveClientIp(headers, "10.0.0.5", [])).toBe("10.0.0.5");
  });

  it("uses Cloudflare and forwarded IPs only behind trusted proxies", () => {
    expect(isTrustedProxy("10.0.0.5", ["10.0.0.0/24"])).toBe(true);
    const cfHeaders = new Headers({ "cf-connecting-ip": "2001:db8::1", "x-forwarded-for": "203.0.113.9" });
    expect(resolveClientIp(cfHeaders, "10.0.0.5", ["10.0.0.0/24"])).toBe("2001:db8::1");
    const forwardedHeaders = new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.5" });
    expect(resolveClientIp(forwardedHeaders, "10.0.0.5", ["10.0.0.0/24"])).toBe("203.0.113.9");
  });

  it("supports IPv6 trusted-proxy CIDRs", () => {
    expect(isTrustedProxy("2001:db8:abcd::10", ["2001:db8:abcd::/48"])).toBe(true);
    expect(isTrustedProxy("2001:db8:abce::10", ["2001:db8:abcd::/48"])).toBe(false);
  });

  it("accepts proxy IP headers only when the internal proxy secret matches", async () => {
    const spoofed = new Headers({ "x-real-ip": "198.51.100.10", "x-forwarded-for": "203.0.113.9" });
    await expect(enrichCollectorRequest(spoofed, [])).resolves.toMatchObject({ ipAddress: undefined });

    const authenticated = new Headers({ "x-aegis-proxy-secret": "proxy-secret", "x-real-ip": "198.51.100.10" });
    await expect(enrichCollectorRequest(authenticated, [], undefined, "proxy-secret")).resolves.toMatchObject({ ipAddress: "198.51.100.10" });
  });

  it("keeps trusted Cloudflare request identifiers as server metadata", async () => {
    const headers = new Headers({ "x-aegis-proxy-secret": "proxy-secret", "x-real-ip": "2001:db8:abcd::10", "cf-ray": "abc123-DPS" });
    const enrichment = await enrichCollectorRequest(headers, ["2001:db8:abcd::/48"], undefined, "proxy-secret");
    expect(enrichmentMetadata(enrichment)).toEqual({ cfRay: "abc123-DPS" });
  });

  it("maps ipinfo responses to normalized GeoIP fields", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ country: "id", region: "North Sumatra", city: "Medan", timezone: "Asia/Jakarta", org: "AS7713 Telkom Indonesia" })));
    await expect(createIPInfoGeoIPProvider("token").lookup("203.0.113.9")).resolves.toEqual({ country: "ID", region: "North Sumatra", city: "Medan", timezone: "Asia/Jakarta", asn: "AS7713", isp: "Telkom Indonesia" });
  });
});
