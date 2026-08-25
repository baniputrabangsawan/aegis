import { ApiKeysPage } from "@/components/api-keys-page";
import { requirePermission } from "@/server/auth/guards";
import { listCredentials, listSites } from "@/server/sites/service";

export default async function Page() {
  const actor = await requirePermission("api_key:read");
  const [keys, sites] = await Promise.all([listCredentials(actor), listSites(actor)]);
  return <ApiKeysPage
    initialKeys={keys.map((key) => ({
      ...key,
      createdAt: key.createdAt.toISOString(),
      lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
      expiresAt: key.expiresAt?.toISOString() ?? null,
      revokedAt: key.revokedAt?.toISOString() ?? null,
    }))}
    sites={sites.map((site) => ({ id: site.id, name: site.name, environment: site.environment }))}
  />;
}
