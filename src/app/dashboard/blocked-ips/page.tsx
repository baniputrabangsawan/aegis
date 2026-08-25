import { Plus } from "lucide-react";
import { RecordsPage } from "@/components/records-page";
import { requirePermission } from "@/server/auth/guards";
import { getBlockedIpsMonitoring } from "@/server/monitoring/queries";

const numbers = new Intl.NumberFormat("en");
const dates = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });
function label(value: string) { return value.toLowerCase().split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" "); }

export default async function BlockedIpsPage() {
  const actor = await requirePermission("blocked_ip:read");
  const data = await getBlockedIpsMonitoring(actor);
  const rows = data.rows.map((item) => ({
    id: item.id,
    ip: item.ipAddress,
    scope: label(item.scope),
    site: item.site?.name ?? "All sites",
    reason: item.reason,
    blockedBy: item.blockedBy?.name ?? item.blockedBy?.email ?? "System",
    created: dates.format(item.createdAt),
    expires: item.expiresAt ? dates.format(item.expiresAt) : "Never",
    status: label(item.status),
  }));
  return <RecordsPage eyebrow="Security" title="Blocked IPs" description="Manage monitored and enforced IP policies. Enforcement requires a connected client integration." data={rows} stats={[{ label: "Active blocks", value: numbers.format(data.stats.active) }, { label: "Global", value: numbers.format(data.stats.global) }, { label: "Site scoped", value: numbers.format(data.stats.siteScoped) }, { label: "Expiring today", value: numbers.format(data.stats.expiringToday) }]} searchPlaceholder="Search IP, reason, or site…" emptyMessage="No blocked IPs yet. Add a block policy to flag or enforce known abusive addresses." actions={[{ label: "Block IP", icon: Plus, primary: true }]} filterOptions={[...new Set(rows.map((row) => row.site))]} filterKey="site" columns={[{ key: "ip", label: "IP address", kind: "mono" }, { key: "scope", label: "Scope", kind: "status" }, { key: "site", label: "Site" }, { key: "reason", label: "Reason" }, { key: "blockedBy", label: "Blocked by" }, { key: "created", label: "Created" }, { key: "expires", label: "Expires" }, { key: "status", label: "Status", kind: "status" }]} />;
}
