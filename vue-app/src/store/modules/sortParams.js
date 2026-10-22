// store/modules/sortParams.js
import logger from './logger';

const SENSOR_TITLES = {
  dHum: 'Влажность',
  dTemp: 'Температура',
  dPress: 'Давление',
  dPower: 'Потребление',
  dMove: 'Движение',
  dFire: 'Возгорания',
  dLeak: 'Утечки',
  aLamp: 'Освещение',
  aFan: 'Вентиляция',
  aPump: 'Насос',
  aValve: 'Клапан',
  aRelay: 'Реле',
  dFrequency: 'Частота',
  dVoltage: 'Напряжение',
  dEnergy: 'Потребление',
  dCurrent: 'Ток',
  aActuator: 'Актуатор',
  aSwitch: 'Переключатель',
  sSwitch: 'Переключатель',
  aController: 'Контроллер',
  dBat: 'Батарея',
  sTemp: 'Уставка температуры',
  sHum: 'Уставка влажности',
  sActuator: 'Уставка актуатора',
  dCurSetpoint: 'Уставка Устройства',
  dStatus: 'Статус',
  dMode: 'Режим',
  dFanSp: 'Скорость вентилятора',
  dFanMode: 'Режим вентилятора',
  dConnect: 'Состояние связи',
  dErrStat: 'Статус ошибки',
  dErrCode: 'Код Ошибки',
};

// [подстрока ключа, единица измерения]; порядок важен
const UNIT_RULES = [
  ['Temp', '°C'],
  ['Hum', '%'],
  ['Press', 'hPa'],
  ['Power', 'W'],
  ['Сurrent', 'A'], // кириллическая «С», как в ключе выше
  ['Bat', '%'],
  ['Voltage', 'V'],
  ['Frequency', 'Hz'],
  ['Energy', 'kWh'],
];

function getSensorTitle(key) {
  if (!key) return 'Неизвестный параметр';
  const baseKey = key.replace(/\d+$/, '');
  return SENSOR_TITLES[baseKey] || key;
}

function getUnit(key) {
  if (!key) return '';
  const rule = UNIT_RULES.find(([part]) => key.includes(part));
  return rule ? rule[1] : '';
}

// Лимиты, не зависящие от конфигурации устройства
const SPECIAL_LIMITS = {
  frequency: { low: 0, high: 1440, step: 1 },
  sensityRate: { low: 0.1, high: 12, step: 0.1 },
};
const DEFAULT_LIMITS = { low: 4, high: 40, step: 0.5 };

// Приводит лимиты к числам: в конфиге встречаются булевы (Bool: {high:true, low:false})
function normalizeLimits(raw) {
  const low = Number(raw?.low);
  const high = Number(raw?.high);
  const step = Number(raw?.step);
  if (!Number.isFinite(low) || !Number.isFinite(high) || !Number.isFinite(step) || step <= 0) {
    return { ...DEFAULT_LIMITS };
  }
  return { low, high, step };
}

const KEY_TYPES = ['rooms', 'params', 'devices', 'setpoints'];
const KEY_GETTERS = {
  rooms: 'roomKey',
  params: 'paramKey',
  devices: 'deviceKey',
  setpoints: 'setpointKey',
};
const KEY_LISTS = {
  rooms: 'config/allRooms',
  params: 'config/allParams',
  devices: 'config/allDevices',
  setpoints: 'config/allSetpoints',
};
// Какое поле payload сбрасываем / какой ключ localStorage чистим
const RESET_TARGETS = {
  rooms: { payload: { room: null }, storage: 'roomKey' },
  params: { payload: { param: null }, storage: 'paramKey' },
  devices: { payload: { device: null }, storage: 'deviceKey' },
  setpoints: { payload: { setKey: null }, storage: 'setpointKey' },
  key: { payload: { key: null }, storage: 'clearKey' },
};

export default {
  namespaced: true,

  state: () => ({
    sortType: 'rooms',
    roomId: 0,
    roomTitle: '',
    paramTitle: '',
    deviceTitle: '',
    setpointTitle: '',
    forceUpdate: 0,
    limHigh: null,
    limLow: null,
    limStep: null,
  }),

  getters: {
    getDeviceKey: (state, getters, rootState, rootGetters) => rootGetters['deviceKey'],
    getRoomKey: (state, getters, rootState, rootGetters) => rootGetters['roomKey'],
    getParamKey: (state, getters, rootState, rootGetters) => rootGetters['paramKey'],
    getSetpointKey: (state, getters, rootState, rootGetters) => rootGetters['setpointKey'],

    currentSortType: (state) => state.sortType,
    getDeviceTitle: (state) => state.deviceTitle,
    getRoomId: (state) => state.roomId,
    getRoomTitle: (state) => state.roomTitle,
    getParamTitle: (state) => state.paramTitle,
    getSetpointTitle: (state) => state.setpointTitle,
    getSensorTitle: () => (key) => getSensorTitle(key),
    getUnit: () => (key) => getUnit(key),
  },

  mutations: {
    SET_SORT_TYPE(state, type) {
      if (KEY_TYPES.includes(type)) {
        state.sortType = type;
        state.forceUpdate = Date.now();
      }
    },
    SET_ROOM_ID(state, id) {
      state.roomId = Number(id) || 0;
      state.forceUpdate = Date.now();
    },
    SET_DEVICE_TITLE(state, title) { state.deviceTitle = title || ''; },
    SET_SETPOINT_TITLE(state, title) { state.setpointTitle = title || ''; },
    SET_ROOM_TITLE(state, title) { state.roomTitle = title || 'Главная комната'; },
    SET_PARAM_TITLE(state, title) { state.paramTitle = title || 'Температура'; },
    UPDATE_LIMITS(state, limits) {
      // !== undefined (а не truthy): 0 — валидный лимит
      if (limits.limHigh !== undefined) state.limHigh = limits.limHigh;
      if (limits.limLow !== undefined) state.limLow = limits.limLow;
      if (limits.limStep !== undefined) state.limStep = limits.limStep;
    },
    SET_FORCE_UPDATE(state, timestamp) { state.forceUpdate = timestamp; },
  },

  actions: {
    updateSortKey({ commit, dispatch }, { type, newKey }) {
      // ── Сброс ключа ──
      if (!newKey) {
        const target = RESET_TARGETS[type];
        if (!target) {
          logger.error(`[sortParams] updateSortKey - неизвестный тип для сброса: ${type}`);
          return;
        }
        dispatch('updatePayloadData', target.payload, { root: true });
        localStorage.removeItem(target.storage);
        commit('SET_FORCE_UPDATE', Date.now());
        return;
      }

      // ── Обновление ключа ──
      try {
        switch (type) {
          case 'rooms':
            dispatch('updatePayloadData', { room: newKey }, { root: true });
            localStorage.setItem('roomKey', newKey);
            dispatch('updateRoomsTitle', newKey);
            break;
          case 'key':
            dispatch('updatePayloadData', { clearKey: newKey }, { root: true });
            break;
          case 'params': {
            // dSwitch03 → dSwitch
            const cleanKey = newKey.replace(/\d+$/, '');
            dispatch('updatePayloadData', { param: newKey }, { root: true });
            const paramTitle = getSensorTitle(cleanKey);
            if (paramTitle) commit('SET_PARAM_TITLE', paramTitle);
            break;
          }
          case 'devices':
            dispatch('updatePayloadData', { device: newKey }, { root: true });
            localStorage.setItem('deviceKey', newKey);
            break;
          case 'setpoints': {
            // sSwitch01 → sSwitch
            const cleanKey = newKey.replace(/\d+$/, '');
            dispatch('updatePayloadData', { setKey: cleanKey }, { root: true });
            localStorage.setItem('setpointKey', cleanKey);
            break;
          }
          default:
            logger.error(`[sortParams] updateSortKey - неизвестный тип: ${type}`);
            return;
        }
        commit('SET_FORCE_UPDATE', Date.now());
        logger.dev(`[sortParams] updateSortKey - ключ ${type} обновлён:`, newKey);
      } catch (error) {
        logger.error(`[sortParams] updateSortKey - ошибка при обновлении ${type}:`, error);
      }
    },

    updateRoomsTitle({ commit, rootGetters }, newRoomKey) {
      if (!newRoomKey) {
        logger.error('[sortParams] updateRoomsTitle - ключ не определен');
        return;
      }
      const config = rootGetters['config/getConfig'](rootGetters['dID']);
      const room = config?.[newRoomKey] || {};
      commit('SET_ROOM_ID', room.id || 0);
      commit('SET_ROOM_TITLE', room.title || 'не определен');
    },

    setSortType({ commit, state }, type) {
      if (state.sortType === type) return;
      commit('SET_SORT_TYPE', type);
    },

    setLimits({ rootGetters, dispatch, commit }, { param, valueType }) {
      let limits = SPECIAL_LIMITS[param];

      if (!limits) {
        const config = rootGetters['config/getConfig'](rootGetters['dID']);
        const configLimits = config?.init?.limits;
        limits = configLimits?.[param] || configLimits?.Default;
        if (!limits) {
          logger.warn('[sortParams] setLimits - лимиты не найдены, используем значения по умолчанию:', param);
        }
      }
      limits = normalizeLimits(limits);

      // Для отклонения от уставки — диапазон ±25% от верхней границы
      if (valueType === 'deviation') {
        const range = Math.round(limits.high / 4);
        limits = { low: -range, high: range, step: limits.step / 10 };
      }

      const payload = { limHigh: limits.high, limLow: limits.low, limStep: limits.step };
      dispatch('updateLimitsData', payload, { root: true });
      commit('UPDATE_LIMITS', payload);
      logger.dev('[sortParams] setLimits -', param, valueType, payload);
    },

    switchSortKey({ dispatch, rootGetters }, { sortingType, direction = 'prev' }) {
      if (!KEY_TYPES.includes(sortingType)) {
        logger.error(`[sortParams] switchSortKey - неизвестный тип: ${sortingType}`);
        return;
      }
      const array = rootGetters[KEY_LISTS[sortingType]] || [];
      if (array.length === 0) {
        logger.warn(`[sortParams] switchSortKey - массив для ${sortingType} пуст`);
        return;
      }

      const currentKey = rootGetters[KEY_GETTERS[sortingType]] || array[0];
      const currentIndex = array.indexOf(currentKey);
      if (currentIndex === -1) {
        logger.error(`[sortParams] switchSortKey - ключ ${currentKey} не найден (${sortingType})`);
        return;
      }

      const newIndex = direction === 'next'
        ? (currentIndex + 1) % array.length
        : (currentIndex - 1 + array.length) % array.length;

      dispatch('updateSortKey', { type: sortingType, newKey: array[newIndex] });
    },
  },
};
