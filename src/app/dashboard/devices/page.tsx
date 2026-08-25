import { RecordsPage } from "@/components/records-page";
import { requirePermission } from "@/server/auth/guards";
import { getDevicesMonitoring } from "@/server/monitoring/queries";

const numbers = new Intl.NumberFormat("en");
const dates = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });
function label(value: string) { return value.toLowerCase().split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" "); }

export default async function DevicesPage() {
  const actor = await requirePermission("session:read");
  const data = await getDevicesMonitoring(actor);
  const rows = data.rows.map((device) => ({
    id: device.id,
    device: device.friendlyName,
    user: device.externalUser?.displayName ?? device.externalUser?.email ?? device.externalUser?.externalUserId ?? "Unknown user",
    site: device.site.name,
    os: [device.os, device.osVersion].filter(Boolean).join(" ") || "Unknown",
    browser: [device.browser, device.browserVersion].filter(Boolean).join(" ") || "Unknown",
    firstSeen: dates.format(device.firstSeenAt),
    lastSeen: dates.format(device.lastSeenAt),
    ip: device.lastIpAddress ?? "Unknown",
    location: [device.sessions[0]?.city, device.sessions[0]?.region, device.sessions[0]?.country].filter(Boolean).join(", ") || "Unknown",
    status: label(device.status),
  }));
  return <RecordsPage eyebrow="Monitoring" title="Devices" description="Track known, new, suspicious, and revoked devices without collecting invasive identifiers." data={rows} stats={[{ label: "Known devices", value: numbers.format(data.stats.known) }, { label: "New today", value: numbers.format(data.stats.newToday) }, { label: "Suspicious", value: numbers.format(data.stats.suspicious) }, { label: "Revoked", value: numbers.format(data.stats.revoked) }]} searchPlaceholder="Search device, user, or IP…" filterOptions={[...new Set(rows.map((row) => row.site))]} filterKey="site" columns={[{ key: "device", label: "Device", kind: "primary" }, { key: "user", label: "User" }, { key: "site", label: "Site" }, { key: "os", label: "OS" }, { key: "browser", label: "Browser" }, { key: "location", label: "Location" }, { key: "firstSeen", label: "First seen" }, { key: "lastSeen", label: "Last seen" }, { key: "ip", label: "IP", kind: "mono" }, { key: "status", label: "Status", kind: "status" }]} />;
}
