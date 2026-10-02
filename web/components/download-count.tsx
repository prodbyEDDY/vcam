'use client';

import {useEffect, useState} from 'react';
import {ArrowUpRight, Download} from 'lucide-react';
import {GITHUB} from '@/lib/product';
import {fetchDisplayedDownloadCount} from '@/lib/download-count-client.mjs';
import {FRESH_MS} from '@/lib/download-stats.mjs';
import baseline from '@/lib/download-baseline.json';

function downloadWord(count: number) {
  const lastTwo = count % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return 'скачиваний';
  const last = count % 10;
  return last === 1 ? 'скачивание' : last >= 2 && last <= 4 ? 'скачивания' : 'скачиваний';
}

export function DownloadCount({locale='ru'}:{locale?:'ru'|'en'}) {
 const en=locale==='en';
  const [count, setCount] = useState<number>(baseline.count);
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    let nextUpdate = 0;
    async function update() {
      if (document.hidden || pending || Date.now() < nextUpdate) return;
      pending = true;
      try {
        const verifiedCount = await fetchDisplayedDownloadCount(fetch, controller.signal);
        if (!controller.signal.aborted) setCount(verifiedCount);
        nextUpdate = Date.now() + FRESH_MS;
      } catch {
        // Preserve the last verified number; try again at the daily refresh.
        nextUpdate = Date.now() + FRESH_MS;
      } finally { pending = false; }
    }
    void update();
    const timer = window.setInterval(update, FRESH_MS);
    document.addEventListener('visibilitychange', update);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  return <a className="download-count" href={`${GITHUB}/releases`} target="_blank" rel="noreferrer"
    title={en?"Windows installer downloads across public GitHub releases, including repeat downloads. Refreshed daily; the last verified count remains if an update fails.":"Скачивания установщиков Windows во всех публичных релизах GitHub. Обновляется раз в сутки. При ошибке остаётся последнее полученное число; повторные скачивания тоже учитываются."}>
    <Download size={17} aria-hidden="true"/>
    <span className="download-count-text" aria-live="polite" aria-atomic="true">
      <strong>{new Intl.NumberFormat(en?'en-US':'ru-RU').format(count)}</strong> {en?(count===1?'download':'downloads'):downloadWord(count)}
    </span>
    <ArrowUpRight size={14} aria-hidden="true"/>
  </a>;
}
