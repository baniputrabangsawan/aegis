import { RecordsPage } from "@/components/records-page";
import { requirePermission } from "@/server/auth/guards";
import { getUsersMonitoring } from "@/server/monitoring/queries";

const numbers = new Intl.NumberFormat("en");
const dates = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

function label(value: string) { return value.toLowerCase().split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" "); }

export default async function UsersPage() {
  const actor = await requirePermission("user:read");
  const data = await getUsersMonitoring(actor);
  const rows = data.rows.map((user) => ({
    user: user.displayName ?? user.email ?? user.externalUserId,
    identity: user.email ? `${user.externalUserId} · ${user.email}` : user.externalUserId,
    site: user.site.name,
    sessions: user._count.sessions,
    devices: user._count.devices,
    firstSeen: dates.format(user.firstSeenAt),
    lastSeen: dates.format(user.lastSeenAt),
    status: label(user.status),
    risk: label(user.riskLevel),
  }));
  return <RecordsPage
    eyebrow="Monitoring"
    title="Users"
    description="External identities observed from authenticated collector events."
    data={rows}
    stats={[{ label: "Total users", value: numbers.format(data.stats.total) }, { label: "Online now", value: numbers.format(data.stats.online) }, { label: "New today", value: numbers.format(data.stats.newToday) }, { label: "Elevated risk", value: numbers.format(data.stats.elevatedRisk) }]}
    searchPlaceholder="Search external ID, name, or email…"
    filterOptions={[...new Set(rows.map((row) => row.site))]}
    filterKey="site"
    columns={[{ key: "user", label: "User", kind: "primary" }, { key: "identity", label: "External ID / Email" }, { key: "site", label: "Site" }, { key: "sessions", label: "Sessions", kind: "number" }, { key: "devices", label: "Devices", kind: "number" }, { key: "firstSeen", label: "First seen" }, { key: "lastSeen", label: "Last seen" }, { key: "status", label: "Status", kind: "status" }, { key: "risk", label: "Risk", kind: "risk" }]}
  />;
}
