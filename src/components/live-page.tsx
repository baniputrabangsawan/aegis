"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CirclePause, CirclePlay, KeyRound, LogOut, MonitorSmartphone, Radio, RefreshCw } from "lucide-react";
import { PageHeader, Panel, StatStrip, StatusBadge } from "@/components/ui";

const icons = { failed: AlertTriangle, login: KeyRound, alert: Radio, device: MonitorSmartphone, session: RefreshCw, logout: LogOut };
type LiveEvent = { time: string; title: string; detail: string; type: string; tone: string };
type LiveStats = { eventsPerMinute: number; connectedSites: number; totalSites: number; loginSuccessRate: number; alertsPerMinute: number };

export function LivePage({ events, stats }: { events: LiveEvent[]; stats: LiveStats }) {
  const [paused, setPaused] = useState(false);
  const [feed, setFeed] = useState(events);
  const [currentStats, setCurrentStats] = useState(stats);
  useEffect(() => {
    if (paused) return;
    const refresh = async () => {
      const response = await fetch("/api/internal/live", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json() as { events: LiveEvent[]; stats: LiveStats };
      setFeed(data.events);
      setCurrentStats(data.stats);
    };
    const timer = window.setInterval(refresh, 5_000);
    return () => window.clearInterval(timer);
  }, [paused]);
  return <div className="page"><PageHeader eyebrow="Monitoring" title="Live activity" description="Authentication and security telemetry as it arrives across your sites." actions={[{ label: paused ? "Resume stream" : "Pause stream", icon: paused ? CirclePlay : CirclePause }]} /><StatStrip items={[{ label: "Events / min", value: paused ? "Paused" : String(currentStats.eventsPerMinute) }, { label: "Connected sites", value: `${currentStats.connectedSites} / ${currentStats.totalSites}` }, { label: "Login success", value: `${(currentStats.loginSuccessRate * 100).toFixed(1)}%` }, { label: "Alerts / min", value: String(currentStats.alertsPerMinute) }]} /><Panel title="Event stream" subtitle={paused ? "Live updates paused locally" : "Auto-refreshing every 5 seconds"} action={<button className="button" onClick={() => setPaused((value) => !value)}>{paused ? <CirclePlay size={14} /> : <CirclePause size={14} />}{paused ? "Resume" : "Pause"}</button>}><div className="event-feed">{feed.length === 0 ? <div className="table-empty">No telemetry yet. Create a site, issue an API key, then send your first collector event.</div> : feed.map((event, index) => { const Icon = icons[event.type as keyof typeof icons] ?? Activity; return <div className="event-item" key={`${event.time}-${index}`}><span className="event-time">{event.time}</span><span className="event-icon"><Icon size={14} /></span><span><div className="event-title">{event.title}</div><div className="event-detail">{event.detail}</div></span><StatusBadge>{event.tone}</StatusBadge></div>; })}</div></Panel></div>;
}
