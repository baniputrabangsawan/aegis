import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getServerEnv } from "@/server/env";

const globalDatabase = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  if (globalDatabase.prisma) return globalDatabase.prisma;
  const env = getServerEnv();
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
    max: env.DB_POOL_MAX,
    idleTimeoutMillis: env.DB_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: env.DB_CONNECTION_TIMEOUT_MS,
  });
  const client = new PrismaClient({ adapter, log: process.env.NODE_ENV === "development" ? ["warn", "error"] : [] });
  if (process.env.NODE_ENV !== "production") globalDatabase.prisma = client;
  return client;
}
