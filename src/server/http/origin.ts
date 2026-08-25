import { getServerEnv } from "@/server/env";
import { AppError } from "@/server/http/errors";

export function assertTrustedOrigin(request: Request, trustedOrigins = getServerEnv().trustedOrigins) {
  const origin = request.headers.get("origin");
  if (!origin || !trustedOrigins.includes(origin)) {
    throw new AppError("FORBIDDEN", 403, "Untrusted request origin");
  }
}
