import { LivePage } from "@/components/live-page";
import { requirePermission } from "@/server/auth/guards";
import { getLiveMonitoring } from "@/server/monitoring/queries";

const times = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
function label(value: string) { return value.toLowerCase().split(/[._]/).map((word) => word[0].toUpperCase() + word.slice(1)).join(" "); }
function typeFor(eventType: string) {
  if (eventType.includes("failed")) return "failed";
  if (eventType.includes("login")) return "login";
  if (eventType.includes("logout")) return "logout";
  if (eventType.includes("session")) return "session";
  if (eventType.includes("security")) return "alert";
  return "device";
}

export default async function Page() {
  const actor = await requirePermission("security_event:read");
  const data = await getLiveMonitoring(actor);
  const events = data.rows.map((event) => {
    const user = event.externalUser?.displayName ?? event.externalUser?.email ?? event.externalUser?.externalUserId ?? "Unknown user";
    return { time: times.format(event.occurredAt), title: `${label(event.eventType)} · ${event.site.name}`, detail: `${user} · ${event.device?.friendlyName ?? "Unknown device"} · ${event.ipAddress ?? "Unknown IP"}`, type: typeFor(event.eventType), tone: label(event.riskLevel) };
  });
  return <LivePage events={events} stats={data.stats} />;
}
