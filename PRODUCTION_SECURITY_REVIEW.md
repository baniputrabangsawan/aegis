# Production Security Review — Aegis Control

Tanggal review: 25 Agustus 2026  
Ruang lingkup: authentication, RBAC, isolasi organization/site, lifecycle API credential, Collector API, event ingestion, session/device/IP handling, risk engine, blocked IP, audit log, dan kesiapan SDK.

## Ringkasan keputusan

Tidak ditemukan Critical yang terbukti pada kode yang telah diimplementasikan. Satu temuan High mengenai pemalsuan alamat IP telah diperbaiki dalam review ini. Setelah perbaikan, seluruh 45 tes, lint, type-check, dan production build lulus.

Status rilis: **conditional pass untuk backend yang sudah tersedia**, bukan persetujuan produksi untuk keseluruhan produk. Request signing/SDK dan enforcement blocked IP belum tersedia sehingga bagian tersebut belum dapat memperoleh sign-off.

## Critical

Tidak ada temuan.

## High

### H-01 — Forwarded IP dapat dipalsukan tanpa autentikasi reverse proxy — Fixed

- Issue: Collector sebelumnya membaca `X-Real-IP` sebagai alamat koneksi langsung. Klien yang mencapai aplikasi secara langsung dapat mengirim header tersebut sendiri.
- Impact: atribusi IP, GeoIP, deteksi negara baru, perangkat, dan penilaian risiko dapat dipengaruhi data palsu.
- Affected Area: Collector enrichment dan deployment Caddy.
- Evidence: `src/server/collector/enrichment.ts`, `src/server/collector/http.ts`, `ops/caddy/Caddyfile`.
- Fix: Caddy sekarang menimpa `X-Real-IP` dan menambahkan secret proxy internal; aplikasi hanya menerima alamat tersebut bila secret cocok dengan perbandingan constant-time. Forwarded/Cloudflare headers tetap hanya dipercaya bila hop terkait masuk allowlist CIDR. CIDR IPv4 dan IPv6 telah dites.
- Priority: selesai sebelum rilis.

## Medium

### M-01 — Percobaan kredensial Collector yang gagal tidak memiliki rate limit aplikasi

- Issue: rate limit per credential dijalankan sesudah autentikasi berhasil. Permintaan dengan key prefix atau secret tidak valid tidak masuk bucket.
- Impact: penyerang dapat menghasilkan beban query database berulang dan noise autentikasi; entropi secret tetap membuat brute-force pengambilalihan tidak praktis.
- Affected Area: `src/server/collector/auth.ts`, `src/server/collector/rate-limit.ts`.
- Evidence: `authenticateCollector()` selesai sebelum `consumeCollectorRateLimit()` dipanggil.
- Fix: tambahkan rate limit edge per source IP dan bucket aplikasi berbasis hash IP/prefix untuk kegagalan autentikasi, tanpa menyimpan secret atau Authorization header.
- Priority: sebelum paparan internet berskala tinggi.

### M-02 — Request signing dan verifikasi anti-replay belum diimplementasikan

- Issue: Collector menggunakan bearer credential melalui TLS; belum ada timestamped HMAC signature atau nonce store. Event ID membuat replay identik idempotent, tetapi bukan request-signing protocol.
- Impact: credential yang tercuri dapat dipakai untuk membuat event baru sampai key dicabut.
- Affected Area: Collector API dan SDK.
- Evidence: `src/server/collector/auth.ts` hanya memvalidasi `Authorization: Bearer`; package SDK belum tersedia di workspace.
- Fix: tentukan canonical request, timestamp window, HMAC signature, dan replay key/nonce yang atomik; implementasikan bersamaan di SDK dan Collector agar kontrak tidak terpecah.
- Priority: selesaikan pada tahap SDK/Developer Experience sebelum sign-off keseluruhan produk.

### M-03 — External session identifier dapat diisi token mentah oleh integrator

- Issue: server membatasi format dan panjang `externalSessionId`, tetapi tidak dapat membedakan ID opaque dari session token yang nyata.
- Impact: integrasi yang salah dapat menyimpan material sesi sensitif di database dan tampilan admin.
- Affected Area: event schema, SDK, dokumentasi integrasi.
- Evidence: `externalSessionId` disimpan sebagai nilai yang diterima Collector.
- Fix: SDK harus menerima identifier aman atau meng-hash input token secara lokal; dokumentasi wajib melarang cookie, JWT, dan session token mentah.
- Priority: sebelum SDK dinyatakan stabil.

### M-04 — Audit log aksi admin belum merekam actor IP

- Issue: model menyediakan `actorIp`, tetapi service site/API key tidak mengisinya.
- Impact: investigasi penyalahgunaan akun admin kehilangan satu sinyal atribusi.
- Affected Area: internal API dan audit logging.
- Evidence: operasi audit di `src/server/sites/service.ts` menyimpan actor/action/target tanpa `actorIp`.
- Fix: teruskan IP tervalidasi dari boundary internal API ke service dan simpan hanya alamat hasil trusted-proxy resolution.
- Priority: sebelum operasi produksi multi-admin.

### M-05 — Blocked IP dan SDK belum dapat dinilai sebagai kontrol aktif

- Issue: model/permission blocked IP tersedia, tetapi halaman masih memakai data contoh dan belum ada jalur enforcement/SDK nyata.
- Impact: operator tidak boleh menganggap kebijakan blocked IP sudah melindungi website yang dipantau.
- Affected Area: blocked IP, integration page, SDK.
- Evidence: `src/app/dashboard/blocked-ips/page.tsx` membaca mock data; tidak ditemukan package SDK atau enforcement endpoint.
- Fix: implementasikan policy service, audit trail, API/SDK enforcement contract, dan pengujian mode `MONITOR_ONLY` versus `MONITOR_AND_ENFORCE`.
- Priority: sebelum fitur dipasarkan sebagai enforcement.

## Low

### L-01 — CSP masih mengizinkan inline style

- Issue: `style-src` menggunakan `'unsafe-inline'`.
- Impact: mengurangi kekuatan CSP bila injeksi markup terjadi, walaupun script tetap dilindungi nonce.
- Affected Area: `src/proxy.ts`.
- Evidence: directive CSP production.
- Fix: migrasikan inline style ke class/static stylesheet lalu hilangkan `'unsafe-inline'` bila kompatibel dengan stack UI.
- Priority: hardening lanjutan.

### L-02 — Public health response menyebut status database

- Issue: endpoint health mengembalikan `database: reachable` ketika sehat.
- Impact: membocorkan sedikit informasi arsitektur tanpa kredensial atau detail koneksi.
- Affected Area: `src/app/api/health/route.ts`.
- Evidence: response sukses public health endpoint.
- Fix: kembalikan status readiness generik; simpan detail dependency untuk endpoint internal/metrics.
- Priority: hardening lanjutan.

## Informational

- API credential dibuat dari 32 random bytes, hanya hash SHA-256 disimpan, dan verifikasi memakai `timingSafeEqual`.
- Rotasi mencabut key lama secara atomik dan Collector memeriksa ulang status credential di dalam transaksi ingestion.
- Query dashboard dan mutation service menyaring `organizationId`; detail sesi yang tidak berada di tenant aktif menghasilkan not-found.
- VIEWER hanya memperoleh permission read dan seluruh internal route yang tersedia melakukan authorization di server.
- Payload memiliki batas byte aktual, schema strict, batas kedalaman/ukuran metadata, dan proteksi prototype-pollution.
- Event duplikat dibatasi unique key per site dan diproses secara idempotent, termasuk perlindungan race conflict.
- GeoIP diberi label sebagai lokasi perkiraan berbasis IP, bukan GPS.
- Metadata Cloudflare yang dipercaya berasal dari server dan menimpa field bernama sama dari payload klien.

## Matriks skenario serangan

| Skenario | Hasil review |
|---|---|
| Mengganti Site ID | Ditolak kecuali bearer key valid untuk site tersebut; query credential mengikat `siteId` dan key. |
| Memakai revoked key | Ditolak saat auth dan diperiksa ulang di transaksi ingestion. |
| Duplicate events | Idempotent melalui unique `(siteId, eventId)`; race ditangani. |
| Spoof IP headers | Diperbaiki: perlu secret proxy internal dan trusted CIDR. |
| Akses tenant lain | Query/mutation yang direview menyaring organization aktif. |
| VIEWER melakukan admin action | Ditolak oleh permission guard server-side. |
| Stolen API key | Masih dapat mengirim event sampai revoked; lihat M-02. |
| Oversized payload | Ditolak berdasarkan Content-Length dan byte body aktual. |
| Malformed metadata | Ditolak oleh schema/normalizer dengan batas ukuran dan kedalaman. |
| Rapid brute-force | Key entropy kuat, tetapi invalid-auth rate limiting belum ada; lihat M-01. |
| Replay signed request | Signing belum tersedia; replay event identik hanya menghasilkan duplicate; lihat M-02. |

## Verifikasi akhir

```text
pnpm typecheck  PASS
pnpm test       PASS (45/45)
pnpm lint       PASS
pnpm build      PASS
```

Secret nyata, database produksi, TLS publik, backup restore, SDK, serta enforcement eksternal tidak diuji dalam review lokal ini.
