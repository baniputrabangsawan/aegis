# Global Security Dashboard — Testing, Deployment & Production Prompts

Gunakan prompt berikut **setelah frontend, backend, Collector API, telemetry, security engine, dan SDK selesai**.

Jalankan **satu prompt per tahap**.

---

# PROMPT 1 — Testing & QA

Anda adalah **Senior QA Engineer + Backend Test Engineer + Security Test Engineer**.

Global Security Dashboard sudah memiliki frontend, backend, Collector API, session/device processing, security engine, dan SDK.

Fokus HANYA pada testing.

## Wajib diuji

### Authentication
```text
login admin
logout
expired session
invalid session
role authorization
unauthenticated access
```

### Multi-Tenant Isolation
Pastikan:

```text
Organization A tidak dapat membaca Organization B
Site A tidak dapat membaca Site B
Site A tidak dapat mengubah Site B
```

### API Credentials
Test:

```text
valid key accepted
invalid key rejected
revoked key rejected
expired key rejected
wrong Site ID rejected
secret tidak muncul kembali setelah creation
rotation bekerja
```

### Collector API
Test:

```text
valid event
invalid JSON
invalid schema
payload terlalu besar
duplicate event
batch events
rate limit
replay attempt
missing credential
```

### Login & Session
Test:

```text
login success
login failed
logout
session refresh
session expired
session revoked
duplicate session event
```

### Device
Test:

```text
new device
known device
unknown browser
unknown OS
mobile
desktop
tablet
```

### Security Engine
Test:

```text
repeated failed login
new device
new country
blocked IP
revoked session reuse
rate limit event
Turnstile failure
risk score
risk reasons
```

### Dashboard
Test:

```text
pagination
search
filter
sorting
loading state
empty state
error state
mobile responsive
```

## Tools

Gunakan framework testing yang sesuai project, misalnya:

```text
Vitest
Playwright
Prisma test database
```

Jangan mengubah architecture hanya demi test.

## Exit Criteria

```text
critical flows memiliki test
multi-tenant isolation terbukti
security tests lulus
Collector API tests lulus
frontend E2E utama lulus
production build berhasil
```

---

# PROMPT 2 — Security Hardening

Anda adalah **Senior Application Security Engineer + API Security Engineer**.

Jangan menambah fitur produk baru.

Audit dan perkuat seluruh platform.

## Hardening

Implementasikan/verifikasi:

```text
HttpOnly cookies
Secure cookies
SameSite
CSRF protection bila relevan
CSP
HSTS
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
server-side RBAC
Zod validation
safe serialization
rate limiting
request size limit
session rotation
session expiration
API key hashing
secret rotation
```

## Collector Security

Tambahkan optional request signing:

```text
X-Site-ID
X-Timestamp
X-Signature
```

Signature:

```text
HMAC-SHA256
```

Gunakan:

```text
timestamp + request body
```

Tolak request dengan timestamp terlalu lama.

Cegah replay attack.

## Trusted Proxy

Pastikan:

```text
CF-Connecting-IP
X-Forwarded-For
```

hanya dipercaya sesuai deployment topology.

Jangan menerima spoofed forwarded headers.

## Sensitive Data

Pastikan tidak pernah tersimpan/log:

```text
password
password hash
raw session token
raw cookie
MFA secret
full API secret
payment data
```

## Security Review

Audit:

```text
IDOR
broken access control
tenant data leakage
SQL injection
XSS
CSRF
SSRF
mass assignment
insecure deserialization
secret leakage
privilege escalation
```

## Exit Criteria

```text
tidak ada known critical issue
tenant isolation aman
authorization server-side aman
secret handling aman
security headers benar
request replay protection tersedia
```

---

# PROMPT 3 — Production Deployment

Anda adalah **Senior DevOps Engineer + Platform Engineer**.

Siapkan aplikasi untuk production.

## Deployment

Siapkan:

```text
Production Next.js deployment
Production PostgreSQL
HTTPS
domain/subdomain
environment variables
database migration
backup strategy
health checks
```

Contoh architecture:

```text
dashboard.example.com
api-security.example.com
```

Boleh tetap satu deployment jika architecture project lebih sederhana.

## Environment Variables

Pisahkan:

```text
Development
Staging
Production
```

Jangan commit `.env` atau secret.

## Database

Pastikan:

```text
migration reproducible
backup otomatis
restore procedure tersedia
connection pooling
production indexes
```

## HTTPS

Wajib untuk:

```text
Dashboard
Collector API
SDK communication
```

## Deployment Safety

Gunakan:

```text
migration before traffic
rollback plan
health verification
```

Jangan melakukan destructive migration tanpa review.

## Exit Criteria

```text
production build berhasil
database migration berhasil
HTTPS aktif
environment aman
backup tersedia
health check lulus
rollback procedure terdokumentasi
```

---

# PROMPT 4 — Observability & Monitoring

Anda adalah **Senior Site Reliability Engineer + Observability Engineer**.

Tambahkan observability untuk Global Security Dashboard itu sendiri.

## Structured Logging

Log:

```text
Collector requests
Collector errors
authentication errors
credential validation failures
rate-limit events
security processor errors
database errors
SDK integration errors
```

Jangan log secret.

## Metrics

Pantau:

```text
API request count
Collector latency
Collector error rate
events per second
events per site
failed credential validation
database latency
active database connections
storage growth
security events
SDK connection health
```

## Health

Buat health checks untuk:

```text
application
database
Collector API
critical dependencies
```

Jangan expose detail sensitif pada public health endpoint.

## Alerts

Siapkan threshold untuk:

```text
high API error rate
database unavailable
Collector latency tinggi
event ingestion stopped
disk/storage hampir penuh
abnormal failed credential attempts
```

## Dashboard Internal

Buat internal operational view bila relevan:

```text
System Health
Collector Health
Database Health
Integration Health
Recent Errors
```

## Exit Criteria

```text
logs terstruktur
metrics tersedia
health checks bekerja
critical alerting tersedia
secret tidak muncul di logs
```

---

# PROMPT 5 — Documentation & Developer Onboarding

Anda adalah **Senior Developer Experience Engineer + Technical Writer**.

Buat dokumentasi integration yang sederhana dan akurat.

## Docs

Buat:

```text
/docs
```

Isi:

```text
Quick Start
Architecture
Add Site
API Keys
Next.js SDK
REST API
Authentication Events
Session Events
Security Events
Custom Events
Rate Limits
Request Signing
Troubleshooting
Security Best Practices
```

## Quick Start

Developer harus memahami flow:

```text
Create Site
→ Copy Site ID
→ Copy Secret once
→ Install SDK
→ Configure env
→ Add login hooks
→ Send Test Event
→ Verify Dashboard
```

## Examples

Berikan contoh untuk:

```text
login success
login failed
logout
session refresh
custom event
Turnstile failure
```

## Troubleshooting

Cover:

```text
401 invalid credential
403 forbidden
409 duplicate
422 validation error
429 rate limited
site waiting for event
SDK timeout
wrong endpoint
```

Jangan dokumentasikan behavior yang belum benar-benar diimplementasikan.

## Exit Criteria

```text
developer baru dapat integrasi tanpa membaca source code
contoh sesuai SDK nyata
error codes terdokumentasi
security guidance tersedia
```

---

# PROMPT 6 — Production Security Review

Anda adalah **Principal Security Engineer + Independent Code Reviewer**.

Lakukan review akhir sebelum production.

Jangan fokus pada fitur visual.

## Review Architecture

Periksa:

```text
authentication
RBAC
organization isolation
site isolation
API credential lifecycle
Collector API
event ingestion
session tracking
device handling
IP handling
risk engine
blocked IP
audit logs
SDK
```

## Attack Scenarios

Simulasikan:

```text
attacker mengganti Site ID
attacker memakai revoked key
attacker mengirim duplicate events
attacker spoof IP headers
attacker mencoba akses tenant lain
VIEWER mencoba admin action
stolen API key digunakan
oversized payload
malformed metadata
rapid brute-force requests
replay signed request
```

## Verify

Pastikan:

```text
secret tidak bocor
tenant tidak bocor
authorization tidak hanya frontend
logs tidak menyimpan credential
session token tidak disimpan mentah
IP geolocation tidak dianggap GPS
monitor-only tidak mengklaim enforcement
```

## Output

Buat laporan:

```text
Critical
High
Medium
Low
Informational
```

Untuk setiap finding:

```text
Issue
Impact
Affected Area
Evidence
Fix
Priority
```

Perbaiki Critical dan High sebelum production release.

---

# PROMPT 7 — Performance & Scalability

Anda adalah **Principal Performance Engineer + Backend Architect**.

Optimalkan hanya setelah fungsi utama benar.

## Target Scale

Pastikan architecture dapat berkembang dari:

```text
10 sites
100 sites
1,000 sites
```

tanpa rewrite total.

## Audit

Periksa:

```text
N+1 queries
slow queries
missing indexes
large table scans
unbounded pagination
over-fetching
chart aggregation
event insert throughput
GeoIP calls
session update writes
```

## Optimizations

Gunakan bila memang dibutuhkan:

```text
database indexes
batch insert
server-side pagination
aggregation queries
cache
GeoIP cache
connection pooling
background processing
```

Jangan langsung menambahkan Kafka/Redis queue jika belum diperlukan.

Architecture boleh disiapkan untuk queue di masa depan.

## Load Test

Test:

```text
normal traffic
burst traffic
batch events
many sites
many failed logins
high dashboard reads
```

Pastikan monitoring failure tidak mematikan website client.

## Exit Criteria

```text
no unbounded queries
major queries indexed
Collector stabil saat burst
dashboard tetap usable
no premature infrastructure complexity
```

---

# PROMPT 8 — Advanced Features

Anda adalah **Principal Product Architect**.

Kerjakan tahap ini HANYA setelah core platform production-ready.

Tambahkan fitur lanjutan secara modular.

## Prioritas Opsional

### Alerts
```text
Email
Telegram
Slack
Webhook
```

Event:

```text
HIGH risk
CRITICAL risk
site integration error
API credential abuse
```

### Webhooks
Support:

```text
security.event.high
security.event.critical
site.disconnected
api.key.revoked
```

Webhook harus:

```text
signed
retryable
idempotent
```

### Global Identity
Hubungkan user lintas website secara explicit.

Jangan otomatis merge hanya berdasarkan email.

### SSO

Persiapkan:

```text
OAuth 2.0
OpenID Connect
```

untuk centralized login jika dibutuhkan.

### Export

Tambahkan:

```text
CSV
JSON
```

Jangan export secret.

### Retention

Configurable:

```text
30 days
90 days
180 days
1 year
```

Support anonymization/purge.

### Team Management

Tambahkan:

```text
invite admin
roles
permissions
organization members
```

### SDK Lain

Setelah Next.js stabil:

```text
Node.js
Express
NestJS
Laravel/PHP
WordPress
```

Jangan mengorbankan stabilitas core system untuk fitur lanjutan.

---

# FINAL RELEASE CHECKLIST

Release production hanya jika:

```text
Frontend selesai
Backend selesai
Multi-tenant isolation aman
Collector API stabil
API credential aman
Session/device telemetry bekerja
Security engine bekerja
SDK bekerja
Testing lulus
Security hardening selesai
Deployment aman
Observability tersedia
Documentation selesai
Production security review selesai
Critical/High findings diperbaiki
Backup & restore teruji
Production build berhasil
```

Prioritas akhir:

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
