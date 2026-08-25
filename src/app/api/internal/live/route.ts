import { requirePermission } from "@/server/auth/guards";
import { liveMonitoringPayload } from "@/server/monitoring/live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const actor = await requirePermission("security_event:read", request.headers);
  return Response.json(await liveMonitoringPayload(actor), { headers: { "Cache-Control": "no-store" } });
}
