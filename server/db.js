const fs = require('node:fs');
const path = require('node:path');

const defaultPath = path.join(__dirname, '..', 'db', 'dukaan.db');

function databasePath() {
  return path.resolve(process.env.DB_PATH || defaultPath);
}

function openDb(filename = databasePath(), { fileMustExist = true } = {}) {
  if (fileMustExist && filename !== ':memory:') fs.accessSync(filename);
  let db;
  try {
    const Database = require('better-sqlite3');
    db = new Database(filename, { fileMustExist });
  } catch (error) {
    if (!['MODULE_NOT_FOUND', 'ERR_DLOPEN_FAILED'].includes(error.code) &&
        !error.message.startsWith('Could not locate the bindings file')) throw error;
    db = openBuiltinDb(filename);
  }
  db.exec('PRAGMA foreign_keys = ON; PRAGMA recursive_triggers = ON; PRAGMA busy_timeout = 5000;');
  return db;
}

function openBuiltinDb(filename) {
  let sqlite;
  try {
    sqlite = require('node:sqlite');
  } catch (error) {
    if (error.code !== 'ERR_UNKNOWN_BUILTIN_MODULE') throw error;
    throw new Error('SQLite driver unavailable. Use Node.js 22.13+ or install better-sqlite3 for this version of Node.js.');
  }
  const db = new sqlite.DatabaseSync(filename);
  let transactionDepth = 0;
  db.transaction = fn => {
    function run(...args) {
      const nested = transactionDepth > 0;
      db.exec(nested ? 'SAVEPOINT app_transaction' : 'BEGIN IMMEDIATE');
      transactionDepth++;
      try {
        const result = fn(...args);
        db.exec(nested ? 'RELEASE app_transaction' : 'COMMIT');
        return result;
      } catch (error) {
        db.exec(nested ? 'ROLLBACK TO app_transaction; RELEASE app_transaction' : 'ROLLBACK');
        throw error;
      } finally {
        transactionDepth--;
      }
    }
    run.immediate = run;
    return run;
  };
  db.backup = destination => sqlite.backup
    ? sqlite.backup(db, destination)
    : db.prepare('VACUUM INTO ?').run(destination);
  return db;
}

module.exports = { databasePath, openDb };
