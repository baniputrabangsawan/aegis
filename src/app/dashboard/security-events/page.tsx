import { Download } from "lucide-react";
import { RecordsPage } from "@/components/records-page";
import { requirePermission } from "@/server/auth/guards";
import { getSecurityEventsMonitoring } from "@/server/monitoring/queries";

const numbers = new Intl.NumberFormat("en");
const dates = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "medium" });
function label(value: string) { return value.toLowerCase().split(/[._]/).map((word) => word[0].toUpperCase() + word.slice(1)).join(" "); }

export default async function SecurityEventsPage() {
  const actor = await requirePermission("security_event:read");
  const data = await getSecurityEventsMonitoring(actor);
  const rows = data.rows.map((event) => ({
    time: dates.format(event.occurredAt),
    site: event.site.name,
    user: event.externalUser?.displayName ?? event.externalUser?.email ?? event.externalUser?.externalUserId ?? "Unknown user",
    event: label(event.eventType),
    ip: event.ipAddress ?? "Unknown",
    risk: label(event.riskLevel),
    severity: label(event.riskLevel),
    status: label(event.status),
  }));
  return <RecordsPage eyebrow="Security" title="Security events" description="Prioritized detection signals with transparent risk reasons and investigation status." data={rows} stats={[{ label: "Open", value: numbers.format(data.stats.open) }, { label: "Critical", value: numbers.format(data.stats.critical) }, { label: "Investigating", value: numbers.format(data.stats.investigating) }, { label: "Resolved today", value: numbers.format(data.stats.resolvedToday) }]} searchPlaceholder="Search events, users, or IPs…" actions={[{ label: "Export", icon: Download }]} filterOptions={[...new Set(rows.map((row) => row.site))]} filterKey="site" columns={[{ key: "time", label: "Time", kind: "mono" }, { key: "site", label: "Site", kind: "primary" }, { key: "user", label: "User" }, { key: "event", label: "Event" }, { key: "ip", label: "IP", kind: "mono" }, { key: "risk", label: "Risk", kind: "risk" }, { key: "severity", label: "Severity", kind: "risk" }, { key: "status", label: "Status", kind: "status" }]} />;
}
