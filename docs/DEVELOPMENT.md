# Разработка VCam

## Архитектура

- `web/`: интерфейс React/Vinext и сервис одноразового сопряжения Cloudflare Workers/D1, опубликованный через Sites. Сайт содержит лендинг и вход телефона; QR создаётся только в приложении Windows. Компоненты камеры общие.
- `desktop/`: Electron с локально упакованным интерфейсом, изоляцией контекста, ограниченным IPC и HTTPS-сервисом подключения.
- `native/`: C++ DirectShow-камера на основе MIT-проекта UnityCapture, отдельные идентификаторы VCam, 32/64 бит, собственный приёмник RGBA-кадров.
- `scripts/`: сборка, публикация и проверки. Источники сторонних компонентов перечислены в THIRD_PARTY_NOTICES.md.

QR содержит случайный 256-битный ключ в URL-фрагменте; сервер хранит только хеши ключей. Для ручного входа используется случайный 8-символьный код (40 бит), хранится только хеш; попытки ввода ограничены. QR и код расходуются атомарно при первом подключении. Сервис обменивается только SDP, а управление идёт по WebRTC DataChannel. Видео не хранится на сервере. Сессия сопряжения истекает через 10 минут, действующая видеосвязь от неё после подключения не зависит. Удалённый TURN не настроен.

## Разработка на Windows

Требуется Node.js 22.13+, Visual Studio Build Tools с C++ и Windows SDK. Поддерживаются toolset v142/v143.

```powershell
npm ci
cd web
npm ci
npm run db:generate
npm run build
# Только для новой локальной базы, один раз:
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_rich_warstar.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_minor_frog_thor.sql
npm run dev
```

В другом терминале, из корня:

```powershell
npm run build:native
npm run build:ui
npm start
npm run dist
```

Установщик: `release/VCam-Setup-0.2.4-x64.exe`. Обычный запуск `npm start` не регистрирует камеру: для использования из других программ установите VCam Setup. На телефоне нужен действительный HTTPS-адрес; localhost используется только для автоматических тестов на компьютере.

## Проверки

```powershell
npm test
cd web
npx tsc --noEmit
```

`scripts/ui-smoke.cjs` проверяет лендинг, SEO, необязательную поддержку звездой, скачивание, отправку ссылки, инструкцию и адаптивную компоновку. `scripts/desktop-smoke.cjs` проверяет автоматический QR, повторный QR в той же вкладке, ручной код, переключатели и изменяющиеся DirectShow-кадры при свёрнутом окне. Камера искусственная; эти проверки не заменяют испытание на физическом iPhone.

Видео отправляется по таймеру с отключённым ограничением фоновой активности Electron, независимо от requestAnimationFrame и перерисовки окна. Закрытие приложения завершает передачу.

Подробности нагрузки: [docs/HOSTING.md](HOSTING.md). Источники мокапов и промпты: [docs/IMAGEGEN.md](IMAGEGEN.md).

## Публикация

Исходники коммитятся в этот репозиторий. Для Sites `scripts/prepare-site.mjs` готовит отдельный checkout в игнорируемой `.cache/sites-source`; официальный Sites workflow сохраняет его исходники и архив сборки. Ключи Sites и GitHub не сохраняются в проекте.

Не переигрывайте уже применённые миграции D1. Изменения схемы оформляются новыми миграциями Drizzle.
