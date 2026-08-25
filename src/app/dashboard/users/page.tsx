import { Download } from "lucide-react";
import { RecordsPage } from "@/components/records-page";
import { users } from "@/lib/mock-data";

export default function UsersPage() { return <RecordsPage eyebrow="Monitoring" title="Users" description="A unified view of external identities observed across connected sites." data={users} stats={[{ label: "Total users", value: "84.3K" }, { label: "Online now", value: "1,284" }, { label: "New today", value: "312" }, { label: "Elevated risk", value: "47" }]} searchPlaceholder="Search name, ID, or email…" actions={[{ label: "Export", icon: Download }]} columns={[{ key: "user", label: "User", kind: "primary" }, { key: "email", label: "External ID / Email" }, { key: "sites", label: "Site" }, { key: "sessions", label: "Sessions", kind: "number" }, { key: "devices", label: "Devices", kind: "number" }, { key: "location", label: "Last location" }, { key: "lastSeen", label: "Last seen" }, { key: "risk", label: "Risk", kind: "risk" }]} />; }
