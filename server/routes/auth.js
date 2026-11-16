const express = require('express');
const { rateLimit } = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { appendAudit } = require('../audit');
const { HttpError, rateLimitResponse } = require('../http');
const { requireAuth, findUser, publicUser, issuer } = require('../middleware/auth');
const v = require('../validate');

const LOCK_MS = 5 * 60 * 1000;
// Cost-12 hash used only for constant-work comparisons for unknown accounts.
const dummyHash = '$2b$12$3Egc8M7yiwqKbQLSahT.BuvthvaBij5XgbjEjmKoifMQoyboPSjPy';

function loginPassword(value) {
  if (typeof value !== 'string' || !value || value.length > 64 || Buffer.byteLength(value) > 72) {
    throw new TypeError('Enter your password');
  }
  return value;
}

function authRoutes() {
  const router = express.Router();
  const loginLimit = rateLimit({
    windowMs: 60000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, handler: rateLimitResponse
  });

  router.post('/login', loginLimit, async (req, res) => {
    const invalid = new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    let credentials;
    try {
      credentials = v.validate(req.body, { email: v.email, password: loginPassword });
    } catch (error) {
      if (error.code !== 'VALIDATION_ERROR' || error.fields.body) throw error;
      await bcrypt.compare('invalid', dummyHash);
      throw invalid;
    }
    const { db, jwtSecret } = req.app.locals;
    const account = db.prepare('SELECT id, password_hash FROM users WHERE email = ?').get(credentials.email);
    const matches = await bcrypt.compare(credentials.password, account?.password_hash || dummyHash);
    if (!account) throw invalid;

    const result = db.transaction(() => {
      const state = db.prepare('SELECT password_hash, failed_attempts, locked_until FROM users WHERE id = ?').get(account.id);
      if (!state || account.password_hash !== state.password_hash) return { invalid: true };
      const now = Date.now();
      const lockedUntil = Date.parse(state.locked_until);
      if (lockedUntil > now) return { retry: Math.ceil((lockedUntil - now) / 1000) };

      const user = findUser(db, account.id);
      if (!matches) {
        const attempts = (state.locked_until ? 0 : state.failed_attempts) + 1;
        const lock = attempts >= 5 ? new Date(now + LOCK_MS).toISOString() : null;
        db.prepare('UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?').run(attempts, lock, user.id);
        if (lock) {
          appendAudit(db, { actor: user, action: 'AUTH_LOCKOUT', target: 'user:' + user.id });
          return { retry: LOCK_MS / 1000 };
        }
        return { invalid: true };
      }

      db.prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);
      if (user.status !== 'Active') return { inactive: true };

      const identity = publicUser(user);
      const token = jwt.sign({ role: identity.role, shopId: identity.shopId }, jwtSecret, {
        algorithm: 'HS256', issuer, subject: String(identity.id), expiresIn: '30m'
      });
      appendAudit(db, { actor: identity, action: 'AUTH_LOGIN_SUCCESS', target: 'user:' + identity.id });
      return { token, user: identity };
    }).immediate();

    if (result.retry) {
      res.set('Retry-After', String(result.retry));
      return rateLimitResponse(req, res);
    }
    if (result.invalid) throw invalid;
    if (result.inactive) throw new HttpError(403, 'ACCOUNT_INACTIVE', 'Your shop account is not active yet');
    res.json(result);
  });

  router.get('/me', requireAuth, (req, res) => res.json(req.user));
  return router;
}

module.exports = { authRoutes };
