# Activity 3 – Parallel Module Development & Integration

**Module 1 – Muhammad Mubeen (Shop Registration & Verification Submission)**  
**Module 2 – Ahmad Abdullah (Customer Shop Directory & Public Exploration)**  
**Course:** Secure Software Development &bull; **Platform:** Dukaan Saathi &bull; **Date:** October 2026

---

## 1. Architecture & Shared Store (`js/shops-store.js`)
The shared store bridges the client-side lifecycle across isolated pages:
- **State Flow:** In-memory object model &harr; `sessionStorage` (`ds-shops`) &harr; `localStorage` (`ds_shops_data_v2`).
- **Separation of Duties:** Registrations enter `Pending Approval`. Shop owners cannot self-approve. Platforms Super Admins arbitrate state transitions in [`admin-shops.html`](../admin-shops.html). Once approved, shops immediately surface in [`browse-shops.html`](../browse-shops.html).
- **Rate Limiting:** Enforces max 3 submissions per minute per browser session with countdown quota indicator.

---

## 2. Verification Test Tables (3 Rows per Module)

### Module 1: Shop Registration & Verification Submission
| Test Case | Inputs / Action | Expected Result | Actual Result |
| :--- | :--- | :--- | :--- |
| **TC-M1-01: Duplicate Name in City** | Name: `"Bismillah General Store"`, City: `"Multan"` | Triggers inline duplicate warning; prevents conflicting submission | **PASS** &ndash; Inline warning banner shown; submission blocked |
| **TC-M1-02: Rate Limit Protection** | Submit 4 applications consecutively within 60s | 4th submission rejected with countdown banner; quota badge alerts user | **PASS** &ndash; Blocked on 4th attempt; toast & countdown shown |
| **TC-M1-03: Application Withdrawal** | Click "Withdraw" on pending application & confirm modal | Modal confirms action; application removed from queue & session | **PASS** &ndash; Modal dialog confirms; store updated; toast emitted |

### Module 2: Customer Shop Directory & Public Exploration
| Test Case | Inputs / Action | Expected Result | Actual Result |
| :--- | :--- | :--- | :--- |
| **TC-M2-01: Status Isolation** | Inspect directory for `Pending Approval` or `Suspended` shops | Only `Active` shops are rendered; pending/suspended shops excluded | **PASS** &ndash; Exclusively active stores shown; zero leaks |
| **TC-M2-02: Owner PII Masking** | Inspect public shop cards and detail modal | Owner full name, CNIC, and private phone are omitted from public view | **PASS** &ndash; Public store contacts only; owner PII strictly withheld |
| **TC-M2-03: Real-Time Multi-Filter** | Search `"flour"` + City: `"Multan"` + Sort: `"A-Z"` | Grid updates immediately matching query and city with sorted results | **PASS** &ndash; Instant debounce filtering; empty state on no match |

### Integration: End-to-End Onboarding to Directory Pipeline
| Test Case | Inputs / Action | Expected Result | Actual Result |
| :--- | :--- | :--- | :--- |
| **TC-INT-01: Registration to Admin Queue** | Register `"Subhan Kiryana"` in `register-shop.html` | Appears as `Pending Approval` in Super Admin `admin-shops.html` | **PASS** &ndash; Shop reflected in admin queue across tabs |
| **TC-INT-02: Admin Approval to Directory** | Super Admin logs in, clicks "Approve" in `admin-shops.html` | Status transitions to `Active`; immediately visible in `browse-shops.html` | **PASS** &ndash; Storefront live in directory upon admin approval |
| **TC-INT-03: Theme & Navigation Uniformity** | Toggle dark/light theme & navigate public/admin navbars | Unified navbar links, responsive hamburger, persistent theme token | **PASS** &ndash; Cohesive layout, 0 broken links, CSP compliant |

---

## 3. Part 6: Security & Threat Modeling Table

| Threat Vector | Risk Level | Client-Side Prototype Mitigation | True Server-Side Control (Production) |
| :--- | :--- | :--- | :--- |
| **Unauthorized Self-Approval** | **High** | UI omits approval controls from owner; state set to `Pending Approval` | RBAC middleware rejects non-admin JWT claims on `/api/shops/:id/approve` |
| **PII Data Harvest via Directory** | **High** | Cards and modals omit owner personal identity, CNIC, and private phone | Data projection / DTO serialization masks private attributes at SQL level |
| **Registration Flooding (DoS)** | **Medium** | Client token bucket (3 submissions/min) blocks rapid submissions | Redis distributed rate-limiter on IP & session fingerprint with CAPTCHA |
| **Tampering via DevTools / Storage** | **Medium** | Cryptographic hash chaining (`DS_AUDIT`) detects client state drift | Database write-ahead WAL logs with append-only ledger tables & HMAC |
| **Cross-Site Scripting (XSS)** | **High** | Contextual encoding via `escapeHtml()` and strict CSP meta tags | Server-side output sanitization, HTTP CSP headers, and template escaping |

---

## 4. Integration Checklist
- [x] Shared data store (`js/shops-store.js`) created with in-memory, session, and local persistence.
- [x] Module 1 (`register-shop.html` + `js/module-register-shop.js`) built with live validation, rate limiting & withdrawal.
- [x] Module 2 (`browse-shops.html` + `js/module-browse-shops.js`) built with directory search, filters & privacy protection.
- [x] Separation of duties maintained: newly registered shops flow to `admin-shops.html` for compliance review.
- [x] Navigation bars updated across `index.html`, `features.html`, `pricing.html`, `security.html`, and `login.html`.
- [x] Dashboards (`app-dashboard.html`, `admin-dashboard.html`, `admin-shops.html`) updated with cross-navigation.
- [x] Strict Content Security Policy (CSP) meta tags included on all HTML documents.
- [x] Zero person names in the UI.

> **Honesty Rule:**  
> *"Hiding UI is not a security control; real enforcement is done server-side in the backend phase."*  
> *"Frontend validation is not security; the backend will re-validate and enforce authorization."*
