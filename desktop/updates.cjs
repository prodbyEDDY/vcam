const {text}=require('./localization.cjs');
const fs = require('node:fs');
const DAY = 24 * 60 * 60 * 1000;

// Only the installed application checks GitHub. No renderer-supplied URLs.
function startUpdates({updater, enabled, checkStatePath, now = Date.now, setTimeoutFn = setTimeout, clearTimeoutFn = clearTimeout}) {
 let message = 'Автообновления: проверка раз в сутки';
 let busy = false, downloaded = false, stopped = false;
 if (!enabled) return {status: (locale='ru') => text('Автообновления доступны в установленном приложении',locale), stop() {}};
 let lastCheckAt = 0, timer;
 try {
  const saved = JSON.parse(fs.readFileSync(checkStatePath, 'utf8')).lastCheckAt;
  if (Number.isFinite(saved) && saved > 0 && saved <= now()) lastCheckAt = saved;
 } catch {}
 updater.autoDownload = true;
 updater.autoInstallOnAppQuit = true;
 updater.autoRunAppAfterInstall = false;
 updater.allowPrerelease = true;
 updater.allowDowngrade = false;
 updater.on('checking-for-update', () => { message = 'Проверка обновлений…'; });
 updater.on('update-not-available', () => { message = 'Установлена последняя версия · проверка раз в сутки'; });
 updater.on('update-available', info => { message = `Загрузка версии ${info.version}…`; });
 updater.on('download-progress', info => { message = `Обновление загружается: ${Math.round(info.percent)}%`; });
 updater.on('update-downloaded', info => {
  downloaded = true;
  message = `Версия ${info.version} установится после закрытия VCam`;
 });
 updater.on('error', () => { if (!downloaded) message = 'Не удалось проверить обновление. Следующая попытка через сутки.'; });
 function schedule() {
  timer = setTimeoutFn(() => { void check(); }, lastCheckAt ? Math.max(15000, lastCheckAt + DAY - now()) : 15000);
  timer.unref?.();
 }
 async function check() {
  if (stopped || busy || downloaded) return;
  busy = true;
  lastCheckAt = now();
  // Save attempts too, so restarting offline cannot repeatedly contact GitHub.
  try { if (checkStatePath) fs.writeFileSync(checkStatePath, JSON.stringify({lastCheckAt}), 'utf8'); } catch {}
  try {
   const result = await updater.checkForUpdates();
   // Wait for an active download before scheduling another check.
   if (result?.downloadPromise) await result.downloadPromise;
  } catch { if (!downloaded) message = 'Обновление недоступно. Следующая попытка через сутки.'; }
  finally { busy = false; if (!stopped && !downloaded) schedule(); }
 }
 // Startup and the camera UI never wait for GitHub.
 schedule();
 return {status: (locale='ru') => text(message,locale), stop() { stopped = true; clearTimeoutFn(timer); }};
}
module.exports = {startUpdates, DAY};
