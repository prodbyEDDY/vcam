import assert from 'node:assert/strict';
import {fetchDownloadCount, createDownloadStats, FRESH_MS} from '../lib/download-stats.mjs';

const asset = (id, name, download_count) => ({id, name, download_count});
const release = (assets, draft = false) => ({assets, draft});
const json = (value, headers = {}) => new Response(JSON.stringify(value), {headers});
let pages = 0;
assert.equal(await fetchDownloadCount(async () => {
  pages++;
  return pages === 1 ? json([
    release([asset(1, 'VCam-Setup-0.2.2-x64.exe', 2), asset(2, 'latest.yml', 100), asset(3, 'VCam-Setup-0.2.2-x64.exe.blockmap', 99)]),
    release([asset(4, 'VCam-Setup-draft-x64.exe', 1000)], true),
  ], {link: '<https://api.github.com/next>; rel="next"'}) : json([
    release([asset(5, 'VCam-Setup-0.2.1-x64.exe', 4), asset(1, 'VCam-Setup-0.2.2-x64.exe', 2)]),
  ]);
}), 6);
assert.equal(pages, 2, 'All pages counted, duplicate assets excluded');
assert.equal(await fetchDownloadCount(async () => json([])), 0, 'A verified zero is valid');
await assert.rejects(fetchDownloadCount(async () => json([release([asset(1, 'VCam-Setup-test.exe', -1)])])));
pages = 0;
await assert.rejects(fetchDownloadCount(async () => ++pages === 1
  ? json([release([asset(1, 'VCam-Setup-test.exe', 6)])], {link: '<next>; rel="next"'})
  : new Response('', {status: 403})), 'Never return a partial total');

let time = 1_000_000, calls = 0, failing = false;
const get = createDownloadStats({now: () => time, fetcher: async () => {
  calls++;
  if (failing) return new Response('', {status: 503});
  return json([release([asset(1, 'VCam-Setup-test.exe', 6)])]);
}});
await Promise.all([get(), get(), get()]);
assert.equal(calls, 1, 'Concurrent requests share one upstream fetch');
await get();
assert.equal(calls, 1, 'Fresh cached data does not refetch');
time += FRESH_MS + 1;
failing = true;
assert.deepEqual(await get(), {count: 6, checkedAt: 1_000_000, stale: true});
await get();
assert.equal(calls, 2, 'Failures back off instead of hammering GitHub');
time += 8 * FRESH_MS;
assert.deepEqual(await get(), {count: 6, checkedAt: 1_000_000, stale: true}, 'An outage never discards the last verified count');
const cold = createDownloadStats({fetcher: async () => new Response('', {status: 429})});
await assert.rejects(cold(), 'A failed first fetch must not become zero');
const cached = createDownloadStats({now: () => 1001, fetcher: async () => {throw Error('should use edge cache');}});
assert.equal((await cached({match: async () => json({count: 21, checkedAt: 1000})})).count, 21);
for (const headers of [
  {'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1600'},
  {'retry-after': '600'},
]) {
  let rateTime = 1_000_000, rateCalls = 0;
  const limited = createDownloadStats({now: () => rateTime, fetcher: async () => {
    rateCalls++;
    return new Response('', {status: 403, headers});
  }});
  await assert.rejects(limited());
  rateTime += 61_000;
  await assert.rejects(limited());
  assert.equal(rateCalls, 1, 'Wait for GitHub quota reset / Retry-After instead of retrying every minute');
  rateTime = 1_000_000 + FRESH_MS;
  await assert.rejects(limited());
  assert.equal(rateCalls, 2, 'Retry after the upstream wait expires');
}
console.log('Download statistics: pagination, asset filtering, cache, concurrency and failure handling passed.');
