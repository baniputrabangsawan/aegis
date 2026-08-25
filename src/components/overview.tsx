import { Activity, AlertTriangle, ArrowUpRight, Compass, Globe2, KeyRound, Laptop, MonitorSmartphone, ShieldCheck, Smartphone, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { LoginVolumeChart } from "@/components/login-volume-chart";
import { Gauge } from "@/components/charts/gauge";
import { DataTable, type ColumnSpec } from "@/components/data-table";
import { PageHeader, Panel } from "@/components/ui";
import { cn } from "@/lib/utils";
import { requirePermission } from "@/server/auth/guards";
import { getOverviewMonitoring } from "@/server/monitoring/queries";

const iconMap = { sites: Globe2, active: ShieldCheck, users: Users, sessions: Activity, login: KeyRound, failed: AlertTriangle, device: MonitorSmartphone, alert: AlertTriangle };
const siteColumns: ColumnSpec[] = [
  { key: "name", label: "Website", kind: "site" }, { key: "domain", label: "Domain" }, { key: "status", label: "Status", kind: "status" },
  { key: "online", label: "Online", kind: "number" }, { key: "sessions", label: "Sessions", kind: "number" }, { key: "logins", label: "Login today", kind: "number" },
  { key: "failed", label: "Failed", kind: "number" }, { key: "alerts", label: "Alerts", kind: "number" }, { key: "risk", label: "Risk", kind: "risk" }, { key: "lastEvent", label: "Last event" },
];

export async function OverviewPage() {
  const actor = await requirePermission("security_event:read");
  const { distributions, loginChart, metrics, sites, successRate } = await getOverviewMonitoring(actor);
  const posture = Math.round(successRate * 100);
  return <div className="page overview-page">
    <PageHeader eyebrow="Security overview" title="Control center" description="Identity traffic, risk signals, and infrastructure health across your organization." actions={[{ label: "Add website", href: "/dashboard/sites/new", primary: true }]} />
    <div className="overview-status"><span><span className="live-dot" />Protection is active</span><span>Monitoring {sites.length} sites in real time</span><Link href="/dashboard/live">Open live feed <ArrowUpRight size={13} /></Link></div>
    <section className="metrics-grid" aria-label="Overview metrics">{metrics.map((metric) => { const Icon = iconMap[metric.icon as keyof typeof iconMap] ?? UserRound; return <article className={cn("metric", metric.danger && "metric-danger")} key={metric.label}><div className="metric-top"><span className="metric-label">{metric.label}</span><span className="metric-icon-shell"><Icon className="metric-icon" size={15} /></span></div><div className="metric-value">{metric.value}</div><div className="metric-foot"><span className={cn(metric.danger ? "trend-down" : "trend-up")}>{metric.trend}</span><span>{metric.note}</span></div></article>; })}</section>
    <div className="overview-primary-grid">
      <Panel className="overview-chart-panel" title="Authentication traffic" subtitle="Successful and failed logins over the last 24 hours" action={<div className="legend"><span className="legend-item"><span className="legend-swatch success" />Successful</span><span className="legend-item"><span className="legend-swatch failed" />Failed</span></div>}><div className="panel-body overview-chart-body"><LoginVolumeChart data={loginChart} /></div></Panel>
      <Panel className="posture-panel" title="Security posture" subtitle="Authentication health today"><div className="posture-body"><Gauge value={posture} defaultLabel="Login success" suffix="%" centerValue={posture} minWidth={220} /><div className="posture-summary"><div><span className="posture-label">Current state</span><strong>{posture >= 95 ? "Healthy" : posture >= 80 ? "Needs attention" : "At risk"}</strong></div><Link href="/dashboard/security-events">Review events <ArrowUpRight size={13} /></Link></div></div></Panel>
    </div>
    <div className="overview-distribution-grid">
      <Panel title="Device traffic" subtitle="Active sessions by device class" action={<Link href="/dashboard/devices" aria-label="View devices"><ArrowUpRight size={15} /></Link>}><Distribution items={distributions.device} type="device" /></Panel>
      <Panel title="Browsers" subtitle="Observed on active sessions"><Distribution items={distributions.browser} type="browser" /></Panel>
      <Panel title="Operating systems" subtitle="Observed on active sessions"><Distribution items={distributions.os} type="os" /></Panel>
    </div>
    <div className="section-heading"><div><p className="eyebrow">Infrastructure</p><h2>Protected websites</h2></div><Link href="/dashboard/sites">View all sites <ArrowUpRight size={13} /></Link></div>
    <DataTable data={sites} columns={siteColumns} searchPlaceholder="Search websites…" filterLabel="All environments" emptyMessage="No sites yet. Add a website, create an API key, then send your first collector event." />
  </div>;
}

function Distribution({ items, type }: { items: { name: string; value: number }[]; type: "device" | "browser" | "os" }) {
  return <div className="panel-body distribution-list">{items.map((item) => { const Icon = type === "browser" ? Compass : type === "os" ? Smartphone : item.name === "Desktop" ? Laptop : item.name === "Mobile" ? MonitorSmartphone : Globe2; return <div className="distribution-row" key={item.name}><span className="distribution-icon"><Icon size={13} /></span><span><span className="distribution-name">{item.name}</span><span className="distribution-track"><span className="distribution-fill" style={{ display: "block", width: `${item.value}%` }} /></span></span><span className="distribution-value">{item.value}%</span></div>; })}</div>;
}
