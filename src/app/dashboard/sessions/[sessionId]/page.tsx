import { notFound } from "next/navigation";
import { Activity, Clock3, MapPin, MonitorSmartphone } from "lucide-react";
import { PageHeader, Panel, StatStrip, StatusBadge } from "@/components/ui";
import { requirePermission } from "@/server/auth/guards";
import { effectiveSessionStatus, getSessionDetail } from "@/server/monitoring/queries";

const dates = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });
function label(value: string) { return value.toLowerCase().split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" "); }
function showDate(value: Date | null) { return value ? dates.format(value) : "Not reported"; }

export default async function SessionDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const actor = await requirePermission("session:read");
  const { sessionId } = await params;
  const session = await getSessionDetail(actor, sessionId);
  if (!session) notFound();

  const status = label(effectiveSessionStatus(session));
  const user = session.externalUser?.displayName ?? session.externalUser?.email ?? session.externalUser?.externalUserId ?? "Unknown user";
  const location = [session.city, session.region, session.country].filter(Boolean).join(", ") || "Not reported";
  const device = session.device;

  return <div className="page">
    <PageHeader eyebrow="Session detail" title={user} description={`${session.site.name} · ${session.externalSessionId}`} backHref="/dashboard/sessions" />
    <StatStrip items={[{ label: "Status", value: status }, { label: "Risk", value: label(session.riskLevel) }, { label: "Risk score", value: String(session.riskScore) }, { label: "Last active", value: dates.format(session.lastActiveAt) }]} />
    <div className="detail-grid">
      <Panel title="Session identity" subtitle="Collector-provided identifiers and lifecycle">
        <dl className="definition-list">
          <div className="definition"><dt>External session</dt><dd className="mono">{session.externalSessionId}</dd></div>
          <div className="definition"><dt>Site</dt><dd>{session.site.name} · {session.site.environment.toLowerCase()}</dd></div>
          <div className="definition"><dt>User</dt><dd>{user}</dd></div>
          <div className="definition"><dt>User status</dt><dd>{session.externalUser ? <StatusBadge>{label(session.externalUser.status)}</StatusBadge> : "Not reported"}</dd></div>
          <div className="definition"><dt>Started</dt><dd>{dates.format(session.startedAt)}</dd></div>
          <div className="definition"><dt>Expires</dt><dd>{showDate(session.expiresAt)}</dd></div>
          <div className="definition"><dt>Logout</dt><dd>{showDate(session.logoutAt)}</dd></div>
          <div className="definition"><dt>Revoked</dt><dd>{showDate(session.revokedAt)}</dd></div>
        </dl>
      </Panel>
      <div className="session-detail-stack">
        <Panel title="Device" subtitle="Parsed from collector telemetry">
          <dl className="definition-list session-compact-list">
            <div className="definition"><dt>Name</dt><dd>{device?.friendlyName ?? "Not reported"}</dd></div>
            <div className="definition"><dt>Status</dt><dd>{device ? <StatusBadge>{label(device.status)}</StatusBadge> : "Not reported"}</dd></div>
            <div className="definition"><dt>Browser</dt><dd>{device ? [device.browser, device.browserVersion].filter(Boolean).join(" ") : "Not reported"}</dd></div>
            <div className="definition"><dt>OS</dt><dd>{device ? [device.os, device.osVersion].filter(Boolean).join(" ") : "Not reported"}</dd></div>
          </dl>
        </Panel>
        <Panel title="Network" subtitle="Approximate location based on IP—not GPS">
          <dl className="definition-list session-compact-list">
            <div className="definition"><dt>IP address</dt><dd className="mono">{session.ipAddress ?? "Not reported"}</dd></div>
            <div className="definition"><dt>Location</dt><dd>{location}</dd></div>
            <div className="definition"><dt>Network</dt><dd>{[session.asn, session.isp].filter(Boolean).join(" · ") || "Not reported"}</dd></div>
            <div className="definition"><dt>Timezone</dt><dd>{session.timezone ?? "Not reported"}</dd></div>
          </dl>
        </Panel>
      </div>
    </div>
    {session.userAgent && <Panel title="User agent" subtitle="Raw value received by the collector"><pre className="code-block session-user-agent"><code>{session.userAgent}</code></pre></Panel>}
    <Panel title="Session events" subtitle={`${session.securityEvents.length} most recent events`}>
      {session.securityEvents.length === 0 ? <div className="table-empty session-empty">No security events recorded for this session.</div> : <div className="event-feed">{session.securityEvents.map((event) => <div className="event-item session-event-item" key={event.id}>
        <time className="event-time" dateTime={event.occurredAt.toISOString()}>{dates.format(event.occurredAt)}</time>
        <span className="event-icon" aria-hidden="true">{event.eventType.includes("session") ? <Activity size={14} /> : event.eventType.includes("device") ? <MonitorSmartphone size={14} /> : event.ipAddress ? <MapPin size={14} /> : <Clock3 size={14} />}</span>
        <div><div className="event-title">{event.eventType}</div><div className="event-detail">{event.ipAddress ?? "IP not reported"} · risk score {event.riskScore}</div></div>
        <div className="session-event-badges"><StatusBadge>{label(event.riskLevel)}</StatusBadge><StatusBadge>{label(event.status)}</StatusBadge></div>
      </div>)}</div>}
    </Panel>
  </div>;
}
