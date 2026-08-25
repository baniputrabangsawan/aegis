import { requirePermission } from "@/server/auth/guards";
import { errorResponse } from "@/server/http/errors";
import { assertTrustedOrigin } from "@/server/http/origin";
import { parseJson } from "@/server/http/validation";
import { createCredentialSchema } from "@/server/sites/schemas";
import { createCredential, listCredentials } from "@/server/sites/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const actor = await requirePermission("api_key:read", request.headers);
    return Response.json({ data: await listCredentials(actor), requestId }, { headers: noStore });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    assertTrustedOrigin(request);
    const actor = await requirePermission("api_key:create", request.headers);
    const input = await parseJson(request, createCredentialSchema, 16_384);
    return Response.json({ data: await createCredential(actor, input), requestId }, { status: 201, headers: noStore });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
