const { createHash } = require('node:crypto');

function appendAudit(db, { actor = null, action, target, detail = '' }) {
  return db.transaction(() => {
    const prevHash = db.prepare('SELECT hash FROM audit_log ORDER BY id DESC LIMIT 1')
      .get()?.hash || '0'.repeat(64);
    const ts = new Date().toISOString();
    const actorId = actor?.id ?? null;
    const actorRole = actor?.role ?? 'system';
    const actorKey = JSON.stringify([actorId, actorRole]);
    const hash = createHash('sha256')
      .update(prevHash + ts + actorKey + action + target + detail)
      .digest('hex');
    db.prepare(`
      INSERT INTO audit_log (ts, actor_id, actor_role, action, target, detail, prev_hash, hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(ts, actorId, actorRole, action, target, detail, prevHash, hash);
    return hash;
  }).immediate();
}

module.exports = { appendAudit };
