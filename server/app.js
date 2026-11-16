const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const { openDb } = require('./db');
const { HttpError, notFound } = require('./http');
const { authRoutes } = require('./routes/auth');
const { shopRoutes, adminShopRoutes } = require('./routes/shops');
const { khataRoutes } = require('./routes/khata');

const root = path.join(__dirname, '..');
const csp = {
  defaultSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  fontSrc: ['https://fonts.gstatic.com'],
  scriptSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", 'data:'],
  frameAncestors: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  connectSrc: ["'self'"]
};

function createApp({ jwtSecret = process.env.JWT_SECRET, db } = {}) {
  if (typeof jwtSecret !== 'string' || jwtSecret.trim().length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters. Run npm run setup.');
  }
  const app = express();
  app.disable('x-powered-by');
  app.locals.jwtSecret = jwtSecret;
  app.locals.db = db || openDb();
  app.use(helmet({ contentSecurityPolicy: { useDefaults: false, directives: csp }, xFrameOptions: { action: 'deny' } }));
  app.use((req, res, next) => {
    res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  }, express.json({ limit: '10kb' }));
  app.use('/api/auth', authRoutes());
  app.use('/api/shops', shopRoutes());
  app.use('/api/admin/shops', adminShopRoutes());
  app.use('/api/khata', khataRoutes());
  app.use('/api', (req, res, next) => next(notFound()));

  for (const folder of ['css', 'js', 'assets']) {
    app.use('/' + folder, express.static(path.join(root, folder), {
      index: false, redirect: false, dotfiles: 'deny', fallthrough: true
    }));
  }

  app.get(/^\/(?:[a-zA-Z0-9_-]+\.html)?$/, (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(req.path === '/' ? 'index.html' : req.path.slice(1), { root }, error => {
      if (error) next(error);
    });
  });
  app.use((req, res) => res.sendStatus(404));

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof HttpError) {
      const body = { code: error.code, message: error.message };
      if (error.fields) body.fields = error.fields;
      return res.status(error.status).json({ error: body });
    }
    if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') {
      return res.status(400).json({ error: {
        code: 'VALIDATION_ERROR', message: 'Send a valid JSON body up to 10 KB'
      } });
    }
    if (error.status === 404) return res.sendStatus(404);
    console.error('Request failed:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
  });
  return app;
}

if (require.main === module) {
  require('dotenv').config();
  try {
    const port = Number(process.env.PORT || 3000);
    const app = createApp();
    const server = app.listen(port, '127.0.0.1');
    server.once('listening', () => console.log('Dukaan Saathi running at http://localhost:' + port));
    server.once('error', error => {
      app.locals.db.close();
      console.error(error.message);
      process.exitCode = 1;
    });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { createApp };
