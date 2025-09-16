// src/tests/unit/sortParams.spec.js
import sortParams from '@/store/modules/sortParams';

const flushPromises = () =>
  new Promise((resolve) => (typeof setImmediate === 'function' ? setImmediate(resolve) : setTimeout(resolve, 0)));

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
      'config/allParams': ['dTemp', 'dHum', 'dPress']
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
      expect(state.sortType).toBe('params');
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
    it('updateParamsKey sets paramKey and paramTitle', async () => {
      const context = { commit };

      Object.defineProperty(global, 'localStorage', {
        value: {
          setItem: jest.fn(),
          getItem: jest.fn()
        },
        configurable: true
      });

      await sortParams.actions.updateParamsKey(context, 'dTemp');
      expect(commit).toHaveBeenCalledWith('SET_PARAM_KEY', 'dTemp');
      expect(commit).toHaveBeenCalledWith('SET_PARAM_TITLE', 'Температура');
      expect(global.localStorage.setItem).toHaveBeenCalledWith('paramKey', 'dTemp');
    });

    it('switchToNextRoom dispatches updateRoomsKey with next room', async () => {
      const context = { dispatch, state: { roomKey: 'room2' }, rootGetters };
      await sortParams.actions.switchToNextRoom(context);
      expect(dispatch).toHaveBeenCalledWith('updateRoomsKey', 'room3');
    });

    it('switchToNextRoom wraps around to first room', async () => {
      const context = { dispatch, state: { roomKey: 'room3' }, rootGetters };
      await sortParams.actions.switchToNextRoom(context);
      expect(dispatch).toHaveBeenCalledWith('updateRoomsKey', 'room1');
    });

    it('switchToPrevRoom dispatches updateRoomsKey with previous room', async () => {
      const context = { dispatch, state: { roomKey: 'room2' }, rootGetters };
      await sortParams.actions.switchToPrevRoom(context);
      expect(dispatch).toHaveBeenCalledWith('updateRoomsKey', 'room1');
    });

    it('switchToPrevRoom wraps around to last room', async () => {
      const context = { dispatch, state: { roomKey: 'room1' }, rootGetters };
      await sortParams.actions.switchToPrevRoom(context);
      expect(dispatch).toHaveBeenCalledWith('updateRoomsKey', 'room3');
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
      const commit = jest.fn();
      const context = {
        rootGetters,
        commit,
        dispatch: jest.fn().mockRejectedValue(new Error('fail'))
      };

      // Подавим консоль ошибок в этом тесте, чтобы не шумело
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

      sortParams.actions.setLimits(context, 'dTemp');
      await flushPromises();

      expect(commit).toHaveBeenCalledWith('UPDATE_LIMITS', {
        limHigh: 32,
        limLow: 10,
        limStep: 1
      });

      spy.mockRestore();
    });

    it('updateRoomsKey sets roomKey and dispatches updateRoomsTitle', async () => {
      Object.defineProperty(global, 'localStorage', {
        value: {
          setItem: jest.fn(),
          getItem: jest.fn()
        },
        configurable: true
      });

      const context = { commit, dispatch };
      await sortParams.actions.updateRoomsKey.call({ state }, context, 'room2');
      expect(commit).toHaveBeenCalledWith('SET_ROOM_KEY', 'room2');
      expect(global.localStorage.setItem).toHaveBeenCalledWith('roomKey', 'room2');
      expect(dispatch).toHaveBeenCalledWith('updateRoomsTitle', 'room2');
    });

    it('setRoom updates room state', async () => {
      const context = { commit };
      const room = { id: 5, key: 'room5', title: 'Балкон' };
      await sortParams.actions.setRoom(context, room);
      expect(commit).toHaveBeenCalledWith('UPDATE_STATE', {
        roomId: 5,
        roomKey: 'room5',
        roomTitle: 'Балкон'
      });
    });

    it('setParam updates param state', async () => {
      const context = { commit };
      const param = { key: 'dFire', title: 'Контроль возгорания' };
      await sortParams.actions.setParam(context, param);
      expect(commit).toHaveBeenCalledWith('UPDATE_STATE', {
        paramKey: 'dFire',
        paramTitle: 'Контроль возгорания'
      });
    });
  });
});
