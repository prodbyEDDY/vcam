// A single durable snapshot and refresh lease shared by all server instances.
export function createDownloadStatsStorage(db, baseline, freshMs) {
  const key = 'windows-installers';
  return {
    async load() {
      await db.prepare('INSERT INTO download_snapshots (id, count, checked_at, retry_after) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO NOTHING')
        .bind(key, baseline.count, baseline.checkedAt, baseline.checkedAt + freshMs).run();
      return db.prepare('SELECT count, checked_at AS checkedAt, retry_after AS retryAfter FROM download_snapshots WHERE id = ?')
        .bind(key).first();
    },
    async claim(now, retryAfter) {
      const row = await db.prepare('UPDATE download_snapshots SET retry_after = ? WHERE id = ? AND retry_after <= ? RETURNING id')
        .bind(retryAfter, key, now).first();
      return Boolean(row);
    },
    async save(snapshot) {
      await db.prepare('UPDATE download_snapshots SET count = ?, checked_at = ?, retry_after = ? WHERE id = ?')
        .bind(snapshot.count, snapshot.checkedAt, snapshot.retryAfter, key).run();
    },
  };
}
