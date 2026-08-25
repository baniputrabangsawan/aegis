import { handleSingleCollectorEvent } from "@/server/collector/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleSingleCollectorEvent(request);
}
