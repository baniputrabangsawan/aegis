import "server-only";
import { authenticateCollector } from "@/server/collector/auth";
import { consumeCollectorRateLimit } from "@/server/collector/rate-limit";
import { collectorBatchSchema, collectorEventSchema } from "@/server/collector/schemas";
import { createCachedGeoIPProvider, createIPInfoGeoIPProvider, enrichCollectorRequest } from "@/server/collector/enrichment";
import { persistCollectorBatch, persistCollectorEvent } from "@/server/collector/service";
import { getServerEnv } from "@/server/env";
import { AppError, errorResponse } from "@/server/http/errors";
import { parseJson } from "@/server/http/validation";

const responseHeaders = { "Cache-Control": "no-store", "Content-Type": "application/json" };

function assertCollectorRequest(request: Request, maxBytes: number) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) throw new AppError("BAD_REQUEST", 400, "Content-Type must be application/json");
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const bytes = Number(contentLength);
    if (!Number.isSafeInteger(bytes) || bytes < 0) throw new AppError("BAD_REQUEST", 400, "Invalid Content-Length header");
    if (bytes > maxBytes) throw new AppError("PAYLOAD_TOO_LARGE", 413, "Request body is too large");
  }
}

function collectorError(error: unknown, requestId: string) {
  console.error(JSON.stringify({ level: "error", event: "collector_request_failed", requestId, errorName: error instanceof Error ? error.name : "UnknownError" }));
  const response = errorResponse(error, requestId);
  response.headers.set("X-Request-ID", requestId);
  if (response.status === 401) response.headers.set("WWW-Authenticate", "Bearer");
  return response;
}

export async function handleSingleCollectorEvent(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const maxBytes = getServerEnv().COLLECTOR_SINGLE_MAX_BYTES;
    assertCollectorRequest(request, maxBytes);
    const credential = await authenticateCollector(request);
    const rate = await consumeCollectorRateLimit(credential.id);
    const input = await parseJson(request, collectorEventSchema, maxBytes);
    const env = getServerEnv();
    const data = await persistCollectorEvent(credential, input, await enrichCollectorRequest(request.headers, env.collectorTrustedProxies, createCachedGeoIPProvider(createIPInfoGeoIPProvider(env.GEOIP_IPINFO_TOKEN), env.GEOIP_CACHE_TTL_HOURS), env.COLLECTOR_PROXY_SECRET));
    console.info(JSON.stringify({ level: "info", event: "collector_event_accepted", requestId, siteId: credential.siteId, duplicate: data.duplicate }));
    return Response.json({ data, requestId }, { status: data.duplicate ? 200 : 202, headers: { ...responseHeaders, "X-Request-ID": requestId, "RateLimit-Limit": String(rate.limit), "RateLimit-Remaining": String(rate.remaining) } });
  } catch (error) {
    return collectorError(error, requestId);
  }
}

export async function handleCollectorBatch(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const maxBytes = getServerEnv().COLLECTOR_BATCH_MAX_BYTES;
    assertCollectorRequest(request, maxBytes);
    const credential = await authenticateCollector(request);
    let rate = await consumeCollectorRateLimit(credential.id);
    const input = await parseJson(request, collectorBatchSchema, maxBytes);
    if (input.events.length > 1) rate = await consumeCollectorRateLimit(credential.id, input.events.length - 1);
    const env = getServerEnv();
    const data = await persistCollectorBatch(credential, input.events, await enrichCollectorRequest(request.headers, env.collectorTrustedProxies, createCachedGeoIPProvider(createIPInfoGeoIPProvider(env.GEOIP_IPINFO_TOKEN), env.GEOIP_CACHE_TTL_HOURS), env.COLLECTOR_PROXY_SECRET));
    console.info(JSON.stringify({ level: "info", event: "collector_batch_accepted", requestId, siteId: credential.siteId, received: data.received, accepted: data.accepted, duplicates: data.duplicates }));
    return Response.json({ data, requestId }, { status: 202, headers: { ...responseHeaders, "X-Request-ID": requestId, "RateLimit-Limit": String(rate.limit), "RateLimit-Remaining": String(rate.remaining) } });
  } catch (error) {
    return collectorError(error, requestId);
  }
}
