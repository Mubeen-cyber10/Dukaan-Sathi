const fs = require('node:fs');
const { openDb } = require('../server/db');
const tables = ['users', 'shops', 'customers', 'khata_entries', 'audit_log'];
const quote = value => value === null ? 'NULL' : typeof value === 'number' ? String(value) : "'" + String(value).replaceAll("'", "''") + "'";
const db = openDb('db/submission-seed.db');
let output = fs.readFileSync('db/schema.sql', 'utf8') + '\nBEGIN TRANSACTION;\n';
for (const table of tables) {
  for (const row of db.prepare('SELECT * FROM ' + table).all()) {
    const columns = Object.keys(row);
    output += 'INSERT INTO ' + table + ' (' + columns.join(', ') + ') VALUES (' + columns.map(column => quote(row[column])).join(', ') + ');\n';
  }
}
output += 'COMMIT;\n';
fs.writeFileSync('db/dukaan-dump.sql', output);
db.close();
console.log('SQL dump generated from fresh seed database');
