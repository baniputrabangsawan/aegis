# Global Multi-Site Security Dashboard — Prompt Bertahap

## PROMPT 1 — Frontend / Tampilan Dashboard

Anda adalah **Senior UI/UX Designer + Senior Frontend Engineer**.

Bangun **frontend lengkap Global Multi-Site Security Dashboard** untuk memonitor banyak website dari satu dashboard.

### Fokus
HANYA kerjakan:
- UI/UX
- layout
- navigation
- responsive design
- tabel
- chart
- modal/drawer
- search/filter
- loading, empty, dan error state

Jangan membuat backend, database, authentication logic, Collector API, atau SDK pada tahap ini.

### Stack
- Next.js terbaru
- App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Table
- Recharts
- Lucide Icons
- pnpm

Gunakan mock data terstruktur hanya untuk pengembangan UI.

### Design
Gaya:
- modern SaaS security dashboard
- minimal
- professional
- premium
- technical
- data-dense
- high readability

Referensi atmosfer: Cloudflare, Vercel, Sentry, Datadog, Better Stack, Linear.

Hindari neon, gaming UI, gradient/glow berlebihan, dan glassmorphism berlebihan.

### Navigation
```text
Overview

Sites
├── All Sites
└── Add Site

Monitoring
├── Live Activity
├── Sessions
├── Login Activity
├── Users
└── Devices

Security
├── Security Events
├── Blocked IPs
└── Audit Logs

Developer
├── API Keys
├── Integration
└── Documentation

Settings
```

### Halaman
Buat minimal:

```text
/dashboard
/dashboard/sites
/dashboard/sites/new
/dashboard/sites/[siteId]
/dashboard/live
/dashboard/sessions
/dashboard/login-activity
/dashboard/users
/dashboard/devices
/dashboard/security-events
/dashboard/blocked-ips
/dashboard/api-keys
/dashboard/audit-logs
```

### Overview Metrics
```text
Total Websites
Active Websites
Users Online
Active Sessions
Logins Today
Failed Logins
New Devices
Security Alerts
```

Tambahkan:
- successful vs failed login chart
- device distribution
- browser distribution
- OS distribution
- website overview table

### Tables
Site:
```text
Website | Status | Online | Sessions | Login Today | Failed | Alerts | Risk | Last Event
```

Session:
```text
Site | User | Device | OS | Browser | IP | Location | Login | Last Active | Status
```

Login Activity:
```text
Time | Site | User | Result | Device | Browser | IP | Location | Reason | Risk
```

Devices:
```text
Device | User | Site | OS | Browser | First Seen | Last Seen | IP | Status
```

Security Events:
```text
Time | Site | User | Event | IP | Risk | Severity | Status
```

### Responsive
Desktop:
- persistent sidebar
- full tables
- charts
- drawers

Mobile:
- navigation drawer
- cards
- stacked details
- bottom sheet

Jangan memaksakan tabel desktop di mobile.

### Quality
- strict TypeScript
- reusable components
- accessible
- semantic HTML
- keyboard navigation
- no giant component
- no unnecessary `any`

Berhenti setelah frontend selesai dan production build berhasil.

---

## PROMPT 2 — Database + Backend Dashboard

Anda adalah **Principal Backend Engineer + Database Architect + SaaS Architect**.

Frontend sudah selesai. Sekarang bangun backend dasar tanpa merusak UI.

### Fokus
Kerjakan:
- PostgreSQL
- Prisma ORM
- dashboard authentication
- organization
- multi-site architecture
- internal dashboard APIs
- RBAC
- audit log

Jangan membuat Collector API eksternal atau SDK dulu.

### Entity
```text
Organization
AdminUser
Site
ExternalUser
Session
Device
LoginAttempt
SecurityEvent
BlockedIP
AuditLog
SiteApiCredential
```

### Site
```text
id
organizationId
name
slug
domain
environment
status
verifiedAt
lastEventAt
createdAt
updatedAt
deletedAt
```

Environment:
```text
PRODUCTION
STAGING
DEVELOPMENT
```

### Authentication
Role:
```text
OWNER
ADMIN
SECURITY_ANALYST
VIEWER
```

Buat server-side:
```text
requireAuth()
requireRole()
requirePermission()
```

### Multi-Tenant Security
Semua query wajib scoped berdasarkan `organizationId`.

Pastikan:
```text
Organization A tidak dapat membaca Organization B.
Site A tidak mencampur data Site B.
```

### Internal APIs
Hubungkan frontend ke data nyata untuk:
- overview
- sites
- sessions
- login activity
- users
- devices
- security events
- blocked IPs
- audit logs

Gunakan:
- server-side pagination
- filtering
- sorting
- search

Gunakan soft delete untuk Site.

Catat audit:
```text
SITE_CREATED
SITE_UPDATED
SITE_DELETED
SETTING_CHANGED
```

Jalankan lint, typecheck, Prisma validation, dan production build.

Berhenti setelah backend dashboard dasar stabil.

---

## PROMPT 3 — Site ID, Secret Key & Collector API

Anda adalah **Senior API Security Engineer + Backend Engineer**.

Backend dashboard sudah selesai. Sekarang buat integrasi website eksternal.

### Target
```text
Add Website
→ Generate Site ID
→ Generate Secret Key
→ Website mengirim Event
```

### Credential
Setiap Site memiliki:
```text
SITE_ID
SECRET_KEY
```

Format:
```text
sk_live_xxxxx
sk_test_xxxxx
```

Secret wajib:
- minimal 256-bit cryptographic entropy
- plaintext hanya tampil sekali
- database hanya menyimpan hash
- dapat dirotate
- dapat direvoke

### Collector API
```text
POST /api/v1/events
POST /api/v1/events/batch
```

Headers:
```text
X-Site-ID: site_xxx
Authorization: Bearer sk_live_xxx
```

### Event
```json
{
  "eventId": "evt_unique",
  "event": "auth.login.success",
  "externalUserId": "123",
  "externalSessionId": "session_123",
  "timestamp": "ISO-8601",
  "metadata": {}
}
```

Supported events:
```text
auth.login.success
auth.login.failed
auth.logout
auth.mfa.success
auth.mfa.failed
user.registered
session.created
session.refreshed
session.revoked
session.expired
security.rate_limited
security.turnstile_failed
security.suspicious
custom
```

### Collector Flow
```text
Validate request size
→ Validate Site ID
→ Validate Secret
→ Rate limit
→ Validate schema
→ Check idempotency
→ Normalize
→ Persist
→ Process event
```

Unique idempotency:
```text
siteId + eventId
```

Rate limit berdasarkan Site, credential, dan IP.

Jangan menerima:
- password
- password hash
- raw cookies
- MFA secret
- raw auth token
- payment data

Test:
- valid key accepted
- invalid/revoked key rejected
- wrong site rejected
- duplicate event aman
- invalid payload rejected
- rate limit bekerja

Berhenti setelah Collector API stabil.

---

## PROMPT 4 — Login, Session, Device, IP & GeoIP

Anda adalah **Senior Authentication Engineer + Security Telemetry Engineer**.

Collector API sudah bekerja. Sekarang proses event menjadi telemetry dashboard.

### Event Processing

`auth.login.success`:
```text
create/update ExternalUser
create successful LoginAttempt
create/update Device
create Session
update Site.lastEventAt
```

`auth.login.failed`:
```text
create failed LoginAttempt
```

`auth.logout`:
```text
Session → LOGGED_OUT
set logoutAt
```

`session.refreshed`:
```text
update lastActiveAt
```

Throttle update aktivitas agar tidak menulis database setiap request.

### User-Agent
Gunakan `ua-parser-js`.

Parse:
```text
Browser
Browser Version
OS
OS Version
Device Type
Device Vendor
Device Model
```

Jika tidak tersedia, gunakan `Unknown`. Jangan mengarang model device.

Friendly name:
```text
Chrome on Linux
Chrome Mobile on Android
Safari on macOS
Edge on Windows
```

### Device
```text
id
organizationId
siteId
externalUserId
deviceKey
deviceType
vendor
model
browser
os
firstSeenAt
lastSeenAt
lastIp
status
```

Status:
```text
KNOWN
NEW
SUSPICIOUS
REVOKED
```

### IP
Gunakan trusted proxy policy.

Jika Cloudflare:
```text
CF-Connecting-IP
CF-IPCountry
CF-Ray
```

Jangan mempercayai `X-Forwarded-For` secara sembarangan.

### GeoIP
Gunakan abstraction:
```text
GeoIPProvider
```

Simpan bila tersedia:
```text
country
region
city
timezone
ASN
ISP
```

Semua lokasi diberi label:
```text
Approximate location based on IP
```

Jangan collect:
- GPS
- camera
- microphone
- MAC address
- serial hardware
- contacts

Hubungkan halaman Sessions, Login Activity, Users, dan Devices ke data nyata.

Berhenti setelah telemetry end-to-end bekerja.

---

## PROMPT 5 — Security Engine, Risk & IP Blocking

Anda adalah **Senior Detection Engineer + Application Security Engineer**.

Telemetry sudah bekerja. Sekarang buat security operations.

### SecurityEvent
```text
id
organizationId
siteId
externalUserId
sessionId
eventType
severity
riskScore
title
description
ipAddress
reasons
metadata
createdAt
resolvedAt
```

### Detection Rules
Implementasikan baseline:
```text
Repeated failed login
New device
New country
Many failed attempts from one IP
Many accounts from one IP
Blocked IP attempt
Revoked session reuse
Turnstile failure
Rate-limit violation
Rapid IP changes
Impossible travel indication
```

### Risk Score
Baseline configurable:
```text
New Device          +20
New Country         +20
5 Failed Logins     +25
10 Failed Logins    +40
Revoked Session     +60
Blocked IP          +80
```

Classification:
```text
0–19   LOW
20–49  MEDIUM
50–79  HIGH
80+    CRITICAL
```

Setiap event wajib menyimpan alasan, misalnya:
```text
NEW_DEVICE
NEW_COUNTRY
MULTIPLE_FAILED_LOGINS
```

### Blocked IP
Scope:
```text
GLOBAL
SITE
```

Durasi:
```text
1 hour
24 hours
7 days
30 days
Permanent
```

Pisahkan:
```text
MONITOR_ONLY
MONITOR_AND_ENFORCE
```

Jangan mengklaim IP telah diblokir pada website eksternal jika enforcement belum diimplementasikan.

### Audit
Catat:
```text
IP_BLOCKED
IP_UNBLOCKED
SESSION_REVOKED
SESSION_MARKED_SUSPICIOUS
SECURITY_EVENT_RESOLVED
```

Hubungkan Security Events, Blocked IPs, dan Audit Logs ke backend nyata.

Berhenti setelah security operations stabil.

---

## PROMPT 6 — SDK & Integrasi Website

Anda adalah **Senior SDK Engineer + Developer Experience Engineer**.

Global Security Dashboard dan Collector API sudah selesai.

Sekarang buat SDK agar website baru mudah dihubungkan.

### Package
```text
@global-security/nextjs
```

### Instalasi
```bash
pnpm add @global-security/nextjs
```

Environment:
```env
GLOBAL_SECURITY_SITE_ID=
GLOBAL_SECURITY_SECRET_KEY=
GLOBAL_SECURITY_ENDPOINT=
```

Initialization:
```ts
import { createSecurityClient } from "@global-security/nextjs";

export const security = createSecurityClient({
  siteId: process.env.GLOBAL_SECURITY_SITE_ID!,
  secretKey: process.env.GLOBAL_SECURITY_SECRET_KEY!,
  endpoint: process.env.GLOBAL_SECURITY_ENDPOINT!,
});
```

### SDK API
```text
security.auth.loginSuccess()
security.auth.loginFailed()
security.auth.logout()

security.session.created()
security.session.refreshed()
security.session.revoked()

security.user.registered()

security.security.rateLimited()
security.security.turnstileFailed()
security.security.suspicious()

security.track()
```

Contoh:
```ts
await security.auth.loginSuccess({
  externalUserId: user.id,
  email: user.email,
  request,
});
```

### Metadata Otomatis
SDK boleh mengambil:
```text
User-Agent
IP request context
route
timestamp
runtime
SDK version
```

Jangan mengirim:
- password
- raw session token
- raw cookies
- MFA secret
- payment data
- user Authorization header

### Reliability
Monitoring tidak boleh membuat website utama down.

Implementasikan:
- timeout
- bounded retry
- exponential backoff
- safe failure

Jangan infinite retry.

### Dashboard Integration
Setelah Add Site, tampilkan:
```text
Install SDK
Environment Variables
Initialization
Authentication Hooks
Send Test Event
```

Setelah test event diterima:
```text
Integration Verified
Connected
Last Event
SDK Version
Environment
```

### Documentation
Buat `/docs` dengan:
```text
Quick Start
Next.js
REST API
Authentication Events
Session Events
Security Events
Custom Events
API Keys
Troubleshooting
```

### Final Acceptance Flow
```text
Add Website
→ Generate Site ID + Secret
→ Install SDK
→ Add Environment Variables
→ Connect Authentication
→ Send Login Event
→ Collector Receives Event
→ Session Created
→ Device Detected
→ Dashboard Updated
→ Security Analysis
```

Berhenti setelah flow tersebut benar-benar bekerja end-to-end.
