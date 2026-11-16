const fs = require('node:fs');
const path = require('node:path');
const { ZipArchive } = require('archiver');
const { memberModule, index, demoScript } = require('./submission-content');

const root = path.join(__dirname, '..');
const output = path.join(root, 'submission');
const people = [
  ['mubeen', 'Muhammad_Mubeen_23F-3055_Activity6'],
  ['ahmad', 'Ahmad_Abdullah_23F-3027_Activity6']
];
const rootFiles = fs.readdirSync(root).filter(name => name.endsWith('.html'));
const files = [
  ...rootFiles, '.env.example', '.gitignore', 'vercel.json',
  'package.json', 'package-lock.json', 'README.md'
];
const directories = ['css', 'js', 'server', 'tests', 'scripts', 'docs', 'evidence'];
const dbFiles = ['schema.sql', 'seed.js', 'setup.js', 'backup.js', 'dukaan-dump.sql'];
const backup = path.join(root, 'db', 'backups', 'dukaan-backup-' + new Date().toISOString().slice(0, 10) + '.db');

async function packageOne(key, name) {
  const destination = path.join(output, name + '.zip');
  const stream = fs.createWriteStream(destination);
  const archive = new ZipArchive({ zlib: { level: 9 } });
  let count = 0;
  archive.on('entry', () => count++);
  archive.on('warning', error => { throw error; });
  archive.on('error', error => { throw error; });
  archive.pipe(stream);
  for (const file of files) archive.file(path.join(root, file), { name: name + '/' + file });
  for (const directory of directories) {
    archive.directory(path.join(root, directory), name + '/' + directory);
  }
  for (const file of dbFiles) archive.file(path.join(root, 'db', file), { name: name + '/db/' + file });
  archive.file(backup, { name: name + '/db/backups/' + path.basename(backup) });
  archive.append(index, { name: name + '/SUBMISSION_INDEX.md' });
  archive.append(demoScript, { name: name + '/DEMO_SCRIPT.md' });
  archive.append(memberModule(key), { name: name + '/MY_MODULE/README.md' });
  await archive.finalize();
  await new Promise((resolve, reject) => {
    stream.once('finish', resolve);
    stream.once('error', reject);
  });
  console.log(destination + ' | files=' + count + ' | bytes=' + fs.statSync(destination).size);
}

async function main() {
  fs.mkdirSync(output, { recursive: true });
  if (!fs.existsSync(backup)) throw new Error('Missing fresh seed backup: ' + backup);
  for (const [key, name] of people) await packageOne(key, name);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
