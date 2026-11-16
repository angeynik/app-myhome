# Инструкции для проекта vue-app (клиент MyHome)

Протокол обмена, права доступа и форматы сообщений задаёт сервер: `/webApp/server/rules.md`, раздел «Обмен данными по WebSocket». Этот документ описывает клиент и обязан с ним совпадать. При расхождении источник истины — сервер; расхождение исправлять в обоих местах сразу.

## Стек и окружение
- Vue 3 (Options API), Vuex 4 (все модули `namespaced`), Vue Router 4 (`createWebHistory('/app/')`), Vue CLI 5 (Babel 7, ESLint 8), Jest 29, pnpm.
- Сборка с `publicPath: '/app/'` (`vue.config.js`), dev-сервер на порту 3020. Пути к файлам из `public/` в `index.html` — только через `<%= BASE_URL %>`.
- Обмен с сервером только по WebSocket (нативный `WebSocket`, модуль `store/modules/websocket.js`). HTTP-запросов к серверу нет.
- Настройки сборки — переменные `VUE_APP_*` в `.env` (образец — `example.env`):

| Переменная | Назначение | По умолчанию |
|---|---|---|
| `VUE_APP_EXP` | Хост WS-сервера | обязательна |
| `VUE_APP_PORT` | Порт WS-сервера (`WSD_PORT_IN` сервера) | обязательна |
| `VUE_APP_WS_PROTOCOL` | `ws` / `wss` | `wss` на https-странице, иначе `ws` |
| `VUE_APP_LOG_LEVEL` | `dev` \| `info` \| `warn` \| `error` \| `silent` (`prod` = `warn`) | `info` |
| `VUE_APP_LIM_SCHEDULE_ITEM` / `_NOTIFICATION_ITEM` / `_STATISTIC_ITEM` | Лимит элементов на пару комната+параметр | 8 / 6 / 1 |

- Новая переменная: читать в модуле, который её использует, задавать значение по умолчанию, описывать в таблице и в `example.env`.

## Стиль кода
- Компоненты только на Options API: `name`, `components`, `props`, `emits` (объявлять всегда), `data`, `computed`, `methods`. Composition API и `<script setup>` не использовать (исключение — `AppProfile.vue`, см. «Известные расхождения»).
- ES6+, `async/await`, отступ 2 пробела, одинарные кавычки, точки с запятой.
- Комментарии на русском и по делу: шапка модуля и неочевидные решения. Закомментированный код не оставлять — он в истории git.
- Компоненты читают состояние только через геттеры (`mapGetters`); `this.$store.state.*` в компонентах не использовать. Состояние меняется только мутациями.
- Навигация из store и утилит — только через `router` (динамический `import('@/router/routes.js')`); `window.location` не использовать.
- Обращения к `localStorage` — в `try/catch` (приватный режим, квота).
- Стили — только в `src/assets/mainStyle.css`, подключён один раз в `main.js`. `<style>` в компонентах и inline-стили не использовать.

## Логирование
- Логирование клиента — через `store/modules/logger.js`: `logger.dev`, `logger.info`, `logger.warn`, `logger.error`. Формат: `[Модуль] - метод - сообщение`.
- Уровень `VUE_APP_LOG_LEVEL`: каждый уровень включает более важные; `error` печатается всегда, кроме `silent`.
- Вызовы `console.*` (отладочный вывод) добавляет и удаляет только пользователь. Claude их не добавляет, не удаляет и не переводит на `logger.js`; при ревью и правках проверяет только корректность их работы (не роняют приложение, не выводят секреты). Собственные сообщения Claude пишет через `logger.js`.
- Не логировать секреты: пароли, JWT, `configData` мастера конфигурации.

## Структура проекта
- `main.js` — точка входа: `initializeStore` → `websocket/connect` → `websocket/whenSessionReady` → `app.use(router)` → `mount`.
- `App.vue` — корень: спрайт иконок, `router-view`, popup, dropdown, действия меню; при `isAuthenticated` — `initializeSetpointsManager` → `config/initialize`.
- `router/routes.js` — маршруты и `navigationGuard`.
- `store/index.js` — корневой стор: менеджер уставок (`settingsData`), выбор пользователя, `showSetpoint`.
- `store/modules/` — `auth`, `websocket`, `config`, `sortParams`, `settingsConfig`, `popup`, `dropdown`, `log`, `appearance` (тема фона), `video` (кадр камеры); `logger.js` — утилита, не модуль Vuex.
- `store/classes/manageSetpoints.js` — класс `ManageSetpoints` (объект `settingsData`).
- `utils/` — `timeUtils`, `timeFieldEditor`, `checkOverlap`, `jwt` (только `exp`), `sensorIcons`, `mainTabs` (вкладки главного экрана — единственный источник), `tone`.
- `components/` — `MainView` (оболочка), `MainBody`, `MainBodyValue`, `MainBodySettings` (+ `MainBodySchedule`, `MainBodyNotifications`, `MainBodyStatistic`), `SetpointScreen`, `SensorIcon`, `SensorIconSprite`, `CameraCard`, `TopNav`, `MenuDropdown`, `PopupMenu`, `AppLogin`, `AppProfile`, `AppSettings`, `AccessDenied`.
- `tests/unit/` — Jest `<модуль>.spec.js`, общий `setup.js`.

## Обмен данными по WebSocket

### Соединение
- Одно соединение на вкладку, только через `websocket.js`; параллельные `connect()` разделяют один промис (таймаут открытия 8 с → `NO_CONNECTION`).
- Переподключение без лимита попыток: `1 с · 2ⁿ`, потолок 30 с, джиттер до 0,5 с; немедленная попытка при `online` и возврате на вкладку. Явное отключение — `websocket/disconnect`.
- Сервер держит сессию, пока открыто соединение. Поэтому **после каждого открытия сокета** (первого, повторного, первого удачного после недоступности сервера) `websocket/onConnected` при наличии токена делает `auth/resume`, затем в фоне: конфигурации нет — `initializeSetpointsManager` + `config/initialize`, есть — `config/refreshConfig`. Отдельный `resume` в другом месте не добавлять.
- При обрыве все ожидающие auth-запросы отклоняются с `NO_CONNECTION`.
- Сервер закрывает соединение, которое `AUTH_TIMEOUT_MS` (60 с) остаётся без входа, предварительно прислав `error/accessError` с `TIMEOUT` (код закрытия `4401`). На экране входа это штатно: клиент переподключится сам.

### Формат сообщений
```
{ "type": "...", "request": "...", "name": "<dID>", "payload": { ... } }
```
- `name` — `dID` пользователя (в `auth` до входа — `''`). `payload` — всегда объект, в том числе в `get` (`{}`).
- Отправка — только `dispatch('websocket/send', message)`. Для `auth` (`login`, `resume`, `refresh`, `changePassword`) возвращает промис с ответом (таймаут 15 с → `TIMEOUT`; новый запрос того же типа отменяет старый → `SUPERSEDED`), для остальных — `null`. Ответ сопоставляется по `request`: не отправлять параллельно два одинаковых запроса.
- Клиентские коды ошибок `TIMEOUT`, `NO_CONNECTION`, `SUPERSEDED` — сетевые, повод повторить, а не разлогинивать.

### Исходящие
| type | request | payload |
|---|---|---|
| `auth` | `login` | `{ username, password }` |
| `auth` | `resume` | `{ token }` |
| `auth` | `refresh`, `logout` | `{}` |
| `auth` | `changePassword` | `{ oldPassword, newPassword }` |
| `get` | `config`, `schedules`, `notifications`, `statistics` | `{}` |
| `post` | `setpoints` | `settingsData.payload` (`room`, `setKey`, `key`, `value`, …) — через `config/updateSetpointServer` |
| `post` | `add<тип>` | `{ room, param, configData }` |
| `post` | `del<тип>` | `{ room, param, Ids: [...] }` |
| `post` | `update<тип>` | `settingsData.payload` (`room`, `param`, `id`, `value_name`, `value`, `updated`, `value_type`) — через `config/updateSetpointServer`, `request` ставит компонент элемента (`updateSettingsData({ field: 'request', … })`) |

`<тип>` — `schedules` | `notifications` | `statistics`. Новый запрос добавлять одновременно на сервере (обработчик, `REQUIRED_LEVEL`) и здесь.

### Входящие (`websocket/handleMessage`, порядок проверок)
1. Ответ на ожидающий auth-запрос (`loginSuccess`, `loginError`, `resumeError`, `refreshSuccess`/`refreshError`, `changePasswordSuccess`/`changePasswordError`, `authError`) — резолвит/реджектит промис `send`.
2. `request === 'accessError'` → `auth/handleAccessError` (см. «Сессия»).
3. `type === 'error'` → `config/handleServerError`: сообщение `payload.message` во всплывающем окне и перезапрос затронутых данных (после ошибки записи значение на экране уже изменено, а сервер или устройство его не приняли). Ошибка get-запроса (`configError`, `<тип>Error`) данные не перезапрашивает; `configError` сразу отклоняет ожидание конфигурации.
4. `type === 'response'` → `config/handleConfigResponse` (`config`, `schedules`, `notifications`, `statistics`; остальные ответы игнорируются).
5. `type === 'post'`, `request === 'videoSnapshot'` → `video/handleSnapshot`.
6. `type === 'post'` с `name === dID` → `config/handleValueUpdate`:
   - `{ room, item_name, item_value }` (NodeRED, мосты Modbus, данные датчиков) — обновляет элемент раздела `request` (`sensors`, `system`, `setpoints`, любой другой);
   - `{ room, setKey, value }` — уставка, пересланная сервером от другой вкладки того же `dID`: ключ берётся из сообщения, не из своего выбора.

Тип `info` (`serverConnected`, один раз при подключении) и `message` (оповещения) пока не обрабатываются.

## Сессия и авторизация
- Сессия хранится в `localStorage.authSession` (`{ token, user, dID, level, mustChangePassword }`); пароль не хранится.
- Продление токена — `auth/scheduleRefresh` (≈75 % срока, не чаще раза в минуту).
- `accessError`:
  - `NO_SESSION`, `TIMEOUT` — соединение не вошло; при наличии токена сначала `auth/resume` (успех → `config/refreshConfig`), выход только при отказе сервера; обрыв связи токен не трогает;
  - `TOKEN_REVOKED` — выход сразу;
  - `FORBIDDEN`, `DID_MISMATCH` — всплывающее сообщение.
- Выход (`auth/redirectToLogin` → `auth/clearSession`): чистит `authSession`, `authData`, `roomKey`, `paramKey`, `deviceKey`, `setpointKey`, `clearKey`, `RESET_SESSION_DATA`, `config/RESET`, `video/RESET`, закрывает dropdown, переводит на `/login`. Новые данные пользователя сбрасывать там же.
- Права на клиенте — только UX: проверяет сервер.

## Store
- Корневые геттеры: `isAuthenticated`, `authStatus`, `user`, `level`, `dID`, `key`, `roomKey`, `paramKey`, `deviceKey`, `setpointKey`, `showSetpoint`, `typeSettingsKey`, `getSetpointsManager`, `settingsDataLimits`.
- `settingsData` (`ManageSetpoints`): `{ name: dID, type, request, payload: { config, room, param, key, setKey, device, clearKey, value, value_name, value_type, id, updated }, limits }`. Менеджер создаётся после входа (`initializeSetpointsManager`), пересоздаётся только при смене `dID`, уничтожается при выходе. Без него выбор и изменение уставок молча не работают.
- Менять `settingsData` только действиями `updateSettingsData`, `updatePayloadData`, `updateLimitsData`, `resetSettingsData`. Поля `room`, `param`, `device`, `setKey`, `clearKey` переживают перезагрузку (`localStorage`).
- Новые глобальные мутации/геттеры/действия — в `store/index.js`, модульные — в своём модуле. Новое поле `state` — с геттером. Сигнатуры существующих действий не менять, только расширять.

## Роутинг
| path | name | Компонент | meta |
|---|---|---|---|
| `/` | — | `MainView` (оболочка) | `requiresAuth`, `requiredLevel: 1` |
| `/` (`''`) | `Home` | `MainBody` | наследует |
| `/settings/:settingsType` | `DashboardSettings` | `MainBodySettings` (`setting_Type`) | `requiredLevel: 2` |
| `/preferences` | `AppSettings` | `AppSettings` (тема фона, режим устройства) | `requiredLevel: 2` |
| `/login` | `Login` | `AppLogin` | `public` |
| `/profile` | `AppProfile` | `AppProfile` | `requiresAuth`, `requiredLevel: 2` |
| `/access-denied` | `AccessDenied` | `AccessDenied` | — |
| `/:pathMatch(.*)*` | — | redirect `/` | — |

- `navigationGuard`: `public` → пропуск (авторизованного с `/login` — на `/`); нет `requiresAuth` → пропуск; не авторизован → `localStorage.redirectPath` + `/login`; `level` ниже максимального `requiredLevel` по matched → `/access-denied`.
- `redirectPath` перед использованием проверяется (`AppLogin.safeRedirect`: начинается с `/`, не с `//`).
- Меню шапки (`MainView.openMenu` → `App.onDropdownSelect`): `profile`, `settings` (`/preferences`), `logout`. Пункт меню без обработчика не добавлять.

## Конфигурация устройства
- Комнаты — ключи `room01`, `room02`, … Служебные ключи корня: `init` (лимиты), `newConfigID`, `password`, `common` (вкладка «Общие», не комната).
- Комната: `id`, `title`, `group`, необязательный `_meta` (`'раздел|ключ': { title }`), разделы `sensors`, `system`, `setpoints` и др.: `{ <ключ>: { value, type: 'num' | 'bool', lastUpdate } }`.
- Префиксы: `d` — датчик/статус, `a` — актуатор, `s` — уставка. Числовой суффикс связывает датчик и уставку строго: `dTemp02 ↔ sTemp02`; нет пары — карточка только для чтения.
- Ключи с кириллической «С» (`dСurrent`, `notificationСhannel`) совпадают с серверными: не «исправлять» на латиницу.
- Очистка ключа — геттер `config/clearKeySync('dTemp02') === 'Temp'`.
- Нет данных → «—», а не `0` / `OFF`. Логические значения принимаются как `true`/`false`, `'ON'`/`'OFF'` и `0`/`1`.
- Время обмена с сервером — московская строка `DD.MM.YYYY, HH:MM:SS` (`nowMoscow`), разбор — `parseMoscowDate` независимо от часового пояса устройства; время суток — `HH:MM`.

## Компоненты: правила, которые легко нарушить
- `MainView`: экран изменения значения открывается событием `getComponentData`; `request` и поле (`valueTitle`) берутся из открывшего события — не подставлять жёстко `setpoints`/`value` (экраны настроек тоже его открывают). Отправка на сервер — debounce 300 мс; таймер обнуляется в момент срабатывания, `flushPendingUpdate` при закрытии отправляет только неотправленное.
- `MainBody`: `groupedView` — computed; вкладки — только из `utils/mainTabs.js`; карточка без уставки не выбирается и ничего не пишет в `payload`.
- `MainBodySettings`: удаление отложенное (`pendingDeletes`, отправка при закрытии); добавление — проверка лимита → подбор времени без пересечений (`checkOverlap`; `newStartTime === null` обязательно обработать) → оптимистично в store → отправка → откат при ошибке.
- `SetpointScreen`: свой `Teleport` в `<body>`; шаг и округление — по точности шага; выход за границу — зажим; центр кольца считается при каждом касании, а не в watcher на `visible`.
- Режим устройства — единственный источник `config/isMobile`; в `localStorage.deviceMode` пишется только явный выбор пользователя.
- Иконки — `<SensorIcon :name="ключ">`; новая иконка — `<g id="si-<имя>">` в `SensorIconSprite.vue` + запись в `utils/sensorIcons.js`; спрайт монтируется один раз.

## localStorage
`authSession`, `roomKey`, `paramKey`, `deviceKey`, `setpointKey`, `clearKey` (чистятся при выходе); `redirectPath`; `mainViewTab`, `typeSettingsKey` (`schedules` | `notifications` | `statistics`), `deviceMode`, `appearance` (`{ theme, color }`) — настройки интерфейса, при выходе не чистятся; `authData`, `mobile_navigation` — устаревшие, только удаляются.

## Стили (`assets/mainStyle.css`)
- Секции: переменные · база · каркас · главный экран · иконки · экран уставки · popup/dropdown · формы · настройки · медиа-запросы · LEGACY. Новый стиль — в свою секцию; `@media` — только в секции медиа-запросов, порядок брейкпоинтов важен.
- Цвета и тени — только переменные `:root`. Тема фона — класс `bg-theme--<тема>` на `.app` (`appearance/bgThemeClass`), свой цвет — `--custom-bg-color`.
- Динамические классы (`popup-${type}`) и классы vue-router не удалять как «неиспользуемые».

## Тесты
- Jest + `@vue/test-utils` + jsdom (`pnpm test`). На каждый новый или изменённый модуль создавать или обновлять тесты.
- Сеть не использовать: `WebSocket` мокается в `tests/unit/setup.js`; `logger` в тестах мокается целиком (`dev`, `info`, `warn`, `error`).
- `websocket.js` хранит состояние на уровне модуля (`pending`, `connectPromise`, таймеры): `jest.useFakeTimers()`, сброс состояния перед каждым тестом. Действия удобно проверять напрямую с подставным `context` (`{ state, rootState, rootGetters, dispatch, commit }`).
- ESLint (`pnpm lint`) должен проходить без ошибок. Для `src/tests/**` в `eslintConfig.overrides` включена среда Jest (`test`, `expect`, `jest` — глобальные); в коде приложения её нет.
- Перед завершением работы прогонять весь набор и `pnpm lint` и сравнивать с исходным состоянием: новых падений быть не должно.

## Известные расхождения
- Набор тестов устарел: `Dashboard`, `IntroduceHome`, `SmartHome`, `ManufactAutomatation`, `UserConfig` ссылаются на удалённые компоненты; `router`, `timeUtils`, `checkOverlap`, `websocket` и др. — на прежнее поведение.
- Нет экрана смены пароля: маршрута `/change-password` и `ChangePassword.vue` нет, гард `mustChangePassword` не проверяет, сервер тоже не принуждает.
- Не реализованы возможности сервера: оповещения (`type: 'message'`, `get/messages`), профиль (`auth/profile`, `updateProfile`), Telegram (`telegramLinkCode`, `telegramUnlink`), `get/videoSnapshot`. Камера: клик (`openCamera`) никто не обрабатывает, `CameraScreen.vue` не подключён.
- `refreshError` с `TOKEN_REVOKED` не разлогинивает: `refresh` повторяется раз в минуту.
- Не используются: `MainSetpoint.vue`, `CameraScreen.vue`, `utils/transformConfigs.js`, `myhome_config.js`.
- Отложенные мажорные обновления: Jest 30 и Babel 8 (последний `@vue/vue3-jest` 29.x требует Jest 29 и Babel 7), ESLint 9+ (нужен flat-конфиг вместо `eslintConfig`; Vue CLI 5 рассчитан на ESLint 7–8), `vue-router` 5 (новая мажорная версия: переносить отдельно с проверкой гарда `next()`).
- `AppProfile.vue` — Composition API и `store.state` напрямую.
- `public/index.html`: манифест и иконки подключены абсолютными путями (`/manifest.json`, `/webicons/…`) мимо `/app/` (404), манифестов два, `start_url: '/'`.
- `example.env` без обязательной `VUE_APP_EXP`, с неиспользуемыми `VUE_APP_DOMEN`, `VUE_APP_HOST`, `VUE_APP_SERVER_PORT`, `VUE_APP_LOG_DIRECTORY`.
