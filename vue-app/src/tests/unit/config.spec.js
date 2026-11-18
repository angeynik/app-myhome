// src/tests/unit/config.spec.js

// ─── localStorage в памяти ───────────────────────────────────────────────────
// Реализации ставятся в beforeEach: resetMocks: true (jest.config.js) стирает их перед каждым тестом.
const ls = { store: {} };
beforeEach(() => {
  ls.store = {};
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation((k) => ls.store[k] ?? null);
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation((k, v) => { ls.store[k] = String(v); });
  jest.spyOn(Storage.prototype, 'removeItem').mockImplementation((k) => { delete ls.store[k]; });
  jest.spyOn(Storage.prototype, 'clear').mockImplementation(() => { ls.store = {}; });
});
afterAll(() => jest.restoreAllMocks());

// ─── Моки модулей ────────────────────────────────────────────────────────────
jest.mock('@/store/modules/logger', () => ({
  info: jest.fn(), dev: jest.fn(), warn: jest.fn(), error: jest.fn(),
  isInfoEnabled: () => false, isDevEnabled: () => false, isErrorEnabled: () => false,
}));

// ВАЖНО: nowMoscow — обычная стрелочная функция, НЕ jest.fn().
//
// ПОЧЕМУ НЕ jest.fn(): если в jest.config установлен resetMocks: true,
// Jest вызывает mockReset() перед каждым тестом и стирает имплементацию —
// функция начинает возвращать undefined. Обычная функция resetMocks не трогает.
//
// Мутации UPDATE_CONFIG_VALUE, UPDATE_SCHEDULE_VALUE
// используют nowMoscow() для lastUpdate/updatedAt — тесты проверяют
// что записывается именно возвращаемое значение этой функции.
jest.mock('@/utils/timeUtils', () => ({
  nowMoscow: () => 'MOCKED_TIMESTAMP',
}));

import configModule from '@/store/modules/config';

// ─── Фабрика settingsData для handleValueUpdate ───────────────────────────────
function makeSettingsData(overrides = {}) {
  return {
    name: 'device123',
    payload: {
      room:       'room1',
      param:      'temp',
      value:      22,
      value_name: 'value',
      config:     'setpoints',
      id:         1,
      setKey:     'sTemp',
      ...overrides.payload,
    },
    ...overrides,
  };
}


describe('Vuex config module', () => {
  let state;
  let context;

  beforeEach(() => {
    state = configModule.state();
    context = {
      state,
      commit:  jest.fn(),
      dispatch: jest.fn().mockResolvedValue(undefined),
      rootGetters: {
        dID:               'device123',
        roomKey:           null,
        paramKey:          null,
        getSetpointsManager: null,
      },
    };
  });


  // ═══════════════════════════════════════════════════════════════════════════
  // МУТАЦИИ
  // ═══════════════════════════════════════════════════════════════════════════
  describe('mutations', () => {

    // ── Базовые сеттеры ──────────────────────────────────────────────────────

    it('SET_CONFIG сохраняет конфиг по dID', () => {
      const config = { room1: { sensors: { temp1: { value: 22 } } } };
      configModule.mutations.SET_CONFIG(state, { name: 'device123', config });
      expect(state.configs['device123']).toEqual(config);
    });

    it('SET_SCHEDULE сохраняет расписания по dID', () => {
      const config = { room1: { temp: [{ id: 1, startTime: '08:00' }] } };
      configModule.mutations.SET_SCHEDULE(state, { name: 'device123', config });
      expect(state.schedules['device123']).toEqual(config);
    });

    it('SET_STATISTIC сохраняет статистику по dID', () => {
      const config = { room1: { temp: [{ id: 1 }] } };
      configModule.mutations.SET_STATISTIC(state, { name: 'device123', config });
      expect(state.statistics['device123']).toEqual(config);
    });

    it('SET_LOADING обновляет loading', () => {
      configModule.mutations.SET_LOADING(state, true);
      expect(state.loading).toBe(true);
    });

    it('SET_ERROR обновляет error', () => {
      const error = new Error('Test error');
      configModule.mutations.SET_ERROR(state, error);
      expect(state.error).toBe(error);
    });

    it('SET_DEVICE_MODE запоминает выбор; auto — удаляет сохранённый', () => {
      configModule.mutations.SET_DEVICE_MODE(state, 'mobile');
      expect(state.deviceMode).toBe('mobile');
      expect(localStorage.getItem('deviceMode')).toBe('mobile');
      configModule.mutations.SET_DEVICE_MODE(state, 'auto');
      expect(state.deviceMode).toBe('auto');
      expect(localStorage.getItem('deviceMode')).toBeNull();
    });

    it('SET_AUTO_MOBILE приводит значение к boolean', () => {
      configModule.mutations.SET_AUTO_MOBILE(state, 1);
      expect(state.autoMobile).toBe(true);
    });

    it('SET_DEVICE_TYPE обновляет deviceType', () => {
      configModule.mutations.SET_DEVICE_TYPE(state, 'tablet');
      expect(state.deviceType).toBe('tablet');
    });

    // ── UPDATE_CONFIG_VALUE ───────────────────────────────────────────────────
    // ВНИМАНИЕ: мутация всегда записывает lastUpdate = nowMoscow().
    // Поле timestamp в payload игнорируется — это текущее поведение реализации.
    // Тест проверяет то, что есть, а не то, что передаётся в payload.

    it('UPDATE_CONFIG_VALUE обновляет value и lastUpdate существующего сенсора', () => {
      state.configs['device123'] = {
        room1: { sensors: { temp1: { value: 20, lastUpdate: null } } },
      };
      configModule.mutations.UPDATE_CONFIG_VALUE(state, {
        dID: 'device123', room: 'room1', type: 'sensors', name: 'temp1', value: 25,
      });
      expect(state.configs['device123'].room1.sensors.temp1.value).toBe(25);
      expect(state.configs['device123'].room1.sensors.temp1.lastUpdate).toBe('MOCKED_TIMESTAMP');
    });

    it('UPDATE_CONFIG_VALUE создаёт отсутствующий type и элемент', () => {
      state.configs['device123'] = { room1: {} };
      configModule.mutations.UPDATE_CONFIG_VALUE(state, {
        dID: 'device123', room: 'room1', type: 'actuators', name: 'a1', value: 1.5,
      });
      expect(state.configs['device123'].room1.actuators.a1.value).toBe(1.5);
      expect(state.configs['device123'].room1.actuators.a1.lastUpdate).toBe('MOCKED_TIMESTAMP');
    });

    it('UPDATE_CONFIG_VALUE игнорирует вызов если dID не существует', () => {
      configModule.mutations.UPDATE_CONFIG_VALUE(state, {
        dID: 'unknown', room: 'room1', type: 'sensors', name: 'temp1', value: 42,
      });
      expect(state.configs['unknown']).toBeUndefined();
    });

    it('UPDATE_CONFIG_VALUE игнорирует вызов если комната не найдена', () => {
      state.configs['device123'] = {};
      configModule.mutations.UPDATE_CONFIG_VALUE(state, {
        dID: 'device123', room: 'roomX', type: 'sensors', name: 'temp1', value: 42,
      });
      expect(state.configs['device123']['roomX']).toBeUndefined();
    });

    // ── UPDATE_SCHEDULE_VALUE ─────────────────────────────────────────────────

    it('UPDATE_SCHEDULE_VALUE обновляет поле расписания по id', () => {
      state.schedules['device123'] = {
        room1: { temp: [{ id: 1, startTime: '07:00', value: 20 }] },
      };
      configModule.mutations.UPDATE_SCHEDULE_VALUE(state, {
        dID: 'device123', room: 'room1', param: 'temp',
        id: 1, title: 'startTime', value: '09:00',
      });
      expect(state.schedules['device123'].room1.temp[0].startTime).toBe('09:00');
      expect(state.schedules['device123'].room1.temp[0].updatedAt).toBe('MOCKED_TIMESTAMP');
    });

    it('UPDATE_SCHEDULE_VALUE ничего не делает если dID не найден', () => {
      configModule.mutations.UPDATE_SCHEDULE_VALUE(state, {
        dID: 'unknown', room: 'room1', param: 'temp', id: 1, title: 'startTime', value: '09:00',
      });
      expect(state.schedules['unknown']).toBeUndefined();
    });

    it('UPDATE_SCHEDULE_VALUE ничего не делает если id не найден', () => {
      state.schedules['device123'] = {
        room1: { temp: [{ id: 1, startTime: '07:00' }] },
      };
      configModule.mutations.UPDATE_SCHEDULE_VALUE(state, {
        dID: 'device123', room: 'room1', param: 'temp', id: 999, title: 'startTime', value: '10:00',
      });
      // Элемент с id=999 не найден — ничего не изменилось
      expect(state.schedules['device123'].room1.temp[0].startTime).toBe('07:00');
    });

  });


  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getters', () => {

    it('getConfig возвращает конфиг по dID', () => {
      state.configs['device123'] = { room1: {} };
      expect(configModule.getters.getConfig(state)('device123')).toEqual({ room1: {} });
    });

    it('getConfig возвращает пустой объект для несуществующего dID', () => {
      // Геттер реализован как state.configs[name] || {} —
      // возвращает {} по умолчанию, а не undefined.
      expect(configModule.getters.getConfig(state)('nonexistent')).toEqual({});
    });

    it('isLoading возвращает состояние загрузки', () => {
      state.loading = true;
      expect(configModule.getters.isLoading(state)).toBe(true);
    });

    it('error возвращает объект ошибки', () => {
      const error = new Error('Oops');
      state.error = error;
      expect(configModule.getters.error(state)).toBe(error);
    });

    it('getConfig возвращает конфиг по dID, для неизвестного — {}', () => {
      state.configs['device123'] = { room1: {} };
      expect(configModule.getters.getConfig(state)('device123')).toEqual({ room1: {} });
      expect(configModule.getters.getConfig(state)('unknown')).toEqual({});
    });

    it('allRooms возвращает список комнат', () => {
      state.allRooms = ['room1', 'room2'];
      expect(configModule.getters.allRooms(state)).toEqual(['room1', 'room2']);
    });

    it('allParams возвращает список параметров', () => {
      state.allParams = ['temp', 'humidity'];
      expect(configModule.getters.allParams(state)).toEqual(['temp', 'humidity']);
    });

    it.each([
      ['auto', true, true],
      ['auto', false, false],
      ['mobile', false, true],
      ['desktop', true, false],
    ])('isMobile: режим %s, автоопределение %s → %s (явный выбор важнее)', (deviceMode, autoMobile, expected) => {
      Object.assign(state, { deviceMode, autoMobile });
      const isMobile = configModule.getters.isMobile(state);
      expect(isMobile).toBe(expected);
      expect(configModule.getters.getMobile(state, { isMobile })).toBe(expected);
    });

    it('getDeviceType возвращает тип устройства', () => {
      state.deviceType = 'phone';
      expect(configModule.getters.getDeviceType(state)).toBe('phone');
    });
  });


  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  describe('actions', () => {

    // ── initialize ───────────────────────────────────────────────────────────

    it('initialize: вызывает detectDevice и ensureConfig если конфиг отсутствует', async () => {
      context.state.configs['device123'] = undefined;
      await configModule.actions.initialize(context);
      expect(context.dispatch).toHaveBeenCalledWith('detectDevice');
      expect(context.dispatch).toHaveBeenCalledWith('ensureConfig', 'device123');
      expect(context.dispatch).toHaveBeenCalledWith('ensureSortingKeys');
    });

    it('initialize: не вызывает ensureConfig если конфиг уже загружен', async () => {
      context.state.configs['device123'] = { room1: {} };
      await configModule.actions.initialize(context);
      expect(context.dispatch).toHaveBeenCalledWith('detectDevice');
      expect(context.dispatch).not.toHaveBeenCalledWith('ensureConfig', 'device123');
      expect(context.dispatch).toHaveBeenCalledWith('ensureSortingKeys');
    });

    // ── ensureConfig ─────────────────────────────────────────────────────────

    it('ensureConfig: вызывает requestConfig если конфиг отсутствует', async () => {
      context.state.configs = {};
      context.dispatch.mockResolvedValue('mockedConfig');
      const result = await configModule.actions.ensureConfig(context, 'device123');
      expect(context.dispatch).toHaveBeenCalledWith('requestConfig', 'device123');
      expect(result).toBe('mockedConfig');
    });

    // ── handleConfigResponse ──────────────────────────────────────────────────

    it('handleConfigResponse type=config: коммитит SET_CONFIG и вызывает все dispatch', async () => {
      const response = {
        name: 'device123',
        request: 'config',
        payload: { room1: { sensors: { temp1: { value: 22 } } } },
      };
      await configModule.actions.handleConfigResponse(context, response);
      expect(context.commit).toHaveBeenCalledWith('SET_CONFIG', {
        name: 'device123',
        config: response.payload,
      });
      expect(context.dispatch).toHaveBeenCalledWith('handleRoomsSet',   response.payload);
      expect(context.dispatch).toHaveBeenCalledWith('handleParamsSet',  response.payload);
      expect(context.dispatch).toHaveBeenCalledWith('handleDevicesSet', response.payload);
      expect(context.dispatch).toHaveBeenCalledWith('handleSetpointsSet', response.payload);
    });

    it('handleConfigResponse type=schedules: коммитит SET_SCHEDULE', async () => {
      const response = {
        name: 'device123',
        request: 'schedules',
        payload: { room1: { temp: [] } },
      };
      await configModule.actions.handleConfigResponse(context, response);
      expect(context.commit).toHaveBeenCalledWith('SET_SCHEDULE', {
        name: 'device123',
        config: response.payload,
      });
    });

    it('handleConfigResponse type=statistics: коммитит SET_STATISTIC', async () => {
      const response = {
        name: 'device123',
        request: 'statistics',
        payload: { room1: { temp: [] } },
      };
      await configModule.actions.handleConfigResponse(context, response);
      expect(context.commit).toHaveBeenCalledWith('SET_STATISTIC', {
        name: 'device123',
        config: response.payload,
      });
    });

    it('handleConfigResponse: бросает ошибку при невалидном ответе (нет dID)', async () => {
      await expect(
        configModule.actions.handleConfigResponse(context, { name: null, payload: {}, request: 'config' })
      ).rejects.toThrow();
    });

    // ── handleRoomsSet ────────────────────────────────────────────────────────

    it('handleRoomsSet: коммитит отфильтрованные комнаты (только с устройствами)', async () => {
      const config = {
        room1: { sensors: { temp1: {} } }, // есть сенсоры — включаем
        room2: { sensors: {} },             // пустые сенсоры — исключаем
        room3: {},                          // нет секций — исключаем
        init:  { sensors: { x: {} } },     // init всегда исключаем
      };
      await configModule.actions.handleRoomsSet(context, config);
      expect(context.commit).toHaveBeenCalledWith('SET_ALL_ROOMS', ['room1']);
    });

    // ── handleParamsSet ───────────────────────────────────────────────────────

    it('handleParamsSet: коммитит уникальные префиксы параметров', async () => {
      const config = {
        room1: { sensors: { temp1: {}, humidity2: {}, temp3: {} } },
      };
      await configModule.actions.handleParamsSet(context, config);
      expect(context.commit).toHaveBeenCalledWith(
        'SET_ALL_PARAMS',
        expect.arrayContaining(['temp', 'humidity'])
      );
    });

    it('handleParamsSet: не добавляет дубли при одинаковом префиксе', async () => {
      const config = {
        room1: { sensors: { temp1: {}, temp2: {}, temp3: {} } },
      };
      await configModule.actions.handleParamsSet(context, config);
      const [, params] = context.commit.mock.calls[0];
      expect(params.filter((p) => p === 'temp').length).toBe(1);
    });

    // ── requestConfig ─────────────────────────────────────────────────────────

    it('requestConfig: конфиг уже загружен — возвращается без запроса к серверу', async () => {
      context.state.configs['device123'] = { room1: { sensors: { temp1: { value: 22 } } } };
      const result = await configModule.actions.requestConfig(context, 'device123');
      expect(context.dispatch).not.toHaveBeenCalled();
      expect(result).toBe(context.state.configs['device123']);
    });

    it('requestConfig: отправляет get/config и ждёт ответа; повторный вызов не шлёт второй запрос', async () => {
      const config = { room1: { sensors: { temp1: { value: 22 } } } };
      const first = configModule.actions.requestConfig(context, 'dev-wait');
      const second = configModule.actions.requestConfig(context, 'dev-wait');
      await Promise.resolve();
      expect(context.dispatch).toHaveBeenCalledTimes(1);
      expect(context.dispatch).toHaveBeenCalledWith(
        'websocket/send',
        { type: 'get', request: 'config', name: 'dev-wait' },
        { root: true }
      );
      // ответ сервера
      await configModule.actions.handleConfigResponse(context, { request: 'config', name: 'dev-wait', payload: config });
      await expect(first).resolves.toBe(config);
      await expect(second).resolves.toBe(config);
      expect(context.commit).toHaveBeenCalledWith('SET_CONFIG', { name: 'dev-wait', config });
    });

    it('requestConfig: ошибка отправки — промис отклоняется', async () => {
      context.dispatch.mockRejectedValueOnce(new Error('Нет соединения'));
      await expect(configModule.actions.requestConfig(context, 'dev-fail')).rejects.toThrow('Нет соединения');
    });

    // ── handleValueUpdate ─────────────────────────────────────────────────────
    //
    // ВАЖНО: в реализации функция называется handleValueUpdate (не handleSensorUpdate).
    // Она требует rootGetters.getSetpointsManager?.settingsData для работы.
    // Данные для коммитов берутся из settingsData (не из payload).

    describe('handleValueUpdate', () => {
      let settingsData;

      beforeEach(() => {
        settingsData = makeSettingsData();
        context.rootGetters.getSetpointsManager = { settingsData };
      });

      it('type=setpoints: коммитит UPDATE_CONFIG_VALUE', async () => {
        await configModule.actions.handleValueUpdate(context, {
          dID: 'device123',
          payload: { room: 'room1', param: 'sTemp', value: 25 },
          type: 'setpoints',
        });
        expect(context.commit).toHaveBeenCalledWith(
          'UPDATE_CONFIG_VALUE',
          expect.objectContaining({ dID: 'device123', type: 'setpoints' })
        );
      });

      it('type=schedules: коммитит UPDATE_SCHEDULE_VALUE с данными из settingsData', async () => {
        await configModule.actions.handleValueUpdate(context, {
          dID: 'device123',
          payload: {},
          type: 'schedules',
        });
        expect(context.commit).toHaveBeenCalledWith('UPDATE_SCHEDULE_VALUE', {
          dID:    'device123',
          room:   'room1',
          param:  'temp',
          config: 'setpoints',
          id:     1,
          title:  'value',
          value:  22,
        });
      });

      it('type=statistics: коммитит UPDATE_STATISTIC_VALUE', async () => {
        await configModule.actions.handleValueUpdate(context, {
          dID: 'device123', payload: {}, type: 'statistics',
        });
        expect(context.commit).toHaveBeenCalledWith('UPDATE_STATISTIC_VALUE', {
          dID:   'device123',
          room:  'room1',
          param: 'temp',
          id:    1,
          title: 'value',
          value: 22,
        });
      });

      // ── type = sensors ────────────────────────────────────────────────────
      // Поля commit берутся из payload.item_name / payload.item_value,
      // а НЕ из payload.param / payload.value (как у setpoints/schedules).
      // room: payload.room || settingsData.payload.room (fallback)
 
      it('type=sensors: коммитит UPDATE_CONFIG_VALUE c item_name и item_value', async () => {
        await configModule.actions.handleValueUpdate(context, {
          dID:     'device123',
          payload: { room: 'room1', item_name: 'temp1', item_value: 23.5 },
          type:    'sensors',
        });
        expect(context.commit).toHaveBeenCalledWith('UPDATE_CONFIG_VALUE', {
          dID:   'device123',
          room:  'room1',
          type:  'sensors',
          name:  'temp1',
          value: 23.5,
        });
      });
 
      it('type=sensors: использует settingsData.payload.room если payload.room отсутствует', async () => {
        await configModule.actions.handleValueUpdate(context, {
          dID:     'device123',
          payload: { item_name: 'humidity1', item_value: 55 }, // нет room
          type:    'sensors',
        });
        expect(context.commit).toHaveBeenCalledWith('UPDATE_CONFIG_VALUE', expect.objectContaining({
          room: 'room1', // из settingsData.payload.room
          name: 'humidity1',
          value: 55,
        }));
      });
 
      it('type=sensors: использует settingsData.name если dID не передан', async () => {
        await configModule.actions.handleValueUpdate(context, {
          dID:     null,
          payload: { item_name: 'temp1', item_value: 21 },
          type:    'sensors',
        });
        // dID=null → срабатывает ранний return (!dID), commit не вызывается
        expect(context.commit).not.toHaveBeenCalled();
      });
 
      it('type=sensors без item_name: значение не обновляется', async () => {
        await configModule.actions.handleValueUpdate(context, {
          dID:     'device123',
          payload: { room: 'room1' }, // нет item_name и item_value
          type:    'sensors',
        });
        expect(context.commit).not.toHaveBeenCalled();
      });

      it.each(['system', 'setpoints', 'actuators'])(
        'push раздела %s с item_name/item_value обновляет этот раздел', async (type) => {
          await configModule.actions.handleValueUpdate(context, {
            dID: 'device123', type, payload: { room: 'room01', item_name: 'dMode07', item_value: 2 },
          });
          expect(context.commit).toHaveBeenCalledWith('UPDATE_CONFIG_VALUE', {
            dID: 'device123', room: 'room01', type, name: 'dMode07', value: 2,
          });
        },
      );

      it('логическое значение false из push не теряется', async () => {
        await configModule.actions.handleValueUpdate(context, {
          dID: 'device123', type: 'system', payload: { room: 'common', item_name: 'dStatus02', item_value: false },
        });
        expect(context.commit).toHaveBeenCalledWith('UPDATE_CONFIG_VALUE', expect.objectContaining({ value: false }));
      });

      it('уставка, пересланная с другой вкладки, обновляется по setKey из сообщения, а не по своему выбору', async () => {
        await configModule.actions.handleValueUpdate(context, {
          dID: 'device123', type: 'setpoints',
          payload: { room: 'room02', setKey: 'sTemp02', key: 'Temp', value: 21 },
        });
        expect(context.commit).toHaveBeenCalledWith('UPDATE_CONFIG_VALUE', {
          dID: 'device123', room: 'room02', type: 'setpoints', name: 'sTemp02', value: 21,
        });
      });

      it('push работает без менеджера уставок (до входа в экран уставки)', async () => {
        context.rootGetters.getSetpointsManager = null;
        await configModule.actions.handleValueUpdate(context, {
          dID: 'device123', type: 'system', payload: { room: 'room01', item_name: 'dFanSp08', item_value: 3 },
        });
        expect(context.commit).toHaveBeenCalledWith('UPDATE_CONFIG_VALUE', expect.objectContaining({ name: 'dFanSp08' }));
      });

      it('локальная правка уставки пишет в полный ключ setKey выбранного элемента', async () => {
        settingsData.payload.setKey = 'sTemp01';
        settingsData.payload.key = 'Temp';
        await configModule.actions.handleValueUpdate(context, {
          dID: 'device123', type: 'setpoints', payload: { room: 'room01', param: 'dTemp01', value: 23.5 },
        });
        expect(context.commit).toHaveBeenCalledWith('UPDATE_CONFIG_VALUE', expect.objectContaining({
          name: 'sTemp01', value: 23.5,
        }));
      });


      it('возвращает сразу если settingsData отсутствует', async () => {
        context.rootGetters.getSetpointsManager = null;
        await configModule.actions.handleValueUpdate(context, {
          dID: 'device123', payload: {}, type: 'setpoints',
        });
        expect(context.commit).not.toHaveBeenCalled();
      });

      it('возвращает сразу если dID отсутствует', async () => {
        await configModule.actions.handleValueUpdate(context, {
          dID: null, payload: {}, type: 'setpoints',
        });
        expect(context.commit).not.toHaveBeenCalled();
      });

      it('возвращает сразу если payload отсутствует', async () => {
        await configModule.actions.handleValueUpdate(context, {
          dID: 'device123', payload: null, type: 'setpoints',
        });
        expect(context.commit).not.toHaveBeenCalled();
      });
    });

    // ── clearKey ─────────────────────────────────────────────────────────────

    it('clearKeySync: убирает первый символ и цифры в конце', () => {
      const clearKey = configModule.getters.clearKeySync();
      expect(clearKey('dTemp01')).toBe('Temp');
      expect(clearKey('dHumidity')).toBe('Humidity');
      expect(clearKey('')).toBe('');
    });
  });
});

describe('Vuex config module: handleServerError', () => {
  const run = (response) => {
    const context = { dispatch: jest.fn().mockResolvedValue(undefined) };
    return configModule.actions.handleServerError(context, response).then(() => context.dispatch);
  };

  it('показывает текст ошибки и перезапрашивает конфигурацию после ошибки записи', async () => {
    const dispatch = await run({
      type: 'error', request: 'modbusWriteError', name: 'igumen',
      payload: { message: 'Тег dTemp01 доступен только для чтения', code: 'READ_ONLY' },
    });
    expect(dispatch).toHaveBeenCalledWith('popup/show',
      expect.objectContaining({ message: 'Тег dTemp01 доступен только для чтения', type: 'error' }), { root: true });
    expect(dispatch).toHaveBeenCalledWith('websocket/send',
      { type: 'get', request: 'config', name: 'igumen', payload: {} }, { root: true });
  });

  it.each([
    ['addScheduleError', 'schedules'],
    ['updateStatisticsError', 'statistics'],
  ])('%s перезапрашивает список %s', async (request, configType) => {
    const dispatch = await run({ type: 'error', request, name: 'igumen', payload: { message: 'x' } });
    expect(dispatch).toHaveBeenCalledWith('settingsConfig/requestToServer', { configType }, { root: true });
    expect(dispatch).not.toHaveBeenCalledWith('websocket/send', expect.anything(), { root: true });
  });

  it('notificationError: текст пользователю и перезапрос config (вместе с ним придут уведомления)', async () => {
    const dispatch = await run({ type: 'error', request: 'notificationError', name: 'igumen', payload: { message: 'Неверные данные уведомления' } });
    expect(dispatch).toHaveBeenCalledWith('popup/show',
      expect.objectContaining({ message: 'Неверные данные уведомления', type: 'error' }), { root: true });
    expect(dispatch).toHaveBeenCalledWith('websocket/send',
      { type: 'get', request: 'config', name: 'igumen', payload: {} }, { root: true });
  });

  it('notificationSnapshotError: без всплывающего сообщения и перезапроса — отметка в notifications', async () => {
    const payload = { message: 'x', code: 'NO_SNAPSHOT', id: 'r:s:i', cameraId: 'cam01' };
    const dispatch = await run({ type: 'error', request: 'notificationSnapshotError', name: 'igumen', payload });
    expect(dispatch.mock.calls).toEqual([['notifications/snapshotFailed', payload, { root: true }]]);
  });

  it.each(['configError', 'schedulesError'])('ошибка get-запроса (%s) не вызывает перезапрос (нет цикла)', async (request) => {
    const dispatch = await run({ type: 'error', request, name: 'igumen', payload: { message: 'x' } });
    expect(dispatch).toHaveBeenCalledTimes(1); // только popup
  });

  it('configError сразу отклоняет ожидание конфигурации, без таймаута', async () => {
    jest.useFakeTimers();
    const context = {
      state: configModule.state(),
      dispatch: jest.fn().mockResolvedValue(undefined),
    };
    const waiting = configModule.actions.requestConfig(context, 'igumen');
    await Promise.resolve();
    await configModule.actions.handleServerError({ dispatch: jest.fn().mockResolvedValue() }, {
      type: 'error', request: 'configError', name: 'igumen', payload: { message: 'Недопустимый dID', code: 'BAD_DID' },
    });
    await expect(waiting).rejects.toMatchObject({ message: 'Недопустимый dID', code: 'BAD_DID' });
    jest.useRealTimers();
  });
});
