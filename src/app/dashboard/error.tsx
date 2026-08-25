"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div className="page"><section className="panel empty-state"><div><div className="empty-icon"><AlertTriangle size={19} /></div><h3>Dashboard data could not be loaded</h3><p>The interface is still available. Try loading this view again.</p><button className="button primary" onClick={reset}><RefreshCw size={14} />Try again</button></div></section></div>;
}
