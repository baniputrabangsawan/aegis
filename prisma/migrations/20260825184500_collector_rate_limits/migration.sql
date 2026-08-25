-- Database-backed fixed-window buckets keep collector limits consistent across app instances.
CREATE TABLE "collector_rate_limits" (
    "credentialId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collector_rate_limits_pkey" PRIMARY KEY ("credentialId", "windowStart")
);

CREATE INDEX "collector_rate_limits_expiresAt_idx" ON "collector_rate_limits"("expiresAt");

ALTER TABLE "collector_rate_limits" ADD CONSTRAINT "collector_rate_limits_credentialId_fkey"
FOREIGN KEY ("credentialId") REFERENCES "site_api_credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
