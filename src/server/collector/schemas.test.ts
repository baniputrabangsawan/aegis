import { describe, expect, it } from "vitest";
import { collectorBatchSchema, collectorEventSchema, normalizeMetadata } from "@/server/collector/schemas";

function validEvent(overrides: Record<string, unknown> = {}) {
  return { eventId: "evt_123", event: "auth.login.success", externalUserId: "user-1", externalSessionId: "session-1", timestamp: new Date().toISOString(), metadata: { source: "test" }, ...overrides };
}

describe("collector payload validation", () => {
  it("accepts and normalizes a supported event", () => {
    const parsed = collectorEventSchema.parse(validEvent());
    expect(parsed.timestamp).toBeInstanceOf(Date);
    expect(parsed.event).toBe("auth.login.success");
  });

  it("rejects unknown event types and extra top-level fields", () => {
    expect(() => collectorEventSchema.parse(validEvent({ event: "auth.password.dump" }))).toThrow();
    expect(() => collectorEventSchema.parse(validEvent({ unexpected: true }))).toThrow();
  });

  it("requires identity and session references for successful login processing", () => {
    expect(() => collectorEventSchema.parse(validEvent({ externalUserId: undefined }))).toThrow();
    expect(() => collectorEventSchema.parse(validEvent({ externalSessionId: undefined }))).toThrow();
    expect(() => collectorEventSchema.parse(validEvent({ event: "auth.login.failed", externalSessionId: undefined }))).not.toThrow();
  });

  it("rejects stale and future timestamps", () => {
    expect(() => collectorEventSchema.parse(validEvent({ timestamp: new Date(Date.now() - 8 * 24 * 60 * 60_000).toISOString() }))).toThrow();
    expect(() => collectorEventSchema.parse(validEvent({ timestamp: new Date(Date.now() + 6 * 60_000).toISOString() }))).toThrow();
  });

  it("limits a batch to 100 events", () => {
    expect(collectorBatchSchema.parse({ events: Array.from({ length: 100 }, (_, index) => validEvent({ eventId: `evt_${index}` })) }).events).toHaveLength(100);
    expect(() => collectorBatchSchema.parse({ events: Array.from({ length: 101 }, (_, index) => validEvent({ eventId: `evt_${index}` })) })).toThrow();
  });
});

describe("collector metadata normalization", () => {
  it("retains JSON values without inheriting an object prototype", () => {
    const normalized = normalizeMetadata({ nested: { okay: true }, list: [1, "two"] });
    expect(normalized).toEqual({ nested: { okay: true }, list: [1, "two"] });
    expect(Object.getPrototypeOf(normalized)).toBeNull();
  });

  it("rejects reserved keys, excessive depth, and oversized strings", () => {
    const reserved = JSON.parse('{"__proto__":"unsafe"}') as Record<string, unknown>;
    expect(() => normalizeMetadata(reserved)).toThrow();
    expect(() => normalizeMetadata({ value: "x".repeat(4_097) })).toThrow();
    let nested: Record<string, unknown> = {};
    for (let index = 0; index < 10; index += 1) nested = { child: nested };
    expect(() => normalizeMetadata(nested)).toThrow();
  });
});
