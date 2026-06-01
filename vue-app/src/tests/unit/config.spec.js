// src/tests/unit/config.spec.js

// ─── Storage.prototype spy (как в index.spec.js) ─────────────────────────────
const ls = { store: {} };
beforeAll(() => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation((k) => ls.store[k] ?? null);
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation((k, v) => { ls.store[k] = String(v); });
  jest.spyOn(Storage.prototype, 'removeItem').mockImplementation((k) => { delete ls.store[k]; });
  jest.spyOn(Storage.prototype, 'clear').mockImplementation(() => { ls.store = {}; });
});
beforeEach(() => {
  ls.store = {};
  Storage.prototype.getItem.mockClear();
  Storage.prototype.setItem.mockClear();
  Storage.prototype.removeItem.mockClear();
});
afterAll(() => jest.restoreAllMocks());

// ─── Моки модулей ────────────────────────────────────────────────────────────
jest.mock('@/store/modules/logger', () => ({
  info: jest.fn(), dev: jest.fn(), error: jest.fn(),
  isInfoEnabled: () => false, isDevEnabled: () => false, isErrorEnabled: () => false,
}));

// ВАЖНО: nowMoscow мокируем с фиксированным значением.
// UPDATE_CONFIG_VALUE всегда использует nowMoscow() для lastUpdate,
// поле timestamp из payload игнорируется (текущее поведение реализации).
jest.mock('@/utils/timeUtils', () => ({
  nowMoscow: jest.fn(() => 'MOCKED_TIMESTAMP'),
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

    it('SET_NOTIFICATION сохраняет уведомления по dID', () => {
      const config = { room1: { temp: [{ id: 1, value: 25 }] } };
      configModule.mutations.SET_NOTIFICATION(state, { name: 'device123', config });
      expect(state.notifications['device123']).toEqual(config);
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

    it('SET_MOBILE обновляет mobile', () => {
      configModule.mutations.SET_MOBILE(state, true);
      expect(state.mobile).toBe(true);
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

    // ── UPDATE_NOTIFICATION_VALUE ─────────────────────────────────────────────

    it('UPDATE_NOTIFICATION_VALUE обновляет поле уведомления по id', () => {
      state.notifications['device123'] = {
        room1: { temp: [{ id: 1, value: 20 }] },
      };
      configModule.mutations.UPDATE_NOTIFICATION_VALUE(state, {
        dID: 'device123', room: 'room1', param: 'temp', id: 1, title: 'value', value: 25,
      });
      expect(state.notifications['device123'].room1.temp[0].value).toBe(25);
      expect(state.notifications['device123'].room1.temp[0].updatedAt).toBe('MOCKED_TIMESTAMP');
    });

    it('UPDATE_NOTIFICATION_VALUE ничего не делает если dID не найден', () => {
      configModule.mutations.UPDATE_NOTIFICATION_VALUE(state, {
        dID: 'unknown', room: 'room1', param: 'temp', id: 1, title: 'value', value: 25,
      });
      expect(state.notifications['unknown']).toBeUndefined();
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

    it('getConfig возвращает undefined для несуществующего dID', () => {
      expect(configModule.getters.getConfig(state)('nonexistent')).toBeUndefined();
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

    it('getCommonConfig возвращает конфиг по dID', () => {
      state.configs['device123'] = { room1: {} };
      expect(configModule.getters.getCommonConfig(state)('device123')).toEqual({ room1: {} });
    });

    it('allRooms возвращает список комнат', () => {
      state.allRooms = ['room1', 'room2'];
      expect(configModule.getters.allRooms(state)).toEqual(['room1', 'room2']);
    });

    it('allParams возвращает список параметров', () => {
      state.allParams = ['temp', 'humidity'];
      expect(configModule.getters.allParams(state)).toEqual(['temp', 'humidity']);
    });

    it('getMobile возвращает флаг мобильного', () => {
      state.mobile = true;
      expect(configModule.getters.getMobile(state)).toBe(true);
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

    it('handleConfigResponse type=notifications: коммитит SET_NOTIFICATION', async () => {
      const response = {
        name: 'device123',
        request: 'notifications',
        payload: { room1: { temp: [] } },
      };
      await configModule.actions.handleConfigResponse(context, response);
      expect(context.commit).toHaveBeenCalledWith('SET_NOTIFICATION', {
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

    it('requestConfig: отправляет websocket/send и возвращает конфиг из state', async () => {
      // Предварительно кладём конфиг в state — имитируем ответ сервера
      context.state.configs['device123'] = { room1: { sensors: { temp1: { value: 22 } } } };
      const result = await configModule.actions.requestConfig(context, 'device123');
      expect(context.dispatch).toHaveBeenCalledWith(
        'websocket/send',
        { type: 'get', request: 'config', name: 'device123' },
        { root: true }
      );
      expect(result).toEqual(context.state.configs['device123']);
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

      it('type=notifications: коммитит UPDATE_NOTIFICATION_VALUE', async () => {
        await configModule.actions.handleValueUpdate(context, {
          dID: 'device123', payload: {}, type: 'notifications',
        });
        expect(context.commit).toHaveBeenCalledWith('UPDATE_NOTIFICATION_VALUE', {
          dID:   'device123',
          room:  'room1',
          param: 'temp',
          id:    1,
          title: 'value',
          value: 22,
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

      it('type=sensors: не коммитит ничего (тип не обрабатывается)', async () => {
        await configModule.actions.handleValueUpdate(context, {
          dID: 'device123', payload: {}, type: 'sensors',
        });
        expect(context.commit).not.toHaveBeenCalled();
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

    it('clearKey: убирает первый символ и цифры в конце', () => {
      const result = configModule.actions.clearKey(context, { key: 'dTemp1' });
      expect(result).toBe('Temp');
    });

    it('clearKey: ключ без цифр в конце', () => {
      const result = configModule.actions.clearKey(context, { key: 'dHumidity' });
      expect(result).toBe('Humidity');
    });
  });
});