"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, Bell, Blocks, BookOpen, Braces, ChevronDown, FileClock,
  Fingerprint, Globe2, KeyRound, LayoutDashboard, Menu, MonitorSmartphone, Plus,
  Search, Settings, Shield, ShieldBan, Users, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  { label: "Workspace", links: [{ href: "/dashboard", label: "Overview", icon: LayoutDashboard }] },
  { label: "Sites", links: [{ href: "/dashboard/sites", label: "All sites", icon: Globe2 }, { href: "/dashboard/sites/new", label: "Add site", icon: Plus }] },
  { label: "Monitoring", links: [
    { href: "/dashboard/live", label: "Live activity", icon: Activity },
    { href: "/dashboard/sessions", label: "Sessions", icon: Fingerprint },
    { href: "/dashboard/login-activity", label: "Login activity", icon: KeyRound },
    { href: "/dashboard/users", label: "Users", icon: Users },
    { href: "/dashboard/devices", label: "Devices", icon: MonitorSmartphone },
  ] },
  { label: "Security", links: [
    { href: "/dashboard/security-events", label: "Security events", icon: Shield },
    { href: "/dashboard/blocked-ips", label: "Blocked IPs", icon: ShieldBan },
    { href: "/dashboard/audit-logs", label: "Audit logs", icon: FileClock },
  ] },
  { label: "Developer", links: [
    { href: "/dashboard/api-keys", label: "API keys", icon: Braces },
    { href: "/dashboard/integration", label: "Integration", icon: Blocks },
    { href: "/docs", label: "Documentation", icon: BookOpen },
  ] },
  { label: "", links: [{ href: "/dashboard/settings", label: "Settings", icon: Settings }] },
];

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <>
    <div className="sidebar-brand"><span className="brand-mark"><Shield size={17} strokeWidth={2.4} /></span><span><div className="brand-name">Aegis</div><div className="brand-caption">Security control plane</div></span></div>
    <nav className="nav-body" aria-label="Primary navigation">{sections.map((section) => <div className="nav-section" key={section.label || "settings"}>{section.label && <div className="nav-label">{section.label}</div>}{section.links.map(({ href, label, icon: Icon }) => {
      const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
      return <Link href={href} onClick={onNavigate} className={cn("nav-link", active && "active")} key={href}><Icon size={15} strokeWidth={1.8} /><span>{label}</span></Link>;
    })}</div>)}</nav>
    <div className="sidebar-footer"><div className="workspace"><span className="avatar">NC</span><span style={{ minWidth: 0, flex: 1 }}><span style={{ display: "block", fontSize: 12, fontWeight: 600 }}>Nusantara Cloud</span><span className="brand-caption">Enterprise workspace</span></span><ChevronDown size={14} /></div></div>
  </>;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return <div className="app-shell">
    <aside className="sidebar"><Navigation /></aside>
    <div className="app-main">
      <header className="topbar">
        <Dialog.Root><Dialog.Trigger asChild><button className="icon-button mobile-menu" aria-label="Open navigation"><Menu size={18} /></button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="drawer-overlay" /><Dialog.Content className="mobile-drawer" aria-describedby={undefined}><Dialog.Title className="sr-only">Navigation</Dialog.Title><Dialog.Close className="icon-button sheet-close" aria-label="Close navigation"><X size={18} /></Dialog.Close><Navigation onNavigate={() => undefined} /></Dialog.Content></Dialog.Portal></Dialog.Root>
        <div className="topbar-context"><span className="topbar-product">Control center</span><span className="topbar-divider" /><span className="topbar-workspace">Nusantara Cloud</span></div>
        <label className="command-search"><Search size={15} /><input type="search" placeholder="Search resources…" aria-label="Global search" /><span className="keycap">⌘K</span></label>
        <div className="topbar-spacer" />
        <span className="live-indicator"><span className="live-dot" />All systems operational</span>
        <button className="icon-button" aria-label="Notifications"><Bell size={17} /><span className="sr-only">3 unread alerts</span></button>
        <button className="avatar" aria-label="Open account menu">DP</button>
      </header>
      <main>{children}</main>
    </div>
  </div>;
}
