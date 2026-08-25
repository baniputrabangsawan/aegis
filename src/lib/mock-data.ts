export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral" | "low" | "medium" | "high" | "critical" | "active" | "new" | "suspicious" | "failed" | "revoked";

export type Site = {
  id: string; name: string; domain: string; environment: string; status: string;
  online: number; sessions: number; logins: number; failed: number; alerts: number;
  risk: string; lastEvent: string;
};

export const metrics = [
  { label: "Total websites", value: "12", trend: "+2", note: "this month", icon: "sites" },
  { label: "Active websites", value: "11", trend: "91.7%", note: "healthy", icon: "active" },
  { label: "Users online", value: "1,284", trend: "+8.4%", note: "vs. last hour", icon: "users" },
  { label: "Active sessions", value: "1,697", trend: "+126", note: "in 30 minutes", icon: "sessions" },
  { label: "Logins today", value: "8,492", trend: "+12.1%", note: "vs. yesterday", icon: "login" },
  { label: "Failed logins", value: "214", trend: "−4.7%", note: "vs. yesterday", icon: "failed", down: true },
  { label: "New devices", value: "89", trend: "+14", note: "awaiting review", icon: "device" },
  { label: "Security alerts", value: "17", trend: "3 critical", note: "needs attention", icon: "alert", danger: true },
];

export const loginChart = [
  { time: "00:00", success: 238, failed: 12 }, { time: "03:00", success: 181, failed: 8 },
  { time: "06:00", success: 319, failed: 15 }, { time: "09:00", success: 714, failed: 28 },
  { time: "12:00", success: 921, failed: 24 }, { time: "15:00", success: 1068, failed: 37 },
  { time: "18:00", success: 843, failed: 49 }, { time: "21:00", success: 546, failed: 21 },
];

export const sites: Site[] = [
  { id: "aurora-prod", name: "Aurora Commerce", domain: "aurora.shop", environment: "Production", status: "Active", online: 426, sessions: 582, logins: 2418, failed: 31, alerts: 2, risk: "Low", lastEvent: "8 sec ago" },
  { id: "ledger-prod", name: "Ledger Portal", domain: "app.ledger.id", environment: "Production", status: "Active", online: 297, sessions: 381, logins: 1987, failed: 68, alerts: 5, risk: "High", lastEvent: "12 sec ago" },
  { id: "northstar", name: "Northstar CRM", domain: "northstar.cloud", environment: "Production", status: "Active", online: 184, sessions: 248, logins: 1104, failed: 22, alerts: 1, risk: "Medium", lastEvent: "21 sec ago" },
  { id: "atlas-admin", name: "Atlas Admin", domain: "admin.atlas.co", environment: "Staging", status: "Active", online: 38, sessions: 49, logins: 306, failed: 4, alerts: 0, risk: "Low", lastEvent: "34 sec ago" },
  { id: "meridian", name: "Meridian Accounts", domain: "accounts.meridian.io", environment: "Production", status: "Active", online: 219, sessions: 302, logins: 1621, failed: 74, alerts: 7, risk: "Critical", lastEvent: "46 sec ago" },
  { id: "relay-docs", name: "Relay Docs", domain: "docs.relay.dev", environment: "Development", status: "Inactive", online: 0, sessions: 0, logins: 0, failed: 0, alerts: 0, risk: "Low", lastEvent: "4 days ago" },
];

export const sessions = [
  { site: "Aurora Commerce", user: "Maya Santoso", email: "maya@aurora.shop", device: "MacBook Pro", os: "macOS 15.4", browser: "Chrome 136", ip: "103.147.8.42", location: "Jakarta, ID", login: "09:42", lastActive: "Now", status: "Active" },
  { site: "Ledger Portal", user: "Daniel Wijaya", email: "daniel@ledger.id", device: "Windows PC", os: "Windows 11", browser: "Edge 136", ip: "182.253.71.12", location: "Surabaya, ID", login: "09:38", lastActive: "1 min ago", status: "Active" },
  { site: "Meridian Accounts", user: "Unknown user", email: "usr_8f2a91", device: "Android phone", os: "Android 15", browser: "Chrome Mobile", ip: "45.148.10.92", location: "Amsterdam, NL", login: "09:21", lastActive: "4 min ago", status: "Suspicious" },
  { site: "Northstar CRM", user: "Sarah Lim", email: "sarah@northstar.cloud", device: "iPhone 16", os: "iOS 19", browser: "Safari Mobile", ip: "36.80.44.19", location: "Bandung, ID", login: "08:55", lastActive: "8 min ago", status: "Idle" },
  { site: "Aurora Commerce", user: "Rafi Pratama", email: "rafi@gmail.com", device: "Linux desktop", os: "Ubuntu 24.04", browser: "Firefox 138", ip: "114.125.77.24", location: "Makassar, ID", login: "08:31", lastActive: "34 min ago", status: "Inactive" },
  { site: "Atlas Admin", user: "Tania Yusuf", email: "tania@atlas.co", device: "MacBook Air", os: "macOS 15.4", browser: "Safari 18", ip: "125.160.12.2", location: "Jakarta, ID", login: "07:18", lastActive: "1 hr ago", status: "Revoked" },
];

export const logins = [
  { time: "09:48:12", site: "Meridian Accounts", user: "usr_8f2a91", result: "Failed", device: "Android phone", browser: "Chrome Mobile", ip: "45.148.10.92", location: "Amsterdam, NL", reason: "Invalid password", risk: "Critical" },
  { time: "09:47:58", site: "Aurora Commerce", user: "maya@aurora.shop", result: "Success", device: "MacBook Pro", browser: "Chrome", ip: "103.147.8.42", location: "Jakarta, ID", reason: "Password + MFA", risk: "Low" },
  { time: "09:47:31", site: "Ledger Portal", user: "daniel@ledger.id", result: "Success", device: "Windows PC", browser: "Edge", ip: "182.253.71.12", location: "Surabaya, ID", reason: "Passkey", risk: "Low" },
  { time: "09:46:04", site: "Meridian Accounts", user: "usr_8f2a91", result: "Failed", device: "Android phone", browser: "Chrome Mobile", ip: "45.148.10.92", location: "Amsterdam, NL", reason: "Rate limited", risk: "High" },
  { time: "09:44:26", site: "Northstar CRM", user: "sarah@northstar.cloud", result: "Success", device: "iPhone 16", browser: "Safari Mobile", ip: "36.80.44.19", location: "Bandung, ID", reason: "OAuth", risk: "Medium" },
  { time: "09:42:10", site: "Aurora Commerce", user: "newuser@gmail.com", result: "Success", device: "Unknown", browser: "Chrome", ip: "114.122.31.49", location: "Medan, ID", reason: "Password", risk: "Medium" },
];

export const users = [
  { user: "Maya Santoso", email: "maya@aurora.shop", sites: "Aurora Commerce", sessions: 3, devices: 4, location: "Jakarta, ID", lastSeen: "Now", risk: "Low" },
  { user: "Daniel Wijaya", email: "daniel@ledger.id", sites: "Ledger Portal", sessions: 2, devices: 2, location: "Surabaya, ID", lastSeen: "1 min ago", risk: "Low" },
  { user: "Sarah Lim", email: "sarah@northstar.cloud", sites: "Northstar CRM", sessions: 1, devices: 3, location: "Bandung, ID", lastSeen: "8 min ago", risk: "Medium" },
  { user: "Unknown user", email: "usr_8f2a91", sites: "Meridian Accounts", sessions: 1, devices: 1, location: "Amsterdam, NL", lastSeen: "4 min ago", risk: "Critical" },
  { user: "Rafi Pratama", email: "rafi@gmail.com", sites: "Aurora Commerce", sessions: 0, devices: 2, location: "Makassar, ID", lastSeen: "34 min ago", risk: "Low" },
  { user: "Tania Yusuf", email: "tania@atlas.co", sites: "Atlas Admin", sessions: 0, devices: 2, location: "Jakarta, ID", lastSeen: "1 hr ago", risk: "High" },
];

export const devices = [
  { device: "MacBook Pro", user: "Maya Santoso", site: "Aurora Commerce", os: "macOS 15.4", browser: "Chrome 136", firstSeen: "Jan 14, 2026", lastSeen: "Now", ip: "103.147.8.42", status: "Known" },
  { device: "Android phone", user: "Unknown user", site: "Meridian Accounts", os: "Android 15", browser: "Chrome Mobile", firstSeen: "Today, 09:21", lastSeen: "4 min ago", ip: "45.148.10.92", status: "Suspicious" },
  { device: "iPhone 16", user: "Sarah Lim", site: "Northstar CRM", os: "iOS 19", browser: "Safari Mobile", firstSeen: "Today, 08:55", lastSeen: "8 min ago", ip: "36.80.44.19", status: "New" },
  { device: "Windows PC", user: "Daniel Wijaya", site: "Ledger Portal", os: "Windows 11", browser: "Edge 136", firstSeen: "Mar 02, 2026", lastSeen: "1 min ago", ip: "182.253.71.12", status: "Known" },
  { device: "Linux desktop", user: "Rafi Pratama", site: "Aurora Commerce", os: "Ubuntu 24.04", browser: "Firefox 138", firstSeen: "May 20, 2026", lastSeen: "34 min ago", ip: "114.125.77.24", status: "Known" },
  { device: "MacBook Air", user: "Tania Yusuf", site: "Atlas Admin", os: "macOS 15.4", browser: "Safari 18", firstSeen: "Feb 01, 2026", lastSeen: "1 hr ago", ip: "125.160.12.2", status: "Revoked" },
];

export const securityEvents = [
  { time: "09:48", site: "Meridian Accounts", user: "usr_8f2a91", event: "Repeated failed login", ip: "45.148.10.92", risk: "Critical", severity: "Critical", status: "Open" },
  { time: "09:46", site: "Meridian Accounts", user: "3 accounts", event: "Many accounts from one IP", ip: "45.148.10.92", risk: "High", severity: "High", status: "Investigating" },
  { time: "09:42", site: "Aurora Commerce", user: "newuser@gmail.com", event: "New device detected", ip: "114.122.31.49", risk: "Medium", severity: "Medium", status: "Open" },
  { time: "09:31", site: "Ledger Portal", user: "daniel@ledger.id", event: "Rapid IP changes", ip: "182.253.71.12", risk: "High", severity: "High", status: "Resolved" },
  { time: "08:55", site: "Northstar CRM", user: "sarah@northstar.cloud", event: "New country detected", ip: "36.80.44.19", risk: "Medium", severity: "Medium", status: "Open" },
  { time: "08:12", site: "Atlas Admin", user: "tania@atlas.co", event: "Revoked session reuse", ip: "125.160.12.2", risk: "Critical", severity: "Critical", status: "Blocked" },
];

export const blockedIps = [
  { ip: "45.148.10.92", scope: "Global", site: "All sites", reason: "Credential stuffing", blockedBy: "Dimas — Security", created: "Today, 09:50", expires: "Sep 1, 09:50", status: "Active" },
  { ip: "91.215.85.14", scope: "Site", site: "Ledger Portal", reason: "Repeated brute force", blockedBy: "Automated rule", created: "Today, 06:21", expires: "Tomorrow, 06:21", status: "Active" },
  { ip: "185.220.101.4", scope: "Global", site: "All sites", reason: "Known Tor exit node", blockedBy: "Dimas — Security", created: "Aug 22, 14:05", expires: "Permanent", status: "Active" },
  { ip: "103.75.118.62", scope: "Site", site: "Aurora Commerce", reason: "Account enumeration", blockedBy: "Nadia — Admin", created: "Aug 20, 11:32", expires: "Aug 27, 11:32", status: "Active" },
  { ip: "198.98.51.189", scope: "Global", site: "All sites", reason: "Scanner traffic", blockedBy: "Automated rule", created: "Aug 18, 21:10", expires: "Aug 19, 21:10", status: "Expired" },
];

export const auditLogs = [
  { time: "09:50:18", actor: "Dimas Prakoso", action: "IP_BLOCKED", target: "45.148.10.92", site: "All sites", ip: "103.147.8.11", detail: "Blocked for 7 days" },
  { time: "09:34:02", actor: "Nadia Putri", action: "SECURITY_EVENT_RESOLVED", target: "evt_sec_72ab", site: "Ledger Portal", ip: "36.85.22.19", detail: "Marked as false positive" },
  { time: "08:17:44", actor: "Dimas Prakoso", action: "SESSION_REVOKED", target: "ses_91f8d", site: "Atlas Admin", ip: "103.147.8.11", detail: "Revoked suspicious session" },
  { time: "Yesterday", actor: "Nadia Putri", action: "SITE_UPDATED", target: "Aurora Commerce", site: "Aurora Commerce", ip: "36.85.22.19", detail: "Updated production domain" },
  { time: "Aug 23", actor: "Rizky Maulana", action: "API_KEY_ROTATED", target: "sk_live_••••4f91", site: "Meridian Accounts", ip: "180.244.12.8", detail: "Production key rotated" },
  { time: "Aug 22", actor: "Dimas Prakoso", action: "SETTING_CHANGED", target: "Risk thresholds", site: "All sites", ip: "103.147.8.11", detail: "Critical threshold set to 80" },
];

export const liveEvents = [
  { time: "09:48", type: "failed", title: "Login failed", detail: "Meridian Accounts · usr_8f2a91 · 45.148.10.92", tone: "critical" },
  { time: "09:47", type: "login", title: "Login successful", detail: "Aurora Commerce · Maya Santoso · Jakarta", tone: "success" },
  { time: "09:47", type: "login", title: "Login successful", detail: "Ledger Portal · Daniel Wijaya · Surabaya", tone: "success" },
  { time: "09:46", type: "alert", title: "Rate limit triggered", detail: "Meridian Accounts · 45.148.10.92 · 26 requests/min", tone: "high" },
  { time: "09:44", type: "device", title: "New device detected", detail: "Northstar CRM · Sarah Lim · iPhone 16", tone: "medium" },
  { time: "09:42", type: "session", title: "Session refreshed", detail: "Aurora Commerce · Rafi Pratama · Makassar", tone: "info" },
  { time: "09:41", type: "logout", title: "User logged out", detail: "Atlas Admin · Tania Yusuf · Jakarta", tone: "neutral" },
];

export const distributions = {
  device: [{ name: "Desktop", value: 61 }, { name: "Mobile", value: 34 }, { name: "Tablet", value: 5 }],
  browser: [{ name: "Chrome", value: 58 }, { name: "Safari", value: 23 }, { name: "Edge", value: 12 }, { name: "Firefox", value: 7 }],
  os: [{ name: "Windows", value: 38 }, { name: "macOS", value: 27 }, { name: "Android", value: 21 }, { name: "iOS", value: 14 }],
};
