// GitHub asset downloads, not unique users, installs, or landing-page clicks.
const API = 'https://api.github.com/repos/prodbyEDDY/vcam/releases';
export const FRESH_MS = 15 * 60 * 1000;
const STALE_MS = 24 * 60 * 60 * 1000;
const RETRY_MS = 60 * 1000;
const CACHE_KEY = 'https://vcam.prodbyeddy.chatgpt.site/api/downloads?cache=installers-v1';

export async function fetchDownloadCount(fetcher = fetch) {
  let count = 0;
  const seen = new Set();
  const signal = AbortSignal.timeout(12000);
  for (let page = 1; page <= 50; page++) {
    const response = await fetcher(`${API}?per_page=100&page=${page}`, {
      headers: {'Accept': 'application/vnd.github+json', 'User-Agent': 'VCam-website', 'X-GitHub-Api-Version': '2026-03-10'},
      signal,
    });
    if (!response.ok) throw new Error(`GitHub downloads unavailable (${response.status})`);
    const releases = await response.json();
    if (!Array.isArray(releases)) throw new Error('Invalid GitHub releases');
    for (const release of releases) {
      if (release.draft === true) continue;
      if (!Array.isArray(release.assets)) throw new Error('Missing release assets');
      for (const asset of release.assets) {
        if (!/^VCam-Setup-.+\.exe$/i.test(asset.name ?? '') || seen.has(asset.id)) continue;
        if (!Number.isSafeInteger(asset.id) || !Number.isSafeInteger(asset.download_count) || asset.download_count < 0) {
          throw new Error('Invalid GitHub download count');
        }
        seen.add(asset.id);
        count += asset.download_count;
        if (!Number.isSafeInteger(count)) throw new Error('Download count exceeds safe range');
      }
    }
    // Follow all release pages; never publish a partial total after an error.
    if (!response.headers.get('link')?.includes('rel="next"') && releases.length < 100) return count;
  }
  throw new Error('GitHub release pagination limit reached');
}

export function createDownloadStats({fetcher = fetch, now = Date.now} = {}) {
  let snapshot = null;
  let pending = null;
  let retryAfter = 0;
  function valid(value) {
    return value && Number.isSafeInteger(value.count) && value.count >= 0 &&
      Number.isFinite(value.checkedAt) && now() >= value.checkedAt && now() - value.checkedAt < STALE_MS;
  }
  async function refresh(edgeCache) {
    if (!valid(snapshot) && edgeCache) {
      try {
        const cached = await edgeCache.match(CACHE_KEY);
        const value = cached && await cached.json();
        if (valid(value)) snapshot = value;
      } catch { /* Edge cache is an optimization, never the source of truth. */ }
    }
    if (valid(snapshot) && now() - snapshot.checkedAt < FRESH_MS) return {...snapshot, stale: false};
    if (now() < retryAfter) {
      if (valid(snapshot)) return {...snapshot, stale: true};
      throw new Error('Download statistics temporarily unavailable');
    }
    try {
      const count = await fetchDownloadCount(fetcher);
      snapshot = {count, checkedAt: now()};
      if (edgeCache) {
        try {
          await edgeCache.put(CACHE_KEY, new Response(JSON.stringify(snapshot), {
            headers: {'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400'},
          }));
        } catch { /* The fresh result remains usable without edge caching. */ }
      }
      return {...snapshot, stale: false};
    } catch (error) {
      retryAfter = now() + RETRY_MS;
      if (valid(snapshot)) return {...snapshot, stale: true};
      throw error;
    }
  }
  return async function getStats(edgeCache) {
    if (!pending) pending = refresh(edgeCache).finally(() => { pending = null; });
    return pending;
  };
}
