import { Download } from "lucide-react";
import { RecordsPage } from "@/components/records-page";
import { requirePermission } from "@/server/auth/guards";
import { getAuditLogsMonitoring } from "@/server/monitoring/queries";

const numbers = new Intl.NumberFormat("en");
const dates = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "medium" });
const redactedMetadata = new Set(["secret", "token", "password", "secretKey", "apiKey", "authorization"]);

function metadataSummary(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "No details";
  const pairs = Object.entries(value as Record<string, unknown>).filter(([key]) => !redactedMetadata.has(key)).slice(0, 3).map(([key, item]) => `${key}: ${typeof item === "string" || typeof item === "number" || typeof item === "boolean" ? String(item) : "[object]"}`);
  const text = pairs.join(", ");
  return text.length > 140 ? `${text.slice(0, 137)}...` : text || "No details";
}

export default async function AuditLogsPage() {
  const actor = await requirePermission("audit_log:read");
  const data = await getAuditLogsMonitoring(actor);
  const rows = data.rows.map((log) => ({
    id: log.id,
    time: dates.format(log.createdAt),
    actor: log.actor?.name ?? log.actor?.email ?? "System",
    action: log.action,
    target: [log.targetType, log.targetId].filter(Boolean).join(" · ") || log.targetType,
    site: log.site?.name ?? "Organization",
    ip: log.actorIp ?? "Unknown",
    detail: metadataSummary(log.metadata),
  }));
  return <RecordsPage eyebrow="Security" title="Audit logs" description="An immutable-style activity trail of administrative and security-sensitive actions." data={rows} stats={[{ label: "Events today", value: numbers.format(data.stats.eventsToday) }, { label: "Admin actions", value: numbers.format(data.stats.adminActions) }, { label: "Security actions", value: numbers.format(data.stats.securityActions) }, { label: "Policy changes", value: numbers.format(data.stats.policyChanges) }]} searchPlaceholder="Search actor, action, or target…" emptyMessage="No audit logs yet. Administrative and security-sensitive actions will appear here after users manage sites, API keys, sessions, or blocked IPs." actions={[{ label: "Export", icon: Download }]} filterOptions={[...new Set(rows.map((row) => row.site))]} filterKey="site" columns={[{ key: "time", label: "Time", kind: "mono" }, { key: "actor", label: "Actor", kind: "primary" }, { key: "action", label: "Action", kind: "mono" }, { key: "target", label: "Target" }, { key: "site", label: "Site" }, { key: "ip", label: "Actor IP", kind: "mono" }, { key: "detail", label: "Details" }]} />;
}
