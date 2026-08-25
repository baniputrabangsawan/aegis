"use client";

import { useState } from "react";
import { Activity, AlertTriangle, CirclePause, CirclePlay, KeyRound, LogOut, MonitorSmartphone, Radio, RefreshCw } from "lucide-react";
import { PageHeader, Panel, StatStrip, StatusBadge } from "@/components/ui";
import { liveEvents } from "@/lib/mock-data";

const icons = { failed: AlertTriangle, login: KeyRound, alert: Radio, device: MonitorSmartphone, session: RefreshCw, logout: LogOut };

export function LivePage() {
  const [paused, setPaused] = useState(false);
  return <div className="page"><PageHeader eyebrow="Monitoring" title="Live activity" description="Authentication and security telemetry as it arrives across your sites." actions={[{ label: paused ? "Resume stream" : "Pause stream", icon: paused ? CirclePlay : CirclePause }]} /><StatStrip items={[{ label: "Events / min", value: paused ? "Paused" : "286" }, { label: "Connected sites", value: "11 / 12" }, { label: "Login success", value: "97.5%" }, { label: "Alerts / min", value: "3.2" }]} /><Panel title="Event stream" subtitle={paused ? "Live updates paused locally" : "Updating in real time"} action={<button className="button" onClick={() => setPaused((value) => !value)}>{paused ? <CirclePlay size={14} /> : <CirclePause size={14} />}{paused ? "Resume" : "Pause"}</button>}><div className="event-feed">{liveEvents.map((event, index) => { const Icon = icons[event.type as keyof typeof icons] ?? Activity; return <div className="event-item" key={`${event.time}-${index}`}><span className="event-time">{event.time}</span><span className="event-icon"><Icon size={14} /></span><span><div className="event-title">{event.title}</div><div className="event-detail">{event.detail}</div></span><StatusBadge>{event.tone}</StatusBadge></div>; })}</div></Panel></div>;
}
