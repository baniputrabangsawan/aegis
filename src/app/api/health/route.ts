import { getPrisma } from "@/server/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const requestId = crypto.randomUUID();
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "reachable", requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", event: "health_check_failed", requestId, errorName: error instanceof Error ? error.name : "UnknownError" }));
    return Response.json({ error: { code: "SERVICE_UNAVAILABLE", message: "Service is not ready", requestId } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
