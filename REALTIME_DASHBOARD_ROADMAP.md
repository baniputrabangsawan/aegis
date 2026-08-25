# Real-Time Dashboard Production Readiness Roadmap

This document tracks the remaining work needed to make the real-time security dashboard production-ready end to end.

## Current State

- Collector accepts single and batch security events.
- Collector validates API keys, request body size, rate limits, and event schemas.
- Device enrichment parses User-Agent into browser, OS, and device type.
- Safe IP resolution ignores spoofed forwarding headers unless the request comes through a trusted proxy with the proxy secret.
- Optional IPinfo GeoIP enrichment can fill country, region, city, timezone, ASN, and ISP.
- Dashboard summary, Devices, Security Events, Live Activity, Sessions, Login Activity, and Users read from database data.
- Initial risk scoring exists for repeated failed login, new device, new country, revoked session reuse, and security signals.

## Priority 1: Make Live Activity Actually Live

### Goal

The Live Activity page should update automatically without a manual refresh.

### Recommended First Step

Use short polling every 3-5 seconds before introducing WebSockets or SSE.

### Scope

- Add an internal API route for recent security events and live stats.
- Poll from the client while the stream is not paused.
- Keep the existing Pause button local-only.
- Preserve tenant authorization on every request.

### Acceptance Criteria

- New collector events appear on `/dashboard/live` within 5 seconds.
- Pausing stops UI refresh but does not stop event collection.
- Resuming fetches the latest records.
- Empty state explains how to send the first event.

## Priority 2: Add GeoIP Cache

### Goal

Avoid repeated IPinfo lookups for the same IP and reduce latency/cost.

### Scope

- Add a `GeoIPCache` table keyed by IP address.
- Store country, region, city, timezone, ASN, ISP, provider, and lookup timestamp.
- Use cache before calling IPinfo.
- Refresh stale records after a configurable TTL.
- Continue accepting events when provider lookup fails.

### Acceptance Criteria

- Repeated events from the same IP do not call IPinfo every time.
- Failed GeoIP lookup does not reject collector events.
- Cache is isolated from sensitive user identity data.

## Priority 3: Add Integration Helper

### Goal

Make it easy for a monitored backend application to send correct events.

### Scope

- Add a small server-side helper module or documented snippet.
- Include functions for:
  - `trackLoginSuccess`
  - `trackLoginFailed`
  - `trackSessionCreated`
  - `trackSessionRefreshed`
  - `trackLogout`
  - `trackSessionRevoked`
- Generate stable event IDs or accept caller-provided IDs.
- Forward the original User-Agent and proxy-safe IP headers from the app backend.

### Acceptance Criteria

- A Next.js backend can integrate without hand-writing raw collector payloads.
- Secret key is never exposed to the browser.
- Helper retries only when safe and does not block primary authentication flow.

## Priority 4: Improve Risk Engine

### Goal

Move from basic event scoring to actionable security detection.

### Scope

- Impossible travel based on prior successful login country/time.
- Failed login aggregation by user, IP, and site.
- IP blocklist checks against `BlockedIP` records.
- Suspicious ASN/ISP changes for known users.
- Revoked session reuse escalation.
- Risk reason deduplication and stable rule IDs.

### Acceptance Criteria

- Risk reasons clearly explain why an event is medium, high, or critical.
- Repeated failed login creates one useful signal instead of noisy duplicates.
- Blocked IP hits are visible in Security Events.
- Rules are covered by focused unit tests.

## Priority 5: Add Empty-State Onboarding

### Goal

When no telemetry exists, users should know exactly what to do next.

### Scope

- Add empty states for Dashboard, Live Activity, Devices, Sessions, Login Activity, and Security Events.
- Link to Sites, API Keys, and Docs.
- Show a minimal example payload.

### Acceptance Criteria

- First-time users are guided to create a site, create an API key, and send an event.
- Empty pages do not look broken.

## Priority 6: Production Hardening

### Goal

Make operations safer and easier to debug.

### Scope

- Add structured collector logs without secrets or personal data.
- Track collector error rate and rate-limit events.
- Add health checks for database connectivity.
- Document backup restore drill.
- Add deployment checklist for proxy headers and secrets.

### Acceptance Criteria

- Operators can diagnose collector failures from logs.
- Secrets are never logged.
- Health endpoint catches database connectivity failures.
- Restore procedure is documented and tested.

## Suggested Implementation Order

1. Live Activity polling.
2. Empty-state onboarding.
3. GeoIP cache.
4. Integration helper.
5. Risk engine rule expansion.
6. Production hardening.

## Test Plan

- Unit tests for IP resolution, trusted proxy validation, GeoIP cache behavior, and risk rules.
- Route tests for live monitoring API authorization and response shape.
- Manual collector test with login success, login failure, session refresh, logout, and security signal events.
- Manual dashboard test for Dashboard, Live Activity, Devices, Sessions, Login Activity, and Security Events.
