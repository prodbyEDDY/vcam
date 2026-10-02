import assert from 'node:assert/strict';
import {fetchDisplayedDownloadCount} from '../lib/download-count-client.mjs';

const json = (value, headers = {}) => new Response(JSON.stringify(value), {headers});
const releases = [{draft: false, assets: [
  {id: 1, name: 'VCam-Setup-test.exe', download_count: 6},
  {id: 2, name: 'latest.yml', download_count: 100},
]}];
let calls = [];
assert.equal(await fetchDisplayedDownloadCount(async (url) => {
  calls.push(url);
  return json({count: 7});
}), 7);
assert.deepEqual(calls, ['/api/downloads'], 'Healthy site API needs no browser GitHub request');

for (const siteResponse of [new Response('', {status: 503}), json({count: -1}), json({count: '6'})]) {
  calls = [];
  assert.equal(await fetchDisplayedDownloadCount(async (url, options) => {
    calls.push(url);
    if (url === '/api/downloads') return siteResponse;
    assert.deepEqual(options.headers, {Accept: 'application/vnd.github+json'});
    return json(releases);
  }), 6);
  assert.equal(calls.length, 2, 'Unavailable or invalid site response uses verified GitHub data');
}
let page = 0;
assert.equal(await fetchDisplayedDownloadCount(async (url) => {
  if (url === '/api/downloads') throw new TypeError('Network unavailable');
  return ++page === 1 ? json(releases, {link: '<next>; rel="next"'})
    : json([{assets: [{id: 3, name: 'VCam-Setup-older.exe', download_count: 2}]}]);
}), 8, 'Browser fallback counts every release page');
await assert.rejects(fetchDisplayedDownloadCount(async () => new Response('', {status: 403})),
  'Failures from both sources never become a fabricated zero');
calls = [];
const controller = new AbortController();
controller.abort();
await assert.rejects(fetchDisplayedDownloadCount(async (url) => {
  calls.push(url);
  throw controller.signal.reason;
}, controller.signal));
assert.deepEqual(calls, ['/api/downloads'], 'Unmount cancellation never starts a fallback request');
console.log('Download badge: healthy API, GitHub fallback, pagination, validation and cancellation passed.');
