import {fetchDownloadCount} from './download-stats.mjs';

/** @param {typeof fetch} [fetcher] @param {AbortSignal} [signal] */
export async function fetchDisplayedDownloadCount(fetcher = fetch, signal) {
  const timeout = AbortSignal.timeout(12000);
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  try {
    const response = await fetcher('/api/downloads', {signal: requestSignal});
    if (!response.ok) throw new Error('Site statistics unavailable');
    const data = await response.json();
    if (!Number.isSafeInteger(data?.count) || data.count < 0) throw new Error('Invalid site statistics');
    return data.count;
  } catch (error) {
    if (signal?.aborted) throw error;
    // GitHub supports public CORS requests. A visitor's request can still work
    // when the hosting server's connection or shared API quota is unavailable.
    // Reuse the same full-release pagination and installer-only validation.
    return fetchDownloadCount((url, options) => fetcher(url, {
      headers: {Accept: 'application/vnd.github+json'},
      signal: signal ? AbortSignal.any([signal, options.signal]) : options.signal,
    }));
  }
}
