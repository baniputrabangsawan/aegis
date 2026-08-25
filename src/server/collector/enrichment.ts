import "server-only";
import { timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { UAParser } from "ua-parser-js";
import type { SafeJson } from "@/server/collector/schemas";
import { getPrisma } from "@/server/db/client";

export type GeoIPData = { country?: string; region?: string; city?: string; timezone?: string; asn?: string; isp?: string };
export type GeoIPProvider = { lookup(ipAddress: string, signal?: AbortSignal): Promise<GeoIPData | undefined> };
export type DeviceTelemetry = { friendlyName: string; type: string; vendor?: string; model?: string; browser: string; browserVersion?: string; os: string; osVersion?: string };
export type RequestEnrichment = { ipAddress?: string; userAgent?: string; cfRay?: string; geo: GeoIPData; device: DeviceTelemetry };

const unknownDevice: DeviceTelemetry = { friendlyName: "Unknown device", type: "Unknown", browser: "Unknown", os: "Unknown" };
const defaultGeoIPProvider: GeoIPProvider = { async lookup() { return undefined; } };

function clean(value: string | undefined | null, maxLength: number) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length <= maxLength ? trimmed : undefined;
}

function stringField(value: unknown, maxLength: number) {
  return typeof value === "string" ? clean(value, maxLength) : undefined;
}

function parseOrg(value: string | undefined) {
  if (!value) return {};
  const [asn, ...name] = value.split(" ");
  return { asn: asn?.startsWith("AS") ? asn : undefined, isp: clean(name.join(" "), 160) ?? value };
}

function clientIpFromHeader(value: string | undefined | null) {
  const first = value?.split(",")[0]?.trim();
  return first && isIP(first) ? first : undefined;
}

function ipv6Bytes(value: string) {
  if (isIP(value) !== 6) return undefined;
  const sides = value.split("::");
  if (sides.length > 2) return undefined;
  const expand = (side: string | undefined) => side ? side.split(":").filter(Boolean).flatMap((part) => {
    if (isIP(part) !== 4) return [part];
    const octets = part.split(".").map(Number);
    return [((octets[0] << 8) | octets[1]).toString(16), ((octets[2] << 8) | octets[3]).toString(16)];
  }) : [];
  const left = expand(sides[0]);
  const right = expand(sides[1]);
  const missing = 8 - left.length - right.length;
  if ((sides.length === 2 && missing < 1) || (sides.length === 1 && missing !== 0)) return undefined;
  const groups = [...left, ...Array.from({ length: missing }, () => "0"), ...right];
  if (groups.length !== 8 || groups.some((part) => !/^[\da-f]{1,4}$/i.test(part))) return undefined;
  return groups.flatMap((part) => { const value16 = Number.parseInt(part, 16); return [value16 >> 8, value16 & 255]; });
}

function cidrContains(ipAddress: string, cidr: string) {
  const [range, prefixText] = cidr.split("/");
  if (!range || prefixText === undefined) return false;
  const prefix = Number(prefixText);
  if (!Number.isInteger(prefix) || prefix < 0) return false;
  if (isIP(ipAddress) === 4 && isIP(range) === 4) {
    if (prefix > 32) return false;
    const toInt = (value: string) => value.split(".").reduce((total, part) => (total << 8) + Number(part), 0) >>> 0;
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    return (toInt(ipAddress) & mask) === (toInt(range) & mask);
  }
  const ip = ipv6Bytes(ipAddress);
  const network = ipv6Bytes(range);
  if (!ip || !network || prefix > 128) return false;
  const fullBytes = Math.floor(prefix / 8);
  const remainingBits = prefix % 8;
  for (let index = 0; index < fullBytes; index += 1) if (ip[index] !== network[index]) return false;
  if (remainingBits === 0) return true;
  const mask = (0xff << (8 - remainingBits)) & 0xff;
  return (ip[fullBytes] & mask) === (network[fullBytes] & mask);
}

export function isTrustedProxy(remoteAddress: string | undefined, trustedProxies: readonly string[]) {
  if (!remoteAddress || !isIP(remoteAddress)) return false;
  return trustedProxies.some((entry) => {
    const value = entry.trim();
    if (!value) return false;
    if (value.includes("/")) return cidrContains(remoteAddress, value);
    return value === remoteAddress;
  });
}

export function resolveClientIp(headers: Headers, remoteAddress: string | undefined, trustedProxies: readonly string[]) {
  if (!isTrustedProxy(remoteAddress, trustedProxies)) return remoteAddress && isIP(remoteAddress) ? remoteAddress : undefined;
  return clientIpFromHeader(headers.get("cf-connecting-ip")) ?? clientIpFromHeader(headers.get("x-forwarded-for")) ?? (remoteAddress && isIP(remoteAddress) ? remoteAddress : undefined);
}

function proxySecretMatches(received: string | null, expected: string | undefined) {
  if (!received || !expected) return false;
  const receivedBytes = Buffer.from(received);
  const expectedBytes = Buffer.from(expected);
  return receivedBytes.length === expectedBytes.length && timingSafeEqual(receivedBytes, expectedBytes);
}

export function parseUserAgent(userAgent: string | undefined): DeviceTelemetry {
  if (!userAgent) return unknownDevice;
  const parsed = UAParser(userAgent);
  const rawBrowser = clean(parsed.browser.name, 80) ?? "Unknown";
  const browser = rawBrowser === "Mobile Chrome" ? "Chrome Mobile" : rawBrowser;
  const os = clean(parsed.os.name, 80) ?? "Unknown";
  const type = clean(parsed.device.type, 40) ?? "Desktop";
  return {
    friendlyName: browser === "Unknown" && os === "Unknown" ? "Unknown device" : `${browser} on ${os}`,
    type: type[0].toUpperCase() + type.slice(1),
    vendor: clean(parsed.device.vendor, 80),
    model: clean(parsed.device.model, 80),
    browser,
    browserVersion: clean(parsed.browser.version, 40),
    os,
    osVersion: clean(parsed.os.version, 40),
  };
}

export function createIPInfoGeoIPProvider(token: string | undefined): GeoIPProvider {
  const cleanToken = clean(token, 512);
  if (!cleanToken) return defaultGeoIPProvider;
  return {
    async lookup(ipAddress, signal) {
      if (!isIP(ipAddress)) return undefined;
      const response = await fetch(`https://ipinfo.io/${encodeURIComponent(ipAddress)}/json`, { headers: { Authorization: `Bearer ${cleanToken}` }, signal });
      if (!response.ok) return undefined;
      const body = await response.json() as Record<string, unknown>;
      return {
        country: stringField(body.country, 2)?.toUpperCase(),
        region: stringField(body.region, 120),
        city: stringField(body.city, 120),
        timezone: stringField(body.timezone, 120),
        ...parseOrg(stringField(body.org, 200)),
      };
    },
  };
}

export function createCachedGeoIPProvider(provider: GeoIPProvider, ttlHours: number): GeoIPProvider {
  return {
    async lookup(ipAddress, signal) {
      if (!isIP(ipAddress)) return undefined;
      const prisma = getPrisma();
      const staleBefore = new Date(Date.now() - ttlHours * 60 * 60_000);
      const cached = await prisma.geoIPCache.findUnique({ where: { ipAddress } });
      if (cached && cached.lookedUpAt > staleBefore) return { country: cached.country ?? undefined, region: cached.region ?? undefined, city: cached.city ?? undefined, timezone: cached.timezone ?? undefined, asn: cached.asn ?? undefined, isp: cached.isp ?? undefined };
      const fresh = await provider.lookup(ipAddress, signal);
      if (!fresh) return cached ? { country: cached.country ?? undefined, region: cached.region ?? undefined, city: cached.city ?? undefined, timezone: cached.timezone ?? undefined, asn: cached.asn ?? undefined, isp: cached.isp ?? undefined } : undefined;
      await prisma.geoIPCache.upsert({ where: { ipAddress }, create: { ipAddress, provider: "ipinfo", ...fresh, lookedUpAt: new Date() }, update: { provider: "ipinfo", ...fresh, lookedUpAt: new Date() } });
      return fresh;
    },
  };
}

function countryFromCloudflare(headers: Headers, trusted: boolean) {
  const country = clean(headers.get("cf-ipcountry"), 2)?.toUpperCase();
  return trusted && country && country !== "XX" ? { country } : {};
}

export async function enrichCollectorRequest(headers: Headers, trustedProxies: readonly string[], geoIPProvider: GeoIPProvider = defaultGeoIPProvider, proxySecret?: string): Promise<RequestEnrichment> {
  const proxyAuthenticated = proxySecretMatches(headers.get("x-aegis-proxy-secret"), proxySecret);
  const remoteAddress = proxyAuthenticated ? clean(headers.get("x-real-ip"), 100) : undefined;
  const trusted = isTrustedProxy(remoteAddress, trustedProxies);
  const ipAddress = resolveClientIp(headers, remoteAddress, trustedProxies);
  const userAgent = clean(headers.get("user-agent"), 512);
  let providerGeo: GeoIPData | undefined;
  if (ipAddress) {
    try {
      providerGeo = await geoIPProvider.lookup(ipAddress, AbortSignal.timeout(500));
    } catch {
      providerGeo = undefined;
    }
  }
  return { ipAddress, userAgent, cfRay: trusted ? clean(headers.get("cf-ray"), 80) : undefined, geo: { ...countryFromCloudflare(headers, trusted), ...providerGeo }, device: parseUserAgent(userAgent) };
}

export function enrichmentMetadata(enrichment: RequestEnrichment): Record<string, SafeJson> {
  const metadata: Record<string, SafeJson> = {};
  if (enrichment.cfRay) metadata.cfRay = enrichment.cfRay;
  return metadata;
}
