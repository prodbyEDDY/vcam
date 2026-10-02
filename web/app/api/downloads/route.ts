import {env} from 'cloudflare:workers';
import {createDownloadStats, FRESH_MS} from '@/lib/download-stats.mjs';
import {createDownloadStatsStorage} from '@/lib/download-stats-storage.mjs';
import baseline from '@/lib/download-baseline.json';

const getStats = createDownloadStats({baseline,
  storage: createDownloadStatsStorage((env as unknown as {DB: D1Database}).DB, baseline, FRESH_MS),
});
export async function GET() {
  try {
    const edgeCache = typeof caches === 'undefined' ? undefined :
      (caches as unknown as {default?: Cache}).default;
    const result = await getStats(edgeCache);
    return Response.json(result, {headers: {
      'Cache-Control': 'public, max-age=60, s-maxage=3600',
      'X-Robots-Tag': 'noindex',
    }});
  } catch (error) {
    console.warn('Download statistics refresh failed:', error instanceof Error ? error.message : 'Unknown error');
    return Response.json({error: 'Statistics temporarily unavailable'}, {status: 503, headers: {
      'Cache-Control': 'no-store', 'Retry-After': '60', 'X-Robots-Tag': 'noindex',
    }});
  }
}
