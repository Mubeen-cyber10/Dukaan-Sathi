# API Endpoints

Protected calls require an HS256 JWT in the Authorization Bearer header. Responses use JSON. Error responses contain an error code and message, with field messages on validation failures.

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
