const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { once } = require('node:events');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const { setupDb } = require('../db/setup');
const { openDb } = require('../server/db');
const { createApp } = require('../server/app');

const root = path.join(__dirname, '..');
const output = path.join(root, 'evidence');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'dukaan-evidence-'));
const databaseFile = path.join(temporary, 'dukaan.db');
const originalPath = process.env.DB_PATH;
const secret = randomBytes(48).toString('hex');
const records = [];
const access = [];
let db;
let server;

function redact(value, key = '') {
  if (/password|authorization/i.test(key)) return '[redacted]';
  if (/token/i.test(key)) return typeof value === 'string' ? value.slice(0, 20) + '...' : '[redacted]';
  if (Array.isArray(value)) return value.map(item => redact(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, redact(item, name)]));
  }
  return value;
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

async function main() {
  process.env.DB_PATH = databaseFile;
  setupDb(databaseFile);
  db = openDb(databaseFile);
  const app = createApp({ jwtSecret: secret, db });
  // The server wrapper records request metadata only. It never reads headers or bodies.
  server = http.createServer((req, res) => {
    const start = process.hrtime.bigint();
    const pathname = new URL(req.url, 'http://localhost').pathname;
    res.once('finish', () => access.push(`${req.method} ${pathname} ${res.statusCode} ${Number(process.hrtime.bigint() - start) / 1e6 | 0}ms`));
    app(req, res);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;

  async function call(label, endpoint, { method = 'GET', token, body, expected } = {}) {
    const headers = { Accept: 'application/json' };
    if (token !== undefined) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch(base + endpoint, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body)
    });
    const raw = await response.text();
    const result = response.headers.get('content-type')?.includes('application/json') ? JSON.parse(raw) : raw;
    if (expected !== undefined) assert.equal(response.status, expected, label);
    records.push({ label, request: redact({ method, path: endpoint, headers, body }), response: { status: response.status, body: redact(result) } });
    return result;
  }

  try {
    await call('Frontend login page', '/login.html', { expected: 200 });
    const owner = await call('Owner login', '/api/auth/login', { method: 'POST', body: {
      email: 'shopowner@dukaansaathi.pk', password: 'Shop@12345'
    }, expected: 200 });
    const admin = await call('Admin login', '/api/auth/login', { method: 'POST', body: {
      email: 'admin@dukaansaathi.pk', password: 'Admin@12345'
    }, expected: 200 });
    const bilal = await call('Second owner login', '/api/auth/login', { method: 'POST', body: {
      email: 'bilal@dukaansaathi.pk', password: 'Bilal@12345'
    }, expected: 200 });
    await call('Valid owner token', '/api/auth/me', { token: owner.token, expected: 200 });
    await call('Missing token', '/api/auth/me', { expected: 401 });
    await call('Tampered token', '/api/auth/me', { token: owner.token + 'x', expected: 401 });
    const segments = owner.token.split('.');
    await call('Unsigned alg=none token', '/api/auth/me', { token: [encode({ alg: 'none', typ: 'JWT' }), segments[1], ''].join('.'), expected: 401 });
    const expired = jwt.sign({ role: owner.user.role, shopId: owner.user.shopId }, secret, {
      algorithm: 'HS256', issuer: 'dukaan-saathi', subject: String(owner.user.id), expiresIn: -60
    });
    await call('Expired token', '/api/auth/me', { token: expired, expected: 401 });
    await call('Owner cannot approve shop', `/api/admin/shops/${owner.user.shopId}/status`, {
      method: 'PATCH', token: owner.token, body: { status: 'Active' }, expected: 403
    });
    await call('Admin cannot view khata', '/api/khata/customers', { token: admin.token, expected: 403 });
    const bilalCustomers = await call('Second owner customers', '/api/khata/customers', { token: bilal.token, expected: 200 });
    await call('Owner cannot see another ledger', `/api/khata/customers/${bilalCustomers[0].id}/entries`, { token: owner.token, expected: 404 });
    await call('Invalid entry', '/api/khata/entries', { method: 'POST', token: owner.token, body: {
      customerId: 1, type: 'credit', amount: -5, note: ''
    }, expected: 400 });
    await call('SQL injection login', '/api/auth/login', { method: 'POST', body: {
      email: "' OR 1=1 --", password: 'anything'
    }, expected: 401 });
    await call('Frontend owner dashboard', '/app-dashboard.html', { expected: 200 });
    await call('Frontend khata page', '/app-khata.html', { expected: 200 });
    const customers = await call('Owner customers', '/api/khata/customers', { token: owner.token, expected: 200 });
    const customerId = customers[0].id;
    await call('Add khata entry', '/api/khata/entries', { method: 'POST', token: owner.token, body: {
      customerId, type: 'credit', amount: 125, note: 'Evidence purchase'
    }, expected: 201 });
    await call('Retrieve stored entry', `/api/khata/customers/${customerId}/entries`, { token: owner.token, expected: 200 });
    await call('Frontend registration page', '/register-shop.html', { expected: 200 });
    const newShop = await call('Register pending shop', '/api/shops/register', { method: 'POST', body: {
      ownerName: 'Evidence Owner', email: 'evidence@example.test', mobile: '03001234567',
      shopName: 'Evidence Bazaar', category: 'General Store', city: 'Multan',
      address: '12 Main Bazaar', description: 'Submission evidence', password: 'Evidence@12345'
    }, expected: 201 });
    await call('Pending shop hidden from public', '/api/shops/public?q=Evidence%20Bazaar', { expected: 200 });
    await call('Frontend admin queue', '/admin-shops.html', { expected: 200 });
    await call('Admin queue API', '/api/admin/shops?status=Pending', { token: admin.token, expected: 200 });
    await call('Admin approves shop', `/api/admin/shops/${newShop.shopId}/status`, {
      method: 'PATCH', token: admin.token, body: { status: 'Active' }, expected: 200
    });
    await call('Approved shop visible publicly', '/api/shops/public?q=Evidence%20Bazaar', { expected: 200 });
    await call('Frontend public directory', '/browse-shops.html', { expected: 200 });

    const api = records.filter(record => record.request.path.startsWith('/api/'));
    const markdown = ['# API request and response evidence', '',
      'Generated against a freshly seeded temporary database and the real Express server. Passwords and Authorization headers are redacted. JWTs show the first 20 characters only.', ''];
    for (const record of api) {
      markdown.push(`## ${record.label}`, '', '```json', JSON.stringify({ request: record.request, response: record.response }, null, 2), '```', '');
    }
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(path.join(output, 'api-evidence.md'), markdown.join('\n'));
    fs.writeFileSync(path.join(output, 'server-access-log.txt'), access.join('\n') + '\n');
    fs.writeFileSync(path.join(output, 'frontend-backend-evidence.md'), [
      '# Frontend and backend request evidence', '',
      'The real Express server served the existing HTML pages and received the same API calls their JavaScript makes. This trace was generated through HTTP requests, so it does not claim a browser rendering or console check.', '',
      'The sequence loaded login.html, signed in as the owner, loaded the owner dashboard and khata page, fetched customers, added and retrieved an entry, loaded register-shop.html, registered a pending shop, loaded the admin queue, approved the shop, and fetched the public directory.', '',
      'The separate API evidence file contains redacted request and response bodies. The access log records method, path, status, and elapsed milliseconds without credentials or request bodies.', '',
      `Requests recorded: ${access.length}.`, ''
    ].join('\n'));
    console.log(`Wrote ${api.length} API exchanges and ${access.length} access-log lines.`);
  } finally {
    await new Promise(resolve => server.close(resolve));
    db.close();
    if (originalPath === undefined) delete process.env.DB_PATH;
    else process.env.DB_PATH = originalPath;
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
