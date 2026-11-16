# Development Activity 6 — Backend Development and Integration

Dukaan Saathi serves the existing pages and the Express API from the same origin. SQLite stores registration, approval, customer ledgers, and audit records.

## Run locally

Use Node.js 18 or newer with `better-sqlite3`. If the native binding is unavailable, Node.js 22.13 or newer can use built-in `node:sqlite`.

```sh
npm install
npm run setup
npm start
```

Open [Dukaan Saathi locally](http://localhost:3000). Setup creates `.env` if missing and seeds the database. Both `npm run setup` and `npm run db:setup` recreate the database, so stop the server before resetting it and save data you want to keep with `npm run db:backup`. Set `DB_PATH` to use a different file. The server requires a `JWT_SECRET` of at least 32 characters.

| Demo account | Email | Password |
| --- | --- | --- |
| Hamza Ali, owner of Bismillah General Store | `shopowner@dukaansaathi.pk` | `Shop@12345` |
| Bilal Ahmed, owner of Al-Madina Mart | `bilal@dukaansaathi.pk` | `Bilal@12345` |
| Sara Khan, admin | `admin@dukaansaathi.pk` | `Admin@12345` |

## Database

| Table | Stored data |
| --- | --- |
| `users` | Identity, bcrypt password hash, role, status, and lockout state |
| `shops` | Owner, public directory fields, approval state, and rejection reason |
| `customers` | Shop-scoped customer name and private mobile number |
| `khata_entries` | Append-only credit and payment records. Balances use the sum of credits less payments. |
| `audit_log` | Append-only events with timestamp, actor, action, target, detail, previous hash, and current hash |

## API

Protected calls require `Authorization: Bearer <token>`. Errors use `{error:{code,message}}`. Field validation can add `error.fields`. Unknown API routes return `404`. Unexpected failures return a generic `500`.

### Authentication

| Method | Path | Auth | Role | Purpose | Status codes |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/auth/login` | Public | Any | Sign in with `{email,password}` and return `{token,user}` | `200`, `400` invalid body, `401` invalid credentials, `403` inactive, `429` throttled or locked |
| GET | `/api/auth/me` | JWT | Any active user | Return `{id,name,role,shopId}` | `200`, `401` |

### Module 1 — Registration and approval

| Method | Path | Auth | Role | Purpose | Status codes |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/shops/register` | Public | Any | Create a pending owner and shop from `{ownerName,email,mobile,shopName,category,city,address,description?,password}` | `201`, `400`, `409` duplicate, `429` |
| GET | `/api/shops/public` | Public | Any | List active shops, optionally filtered by `q`, `category`, and `city` | `200`, `400` |
| GET | `/api/shops/mine` | JWT | Owner | Get the signed-in owner's shop and status | `200`, `401`, `403`, `404` |
| GET | `/api/admin/shops` | JWT | Admin | List shops and masked owner phones. Optional `status` filter. | `200`, `400`, `401`, `403` |
| PATCH | `/api/admin/shops/:id/status` | JWT | Admin | Set `Active`, `Rejected`, or `Suspended`. `Rejected` requires `reason`. | `200`, `400`, `401`, `403`, `404` |

### Module 2 — Digital Khata

| Method | Path | Auth | Role | Purpose | Status codes |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/khata/customers` | JWT | Owner | List customers with computed balances, last activity, and masked phones. `view=summary` returns dashboard totals. | `200`, `400`, `401`, `403`, `404` |
| POST | `/api/khata/customers` | JWT | Owner | Create a customer with `{name,phone}` | `201`, `400`, `401`, `403`, `404` |
| GET | `/api/khata/customers/:id/entries` | JWT | Owner | Get the customer's ledger with running balances | `200`, `401`, `403`, `404` |
| POST | `/api/khata/entries` | JWT | Owner | Append a credit or payment with `{customerId,type,amount,note}` | `201`, `400`, `401`, `403`, `404` |
| GET | `/api/khata/customers/:id/phone` | JWT | Owner | Reveal the private phone number and record `PHONE_UNMASKED` | `200`, `401`, `403`, `404` |

## Regression tests

`npm test` checks the real Express server on ephemeral loopback ports against a freshly seeded temporary SQLite database. Coverage includes JWT rejection, role and shop isolation, validation, balance calculations, append-only tables, registration and approval, generic errors, static serving, and account lockout.

| Command | Passed | Failed |
| --- | ---: | ---: |
| `npm test` (Windows, Node.js 25.8.0, built-in SQLite) | 19 | 0 |

## Six curl examples

Use a POSIX shell such as Git Bash on Windows. Copy the `token` from the login response into `OWNER_TOKEN`. Repeat sign-in with the demo admin account and use its token for `ADMIN_TOKEN`. `SHOP_ID` is a pending shop's numeric ID from the admin queue.

```bash
# 1. Sign in as the demo owner.
curl -sS http://localhost:3000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"shopowner@dukaansaathi.pk","password":"Shop@12345"}'

# 2. Read the authenticated owner's identity (200).
curl -si http://localhost:3000/api/auth/me -H "Authorization: Bearer $OWNER_TOKEN"

# 3. Call without a token (401).
curl -si http://localhost:3000/api/auth/me

# 4. Call with an altered token (401).
curl -si http://localhost:3000/api/auth/me -H "Authorization: Bearer ${OWNER_TOKEN}x"

# 5. Try to approve a shop as the owner (403).
curl -si -X PATCH "http://localhost:3000/api/admin/shops/$SHOP_ID/status" \
  -H "Authorization: Bearer $OWNER_TOKEN" -H 'Content-Type: application/json' -d '{"status":"Active"}'

# 6. Approve the same shop as an admin (200).
curl -si -X PATCH "http://localhost:3000/api/admin/shops/$SHOP_ID/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' -d '{"status":"Active"}'
```

## Security controls and limitations

- bcrypt cost 12 protects stored passwords. Passwords are capped at 72 UTF-8 bytes to avoid bcrypt truncation. Login is limited to 10 requests per minute per IP, with a five-minute account lock after five consecutive failed attempts. Registration is limited to five requests per hour per IP.
- JWT verification pins HS256 and the `dukaan-saathi` issuer, enforces a 30-minute expiry, and reloads the account status. Express enforces roles and scopes khata queries to the authenticated owner's shop.
- SQL parameters are bound. Server-side validation limits requests to 10 KB, rejects unknown fields, and reports generic errors. Helmet supplies CSP and the static whitelist serves only root HTML and files under `css/`, `js/`, and `assets/`.
- SQLite triggers protect khata and audit rows from updates and deletes. Audit hashes link SHA-256 over the previous hash, timestamp, actor, action, target, and detail. Phone numbers remain masked until an authorized reveal.
- JWTs in `sessionStorage` are exposed if an XSS flaw runs on this origin. Tokens have no refresh or per-token revocation. Logout clears the browser session, and account status changes block access server-side. This release uses password-based sign-in.
- SQLite uses a single database file. Orders, inventory, reports, plans, disputes, and the browser audit demo retain demo data. The Vercel static deployment does not run the Express backend.
