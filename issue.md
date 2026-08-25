# Issue: Pindahkan Audit Logs dari Mock Data ke Database

## Ringkasan

Halaman `/dashboard/audit-logs` masih menggunakan `auditLogs` dari `src/lib/mock-data.ts`. Ini membuat angka statistik dan tabel audit tidak merefleksikan aktivitas administratif yang benar-benar tersimpan di database.

## Kondisi Saat Ini

- File `src/app/dashboard/audit-logs/page.tsx` masih import `auditLogs` dari `@/lib/mock-data`.
- Statistik masih hardcoded:
  - `Events today: 142`
  - `Admin actions: 38`
  - `Security actions: 51`
  - `Policy changes: 4`
- Tabel audit masih memakai data dummy.
- Model Prisma `AuditLog` sudah tersedia di `prisma/schema.prisma`.
- Permission `audit_log:read` sudah tersedia di permission matrix.

## Tujuan

Mengubah halaman Audit Logs agar membaca data asli dari tabel `AuditLog` dengan isolasi tenant berdasarkan `organizationId`, bukan mock data.

## Scope Implementasi

### 1. Query Monitoring Audit Logs

Tambahkan query baru di `src/server/monitoring/queries.ts`, misalnya `getAuditLogsMonitoring(actor, now)`.

Query harus mengambil:

- Audit log terbaru, maksimal 250 row.
- Actor admin jika tersedia.
- Site jika audit log terkait site.
- Action.
- Target type.
- Target ID.
- Actor IP.
- Metadata ringkas.
- Created time.

Query harus menghitung statistik:

- Events today.
- Admin actions.
- Security actions.
- Policy changes.

## Suggested Classification

### Admin actions

Action yang berkaitan dengan organisasi, member, invite, site, API key, settings, atau admin session.

Contoh prefix/kata kunci:

- `organization.`
- `member.`
- `invitation.`
- `site.`
- `api_key.`
- `settings.`
- `admin.`

### Security actions

Action yang berkaitan dengan security event, session revoke, blocked IP, investigation, atau enforcement.

Contoh prefix/kata kunci:

- `security.`
- `security_event.`
- `blocked_ip.`
- `session.revoke`
- `investigation.`
  
### Policy changes

Action yang mengubah policy, mode enforcement, blocklist, credential, atau settings.

Contoh prefix/kata kunci:

- `policy.`
- `settings.`
- `blocked_ip.`
- `api_key.`
- action yang mengandung `update`, `create`, `delete`, `revoke`, atau `rotate`.

## 2. Update Halaman Audit Logs

Ubah `src/app/dashboard/audit-logs/page.tsx` agar:

- Menjadi server component async.
- Memanggil `requirePermission("audit_log:read")`.
- Memakai `getAuditLogsMonitoring(actor)`.
- Menghapus import dari `@/lib/mock-data`.
- Menampilkan row database ke `RecordsPage`.

Kolom yang disarankan:

- `Time`
- `Actor`
- `Action`
- `Target`
- `Site`
- `Actor IP`
- `Details`

## 3. Empty State

Tambahkan empty state untuk kondisi belum ada audit log.

Contoh copy:

`No audit logs yet. Administrative and security-sensitive actions will appear here after users manage sites, API keys, sessions, or blocked IPs.`

## 4. Data Formatting

Format row yang disarankan:

- `actor`: `actor.name`, fallback ke `actor.email`, fallback ke `System`.
- `target`: gabungan `targetType` dan `targetId` jika ada.
- `site`: nama site jika tersedia, fallback `Organization`.
- `ip`: `actorIp`, fallback `Unknown`.
- `detail`: ringkasan metadata yang aman dan pendek.

Metadata tidak boleh ditampilkan mentah jika terlalu panjang. Batasi detail agar tabel tetap mudah dibaca.

## 5. Audit Log Producer yang Perlu Dicek

Setelah halaman membaca database, pastikan action penting benar-benar menulis ke tabel `AuditLog`.

Minimal action yang perlu diaudit:

- Site created.
- Site updated.
- Site deleted/disabled.
- API key created.
- API key rotated.
- API key revoked.
- Blocked IP created.
- Blocked IP revoked/deleted.
- Session revoked.
- Security event status updated.
- Settings updated.

Jika producer belum ada, buat issue lanjutan atau implementasi kecil untuk action yang sudah memiliki server mutation.

## Acceptance Criteria

- `/dashboard/audit-logs` tidak lagi import `@/lib/mock-data`.
- Semua data audit log difilter berdasarkan `actor.organizationId`.
- Statistik berasal dari database.
- Tabel menampilkan audit log terbaru dari database.
- Empty state muncul saat belum ada data.
- Tidak ada secret/token yang ditampilkan dari metadata.
- `pnpm typecheck` lolos.
- `pnpm test` lolos jika ada test terkait.
- `pnpm lint` lolos.

## Test Plan

- Unit/integration query test jika pola test database sudah tersedia.
- Manual test dengan membuat site atau API key, lalu cek audit log muncul.
- Manual test tenant isolation: audit log organisasi lain tidak muncul.
- Manual test empty state di organisasi tanpa audit log.
- Manual test metadata panjang tidak merusak tampilan tabel.
