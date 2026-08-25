import "server-only";
import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import { getPrisma } from "@/server/db/client";
import { getServerEnv } from "@/server/env";
import { organizationAccess, organizationRoles } from "@/server/auth/permissions";

let authInstance: ReturnType<typeof createAuth> | undefined;

function createAuth() {
  const env = getServerEnv();
  return betterAuth({
    appName: env.APP_NAME,
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: env.trustedOrigins,
    database: prismaAdapter(getPrisma(), { provider: "postgresql" }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: !env.ALLOW_ADMIN_SIGNUP,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
    },
    session: {
      expiresIn: 60 * 60 * 12,
      updateAge: 60 * 60,
    },
    advanced: {
      cookiePrefix: "aegis-control",
      useSecureCookies: env.NODE_ENV === "production",
      database: { joins: true },
    },
    plugins: [
      organization({
        ac: organizationAccess,
        roles: organizationRoles,
        creatorRole: "OWNER",
      }),
    ],
  });
}

export function getAuth() {
  authInstance ??= createAuth();
  return authInstance;
}
