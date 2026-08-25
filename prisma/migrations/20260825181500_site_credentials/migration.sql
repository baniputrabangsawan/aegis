-- Prevent two API credentials from ever sharing the same stored digest.
CREATE UNIQUE INDEX "site_api_credentials_secretHash_key" ON "site_api_credentials"("secretHash");
