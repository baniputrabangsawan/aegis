import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { AppError, errorResponse } from "./errors";

describe("safe API error responses", () => {
  it("serializes known operational errors", async () => {
    const response = errorResponse(new AppError("FORBIDDEN", 403, "Insufficient permission"), "req_known");
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: { code: "FORBIDDEN", message: "Insufficient permission", requestId: "req_known" } });
  });

  it("returns field-safe validation details", async () => {
    const result = z.object({ email: z.email() }).safeParse({ email: "invalid" });
    if (result.success) throw new Error("Expected validation failure");
    const response = errorResponse(result.error, "req_validation");
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error.details.fields[0].path).toBe("email");
  });

  it("never leaks unknown error messages or stack traces", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = errorResponse(new Error("DATABASE_URL=secret-value"), "req_unknown");
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain("secret-value");
    expect(body.error.message).toBe("An unexpected error occurred");
    consoleSpy.mockRestore();
  });
});
