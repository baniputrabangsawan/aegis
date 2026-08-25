# Issue: Production Readiness untuk Real-Time Security Dashboard

## Ringkasan

Dashboard sudah menerima telemetry asli dari Collector API dan menampilkan data database untuk Dashboard, Live Activity, Devices, Sessions, Login Activity, Users, dan Security Events. Namun masih ada beberapa pekerjaan agar sistem benar-benar production-ready, real-time, hemat biaya, mudah diintegrasikan, dan lebih kuat dalam deteksi risiko.

## Kondisi Saat Ini

- Collector menerima single event dan batch event.
- Collector memvalidasi API key, ukuran body, rate limit, dan schema event.
- Device enrichment sudah membaca `User-Agent` menjadi browser, OS, dan device type.
- IP resolution sudah aman: forwarding headers diabaikan kecuali request melewati trusted proxy dan proxy secret valid.
- GeoIP enrichment sudah tersedia via IPinfo jika `GEOIP_IPINFO_TOKEN` diisi.
- Risk scoring awal sudah ada untuk repeated failed login, new device, new country, revoked session reuse, dan security signals.
- Halaman utama dashboard sudah membaca data asli dari database, bukan mock.

## Tujuan

Membuat real-time security dashboard siap digunakan secara end-to-end di production dengan live updates, onboarding yang jelas, cache GeoIP, helper integrasi, risk engine lebih kuat, dan operasional yang aman.

## Prioritas 1: Live Activity Benar-Benar Real-Time

### Masalah

Halaman `/dashboard/live` saat ini membaca data asli dari database, tetapi belum auto-refresh. User masih perlu refresh halaman untuk melihat event terbaru.

### Rencana

- Tambahkan internal API route untuk recent security events dan live stats.
- Tambahkan polling client setiap 3-5 detik.
- Tombol Pause tetap menghentikan refresh UI lokal saja.
- Pastikan setiap request tetap melewati authorization tenant.

### Acceptance Criteria

- Event baru muncul di `/dashboard/live` dalam maksimal 5 detik.
- Pause menghentikan update UI, bukan collector.
- Resume langsung mengambil data terbaru.
- Halaman punya empty state jika belum ada telemetry.

## Prioritas 2: Empty-State Onboarding

### Masalah

Saat belum ada data, beberapa halaman terlihat kosong dan tidak menjelaskan langkah berikutnya.

### Rencana

- Tambahkan empty state untuk Dashboard, Live Activity, Devices, Sessions, Login Activity, dan Security Events.
- Empty state mengarahkan user ke Sites, API Keys, dan Docs.
- Tampilkan contoh payload collector minimal.

### Acceptance Criteria

- User baru tahu harus membuat site, membuat API key, dan mengirim event pertama.
- Halaman kosong tidak terlihat seperti error.

## Prioritas 3: GeoIP Cache

### Masalah

Setiap lookup IP bisa memanggil IPinfo. Ini menambah latency dan biaya jika traffic tinggi.

### Rencana

- Tambahkan tabel `GeoIPCache` keyed by IP address.
- Simpan country, region, city, timezone, ASN, ISP, provider, dan lookup timestamp.
- Cek cache sebelum memanggil IPinfo.
- Refresh data jika sudah melewati TTL konfigurasi.
- Tetap menerima event jika lookup gagal.

### Acceptance Criteria

- IP yang sama tidak selalu memanggil IPinfo.
- Collector tetap menerima event ketika GeoIP provider gagal.
- Cache tidak menyimpan data identitas user.

## Prioritas 4: Integration Helper / SDK Sederhana

### Masalah

Integrasi saat ini masih berupa raw HTTP request. Ini rawan payload tidak konsisten dan secret key bisa salah dipakai.

### Rencana

- Tambahkan helper server-side untuk aplikasi yang dipantau.
- Sediakan fungsi:
  - `trackLoginSuccess`
  - `trackLoginFailed`
  - `trackSessionCreated`
  - `trackSessionRefreshed`
  - `trackLogout`
  - `trackSessionRevoked`
- Helper menerima atau membuat stable event ID.
- Helper meneruskan `User-Agent` asli dari request aplikasi.
- Secret key hanya dipakai di backend.

### Acceptance Criteria

- Aplikasi Next.js/backend bisa mengirim telemetry tanpa menulis payload manual.
- Secret collector tidak pernah masuk browser.
- Helper tidak memblokir flow auth utama jika Collector lambat/gagal.

## Prioritas 5: Risk Engine Lanjutan

### Masalah

Risk engine masih versi awal. Deteksi sudah ada, tetapi belum cukup untuk pola serangan dan anomali yang lebih kuat.

### Rencana

- Tambahkan impossible travel berdasarkan negara login sebelumnya dan waktu login.
- Agregasi failed login berdasarkan user, IP, dan site.
- Cek `BlockedIP` saat event masuk.
- Deteksi perubahan ASN/ISP untuk known user.
- Eskalasi revoked session reuse.
- Tambahkan rule ID stabil dan dedup risk reasons.

### Acceptance Criteria

- Risk reasons menjelaskan kenapa event menjadi Medium, High, atau Critical.
- Repeated failed login tidak membuat noise berlebihan.
- Hit dari blocked IP tampil jelas di Security Events.
- Rules punya unit test terfokus.

## Prioritas 6: Production Hardening

### Masalah

Operasional production butuh observability, healthcheck, dan prosedur recovery yang lebih jelas.

### Rencana

- Tambahkan structured logs untuk collector tanpa secret dan tanpa data pribadi berlebihan.
- Catat error rate collector dan event rate limit.
- Tambahkan healthcheck database yang lebih detail.
- Dokumentasikan backup restore drill.
- Tambahkan deployment checklist untuk proxy headers, proxy secret, dan GeoIP token.

### Acceptance Criteria

- Operator bisa mendiagnosis collector failure dari log.
- Secret tidak pernah masuk log.
- Health endpoint mendeteksi database connectivity failure.
- Restore procedure terdokumentasi dan bisa dites.

## Urutan Implementasi yang Disarankan

1. Live Activity polling.
2. Empty-state onboarding.
3. GeoIP cache.
4. Integration helper.
5. Risk engine lanjutan.
6. Production hardening.

## Test Plan

- Unit test untuk IP resolution, trusted proxy, GeoIP cache, dan risk rules.
- Route test untuk authorization dan response shape internal live API.
- Manual collector test untuk login success, login failed, session refresh, logout, revoked, expired, dan security signal.
- Manual dashboard test untuk Dashboard, Live Activity, Devices, Sessions, Login Activity, Users, dan Security Events.
