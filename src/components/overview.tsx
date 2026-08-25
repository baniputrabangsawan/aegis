import { Activity, AlertTriangle, ArrowUpRight, Compass, Globe2, KeyRound, Laptop, MonitorSmartphone, ShieldCheck, Smartphone, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { LoginChart } from "@/components/charts";
import { DataTable, type ColumnSpec } from "@/components/data-table";
import { PageHeader, Panel } from "@/components/ui";
import { distributions, metrics, sites } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const iconMap = { sites: Globe2, active: ShieldCheck, users: Users, sessions: Activity, login: KeyRound, failed: AlertTriangle, device: MonitorSmartphone, alert: AlertTriangle };
const siteColumns: ColumnSpec[] = [
  { key: "name", label: "Website", kind: "site" }, { key: "domain", label: "Domain" }, { key: "status", label: "Status", kind: "status" },
  { key: "online", label: "Online", kind: "number" }, { key: "sessions", label: "Sessions", kind: "number" }, { key: "logins", label: "Login today", kind: "number" },
  { key: "failed", label: "Failed", kind: "number" }, { key: "alerts", label: "Alerts", kind: "number" }, { key: "risk", label: "Risk", kind: "risk" }, { key: "lastEvent", label: "Last event" },
];

export function OverviewPage() {
  return <div className="page">
    <PageHeader eyebrow="Security operations" title="Good morning, Dimas" description="A live view of identity activity and security posture across your organization." actions={[{ label: "Add website", href: "/dashboard/sites/new", primary: true }]} />
    <section className="metrics-grid" aria-label="Overview metrics">{metrics.map((metric) => { const Icon = iconMap[metric.icon as keyof typeof iconMap] ?? UserRound; return <div className="metric" key={metric.label}><div className="metric-top"><span className="metric-label">{metric.label}</span><Icon className="metric-icon" size={15} /></div><div className="metric-value">{metric.value}</div><div className="metric-foot"><span className={cn(metric.danger ? "trend-down" : metric.down ? "trend-up" : "trend-up")}>{metric.trend}</span><span>{metric.note}</span></div></div>; })}</section>
    <div className="content-grid"><Panel title="Authentication volume" subtitle="Successful and failed logins · last 24 hours" action={<div className="legend"><span className="legend-item"><span className="legend-swatch" style={{ background: "var(--accent)" }} />Successful</span><span className="legend-item"><span className="legend-swatch" style={{ background: "var(--danger)" }} />Failed</span></div>}><div className="panel-body"><LoginChart /></div></Panel><Panel title="Device distribution" subtitle="Active sessions by device class" action={<Link href="/dashboard/devices" aria-label="View devices"><ArrowUpRight size={15} color="var(--ink-tertiary)" /></Link>}><div className="panel-body distribution-list">{distributions.device.map((item) => <div className="distribution-row" key={item.name}><span className="distribution-icon">{item.name === "Desktop" ? <Laptop size={13} /> : item.name === "Mobile" ? <MonitorSmartphone size={13} /> : <Globe2 size={13} />}</span><span><span className="distribution-name">{item.name}</span><span className="distribution-track"><span className="distribution-fill" style={{ display: "block", width: `${item.value}%` }} /></span></span><span className="distribution-value">{item.value}%</span></div>)}</div></Panel></div>
    <div className="content-grid balanced-grid"><Panel title="Browser distribution" subtitle="Observed on active sessions"><div className="panel-body distribution-list">{distributions.browser.map((item) => <div className="distribution-row" key={item.name}><span className="distribution-icon"><Compass size={13} /></span><span><span className="distribution-name">{item.name}</span><span className="distribution-track"><span className="distribution-fill" style={{ display: "block", width: `${item.value}%` }} /></span></span><span className="distribution-value">{item.value}%</span></div>)}</div></Panel><Panel title="Operating systems" subtitle="Observed on active sessions"><div className="panel-body distribution-list">{distributions.os.map((item) => <div className="distribution-row" key={item.name}><span className="distribution-icon"><Smartphone size={13} /></span><span><span className="distribution-name">{item.name}</span><span className="distribution-track"><span className="distribution-fill" style={{ display: "block", width: `${item.value}%` }} /></span></span><span className="distribution-value">{item.value}%</span></div>)}</div></Panel></div>
    <DataTable data={sites} columns={siteColumns} searchPlaceholder="Search websites…" filterLabel="All environments" />
  </div>;
}
