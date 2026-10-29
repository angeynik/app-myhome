# ПРАВИЛА РАБОТЫ С ПРОЕКТОМ SmartHome / ManufactAutomation

> Документ описывает **текущую** архитектуру проекта и обязательные правила изменений.
> **Цель**: улучшение, оптимизация и новый функционал — без нарушения существующей архитектуры.
>
> Ревизия: 22.10.2026. Сверено с кодом: `main.js`, `App.vue`, `ConFiguration.vue`, `router/routes.js`,
> все модули `store/`, `utils/`, компоненты `components/*` (список в п. 2.2), `assets/mainStyle.css`.
> Раздел **16** — расхождения и вопросы, требующие вашего решения.

---

## 1. СТЕК И ВЕРСИИ

| Слой | Технология |
|------|-----------|
| Frontend framework | Vue 3 (Options API) |
| Сборка | Vue CLI (переменные окружения `VUE_APP_*`, алиас `@` = `src`) |
| State management | Vuex 4 (namespaced modules) |
| Router | Vue Router 4 (`createWebHistory('/app/')`) |
| Backend | Node.js + Express.js |
| Real-time | WebSocket (нативный API), JWT-авторизация поверх WS |
| Стили | Один глобальный файл `src/assets/mainStyle.css` (п. 15) |
| Стиль компонентов | Options API — **не переводить на Composition API** |

### 1.1 Переменные окружения

| Переменная | Назначение | По умолчанию |
|-----------|-----------|--------------|
| `VUE_APP_EXP` | Хост WebSocket-сервера | — (обязательна) |
| `VUE_APP_PORT` | Порт WebSocket-сервера | — (обязательна) |
| `VUE_APP_WS_PROTOCOL` | `ws` / `wss` | `wss` на https-странице, иначе `ws` |
| `VUE_APP_LOG_LEVEL` | `dev` \| `info` \| `warn` \| `error` \| `silent` (`prod` = `warn`) | `info` |
| `VUE_APP_FEATURE_CONFIGURATION` | `'false'` отключает маршрут `/configuration` | включён |
| `VUE_APP_LIM_SCHEDULE_ITEM` | Лимит расписаний на пару комната+параметр | `8` |
| `VUE_APP_LIM_NOTIFICATION_ITEM` | Лимит уведомлений | `6` |
| `VUE_APP_LIM_STATISTIC_ITEM` | Лимит аналитики | `1` |

---

## 2. СТРУКТУРА ПРОЕКТА

### 2.1 Файловая структура

```
src/
  main.js                   ← Точка входа: store → восстановление сессии → router → mount
  App.vue                   ← Корневой компонент: popup, dropdown, инициализация после входа
  ConFiguration.vue         ← Мастер создания/редактирования конфигурации (feature-флаг)
  assets/
    mainStyle.css           ← ЕДИНСТВЕННЫЙ файл стилей (п. 15)
  router/
    routes.js               ← Маршруты + navigationGuard
  store/
    index.js                ← Корневой стор: root state/getters/mutations/actions
    classes/
      manageSetpoints.js    ← Класс ManageSetpoints (управление уставками)
    modules/
      auth.js               ← Аутентификация (namespaced: auth/)
      websocket.js          ← WebSocket-соединение (namespaced: websocket/)
      config.js             ← Конфиг устройства + списки настроек (namespaced: config/)
      sortParams.js         ← Ключи выбора, заголовки, лимиты (namespaced: sortParams/)
      settingsConfig.js     ← Операции с расписаниями/уведомлениями/аналитикой (namespaced: settingsConfig/)
      popup.js              ← Всплывающие сообщения + таймер автозакрытия (namespaced: popup/)
      dropdown.js           ← Выпадающее меню (namespaced: dropdown/)
      log.js                ← Журнал ошибок (namespaced: log/)
      logger.js             ← Утилита логирования (НЕ Vuex-модуль, просто экспорт)
  utils/
    timeUtils.js            ← Время: МСК-строки, минуты↔«HH:MM», форматирование
    timeFieldEditor.js      ← Разбор/сборка «HH:MM» при редактировании часов/минут
    checkOverlap.js         ← Проверка пересечения временных интервалов
    jwt.js                  ← Декодирование JWT (только exp; подпись проверяет сервер)
    sensorIcons.js          ← Ключ конфигурации → имя иконки спрайта (resolveSensorIcon)
  tests/
    unit/                   ← Jest (см. п. 14)
```

### 2.2 Компоненты

```
src/components/
  MainView.vue              ← Оболочка (бывший DashBoard.vue): шапка, router-view, панель уставки
  MainBody.vue              ← Карточки значений, сгруппированные по выбранному типу группировки
  SensorIcon.vue            ← Иконка датчика/актуатора/уставки (<use> на спрайт; цвет через color/state/accent)
  SensorIconSprite.vue      ← SVG-спрайт иконок (монтируется один раз в App.vue)
  GroupTabs.vue             ← Вкладки типа группировки (живут в шапке MainView, состояние — sortParams)
  MainBodyValue.vue         ← Карточка одного значения
  MainBodySettings.vue      ← Экран настроек (расписания / уведомления / аналитика)
  MainBodySchedule.vue      ← Элемент расписания
  MainBodyNotifications.vue ← Элемент уведомления
  MainBodyStatistic.vue     ← Элемент аналитики
  MainSetpoint.vue          ← Плавающая панель изменения уставки (touch/клик)
  TopNav.vue                ← Ссылки навигации по уровню доступа
  MenuDropdown.vue          ← Выпадающее меню (Teleport)
  PopupMenu.vue             ← Всплывающее сообщение (состояние — в store/popup)
  AppLogin.vue              ← Вход
  AppProfile.vue            ← Профиль, выход
  ChangePassword.vue        ← Смена пароля (в т.ч. принудительная)
  AccessDenied.vue          ← 403
```

**Не подтверждено при ревизии** (файлов не было): `MainFooter.vue` (импортируется из `ConFiguration.vue`),
`AppPlace.vue`, `MainHeader.vue`, `UserConfig.vue`, `InputDialog.vue`, `IntroduceHome`, `SmartHome`, `ManufactAutomatation`.
В актуальных маршрутах (п. 6.1) ни один из них не используется. Если файлы существуют — удалить или вернуть маршруты.

**Кандидаты на удаление** (нигде не импортируются): `transformConfigs.js` (класс `CheckConfigs`), `myhome_config.js`.

---

## 3. СТИЛЬ КОДА

### 3.1 Vue-компоненты — только Options API

```js
// ✅ ПРАВИЛЬНО
export default {
  name: 'ComponentName',
  components: { ... },
  props: { ... },
  emits: [ ... ],          // события объявлять всегда
  data() { return { ... } },
  computed: { ...mapGetters(...) },
  methods: { ... }
}

// ❌ ЗАПРЕЩЕНО — не использовать Composition API / <script setup>
```

Известное отступление: `AppProfile.vue` написан на Composition API (`setup`, `useStore`) — см. п. 16.

### 3.2 Логирование — только через logger.js

```js
import logger from '../store/modules/logger.js';  // в компонентах
import logger from './logger';                     // в store-модулях

logger.dev('[Module] - method - Сообщение');    // детальная отладка (только level=dev)
logger.info('[Module] - method - Сообщение');   // общая информация
logger.warn('[Module] - method - Сообщение');   // подозрительные, но не фатальные ситуации
logger.error('[Module] - method - Сообщение');  // ошибки
```

Уровни (по возрастанию «тишины»): `dev` < `info` < `warn` < `error` < `silent`.
**`error` печатается на любом уровне, кроме `silent`.** (Раньше при `info` ошибки не печатались.)

- ❌ Активные `console.log` в коде запрещены — только `logger.*`
- ❌ Не логировать секреты: пароли, JWT, **весь `configData`** (в конфигурации лежит `password`)
- Закомментированный код не оставлять: он в git-истории

### 3.3 Формат префиксов в логах

Строго: `[ИмяМодуля] - имяМетода - Описание`

```js
logger.info('[MainView] - editValueMainSetpoint - Обработка запроса setpoints');
logger.error('[config] - requestConfig - Ошибка запроса:', error);
```

### 3.4 Ошибки и асинхронность

- Все обращения к `localStorage` в store — через `try/catch` (приватный режим, квота)
- Действия, обращающиеся к серверу, **`await`-ятся** — «fire-and-forget» допустим только для не-auth `websocket/send`
- Глобальные обработчики (`app.config.errorHandler`, `unhandledrejection`) в `main.js` пишут в `log/addError`
- Навигация из store/утилит — только через `router` (динамический `import('@/router/routes.js')` в `auth.js`);
  **не использовать `window.location.href`** — ломает base `/app/` и перезагружает SPA

---

## 4. VUEX — ПРАВИЛА РАБОТЫ СО СТОРОМ

### 4.1 Структура модулей

- **Все модули** объявлены с `namespaced: true`: `auth`, `websocket`, `config`, `sortParams`, `settingsConfig`, `popup`, `dropdown`, `log`
- Обращение: `'auth/login'`, `'websocket/send'`, `'config/initialize'`, `'sortParams/updateSortKey'`, `'settingsConfig/...'`, `'popup/show'`, `'dropdown/show'`, `'log/addError'`
- Root-мутации: `INIT_SETPOINTS_MANAGER`, `RESET_SESSION_DATA`, `UPDATE_SETTINGS_DATA`, `RESET_SETTINGS_DATA`, `SET_SETTINGS_DATA`, `UPDATE_PAYLOAD_DATA`, `UPDATE_LIMITS_DATA`, `SHOW_SETPOINT`
- Root-actions: `initializeStore`, `initializeSetpointsManager`, `updateSettingsData`, `updatePayloadData`, `updateLimitsData`, `resetSettingsData`, `setShowSetpoint`, `hideSetpoint`
- Мутаций `SET_ROOM_KEY` / `SET_PARAM_KEY` / `SET_DEVICE_KEY` / `SET_SETPOINT_KEY` **нет**: ключи выбора живут в `settingsData.payload` и пишутся через `updatePayloadData` (п. 4.4)

### 4.2 Root getters (index.js)

```js
isAuthenticated, authStatus, user, level, dID,
key, roomKey, paramKey, deviceKey, setpointKey,   // из settingsData.payload
showSetpoint,                                      // показана ли панель уставки
typeSettingsKey,      // из config/: 'schedules' | 'notifications' | 'statistics'
getSetpointsManager,  // объект ManageSetpoints
settingsDataLimits    // limits из settingsData
```

Геттер `idSettingsKey` **удалён** (ссылался на несуществующее поле).

Геттеры модулей, которыми пользуются компоненты:
`config/{getConfig, getConfigList, clearKeySync, isLoading, error, allRooms, allParams, allDevices, allSetpoints, getMobile, getDeviceType}`,
`sortParams/{getSensorTitle, getUnit, getRoomTitle, getParamTitle, ...}`,
`auth/{isAuthenticated, mustChangePassword, tokenExpiresAt}`,
`websocket/isConnected` (реактивный флаг, **не** `socket.readyState`),
`popup/{popupIsVisible, popupMessage, popupType, popupDuration}`, `dropdown/{isVisible, menuItems, anchorEl}`.

### 4.3 Новый функционал в store

- Новые **глобальные** мутации/геттеры/actions → `store/index.js`
- Новые **модульные** → отдельный файл в `store/modules/` + регистрация в `index.js`
- **Не изменять** сигнатуры существующих mutations/actions/getters — только расширять
- Новое поле `state` → соответствующий getter
- **Компоненты читают состояние только через getters/mapGetters.** Прямой `this.$store.state.*` запрещён
  (для списков настроек есть `config/getConfigList(configName, dID)`)
- Данные пользователя должны сбрасываться при выходе: новые user-bound поля обнулять в
  `RESET_SESSION_DATA` (root) или `config/RESET`; вызываются из `auth/clearSession`

### 4.4 ManageSetpoints (store/classes/manageSetpoints.js)

Класс управляет объектом `settingsData`:

```js
{
  name: dID,
  type: '',       // тип WebSocket-сообщения ('post')
  request: '',    // 'setpoints' | 'schedules' | 'notifications' | 'statistics'
  payload: {
    config: '',     // 'setpoints' (при создании) или тип настроек
    room: null,     // ключ комнаты: 'room01'
    param: null,    // ключ датчика: 'dTemp02'
    key: …,         // очищенный ключ: 'Temp' (добавляется через updatePayloadData)
    setKey: null,   // ключ уставки: 'sTemp02'
    device: null, clearKey: null,
    value: null, value_name: null, value_type: null,
    id: null,       // id комнаты / id элемента настроек
    updated: ''     // МСК-строка
  },
  limits: { limHigh, limLow, limStep, updated }
}
```

Взаимодействие — **только через store**: `updateSettingsData({field,value})`, `updatePayloadData(payload)`,
`updateLimitsData(limits)`, `resetSettingsData()`, `initializeSetpointsManager()`.

- **Создаётся в `App.vue`** (watch на `isAuthenticated`) → `initializeSetpointsManager`. Без этого вызова менеджер = `null`
  и выбор/изменение уставок молча не работает.
- Пересоздаётся только если `dID` изменился; при выходе уничтожается (`RESET_SESSION_DATA`)
- Поля payload, переживающие перезагрузку (пишутся в `localStorage` мутацией `UPDATE_PAYLOAD_DATA`):
  `room→roomKey`, `param→paramKey`, `device→deviceKey`, `setKey→setpointKey`, `clearKey→clearKey`

---

## 5. WEBSOCKET — ПРОТОКОЛ СООБЩЕНИЙ

### 5.1 Структура сообщений

```js
// Исходящее
{ type: 'get' | 'post' | 'auth', request: '<см. таблицу>', name: dID, payload: { ... } }

// Входящее
{ type: 'response' | 'post' | 'auth…', request: '…', name: dID, payload: { ... } }
```

| type | request (исходящие) | Назначение |
|------|--------------------|-----------|
| `get` | `config`, `schedules`, `notifications`, `statistics` | Запрос данных |
| `post` | `setpoints` | Изменение уставки (`settingsData.request`) |
| `post` | `addschedules` / `addnotifications` / `addstatistics` | Добавление элемента (`add${configName}`) |
| `post` | `delschedules` / `delnotifications` / `delstatistics` | Удаление; payload `{ room, param, Ids: [...] }` |
| `post` | `userConfigRequest` / `userConfigEdit` | Создание/правка конфигурации (мастер) |
| `auth` | `login`, `resume`, `refresh`, `changePassword`, `logout` | Авторизация |

Входящие auth-ответы: `loginSuccess` (и для `resume`), `loginError`, `resumeError`, `refreshSuccess`/`refreshError`,
`changePasswordSuccess`/`changePasswordError`, `authError`.
`accessError` с `payload.code`: `NO_SESSION` | `TIMEOUT` | `TOKEN_REVOKED` (→ разлогин) | `FORBIDDEN` (→ popup).
Push датчиков: `type:'post', request:'sensors', payload:{ room, item_name, item_value }`.

Коды клиентских ошибок (`error.code`): `TIMEOUT`, `NO_CONNECTION`, `SUPERSEDED` — это **сетевые** ошибки;
остальные коды приходят от сервера.

### 5.2 Маршрутизация входящих (websocket.js → handleMessage)

Порядок проверок:
1. **`settlePending`** — ответ на auth-запрос (`AWAIT_MAP`) резолвит/реджектит ожидающий промис
2. `request === 'accessError'` → `auth/handleAccessError`
3. `type === 'response'` → `config/handleConfigResponse`
4. `type === 'post'` → `config/handleValueUpdate` (только если `response.name === dID`)

### 5.3 Отправка данных

```js
// Единственный способ — action websocket/send
await this.$store.dispatch('websocket/send', { type, request, name, payload });

// Уставка — через config/updateSetpointServer (берёт settingsData менеджера; проверяет name === dID)
await this.$store.dispatch('config/updateSetpointServer');
```

- Для auth-запросов `send` возвращает **промис** с ответом (таймаут 15 с → `TIMEOUT`). Для остальных — `null`.
- Если сокет не открыт, `send` сам вызывает `connect` (таймаут 8 с → `NO_CONNECTION`).
- Конфигурация запрашивается через `config/requestConfig` — **промис**, который разрешается при приходе `response/config` (таймаут 10 с). Не использовать polling.

### 5.4 Подключение и переподключение

- Одно соединение: параллельные `connect()` разделяют один промис
- Авто-реконнект: **без лимита попыток**, задержка `1 с · 2ⁿ`, потолок 30 с, плюс джиттер до 0.5 с
- Немедленная попытка при событиях `online` и `visibilitychange → visible`
- После **повторного** подключения: `auth/resume` → `config/refreshConfig` (перезапрос config + schedules + notifications + statistics)
- При обрыве все ожидающие auth-запросы отклоняются с `NO_CONNECTION` (не ждут 15 с)
- Явное отключение: `websocket/disconnect` (`explicitDisconnect = true`, реконнект не планируется)
- `auth/resume` при сетевой ошибке **не** разлогинивает пользователя — только при ответе сервера

---

## 6. РОУТИНГ И АВТОРИЗАЦИЯ

### 6.1 Структура маршрутов (`createWebHistory('/app/')`)

| path | name | Компонент | meta |
|------|------|-----------|------|
| `/` | — | `MainView` (оболочка) | `requiresAuth`, `requiredLevel: 1` |
| `/` (child `''`) | `Home` | `MainBody` | наследует |
| `/settings/:settingsType` | `DashboardSettings` | `MainBodySettings` (`props: setting_Type`) | `requiresAuth`, `requiredLevel: 2` |
| `/configuration` | `Configuration` | `ConFiguration` | `public: true`; только если `VUE_APP_FEATURE_CONFIGURATION !== 'false'` |
| `/login` | `Login` | `AppLogin` | `public: true` |
| `/change-password` | `ChangePassword` | `ChangePassword` | `requiresAuth` |
| `/profile` | `AppProfile` | `AppProfile` | `requiresAuth`, `requiredLevel: 2` |
| `/access-denied` | `AccessDenied` | `AccessDenied` | — |
| `/:pathMatch(.*)*` | — | redirect → `/` | — |

`settingsType` ∈ `schedules` \| `notifications` \| `statistics`. Маршрутов `/dashboard`, `/smart-home`,
`/manufact-automatation`, `/users` **нет**.

### 6.2 Уровни доступа

| level | Доступ |
|-------|--------|
| 0 | Не авторизован |
| 1 | Просмотр главного экрана |
| 2 | Настройки, профиль |
| 3 | Зарезервирован (управление пользователями; маршрута сейчас нет) |

Проверка `requiredLevel` на клиенте — только UX. **Права обязан проверять сервер** (`accessError/FORBIDDEN`).

### 6.3 Навигационный гард (navigationGuard)

Порядок:
1. `meta.public` → `next()`; исключение: `Login` при авторизованном и без `mustChangePassword` → `next('/')`
2. Нет `requiresAuth` у matched → `next()`
3. Не авторизован → `localStorage.redirectPath = to.fullPath` → `next('/login')`
4. `mustChangePassword` и путь ≠ `/change-password` → `next('/change-password')`
5. `requiredLevel` = максимум по всем matched; `level < required` → `next('/access-denied')`
6. иначе `next()`

- **Не изменять** логику гарда — только расширять `meta`
- `redirectPath` перед использованием валидируется (`AppLogin.safeRedirect`: начинается с `/`, не с `//`)

### 6.4 Жизненный цикл сессии

- Токен и пользователь — `localStorage.authSession` (`{ token, user, dID, level, mustChangePassword }`). **Пароль не хранится.**
- Авто-продление JWT: `auth/scheduleRefresh` (≈75 % срока жизни, не чаще раза в минуту)
- Выход / `accessError` / отклонённый `resume` → `auth/clearSession`: чистит `authSession`, `authData` (старый), `roomKey`, `paramKey`, `deviceKey`, `setpointKey`, `clearKey`,
  `RESET_SESSION_DATA`, `config/RESET`, закрывает dropdown

---

## 7. КЛЮЧИ И ИДЕНТИФИКАТОРЫ

### 7.1 Структура конфигурации устройства

```
config = {
  init: { limits: { Default, Temp, Hum, Bool, hours, minutes, … } },   // служебный
  newConfigID, password,                                               // служебные
  room01: {
    id, title, group,                  // group — заголовок группы на главном экране
    _meta: { 'sensors|dTemp02': { title } },   // необязательные заголовки карточек
    sensors:   { dTemp02: { type:'num', value, lastUpdate }, … },
    system:    { … },                  // выводятся картой наравне с sensors
    setpoints: { sTemp02: { type, value }, … }   // карточек НЕ создают
  },
  room02: { … }
}
```

- Комнаты: ключ `room01`, `room02`, … (`/^room\d+$/`); всё остальное в корне — служебное
- Датчики: префикс `d` (`dTemp`, `dHum`, `dPress`, `dPower`, `dMove`, `dFire`, `dLeak`, `dBat`, `dVoltage`, `dFrequency`, `dEnergy`)
- Актуаторы: префикс `a` (`aLamp`, `aFan`, `aPump`, `aValve`, `aRelay`, `aActuator`, `aSwitch`, `aController`)
- Уставки: префикс `s` (`sTemp`, `sHum`, `sActuator`, `sSwitch`), `dCurSetpoint`
- **Числовой суффикс** (`02`) связывает датчик и уставку: `dTemp02 ↔ sTemp02`. Совпадение по номеру строгое (без `startsWith`).
  Нет парной уставки → карточка read-only
- Ключи с **кириллической «С»** (`dСurrent`, `notificationСhannel`) совпадают с серверными. **Не «исправлять» на латиницу**

### 7.2 Очистка ключей

```js
// sync getter-фабрика: убирает префикс (1 символ) и числовой суффикс
this.$store.getters['config/clearKeySync']('dTemp02');   // → 'Temp'
```

Action `config/clearKey` **удалён**.

### 7.3 Единицы измерения (sortParams → getUnit)

```
Temp → °C,  Hum → %,  Press → hPa,  Power → W,  Сurrent → A (кир. «С»),
Voltage → V,  Frequency → Hz,  Energy → kWh,  Bat → %
```

### 7.4 localStorage-ключи

```
authSession         ← { token, user, dID, level, mustChangePassword }     (чистится при выходе)
roomKey, paramKey, deviceKey, setpointKey, clearKey                        (чистятся при выходе)
groupingType        ← 'rooms' | 'params' | 'devices' — тип группировки главного экрана (UI-настройка, при выходе НЕ чистится)
typeSettingsKey     ← 'schedules' | 'notifications' | 'statistics'  (невалидное → 'schedules')
mobile_navigation   ← 'true' | 'false' (ручной выбор важнее user-agent)
redirectPath        ← путь для редиректа после логина
{dID}_{configName}  ← резервный кэш списка настроек, напр. {dID}_schedules
{configName}_config ← локальная копия конфигурации из мастера (ConFiguration)
```

`authData` (старый ключ) — только удаляется. Значения `'schedule'` (без «s») и `'setpoints'` в `typeSettingsKey` **недопустимы**.

---

## 8. КОМПОНЕНТНАЯ АРХИТЕКТУРА

### 8.1 MainView.vue — оболочка и оркестратор

- Родитель для всех экранов; управляет: `request`, `setpoint`, `selectedItemData`, показом панели уставки (`showSetpoint` из store)
- События `router-view`: `@getComponentData` → `getComponentData` (show/hide MainSetpoint), `@updateTypeValue` → `editValueMainSetpoint`
- События `MainSetpoint`: `@eventsMainSetpoint` и `@eventsSchedule` → `editValueMainSetpoint`; `@inactivity-timeout` → `handleSetpointInactivity`
- `editValueMainSetpoint` ветвится по `request`: `setpoints` | `schedules` / `notifications` | `statistics`
- `provide/inject`: `getMainSetpointEl` (клики по панели уставки не снимают выделение на экране настроек)
- `router-view :key="$route.fullPath"` — принудительный ре-рендер при смене маршрута
- **Отправка уставки на сервер — debounce 300 мс** (`sendChangedData`); `flushPendingUpdate` отправляет накопленное при размонтировании и автоскрытии (см. п. 16)
- Шапка: по центру `.header-center` — на маршруте `Home` вкладки `<GroupTabs>`, на остальных экранах заголовок `<h2>{{ headerTitle }}</h2>`
- Меню шапки: `Профиль`, `Выйти`, разделитель, переключатель `Десктоп/Мобильный` (actions `profile`, `logout`, `toggleMobile`)

### 8.2 Поток данных

```
Сервер
  ↓ WebSocket message
websocket.js → handleMessage → settlePending | accessError | …
  ↓ dispatch
config.js → handleConfigResponse / handleValueUpdate
  ↓ commit
Vuex state (configs, schedules, notifications, statistics)
  ↓ реактивность
MainBody.vue → computed groupedView  (+ «часы» now каждые 30 с для «N мин назад»)
  ↓ render
MainBodyValue.vue (карточка)
  ↓ @click (одинарный — выбор, двойной — настройки; окно 300 мс)
MainBody.vue → emit('getComponentData')
  ↓
MainView.vue → getComponentData / editValueMainSetpoint
  ↓ dispatch
store actions → websocket/send
  ↓
Сервер
```

### 8.3 Инициализация приложения

Порядок **не менять**:

1. `main.js`: `initializeStore` — восстановить сессию из `localStorage.authSession`
2. `main.js` (только если есть токен, не дольше 6 с): `websocket/connect` → `auth/resume`
   (ошибка/таймаут не блокируют старт; сеть недоступна → сессия сохраняется, WS переподключается в фоне)
3. `main.js`: `app.use(router)` → `app.mount('#app')`
4. `App.vue` (watch `isAuthenticated`, `immediate`): `initializeSetpointsManager` → `config/initialize`
   (срабатывает и при старте с восстановленной сессией, и при входе без перезагрузки)

Авто-логина по сохранённому паролю **нет** (пароль не хранится). Раньше его выполнял `App.mounted`.

### 8.4 MainBody.vue

- `groupedView` — **computed** (раньше снимок по `forceUpdate`): данные по WS обновляются сразу
- Тип группировки — **только** из store: геттер `sortParams/currentSortType` (`rooms` \| `params` \| `devices`). Локального состояния вкладок в `MainBody` нет; переключение вкладок пересчитывает `groupedView` автоматически
- Группа (режим `rooms`) = комната `roomNN`; заголовок: `room.group` → `room.title` → `roomKey`; группы по `roomKey`, секции `sensors` → `system`
- Идентификатор карточки: `roomKey|sectionKey|paramKey` (`itemId`); выбор сравнивается **по ключу**, не по ссылке
- Нет данных → в карточке «—» (раньше `0.0` / `OFF`)
- Двойной клик без уставки → popup «Уставка … не настроена»; тип настроек по умолчанию `'schedules'`
- Ничего не писать в `localStorage` из рендера

### 8.5 MainBodySettings.vue (+ Schedule / Notifications / Statistic)

- Источник типа — параметр маршрута (`setting_Type`); переключение заголовка (`cycleTitle`) локальное
- Списки грузятся действием `settingsConfig/getConfigDataFromStore`; обновление — по `config/getConfigList(title, dID)` (deep-watch только по своему срезу)
- **Удаление отложенное**: элементы копятся в `pendingDeletes` и отправляются при закрытии экрана или размонтировании (`flushDeletions`, группировка по тип+комната+параметр)
- **Добавление**: проверка лимита (`config/checkLimitBeforeAdd`) → подбор времени (`generationTime`, без пересечений) →
  оптимистично в store (`addConfigLocally`) → `saveConfigItems` → при ошибке откат (`config/removeConfigItemsLocally`)
- Новый `id` = max(существующие ∪ ожидающие удаления) + 1
- Выделение поля: дочерние компоненты шлют `field-selected` с **разными ключами** (`scheduleId` / `notificationId` / `statisticId`) — родитель хранит объект целиком
- Закрытие: `router.back()` только если `history.state.back` есть, иначе `router.push('/')`

### 8.6 MainSetpoint.vue

- Значение — локальное (`newSetPointValue`), синхронизируется с пропом `setPoint` (родитель — источник истины, в т.ч. при откате)
- Шаг округляется до точности шага (`decimalsOf(step)`, максимум 4 знака) — нет накопления float-ошибки
- Выход за границу → переход на противоположный край
- Таймер бездействия 8 с → `inactivity-timeout` (запуск **идемпотентен**: старый таймер всегда сбрасывается)
- Лимиты — из геттера `settingsDataLimits` (дефолты 5 / 36 / 1)

### 8.6.1 Иконки

```vue
<SensorIcon name="dTemp02" />                                  <!-- по ключу конфигурации -->
<SensorIcon name="dFire" :state="isAlarm ? 'alarm' : 'ok'" />  <!-- цвет по состоянию -->
<SensorIcon name="aFan" color="var(--green)" :size="32" title="Вентиляция" />
```

- Иконки — контуры на сетке 24×24, `stroke="currentColor"`: цвет = CSS `color` (prop `color`, класс состояния `ok|warn|alarm|off` или наследование)
- Корневой `<svg>` имеет класс `.sensor-svg` и модификаторы `.sensor-svg--ok|warn|alarm|off` (класс `.sensor-icon` занят подложкой плашки датчика)
- Акцентные детали (мишень уставок, пламя, «!», шкала вентилятора) — класс `.si-accent`, цвет `--icon-accent` (по умолчанию `--orange`; prop `accent`)
- Новая иконка: `<g id="si-<имя>">` в `SensorIconSprite.vue` + запись в `utils/sensorIcons.js`. Ключ с кириллической «С» (`dСurrent`) нормализуется автоматически
- Неизвестный ключ → иконка `unknown` («?»)
- Не использовать `v-html` для иконок; не монтировать спрайт повторно (дубли `id`)

### 8.7 Popup и Dropdown

```js
this.$store.dispatch('popup/show', { message, type: 'info'|'success'|'warning'|'error', duration: 3000 });
this.$store.dispatch('dropdown/show', { items: [{ label, action } | { divider: true }], anchorElement });
```

- Таймер закрытия popup — в `store/modules/popup.js` (новый popup перезапускает отсчёт); `duration: 0` — не закрывать
- `App.vue` обрабатывает действия меню: `profile`, `logout`, `toggleMobile`. Неизвестный action → `logger.warn`
- Пункт меню без обработчика **не добавлять**

---

## 9. СОРТИРОВКА И ВЫБОР — sortParams.js

### 9.1 Типы ключей

`'rooms'` | `'params'` | `'devices'` | `'setpoints'` (+ `'key'` для сброса `clearKey`)

### 9.2 Переключение и обновление

```js
dispatch('sortParams/switchSortKey', { sortingType: 'rooms', direction: 'next' | 'prev' })
dispatch('sortParams/updateSortKey', { type: 'rooms', newKey: 'room01' })   // newKey: null → сброс
```

`updateSortKey` пишет в `settingsData.payload` (через `updatePayloadData`) и в `localStorage`.
Невалидный сохранённый ключ при старте сбрасывается в `config/ensureSortingKeys`.

### 9.2.1 Группировка главного экрана

- Вкладки описаны в `sortParams` (`GROUPING_TABS`, геттер `groupingTabs`); новый режим = запись в `GROUPING_TABS` (id ∈ `KEY_TYPES`) + ветка группировки в `MainBody.groupedView`
- Переключение: `dispatch('sortParams/setSortType', id)`; выбор пишется в `localStorage.groupingType`

### 9.3 forceUpdate

`SET_FORCE_UPDATE` по-прежнему коммитится, но **`MainBody` на него не подписан** (обновляется через computed).
Не полагаться на `forceUpdate` для перерисовки.

### 9.4 Лимиты уставок (`sortParams/setLimits`)

- Источник: `config.init.limits[param]` → `config.init.limits.Default` → `{ low: 4, high: 40, step: 0.5 }`
- Особые: `frequency` `{0, 1440, 1}`, `sensityRate` `{0.1, 12, 0.1}`
- Значения приводятся к числам (в конфиге встречаются булевы)
- `valueType === 'deviation'` → `±round(high/4)`, шаг `step/10`
- `UPDATE_LIMITS`: проверка `!== undefined` (0 — валидный лимит)

---

## 10. НАСТРОЙКИ — settingsConfig.js / config.js

### 10.1 Типы конфигурации (typeSettingsKey)

`'schedules'` | `'notifications'` | `'statistics'` — хранится в `config.state.typeSettingsKey` и `localStorage`.
`'setpoints'` — это **request** уставок, а не тип экрана настроек.
Любое другое значение нормализуется в `'schedules'` (`config/SET_TYPE_SETTINGS_ITEM`).

### 10.2 Мутации и данные

- Константы `MUTATION_TYPES` **не используются**: мутации называются прямо (`SET_LOADING`, `SET_ERROR`, `SET_PERMIT_*`)
- Данные списков живут в `config`: `state.schedules[dID][room][param] = [ … ]` (аналогично `notifications`, `statistics`)
- Мутации списков: `UPDATE_CONFIGDATA_LOCALLY`, `REMOVE_CONFIG_ITEMS`, `UPDATE_{SCHEDULE|NOTIFICATION|STATISTIC}_VALUE`
- `config/RESET` — полный сброс данных пользователя

### 10.3 Формы элементов

```js
// schedule
{ id, room, param, startTime, endTime, value, value_type:'absolute', unit, days:[1..5], createdAt, updatedAt }
// notification
{ id, room, param, condition, value, notificationСhannel, frequency, permission, status, startTime, endTime, createdAt, updatedAt }
// statistic
{ id, room, param, value, setpoint, devSetpoint, changeSeason, savePeriod, sensityRate, createdAt, updatedAt }
```

Время — строка `"HH:MM"`; даты `createdAt`/`updatedAt` — МСК-строка.

### 10.4 Пересечения времени

`checkOverlap` (mode `new`): при пересечении предлагает слот после последнего интервала; нет места до `23:59` → `newStartTime = null` и `message`
(вызывающий код **обязан** это обработать, а не создавать элемент с исходным временем). `edit`: подгоняет редактируемое поле к границе соседа.

---

## 11. ОБРАБОТКА ЗНАЧЕНИЙ И ВРЕМЯ

### 11.1 Типы значений (value_type)

- `'absolute'` — абсолютное значение
- `'deviation'` — отклонение от уставки
- Отображение карточки: `toFixed(1)`; `null/undefined` → «—»
- Точность редактирования — по шагу (п. 8.6), а не фиксированный `toFixed`

### 11.2 Типы запросов (request) в MainView

`setpoints` | `schedules` / `notifications` | `statistics`

### 11.3 Время

- Обмен с сервером — **московская строка** `"DD.MM.YYYY, HH:MM:SS"` (`nowMoscow()`)
- `parseMoscowDate` интерпретирует строку как МСК (UTC+3, без DST) **независимо от часового пояса устройства**
- `formatDate` показывает время/дату **по МСК**
- Время суток — `"HH:MM"`, функции `timeToMinutes` / `minutesToTime` (диапазон 0–1439; невалидное → `0` / `'00:00'`)
- `formatTimeWithHighlight` возвращает HTML для `v-html` и **экранирует** вход (строки времени приходят с сервера)

---

## 12. НОВЫЙ ФУНКЦИОНАЛ — ЧЕКЛИСТ

- [ ] Options API; события объявлены в `emits`
- [ ] `logger.*` вместо `console.log`; формат префиксов; секреты не логируются
- [ ] Новые WebSocket-сообщения следуют п. 5.1; запросы к серверу `await`-ятся, ошибки показываются пользователю
- [ ] Новые ключи конфигурации — по п. 7.1
- [ ] Новые store-поля — с getter'ом; user-bound данные сбрасываются при выходе (п. 4.3)
- [ ] Компонент читает store только через getters
- [ ] Новые маршруты с ограничением — `meta.requiresAuth` + `meta.requiredLevel`; права дублируются на сервере
- [ ] Уставки — только через ManageSetpoints / store actions
- [ ] Отправка на сервер — только через `websocket/send`
- [ ] Таймеры/слушатели (`setTimeout`, `setInterval`, `addEventListener`) освобождаются в `beforeUnmount`
- [ ] Запуск таймера идемпотентен (сначала `clearTimeout`)
- [ ] Стили — только в `mainStyle.css` в нужной секции, без `<style>` в компоненте (п. 15)
- [ ] Новые тексты ошибок для пользователя — через `popup/show`
- [ ] Для изменённых модулей обновлены/добавлены тесты (п. 14)

---

## 13. ЗАПРЕЩЕНО

- ❌ Переписывать компоненты на Composition API / `<script setup>`
- ❌ Мутировать `state` вне mutations
- ❌ Обращаться к `store.state` из компонентов (только getters/mapGetters)
- ❌ Создавать WebSocket-соединения в обход `websocket.js`
- ❌ Менять структуру сообщений протокола (п. 5.1) без согласования с сервером
- ❌ Менять порядок инициализации (п. 8.3)
- ❌ Активные `console.log` (только `logger.*`)
- ❌ Менять сигнатуры существующих actions/mutations/getters
- ❌ Хранить ключи выбора иначе, чем через `updatePayloadData` + `localStorage` (п. 4.4)
- ❌ Менять логику навигационного гарда (только расширять `meta`)
- ❌ `window.location.href` для внутренней навигации
- ❌ Хранить пароль или писать токен/пароль/`configData` в лог
- ❌ `<style>` (scoped или нет) в компонентах; повторный импорт `mainStyle.css` из компонентов
- ❌ Переименовывать ключи с кириллической «С» без синхронной правки сервера
- ❌ Опираться на отсутствие данных как на `0` / `OFF` (использовать `null` → «—»)

---

## 14. ТЕСТИРОВАНИЕ

### 14.1 Стек

| Слой | Инструмент |
|------|-----------|
| Test runner | Jest |
| Vue-компоненты | `@vue/test-utils` + `jest-environment-jsdom` |
| Покрытие | `jest --coverage` |
| Расположение | `src/tests/unit/` |

### 14.2 Именование

```
src/tests/unit/
  router.spec.js
  store/        auth.spec.js  config.spec.js  settingsConfig.spec.js  websocket.spec.js  sortParams.spec.js
  utils/        timeUtils.spec.js  checkOverlap.spec.js  jwt.spec.js
  components/   AppLogin.spec.js  MainBody.spec.js
```

Имя файла = имя модуля + `.spec.js`.

### 14.3 Структура тест-файла

```js
// 1. Глобальные моки ДО импортов
const localStorageMock = { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn(), clear: jest.fn() }
global.localStorage = localStorageMock

// 2. Импорты
// 3. describe по функциональным группам; beforeEach сбрасывает моки
```

### 14.4 Правила

- Название: «что происходит» при «условии» (`'перенаправляет на /login если не аутентифицирован'`)
- Граничные случаи обязательны: числа (0, max, min, −1), уровни доступа (каждый level × каждый requiredLevel), время (`'00:00'`, `'23:59'`, невалидные), `null/undefined`
- Побочные эффекты проверять в обе стороны (`toHaveBeenCalledWith` и `not.toHaveBeenCalled`)
- Один тест — одна проверяемая вещь

### 14.5 Мокирование

`jest.doMock` + `jest.resetModules()` + `require` после мока. Реальный `store` в юнит-тестах гарда/утилит не импортировать.

Особенности текущего кода:
- **`websocket.js` держит состояние на уровне модуля** (`pending`, `connectPromise`, таймеры) → `jest.resetModules()` перед каждым тестом, `jest.useFakeTimers()`
- В jsdom нет рабочего `WebSocket` → мокать глобальный `WebSocket` (поля `readyState`, `send`, `close`, `onopen/onclose/onmessage`)
- `logger.js` читает `process.env` при импорте → задавать `VUE_APP_LOG_LEVEL` до `require`
- `auth.js` использует динамический `import('@/router/routes.js')` → мокать через `jest.doMock('@/router/routes.js', …)`

### 14.6 Роутер — обязательный минимум

- [ ] Маршрут есть в `router.getRoutes()` по `name` (`Home`, `DashboardSettings`, `Configuration`, `Login`, `ChangePassword`, `AppProfile`, `AccessDenied`)
- [ ] `meta` соответствует таблице п. 6.1
- [ ] Публичный: `meta.public === true`, `requiresAuth` отсутствует

Ветки `navigationGuard`:
- [ ] `public` → `next()`, `localStorage` не вызывается
- [ ] `Login` + авторизован + без `mustChangePassword` → `next('/')`
- [ ] `!isAuthenticated` → `next('/login')` + `setItem('redirectPath', …)`
- [ ] `mustChangePassword` → `next('/change-password')`
- [ ] `level < requiredLevel` → `next('/access-denied')`
- [ ] `level >= requiredLevel` → `next()`
- [ ] Без `requiresAuth` и без `public` → `next()`

### 14.7 Утилиты

```js
import { timeToMinutes, parseMoscowDate } from '@/utils/timeUtils'

test.each([['14:30', 870], ['00:00', 0], ['23:59', 1439], ['', 0], [null, 0], ['99:99', 0]])
('timeToMinutes(%p) === %i', (input, expected) => expect(timeToMinutes(input)).toBe(expected))

// МСК = UTC+3: результат не должен зависеть от TZ окружения
test('parseMoscowDate: 21:22:38 МСК = 18:22:38 UTC', () => {
  expect(parseMoscowDate('03.06.2026, 21:22:38')).toBe(Date.UTC(2026, 5, 3, 18, 22, 38))
})
```

Запускать тесты времени минимум в двух зонах (`TZ=UTC` и `TZ=America/New_York`).
Функции `getCurrentDateTime`, `getCurrentTimeString`, `validateScheduleTime` и `checkStartTimeOverlap/checkEndTimeOverlap` **удалены** — удалить и их тесты.

### 14.8 Чеклист нового теста

- [ ] Файл `*.spec.js` по п. 14.2
- [ ] Покрыты все ветки `if/else`; граничные значения
- [ ] Побочные эффекты (`localStorage`, `dispatch`, `commit`) проверены явно
- [ ] `test.each` для параметрических случаев
- [ ] Моки и таймеры сбрасываются в `beforeEach`
- [ ] Реальный Vuex store не импортируется напрямую

---

## 15. СТИЛИ — assets/mainStyle.css

- **Единственный** файл стилей; подключается **один раз** в `main.js` (`import '@/assets/mainStyle.css'`)
- В компонентах **нет** `<style>` (ни `scoped`, ни `src`). Новый стиль → в нужную секцию `mainStyle.css`
- Секции: 1 Переменные · 2 База · 3 Каркас · 4 Главный экран · 5 Иконки · 6 Панель уставки · 7 Popup/Dropdown ·
  8 Формы/авторизация · 9 Настройки · 10 Мастер конфигурации (`cfg-*`) · 11 Медиа-запросы · 12 LEGACY
- Цвета, тени — только через переменные `:root` (`--orange`, `--header_color`, `--shadow-card`, …)
- Сетка карточек управляется переменными на `.mainBody`: `--card-min` (мин. ширина плашки), `--card-max` (макс. ширина — плашки не растягиваются), `--card-gap`; значения меняются в `@media`. Сетка группы комнат — `.room-group-items` (`auto-fill`, `minmax(var(--card-min), 1fr)`, карточки прижаты влево)
- Фон: задаётся на `.app` (градиент-затемнение + `assets/bg-main.webp`, подключается через `url('~@/assets/…')`); слои `.body`, `.footer`, `.mainBody` — `transparent`, поверх них фон не рисовать. `background-attachment: fixed` плохо работает на iOS Safari — при проблемах заменить на `position: fixed` псевдоэлемент
- Плашка датчика: `.sensor-card` → `.sensor-icon-wrapper` → `.sensor-icon` (круглая подложка) + `.sensor-content` (`.sensor-title`, `.sensor-values`, `.sensor-set-value`, `.sensor-actual-value`, `.unit`). Сама иконка — компонент `<SensorIcon>` с классом **`.sensor-svg`** (не `.sensor-icon`!), размер задавать `size="60%"` или в px
- Экран уставки: `.setpoint-screen` (+ `.setpoint-header`, `.setpoint-outer-ring`, `.setpoint-inner-circle`, `.setpoint-btn`, …). Старые `.setpointBlock` / `.setpoint-overlay` оставлены до подтверждения, что они не используются
- Брейкпоинты: `376px` → `630px` → `980px` → `1200px`, затем `landscape ≤979px`, затем `≤400px`.
  **Порядок блоков важен** — более поздние переопределяют ранние. Не выносить `@media` внутрь секций
- Не вкладывать обычные правила внутрь `@media` «для удобства» (так `cfg-*` когда-то перестали работать на узких экранах)
- Шапка: `.header-center` (обязателен `min-width: 0`), вкладки группировки — `.group-tabs` / `.group-tab` / `.group-tab.active`
- Общие статусные классы: `.error`, `.success`, `.warning`, `.hint`
- `touch-action: manipulation` задаётся одним списком селекторов в секции «База» — новые кликабельные элементы добавлять туда
- Секция LEGACY — классы, не найденные в загруженных компонентах; после проверки `grep -rn` удалить
- Динамически собираемые классы (`popup-${type}`) и классы vue-router (`router-link-exact-active`) **не удалять** как «неиспользуемые»
- Именование: `kebab-case`; исторические исключения (`setpointValue_number`, `sensor-SetValue`) не переименовывать без правки шаблонов

---

## 16. РАСХОЖДЕНИЯ И ОТКРЫТЫЕ ВОПРОСЫ

| # | Что | Решение нужно |
|---|-----|---------------|
| 1 | Задержка отправки уставки: в прежних правилах **2500 мс**, в коде `MainView.sendChangedData` — **300 мс** | Какое значение верно? Если 2500 — поправить код; п. 8.1 описывает текущие 300 |
| 2 | `AppProfile.vue` на Composition API (`ref`, `computed`, `useStore`, `useRouter`) — нарушает п. 3.1 | Переписать на Options API или оформить исключение |
| 3 | `MainBodySchedule.vue` не объявляет `emits` | Добавить `emits: ['getDataScheduleItem', 'field-selected', 'delete-schedule']` |
| 4 | Файл `MainFooter.vue` импортируется из `ConFiguration.vue`, но не был доступен | Проверить существование и стили (`header_arrow`, `icon.big` и др. из LEGACY могут быть оттуда) |
| 5 | Мастер `ConFiguration` кладёт `password` в JSON конфигурации; при пустом `userConfigID` пароль по умолчанию `'newConfig'` | Убедиться, что сервер хеширует и принуждает `mustChangePassword` |
| 6 | Подпись «1 месяц» у значения 302400 мин в `MainBodyStatistic` (это 210 дней; месяц = 43200) | Уточнить ожидание сервера |
| 7 | Классы шаблонов без CSS-правил: `hover-bg`, `settings-info-value`, `frequency-wrapper`, `frequency-unit`, `mainBodySettings-title-container`, `loading`, `statistic-checkbox-field` (его `<style scoped>` был закомментирован) | Добавить стили или убрать классы |
| 8 | `.sensor-card` не реагирует на hover: прежнее правило `.mainBodyValue:hover` указывало на несуществующий класс | Нужен ли hover-эффект? |
| 9 | Старые тесты могут ссылаться на удалённые экспорты `timeUtils`/`checkOverlap` и на прежнее поведение `parseMoscowDate` | Прогнать `jest`, обновить (п. 14.7) |
| 10 | В CSS есть `.setpoint-screen…` (новый экран уставки) и новая плашка датчика (`.sensor-icon-wrapper`, `.sensor-content`…): версии `MainSetpoint.vue` и `MainBodyValue.vue` под эту вёрстку мной не проверялись, п. 8.6 описывает прежнюю панель | Прислать актуальные файлы для сверки документа |
| 11 | Серверная часть (Express/WS-обработчики) в ревизию не входила; протокол п. 5.1 восстановлен по клиентскому коду | Описать серверные обработчики отдельным разделом |

---

## 17. ЖУРНАЛ РЕВИЗИИ (22.10.2026): что исправлено в этом документе

| Раздел | Было | Стало |
|--------|------|-------|
| 2 | `DashBoard.vue`, `AppPlace`, `MainHeader`, `UserConfig`, `InputDialog`; `tests/` в двух местах | Реальный список компонентов; `MainView`, `TopNav`, `MenuDropdown`, `ChangePassword`, `MainBodyNotifications`; `popup`/`dropdown` модули; `utils/*` |
| 3.2 | Три уровня логов; ошибки зависели от уровня | Пять уровней; `error` печатается всегда; запрет логировать секреты |
| 4 | Мутации `SET_ROOM_KEY` и др.; геттер `idSettingsKey` | Фактические мутации/actions/getters; запрет `store.state` в компонентах |
| 5.1–5.2 | Минимум типов запросов; нет `accessError`, `settlePending` | Полная таблица протокола, порядок маршрутизации |
| 5.4 | «до 8 попыток» | Бесконечный реконнект с потолком 30 с, авто-`resume`, `refreshConfig` |
| 6 | `/dashboard`, `/smart-home`, `/users`; `IntroduceHome` | `/`, `/settings/:settingsType`, `/configuration`, `/change-password`; base `/app/`; шаги гарда с `mustChangePassword` |
| 7.1 | Комнаты `rRoom1` | `room01`, структура `group/_meta/sensors/system/setpoints`, парный номер датчик↔уставка |
| 7.2 | `config/clearKey` action; `dTemp1 → dTemp` | Только getter `clearKeySync`: `dTemp02 → Temp` |
| 7.4 | `authData`; `typeSettingsKey = 'schedule'` | `authSession`; допустимы `schedules/notifications/statistics`; список очищаемых при выходе |
| 8.1 | События `@eventsMainBody`, `@swipe-*`, `handleMainBodyEvent`; отправка 2500 мс | Фактические события; 300 мс (расхождение — п. 16) |
| 8.3–8.4 | `App.mounted` с авто-логином по паролю; `DashBoard.created` создаёт менеджер | `main.js` + watch в `App.vue`; пароль не хранится; менеджер создаётся в `App.vue` |
| 9.3 | `MainBody` следит за `forceUpdate` | `computed`, `forceUpdate` не используется |
| 10.1–10.2 | `'schedule'`, `'setpoints'`; `MUTATION_TYPES` | `'schedules'`; мутации без констант |
| 11 | Округление `.toFixed(1/3/0)` | Точность по шагу; `null → «—»`; МСК-время независимо от TZ |
| 12–13 | Запрет менять `App.mounted` | Запреты на `window.location`, секреты в логах, `<style>` в компонентах, кириллические ключи |
| 14 | Пример теста `redirectPath = '/dashboard'`; `tests/` | Актуальные маршруты и ветки гарда; особенности мокирования `websocket.js`; тест `parseMoscowDate` |
| 15, 16, 17 | — | Новые разделы: стили, расхождения, журнал |
