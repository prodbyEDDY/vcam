import {createDownloadStats} from '@/lib/download-stats.mjs';

const getStats = createDownloadStats();
export async function GET() {
  try {
    const edgeCache = typeof caches === 'undefined' ? undefined :
      (caches as unknown as {default?: Cache}).default;
    const result = await getStats(edgeCache);
    return Response.json(result, {headers: {
      'Cache-Control': result.stale ? 'public, max-age=60' : 'public, max-age=60, s-maxage=900',
      'X-Robots-Tag': 'noindex',
    }});
  } catch {
    return Response.json({error: 'Statistics temporarily unavailable'}, {status: 503, headers: {
      'Cache-Control': 'no-store', 'Retry-After': '60', 'X-Robots-Tag': 'noindex',
    }});
  }
}
