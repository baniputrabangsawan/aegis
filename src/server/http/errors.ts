import { ZodError } from "zod";

export type ErrorCode =
  | "BAD_REQUEST" | "UNAUTHENTICATED" | "FORBIDDEN" | "TENANT_REQUIRED"
  | "NOT_FOUND" | "CONFLICT" | "PAYLOAD_TOO_LARGE" | "INTERNAL_ERROR" | "SERVICE_UNAVAILABLE";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorResponse(error: unknown, requestId = crypto.randomUUID()) {
  if (error instanceof AppError) {
    return Response.json({ error: { code: error.code, message: error.message, requestId, ...(error.details ? { details: error.details } : {}) } }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return Response.json({ error: { code: "BAD_REQUEST", message: "Request validation failed", requestId, details: { fields: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) } } }, { status: 400 });
  }
  console.error(JSON.stringify({ level: "error", event: "unhandled_api_error", requestId, errorName: error instanceof Error ? error.name : "UnknownError" }));
  return Response.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", requestId } }, { status: 500 });
}
