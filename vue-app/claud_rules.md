# ПРАВИЛА РАБОТЫ С ПРОЕКТОМ SmartHome / ManufactAutomation

> Этот документ описывает архитектуру проекта и обязательные правила для внесения изменений.
> **Цель**: улучшение, оптимизация и новый функционал — без нарушения существующей архитектуры.

---

## 1. СТЕК И ВЕРСИИ

| Слой | Технология |
|------|-----------|
| Frontend framework | Vue 3 (Options API) |
| State management | Vuex 4 (namespaced modules) |
| Router | Vue Router 4 |
| Backend | Node.js + Express.js |
| Real-time | WebSocket (нативный API) |
| Стиль компонентов | Options API — **не переводить на Composition API** |

---

## 2. СТРУКТУРА ПРОЕКТА

### 2.1 Файловая структура (Store)

```
src/store/
  index.js                  ← Корневой стор, root state, root getters/mutations/actions
  classes/
    manageSetpoints.js      ← Класс ManageSetpoints (управление уставками)
  modules/
    auth.js                 ← Аутентификация (namespaced: auth/)
    websocket.js            ← WebSocket-соединение (namespaced: websocket/)
    config.js               ← Конфигурация устройства (namespaced: config/)
    sortParams.js           ← Параметры сортировки и ключи (namespaced: sortParams/)
    settingsConfig.js       ← Расписания/уведомления/статистика (namespaced: settingsConfig/)
    log.js                  ← Логирование ошибок (namespaced: log/)
    logger.js               ← Утилита логирования (НЕ Vuex-модуль, просто экспорт)
```

### 2.2 Компоненты

```
src/
  App.vue                   ← Точка входа: инициализация store, WS, авто-логин
  DashBoard.vue             ← Главный layout: header, router-view, footer
  components/
    MainBody.vue            ← Список значений (сортировка по комнатам/параметрам/устройствам/уставкам)
    MainBodyValue.vue       ← Карточка одного значения
    MainBodySettings.vue    ← Настройки (расписание / уведомления)
    MainBodySchedule.vue    ← Компонент расписания
    MainBodyStatistic.vue   ← Компонент статистики
    MainSetpoint.vue        ← Футер-компонент изменения уставки (touch/swipe)
    AppPlace.vue            ← Плашка главного меню
    MainHeader.vue          ← Шапка
    MainFooter.vue          ← Подвал
    AppLogin.vue            ← Логин
    AppProfile.vue          ← Профиль пользователя
    UserConfig.vue          ← Управление пользователями (level 3)
    AccessDenied.vue        ← Страница запрета доступа
```

---

## 3. СТИЛЬ КОДА

### 3.1 Vue-компоненты — только Options API

```js
// ✅ ПРАВИЛЬНО
export default {
  name: 'ComponentName',
  components: { ... },
  props: { ... },
  data() { return { ... } },
  computed: { ...mapGetters(...) },
  methods: { ... }
}

// ❌ ЗАПРЕЩЕНО — не использовать Composition API / <script setup>
```

### 3.2 Логирование — только через logger.js

```js
import logger from '../store/modules/logger.js';  // в компонентах
import logger from './logger';                     // в store-модулях

// Уровни:
logger.info('[ModuleName] - methodName - Сообщение');   // общая информация
logger.dev('[ModuleName] - methodName - Сообщение');    // детальная отладка
logger.error('[ModuleName] - methodName - Сообщение');  // ошибки

// ❌ ЗАПРЕЩЕНО оставлять активные console.log в продакшн-коде
// Закомментированные console.log допустимы рядом с logger-вызовами (существующий паттерн)
```

### 3.3 Формат префиксов в логах

Строго соблюдать паттерн: `[ИмяМодуля] - имяМетода - Описание`

```js
logger.info('[DashBoard] - editValueMainSetpoint - Обработка запроса setpoints');
logger.error('[config] - requestConfig - Ошибка запроса:', error);
```

---

## 4. VUEX — ПРАВИЛА РАБОТЫ СО СТОРОМ

### 4.1 Структура модулей

- **Все модули** объявлены с `namespaced: true`
- Обращение к namespaced модулям: `'auth/login'`, `'websocket/send'`, `'config/initialize'`, `'sortParams/updateSortKey'`, `'settingsConfig/...'`, `'log/addError'`
- Root-level мутации (без namespace): `SET_ROOM_KEY`, `SET_PARAM_KEY`, `SET_DEVICE_KEY`, `SET_SETPOINT_KEY`, `INIT_SETPOINTS_MANAGER`, `UPDATE_SETTINGS_DATA`, `RESET_SETTINGS_DATA`, `UPDATE_PAYLOAD_DATA`, `UPDATE_LIMITS_DATA`

### 4.2 Root getters (index.js)

```js
isAuthenticated, authStatus, user, level, dID,
roomKey, paramKey, deviceKey, setpointKey,
typeSettingsKey,      // из config/
idSettingsKey,        // из settingsConfig/
getSetpointsManager,  // объект ManageSetpoints
settingsDataLimits    // limits из settingsData
```

### 4.3 Новый функционал в store

- Новые **глобальные** мутации/геттеры/actions → добавлять в `store/index.js`
- Новые **модульные** → создавать отдельный файл в `store/modules/` и регистрировать в `index.js`
- **Не изменять** сигнатуры существующих mutations/actions/getters — только расширять
- При добавлении нового поля в `state` — также добавлять соответствующий getter

### 4.4 ManageSetpoints (store/classes/manageSetpoints.js)

Класс управляет объектом `settingsData` со структурой:
```js
{
  name: dID,
  type: '',       // тип WebSocket-сообщения
  request: '',    // 'setpoints' | 'schedules' | 'notifications' | 'statistics'
  payload: {
    config: '',   // тип конфигурации
    room: null,   // ключ комнаты
    param: null,  // ключ параметра/уставки
    value: null,
    id: null,
    updated: ''   // timestamp в московском времени
  },
  limits: {
    limHigh, limLow, limStep, updated
  }
}
```

Взаимодействие с классом — **только через store actions/mutations**:
- `updateSettingsData({ field, value })` — обновить поле
- `updatePayloadData(payload)` — обновить payload частично
- `updateLimitsData(limits)` — обновить лимиты
- `resetSettingsData()` — сбросить payload
- `initializeSetpointsManager()` — инициализировать класс

---

## 5. WEBSOCKET — ПРОТОКОЛ СООБЩЕНИЙ

### 5.1 Структура сообщений

```js
// Исходящее сообщение
{
  type: 'get' | 'post' | 'auth',   // тип операции
  request: 'config' | 'setpoints' | 'schedules' | 'notifications' | 'statistics' | 'login',
  name: dID,                        // идентификатор устройства/пользователя
  payload: { ... }
}

// Входящее сообщение
{
  type: 'response' | 'post',
  request: 'config' | 'setpoints' | 'schedules' | ...,
  name: dID,
  payload: { ... }
}
```

### 5.2 Маршрутизация входящих сообщений (websocket.js → handleMessage)

```
type === 'response'  →  config/handleConfigResponse
type === 'post'      →  config/handleValueUpdate (только если dID совпадает)
request === 'loginSuccess' + pendingResponse  →  resolve Promise авторизации
```

### 5.3 Отправка данных

```js
// Через action websocket/send — единственный способ
await this.$store.dispatch('websocket/send', { type, request, name, payload });

// Отправка уставки на сервер — через config/updateSetpointServer
await this.$store.dispatch('config/updateSetpointServer');
// (берет данные из store.state.setpointsManager.settingsData автоматически)
```

### 5.4 Переподключение

- Авто-реконнект: до `MAX_RECONNECT_ATTEMPTS = 8` попыток с экспоненциальной задержкой
- Явное отключение: `websocket/disconnect` (устанавливает `explicitDisconnect = true`)

---

## 6. РОУТИНГ И АВТОРИЗАЦИЯ

### 6.1 Структура маршрутов

```
/                         → IntroduceHome (public)
/dashboard                → DashBoard (requiresAuth, level >= 1)
  /dashboard/sort/:sortType      → MainBody.vue (props: sortType)
  /dashboard/settings/:settingsType → MainBodySettings.vue (requiresAuth, level >= 2)
/smart-home               → SmartHome (level >= 1)
/manufact-automatation    → ManufactAutomatation (level >= 1)
/login                    → AppLogin (public)
/profile                  → AppProfile (level >= 2)
/users                    → UserConfig (level >= 3)
/access-denied            → AccessDenied
```

### 6.2 Уровни доступа

| level | Доступ |
|-------|--------|
| 0 | Не авторизован |
| 1 | Просмотр dashboard |
| 2 | Настройки, профиль |
| 3 | Управление пользователями |

### 6.3 Навигационный гард (navigationGuard)

- Маршруты с `meta.public: true` — пропускает без проверки
- Проверяет `meta.requiresAuth` + `meta.requiredLevel` через `store.getters`
- Незавершенный редирект сохраняется в `localStorage.redirectPath`
- **Не изменять** логику гарда — только расширять meta-поля

---

## 7. КЛЮЧИ И ИДЕНТИФИКАТОРЫ

### 7.1 Именование ключей конфигурации

```
Комнаты:    rRoom1, rRoom2, ... (prefix 'r')
Датчики:    dTemp, dHum, dPress, dPower, dMove, dFire, dLeak, dBat, dVoltage, dFrequency, ...
Актуаторы:  aLamp, aFan, aPump, aValve, aRelay, aActuator, aSwitch, aController
Уставки:    sTemp, sHum, sActuator, dCurSetpoint
```

### 7.2 Очистка ключей

Числовые суффиксы убираются при нормализации: `dTemp1` → `dTemp`

```js
// В store доступны два способа:
this.$store.dispatch('config/clearKey', { key });   // async action
this.$store.getters['config/clearKeySync'](key);    // sync getter-фабрика
```

### 7.3 Единицы измерения (sortParams.js → getUnit)

```
Temp → °C,  Hum → %,  Press → hPa,  Power → W,
Сurrent → A,  Voltage → V,  Frequency → Hz,  Energy → kWh,  Bat → %
```

### 7.4 localStorage-ключи

```
authData         ← { token, user, dID, level }
roomKey          ← текущий ключ комнаты
paramKey         ← текущий ключ параметра
deviceKey        ← текущий ключ устройства
setpointKey      ← текущий ключ уставки
typeSettingsKey  ← 'schedule' | 'notifications' | 'statistics' | 'setpoints'
redirectPath     ← путь для редиректа после логина
{dID}_schedules  ← локальный кэш расписаний
```

---

## 8. КОМПОНЕНТНАЯ АРХИТЕКТУРА

### 8.1 DashBoard.vue — главный оркестратор

- Является **родительским** компонентом для всего dashboard
- Управляет состоянием: `showFooterSetpoint`, `setpoint`, `request`, `selectedItemData`
- Обрабатывает события от дочерних компонентов через `router-view`:
  - `@eventsMainBody` → `handleMainBodyEvent`
  - `@eventsMainBodySettings` → `handleMainBodySettingsEvent`
  - `@getComponentData` → `getComponentData` (show/hide MainSetpoint)
  - `@updateTypeValue` → `editValueMainSetpoint`
  - `@swipe-forward` / `@swipe-back` → `handleSwipeForward` / `handleSwipeBack`
- Использует `provide/inject` для передачи `getMainSetpointEl` в дочерние компоненты
- Отправка данных на сервер — с задержкой 2500ms через `sendChangedData()`

### 8.2 Поток данных (Data Flow)

```
Сервер
  ↓ WebSocket message
websocket.js → handleMessage
  ↓ dispatch
config.js → handleConfigResponse / handleValueUpdate
  ↓ commit
Vuex state (configs, schedules, ...)
  ↓ reactivity
MainBody.vue → computed viewArray
  ↓ render
MainBodyValue.vue (карточка)
  ↓ @click emit
MainBody.vue → emit('eventsMainBody')
  ↓
DashBoard.vue → handleMainBodyEvent
  ↓ dispatch
store actions → websocket/send
  ↓
Сервер
```

### 8.3 Инициализация приложения (App.vue → mounted)

Строгий порядок:
1. `initializeStore()` — восстановить сессию из localStorage
2. `websocket/connect` — установить WS-соединение
3. `auth/login` — авто-логин из localStorage (если есть username + password)
4. `config/initialize` — загрузить конфигурацию (только если isAuthenticated)

**Не менять этот порядок.**

### 8.4 Инициализация DashBoard.vue (created)

1. `initializeSetpointsManager()` — создать экземпляр ManageSetpoints
2. `UPDATE_SETTINGS_DATA` — установить room и param из localStorage

### 8.5 Ключ компонента router-view

```js
// DashBoard.vue использует :key="componentKey" для принудительного ре-рендера
// При добавлении новых route-параметров — учитывать логику формирования componentKey
```

---

## 9. СОРТИРОВКА — sortParams.js

### 9.1 Типы сортировки

`'rooms'` | `'params'` | `'devices'` | `'setpoints'`

### 9.2 Переключение ключей

```js
// Переключить на следующий/предыдущий элемент в массиве
dispatch('sortParams/switchSortKey', { sortingType: 'rooms', direction: 'next' | 'prev' })

// Обновить конкретный ключ
dispatch('sortParams/updateSortKey', { type: 'rooms', newKey: 'rRoom1' })
```

### 9.3 Принудительное обновление представления

```js
commit('sortParams/SET_FORCE_UPDATE', Date.now())
// MainBody.vue наблюдает за forceUpdate через watcher и пересчитывает viewArray
```

---

## 10. НАСТРОЙКИ — settingsConfig.js

### 10.1 Типы конфигурации (typeSettingsKey)

`'schedule'` | `'notifications'` | `'statistics'` | `'setpoints'`

Хранится в `localStorage('typeSettingsKey')` и `config.state.typeSettingsKey`

### 10.2 Константы мутаций

Все мутации в settingsConfig.js объявлены через `MUTATION_TYPES`:
```js
const MUTATION_TYPES = {
  SET_NOTIFICATIONS, SET_STATISTICS, ADD_SCHEDULE, DELETE_SCHEDULE,
  SET_PERMIT_SCHEDULE, SET_PERMIT_NOTIFICATIONS, SET_PERMIT_STATISTICS,
  SET_LOADING, SET_ERROR
}
// При добавлении новых мутаций — добавлять в MUTATION_TYPES
```

---

## 11. ОБРАБОТКА ЗНАЧЕНИЙ УСТАВОК

### 11.1 Типы значений (value_type)

- `'absolute'` — абсолютное значение, округление `.toFixed(1)`
- `'deviation'` — отклонение от уставки, округление `.toFixed(3)`
- Время (`startTime`, `endTime`) — `.toFixed(0)`

### 11.2 Типы запросов уставок (request)

```js
switch (requestName) {
  case 'setpoints':    // изменение уставки
  case 'schedules':    // изменение расписания
  case 'notifications': // уведомления
  case 'statistics':   // статистика
}
```

### 11.3 Лимиты уставок

Берутся из `config.init.limits[param]` или `config.init.limits.Default`
При `value_type === 'deviation'` — пересчитываются: `±(high/4)`, шаг `step/10`

---

## 12. НОВЫЙ ФУНКЦИОНАЛ — ЧЕКЛИСТ

При добавлении нового функционала обязательно:

- [ ] Сохранять Options API в компонентах
- [ ] Использовать `logger.*` вместо `console.log`
- [ ] Соблюдать формат префиксов логов `[Модуль] - метод - описание`
- [ ] Новые WebSocket-сообщения следуют протоколу п.5.1
- [ ] Новые ключи конфигурации — следовать именованию п.7.1
- [ ] Новые store-поля — добавлять getter в соответствующем модуле
- [ ] Новые маршруты с ограниченным доступом — добавлять `meta.requiresAuth` + `meta.requiredLevel`
- [ ] Все обращения к уставкам — через ManageSetpoints / store actions
- [ ] Отправка данных на сервер — только через `websocket/send`
- [ ] Задержка отправки уставок на сервер — 2500ms (паттерн `sendChangedData`)

---

## 13. ЗАПРЕЩЕНО

- ❌ Переписывать компоненты на Composition API / `<script setup>`
- ❌ Напрямую мутировать `state` вне mutations
- ❌ Обращаться к `store.state` напрямую из компонентов (только через getters/mapGetters)
- ❌ Создавать новые WebSocket-соединения в обход `websocket.js`
- ❌ Изменять структуру сообщений WebSocket-протокола (п.5.1)
- ❌ Менять порядок инициализации в `App.vue → mounted`
- ❌ Добавлять активные `console.log` в продакшн-код (только `logger.*`)
- ❌ Изменять сигнатуры существующих actions/mutations/getters
- ❌ Хранить ключи сортировки иначе, чем через `localStorage` + `SET_*_KEY` mutations
- ❌ Изменять логику навигационного гарда (только расширять)
