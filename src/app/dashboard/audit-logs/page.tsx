import { Download } from "lucide-react";
import { RecordsPage } from "@/components/records-page";
import { auditLogs } from "@/lib/mock-data";

export default function AuditLogsPage() { return <RecordsPage eyebrow="Security" title="Audit logs" description="An immutable-style activity trail of administrative and security-sensitive actions." data={auditLogs} stats={[{ label: "Events today", value: "142" }, { label: "Admin actions", value: "38" }, { label: "Security actions", value: "51" }, { label: "Policy changes", value: "4" }]} searchPlaceholder="Search actor, action, or target…" actions={[{ label: "Export", icon: Download }]} columns={[{ key: "time", label: "Time", kind: "mono" }, { key: "actor", label: "Actor", kind: "primary" }, { key: "action", label: "Action", kind: "mono" }, { key: "target", label: "Target" }, { key: "site", label: "Site" }, { key: "ip", label: "Actor IP", kind: "mono" }, { key: "detail", label: "Details" }]} />; }
