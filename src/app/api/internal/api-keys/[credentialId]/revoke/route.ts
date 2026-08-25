import { requirePermission } from "@/server/auth/guards";
import { errorResponse } from "@/server/http/errors";
import { assertTrustedOrigin } from "@/server/http/origin";
import { revokeCredential } from "@/server/sites/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ credentialId: string }> };

export async function POST(request: Request, context: Context) {
  const requestId = crypto.randomUUID();
  try {
    assertTrustedOrigin(request);
    const actor = await requirePermission("api_key:delete", request.headers);
    const { credentialId } = await context.params;
    return Response.json({ data: await revokeCredential(actor, credentialId), requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
