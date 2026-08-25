import { requirePermission } from "@/server/auth/guards";
import { errorResponse } from "@/server/http/errors";
import { assertTrustedOrigin } from "@/server/http/origin";
import { parseJson } from "@/server/http/validation";
import { updateSiteSchema } from "@/server/sites/schemas";
import { softDeleteSite, updateSite } from "@/server/sites/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ siteId: string }> };

export async function PATCH(request: Request, context: Context) {
  const requestId = crypto.randomUUID();
  try {
    assertTrustedOrigin(request);
    const actor = await requirePermission("site:update", request.headers);
    const { siteId } = await context.params;
    const input = await parseJson(request, updateSiteSchema, 16_384);
    return Response.json({ data: await updateSite(actor, siteId, input), requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function DELETE(request: Request, context: Context) {
  const requestId = crypto.randomUUID();
  try {
    assertTrustedOrigin(request);
    const actor = await requirePermission("site:delete", request.headers);
    const { siteId } = await context.params;
    return Response.json({ data: await softDeleteSite(actor, siteId), requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
