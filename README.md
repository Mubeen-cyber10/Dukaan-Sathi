# Dukaan Saathi

**Dukaan Saathi** is a calm, tamper-evident digital khata (credit ledger) and storefront management system built specifically for local Pakistani shopkeepers. It enables dukaan owners to record udhaar (credit sales), track customer repayments, manage inventory, log orders, and view business reports — all from any device, with no expensive POS hardware required.

## Run locally

Use Node.js 18 or newer with `better-sqlite3`. If the native driver is unavailable, use Node.js 22.13 or newer for the built-in SQLite fallback.

```sh
npm install
npm run setup
npm start
```

Open [Dukaan Saathi](http://localhost:3000). `npm run setup` creates a local `.env` if needed and recreates the demo database. Stop the server before resetting the database and use `npm run db:backup` to save existing data. Run `npm test` for the API regression suite.

## Demo credentials

Sign in at [the local login page](http://localhost:3000/login.html).

| Role | User | Email | Password |
| --- | --- | --- | --- |
| Shop owner | Hamza Ali | `shopowner@dukaansaathi.pk` | `Shop@12345` |
| Shop owner | Bilal Ahmed | `bilal@dukaansaathi.pk` | `Bilal@12345` |
| Super admin | Sara Khan | `admin@dukaansaathi.pk` | `Admin@12345` |

## Activity 6 modules

- **Shop registration and approval** connects the registration form, admin queue, and public directory through SQLite. The directory lists active shops.
- **Digital Khata** uses shop-scoped customers and an append-only ledger for credit sales and payments. Balance calculations run on the server.

See [Activity 5](docs/ACTIVITY5.md) for frontend validation, file checks, and password feedback. See [Activity 6](docs/ACTIVITY6.md) for the API, tests, and implementation limits. [Activity 2](docs/ACTIVITY2.md) and [Activity 3](docs/ACTIVITY3.md) document the earlier prototype.

---

## Complete Page Directory

### Public Pages

| Page | File | Description |
| :--- | :--- | :--- |
| Landing / Home | [`index.html`](index.html) | Marketing homepage with hero, features, testimonials, FAQ, and directory CTAs |
| Browse Shops | [`browse-shops.html`](browse-shops.html) | Public directory of verified active dukaans with search, filters & details modal |
| Register Shop | [`register-shop.html`](register-shop.html) | Merchant registration form with live validation and approval status |
| Features | [`features.html`](features.html) | Platform capabilities and digital khata benefits |
| Pricing | [`pricing.html`](pricing.html) | Transparent subscription tier breakdown |
| Security | [`security.html`](security.html) | Public security architecture overview |
| Login | [`login.html`](login.html) | Unified sign-in with JWT sessions and lockout |

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

## Security Principles & Architecture

Express validates requests, verifies signed 30-minute JWTs, checks the user's current role and status, and scopes khata requests to the authenticated owner's shop. Database access uses bound SQL parameters, and SQLite triggers enforce append-only ledger and audit records. The application masks phone numbers, applies rate limits and account lockout, and uses Helmet CSP and a static file whitelist.

The registration, approval, public directory, and khata workflows use the backend. Orders, inventory, reports, plans, disputes, and the browser audit demo retain prototype data. The Vercel static deployment does not run the Express backend.

---

## Team

| Name | Student ID | Assigned Modules |
| :--- | :--- | :--- |
| Muhammad Mubeen | 23F-3055 | Module 1 (Shop Registration & Approval) |
| Ahmad Abdullah | 23F-3027 | Module 2 (Digital Khata) |

**Course:** Secure Software Development  
**Repository:** [https://github.com/Mubeen-cyber10/Dukaan-Sathi](https://github.com/Mubeen-cyber10/Dukaan-Sathi)
