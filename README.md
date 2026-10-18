# Dukaan Saathi – Role-Based Functional Prototype (Activity 2)

**Dukaan Saathi** is a calm, tamper-evident digital khata (credit ledger) and storefront management system built specifically for local Pakistani shopkeepers. It enables dukaan owners to record udhaar (credit sales), track customer repayments, manage inventory, log orders, and view business reports — all from any device, with no expensive POS hardware required.

Activity 2 introduces **Role-Based Access Control (RBAC)**, a dedicated **Platform Super Admin** portal, cryptographic SHA-256 hash chaining, data minimization, and defense-in-depth security hardening.

---

## Demo Credentials

Login URL: [`login.html`](login.html) (Single unified login page for both roles)

| Role | User Name | Email | Password | Assigned Dashboard | Primary Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Shop Owner** | Hamza Ali | `shopowner@dukaansaathi.pk` | `Shop@12345` | `app-dashboard.html` | Record credit/payments, inventory, shop orders |
| **Super Admin** | Sara Khan | `admin@dukaansaathi.pk` | `Admin@12345` | `admin-dashboard.html` | Approve/reject shops, plan tiers, disputes, audit log |

*Note: Passwords are stored in code as SHA-256 hashes (`crypto.subtle`), not plaintext. A 6-digit MFA step is required upon login (any 6 digits e.g. `123456` in demo mode).*

---

## Page Directory

### Public Marketing Pages
| Page | File | Description |
| :--- | :--- | :--- |
| Landing / Home | [`index.html`](index.html) | Marketing homepage with hero, testimonials, FAQ accordion, and stats |
| Features | [`features.html`](features.html) | 6 core platform capabilities |
| Pricing | [`pricing.html`](pricing.html) | Transparent subscription tier breakdown |
| Security | [`security.html`](security.html) | Public security architecture overview |
| Login / MFA | [`login.html`](login.html) | Unified sign-in with lockout limiter and 2-step MFA |

### Shop Owner Portal (Role: `owner`)
| Page | File | Description |
| :--- | :--- | :--- |
| Owner Dashboard | [`app-dashboard.html`](app-dashboard.html) | Business overview, collections chart, recent activity, demo denial button |
| Digital Khata | [`app-khata.html`](app-khata.html) | Customer credit ledger, append-only timeline, masked phone reveal |
| Orders | [`app-orders.html`](app-orders.html) | Storefront order tracker with status pipeline |
| Inventory | [`app-inventory.html`](app-inventory.html) | Product stock management with low-stock alerts |
| Reports | [`app-reports.html`](app-reports.html) | Financial analytics, top debtors, CSV export with formula neutralization |

### Platform Super Admin Portal (Role: `admin`)
| Page | File | Description |
| :--- | :--- | :--- |
| Admin Dashboard | [`admin-dashboard.html`](admin-dashboard.html) | Platform KPIs (shops, pending approvals, plans, disputes), signup chart |
| Shop Approvals | [`admin-shops.html`](admin-shops.html) | Approval queue, drawer view, Approve / Reject (with mandatory reason) / Suspend |
| Subscription Plans | [`admin-plans.html`](admin-plans.html) | SaaS tier management and limit controls |
| Dispute Arbitration | [`admin-disputes.html`](admin-disputes.html) | Merchant-customer claim arbitration with mandatory resolution note |
| Hash Chain Audit | [`admin-audit.html`](admin-audit.html) | Filterable SHA-256 audit log, integrity verification, tamper simulation |
| Security Center | [`admin-security.html`](admin-security.html) | Security controls status, 7 threat mitigations, and automated self-check |

---

## Security Principles Implementation (Section 7)

Dukaan Saathi adheres to 12 core secure software engineering principles:

1. **Least Privilege / RBAC**: Strict separation of duties between Shop Owner and Super Admin. Guards enforce access at page render (`js/guard.js`) and within sensitive functions (`js/auth.js`).
2. **Separation of Duties**: Super Admin approves/rejects shops; shop owners cannot approve their own shops. Super Admin has zero access to private customer khata ledgers.
3. **Complete Mediation**: Every protected page runs synchronous verification in `<head>` before DOM paint. Every restricted function re-checks role capability at invocation time.
4. **Fail-Safe Defaults**: Missing or invalid session immediately rejects access and redirects to `login.html`.
5. **Least Information / Data Minimization**: Customer phone numbers are masked (`0300-***-**45`); CNIC numbers are never stored (status words only); sessions store only `{ id, name, role, loginAt }`; authentication errors are generic ("Invalid credentials").
6. **Integrity / Non-Repudiation**: Khata is strictly append-only (no edit/delete UI). The platform audit trail implements cryptographic forward-linked SHA-256 hash chaining (`Block[i].prevHash = Block[i-1].hash`).
7. **Input Validation & Output Encoding**: Shared validators (`DS_VALIDATORS`); safe DOM rendering via `textContent` and `escapeHtml()`; spreadsheet formula injection neutralized (`neutralizeCsvCell`).
8. **Defense in Depth**: Strict Content Security Policy (CSP) meta tags on all 16 HTML pages, HTTP security headers in `vercel.json` (`nosniff`, `DENY` frame, `no-referrer`), client guards, and MFA.
9. **Brute-Force Resistance**: 5 failed consecutive login attempts trigger a 30-second form lockout with active countdown timer.
10. **Session Management**: Session token isolated in `sessionStorage`; 5-minute inactivity timer with 30s warning modal; back-button cache prevention via `pageshow` listener.
11. **Auditability**: All authentications, approvals, disputes, and unmasking actions are committed into the tamper-evident SHA-256 hash chain with actor, role, and timestamp.
12. **Security Diagnostics Suite**: `admin-security.html` provides live in-browser testing verifying CSP headers, session credential isolation, audit chain integrity, guard script presence, and RBAC matrix.

For detailed analysis, testing logs, and architecture documentation, see [`docs/ACTIVITY2.md`](docs/ACTIVITY2.md).

---

## Team

| Name | Student ID |
| :--- | :--- |
| Ahmad Abdullah | 23F-3027 |
| Muhammad Mubeen | 23F-3055 |

**Course:** Secure Software Development  
**Repository:** [https://github.com/Mubeen-cyber10/Dukaan-Sathi](https://github.com/Mubeen-cyber10/Dukaan-Sathi)

---

> **Honesty Rule & Prototype Notice:**  
> *"Hiding UI is not a security control; real enforcement is done server-side in the backend phase."*  
> Client-side RBAC and guards demonstrate the target security architecture; production environments enforce authorization at the API gateway and database row-level security layers.
