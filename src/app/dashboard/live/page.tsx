import { LivePage } from "@/components/live-page";
import { requirePermission } from "@/server/auth/guards";
import { liveMonitoringPayload } from "@/server/monitoring/live";

export default async function Page() {
  const actor = await requirePermission("security_event:read");
  const data = await liveMonitoringPayload(actor);
  return <LivePage events={data.events} stats={data.stats} />;
}
