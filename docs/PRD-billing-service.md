# PRD: Ionic Sync Server

**Version:** 2.0
**Date:** 2026-04-04
**Author:** Engineering
**Status:** Draft

---

## 1. Overview

**Ionic Cashier** is an offline-first, self-hosted POS application deployed on-premise at customer locations. The app is the entire product surface — customers interact with it directly, manage their own staff via RBAC (admin/manager/cashier roles), and run their business from it day-to-day without needing internet.

The **Ionic Sync Server** (referred to as "the server" throughout this document) is a strictly internal backend that Cashier installations phone home to in the background. Customers never see it, log into it, or know its URL. It serves three purposes:

1. **License governance** — validates that a Cashier installation is authorized to operate.
2. **Version distribution** — delivers entitled updates to Cashier installations.
3. **Telemetry & fleet management** — gives the Ionic team visibility into deployed installations.

All communication between Cashier and the server is **background, non-blocking, and failure-tolerant**. The POS never freezes, shows a loading spinner, or interrupts a transaction because the server is unreachable.

---

## 2. Problem Statement

The Cashier client already implements the license protocol:
- Activation: `POST /license/activate` ([LicenseService.php](app/Services/LicenseService.php))
- Verification: `POST /license/verify` every 6 hours ([VerifyLicense.php](app/Console/Commands/VerifyLicense.php))
- Deactivation: `POST /license/deactivate`
- Update checks: GitHub Releases API ([UpdateService.php](app/Services/UpdateService.php))
- 7-day offline grace period ([config/cashier.php](config/cashier.php))

But no server exists yet. The license URL defaults to `https://license.example.com/api` and updates pull from a public GitHub repo with no entitlement checks. This PRD defines the server that fulfills these contracts, adds subscription management for the Ionic team, and introduces background data sync — all invisible to the end customer.

---

## 3. Design Principles

| Principle | Implication |
|-----------|-------------|
| **Offline-first, always** | The Cashier app must operate fully without internet. Server communication is opportunistic, never blocking. A register mid-transaction must never be interrupted. |
| **Invisible to the customer** | The server has no customer-facing UI. No portal, no login page, no "manage your subscription" link. The Ionic team handles all billing and provisioning internally. |
| **Zero service interruption** | License expiry, failed syncs, and update availability are all handled gracefully. The app degrades silently (e.g., stops syncing) rather than locking out. |
| **Background sync only** | All server communication happens via queued jobs or scheduled commands. No HTTP request in the user's request cycle ever touches the server. |
| **Generous grace** | When a license cannot be re-verified, the app continues working for a configurable grace period (default: 7 days). Even beyond grace, the app should warn administrators rather than hard-lock during business hours. |

---

## 4. Goals

| # | Goal |
|---|------|
| G1 | Fulfill the license API contract the Cashier client already implements — zero client changes for MVP |
| G2 | Provide the Ionic team an internal admin dashboard to manage customers, licenses, billing, and releases |
| G3 | Gate update/release distribution behind active license tiers |
| G4 | Introduce background data sync so the Ionic team has fleet-wide visibility (installation health, usage stats, version distribution) |
| G5 | Handle subscription billing internally (Paystack) — customers pay via invoice/transfer, not self-service checkout |
| G6 | Never cause a POS outage regardless of server state |

---

## 5. Users & Personas

| Persona | System | Description |
|---------|--------|-------------|
| **Business Owner / Admin** | Cashier app | Purchases the license (offline — via sales, invoice, or bank transfer). Uses the Cashier app to manage staff, view reports, configure POS settings. Never interacts with the sync server. |
| **Cashier / Manager** | Cashier app | Day-to-day POS operators. Unaware the server exists. |
| **Ionic Sales** | Sync Server admin | Issues licenses to customers after payment is confirmed. Manages renewals and follow-ups. |
| **Ionic Engineering** | Sync Server admin | Publishes releases, monitors fleet health, debugs installation issues remotely via telemetry. |

---

## 6. Licensing Model

### 6.1 Plans

| Plan | Billing | Devices | Update Entitlement | Features |
|------|---------|---------|-------------------|----------|
| **Starter** | One-time | 1 | Patch updates for 12 months | Core POS, basic inventory |
| **Standard** | Monthly/Annual | Up to 3 | All updates while active | Full POS, reports, shifts, expenses, customers |
| **Business** | Monthly/Annual | Up to 10 | All updates while active | Everything + audit trail, PDF export, advanced inventory |
| **Enterprise** | Custom | Unlimited | All updates + early access | Everything + priority support, SLA |

### 6.2 How Customers Get Licensed

This is a **sales-driven process**, not self-service:

```
1. Customer contacts Ionic (sales, referral, etc.)
2. Ionic team agrees on plan and terms
3. Customer pays via bank transfer, Paystack invoice, or cash
4. Ionic admin confirms payment in the admin dashboard
5. Admin generates a license key → gives it to customer (email, WhatsApp, printed card)
6. Customer enters the license key in the Cashier app's activation screen
7. App calls POST /license/activate in the background
8. App is now licensed — operates fully offline from this point
```

### 6.3 License Lifecycle

```
  [Key generated by Ionic admin]
       |
       v
  Customer enters key in Cashier app
       |
       v
  App calls POST /license/activate (background)
       |→ Server validates key, checks device limit, stores fingerprint
       |→ Returns license_data (type, features, expires_at)
       |→ App stores encrypted locally, operates immediately
       v
  Normal operation (fully offline capable)
       |
       |--- Scheduled: every 6 hours (background, non-blocking)
       |    POST /license/verify
       |    → Server checks: subscription active? revoked?
       |    → Returns refreshed expires_at, features[]
       |    → App updates local cache silently
       |    → If server unreachable: no-op, try again next cycle
       |
       |--- If license expires and grace period exhausted:
       |    → App shows warning banner to admin users only
       |    → POS continues to function (does not lock out)
       |    → Disables non-critical features (reports export, updates)
       |    → Admin can re-enter a new key or contact Ionic
       v
  Renewal / Deactivation:
       → Ionic admin extends or revokes via admin dashboard
       → Next verify cycle picks up the change
       → Or: admin deactivates from Cashier settings (frees device slot)
```

### 6.4 Device Fingerprint

The client generates fingerprints as `sha256(APP_KEY | hostname | APP_URL)`. The server stores each fingerprint as a device activation counting toward the plan limit. The Ionic admin can remotely deactivate devices via the admin dashboard to free slots (e.g., when a customer replaces hardware).

### 6.5 Grace Period & Degradation

| Scenario | Behavior |
|----------|----------|
| Server unreachable for < 7 days | App works normally, verify silently retries each cycle |
| Server unreachable for > 7 days | App continues working but disables: update checks, report exports, telemetry sync. Admin sees a "connectivity" warning in settings. |
| License expired, within grace (7 days) | App works fully. Admin sees renewal reminder. |
| License expired, beyond grace | App continues for core POS (receipts, basic inventory). Disables premium features. Admin sees persistent warning. **Never hard-locks.** |
| License revoked by Ionic admin | Next successful verify cycle disables the app. Shows activation screen. |

---

## 7. Functional Requirements

### 7.1 License API (consumed by Cashier client)

These endpoints fulfill the existing client contract with zero changes needed.

#### `POST /api/license/activate`

**Request:**
```json
{
  "license_key": "string",
  "fingerprint": "sha256 string",
  "app_version": "1.0.0"
}
```

**Success (200):**
```json
{
  "valid": true,
  "license_key": "...",
  "licensee_name": "Alhaji Store",
  "license_type": "standard",
  "expires_at": "2026-05-04T00:00:00Z",
  "features": ["reports_export", "multi_shift", "expense_tracking"],
  "activated_at": "2026-04-04T12:00:00Z",
  "last_verified_at": "2026-04-04T12:00:00Z",
  "revoked": false
}
```

**Errors:**
- `401` — invalid or unknown license key
- `403` — device limit reached
- `422` — missing/malformed fields

#### `POST /api/license/verify`

**Request:**
```json
{
  "license_key": "string",
  "fingerprint": "string",
  "app_version": "string"
}
```

**Success (200):**
```json
{
  "valid": true,
  "expires_at": "2026-05-04T00:00:00Z",
  "features": ["..."],
  "last_verified_at": "2026-04-04T18:00:00Z",
  "revoked": false
}
```

The verify endpoint also accepts optional telemetry payload (see 7.3).

#### `POST /api/license/deactivate`

**Request:**
```json
{
  "license_key": "string",
  "fingerprint": "string"
}
```

**Success (200):**
```json
{ "deactivated": true }
```

### 7.2 Release / Update API

Replaces the current GitHub API dependency. Gated by license entitlement.

#### `GET /api/releases/latest`

**Headers:**
```
Authorization: Bearer {license_key}
```

**Query:** `?current_version=1.0.0`

**Success (200):**
```json
{
  "version": "1.2.0",
  "tag_name": "v1.2.0",
  "release_notes": "markdown",
  "download_url": "signed URL, 1-hour expiry",
  "published_at": "2026-04-01T00:00:00Z",
  "update_available": true,
  "entitled": true
}
```

**Entitlement logic:**
- Starter: `entitled = true` for patch versions only, within 12-month update window
- Standard/Business/Enterprise: `entitled = true` for all versions while license is active
- Expired/unlicensed: `entitled = false`, no `download_url`

### 7.3 Telemetry Sync (New)

Cashier installations periodically report anonymous usage data so the Ionic team can monitor fleet health. This piggybacks on the existing verify cycle — no new scheduled job needed.

#### Extended verify payload (optional fields):

```json
{
  "license_key": "...",
  "fingerprint": "...",
  "app_version": "1.0.0",
  "telemetry": {
    "php_version": "8.3.1",
    "os": "Windows 11",
    "db_driver": "sqlite",
    "receipt_count_since_last_sync": 47,
    "active_users": 3,
    "shift_active": true,
    "disk_free_mb": 12400,
    "last_backup_at": "2026-04-03T22:00:00Z"
  }
}
```

The server stores this per-device. If the client doesn't send telemetry (older versions), the server ignores the missing fields. **Telemetry never blocks or affects the verify response.**

### 7.4 Admin Dashboard (Internal Only)

A web interface used exclusively by the Ionic team. No customer access.

#### Customer Management

| Capability | Description |
|-----------|-------------|
| Customer list | Search/filter by name, plan, status, city |
| Customer detail | Contact info, notes, payment history, associated licenses |
| Add customer | Name, phone, email, company, notes — entered after sales contact |
| Edit customer | Update contact info, add internal notes |

#### License Management

| Capability | Description |
|-----------|-------------|
| Generate license key | Select customer, plan, device limit, expiry date |
| View active licenses | Key (masked), plan, devices used/limit, expiry, last verified |
| Revoke license | Immediately invalidates on next verify cycle |
| Extend license | Push expiry date forward (renewal after payment) |
| Transfer license | Move to a different customer (e.g., business sold) |
| Deactivate device | Free a device slot remotely (hardware replacement) |

#### Subscription & Billing

| Capability | Description |
|-----------|-------------|
| Record payment | Amount, date, method (bank transfer, cash, Paystack), receipt reference |
| Payment history | Per-customer log of all payments with status |
| Generate Paystack invoice | Send payment link to customer's phone/email |
| Renewal reminders | List of licenses expiring within 7/14/30 days |
| Revenue overview | Total revenue, by plan, by period, MRR for recurring plans |

#### Release Management

| Capability | Description |
|-----------|-------------|
| Publish release | Upload artifact, set version, write release notes, set minimum entitled plan |
| Release list | All published versions with download counts and entitled tier |
| Deprecate release | Mark a version as deprecated (client skips it) |

#### Fleet Monitoring (from telemetry)

| Capability | Description |
|-----------|-------------|
| Installation map | List of all active installations with last-seen, version, OS, PHP version |
| Version distribution | Chart: how many installations on each version |
| Health alerts | Installations that haven't checked in beyond grace period |
| Usage stats | Aggregate: receipts/day across fleet, active users, common configurations |

---

## 8. Data Model (Sync Server)

```
customers
  id, name, email, phone, company_name, address, city,
  notes (text), source (enum: referral|walk_in|online|other),
  created_by (admin user id), timestamps

plans
  id, name, slug, price_monthly, price_annual, price_one_time,
  max_devices, update_entitlement (enum: patch|all),
  update_window_months, features (json), is_active, timestamps

licenses
  id, customer_id (fk), plan_id (fk), license_key (unique),
  expires_at, features (json), revoked (bool), revoked_at,
  revoked_reason, notes, issued_by (admin user id),
  created_at, updated_at

device_activations
  id, license_id (fk), fingerprint (unique per license),
  hostname, app_url, app_version, os, php_version, db_driver,
  last_verified_at, last_telemetry (json),
  activated_at, deactivated_at (nullable)

payments
  id, customer_id (fk), license_id (fk, nullable),
  amount (decimal), currency, method (enum: bank_transfer|
  cash|paystack|other), reference, gateway_id (nullable),
  notes, recorded_by (admin user id), paid_at, timestamps

releases
  id, version (semver, unique), tag_name, release_notes (text),
  artifact_path, artifact_size_mb, min_plan_id (fk, nullable),
  is_patch (bool), is_deprecated (bool), download_count,
  published_at, timestamps

telemetry_snapshots
  id, device_activation_id (fk), app_version,
  receipt_count, active_users, shift_active (bool),
  disk_free_mb, last_backup_at, recorded_at

admin_users
  id, name, email, password, role (enum: admin|sales|support),
  timestamps

admin_audit_log
  id, admin_user_id (fk), action, target_type, target_id,
  details (json), timestamps
```

### Key Indexes
- `licenses.license_key` — unique, used in every API call
- `device_activations(license_id, fingerprint)` — unique compound
- `payments(customer_id, paid_at)` — billing history lookups
- `telemetry_snapshots(device_activation_id, recorded_at)` — time-series queries

---

## 9. Version Update Flow (End-to-End)

```
1. Ionic engineer uploads release artifact via admin dashboard
   → Sets version, release notes, minimum entitled plan

2. Cashier app checks for updates (background, scheduled):
   GET /api/releases/latest
   Authorization: Bearer {license_key}
   ?current_version=1.0.0

3. Sync server:
   a. Looks up license → plan
   b. Checks entitlement (patch-only vs all, update window)
   c. Entitled: returns version info + signed download URL
   d. Not entitled: returns update_available=true, entitled=false

4. Cashier app (on-device):
   a. If entitled update available → stores update info locally
   b. Shows update notification to admin users on /system-update
   c. Admin decides when to apply (never auto-applied)

5. Admin clicks "Update" → existing RunUpdate command executes
   (Phase 1: git pull. Phase 2: download from signed URL)
```

### Migration Path

**Phase 1:** Server proxies GitHub releases, adds entitlement check. Client's git-pull mechanism unchanged. Only change: `UpdateService` tries server first, falls back to GitHub.

**Phase 2:** Server hosts artifacts directly. Client downloads zip/tar instead of git pull. Eliminates need for npm/composer on client machines. Enables pre-built distribution.

---

## 10. Client-Side Changes Required

Minimal. The existing license protocol is already implemented.

| Component | Change | Priority |
|-----------|--------|----------|
| `.env` | Set `CASHIER_LICENSE_SERVER_URL` to production server URL | P0 — MVP |
| [VerifyLicense.php](app/Console/Commands/VerifyLicense.php) | Append optional telemetry payload to verify request | P1 |
| [UpdateService.php](app/Services/UpdateService.php) | Try server `/api/releases/latest` first, fall back to GitHub | P1 |
| [config/cashier.php](config/cashier.php) | Add `sync.telemetry_enabled` toggle (default true) | P1 |
| [LicenseService.php](app/Services/LicenseService.php) | On grace expiry: degrade features instead of hard-lock | P2 |
| [update.tsx](resources/js/pages/settings/update.tsx) | Show "update available but not entitled — contact Ionic" when `entitled=false` | P2 |
| [EnsureLicensed.php](app/Http/Middleware/EnsureLicensed.php) | Replace hard redirect with feature degradation logic | P2 |

---

## 11. Feature Gating

The `features[]` array in license data controls what is available per plan. Gating is enforced **client-side** — the server just tells the client which features are enabled.

| Feature Flag | Starter | Standard | Business |
|-------------|---------|----------|----------|
| `core_pos` | Yes | Yes | Yes |
| `reports_export` | CSV only | CSV + PDF | CSV + PDF |
| `multi_shift` | No | Yes | Yes |
| `expense_tracking` | No | Yes | Yes |
| `inventory_tracking` | Basic | Full (movements) | Full (movements) |
| `customer_management` | No | Yes | Yes |
| `audit_trail` | No | Yes | Yes |
| `multi_user` | 1 user | Up to 5 | Unlimited |

When a license degrades (expired, beyond grace), the app retains `core_pos` only — receipts and basic inventory continue working. No data is lost.

---

## 12. Security

| Concern | Approach |
|---------|----------|
| License keys | Cryptographically random 32-byte hex. HTTPS only. Stored encrypted on client (AES via Laravel Crypt). |
| API auth | License key as Bearer token for all client→server calls. |
| Admin auth | Session-based, admin_users table, separate from Cashier app users entirely. |
| Rate limiting | 10 req/min per key on verify; 3 req/min on activate. |
| Signed downloads | Time-limited URLs (1 hour) for release artifacts. |
| Telemetry privacy | No PII in telemetry. No receipt content, customer names, or transaction amounts. Only aggregate counts and system info. |
| Fingerprint storage | Stored as sha256 hashes, not reversible. |
| Admin audit | Every mutation (license issued, revoked, payment recorded) logged with admin ID. |

---

## 13. Tech Stack (Sync Server)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Backend | Laravel 13 | Same stack as Cashier — shared expertise, code reuse |
| Database | PostgreSQL | Reliable for billing/license data, good JSON support for telemetry |
| Cache | Redis | Rate limiting, session store |
| Queue | Redis + Horizon | Async: Paystack invoice generation, renewal reminders |
| Admin UI | Filament PHP | Rapid admin panel on Laravel — no frontend build needed |
| Payment | Paystack PHP SDK | Invoice generation and payment confirmation for Nigerian market |
| Email | Laravel Mail (Mailgun) | Renewal reminders, payment confirmations to Ionic sales team |
| Hosting | VPS (DigitalOcean/Hetzner) | Low-cost, good latency to West Africa |
| Monitoring | Laravel Pulse or Telescope | API health, error tracking |

---

## 14. Milestones

| Phase | Scope | Estimate |
|-------|-------|----------|
| **Phase 1 — License API** | License endpoints (activate, verify, deactivate). Admin dashboard: customer CRUD, license generation, manual payment recording. Deploy server. Set `CASHIER_LICENSE_SERVER_URL` in client. | 4 weeks |
| **Phase 2 — Updates** | Release management in admin. Entitled update API. Client-side `UpdateService` updated to call server first. | 2 weeks |
| **Phase 3 — Telemetry** | Client sends telemetry on verify. Fleet monitoring dashboard in admin. Version distribution chart. Health alerts. | 2 weeks |
| **Phase 4 — Billing** | Paystack invoice generation. Renewal reminder system. Revenue dashboard. Payment history. | 3 weeks |
| **Phase 5 — Feature Gating** | Client-side feature degradation on expiry. `features[]` enforcement in middleware. Per-plan feature matrix in admin. | 2 weeks |

---

## 15. Success Metrics

| Metric | Target |
|--------|--------|
| License activation success rate | > 99% on first attempt |
| Verify API p95 latency | < 200ms |
| Zero POS outages caused by server | 0 — the app must never stop working because the server is down |
| Fleet visibility | 100% of active installations reporting telemetry within 24 hours |
| License renewal rate | Track and improve quarter-over-quarter |
| Time to provision new customer | < 5 minutes from payment confirmation to working license |

---

## 16. Open Questions

1. **Grace period duration:** Is 7 days sufficient for all markets, or should it be configurable per-customer (e.g., rural areas with less reliable internet get 14 days)?
2. **Hard-lock vs soft-degrade:** Current design never hard-locks. Should there be an extreme case (e.g., 90+ days expired, clearly unpaid) where the app does lock? Or always degrade?
3. **Telemetry opt-out:** Should there be a `CASHIER_TELEMETRY_ENABLED=false` option for customers who explicitly request it?
4. **Multi-currency billing:** Is NGN the only billing currency, or will some customers pay in USD?
5. **Update delivery format:** Phase 2 replaces git-pull with artifact downloads. Should this be a zip of the built app, or an installer/updater binary?
6. **Data sync beyond telemetry:** Future phases — should the server also receive anonymized sales summaries for fleet-wide analytics (e.g., "average receipts/day across all installations")?
