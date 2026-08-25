import { Download } from "lucide-react";
import { RecordsPage } from "@/components/records-page";
import { devices } from "@/lib/mock-data";

export default function DevicesPage() { return <RecordsPage eyebrow="Monitoring" title="Devices" description="Track known, new, suspicious, and revoked devices without collecting invasive identifiers." data={devices} stats={[{ label: "Known devices", value: "31.8K" }, { label: "New today", value: "89" }, { label: "Suspicious", value: "24" }, { label: "Revoked", value: "116" }]} searchPlaceholder="Search device, user, or IP…" actions={[{ label: "Export", icon: Download }]} columns={[{ key: "device", label: "Device", kind: "primary" }, { key: "user", label: "User" }, { key: "site", label: "Site" }, { key: "os", label: "OS" }, { key: "browser", label: "Browser" }, { key: "firstSeen", label: "First seen" }, { key: "lastSeen", label: "Last seen" }, { key: "ip", label: "IP", kind: "mono" }, { key: "status", label: "Status", kind: "status" }]} />; }
