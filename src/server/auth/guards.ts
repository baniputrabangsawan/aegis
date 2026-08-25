import "server-only";
import { headers as nextHeaders } from "next/headers";
import { getAuth } from "@/server/auth/auth";
import { hasPermission, hasRole, parseRoles, type AppRole, type Permission } from "@/server/auth/permissions";
import { getPrisma } from "@/server/db/client";
import { AppError } from "@/server/http/errors";

export type AuthContext = {
  userId: string;
  sessionId: string;
  email: string;
  name: string;
};

export type TenantAuthContext = AuthContext & {
  organizationId: string;
  roles: AppRole[];
};

async function resolveHeaders(provided?: Headers) {
  return provided ?? await nextHeaders();
}

export async function requireAuth(providedHeaders?: Headers): Promise<AuthContext> {
  const session = await getAuth().api.getSession({ headers: await resolveHeaders(providedHeaders) });
  if (!session) throw new AppError("UNAUTHENTICATED", 401, "Authentication required");
  return { userId: session.user.id, sessionId: session.session.id, email: session.user.email, name: session.user.name };
}

async function requireTenantContext(providedHeaders?: Headers): Promise<TenantAuthContext> {
  const headerBag = await resolveHeaders(providedHeaders);
  const session = await getAuth().api.getSession({ headers: headerBag });
  if (!session) throw new AppError("UNAUTHENTICATED", 401, "Authentication required");
  let organizationId = session.session.activeOrganizationId;
  if (!organizationId) {
    const defaultMembership = await getPrisma().member.findFirst({ where: { userId: session.user.id }, orderBy: { createdAt: "asc" }, select: { organizationId: true } });
    organizationId = defaultMembership?.organizationId;
    if (organizationId) await getPrisma().session.update({ where: { id: session.session.id }, data: { activeOrganizationId: organizationId } });
  }
  if (!organizationId) throw new AppError("TENANT_REQUIRED", 403, "Select an active organization");
  const membership = await getPrisma().member.findUnique({ where: { organizationId_userId: { organizationId, userId: session.user.id } }, select: { role: true } });
  const roles = membership ? parseRoles(membership.role) : [];
  if (!membership || roles.length === 0) throw new AppError("FORBIDDEN", 403, "Organization membership required");
  return { userId: session.user.id, sessionId: session.session.id, email: session.user.email, name: session.user.name, organizationId, roles };
}

export async function requireRole(allowedRoles: readonly AppRole[], providedHeaders?: Headers) {
  const context = await requireTenantContext(providedHeaders);
  if (!hasRole(context.roles, allowedRoles)) throw new AppError("FORBIDDEN", 403, "Insufficient role");
  return context;
}

export async function requirePermission(permission: Permission, providedHeaders?: Headers) {
  const context = await requireTenantContext(providedHeaders);
  if (!hasPermission(context.roles, permission)) throw new AppError("FORBIDDEN", 403, "Insufficient permission");
  return context;
}
