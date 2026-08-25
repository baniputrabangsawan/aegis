import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Download, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/mock-data";

export function StatusBadge({ children, tone }: { children: React.ReactNode; tone?: StatusTone }) {
  return <span className={cn("badge", tone ?? badgeTone(String(children)))}>{children}</span>;
}

export function badgeTone(value: string): StatusTone {
  const key = value.toLowerCase();
  if (["active", "success", "known", "resolved", "connected"].some((v) => key.includes(v))) return key === "active" ? "active" : "success";
  if (["critical", "blocked", "failed", "open"].some((v) => key.includes(v))) return key.includes("failed") ? "failed" : "critical";
  if (["high", "suspicious", "investigating"].some((v) => key.includes(v))) return "high";
  if (["medium", "new", "idle", "site"].some((v) => key.includes(v))) return key === "new" ? "new" : "medium";
  if (["revoked", "expired", "inactive"].some((v) => key.includes(v))) return "revoked";
  if (key === "low") return "low";
  return "neutral";
}

type Action = { label: string; href?: string; icon?: LucideIcon; primary?: boolean };

export function PageHeader({ eyebrow, title, description, actions, backHref }: {
  eyebrow?: string; title: string; description: string; actions?: Action[]; backHref?: string;
}) {
  return (
    <header className="page-header">
      <div>
        {backHref && <Link href={backHref} className="button" style={{ marginBottom: 14 }}><ArrowLeft size={14} />Back</Link>}
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {actions && <div className="actions">{actions.map((action) => {
        const Icon = action.icon ?? (action.primary ? Plus : Download);
        const content = <><Icon size={14} />{action.label}</>;
        return action.href ? <Link key={action.label} href={action.href} className={cn("button", action.primary && "primary")}>{content}</Link> : <button key={action.label} className={cn("button", action.primary && "primary")}>{content}</button>;
      })}</div>}
    </header>
  );
}

export function StatStrip({ items }: { items: { label: string; value: string }[] }) {
  return <div className="stat-strip">{items.map((item) => <div className="strip-item" key={item.label}><div className="strip-label">{item.label}</div><div className="strip-value">{item.value}</div></div>)}</div>;
}

export function Panel({ title, subtitle, action, children, className }: { title?: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={cn("panel", className)}>{(title || action) && <div className="panel-header"><div><h2 className="panel-title">{title}</h2>{subtitle && <p className="panel-subtitle">{subtitle}</p>}</div>{action}</div>}{children}</section>;
}

export function SiteIdentity({ name, domain }: { name: string; domain?: string }) {
  return <div className="site-identity"><span className="site-favicon">{name.slice(0, 1)}</span><span><span className="cell-primary">{name}</span>{domain && <span className="cell-secondary">{domain}</span>}</span></div>;
}
