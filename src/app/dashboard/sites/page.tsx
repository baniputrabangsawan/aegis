import { Plus } from "lucide-react";
import { RecordsPage } from "@/components/records-page";
import { requirePermission } from "@/server/auth/guards";
import { listSites } from "@/server/sites/service";

function label(value: string) {
  return value.toLowerCase().split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}

function time(value: Date | null) {
  if (!value) return "No events";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

export default async function SitesPage() {
  const actor = await requirePermission("site:read");
  const sites = await listSites(actor);
  const rows = sites.map((site) => ({
    name: site.name,
    domain: site.domain,
    environment: label(site.environment),
    status: label(site.status),
    sessions: site._count.sessions,
    events: site._count.securityEvents,
    keys: site._count.credentials,
    lastEvent: time(site.lastEventAt),
  }));

  return <RecordsPage
    eyebrow="Sites"
    title="Website inventory"
    description="Registered origins and their persisted collection state."
    data={rows}
    stats={[
      { label: "Total sites", value: String(sites.length) },
      { label: "Active", value: String(sites.filter((site) => site.status === "ACTIVE").length) },
      { label: "Pending verification", value: String(sites.filter((site) => site.status === "PENDING_VERIFICATION").length) },
      { label: "Stored events", value: String(sites.reduce((total, site) => total + site._count.securityEvents, 0)) },
    ]}
    searchPlaceholder="Search websites or domains…"
    actions={[{ label: "Add website", href: "/dashboard/sites/new", icon: Plus, primary: true }]}
    columns={[
      { key: "name", label: "Website", kind: "site" },
      { key: "domain", label: "Domain" },
      { key: "environment", label: "Environment" },
      { key: "status", label: "Status", kind: "status" },
      { key: "sessions", label: "Sessions", kind: "number" },
      { key: "events", label: "Events", kind: "number" },
      { key: "keys", label: "Keys", kind: "number" },
      { key: "lastEvent", label: "Last event" },
    ]}
  />;
}
