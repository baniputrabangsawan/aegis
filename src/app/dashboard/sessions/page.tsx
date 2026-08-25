import { RecordsPage } from "@/components/records-page";
import { requirePermission } from "@/server/auth/guards";
import { effectiveSessionStatus, getSessionsMonitoring } from "@/server/monitoring/queries";

const numbers = new Intl.NumberFormat("en");
const dates = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });
function label(value: string) { return value.toLowerCase().split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" "); }

export default async function SessionsPage() {
  const actor = await requirePermission("session:read");
  const now = new Date();
  const data = await getSessionsMonitoring(actor, now);
  const rows = data.rows.map((session) => ({
    detailHref: `/dashboard/sessions/${session.id}`,
    site: session.site.name,
    user: session.externalUser?.displayName ?? session.externalUser?.email ?? session.externalUser?.externalUserId ?? "Unknown user",
    sessionId: session.externalSessionId,
    device: session.device?.friendlyName ?? "Not reported",
    started: dates.format(session.startedAt),
    lastActive: dates.format(session.lastActiveAt),
    status: label(effectiveSessionStatus(session, now)),
    risk: label(session.riskLevel),
  }));
  return <RecordsPage
    eyebrow="Monitoring"
    title="Sessions"
    description="Active and historical sessions derived from collector login, refresh, and logout events."
    data={rows}
    stats={[{ label: "Active", value: numbers.format(data.stats.active) }, { label: "Idle", value: numbers.format(data.stats.idle) }, { label: "Inactive", value: numbers.format(data.stats.inactive) }, { label: "Ended today", value: numbers.format(data.stats.endedToday) }]}
    searchPlaceholder="Search user, session, or device…"
    filterOptions={[...new Set(rows.map((row) => row.site))]}
    filterKey="site"
    columns={[{ key: "site", label: "Site", kind: "link", hrefKey: "detailHref" }, { key: "user", label: "User" }, { key: "sessionId", label: "External session", kind: "mono" }, { key: "device", label: "Device" }, { key: "started", label: "Started" }, { key: "lastActive", label: "Last active" }, { key: "status", label: "Status", kind: "status" }, { key: "risk", label: "Risk", kind: "risk" }]}
  />;
}
