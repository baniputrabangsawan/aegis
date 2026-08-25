import { Plus } from "lucide-react";
import { RecordsPage } from "@/components/records-page";
import { blockedIps } from "@/lib/mock-data";

export default function BlockedIpsPage() { return <RecordsPage eyebrow="Security" title="Blocked IPs" description="Manage monitored and enforced IP policies. Enforcement requires a connected client integration." data={blockedIps} stats={[{ label: "Active blocks", value: "38" }, { label: "Global", value: "11" }, { label: "Site scoped", value: "27" }, { label: "Expiring today", value: "4" }]} searchPlaceholder="Search IP, reason, or site…" actions={[{ label: "Block IP", icon: Plus, primary: true }]} columns={[{ key: "ip", label: "IP address", kind: "mono" }, { key: "scope", label: "Scope", kind: "status" }, { key: "site", label: "Site" }, { key: "reason", label: "Reason" }, { key: "blockedBy", label: "Blocked by" }, { key: "created", label: "Created" }, { key: "expires", label: "Expires" }, { key: "status", label: "Status", kind: "status" }]} />; }
