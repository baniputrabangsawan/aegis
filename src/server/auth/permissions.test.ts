import { describe, expect, it } from "vitest";
import { hasPermission, hasRole, parseRoles } from "./permissions";

describe("RBAC permission matrix", () => {
  it("allows owners to perform destructive organization actions", () => {
    expect(hasPermission(["OWNER"], "organization:delete")).toBe(true);
  });

  it("prevents admins from deleting the organization", () => {
    expect(hasPermission(["ADMIN"], "organization:delete")).toBe(false);
    expect(hasPermission(["ADMIN"], "site:update")).toBe(true);
  });

  it("allows security analysts to operate incidents but not sites", () => {
    expect(hasPermission(["SECURITY_ANALYST"], "blocked_ip:create")).toBe(true);
    expect(hasPermission(["SECURITY_ANALYST"], "site:create")).toBe(false);
  });

  it("keeps viewers read-only", () => {
    expect(hasPermission(["VIEWER"], "security_event:read")).toBe(true);
    expect(hasPermission(["VIEWER"], "security_event:update")).toBe(false);
  });

  it("normalizes multiple stored organization roles", () => {
    const roles = parseRoles("viewer, SECURITY_ANALYST, unknown");
    expect(roles).toEqual(["SECURITY_ANALYST", "VIEWER"]);
    expect(hasRole(roles, ["SECURITY_ANALYST"])).toBe(true);
  });
});
