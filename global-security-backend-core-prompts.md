# Global Security Dashboard — Backend & Core System Prompts

Gunakan prompt berikut **satu per satu**. Jangan jalankan semuanya sekaligus.

---

# PROMPT 1 — Backend Foundation

Anda adalah **Principal Backend Engineer + Software Architect**.

Frontend Global Security Dashboard sudah tersedia.

Bangun fondasi backend production-ready tanpa mengubah desain frontend secara besar.

## Stack

Gunakan:

```text
Next.js terbaru
App Router
TypeScript strict
PostgreSQL
Prisma ORM
Better Auth
Zod
pnpm
```

## Fokus

Kerjakan:

- database connection
- server architecture
- authentication dashboard
- RBAC
- organization/multi-tenant foundation
- error handling
- validation
- internal API structure
- environment configuration

Gunakan struktur modular seperti:

```text
src/
├── app/api/
├── lib/
├── server/
│   ├── repositories/
│   ├── services/
│   ├── auth/
│   └── security/
├── validators/
└── types/
```

## Authentication

Role:

```text
OWNER
ADMIN
SECURITY_ANALYST
VIEWER
```

Buat server-side guard:

```text
requireAuth()
requireRole()
requirePermission()
```

Jangan mengandalkan proteksi UI.

## Security

Implementasikan:

- HttpOnly cookies
- Secure cookie pada production
- SameSite
- CSRF protection bila relevan
- secure headers
- Zod validation
- safe error responses
- no stack trace ke client production

Berhenti setelah backend foundation stabil.

---

# PROMPT 2 — Database Multi-Tenant

Anda adalah **Senior Database Architect + SaaS Architect**.

Bangun schema database untuk Global Multi-Site Security Dashboard.

## Entity Utama

```text
Organization
AdminUser
Site
SiteApiCredential
ExternalUser
Session
Device
LoginAttempt
SecurityEvent
BlockedIP
AuditLog
```

## Site

Minimal:

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

## Isolation

Semua data wajib scoped dengan:

```text
organizationId
siteId
```

Pastikan:

```text
Organization A tidak dapat membaca Organization B.
Site A tidak mencampur data Site B.
```

Gunakan unique constraint yang tepat, misalnya:

```text
siteId + externalUserId
siteId + eventId
```

Gunakan soft delete untuk Site.

Tambahkan index pada:

```text
organizationId
siteId
externalUserId
ipAddress
status
createdAt
lastActiveAt
eventType
riskLevel
```

Jangan melakukan destructive migration.

Berhenti setelah schema tervalidasi dan migration aman.

---

# PROMPT 3 — Site Management + API Credentials

Anda adalah **Senior Backend Engineer + Application Security Engineer**.

Buat sistem untuk:

```text
Add Website
→ Generate Site ID
→ Generate Secret Key
→ Manage Credentials
```

## Site API Credential

Schema:

```text
id
organizationId
siteId
name
keyPrefix
secretHash
environment
createdAt
lastUsedAt
expiresAt
revokedAt
```

## Secret

Format:

```text
sk_live_xxxxx
sk_test_xxxxx
```

Wajib:

- minimal 256-bit cryptographic entropy
- plaintext hanya ditampilkan sekali
- database hanya menyimpan hash
- dapat dirotate
- dapat direvoke
- jangan simpan full secret di AuditLog

Fitur:

```text
Create Key
Rotate Key
Revoke Key
List Keys
```

Integrasikan dengan halaman Add Site dan API Keys.

Berhenti setelah credential system aman dan teruji.

---

# PROMPT 4 — Collector API

Anda adalah **Senior API Security Engineer + Backend Engineer**.

Bangun Collector API untuk menerima event dari banyak website.

## Endpoint

```text
POST /api/v1/events
POST /api/v1/events/batch
```

Headers:

```text
X-Site-ID: site_xxx
Authorization: Bearer sk_live_xxx
```

## Payload

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

## Event Types

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

## Flow

```text
Validate request size
→ Validate Site ID
→ Validate Secret
→ Rate limit
→ Zod validation
→ Check idempotency
→ Normalize event
→ Persist
→ Process event
→ Response
```

Idempotency:

```text
siteId + eventId
```

Batasi request abnormal.

Monitoring tidak boleh menjadi single point of failure website client.

Berhenti setelah Collector API stabil dan test lulus.

---

# PROMPT 5 — Login, Session & User Processing

Anda adalah **Senior Authentication Engineer**.

Proses event Collector menjadi data dashboard.

## auth.login.success

Lakukan:

```text
create/update ExternalUser
create successful LoginAttempt
create/update Device
create Session
update Site.lastEventAt
```

## auth.login.failed

Buat:

```text
LoginAttempt
success=false
failureReason
```

## auth.logout

Update:

```text
Session.status = LOGGED_OUT
logoutAt = timestamp
```

## session.refreshed

Update:

```text
lastActiveAt
```

Gunakan throttling agar database tidak di-update setiap request.

## Session Status

```text
ACTIVE
IDLE
INACTIVE
EXPIRED
REVOKED
LOGGED_OUT
```

Default:

```text
ACTIVE    < 5 menit
IDLE      5–30 menit
INACTIVE  > 30 menit tetapi belum expired
```

Hubungkan halaman:

```text
Users
Sessions
Login Activity
```

ke backend nyata.

Berhenti setelah event login/logout/session bekerja end-to-end.

---

# PROMPT 6 — Device, IP & GeoIP

Anda adalah **Senior Security Telemetry Engineer**.

Tambahkan enrichment metadata untuk setiap login/session.

## User-Agent

Gunakan:

```text
ua-parser-js
```

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

Jika tidak diketahui gunakan:

```text
Unknown
```

Jangan mengarang model perangkat.

Friendly label:

```text
Chrome on Linux
Chrome Mobile on Android
Safari on macOS
Edge on Windows
```

## IP

Gunakan trusted proxy policy.

Jika Cloudflare tersedia:

```text
CF-Connecting-IP
CF-IPCountry
CF-Ray
```

Jangan percaya `X-Forwarded-For` tanpa validasi trusted proxy.

## GeoIP

Gunakan abstraction:

```text
GeoIPProvider
```

Simpan jika tersedia:

```text
country
region
city
timezone
ASN
ISP
```

Label:

```text
Approximate location based on IP
```

Bukan GPS.

## Jangan Collect

```text
GPS
camera
microphone
MAC address
hardware serial
contacts
```

Hubungkan halaman Devices dan Session Detail ke data nyata.

---

# PROMPT 7 — Security Engine & Risk Scoring

Anda adalah **Senior Detection Engineer + Application Security Engineer**.

Bangun security event processor.

## Detection Rules

Minimal:

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

## Risk Baseline

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

Rules harus configurable.

Setiap event wajib menyimpan alasan:

```text
NEW_DEVICE
NEW_COUNTRY
MULTIPLE_FAILED_LOGINS
```

Jangan melakukan permanent blocking hanya berdasarkan risk score.

Hubungkan ke halaman Security Events.

---

# PROMPT 8 — Blocked IP & Enforcement

Anda adalah **Senior Security Platform Engineer**.

Implementasikan management Blocked IP.

## Scope

```text
GLOBAL
SITE
```

## Data

```text
IP
Scope
Site
Reason
Blocked By
Created At
Expires At
Status
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

Jangan mengklaim remote IP sudah diblokir jika website client belum menerapkan enforcement.

Lindungi:

```text
localhost
private network
internal reverse proxy
known infrastructure
```

Catat AuditLog:

```text
IP_BLOCKED
IP_UNBLOCKED
```

---

# PROMPT 9 — Audit Log & Admin Security

Anda adalah **Senior IAM Engineer + Security Engineer**.

Perkuat keamanan dashboard pusat.

## RBAC

Role:

```text
OWNER
ADMIN
SECURITY_ANALYST
VIEWER
```

Buat permission matrix eksplisit.

## Audit Event

Catat minimal:

```text
SITE_CREATED
SITE_UPDATED
SITE_DELETED

API_KEY_CREATED
API_KEY_ROTATED
API_KEY_REVOKED

IP_BLOCKED
IP_UNBLOCKED

SESSION_REVOKED
SESSION_MARKED_SUSPICIOUS

ROLE_CHANGED
SETTING_CHANGED
```

Schema:

```text
actorId
action
targetType
targetId
metadata
actorIp
createdAt
```

Audit log tidak boleh menyimpan secret atau credential sensitif.

Semua authorization wajib server-side.

---

# PROMPT 10 — SDK Next.js

Anda adalah **Senior SDK Engineer + Developer Experience Engineer**.

Buat package:

```text
@global-security/nextjs
```

## Instalasi

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

## API

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

## Reliability

Gunakan:

```text
timeout
bounded retry
exponential backoff
safe failure
```

Monitoring tidak boleh membuat website utama down.

## Jangan Kirim

```text
password
raw session token
raw cookies
MFA secret
payment data
Authorization header user
```

Berhenti setelah SDK dapat mengirim event ke Collector API.

---

# PROMPT 11 — Onboarding & Documentation

Anda adalah **Senior Developer Experience Engineer**.

Buat onboarding integrasi.

Flow:

```text
Create Site
→ Generate Credentials
→ Choose Framework
→ Install SDK
→ Set Environment Variables
→ Add Auth Hooks
→ Send Test Event
→ Integration Verified
```

Tampilkan:

```text
Connected
Last Event
SDK Version
Environment
```

Buat `/docs`:

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

Tambahkan Test Event untuk memastikan integrasi benar.

---

# PROMPT 12 — Testing, Performance & Hardening

Anda adalah **Principal Engineer + Security Reviewer + Performance Engineer**.

Jangan menambah fitur baru.

Audit seluruh backend.

## Security Tests

Wajib:

```text
Organization A tidak dapat membaca Organization B
Site A tidak dapat membaca Site B
invalid secret ditolak
revoked secret ditolak
secret tidak tampil lagi setelah creation
duplicate event tidak double insert
spoofed siteId ditolak
arbitrary forwarded IP tidak dipercaya
VIEWER tidak dapat block IP
unauthenticated admin API ditolak
```

## Collector Tests

```text
payload terlalu besar
malformed JSON
invalid schema
rate limiting
duplicate event
batch processing
timeout behavior
```

## Performance

Periksa:

```text
N+1 query
over-fetching
unbounded query
server-side pagination
database indexes
GeoIP caching
session update frequency
dashboard aggregation
```

Jalankan:

```text
lint
typecheck
tests
production build
```

Semua error blocking harus diperbaiki.

---

# PROMPT 13 — Deployment & Observability

Anda adalah **Senior DevOps Engineer + Site Reliability Engineer**.

Siapkan Global Security Dashboard untuk production.

## Deployment

Siapkan:

```text
production environment variables
PostgreSQL production
migration strategy
HTTPS
secure cookies
trusted proxy
backup database
health checks
```

Jangan simpan secret di repository.

## Observability

Tambahkan structured logging untuk:

```text
collector requests
collector latency
collector errors
failed credential validation
rate-limit events
database errors
security processor errors
```

Jangan log:

```text
full SECRET_KEY
password
raw token
cookies
MFA secret
```

Buat health endpoint internal yang aman.

Siapkan monitoring untuk:

```text
API latency
error rate
events processed
database health
storage growth
failed integrations
```

Deployment dianggap selesai hanya jika migration, security config, health checks, logging, dan production build telah diverifikasi.

---

# FINAL END-TO-END ACCEPTANCE

Sistem dianggap selesai jika flow ini benar-benar bekerja:

```text
Admin Login
→ Add Website
→ Generate SITE_ID + SECRET_KEY
→ Install SDK
→ Send Login Event
→ Collector Validates Credential
→ Event Stored
→ User Created/Updated
→ Device Detected
→ Session Created
→ IP/GeoIP Processed
→ Security Risk Evaluated
→ Dashboard Updated
→ Audit Recorded
```

Prioritas global:

```text
Security
>
Correctness
>
Privacy
>
Reliability
>
Maintainability
>
Performance
>
Visual Polish
```
