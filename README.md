# Dukaan Saathi

**Dukaan Saathi** is a calm, tamper-evident digital khata (credit ledger) and storefront management system built specifically for local Pakistani shopkeepers. It enables dukaan owners to record udhaar (credit sales), track customer repayments, manage inventory, log orders, and view business reports — all from any device, with no expensive POS hardware required. The system emphasises audit integrity (append-only ledger entries), strict multi-tenant data isolation, and a bilingual-friendly UI with both light and dark themes.

## Pages

| Page | File | Description |
|------|------|-------------|
| Landing / Home | `index.html` | Marketing homepage with hero, testimonials, FAQ accordion, and stats |
| Features | `features.html` | Feature showcase page |
| Pricing | `pricing.html` | Subscription tier comparison |
| Security | `security.html` | Security architecture overview |
| Login / MFA | `login.html` | Shop owner sign-in with 2-step MFA (credential + 6-digit OTP) |
| App Dashboard | `app-dashboard.html` | Main app overview: summary cards, weekly chart, audit log |
| Digital Khata | `app-khata.html` | Customer credit ledger with search, filter, sort, and drawer |
| Orders | `app-orders.html` | Order tracker with status management |
| Inventory | `app-inventory.html` | Product stock management with low-stock alerts |
| Reports | `app-reports.html` | Business analytics and exportable reports |

## JavaScript Interactions

- **Theme toggle** (`js/theme.js`, `js/ui.js`): Persists light/dark preference to `localStorage`; prevents flash of unstyled content (FOUC) via synchronous `<head>` script.
- **Mobile hamburger menu** (`js/ui.js`): Slide-down navigation drawer for small screens.
- **Login form validation** (`login.html` inline script): Email/phone and password validation; transitions to MFA step on success.
- **MFA OTP inputs** (`login.html` inline script): 6-box auto-advance, backspace navigation, and paste support.
- **Forgot password modal** (`login.html` inline script): Opens/closes a modal overlay.
- **Count-up statistics** (`js/ui.js`): Intersection Observer triggers animated counter for the stats strip on the landing page.
- **FAQ accordion** (`js/ui.js`): Expand/collapse with smooth height animation.
- **Khata search, filter & sort** (`app-khata.html` + `js/data.js`): Real-time search, chip-based filter (All / Due / Settled), and sort by amount or name.
- **Customer ledger drawer** (`app-khata.html`): Side-panel showing full transaction timeline for a customer.
- **New entry modal** (`app-khata.html`): 2-step form (entry details → confirmation) for recording credit or payment.
- **Dashboard audit log** (`app-dashboard.html` + `js/data.js`): Dynamically rendered recent activity list.
- **Weekly bar chart** (`app-dashboard.html`): CSS-only bar chart showing 7-day collection trend with hover tooltips.
- **Inventory modals & alerts** (`app-inventory.html`): Add-product modal, low-stock badge indicators.
- **Orders status management** (`app-orders.html`): Update order status with toast notifications.
- **Reports filters** (`app-reports.html`): Date-range and category filters for analytics views.
- **Toast notifications** (`js/ui.js`): Slide-in/out success, warning, and danger toasts.
- **User menu dropdown** (app pages): Avatar-triggered dropdown with logout and settings links.

## Team

| Name | Student ID |
|------|-----------|
| Ahmad Abdullah | 23F-3027 |
| Muhammad Mubeen | 23F-3055 |

**Course:** Secure Software Development

## Deployment

Live URL: *(add after deployment)*

---

> **Prototype Notice:** This is a front-end prototype. All data is mock/local. Real enforcement of security controls requires a backend implementation.
