import Link from "next/link";
import { ArrowLeft, Braces, KeyRound, Radio, Send, Shield } from "lucide-react";

const nav = ["Overview", "Setup", "API key", "Send events", "Device and IP", "Read dashboard", "Troubleshooting"];

const flow = `Your app backend
-> POST /api/v1/events
-> Collector validates API key
-> Parses User-Agent and safe client IP
-> Optional GeoIP enrichment
-> Stores Device, Session, Login Attempt, Security Event
-> Dashboard reads database data`;

const envExample = `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aegis_control?schema=public
BETTER_AUTH_SECRET=replace-with-at-least-32-random-characters
BETTER_AUTH_URL=http://localhost:3000
TRUSTED_ORIGINS=http://localhost:3000
ALLOW_ADMIN_SIGNUP=false
COLLECTOR_RATE_LIMIT_PER_MINUTE=120
COLLECTOR_TRUSTED_PROXIES=
GEOIP_IPINFO_TOKEN=`;

const runCommands = `pnpm db:up
pnpm db:generate
pnpm db:migrate
pnpm dev`;

const singleEvent = `curl -X POST http://localhost:3000/api/v1/events \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk_live_xxx" \\
  -d '{
    "eventId": "evt_login_001",
    "event": "auth.login.success",
    "externalUserId": "user_123",
    "externalSessionId": "sess_123",
    "timestamp": "2026-08-25T19:00:00.000Z",
    "metadata": {
      "email": "user@example.com",
      "displayName": "Jane Doe",
      "deviceId": "device_stable_123"
    }
  }'`;

const batchEvent = `curl -X POST http://localhost:3000/api/v1/events/batch \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk_live_xxx" \\
  -d '{
    "events": [
      {
        "eventId": "evt_failed_001",
        "event": "auth.login.failed",
        "externalUserId": "user_123",
        "timestamp": "2026-08-25T19:01:00.000Z",
        "metadata": { "failureReason": "Invalid password" }
      },
      {
        "eventId": "evt_refresh_001",
        "event": "session.refreshed",
        "externalUserId": "user_123",
        "externalSessionId": "sess_123",
        "timestamp": "2026-08-25T19:02:00.000Z"
      }
    ]
  }'`;

const deviceIp = `Jika request bukan dari trusted proxy:
  client IP = alamat koneksi langsung
  X-Forwarded-For diabaikan

Jika request dari trusted proxy:
  CF-Connecting-IP dipakai lebih dulu
  lalu X-Forwarded-For
  lalu alamat koneksi langsung

Jika GEOIP_IPINFO_TOKEN diisi:
  country, region, city, timezone, ASN, ISP akan ditambahkan`;

const troubleshooting = `Event tidak muncul:
  - Pastikan Authorization: Bearer sk_xxx benar
  - Pastikan Content-Type application/json
  - Pastikan timestamp tidak lebih dari 7 hari lalu atau 5 menit ke depan
  - Pastikan site belum deleted dan credential belum revoked/expired

IP masih Unknown:
  - Pastikan reverse proxy mengirim alamat koneksi di X-Real-IP
  - Isi COLLECTOR_TRUSTED_PROXIES dengan proxy yang benar
  - Jangan percaya X-Forwarded-For dari traffic langsung

Lokasi masih Unknown:
  - Isi GEOIP_IPINFO_TOKEN
  - Pastikan server bisa mengakses https://ipinfo.io
  - Cloudflare country hanya dipakai dari trusted proxy

Device masih Unknown:
  - Pastikan backend meneruskan User-Agent asli ke Collector
  - Kirim metadata.deviceId yang stabil untuk idempotensi device`;

export default function DocsPage() {
  return <div style={{ minHeight: "100vh", background: "white" }}>
    <header className="topbar docs-topbar"><Link href="/dashboard" className="brand-mark"><Shield size={17} /></Link><strong>Aegis Control</strong><span style={{ color: "var(--ink-tertiary)" }}>/</span><span style={{ color: "var(--ink-secondary)" }}>Docs</span><div className="topbar-spacer" /><Link className="button" href="/dashboard"><ArrowLeft size={13} />Dashboard</Link></header>
    <div className="docs-layout"><aside className="docs-nav" aria-label="Documentation navigation"><div className="nav-label" style={{ color: "var(--ink-tertiary)", paddingLeft: 0 }}>Real-time guide</div>{nav.map((item, index) => <a key={item} href={`#${item.toLowerCase().replaceAll(" ", "-")}`} className={index === 0 ? "nav-link active" : "nav-link"} style={{ color: index === 0 ? "var(--accent-strong)" : "var(--ink-secondary)", background: index === 0 ? "var(--accent-soft)" : "transparent", paddingLeft: 10 }}>{item}</a>)}</aside>
      <main><p className="eyebrow">Developer documentation</p><h1 className="page-title" style={{ fontSize: 34 }}>Cara menggunakan real-time security dashboard</h1><p className="page-description" style={{ fontSize: 15, lineHeight: 1.6 }}>Aegis Control menerima telemetry login, session, device, IP, dan security event dari website Anda melalui Collector API. Data yang masuk akan muncul di Dashboard, Live activity, Devices, Sessions, Login activity, dan Security events.</p>
        <DocSection id="overview" title="Overview"><p className="page-description">Alur dasarnya sederhana: buat Site, buat API key, kirim event dari backend aplikasi Anda, lalu pantau hasilnya di dashboard.</p><CodeBlock value={flow} /></DocSection>
        <DocSection id="setup" title="1. Setup dashboard"><DocStep icon={Braces} number="01" title="Konfigurasi environment"><CodeBlock value={envExample} /></DocStep><DocStep icon={Radio} number="02" title="Jalankan aplikasi"><CodeBlock value={runCommands} /></DocStep><p className="page-description">Di production, isi <code>COLLECTOR_TRUSTED_PROXIES</code> dengan IP reverse proxy terpercaya. Jika memakai IPinfo, isi <code>GEOIP_IPINFO_TOKEN</code>.</p></DocSection>
        <DocSection id="api-key" title="2. Buat Site dan API key"><ol className="page-description" style={{ lineHeight: 1.8 }}><li>Buka <Link href="/dashboard/sites/new">Sites / New</Link>.</li><li>Masukkan nama website, domain, environment, dan mode keamanan.</li><li>Buka <Link href="/dashboard/api-keys">API keys</Link>.</li><li>Buat key untuk site tersebut.</li><li>Simpan secret key saat ditampilkan. Secret hanya muncul satu kali.</li></ol></DocSection>
        <DocSection id="send-events" title="3. Kirim event dari aplikasi"><p className="page-description">Kirim event dari backend aplikasi, bukan langsung dari browser, supaya secret key tidak bocor.</p><DocStep icon={Send} number="03" title="Single event"><CodeBlock value={singleEvent} /></DocStep><DocStep icon={KeyRound} number="04" title="Batch events"><CodeBlock value={batchEvent} /></DocStep></DocSection>
        <DocSection id="device-and-ip" title="4. Device, IP, dan GeoIP"><p className="page-description">Collector membaca <code>User-Agent</code> untuk browser, OS, dan device type. Collector juga menentukan client IP dengan aman.</p><CodeBlock value={deviceIp} /><p className="page-description">Dashboard tidak mengambil GPS, MAC address, serial hardware, kamera, mikrofon, kontak, atau data perangkat invasif.</p></DocSection>
        <DocSection id="read-dashboard" title="5. Cara membaca dashboard"><div style={{ display: "grid", gap: 14 }}><Usage title="Dashboard" text="Ringkasan total site, user, active session, failed login, open alert, distribusi device/browser/OS, dan tabel site." /><Usage title="Live activity" text="Stream event terbaru dari database. Tombol Pause hanya menghentikan tampilan lokal, bukan collector." /><Usage title="Devices" text="Daftar device yang dikenali dari deviceId stabil atau fallback session. Lihat browser, OS, user, site, IP terakhir, lokasi perkiraan, first seen, dan last seen." /><Usage title="Sessions" text="Daftar session aktif dan historis dari event login, refresh, logout, revoked, dan expired." /><Usage title="Login activity" text="Riwayat login sukses/gagal beserta reason, device, IP, lokasi, dan risk level." /><Usage title="Security events" text="Event prioritas dengan risk score, risk level, status investigasi, user, site, dan IP relevan." /></div></DocSection>
        <DocSection id="troubleshooting" title="Troubleshooting"><CodeBlock value={troubleshooting} /></DocSection>
      </main>
    </div>
  </div>;
}

function CodeBlock({ value }: { value: string }) {
  return <pre className="code-block"><code>{value}</code></pre>;
}

function DocSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return <section id={id} style={{ marginTop: 42 }}><h2 className="page-title" style={{ fontSize: 21 }}>{title}</h2>{children}</section>;
}

function DocStep({ icon: Icon, number, title, children }: { icon: typeof Braces; number: string; title: string; children: React.ReactNode }) {
  return <section style={{ marginTop: 20 }}><div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}><span className="distribution-icon"><Icon size={13} /></span><span className="mono" style={{ color: "var(--ink-tertiary)" }}>{number}</span><h3 className="form-heading" style={{ margin: 0 }}>{title}</h3></div>{children}</section>;
}

function Usage({ title, text }: { title: string; text: string }) {
  return <article className="panel" style={{ padding: 16 }}><h3 className="form-heading" style={{ marginTop: 0 }}>{title}</h3><p className="page-description" style={{ margin: 0 }}>{text}</p></article>;
}
