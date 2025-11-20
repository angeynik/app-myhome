// src/tests/unit/sortParams.spec.js
import sortParams from '@/store/modules/sortParams';

const flushPromises = () =>
  new Promise((resolve) => (typeof setImmediate === 'function' ? setImmediate(resolve) : setTimeout(resolve, 0)));

// Мокаем logger чтобы избежать console.log в тестах
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
      'config/allSetpoints': ['setpoint1', 'setpoint2']
    };
  });

  describe('getters', () => {
    it('getSensorTitle returns correct title', () => {
      const { getSensorTitle } = sortParams.getters;
      expect(getSensorTitle()(null)).toBe('Неизвестный параметр');
      expect(getSensorTitle()('dTemp1')).toBe('Температура');
      expect(getSensorTitle()('dHum')).toBe('Влажность');
      expect(getSensorTitle()('unknownKey')).toBe('unknownKey');
    });

    it('getUnit returns correct unit', () => {
      const { getUnit } = sortParams.getters;
      expect(getUnit()('dTemp')).toBe('°C');
      expect(getUnit()('dHum')).toBe('%');
      expect(getUnit()('dPress')).toBe('hPa');
      expect(getUnit()('dPower')).toBe('W');
      expect(getUnit()('dMove')).toBe('');
    });
  });

  describe('mutations', () => {
    it('SET_SORT_TYPE sets valid sort type', () => {
      sortParams.mutations.SET_SORT_TYPE(state, 'params');
      expect(state.sortType).toBe('params');
      sortParams.mutations.SET_SORT_TYPE(state, 'invalid');
      expect(state.sortType).toBe('params'); // Не должен измениться на невалидный тип
    });

    it('SET_PARAM_KEY updates paramKey', () => {
      state.paramKey = 'oldKey';
      sortParams.mutations.SET_PARAM_KEY(state, 'newKey');
      expect(state.paramKey).toBe('newKey');
    });

    it('UPDATE_LIMITS updates limits correctly', () => {
      sortParams.mutations.UPDATE_LIMITS(state, {
        limHigh: 100,
        limLow: 1,
        limStep: 5
      });
      expect(state.limHigh).toBe(100);
      expect(state.limLow).toBe(1);
      expect(state.limStep).toBe(5);
    });
  });

  describe('actions', () => {
    beforeEach(() => {
      // Мокаем localStorage для всех тестов действий
      Object.defineProperty(global, 'localStorage', {
        value: {
          setItem: jest.fn(),
          getItem: jest.fn()
        },
        configurable: true
      });
    });

    it('updateSortKey for params sets paramKey and paramTitle', async () => {
      const context = { commit, dispatch, state: { paramKey: 'oldKey' } };
      
      await sortParams.actions.updateSortKey(context, { type: 'params', newKey: 'dTemp' });
      
      expect(commit).toHaveBeenCalledWith('SET_PARAM_KEY', 'dTemp');
      expect(global.localStorage.setItem).toHaveBeenCalledWith('paramKey', 'dTemp');
    });

    it('updateSortKey for rooms sets roomKey and dispatches updateRoomsTitle', async () => {
      const context = { commit, dispatch, state: { roomKey: 'oldRoom' } };
      
      await sortParams.actions.updateSortKey(context, { type: 'rooms', newKey: 'room2' });
      
      expect(commit).toHaveBeenCalledWith('SET_ROOM_KEY', 'room2');
      expect(global.localStorage.setItem).toHaveBeenCalledWith('roomKey', 'room2');
      expect(dispatch).toHaveBeenCalledWith('updateRoomsTitle', 'room2');
    });

    // it('updateSortKey does nothing when newKey is same as current', async () => {
    //   const context = { commit, dispatch, state: { paramKey: 'dTemp' } };
      
    //   await sortParams.actions.updateSortKey(context, { type: 'params', newKey: 'dTemp' });
      
    //   expect(commit).not.toHaveBeenCalled();
    // });


    it('updateRoomsTitle updates room title and id', async () => {
      const context = { commit, rootGetters };
      
      await sortParams.actions.updateRoomsTitle(context, 'room2');
      
      expect(commit).toHaveBeenCalledWith('SET_ROOM_ID', 2);
      expect(commit).toHaveBeenCalledWith('SET_ROOM_TITLE', 'Кухня');
    });

    it('updateRoomsTitle handles missing room', async () => {
      const context = { commit, rootGetters };
      
      await sortParams.actions.updateRoomsTitle(context, 'nonexistent');
      
      expect(commit).toHaveBeenCalledWith('SET_ROOM_ID', 0);
      expect(commit).toHaveBeenCalledWith('SET_ROOM_TITLE', 'не определен');
    });

    it('setSortType commits sort type when different', async () => {
      const context = { commit, state: { sortType: 'rooms' } };
      
      await sortParams.actions.setSortType(context, 'params');
      
      expect(commit).toHaveBeenCalledWith('SET_SORT_TYPE', 'params');
    });

    it('setSortType does nothing when sort type is same', async () => {
      const context = { commit, state: { sortType: 'rooms' } };
      
      await sortParams.actions.setSortType(context, 'rooms');
      
      expect(commit).not.toHaveBeenCalled();
    });

    it('switchSortKey for rooms with next direction', async () => {
      const context = { 
        dispatch, 
        state: { roomKey: 'room2' }, 
        rootGetters 
      };
      
      await sortParams.actions.switchSortKey(context, { sortingType: 'rooms', direction: 'next' });
      
      expect(dispatch).toHaveBeenCalledWith('updateSortKey', { type: 'rooms', newKey: 'room3' });
    });

    it('switchSortKey for rooms with next direction wraps around', async () => {
      const context = { 
        dispatch, 
        state: { roomKey: 'room3' }, 
        rootGetters 
      };
      
      await sortParams.actions.switchSortKey(context, { sortingType: 'rooms', direction: 'next' });
      
      expect(dispatch).toHaveBeenCalledWith('updateSortKey', { type: 'rooms', newKey: 'room1' });
    });

    it('switchSortKey for rooms with prev direction', async () => {
      const context = { 
        dispatch, 
        state: { roomKey: 'room2' }, 
        rootGetters 
      };
      
      await sortParams.actions.switchSortKey(context, { sortingType: 'rooms', direction: 'prev' });
      
      expect(dispatch).toHaveBeenCalledWith('updateSortKey', { type: 'rooms', newKey: 'room1' });
    });

    it('switchSortKey for rooms with prev direction wraps around', async () => {
      const context = { 
        dispatch, 
        state: { roomKey: 'room1' }, 
        rootGetters 
      };
      
      await sortParams.actions.switchSortKey(context, { sortingType: 'rooms', direction: 'prev' });
      
      expect(dispatch).toHaveBeenCalledWith('updateSortKey', { type: 'rooms', newKey: 'room3' });
    });

    it('switchSortKey for params works correctly', async () => {
      const context = { 
        dispatch, 
        state: { paramKey: 'dTemp' }, 
        rootGetters 
      };
      
      await sortParams.actions.switchSortKey(context, { sortingType: 'params', direction: 'next' });
      
      expect(dispatch).toHaveBeenCalledWith('updateSortKey', { type: 'params', newKey: 'dHum' });
    });

    it('switchSortKey handles empty array', async () => {
      const emptyRootGetters = {
        ...rootGetters,
        'config/allRooms': []
      };
      const context = { 
        dispatch, 
        state: { roomKey: 'room1' }, 
        rootGetters: emptyRootGetters 
      };
      
      await sortParams.actions.switchSortKey(context, { sortingType: 'rooms', direction: 'next' });
      
      expect(dispatch).not.toHaveBeenCalled();
    });

    it('setLimits uses cleaned key and commits limits', async () => {
      const context = {
        rootGetters,
        commit,
        dispatch: jest.fn().mockResolvedValue('dTemp')
      };

      sortParams.actions.setLimits(context, 'dTemp');
      await flushPromises();

      expect(context.dispatch).toHaveBeenCalledWith('config/clearKey', { key: 'dTemp' }, { root: true });
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

      sortParams.actions.setLimits(context, 'unknownKey');
      await flushPromises();

      expect(commit).toHaveBeenCalledWith('UPDATE_LIMITS', {
        limHigh: 32,
        limLow: 10,
        limStep: 0.5
      });
    });

    it('setLimits handles dispatch error', async () => {
      const context = {
        rootGetters,
        commit,
        dispatch: jest.fn().mockRejectedValue(new Error('fail'))
      };

      sortParams.actions.setLimits(context, 'dTemp');
      await flushPromises();

      expect(commit).toHaveBeenCalledWith('UPDATE_LIMITS', {
        limHigh: 32,
        limLow: 10,
        limStep: 1
      });
    });
  });
});