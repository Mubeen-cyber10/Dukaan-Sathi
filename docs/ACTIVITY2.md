# Activity 2: Role-Based Functional Prototype & Security Hardening
**Dukaan Saathi – Digital Khata & Storefront Platform**  
**Course:** Secure Software Development  
**Students:** Ahmad Abdullah (23F-3027) & Muhammad Mubeen (23F-3055)  
**Date:** October 2026  

---

## 1. Executive Summary & Ground Rules
Development Activity 2 implements a role-based functional prototype with strict security principles for Dukaan Saathi. Built entirely with plain HTML5, CSS3 (using existing Digikhata-inspired orange variables), and vanilla JavaScript, the application runs client-side with zero external frameworks, dependencies, or databases.

> **Honesty Rule & Prototype Notice:**  
> *"Hiding UI is not a security control; real enforcement is done server-side in the backend phase."*  
> This disclaimer is present at the very top of `js/auth.js`, `js/guard.js`, and `js/ui.js`. Client-side RBAC and guards demonstrate the target security architecture; production environments enforce authorization at the API gateway and database row-level security layers.

---

## 2. Roles & Capabilities Matrix

The prototype defines two distinct, non-overlapping roles:

| Dimension | Role 1: Shop Owner | Role 2: Platform Super Admin |
| :--- | :--- | :--- |
| **User Identity** | Hamza Ali (`shopowner@dukaansaathi.pk`) | Sara Khan (`admin@dukaansaathi.pk`) |
| **Primary Scope** | Local retail counter, customer udhaar, stock, sales | Multi-tenant platform governance, KYC approvals, disputes |
| **Authorized Functions** | 1. Append credit sales & payments in append-only Khata<br>2. Manage product inventory & low-stock alerts<br>3. View & update order lifecycle of own shop | 1. Approve / Reject / Suspend shops (KYC validation)<br>2. Manage tenant subscription plans & limits<br>3. View platform audit log & resolve merchant-customer disputes |
| **Restricted Functions** | Cannot approve shops, manage subscription tiers, or arbitrate disputes | **Can NEVER view customer khata entries, balances, or customer phone numbers** |
| **Landing Portal** | `app-dashboard.html` | `admin-dashboard.html` |
| **Sidebar Navigation** | Overview, Khata Ledger, Orders, Inventory, Reports | Overview, Shop Approvals, Subscription Plans, Disputes, Hash Chain Audit, Security Center |

---

## 3. Demo Users & Authentication Security

### Credentials & Cryptographic Password Storage
Passwords are never stored in plaintext within source code or storage. Credentials are stored as precomputed **SHA-256 hashes** in `js/data.js` and verified using the browser's native **Web Crypto API** (`crypto.subtle.digest`):

| User Name | Role | Email | Plaintext Demo Password | SHA-256 Hash Stored in `js/data.js` |
| :--- | :--- | :--- | :--- | :--- |
| **Hamza Ali** | `owner` | `shopowner@dukaansaathi.pk` | `Shop@12345` | `58c92a1bc2ecbd2e6ff70ff073cb4fa699ee92500c5c4d39f40fa41538bc1665` |
| **Sara Khan** | `admin` | `admin@dukaansaathi.pk` | `Admin@12345` | `6f2cb9dd8a798a006db2b904944d18ec06f71661853fc42194380e224e75d263` |

### Authentication Architecture & Login Flow
```
[User submits email + password on login.html]
                  │
                  ▼
[Brute-force check: >= 5 failed attempts? ──YES──► Lock form 30s with visible countdown]
                  │ NO
                  ▼
[Hash input password with Web Crypto SHA-256]
                  │
                  ▼
[Find user & compare hash ──MISMATCH──► Log LOGIN_FAILED, show generic "Invalid credentials"]
                  │ MATCH
                  ▼
[Present 6-Digit MFA Verification Modal (demo: accepts any 6 digits e.g. 123456)]
                  │
                  ▼
[Store minimal payload in sessionStorage: { id, name, role, loginAt } (NO passwords/hashes)]
                  │
                  ▼
[Role Dispatcher: 'owner' -> app-dashboard.html | 'admin' -> admin-dashboard.html]
```

- **Brute-Force Lockout**: After 5 failed attempts, the login form is disabled for 30 seconds with an active visible countdown timer.
- **Generic Responses**: Authentication failures display "Invalid credentials" without revealing whether email or password was incorrect, preventing user enumeration.
- **Admin Isolation**: No links to any `admin-*.html` pages exist in public marketing pages, the login page, or the shop owner interface.

---

## 4. Protected Data & Partitioning

| Data Asset | Shop Owner Access | Super Admin Access | Rationale & Protection Technique |
| :--- | :---: | :---: | :--- |
| **Customer Khata Debts & Ledgers** | **Read / Append** | **DENIED** | Super Admin interface completely omits Khata rendering scripts and APIs, preventing insider snooping into customer financial debts. |
| **Customer Phone Numbers** | **Masked by Default**<br>(`0300-***-**45`) | **DENIED** | Phone numbers are masked across all list and table views. Shop owners can temporarily unmask via an explicit "Reveal" button inside the drawer, which auto-hides after 10 seconds and logs a `PHONE_UNMASKED` audit entry. Admins never receive phone numbers. |
| **Government IDs (CNIC / NTN)** | **DENIED** | **Status Words Only** | Zero storage or display of actual 13-digit CNIC or NTN numbers. Verification is displayed using words only: `CNIC: Verified` or `CNIC: Pending Verification`. |
| **Passphrases & Cryptographic Keys** | **DENIED** | **DENIED** | Neither role has access to raw credentials. `sessionStorage` holds only `{ id, name, role, loginAt }`. |

---

## 5. Restricted Function & Separation of Duties

- **Restricted Function**: Shop Onboarding Approval & Rejection (`approveShop`, `rejectShop`).
- **Authorized Role**: `admin` (Super Admin) only.
- **Complete Mediation in Code**:
  ```javascript
  // Enforced inside the function in js/auth.js:
  async function approveShop(shopId) {
    const user = getUser();
    if (!user || user.role !== 'admin') {
      DS_AUDIT.log('ACCESS_DENIED', `Unauthorized shop approval attempt on shop #${shopId}`);
      showToast('Access Denied: Only Super Admin can approve merchant shops.', 'error');
      return false;
    }
    // Proceed with approval and commit to audit chain...
  }
  ```
- **Owner Dashboard Live Demonstration**: A dedicated button labeled **"Try approving a shop (demo)"** is placed on `app-dashboard.html`. Clicking it triggers `window.approveShop('SHP-104')`, verifying that the function halts and produces an immediate "Access Denied" toast and an audit log event.
- **Separation of Duties Notice**: Displayed on `admin-shops.html`: *"Shop owners cannot approve their own shops."*

---

## 6. Real Observed Test Results (Parts 6 & 10)

All tests were executed against the functional prototype served on `http://localhost:8080`:

### Part 6: Core Role-Based Dashboards & Flows
| Test # | Test Scenario | Steps Executed | Expected Result | Real Observed Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **T-01** | Owner Authentication & Portal | Login as `shopowner@dukaansaathi.pk`, pwd `Shop@12345`, MFA `123456`. | Redirect to `app-dashboard.html`, greeting "Welcome, Hamza Ali", badge "Shop Owner". | Redirected seamlessly; header displayed "Welcome, Hamza Ali"; badge "Shop Owner"; sidebar showed retail tools only (Khata, Inventory, Orders). | **PASS** |
| **T-02** | Super Admin Authentication & Portal | Logout owner, login as `admin@dukaansaathi.pk`, pwd `Admin@12345`, MFA `123456`. | Redirect to `admin-dashboard.html`, greeting "Welcome, Sara Khan", badge "Super Admin", different menu and cards. | Redirected to `admin-dashboard.html`; greeting "Welcome, Sara Khan"; badge "Super Admin"; 4 KPI cards displayed; sidebar displayed Admin items only (Shops, Plans, Disputes, Audit, Security). | **PASS** |

### Part 10: Security Controls, Integrity & Edge Cases
| Test # | Test Scenario | Steps Executed | Expected Result | Real Observed Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **T-03** | Restricted Function Invocation (UI & Console) | While on owner dashboard, click "Try approving a shop (demo)"; also run `window.approveShop('SHP-101')` in DevTools console. | Both attempts blocked with "Access Denied" toast; `ACCESS_DENIED` written to audit log. | Blocked instantly. Toast displayed "Access Denied: Only Super Admin can approve merchant shops."; `ACCESS_DENIED` logged to audit log with actor Hamza Ali. | **PASS** |
| **T-04** | Session Termination & Browser Cache Back-Button | Click "Log Out"; observe redirect to `login.html`; press browser Back button and try navigating directly to `app-dashboard.html`. | `sessionStorage` cleared; `guard.js` blocks render and redirects to `login.html` with notice. | Blank page intercepted immediately before paint (`visibility: hidden`); redirected to `login.html` with toast "Access denied - please sign in". | **PASS** |
| **T-05** | Cross-Role Route Privilege Escalation | While logged in as Shop Owner, attempt navigating directly to `http://localhost:8080/admin-dashboard.html`. | Immediate redirect to `login.html` with insufficient permissions notice. | Page blocked prior to paint; redirected to `login.html` with banner "Access denied: insufficient permissions". | **PASS** |
| **T-06** | XSS Injection Defense | In `app-khata.html`, enter `<img src=x onerror=alert(1)>` in search query, customer name, and khata transaction note. | Text rendered as sanitized plain text; zero script alerts triggered. | Handled via `textContent` and `escapeHtml()`; rendered literally on screen; zero script execution. | **PASS** |
| **T-07** | Brute-Force Rate Limiting & Lockout | Enter 5 consecutive incorrect passwords on `login.html`. | Form locked for 30 seconds; countdown timer shown. | After 5th failed attempt, inputs and submit buttons disabled; alert showed "Account temporarily locked. Please wait 30s before retrying." with active countdown timer. | **PASS** |
| **T-08** | Cryptographic Hash Chain Verification & Tamper Detection | Navigate to `admin-audit.html`; click "Verify Integrity"; click "Simulate Tampering"; click "Restore Pristine Chain". | Initial verification: Valid; Tampering: Fails on Block #2; Restore: Valid again. | Initial: "CRYPTOGRAPHICALLY VERIFIED" (green); Tampering: "TAMPERING DETECTED - Alert: Block #2 prevHash does not match computed hash of Block #1" (red); Restore: "CRYPTOGRAPHICALLY VERIFIED". | **PASS** |
| **T-09** | Automated Security Diagnostics Self-Check | Navigate to `admin-security.html`; click "Run Self-Check". | Live browser tests check CSP, sessionStorage, audit chain, guard script, and RBAC matrix. | 5/5 diagnostics executed live and returned PASS: (1) CSP Present, (2) No Password in Session, (3) Audit Chain Valid, (4) Guard Functional, (5) RBAC Enforced. | **PASS** |
| **T-10** | Data Minimization & Phone Unmasking | Open customer drawer in `app-khata.html`; observe masked phone; click "Reveal (10s)". | Shows `0300-***-**45` initially; reveals full number; auto-masks after 10s and writes audit log. | Initial: `0300-***-**45`; on click: `0300-8472910` displayed with countdown; after 10s reverted back to `0300-***-**45`; `PHONE_UNMASKED` recorded in audit trail. | **PASS** |

---

## 7. Security Principles Implementation Map

| # | Security Principle | How Implemented in Dukaan Saathi | Files Enforcing Control |
| :-: | :--- | :--- | :--- |
| **1** | **Least Privilege / RBAC** | Strict role partitioning between Shop Owner and Super Admin; role capabilities verified in `guard.js` and in-function guards (`canDo`, `requireRole`). | `js/auth.js`, `js/guard.js`, `app-*.html`, `admin-*.html` |
| **2** | **Separation of Duties** | Super Admin approves/rejects shops; shop owners cannot approve their own shops. Super Admin has zero access to Khata ledgers. | `admin-shops.html`, `js/auth.js`, `app-dashboard.html` |
| **3** | **Complete Mediation** | Every protected page validates session and role via synchronous `<head>` script before paint; sensitive functions re-check active user role at execution time. | `js/guard.js`, `js/auth.js` |
| **4** | **Fail-Safe Defaults** | Missing, malformed, or unauthorized session defaults immediately to access denial and redirects to `login.html`. | `js/guard.js`, `login.html` |
| **5** | **Least Information / Data Minimization** | Phone numbers masked (`0300-***-**45`); CNIC numbers omitted (words only); session stores minimal `{ id, name, role, loginAt }`; generic auth error messages. | `js/data.js`, `app-khata.html`, `login.html`, `admin-shops.html` |
| **6** | **Integrity / Non-Repudiation** | Append-only Khata ledger (no edit/delete UI); tamper-evident SHA-256 hash chaining linking every audit record to previous hash (`prevHash`). | `js/audit.js`, `app-khata.html`, `admin-audit.html` |
| **7** | **Input Validation & Output Encoding** | Centralized validators (`DS_VALIDATORS`); safe DOM rendering via `textContent` and `escapeHtml()`; CSV formula injection neutralization (`neutralizeCsvCell`). | `js/ui.js`, `app-reports.html`, `app-khata.html`, `admin-disputes.html` |
| **8** | **Defense in Depth** | Multi-layered defenses: CSP meta tags on all 16 pages, security headers in `vercel.json` (`nosniff`, `DENY` frame, `no-referrer`), client guards, and MFA. | `vercel.json`, all `.html` files |
| **9** | **Brute-Force Resistance** | 5 consecutive failed attempts trigger a 30-second form lockout with active countdown timer; generic "Invalid credentials" error. | `js/auth.js`, `login.html` |
| **10** | **Session Management** | Ephemeral `sessionStorage` only (cleared on tab close); 5-minute inactivity idle monitor with 30s warning countdown; `pageshow` back-button cache clearing. | `js/guard.js`, `js/auth.js` |
| **11** | **Auditability** | Cryptographic audit trail logs logins, logouts, access denials, approvals, disputes, and unmasking actions with actor, role, timestamp, and forward hashes. | `js/audit.js`, `admin-audit.html` |
| **12** | **Security Diagnostics Suite** | `admin-security.html` Security Center features 4 active control cards, 4 planned backend cards, the 7 proposal threat mitigations, and an automated in-browser self-check. | `admin-security.html` |

---

## 8. Security Development Note

### Conceptual Basis
This prototype is structured on the foundational security concepts of **Role-Based Access Control (RBAC)**, the **Principle of Least Privilege (PoLP)**, and **Separation of Duties (SoD)**:
- **Least Privilege**: Users are granted only the minimum access rights essential for their specific job functions. A shop owner requires access to their own store's transactions and stock, not platform governance. A super admin requires merchant management tools, not individual consumer credit ledgers.
- **Separation of Duties**: Critical operational workflows cannot be completed by a single actor. Specifically, shop approval requires platform administrative vetting to prevent fraudulent retailer onboarding.

### Architecture & Implementation Details
1. **Routing & Guard Architecture (`js/guard.js`)**: Loaded in the `<head>` of every protected page. It synchronously evaluates `sessionStorage.getItem('ds_session_user')` before the browser paints the DOM. If the session is missing or the role does not match the page's required role (`app-*.html` &rarr; `owner`, `admin-*.html` &rarr; `admin`), execution is aborted, and the browser is redirected to `login.html`.
2. **In-Function Permission Enforcement (`js/auth.js`)**: Sensitive methods such as `approveShop(id)` and `rejectShop(id, reason)` do not rely solely on UI button hiding. The functions explicitly check `currentUser.role === 'admin'`. Unauthorized callers trigger an `ACCESS_DENIED` audit event and an error notification.
3. **Cryptographic Tamper-Evident Hash Chain (`js/audit.js`)**: Every audit log entry incorporates `prevHash` (the SHA-256 digest of the prior block) and `hash` (SHA-256 of canonical entry data + `prevHash`). Modifying any historical block breaks all subsequent links in the chain, enabling automated detection via `verifyChain()`.

### Unauthorized Access Handling
When an unauthorized attempt occurs:
- The UI blocks rendering immediately (`document.documentElement.style.visibility = 'hidden'`).
- The user is redirected to `login.html` with an explanatory security notice stored in `ds_guard_notice`.
- If an API or function call is attempted from DevTools console, the function halts execution, issues an error toast, and writes a tamper-evident audit record documenting the actor, timestamp, and target resource.

### Production Constraints & Future Backend Phases
In a production system:
1. Client-side checks are supplemented with **HTTP-only, Secure, SameSite JWT/session cookies** issued by a hardened backend.
2. Authorization is enforced at the **API Gateway** and via **PostgreSQL Row-Level Security (RLS)** policies.
3. Passwords will be salted with cryptographic random salts and hashed using **Argon2id** or **bcrypt** on the server.
4. Audit chains will be persisted in an immutable ledger (e.g. Amazon QLDB or append-only write-once-read-many database).
