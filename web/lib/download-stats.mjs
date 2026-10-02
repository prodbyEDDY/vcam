// GitHub asset downloads, not unique users, installs, or landing-page clicks.
const API = 'https://api.github.com/repos/prodbyEDDY/vcam/releases';
export const FRESH_MS = 24 * 60 * 60 * 1000;
const STALE_MS = 7 * FRESH_MS;
const RETRY_MS = FRESH_MS;
const CACHE_KEY = 'https://vcam.prodbyeddy.chatgpt.site/api/downloads?cache=installers-v1';

class GitHubDownloadsError extends Error {
  constructor(response) {
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');
    const retryAfter = response.headers.get('retry-after');
    super(`GitHub downloads unavailable (${response.status}; remaining=${remaining}; reset=${reset}; retry-after=${retryAfter})`);
    this.resetAt = remaining === '0' && Number.isFinite(Number(reset)) ? Number(reset) * 1000 : 0;
    this.retryDelay = Number.isFinite(Number(retryAfter)) ? Math.max(0, Number(retryAfter) * 1000) : 0;
  }
}

export async function fetchDownloadCount(fetcher = fetch) {
  let count = 0;
  const seen = new Set();
  const signal = AbortSignal.timeout(12000);
  for (let page = 1; page <= 50; page++) {
    const response = await fetcher(`${API}?per_page=100&page=${page}`, {
      headers: {'Accept': 'application/vnd.github+json', 'User-Agent': 'VCam-website', 'X-GitHub-Api-Version': '2026-03-10'},
      signal,
    });
    if (!response.ok) throw new GitHubDownloadsError(response);
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

/** @param {{fetcher?: typeof fetch, now?: () => number, storage?: ReturnType<typeof import('./download-stats-storage.mjs').createDownloadStatsStorage>, baseline?: {count: number, checkedAt: number} | null}} [options] */
export function createDownloadStats({fetcher = fetch, now = Date.now, storage, baseline = null} = {}) {
  let snapshot = baseline;
  let pending = null;
  let retryAfter = 0;
  function valid(value) {
    return value && Number.isSafeInteger(value.count) && value.count >= 0 &&
      Number.isFinite(value.checkedAt) && now() >= value.checkedAt;
  }
  async function refresh(edgeCache) {
    if (storage) {
      try {
        const saved = await storage.load();
        if (valid(saved) && (!valid(snapshot) || saved.checkedAt >= snapshot.checkedAt)) snapshot = saved;
        if (saved && Number.isFinite(saved.retryAfter)) retryAfter = Math.max(retryAfter, saved.retryAfter);
      } catch (error) { console.warn('Download statistics storage read failed'); }
    }
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
    if (storage) {
      try {
        if (!await storage.claim(now(), now() + RETRY_MS)) {
          if (valid(snapshot)) return {...snapshot, stale: true};
          throw new Error('Download statistics refresh already claimed');
        }
      } catch (error) {
        if (valid(snapshot)) return {...snapshot, stale: true};
        throw error;
      }
    }
    try {
      const count = await fetchDownloadCount(fetcher);
      snapshot = {count, checkedAt: now()};
      if (storage) {
        try { await storage.save({...snapshot, retryAfter: now() + FRESH_MS}); }
        catch { console.warn('Download statistics storage write failed'); }
      }
      if (edgeCache) {
        try {
          await edgeCache.put(CACHE_KEY, new Response(JSON.stringify(snapshot), {
            headers: {'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=604800'},
          }));
        } catch { /* The fresh result remains usable without edge caching. */ }
      }
      return {...snapshot, stale: false};
    } catch (error) {
      const retryAt = error instanceof GitHubDownloadsError
        ? Math.max(error.resetAt, now() + error.retryDelay) : 0;
      retryAfter = Math.min(now() + STALE_MS, Math.max(now() + RETRY_MS, retryAt));
      if (valid(snapshot)) return {...snapshot, stale: true};
      throw error;
    }
  }
  return async function getStats(edgeCache) {
    if (!pending) pending = refresh(edgeCache).finally(() => { pending = null; });
    return pending;
  };
}
