// src/tests/unit/store/index.spec.js

// ─── Мок localStorage ────────────────────────────────────────────────────────
// Object.defineProperty обязателен: в jsdom localStorage объявлен
// как non-writable getter, простое global.localStorage = ... тихо игнорируется.

const localStorageMock = {
  store:      {},
  getItem:    jest.fn((key)        => localStorageMock.store[key] ?? null),
  setItem:    jest.fn((key, value) => { localStorageMock.store[key] = String(value); }),
  removeItem: jest.fn((key)        => { delete localStorageMock.store[key]; }),
  clear:      jest.fn(()           => { localStorageMock.store = {}; }),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock, writable: true, configurable: true,
});

// ─── Статические моки (хойстятся Babel — фабрики должны быть инлайн) ─────────
// jest.mock() вызывается ДО любых объявлений переменных в файле.
// Поэтому нельзя ссылаться на функции из этого файла — только inline-объекты.

jest.mock('@/store/modules/logger', () => ({
  dev: jest.fn(), info: jest.fn(), error: jest.fn(),
}));

jest.mock('@/utils/timeUtils', () => ({
  nowMoscow: jest.fn(() => '01.01.2025, 12:00:00'),
}));

jest.mock('@/store/modules/auth', () => ({
  namespaced: true,
  state: { token: null, user: { username: '' }, level: 0, dID: null, status: null },
  mutations: {}, actions: {}, getters: {},
}));
jest.mock('@/store/modules/websocket',      () => ({ namespaced: true, state: {}, mutations: {}, actions: {}, getters: {} }));
jest.mock('@/store/modules/log',            () => ({ namespaced: true, state: {}, mutations: {}, actions: {}, getters: {} }));
jest.mock('@/store/modules/sortParams',     () => ({ namespaced: true, state: {}, mutations: {}, actions: {}, getters: {} }));
jest.mock('@/store/modules/config',         () => ({ namespaced: true, state: { typeSettingsKey: null }, mutations: {}, actions: {}, getters: {} }));
jest.mock('@/store/modules/settingsConfig', () => ({ namespaced: true, state: { idKey: null },           mutations: {}, actions: {}, getters: {} }));
jest.mock('@/store/modules/popup',          () => ({ namespaced: true, state: {}, mutations: {}, actions: {}, getters: {} }));

// ─── Фабрики моков для jest.doMock (вызываются в runtime, не хойстятся) ──────

function makeAuthDefault() {
  return {
    namespaced: true,
    state: { token: null, user: { username: '' }, level: 0, dID: null, status: null },
    mutations: {}, actions: {}, getters: {},
  };
}

function makeAuthWithDID(dID = 'device42') {
  return {
    namespaced: true,
    state: { token: 'x', user: { username: 'testUser' }, level: 1, dID, status: null },
    mutations: {}, actions: {}, getters: {},
  };
}

function makeEmptyModule() {
  return { namespaced: true, state: {}, mutations: {}, actions: {}, getters: {} };
}

// ─── createFreshStore ─────────────────────────────────────────────────────────
// Создаёт изолированный экземпляр store.
//
// ПОЧЕМУ jest.doMock + jest.resetModules здесь, а не jest.mock:
//   jest.doMock (в отличие от jest.mock) не хойстится и работает в runtime.
//   После jest.resetModules() все require будут использовать СВЕЖИЕ экземпляры
//   модулей — без загрязнения от предыдущих тестов.
//   Явная регистрация всех моков в каждом вызове гарантирует, что jest.doMock
//   из предыдущего теста (например, auth с dID: 'device42') не просочится
//   в последующие describe-блоки.

function createFreshStore(authFactory = makeAuthDefault) {
  jest.resetModules();
  jest.doMock('@/store/modules/auth',           authFactory);
  jest.doMock('@/store/modules/websocket',      makeEmptyModule);
  jest.doMock('@/store/modules/log',            makeEmptyModule);
  jest.doMock('@/store/modules/sortParams',     makeEmptyModule);
  jest.doMock('@/store/modules/config',         () => ({ namespaced: true, state: { typeSettingsKey: null }, mutations: {}, actions: {}, getters: {} }));
  jest.doMock('@/store/modules/settingsConfig', () => ({ namespaced: true, state: { idKey: null },           mutations: {}, actions: {}, getters: {} }));
  jest.doMock('@/store/modules/popup',          makeEmptyModule);
  jest.doMock('@/utils/timeUtils',              () => ({ nowMoscow: jest.fn(() => '01.01.2025, 12:00:00') }));
  return require('@/store/index').default;
}

// ─── Хелперы тестов ───────────────────────────────────────────────────────────

function initManager(store, dID = 'testDevice') {
  store.commit('INIT_SETPOINTS_MANAGER', { dID, config: 'setpoints' });
}

// nowMoscow из текущего module cache (после createFreshStore)
function getNowMoscow() {
  return require('@/utils/timeUtils').nowMoscow;
}

// Проверка экземпляра ManageSetpoints через имя конструктора.
// ПОЧЕМУ НЕ toBeInstanceOf: после jest.resetModules() класс в test-файле
// и класс внутри freshly-required store — разные объекты из разных module registries.
// instanceof сравнивает ссылки на конструктор → всегда false.
function expectIsManageSetpoints(value) {
  expect(value).not.toBeNull();
  expect(value?.constructor?.name).toBe('ManageSetpoints');
}


// ═════════════════════════════════════════════════════════════════════════════
// 1. НАЧАЛЬНОЕ СОСТОЯНИЕ
// ═════════════════════════════════════════════════════════════════════════════
describe('Store — начальное состояние', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  test('setpointsManager изначально null', () => {
    localStorageMock.store = {};
    const store = createFreshStore();
    expect(store.state.setpointsManager).toBeNull();
  });

  test('settingsData изначально null', () => {
    localStorageMock.store = {};
    const store = createFreshStore();
    expect(store.state.settingsData).toBeNull();
  });

  test('читает roomKey из localStorage при инициализации', () => {
    localStorageMock.store = { roomKey: 'rRoom1' };
    const store = createFreshStore();
    expect(store.state.roomKey).toBe('rRoom1');
  });

  test('читает paramKey из localStorage при инициализации', () => {
    localStorageMock.store = { paramKey: 'dTemp' };
    const store = createFreshStore();
    expect(store.state.paramKey).toBe('dTemp');
  });

  test('читает deviceKey из localStorage при инициализации', () => {
    localStorageMock.store = { deviceKey: 'device_1' };
    const store = createFreshStore();
    expect(store.state.deviceKey).toBe('device_1');
  });

  test('читает setpointKey из localStorage при инициализации', () => {
    localStorageMock.store = { setpointKey: 'sTemp' };
    const store = createFreshStore();
    expect(store.state.setpointKey).toBe('sTemp');
  });

  test('устанавливает null если ключ в localStorage отсутствует', () => {
    localStorageMock.store = {};
    const store = createFreshStore();
    expect(store.state.roomKey).toBeNull();
    expect(store.state.paramKey).toBeNull();
    expect(store.state.deviceKey).toBeNull();
    expect(store.state.setpointKey).toBeNull();
  });
});


// ═════════════════════════════════════════════════════════════════════════════
// 2. МУТАЦИЯ: INIT_SETPOINTS_MANAGER
// ═════════════════════════════════════════════════════════════════════════════
describe('Мутация INIT_SETPOINTS_MANAGER', () => {
  let store;

  beforeEach(() => {
    localStorageMock.store = {};
    store = createFreshStore();
  });

  test('создаёт экземпляр ManageSetpoints', () => {
    store.commit('INIT_SETPOINTS_MANAGER', { dID: 'dev1', config: 'setpoints' });
    expectIsManageSetpoints(store.state.setpointsManager);
  });

  test('устанавливает корректный dID в settingsData.name', () => {
    store.commit('INIT_SETPOINTS_MANAGER', { dID: 'dev1', config: 'setpoints' });
    expect(store.state.setpointsManager.settingsData.name).toBe('dev1');
  });

  test('устанавливает корректный config в settingsData.payload.config', () => {
    store.commit('INIT_SETPOINTS_MANAGER', { dID: 'dev1', config: 'setpoints' });
    expect(store.state.setpointsManager.settingsData.payload.config).toBe('setpoints');
  });

  test('повторная инициализация заменяет предыдущий менеджер', () => {
    store.commit('INIT_SETPOINTS_MANAGER', { dID: 'dev1', config: 'setpoints' });
    const first = store.state.setpointsManager;
    store.commit('INIT_SETPOINTS_MANAGER', { dID: 'dev2', config: 'setpoints' });
    expect(store.state.setpointsManager).not.toBe(first);
    expect(store.state.setpointsManager.settingsData.name).toBe('dev2');
  });
});


// ═════════════════════════════════════════════════════════════════════════════
// 3. МУТАЦИЯ: UPDATE_SETTINGS_DATA
// ═════════════════════════════════════════════════════════════════════════════
describe('Мутация UPDATE_SETTINGS_DATA', () => {
  let store;

  beforeEach(() => {
    localStorageMock.store = {};
    store = createFreshStore();
    initManager(store);
  });

  test.each(['request', 'type', 'limits'])(
    'обновляет поле верхнего уровня "%s" напрямую в settingsData',
    (field) => {
      const value = field === 'limits'
        ? { limHigh: 30, limLow: 10, limStep: 0.5 }
        : 'schedules';
      store.commit('UPDATE_SETTINGS_DATA', { field, value });
      expect(store.state.setpointsManager.settingsData[field]).toEqual(value);
    }
  );

  test('НЕ вызывает nowMoscow при изменении поля верхнего уровня', () => {
    const nowMoscow = getNowMoscow();
    nowMoscow.mockClear(); // сбрасываем вызовы из конструктора ManageSetpoints
    store.commit('UPDATE_SETTINGS_DATA', { field: 'request', value: 'schedules' });
    expect(nowMoscow).not.toHaveBeenCalled();
  });

  test('обновляет поле payload.room', () => {
    store.commit('UPDATE_SETTINGS_DATA', { field: 'room', value: 'rRoom1' });
    expect(store.state.setpointsManager.settingsData.payload.room).toBe('rRoom1');
  });

  test('обновляет payload.updated через nowMoscow() при изменении payload-поля', () => {
    store.commit('UPDATE_SETTINGS_DATA', { field: 'value', value: 22.5 });
    expect(store.state.setpointsManager.settingsData.payload.updated).toBe('01.01.2025, 12:00:00');
  });

  test('синхронизирует state.settingsData после обновления (shallow copy, не ссылка)', () => {
    store.commit('UPDATE_SETTINGS_DATA', { field: 'room', value: 'rRoom2' });
    expect(store.state.settingsData).not.toBe(store.state.setpointsManager.settingsData);
    expect(store.state.settingsData.payload.room).toBe('rRoom2');
  });

  test('не выполняет ничего если setpointsManager не инициализирован', () => {
    const emptyStore = createFreshStore();
    expect(() => {
      emptyStore.commit('UPDATE_SETTINGS_DATA', { field: 'room', value: 'rRoom1' });
    }).not.toThrow();
    expect(emptyStore.state.settingsData).toBeNull();
  });
});


// ═════════════════════════════════════════════════════════════════════════════
// 4. МУТАЦИЯ: UPDATE_PAYLOAD_DATA
// ═════════════════════════════════════════════════════════════════════════════
describe('Мутация UPDATE_PAYLOAD_DATA', () => {
  let store;

  beforeEach(() => {
    localStorageMock.store = {};
    store = createFreshStore();
    initManager(store);
    store.commit('UPDATE_SETTINGS_DATA', { field: 'room',  value: 'rRoom1' });
    store.commit('UPDATE_SETTINGS_DATA', { field: 'param', value: 'dTemp'  });
  });

  test('обновляет переданные поля payload', () => {
    store.commit('UPDATE_PAYLOAD_DATA', { value: 25, id: 42 });
    expect(store.state.setpointsManager.settingsData.payload.value).toBe(25);
    expect(store.state.setpointsManager.settingsData.payload.id).toBe(42);
  });

  test('сохраняет ранее установленные поля (partial update)', () => {
    store.commit('UPDATE_PAYLOAD_DATA', { value: 25 });
    expect(store.state.setpointsManager.settingsData.payload.room).toBe('rRoom1');
    expect(store.state.setpointsManager.settingsData.payload.param).toBe('dTemp');
  });

  test('устанавливает payload.updated через nowMoscow()', () => {
    store.commit('UPDATE_PAYLOAD_DATA', { value: 25 });
    expect(store.state.setpointsManager.settingsData.payload.updated).toBe('01.01.2025, 12:00:00');
  });

  test('синхронизирует state.settingsData', () => {
    store.commit('UPDATE_PAYLOAD_DATA', { value: 99 });
    expect(store.state.settingsData.payload.value).toBe(99);
  });

  test('не выполняет ничего если setpointsManager не инициализирован', () => {
    const emptyStore = createFreshStore();
    expect(() => {
      emptyStore.commit('UPDATE_PAYLOAD_DATA', { value: 10 });
    }).not.toThrow();
    expect(emptyStore.state.settingsData).toBeNull();
  });
});


// ═════════════════════════════════════════════════════════════════════════════
// 5. МУТАЦИЯ: UPDATE_LIMITS_DATA
// ═════════════════════════════════════════════════════════════════════════════
describe('Мутация UPDATE_LIMITS_DATA', () => {
  let store;

  beforeEach(() => {
    localStorageMock.store = {};
    store = createFreshStore();
    initManager(store);
  });

  test('обновляет поля limits', () => {
    store.commit('UPDATE_LIMITS_DATA', { limHigh: 40, limLow: 5, limStep: 0.5 });
    const { limits } = store.state.setpointsManager.settingsData;
    expect(limits.limHigh).toBe(40);
    expect(limits.limLow).toBe(5);
    expect(limits.limStep).toBe(0.5);
  });

  test('выполняет partial update — сохраняет непереданные поля', () => {
    store.commit('UPDATE_LIMITS_DATA', { limHigh: 40 });
    store.commit('UPDATE_LIMITS_DATA', { limLow: 5 });
    const { limits } = store.state.setpointsManager.settingsData;
    expect(limits.limHigh).toBe(40);
    expect(limits.limLow).toBe(5);
  });

  test('синхронизирует state.settingsData.limits', () => {
    store.commit('UPDATE_LIMITS_DATA', { limHigh: 35 });
    expect(store.state.settingsData.limits.limHigh).toBe(35);
  });

  test('не выполняет ничего если setpointsManager не инициализирован', () => {
    const emptyStore = createFreshStore();
    expect(() => {
      emptyStore.commit('UPDATE_LIMITS_DATA', { limHigh: 30 });
    }).not.toThrow();
    expect(emptyStore.state.settingsData).toBeNull();
  });
});


// ═════════════════════════════════════════════════════════════════════════════
// 6. МУТАЦИЯ: RESET_SETTINGS_DATA
// ═════════════════════════════════════════════════════════════════════════════
describe('Мутация RESET_SETTINGS_DATA', () => {
  let store;

  beforeEach(() => {
    localStorageMock.store = {};
    store = createFreshStore();
    initManager(store);
    store.commit('UPDATE_SETTINGS_DATA', { field: 'room',  value: 'rRoom1' });
    store.commit('UPDATE_SETTINGS_DATA', { field: 'value', value: 25 });
  });

  test('очищает поля payload после сброса', () => {
    store.commit('RESET_SETTINGS_DATA');
    const { payload } = store.state.setpointsManager.settingsData;
    expect(payload.room).toBe('');
    expect(payload.value).toBe('');
  });

  test('синхронизирует state.settingsData после сброса', () => {
    store.commit('RESET_SETTINGS_DATA');
    expect(store.state.settingsData).not.toBeNull();
    expect(store.state.settingsData.payload.room).toBe('');
  });

  test('не выполняет ничего если setpointsManager не инициализирован', () => {
    const emptyStore = createFreshStore();
    expect(() => {
      emptyStore.commit('RESET_SETTINGS_DATA');
    }).not.toThrow();
    expect(emptyStore.state.settingsData).toBeNull();
  });
});


// ═════════════════════════════════════════════════════════════════════════════
// 7. МУТАЦИИ: SET_*_KEY
// ═════════════════════════════════════════════════════════════════════════════
describe('Мутации SET_*_KEY', () => {
  const KEY_MUTATIONS = [
    { mutation: 'SET_ROOM_KEY',     stateField: 'roomKey',     lsKey: 'roomKey'     },
    { mutation: 'SET_PARAM_KEY',    stateField: 'paramKey',    lsKey: 'paramKey'    },
    { mutation: 'SET_DEVICE_KEY',   stateField: 'deviceKey',   lsKey: 'deviceKey'   },
    { mutation: 'SET_SETPOINT_KEY', stateField: 'setpointKey', lsKey: 'setpointKey' },
  ];

  let store;

  beforeEach(() => {
    localStorageMock.store = {};
    localStorageMock.setItem.mockClear();
    store = createFreshStore();
  });

  test.each(KEY_MUTATIONS)(
    '$mutation: обновляет state.$stateField при новом значении',
    ({ mutation, stateField }) => {
      store.commit(mutation, 'newKey');
      expect(store.state[stateField]).toBe('newKey');
    }
  );

  test.each(KEY_MUTATIONS)(
    '$mutation: сохраняет значение в localStorage',
    ({ mutation, lsKey }) => {
      localStorageMock.setItem.mockClear();
      store.commit(mutation, 'newKey');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(lsKey, 'newKey');
    }
  );

  test.each(KEY_MUTATIONS)(
    '$mutation: не вызывает setItem если ключ не изменился',
    ({ mutation }) => {
      store.commit(mutation, 'sameKey');       // первый вызов — устанавливает
      localStorageMock.setItem.mockClear();    // сбрасываем spy
      store.commit(mutation, 'sameKey');       // второй вызов — дедупликация
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    }
  );

  test.each(KEY_MUTATIONS)(
    '$mutation: игнорирует не-строковые значения',
    ({ mutation, stateField }) => {
      const originalValue = store.state[stateField];
      localStorageMock.setItem.mockClear();
      store.commit(mutation, 123);
      store.commit(mutation, null);
      store.commit(mutation, undefined);
      expect(store.state[stateField]).toBe(originalValue);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    }
  );
});


// ═════════════════════════════════════════════════════════════════════════════
// 8. ACTION: initializeStore
// ═════════════════════════════════════════════════════════════════════════════
describe('Action initializeStore', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  test('вызывает localStorage.getItem("authData")', async () => {
    const authData = { token: 'abc', user: { username: 'user1' }, dID: 'dev1', level: 2 };
    localStorageMock.store = { authData: JSON.stringify(authData) };
    const store = createFreshStore();
    localStorageMock.getItem.mockClear(); // сбрасываем вызовы из инициализации store

    await store.dispatch('initializeStore');

    expect(localStorageMock.getItem).toHaveBeenCalledWith('authData');
  });

  test('удаляет authData из localStorage при невалидном JSON', async () => {
    localStorageMock.store = { authData: 'INVALID_JSON{{' };
    const store = createFreshStore();

    await store.dispatch('initializeStore');

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('authData');
  });

  test('не выбрасывает ошибку если authData отсутствует в localStorage', async () => {
    localStorageMock.store = {};
    const store = createFreshStore();

    await expect(store.dispatch('initializeStore')).resolves.not.toThrow();
  });
});


// ═════════════════════════════════════════════════════════════════════════════
// 9. ACTION: initializeSetpointsManager
// ═════════════════════════════════════════════════════════════════════════════
describe('Action initializeSetpointsManager', () => {
  beforeEach(() => {
    localStorageMock.store = {};
  });

  test('создаёт ManageSetpoints если dID доступен', async () => {
    const store = createFreshStore(() => makeAuthWithDID('device42'));

    await store.dispatch('initializeSetpointsManager');

    expectIsManageSetpoints(store.state.setpointsManager);
    expect(store.state.setpointsManager.settingsData.name).toBe('device42');
  });

  test('не создаёт ManageSetpoints если dID равен null', async () => {
    // makeAuthDefault возвращает dID: null — createFreshStore использует его по умолчанию
    const store = createFreshStore();

    await store.dispatch('initializeSetpointsManager');

    expect(store.state.setpointsManager).toBeNull();
  });
});


// ═════════════════════════════════════════════════════════════════════════════
// 10. GETTERS
// ═════════════════════════════════════════════════════════════════════════════
describe('Getters', () => {
  let store;

  beforeEach(() => {
    // Явно задаём localStorage — защита от загрязнения SET_*_KEY тестами
    localStorageMock.store = { roomKey: 'rRoom1', paramKey: 'dTemp' };
    // createFreshStore регистрирует makeAuthDefault → token: null, level: 0, dID: null
    store = createFreshStore();
  });

  test('roomKey возвращает значение из state', () => {
    expect(store.getters.roomKey).toBe('rRoom1');
  });

  test('paramKey возвращает значение из state', () => {
    expect(store.getters.paramKey).toBe('dTemp');
  });

  test('getSetpointsManager возвращает null до инициализации', () => {
    expect(store.getters.getSetpointsManager).toBeNull();
  });

  test('getSetpointsManager возвращает экземпляр после инициализации', () => {
    initManager(store, 'dev1');
    expectIsManageSetpoints(store.getters.getSetpointsManager);
  });

  test('settingsDataLimits возвращает undefined до инициализации', () => {
    expect(store.getters.settingsDataLimits).toBeUndefined();
  });

  test('settingsDataLimits возвращает объект limits после инициализации', () => {
    initManager(store);
    store.commit('UPDATE_LIMITS_DATA', { limHigh: 40, limLow: 5, limStep: 1 });
    expect(store.getters.settingsDataLimits).toMatchObject({ limHigh: 40, limLow: 5, limStep: 1 });
  });

  test('isAuthenticated возвращает false при отсутствии token', () => {
    expect(store.getters.isAuthenticated).toBe(false);
  });

  test('level по умолчанию равен 0', () => {
    expect(store.getters.level).toBe(0);
  });

  test('dID по умолчанию равен null', () => {
    expect(store.getters.dID).toBeNull();
  });
});


// ═════════════════════════════════════════════════════════════════════════════
// 11. ИНТЕГРАЦИЯ: полный цикл setpointsManager
// ═════════════════════════════════════════════════════════════════════════════
describe('Интеграция — полный цикл setpointsManager', () => {
  let store;

  beforeEach(() => {
    localStorageMock.store = {};
    store = createFreshStore();
    initManager(store, 'dev1');
  });

  test('init → update payload → reset возвращает к начальному состоянию payload', () => {
    store.commit('UPDATE_PAYLOAD_DATA', { room: 'rRoom1', param: 'dTemp', value: 25, id: 7 });
    expect(store.state.settingsData.payload.room).toBe('rRoom1');

    store.commit('RESET_SETTINGS_DATA');
    expect(store.state.settingsData.payload.room).toBe('');
    expect(store.state.settingsData.payload.value).toBe('');
  });

  test('state.settingsData является shallow copy — мутация не затрагивает снимок', () => {
    store.commit('UPDATE_PAYLOAD_DATA', { value: 10 });
    const snapshot = store.state.settingsData; // сохраняем ссылку на старый объект

    store.commit('UPDATE_PAYLOAD_DATA', { value: 99 });

    // snapshot должен указывать на старый объект с value: 10
    expect(snapshot.payload.value).not.toBe(store.state.settingsData.payload.value);
  });

  test('updateSettingsData (action) проксирует в мутацию корректно', async () => {
    await store.dispatch('updateSettingsData', { field: 'room', value: 'rRoom3' });
    expect(store.state.settingsData.payload.room).toBe('rRoom3');
  });

  test('updateLimitsData (action) проксирует в мутацию корректно', async () => {
    await store.dispatch('updateLimitsData', { limHigh: 50, limLow: 0, limStep: 2 });
    expect(store.getters.settingsDataLimits.limHigh).toBe(50);
  });

  test('updatePayloadData (action) проксирует в мутацию корректно', async () => {
    await store.dispatch('updatePayloadData', { value: 33, id: 15 });
    expect(store.state.settingsData.payload.value).toBe(33);
    expect(store.state.settingsData.payload.id).toBe(15);
  });
});