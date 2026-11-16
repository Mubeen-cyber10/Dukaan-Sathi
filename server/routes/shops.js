const express = require('express');
const bcrypt = require('bcryptjs');
const { rateLimit } = require('express-rate-limit');
const { requireAuth, requireRole } = require('../middleware/auth');
const { HttpError, notFound, rateLimitResponse } = require('../http');
const { appendAudit } = require('../audit');
const v = require('../validate');

const changeableStatuses = ['Active', 'Rejected', 'Suspended'];

function shopRoutes() {
  const router = express.Router();
  const registerLimit = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: rateLimitResponse
  });

  router.post('/register', registerLimit, async (req, res) => {
    const data = v.validate(req.body, {
      ownerName: v.text(3, 50),
      email: v.email,
      mobile: v.phone,
      shopName: v.text(3, 60),
      category: v.text(1, 60),
      city: v.text(1, 60),
      address: v.text(5, 120),
      description: v.optional(v.text(0, 250)),
      password: v.password
    });
    const db = req.app.locals.db;
    const hash = await bcrypt.hash(data.password, 12);
    const shopId = db.transaction(() => {
      const existingUser = db.prepare('SELECT 1 FROM users WHERE email = ?').get(data.email);
      const existingShop = db.prepare('SELECT 1 FROM shops WHERE name = ? AND city = ?').get(data.shopName, data.city);
      if (existingUser || existingShop) {
        throw new HttpError(409, 'REGISTRATION_CONFLICT', 'A shop application already exists for the information provided.');
      }
      const { lastInsertRowid: ownerId } = db.prepare(
        "INSERT INTO users (name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, 'owner', 'Pending')"
      ).run(data.ownerName, data.email, data.mobile, hash);
      const { lastInsertRowid: id } = db.prepare(
        "INSERT INTO shops (owner_id, name, category, city, address, description, status) VALUES (?, ?, ?, ?, ?, ?, 'Pending')"
      ).run(ownerId, data.shopName, data.category, data.city, data.address, data.description);
      appendAudit(db, { actor: { id: ownerId, role: 'owner' }, action: 'SHOP_REGISTERED', target: 'shop:' + id });
      return id;
    }).immediate();

    res.status(201).json({ shopId, status: 'Pending' });
  });

  router.get('/public', (req, res) => {
    const { q, category, city } = v.validate(req.query, {
      q: v.optional(v.text(0, 120)),
      category: v.optional(v.text(0, 60)),
      city: v.optional(v.text(0, 60))
    });
    const shops = req.app.locals.db.prepare(
      `
      SELECT id, name, category, city, address, description, public_phone FROM shops WHERE status = 'Active'
      AND (? = '' OR category = ? COLLATE NOCASE) AND (? = '' OR city = ? COLLATE NOCASE)
      AND (? = '' OR instr(lower(name || ' ' || city || ' ' || category || ' ' || address || ' ' || description), lower(?)) > 0)
      ORDER BY id DESC
    `
    ).all(category, category, city, city, q, q);
    res.json(shops.map(shop => ({ ...shop, public_phone: shop.public_phone ? v.maskPhone(shop.public_phone) : null })));
  });

  router.get('/mine', requireAuth, requireRole('owner'), (req, res) => {
    const shop = req.app.locals.db.prepare(
      'SELECT id, name, category, city, address, description, status, reject_reason, created_at FROM shops WHERE id = ? AND owner_id = ?'
    ).get(req.user.shopId, req.user.id);
    if (!shop) throw notFound();
    res.json(shop);
  });

  return router;
}

function adminShopRoutes() {
  const router = express.Router();
  const adminOnly = [requireAuth, requireRole('admin')];

  router.get('/', adminOnly, (req, res) => {
    const { status } = v.validate(req.query, { status: v.optional(v.oneOf('Pending', ...changeableStatuses)) });
    const shops = req.app.locals.db.prepare(
      `
      SELECT shops.id, shops.name, shops.category, shops.city, shops.address, shops.description, shops.status,
             shops.reject_reason, shops.created_at, users.name AS owner_name, users.phone AS owner_phone
      FROM shops JOIN users ON users.id = shops.owner_id WHERE (? = '' OR shops.status = ?) ORDER BY shops.id DESC
    `
    ).all(status, status);
    res.json(shops.map(shop => ({ ...shop, owner_phone: v.maskPhone(shop.owner_phone) })));
  });

  router.patch('/:id/status', adminOnly, (req, res) => {
    const shopId = v.id(req.params.id);
    const { status, reason } = v.validate(req.body, {
      status: v.oneOf(...changeableStatuses),
      reason: req.body?.status === 'Rejected' ? v.text(1, 250) : v.optional(v.text(0, 250))
    });
    const db = req.app.locals.db;
    db.transaction(() => {
      const shop = db.prepare('SELECT owner_id FROM shops WHERE id = ?').get(shopId);
      if (!shop) throw notFound();
      db.prepare('UPDATE shops SET status = ?, reject_reason = ? WHERE id = ?').run(
        status, status === 'Rejected' ? reason : null, shopId
      );
      db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, shop.owner_id);
      appendAudit(db, {
        actor: req.user, action: 'SHOP_STATUS_CHANGED', target: 'shop:' + shopId,
        detail: JSON.stringify({ status, ...(reason && { reason }) })
      });
    }).immediate();
    res.json({ shopId, status });
  });

  return router;
}

module.exports = { shopRoutes, adminShopRoutes };
