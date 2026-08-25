import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() { return <main className="page" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}><section className="panel empty-state" style={{ width: "min(100%, 580px)" }}><div><div className="empty-icon"><SearchX size={19} /></div><h1 className="page-title" style={{ fontSize: 18 }}>Page not found</h1><p>The security view you requested does not exist or has moved.</p><Link className="button primary" href="/dashboard">Return to overview</Link></div></section></main>; }
