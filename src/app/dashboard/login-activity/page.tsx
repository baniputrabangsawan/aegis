import { RecordsPage } from "@/components/records-page";
import { requirePermission } from "@/server/auth/guards";
import { getLoginActivityMonitoring } from "@/server/monitoring/queries";

const numbers = new Intl.NumberFormat("en");
const dates = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "medium" });
function label(value: string) { return value.toLowerCase().split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" "); }

export default async function LoginActivityPage() {
  const actor = await requirePermission("security_event:read");
  const data = await getLoginActivityMonitoring(actor);
  const rows = data.rows.map((attempt) => ({
    time: dates.format(attempt.occurredAt),
    site: attempt.site.name,
    user: attempt.externalUser?.displayName ?? attempt.externalUser?.email ?? attempt.externalUserId ?? "Unknown user",
    result: attempt.success ? "Success" : "Failed",
    device: attempt.device?.friendlyName ?? "Not reported",
    reason: attempt.success ? "Accepted" : attempt.failureReason ?? "Unspecified",
    risk: label(attempt.riskLevel),
  }));
  return <RecordsPage
    eyebrow="Monitoring"
    title="Login activity"
    description="Authentication outcomes processed from collector events. Device and network enrichment appears when reported."
    data={rows}
    stats={[{ label: "Successful today", value: numbers.format(data.stats.successful) }, { label: "Failed today", value: numbers.format(data.stats.failed) }, { label: "Success rate", value: `${(data.stats.successRate * 100).toFixed(1)}%` }, { label: "High risk", value: numbers.format(data.stats.highRisk) }]}
    searchPlaceholder="Search login activity…"
    filterOptions={[...new Set(rows.map((row) => row.site))]}
    filterKey="site"
    columns={[{ key: "time", label: "Time", kind: "mono" }, { key: "site", label: "Site", kind: "primary" }, { key: "user", label: "User" }, { key: "result", label: "Result", kind: "status" }, { key: "device", label: "Device" }, { key: "reason", label: "Reason" }, { key: "risk", label: "Risk", kind: "risk" }]}
  />;
}
