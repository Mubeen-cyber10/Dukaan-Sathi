const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { appendAudit } = require('../audit');
const { notFound } = require('../http');
const v = require('../validate');

function findCustomer(db, shopId, customerId) {
  const customer = db.prepare(`
    SELECT id, phone FROM customers WHERE shop_id = ? AND id = ?
  `).get(shopId, customerId);
  if (!customer) throw notFound();
  return customer;
}

function dashboardSummary(db, shopId) {
  return db.prepare(`
    WITH balances AS (
      SELECT c.id, COALESCE(SUM(CASE e.type WHEN 'credit' THEN e.amount ELSE -e.amount END), 0) AS balance
      FROM customers c
      LEFT JOIN khata_entries e ON e.shop_id = c.shop_id AND e.customer_id = c.id
      WHERE c.shop_id = ?
      GROUP BY c.id
    ), today AS (
      SELECT type, amount FROM khata_entries
      WHERE shop_id = ? AND date(created_at, '+5 hours') = date('now', '+5 hours')
    )
    SELECT
      (SELECT COALESCE(SUM(balance), 0) FROM balances WHERE balance > 0) AS totalDue,
      (SELECT COUNT(*) FROM balances) AS customerCount,
      (SELECT COUNT(*) FROM balances WHERE balance > 0) AS customersWithDues,
      COALESCE(SUM(CASE WHEN type = 'payment' THEN amount END), 0) AS paymentsToday,
      COUNT(CASE WHEN type = 'credit' THEN 1 END) AS creditsToday,
      COUNT(CASE WHEN type = 'payment' THEN 1 END) AS paymentsCountToday
    FROM today
  `).get(shopId, shopId);
}

function khataRoutes() {
  const router = express.Router();
  const ownerOnly = [requireAuth, requireRole('owner'), (req, res, next) => {
    if (req.user.shopId === null) return next(notFound());
    next();
  }];

  router.get('/customers', ownerOnly, (req, res) => {
    const { view } = v.validate(req.query, { view: v.optional(v.oneOf('summary'), null) });
    const { db } = req.app.locals;
    const { shopId } = req.user;
    if (view === 'summary') return res.json(dashboardSummary(db, shopId));

    const rows = db.prepare(`
      SELECT c.id, c.name, c.phone, c.created_at AS createdAt,
        COALESCE(SUM(CASE e.type WHEN 'credit' THEN e.amount ELSE -e.amount END), 0) AS balance,
        MAX(e.created_at) AS lastActivity
      FROM customers c
      LEFT JOIN khata_entries e ON e.shop_id = c.shop_id AND e.customer_id = c.id
      WHERE c.shop_id = ?
      GROUP BY c.id
      ORDER BY c.id
    `).all(shopId);
    res.json(rows.map(row => ({ ...row, phone: v.maskPhone(row.phone) })));
  });

  router.post('/customers', ownerOnly, (req, res) => {
    const { name, phone } = v.validate(req.body, { name: v.text(2, 50), phone: v.phone });
    const { db } = req.app.locals;
    const { shopId } = req.user;
    const customer = db.transaction(() => {
      const row = db.prepare(`
        INSERT INTO customers (shop_id, name, phone) VALUES (?, ?, ?)
        RETURNING id, name, phone, created_at AS createdAt
      `).get(shopId, name, phone);
      appendAudit(db, { actor: req.user, action: 'CUSTOMER_CREATED', target: 'customer:' + row.id });
      return { ...row, phone: v.maskPhone(row.phone), balance: 0, lastActivity: null };
    }).immediate();
    res.status(201).json(customer);
  });

  router.get('/customers/:id/entries', ownerOnly, (req, res) => {
    const customerId = v.id(req.params.id);
    const { db } = req.app.locals;
    const { shopId } = req.user;
    findCustomer(db, shopId, customerId);
    const entries = db.prepare(`
      SELECT id, customer_id AS customerId, type, amount, note, created_at AS createdAt,
        SUM(CASE type WHEN 'credit' THEN amount ELSE -amount END)
          OVER (ORDER BY id ROWS UNBOUNDED PRECEDING) AS runningBalance
      FROM khata_entries
      WHERE shop_id = ? AND customer_id = ?
      ORDER BY id
    `).all(shopId, customerId);
    res.json({ entries, balance: entries.at(-1)?.runningBalance ?? 0 });
  });

  router.post('/entries', ownerOnly, (req, res) => {
    const { customerId, type, amount, note } = v.validate(req.body, {
      customerId: v.integer(1, Number.MAX_SAFE_INTEGER),
      type: v.oneOf('credit', 'payment'),
      amount: v.integer(1, 500000),
      note: v.optional(v.text(0, 120))
    });
    const { db } = req.app.locals;
    const { shopId, id: userId } = req.user;
    const result = db.transaction(() => {
      findCustomer(db, shopId, customerId);
      const entry = db.prepare(`
        INSERT INTO khata_entries (shop_id, customer_id, type, amount, note, recorded_by)
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING id, customer_id AS customerId, type, amount, note, created_at AS createdAt
      `).get(shopId, customerId, type, amount, note, userId);
      const { balance } = db.prepare(`
        SELECT SUM(CASE type WHEN 'credit' THEN amount ELSE -amount END) AS balance
        FROM khata_entries WHERE shop_id = ? AND customer_id = ?
      `).get(shopId, customerId);
      appendAudit(db, {
        actor: req.user, action: 'KHATA_ENTRY_CREATED', target: 'entry:' + entry.id, detail: type + ':' + amount
      });
      return { entry: { ...entry, runningBalance: balance }, balance };
    }).immediate();
    res.status(201).json(result);
  });

  router.get('/customers/:id/phone', ownerOnly, (req, res) => {
    const customerId = v.id(req.params.id);
    const { db } = req.app.locals;
    const customer = findCustomer(db, req.user.shopId, customerId);
    appendAudit(db, { actor: req.user, action: 'PHONE_UNMASKED', target: 'customer:' + customerId });
    res.json({ phone: customer.phone });
  });

  return router;
}

module.exports = { khataRoutes };
