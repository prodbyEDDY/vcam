import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createDownloadStats, FRESH_MS} from '../lib/download-stats.mjs';
import {createDownloadStatsStorage} from '../lib/download-stats-storage.mjs';

const sqlite = new DatabaseSync(':memory:');
sqlite.exec(readFileSync(new URL('../drizzle/0002_brief_thunderbolt.sql', import.meta.url), 'utf8'));
const db = {prepare(sql) {
  const statement = sqlite.prepare(sql);
  return {bind(...args) {
    return {run: async () => statement.run(...args), first: async () => statement.get(...args) ?? null};
  }};
}};
const baseline = {count: 6, checkedAt: 1_000_000};
const storage = createDownloadStatsStorage(db, baseline, FRESH_MS);
let now = baseline.checkedAt, calls = 0, failing = false;
const fetcher = async () => {
  calls++;
  return failing ? new Response('', {status: 403, headers: {'x-ratelimit-remaining': '0'}})
    : Response.json([{assets: [{id: 1, name: 'VCam-Setup-test.exe', download_count: 9}]}]);
};
const server = () => createDownloadStats({now: () => now, fetcher, storage, baseline});
assert.equal((await server()()).count, 6);
assert.equal(calls, 0, 'Verified baseline is not fetched again before tomorrow');
now += FRESH_MS;
await Promise.all([server()(), server()(), server()()]);
assert.equal(calls, 1, 'Different server instances share one daily refresh lease');
assert.equal((await server()()).count, 9, 'Restarted server reads the saved latest value');
now += FRESH_MS;
failing = true;
const stale = await server()();
assert.equal(stale.count, 9);
assert.equal(stale.stale, true);
assert.equal((await server()()).count, 9);
assert.equal(calls, 2, 'A failed daily refresh is not retried on every page visit');
now += 30 * FRESH_MS;
assert.equal((await server()()).count, 9, 'Old verified value survives a month-long outage and restarts');
sqlite.close();
console.log('Daily statistics storage: SQL migration, shared lease, persisted updates, outages and restarts passed.');
