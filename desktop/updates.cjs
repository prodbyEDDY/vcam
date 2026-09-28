const HOUR = 60 * 60 * 1000;

// Only the installed application checks GitHub. No renderer-supplied URLs.
function startUpdates({updater, enabled, setTimeoutFn = setTimeout, setIntervalFn = setInterval, clearTimeoutFn = clearTimeout, clearIntervalFn = clearInterval}) {
 let message = 'Автообновления: проверка каждый час';
 let busy = false, downloaded = false, stopped = false;
 if (!enabled) return {status: () => 'Автообновления доступны в установленном приложении', stop() {}};
 updater.autoDownload = true;
 updater.autoInstallOnAppQuit = true;
 updater.autoRunAppAfterInstall = false;
 updater.allowPrerelease = true;
 updater.allowDowngrade = false;
 updater.on('checking-for-update', () => { message = 'Проверка обновлений…'; });
 updater.on('update-not-available', () => { message = 'Установлена последняя версия · проверка каждый час'; });
 updater.on('update-available', info => { message = `Загрузка версии ${info.version}…`; });
 updater.on('download-progress', info => { message = `Обновление загружается: ${Math.round(info.percent)}%`; });
 updater.on('update-downloaded', info => {
  downloaded = true;
  message = `Версия ${info.version} установится после закрытия VCam`;
 });
 updater.on('error', () => { if (!downloaded) message = 'Не удалось проверить обновление. Следующая попытка через час.'; });
 async function check() {
  if (stopped || busy || downloaded) return;
  busy = true;
  try {
   const result = await updater.checkForUpdates();
   // Keep the hourly scheduler from interrupting an active download.
   if (result?.downloadPromise) await result.downloadPromise;
  } catch { if (!downloaded) message = 'Обновление недоступно. Следующая попытка через час.'; }
  finally { busy = false; }
 }
 // Startup and the camera UI never wait for GitHub.
 const initial = setTimeoutFn(() => { void check(); }, 15000);
 const hourly = setIntervalFn(() => { void check(); }, HOUR);
 initial.unref?.(); hourly.unref?.();
 return {status: () => message, stop() { stopped = true; clearTimeoutFn(initial); clearIntervalFn(hourly); }};
}
module.exports = {startUpdates, HOUR};
