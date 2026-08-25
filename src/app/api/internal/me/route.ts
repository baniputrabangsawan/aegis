import { requireAuth } from "@/server/auth/guards";
import { errorResponse } from "@/server/http/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const actor = await requireAuth(request.headers);
    return Response.json({ data: actor, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
