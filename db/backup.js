require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { openDb } = require('../server/db');

async function backup() {
  const folder = path.join(__dirname, 'backups');
  fs.mkdirSync(folder, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = path.join(folder, 'dukaan-' + timestamp + '.db');
  const db = openDb();
  try {
    await db.backup(filename);
    console.log('Backup written to ' + filename);
  } finally {
    db.close();
  }
}

backup().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
