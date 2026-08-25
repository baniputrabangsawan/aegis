import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements, ownerAc } from "better-auth/plugins/organization/access";

export const APP_ROLES = ["OWNER", "ADMIN", "SECURITY_ANALYST", "VIEWER"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const PERMISSIONS = [
  "organization:read", "organization:update", "organization:delete",
  "member:read", "member:create", "member:update", "member:delete",
  "site:read", "site:create", "site:update", "site:delete",
  "user:read", "session:read", "session:update", "session:revoke",
  "security_event:read", "security_event:update",
  "blocked_ip:read", "blocked_ip:create", "blocked_ip:delete",
  "audit_log:read", "api_key:read", "api_key:create", "api_key:update", "api_key:delete",
  "settings:read", "settings:update",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const allPermissions = new Set<Permission>(PERMISSIONS);
const analystPermissions = new Set<Permission>([
  "organization:read", "member:read", "site:read", "user:read",
  "session:read", "session:update", "session:revoke",
  "security_event:read", "security_event:update",
  "blocked_ip:read", "blocked_ip:create", "blocked_ip:delete",
  "audit_log:read", "api_key:read", "settings:read",
]);
const viewerPermissions = new Set<Permission>(PERMISSIONS.filter((permission) => permission.endsWith(":read")));

export const PERMISSION_MATRIX: Readonly<Record<AppRole, ReadonlySet<Permission>>> = {
  OWNER: allPermissions,
  ADMIN: new Set([...allPermissions].filter((permission) => permission !== "organization:delete")),
  SECURITY_ANALYST: analystPermissions,
  VIEWER: viewerPermissions,
};

const statements = {
  ...defaultStatements,
  site: ["read", "create", "update", "delete"],
  user: ["read"],
  session: ["read", "update", "revoke"],
  securityEvent: ["read", "update"],
  blockedIp: ["read", "create", "delete"],
  auditLog: ["read"],
  apiKey: ["read", "create", "update", "delete"],
  settings: ["read", "update"],
} as const;

export const organizationAccess = createAccessControl(statements);

export const organizationRoles = {
  OWNER: organizationAccess.newRole({
    ...ownerAc.statements,
    site: ["read", "create", "update", "delete"], user: ["read"], session: ["read", "update", "revoke"],
    securityEvent: ["read", "update"], blockedIp: ["read", "create", "delete"], auditLog: ["read"],
    apiKey: ["read", "create", "update", "delete"], settings: ["read", "update"],
  }),
  ADMIN: organizationAccess.newRole({
    ...adminAc.statements,
    site: ["read", "create", "update", "delete"], user: ["read"], session: ["read", "update", "revoke"],
    securityEvent: ["read", "update"], blockedIp: ["read", "create", "delete"], auditLog: ["read"],
    apiKey: ["read", "create", "update", "delete"], settings: ["read", "update"],
  }),
  SECURITY_ANALYST: organizationAccess.newRole({
    organization: [], member: [], invitation: [], team: [], ac: ["read"],
    site: ["read"], user: ["read"], session: ["read", "update", "revoke"], securityEvent: ["read", "update"],
    blockedIp: ["read", "create", "delete"], auditLog: ["read"], apiKey: ["read"], settings: ["read"],
  }),
  VIEWER: organizationAccess.newRole({
    organization: [], member: [], invitation: [], team: [], ac: ["read"],
    site: ["read"], user: ["read"], session: ["read"], securityEvent: ["read"],
    blockedIp: ["read"], auditLog: ["read"], apiKey: ["read"], settings: ["read"],
  }),
};

export function parseRoles(value: string): AppRole[] {
  const roles = value.split(",").map((role) => role.trim().toUpperCase());
  return APP_ROLES.filter((role) => roles.includes(role));
}

export function hasRole(currentRoles: readonly AppRole[], allowedRoles: readonly AppRole[]) {
  return currentRoles.some((role) => allowedRoles.includes(role));
}

export function hasPermission(currentRoles: readonly AppRole[], permission: Permission) {
  return currentRoles.some((role) => PERMISSION_MATRIX[role].has(permission));
}
