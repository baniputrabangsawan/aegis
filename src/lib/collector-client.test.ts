import { describe, expect, it, vi } from "vitest";
import { createCollectorClient } from "@/lib/collector-client";

describe("collector client", () => {
  it("sends login success telemetry without exposing client-side state", async () => {
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    await createCollectorClient({ endpoint: "https://security.example.com/api/v1/events", secretKey: "sk_test", fetch: request }).trackLoginSuccess({ eventId: "evt_1", externalUserId: "user_1", externalSessionId: "sess_1", userAgent: "Chrome" });
    expect(request).toHaveBeenCalledWith("https://security.example.com/api/v1/events", expect.objectContaining({ method: "POST", headers: expect.objectContaining({ Authorization: "Bearer sk_test", "User-Agent": "Chrome" }) }));
    expect(JSON.parse(request.mock.calls[0][1].body)).toMatchObject({ eventId: "evt_1", event: "auth.login.success", externalUserId: "user_1", externalSessionId: "sess_1" });
  });

  it("does not throw when collector delivery fails", async () => {
    const request = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(createCollectorClient({ endpoint: "https://security.example.com/api/v1/events", secretKey: "sk_test", fetch: request }).trackLoginFailed({ externalUserId: "user_1" })).resolves.toBeUndefined();
  });
});
