const Database = require('better-sqlite3');
const path = require('node:path');

const defaultPath = path.join(__dirname, '..', 'db', 'dukaan.db');

function databasePath() {
  return path.resolve(process.env.DB_PATH || defaultPath);
}

function openDb(filename = databasePath(), { fileMustExist = true } = {}) {
  const db = new Database(filename, { fileMustExist });
  db.pragma('foreign_keys = ON');
  // REPLACE must also run the append-only DELETE triggers.
  db.pragma('recursive_triggers = ON');
  return db;
}

module.exports = { databasePath, openDb };
