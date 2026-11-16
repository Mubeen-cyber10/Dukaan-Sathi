const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const files = fs.readdirSync('submission').filter(name => name.endsWith('.zip'));
for (const file of files) {
  const full = path.resolve('submission', file);
  const entries = execFileSync('tar', ['-tf', full], { encoding: 'utf8' }).trim().split(/\r?\n/);
  const top = file.slice(0, -4) + '/';
  const required = ['server/app.js', 'db/schema.sql', 'db/seed.js', 'db/dukaan-dump.sql',
    'docs/API_ENDPOINTS.md', 'evidence/api-evidence.md', 'evidence/tests-output.txt',
    'MY_MODULE/README.md', 'SUBMISSION_INDEX.md', 'DEMO_SCRIPT.md'];
  for (const name of required) if (!entries.includes(top + name)) throw new Error(file + ' missing ' + name);
  if (!entries.some(name => name.startsWith(top + 'db/backups/dukaan-backup-') && name.endsWith('.db'))) throw new Error(file + ' missing backup');
  for (const entry of entries) {
    if (!entry.startsWith(top)) throw new Error(file + ' has another root');
    const relative = entry.slice(top.length);
    if (relative === '.env' || relative.startsWith('.git/') || relative.startsWith('node_modules/') ||
        relative.startsWith('submission/') || relative === 'db/dukaan.db' || relative === 'db/submission-seed.db') throw new Error(file + ' includes ' + relative);
  }
  console.log(file + ': ' + entries.length + ' entries, ' + fs.statSync(full).size + ' bytes, required paths present, exclusions verified');
}
