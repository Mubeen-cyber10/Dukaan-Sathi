const jwt = require('jsonwebtoken');
const { HttpError } = require('../http');
const { appendAudit } = require('../audit');

const issuer = 'dukaan-saathi';

function findUser(db, id) {
  return db.prepare(`
    SELECT users.id, users.name, users.role, users.status, shops.id AS shopId
    FROM users LEFT JOIN shops ON shops.owner_id = users.id WHERE users.id = ?
  `).get(id);
}

function publicUser({ id, name, role, shopId }) {
  return { id, name, role, shopId };
}

function requireAuth(req, res, next) {
  const unauthorized = () => next(new HttpError(401, 'UNAUTHORIZED', 'Authentication required'));
  const token = /^Bearer ([\w.-]+)$/i.exec(req.get('Authorization') || '')?.[1];
  if (!token) return unauthorized();
  let claims;
  try {
    claims = jwt.verify(token, req.app.locals.jwtSecret, { algorithms: ['HS256'], issuer });
  } catch {
    return unauthorized();
  }
  const userId = Number(claims.sub);
  if (!Number.isSafeInteger(userId) || userId < 1 || typeof claims.exp !== 'number') return unauthorized();
  const user = findUser(req.app.locals.db, userId);
  if (!user || user.status !== 'Active' || claims.role !== user.role || claims.shopId !== user.shopId) return unauthorized();
  req.user = publicUser(user);
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (roles.includes(req.user.role)) return next();
    appendAudit(req.app.locals.db, {
      actor: req.user,
      action: 'DENIED',
      target: req.method + ' ' + req.baseUrl,
      detail: roles.join(',')
    });
    next(new HttpError(403, 'FORBIDDEN', 'Access denied'));
  };
}

module.exports = { requireAuth, requireRole, findUser, publicUser, issuer };
