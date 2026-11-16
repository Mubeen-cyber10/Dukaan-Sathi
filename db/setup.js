const { randomBytes } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const { databasePath, openDb } = require('../server/db');
const { seed } = require('./seed');

function setupDb(filename = databasePath()) {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const staging = filename + '-' + randomBytes(8).toString('hex');
  try {
    const db = openDb(staging, { fileMustExist: false });
    try {
      db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
      db.transaction(() => seed(db)).immediate();
    } finally {
      db.close();
    }
    fs.renameSync(staging, filename);
  } finally {
    fs.rmSync(staging, { force: true });
  }
}

if (require.main === module) {
  if (process.argv.includes('--env')) {
    try {
      const secret = randomBytes(48).toString('hex');
      fs.writeFileSync('.env', 'JWT_SECRET=' + secret + '\nPORT=3000\n', { flag: 'wx', mode: 0o600 });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }
  dotenv.config();
  setupDb();
  console.log('Database initialized with demo accounts and ledger entries.');
}

module.exports = { setupDb };
