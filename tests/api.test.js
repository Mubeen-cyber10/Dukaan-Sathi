const assert = require('node:assert/strict');
const { randomBytes, createHash } = require('node:crypto');
const { once } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test, before, after } = require('node:test');
const jwt = require('jsonwebtoken');
const { createApp } = require('../server/app');
const { openDb } = require('../server/db');
const { setupDb } = require('../db/setup');

const ownerCredentials = { email: 'shopowner@dukaansaathi.pk', password: 'Shop@12345' };
const adminCredentials = { email: 'admin@dukaansaathi.pk', password: 'Admin@12345' };
const bilalCredentials = { email: 'bilal@dukaansaathi.pk', password: 'Bilal@12345' };
const invalidCredentials = { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } };
const unauthorized = { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } };
const forbidden = { error: { code: 'FORBIDDEN', message: 'Access denied' } };
const jwtSecret = randomBytes(48).toString('hex');
const originalDbPath = process.env.DB_PATH;
const servers = [];
let tempDir;
let db;
let baseUrl;
let ownerLogin;
let adminLogin;

async function startServer(database = db) {
  const server = createApp({ jwtSecret, db: database }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  servers.push(server);
  return 'http://127.0.0.1:' + server.address().port;
}

async function request(url, { token, method = 'GET', body, base = baseUrl } = {}) {
  const headers = { Accept: 'application/json' };
  if (token !== undefined) headers.Authorization = 'Bearer ' + token;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(base + url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  const data = response.headers.get('content-type')?.includes('application/json') ? JSON.parse(text) : null;
  return { status: response.status, headers: response.headers, data, text };
}

function login(body, base) {
  return request('/api/auth/login', { method: 'POST', body, base });
}

function encodeSegment(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function assertAuthenticationRequired(response) {
  assert.equal(response.status, 401);
  assert.deepEqual(response.data, unauthorized);
}

function assertInvalid(response, field) {
  assert.equal(response.status, 400);
  assert.equal(response.data.error.code, 'VALIDATION_ERROR');
  assert.equal(typeof response.data.error.fields?.[field], 'string');
  assert.doesNotMatch(response.text, /stack|sqlite|select .* from|node_modules/i);
}

before(async () => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dukaan-api-'));
  process.env.DB_PATH = path.join(tempDir, 'dukaan.db');
  setupDb();
  db = openDb();
  baseUrl = await startServer();
  ownerLogin = await login(ownerCredentials);
  adminLogin = await login(adminCredentials);
});

after(async () => {
  try {
    await Promise.all(servers.map(server => new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
      server.closeIdleConnections?.();
    })));
  } finally {
    db?.close();
    if (originalDbPath === undefined) delete process.env.DB_PATH;
    else process.env.DB_PATH = originalDbPath;
    if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('01 Owner and admin login issue 30-minute HS256 JWTs', () => {
  for (const [result, role, name] of [[ownerLogin, 'owner', 'Hamza Ali'], [adminLogin, 'admin', 'Sara Khan']]) {
    assert.equal(result.status, 200);
    const { token, user } = result.data;
    assert.deepEqual(Object.keys(user).sort(), ['id', 'name', 'role', 'shopId']);
    assert.equal(user.name, name);
    assert.equal(user.role, role);
    assert.ok(Number.isSafeInteger(user.id));
    if (role === 'owner') assert.ok(Number.isSafeInteger(user.shopId));
    else assert.equal(user.shopId, null);
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'], issuer: 'dukaan-saathi' });
    assert.equal(decoded.sub, String(user.id));
    assert.equal(decoded.role, role);
    assert.equal(decoded.shopId, user.shopId);
    assert.equal(decoded.exp - decoded.iat, 30 * 60);
  }
});

test('02 Wrong password returns generic invalid credentials', async () => {
  const result = await login({ ...ownerCredentials, password: 'Wrong@12345' });
  assert.equal(result.status, 401);
  assert.deepEqual(result.data, invalidCredentials);
});

test('03 SQL injection regression fixtures cannot sign in or expose shop data', async () => {
  const input = "' OR 1=1 --";
  const attempt = await login({ ...adminCredentials, email: input });
  assert.equal(attempt.status, 401);
  assert.deepEqual(attempt.data, invalidCredentials);

  const publicShops = await request('/api/shops/public');
  assert.equal(publicShops.status, 200);
  assert.ok(publicShops.data.length > 0);
  const search = await request('/api/shops/public?q=' + encodeURIComponent(input));
  assert.equal(search.status, 200);
  assert.deepEqual(search.data, []);
});

test('04 A valid token can load the current user', async () => {
  const result = await request('/api/auth/me', { token: ownerLogin.data.token });
  assert.equal(result.status, 200);
  assert.deepEqual(result.data, ownerLogin.data.user);
});

test('05 Protected API requires a token', async () => {
  assertAuthenticationRequired(await request('/api/auth/me'));
});

test('06 A garbage token receives the generic authentication error', async () => {
  assertAuthenticationRequired(await request('/api/auth/me', { token: 'garbage' }));
});

test('07 Editing a token payload invalidates its signature', async () => {
  const token = ownerLogin.data.token;
  const [header, , signature] = token.split('.');
  const payload = encodeSegment({ ...jwt.decode(token), role: 'admin' });
  assertAuthenticationRequired(await request('/api/auth/me', { token: [header, payload, signature].join('.') }));
});

test('08 An unsigned alg=none token is rejected', async () => {
  const token = ownerLogin.data.token;
  const unsigned = [encodeSegment({ alg: 'none', typ: 'JWT' }), token.split('.')[1], ''].join('.');
  assertAuthenticationRequired(await request('/api/auth/me', { token: unsigned }));
});

test('09 An expired HS256 token is rejected', async () => {
  const { id, role, shopId } = ownerLogin.data.user;
  const expired = jwt.sign({ role, shopId }, jwtSecret, {
    subject: String(id), algorithm: 'HS256', issuer: 'dukaan-saathi', expiresIn: -60
  });
  assertAuthenticationRequired(await request('/api/auth/me', { token: expired }));
});

test('10 An owner cannot change an admin shop status', async () => {
  const { user, token } = ownerLogin.data;
  const result = await request('/api/admin/shops/' + user.shopId + '/status', {
    method: 'PATCH', token, body: { status: 'Suspended' }
  });
  assert.equal(result.status, 403);
  assert.deepEqual(result.data, forbidden);
  assert.equal(db.prepare('SELECT status FROM shops WHERE id = ?').get(user.shopId).status, 'Active');
  assert.ok(db.prepare('SELECT id FROM audit_log WHERE action = ? AND actor_id = ?').get('DENIED', user.id));
});

test('11 Khata routes deny the admin role', async () => {
  const token = adminLogin.data.token;
  const cases = [
    ['/api/khata/customers'],
    ['/api/khata/customers', { method: 'POST', body: { name: 'Blocked Customer', phone: '03001234567' } }],
    ['/api/khata/customers/1/entries'],
    ['/api/khata/customers/1/phone'],
    ['/api/khata/entries', { method: 'POST', body: { customerId: 1, type: 'credit', amount: 100 } }]
  ];
  for (const [url, options] of cases) {
    const result = await request(url, { ...options, token });
    assert.equal(result.status, 403, url);
    assert.deepEqual(result.data, forbidden);
  }
});

test('12 Khata enforces tenant isolation on listings, ledgers, reveals and writes', async () => {
  const bilal = await login(bilalCredentials);
  assert.equal(bilal.status, 200);
  assert.notEqual(bilal.data.user.shopId, ownerLogin.data.user.shopId);
  const bilalCustomers = await request('/api/khata/customers', { token: bilal.data.token });
  assert.equal(bilalCustomers.status, 200);
  assert.equal(bilalCustomers.data.length, 4);

  const { id } = bilalCustomers.data[0];
  const token = ownerLogin.data.token;
  const myCustomers = await request('/api/khata/customers', { token });
  assert.equal(myCustomers.status, 200);
  assert.equal(myCustomers.data.length, 8);
  assert.ok(!myCustomers.data.some(customer => customer.id === id));
  for (const suffix of ['entries', 'phone']) {
    const result = await request('/api/khata/customers/' + id + '/' + suffix, { token });
    assert.equal(result.status, 404);
  }
  const write = await request('/api/khata/entries', {
    token, method: 'POST', body: { customerId: id, type: 'payment', amount: 100, note: '' }
  });
  assert.equal(write.status, 404);
});

test('13 Validation rejects empty names, long notes, invalid amounts and unknown fields', async () => {
  const token = ownerLogin.data.token;
  const customers = await request('/api/khata/customers', { token });
  assert.equal(customers.status, 200);
  const emptyName = await request('/api/khata/customers', {
    token, method: 'POST', body: { name: ' ', phone: '03001234567' }
  });
  assertInvalid(emptyName, 'name');

  const entry = { customerId: customers.data[0].id, type: 'credit', amount: 100, note: '' };
  const cases = [
    ['note', { note: 'x'.repeat(5000) }],
    ['amount', { amount: -5 }],
    ['amount', { amount: 'abc' }],
    ['body', { shopId: 99 }]
  ];
  for (const [field, changes] of cases) {
    const result = await request('/api/khata/entries', { token, method: 'POST', body: { ...entry, ...changes } });
    assertInvalid(result, field);
  }
});

test('14 Credit and payment persist with correct running balances', async () => {
  const { token, user } = ownerLogin.data;
  const added = await request('/api/khata/customers', {
    token, method: 'POST', body: { name: 'Integration Customer', phone: '0300-1234545' }
  });
  assert.equal(added.status, 201);
  const { id } = added.data;
  assert.equal(added.data.balance, 0);
  assert.equal(added.data.phone, '0300-***-**45');

  const entriesToAdd = [
    { type: 'credit', amount: 920, note: 'Groceries', balance: 920 },
    { type: 'payment', amount: 120, note: 'Cash repayment', balance: 800 }
  ];
  const ids = [];
  for (const { balance, ...entry } of entriesToAdd) {
    const result = await request('/api/khata/entries', {
      token, method: 'POST', body: { customerId: id, ...entry }
    });
    assert.equal(result.status, 201);
    assert.equal(result.data.balance, balance);
    ids.push(result.data.entry.id);
  }

  const ledger = await request('/api/khata/customers/' + id + '/entries', { token });
  assert.equal(ledger.status, 200);
  assert.equal(ledger.data.balance, 800);
  assert.equal(ledger.data.entries.length, 2);
  for (const [index, expected] of entriesToAdd.entries()) {
    const stored = ledger.data.entries.find(entry => entry.id === ids[index]);
    assert.equal(stored.amount, expected.amount);
    assert.equal(stored.note, expected.note);
    assert.equal(stored.type, expected.type);
    assert.equal(stored.runningBalance, expected.balance);
  }

  const phone = await request('/api/khata/customers/' + id + '/phone', { token });
  assert.equal(phone.status, 200);
  assert.match(phone.data.phone, /^0300-?1234545$/);
  assert.ok(db.prepare('SELECT id FROM audit_log WHERE action = ? AND actor_id = ?').get('PHONE_UNMASKED', user.id));
});

test('15 SQLite rejects updates and deletes on the append-only tables', () => {
  const { id } = db.prepare('SELECT id FROM khata_entries ORDER BY id LIMIT 1').get();
  assert.throws(() => db.prepare('UPDATE khata_entries SET amount = ? WHERE id = ?').run(42, id), /append-only/);
  assert.throws(() => db.prepare('DELETE FROM khata_entries WHERE id = ?').run(id), /append-only/);
  assert.throws(() => db.prepare('UPDATE audit_log SET detail = ? WHERE id = ?').run('', 1), /append-only/);
  assert.throws(() => db.prepare('DELETE FROM audit_log WHERE id = ?').run(1), /append-only/);

  let prevHash = '0'.repeat(64);
  for (const row of db.prepare('SELECT * FROM audit_log ORDER BY id').all()) {
    assert.equal(row.prev_hash, prevHash);
    const actor = JSON.stringify([row.actor_id, row.actor_role]);
    prevHash = createHash('sha256').update(prevHash + row.ts + actor + row.action + row.target + row.detail).digest('hex');
    assert.equal(row.hash, prevHash);
  }
});

test('16 Registration stays private and blocks login until admin approval', async () => {
  const credentials = { email: 'new-owner@example.test', password: 'NewShop@12345' };
  const body = {
    ...credentials, ownerName: 'Test Owner', mobile: '0300-1234567', shopName: 'Activity Six Test Store',
    category: 'General Store', city: 'Multan', address: '1 Main Bazaar', description: 'Integration fixture'
  };
  const registered = await request('/api/shops/register', { method: 'POST', body });
  assert.equal(registered.status, 201);
  assert.equal(registered.data.status, 'Pending');
  const { shopId } = registered.data;
  const duplicate = await request('/api/shops/register', { method: 'POST', body });
  assert.equal(duplicate.status, 409);

  const searchPath = '/api/shops/public?q=' + encodeURIComponent(body.shopName);
  const pendingSearch = await request(searchPath);
  assert.equal(pendingSearch.status, 200);
  assert.deepEqual(pendingSearch.data, []);
  const pendingLogin = await login(credentials);
  assert.equal(pendingLogin.status, 403);
  assert.equal(pendingLogin.data.error.message, 'Your shop account is not active yet');

  const token = adminLogin.data.token;
  const queue = await request('/api/admin/shops?status=Pending', { token });
  assert.equal(queue.status, 200);
  const queued = queue.data.find(shop => shop.id === shopId);
  assert.equal(queued?.owner_name, body.ownerName);
  assert.equal(queued?.owner_phone, '0300-***-**67');
  assert.ok(!('password_hash' in queued));

  const approve = await request('/api/admin/shops/' + shopId + '/status', {
    token, method: 'PATCH', body: { status: 'Active' }
  });
  assert.equal(approve.status, 200);
  assert.equal(approve.data.status, 'Active');
  const published = await request(searchPath);
  assert.equal(published.status, 200);
  assert.equal(published.data.length, 1);
  assert.equal(published.data[0].id, shopId);
  assert.ok(!('owner_name' in published.data[0]));
  const activeLogin = await login(credentials);
  assert.equal(activeLogin.status, 200);
  assert.equal(activeLogin.data.user.shopId, shopId);
  const mine = await request('/api/shops/mine', { token: activeLogin.data.token });
  assert.equal(mine.status, 200);
  assert.equal(mine.data.status, 'Active');

  const suspend = await request('/api/admin/shops/' + shopId + '/status', {
    token, method: 'PATCH', body: { status: 'Suspended' }
  });
  assert.equal(suspend.status, 200);
  assertAuthenticationRequired(await request('/api/auth/me', { token: activeLogin.data.token }));
});

test('17 A forced database failure returns a generic 500 response', async () => {
  const failedDb = openDb();
  const base = await startServer(failedDb);
  failedDb.close();
  const result = await request('/api/shops/public', { base });
  assert.equal(result.status, 500);
  assert.deepEqual(result.data, { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
});

test('18 Static whitelist returns 404 for configuration and backend files', async () => {
  for (const url of ['/.env', '/server/app.js', '/db/dukaan.db', '/docs/ACTIVITY6.md', '/package.json', '/.git/HEAD']) {
    assert.equal((await request(url)).status, 404, url);
  }
  for (const url of ['/login.html', '/css/styles.css', '/js/api.js']) {
    assert.equal((await request(url)).status, 200, url);
  }
  const unknown = await request('/api/admin/shops/unknown');
  assert.equal(unknown.status, 404);
  assert.deepEqual(unknown.data, { error: { code: 'NOT_FOUND', message: 'Resource not found' } });
});

test('19 Five failed passwords lock the account for five minutes', async () => {
  const base = await startServer();
  const wrongPassword = { ...bilalCredentials, password: 'Wrong@12345' };
  for (let attempt = 1; attempt <= 4; attempt++) {
    const result = await login(wrongPassword, base);
    assert.equal(result.status, 401, 'attempt ' + attempt);
    assert.deepEqual(result.data, invalidCredentials);
  }
  const locked = await login(wrongPassword, base);
  assert.equal(locked.status, 429);
  assert.equal(Number(locked.headers.get('retry-after')), 300);

  const correctButLocked = await login(bilalCredentials, base);
  assert.equal(correctButLocked.status, 429);
  const retry = Number(correctButLocked.headers.get('retry-after'));
  assert.ok(retry > 0 && retry <= 300);
});
