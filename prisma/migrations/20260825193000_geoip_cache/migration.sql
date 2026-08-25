CREATE TABLE "geoip_cache" (
    "ipAddress" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "timezone" TEXT,
    "asn" TEXT,
    "isp" TEXT,
    "lookedUpAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "geoip_cache_pkey" PRIMARY KEY ("ipAddress")
);

CREATE INDEX "geoip_cache_lookedUpAt_idx" ON "geoip_cache"("lookedUpAt");
