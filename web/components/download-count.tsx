'use client';

import {useEffect, useState} from 'react';
import {ArrowUpRight, Download} from 'lucide-react';
import {GITHUB} from '@/lib/product';

function downloadWord(count: number) {
  const lastTwo = count % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return 'скачиваний';
  const last = count % 10;
  return last === 1 ? 'скачивание' : last >= 2 && last <= 4 ? 'скачивания' : 'скачиваний';
}

export function DownloadCount() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    async function update() {
      if (document.hidden) return;
      try {
        const response = await fetch('/api/downloads', {signal: controller.signal});
        if (!response.ok) return;
        const data = await response.json();
        if (data && typeof data === 'object' && 'count' in data && typeof data.count === 'number' &&
            Number.isSafeInteger(data.count) && data.count >= 0) setCount(data.count);
      } catch { /* Keep the last verified count, or the neutral GitHub link. */ }
    }
    void update();
    const timer = window.setInterval(update, 15 * 60 * 1000);
    document.addEventListener('visibilitychange', update);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  return <a className="download-count" href={`${GITHUB}/releases`} target="_blank" rel="noreferrer"
    title="Скачивания установщиков Windows во всех публичных релизах GitHub. Обновляется каждые 15 минут; повторные скачивания тоже учитываются.">
    <Download size={17} aria-hidden="true"/>
    <span className="download-count-text" aria-live="polite" aria-atomic="true">
      {count === null ? 'Скачивания на GitHub' : <><strong>{new Intl.NumberFormat('ru-RU').format(count)}</strong> {downloadWord(count)}</>}
    </span>
    <ArrowUpRight size={14} aria-hidden="true"/>
  </a>;
}
