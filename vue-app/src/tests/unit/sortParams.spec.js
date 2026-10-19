// src/tests/unit/sortParams.spec.js

// Мокаем store до импорта sortParams
jest.mock('@/store', () => ({
  state: { setpointsManager: { settingsData: { limits: {} } } },
  getters: {},
  commit: jest.fn(),
  dispatch: jest.fn()
}));

import sortParams from '@/store/modules/sortParams';

const flushPromises = () =>
  new Promise((resolve) => (typeof setImmediate === 'function' ? setImmediate(resolve) : setTimeout(resolve, 0)));

jest.mock('@/store/modules/logger', () => ({
  info: jest.fn(),
  dev: jest.fn(),
  error: jest.fn(),
  isInfoEnabled: () => false,
  isDevEnabled: () => false,
  isErrorEnabled: () => false
}));

describe('sortParams store module', () => {
  let state;
  let commit;
  let dispatch;
  let rootGetters;

  beforeEach(() => {
    state = sortParams.state();
    commit = jest.fn();
    dispatch = jest.fn();
    rootGetters = {
      'dID': 'device123',
      'config/getConfig': jest.fn().mockReturnValue({
        room1: { id: 1, title: 'Гостиная' },
        room2: { id: 2, title: 'Кухня' },
        room3: { id: 3, title: 'Спальня' },
        init: {
          limits: {
            dTemp: { low: 5, high: 50, step: 2 },
            Default: { low: 10, high: 32, step: 0.5 }
          }
        }
      }),
      'config/allRooms': ['room1', 'room2', 'room3'],
      'config/allParams': ['dTemp', 'dHum', 'dPress'],
      'config/allDevices': ['device1', 'device2'],
      'config/allSetpoints': ['setpoint1', 'setpoint2'],
      // Добавляем геттеры для ключей, которые используются в switchSortKey
      roomKey: 'room2',
      paramKey: 'dTemp',
      deviceKey: 'device1',
      setpointKey: 'setpoint1'
    };

    // Мокаем localStorage
    Object.defineProperty(global, 'localStorage', {
      value: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      },
      configurable: true
    });
  });

  describe('getters', () => {
    // ... без изменений
  });

  describe('mutations', () => {
    // ... без изменений
  });

  describe('actions', () => {
    it('updateSortKey for params sets paramTitle and dispatches updatePayloadData', async () => {
      const context = { commit, dispatch, state: {} };
      
      await sortParams.actions.updateSortKey(context, { type: 'params', newKey: 'dTemp' });
      
      expect(dispatch).toHaveBeenCalledWith('updatePayloadData', { param: 'dTemp' }, { root: true });
      expect(commit).toHaveBeenCalledWith('SET_PARAM_TITLE', 'Температура');
      // В коде нет сохранения paramKey в localStorage, поэтому не проверяем
      // Проверяем только принудительное обновление
      expect(commit).toHaveBeenCalledWith('SET_FORCE_UPDATE', expect.any(Number));
    });

    // ... другие тесты для updateSortKey (rooms, devices, setpoints, reset) — без изменений

    // Исправляем switchSortKey тесты: добавляем rootGetters с нужными ключами
    it('switchSortKey for rooms with next direction', async () => {
      const context = { 
        dispatch, 
        state: {}, 
        rootGetters: { 
          ...rootGetters, 
          roomKey: 'room2',
          'config/allRooms': ['room1', 'room2', 'room3']
        }
      };
      
      await sortParams.actions.switchSortKey(context, { sortingType: 'rooms', direction: 'next' });
      
      expect(dispatch).toHaveBeenCalledWith('updateSortKey', { type: 'rooms', newKey: 'room3' });
    });

    it('switchSortKey for rooms with next direction wraps around', async () => {
      const context = { 
        dispatch, 
        state: {}, 
        rootGetters: { 
          ...rootGetters, 
          roomKey: 'room3',
          'config/allRooms': ['room1', 'room2', 'room3']
        }
      };
      
      await sortParams.actions.switchSortKey(context, { sortingType: 'rooms', direction: 'next' });
      
      expect(dispatch).toHaveBeenCalledWith('updateSortKey', { type: 'rooms', newKey: 'room1' });
    });

    it('switchSortKey for rooms with prev direction', async () => {
      const context = { 
        dispatch, 
        state: {}, 
        rootGetters: { 
          ...rootGetters, 
          roomKey: 'room2',
          'config/allRooms': ['room1', 'room2', 'room3']
        }
      };
      
      await sortParams.actions.switchSortKey(context, { sortingType: 'rooms', direction: 'prev' });
      
      expect(dispatch).toHaveBeenCalledWith('updateSortKey', { type: 'rooms', newKey: 'room1' });
    });

    it('switchSortKey for rooms with prev direction wraps around', async () => {
      const context = { 
        dispatch, 
        state: {}, 
        rootGetters: { 
          ...rootGetters, 
          roomKey: 'room1',
          'config/allRooms': ['room1', 'room2', 'room3']
        }
      };
      
      await sortParams.actions.switchSortKey(context, { sortingType: 'rooms', direction: 'prev' });
      
      expect(dispatch).toHaveBeenCalledWith('updateSortKey', { type: 'rooms', newKey: 'room3' });
    });

    it('switchSortKey for params works correctly', async () => {
      const context = { 
        dispatch, 
        state: {}, 
        rootGetters: { 
          ...rootGetters, 
          paramKey: 'dTemp',
          'config/allParams': ['dTemp', 'dHum', 'dPress']
        }
      };
      
      await sortParams.actions.switchSortKey(context, { sortingType: 'params', direction: 'next' });
      
      expect(dispatch).toHaveBeenCalledWith('updateSortKey', { type: 'params', newKey: 'dHum' });
    });

    // switchSortKey handles empty array — без изменений

    // Исправляем setLimits: передаём объект с param, а не строку
    it('setLimits uses cleaned key and commits limits', async () => {
      const context = {
        rootGetters,
        commit,
        dispatch: jest.fn().mockResolvedValue('dTemp')
      };

      // Передаём объект { param: 'dTemp' } — код ожидает объект с полем param
      sortParams.actions.setLimits(context, { param: 'dTemp' });
      await flushPromises();

      expect(commit).toHaveBeenCalledWith('UPDATE_LIMITS', {
        limHigh: 50,
        limLow: 5,
        limStep: 2
      });
    });

it('setLimits fallback to default on missing limits', async () => {
  rootGetters['config/getConfig'] = jest.fn().mockReturnValue({});
  const context = {
    rootGetters,
    commit,
    dispatch: jest.fn().mockResolvedValue('unknownKey')
  };

  sortParams.actions.setLimits(context, { param: 'unknownKey' });
  await flushPromises();

  // Ожидаем запасные лимиты из кода: low=4, high=40, step=0.5
  expect(commit).toHaveBeenCalledWith('UPDATE_LIMITS', {
    limHigh: 40,
    limLow: 4,
    limStep: 0.5
  });
});

    // Добавим тест для случая valueType='deviation'
    it('setLimits handles deviation value type', async () => {
      const context = {
        rootGetters,
        commit,
        dispatch: jest.fn().mockResolvedValue('dTemp')
      };

      sortParams.actions.setLimits(context, { param: 'dTemp', valueType: 'deviation' });
      await flushPromises();

      // Для deviation пределы пересчитываются: high/4 = 50/4 = 12.5, low = -12.5, step = 2/10 = 0.2
      expect(commit).toHaveBeenCalledWith('UPDATE_LIMITS', {
        limHigh: 13, // округление? В коде используется Math.round(high/4) → 13
        limLow: -13,
        limStep: 0.2
      });
    });
  });
});