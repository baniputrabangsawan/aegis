import { describe, expect, it } from "vitest";
import { effectiveSessionStatus } from "@/server/monitoring/queries";

describe("effective session status", () => {
  const now = new Date("2026-08-25T10:00:00.000Z");
  const session = (minutesAgo: number, status = "ACTIVE", expiresAt: Date | null = null) => ({ status, lastActiveAt: new Date(now.getTime() - minutesAgo * 60_000), expiresAt });

  it("derives active, idle, and inactive from last activity", () => {
    expect(effectiveSessionStatus(session(4), now)).toBe("ACTIVE");
    expect(effectiveSessionStatus(session(5), now)).toBe("IDLE");
    expect(effectiveSessionStatus(session(30), now)).toBe("IDLE");
    expect(effectiveSessionStatus(session(31), now)).toBe("INACTIVE");
  });

  it("preserves terminal states and honors expiration", () => {
    expect(effectiveSessionStatus(session(1, "LOGGED_OUT"), now)).toBe("LOGGED_OUT");
    expect(effectiveSessionStatus(session(1, "ACTIVE", new Date(now.getTime() - 1)), now)).toBe("EXPIRED");
  });
});
