export type CollectorClientOptions = { endpoint: string; secretKey: string; fetch?: typeof fetch };
type EventName = "auth.login.success" | "auth.login.failed" | "auth.logout" | "session.created" | "session.refreshed" | "session.revoked" | "session.expired";
type TrackInput = { eventId?: string; externalUserId?: string; externalSessionId?: string; metadata?: Record<string, unknown>; userAgent?: string };

function eventId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function createCollectorClient(options: CollectorClientOptions) {
  const send = async (event: EventName, input: TrackInput) => {
    const body = { eventId: input.eventId ?? eventId(event.replaceAll(".", "_")), event, externalUserId: input.externalUserId, externalSessionId: input.externalSessionId, timestamp: new Date().toISOString(), metadata: input.metadata ?? {} };
    const request = options.fetch ?? fetch;
    try {
      await request(options.endpoint, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${options.secretKey}`, ...(input.userAgent ? { "User-Agent": input.userAgent } : {}) }, body: JSON.stringify(body), keepalive: true });
    } catch {
      // Collector telemetry must not break the primary auth flow.
    }
  };
  return {
    trackLoginSuccess: (input: TrackInput & { externalUserId: string; externalSessionId: string }) => send("auth.login.success", input),
    trackLoginFailed: (input: TrackInput) => send("auth.login.failed", input),
    trackSessionCreated: (input: TrackInput & { externalSessionId: string }) => send("session.created", input),
    trackSessionRefreshed: (input: TrackInput & { externalSessionId: string }) => send("session.refreshed", input),
    trackLogout: (input: TrackInput & { externalSessionId: string }) => send("auth.logout", input),
    trackSessionRevoked: (input: TrackInput & { externalSessionId: string }) => send("session.revoked", input),
    trackSessionExpired: (input: TrackInput & { externalSessionId: string }) => send("session.expired", input),
  };
}
