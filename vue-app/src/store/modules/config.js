// store/modules/config.js
import logger from './logger';
import { nowMoscow } from '@/utils/timeUtils';

const LIMITS = {
  schedules: parseInt(process.env.VUE_APP_LIM_SCHEDULE_ITEM, 10) || 8,
  notifications: parseInt(process.env.VUE_APP_LIM_NOTIFICATION_ITEM, 10) || 6,
  statistics: parseInt(process.env.VUE_APP_LIM_STATISTIC_ITEM, 10) || 1,
};

// Допустимые значения typeSettingsKey. Раньше по умолчанию использовалось
// 'schedule' (без «s») — оно не совпадало ни с одним ключом экрана настроек,
// и экран открывался пустым.
const SETTINGS_TYPES = ['schedules', 'notifications', 'statistics'];
const normalizeSettingsType = (t) => (SETTINGS_TYPES.includes(t) ? t : 'schedules');

const CONFIG_TIMEOUT = 10000;
const SERVICE_ROOM_KEYS = new Set(['init', 'newConfigID', 'password']);
const ROOM_EXCLUDED_SECTIONS = ['init', 'id', 'group', 'title', 'setpoints'];
const DEVICE_EXCLUDED_SECTIONS = ['id', 'group', 'title', 'setpoints', 'sensors'];

// Ожидающие загрузки конфигурации: dID → { promise, resolve, reject, timer }
const configWaiters = new Map();

function readStorage(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeStorage(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { logger.warn('[config] localStorage:', e.message); }
}

// Только «настоящие» комнаты: объекты, не служебные ключи
function roomEntries(config) {
  return Object.entries(config || {}).filter(
    ([key, room]) => !SERVICE_ROOM_KEYS.has(key) && room && typeof room === 'object',
  );
}

// Точечное обновление элемента списка (расписание / уведомление / аналитика)
function patchListItem(bucket, { dID, room, param, id, title, value }) {
  const list = bucket?.[dID]?.[room]?.[param];
  if (!Array.isArray(list)) return false;
  const index = list.findIndex((item) => (item.id ?? item._id) === id);
  if (index === -1) return false;
  list[index] = { ...list[index], [title]: value, updatedAt: nowMoscow() };
  return true;
}

export default {
  namespaced: true,

  state: () => ({
    configs: {},        // конфигурация по dID
    schedules: {},      // расписания по dID
    notifications: {},  // уведомления по dID
    statistics: {},     // аналитика по dID
    allRooms: [],
    allParams: [],
    allDevices: [],
    allSetpoints: [],
    loading: false,
    error: null,
    mobile: false,
    deviceType: 'desktop', // 'desktop' | 'tablet' | 'phone'
    typeSettingsKey: normalizeSettingsType(readStorage('typeSettingsKey')),
  }),

  mutations: {
    SET_CONFIG(state, { name, config }) { state.configs[name] = config; },
    SET_SCHEDULE(state, { name, config }) { state.schedules[name] = config; },
    SET_NOTIFICATION(state, { name, config }) { state.notifications[name] = config; },
    SET_STATISTIC(state, { name, config }) { state.statistics[name] = config; },

    SET_ALL_ROOMS(state, rooms) { state.allRooms = rooms; },
    SET_ALL_PARAMS(state, params) { state.allParams = params; },
    SET_ALL_DEVICES(state, devices) { state.allDevices = devices; },
    SET_ALL_SETPOINTS(state, setpoints) { state.allSetpoints = setpoints; },

    // Сброс при выходе: данные предыдущего пользователя не должны оставаться в памяти
    RESET(state) {
      state.configs = {};
      state.schedules = {};
      state.notifications = {};
      state.statistics = {};
      state.allRooms = [];
      state.allParams = [];
      state.allDevices = [];
      state.allSetpoints = [];
      state.loading = false;
      state.error = null;
      configWaiters.forEach((w) => clearTimeout(w.timer));
      configWaiters.clear();
    },

    UPDATE_CONFIG_VALUE(state, { dID, room, type, name, value }) {
      const config = state.configs[dID];
      console.log('[config] - UPDATE_CONFIG_VALUE - Обновление конфигурации', config);
      if (!config) {
        logger.error(`[config] - UPDATE_CONFIG_VALUE - dID ${dID} не найден`);
        return;
      }
      const roomObj = config[room];
      if (!roomObj) {
        logger.error(`[config] - UPDATE_CONFIG_VALUE - комната ${room} не найдена`);
        return;
      }
      if (!name) {
        logger.warn('[config] - UPDATE_CONFIG_VALUE - не указано имя элемента', { room, type });
        return;
      }
      if (!roomObj[type]) {
        logger.warn(`[config] - тип ${type} не найден в комнате ${room}, создаём`);
        roomObj[type] = {};
      }
      if (!roomObj[type][name]) {
        logger.warn(`[config] - элемент ${name} не найден в комнате ${room}, создаём`);
        roomObj[type][name] = {};
      }
      roomObj[type][name].value = value;
      roomObj[type][name].lastUpdate = nowMoscow();
    },

    UPDATE_SCHEDULE_VALUE(state, args) {
      if (!patchListItem(state.schedules, args)) {
        logger.dev('[config] - UPDATE_SCHEDULE_VALUE - элемент не найден', args);
      }
    },
    UPDATE_NOTIFICATION_VALUE(state, args) {
      if (!patchListItem(state.notifications, args)) {
        logger.dev('[config] - UPDATE_NOTIFICATION_VALUE - элемент не найден', args);
      }
    },
    UPDATE_STATISTIC_VALUE(state, args) {
      if (!patchListItem(state.statistics, args)) {
        logger.dev('[config] - UPDATE_STATISTIC_VALUE - элемент не найден', args);
      }
    },

    UPDATE_CONFIGDATA_LOCALLY(state, { dID, configName, configData }) {
      if (!SETTINGS_TYPES.includes(configName)) {
        logger.error('[config] - UPDATE_CONFIGDATA_LOCALLY - неизвестный configName:', configName);
        return;
      }
      state[configName][dID] = configData;
    },

    // Локальное удаление элементов (после удаления на сервере или откат неудачного добавления)
    REMOVE_CONFIG_ITEMS(state, { dID, configName, room, param, ids }) {
      if (!SETTINGS_TYPES.includes(configName)) return;
      const list = state[configName]?.[dID]?.[room]?.[param];
      if (!Array.isArray(list)) return;
      state[configName][dID][room][param] = list.filter(
        (item) => !ids.includes(item.id ?? item._id),
      );
    },

    SET_LOADING(state, value) { state.loading = value; },
    SET_ERROR(state, error) { state.error = error; },
    SET_MOBILE(state, value) {
      state.mobile = value;
      writeStorage('mobile_navigation', String(value));
    },
    SET_DEVICE_TYPE(state, deviceType) { state.deviceType = deviceType; },
    SET_TYPE_SETTINGS_ITEM(state, type) {
      const normalized = normalizeSettingsType(type);
      writeStorage('typeSettingsKey', normalized);
      state.typeSettingsKey = normalized;
    },
  },

  actions: {
    async initialize({ dispatch, commit, rootGetters, state }) {
      dispatch('detectDevice');
      //logger.dev('[config] - initialize - старт, dID:', rootGetters['dID']);

      const dID = rootGetters['dID'];
      if (!dID) return;

      commit('SET_ERROR', null);
      if (!state.configs[dID]) {
        commit('SET_LOADING', true);
        try {
          await dispatch('ensureConfig', dID);
        } catch (error) {
          commit('SET_ERROR', 'Не удалось загрузить конфигурацию. Проверьте соединение.');
          throw error;
        } finally {
          commit('SET_LOADING', false);
        }
      }
      await dispatch('ensureSortingKeys');
    },

    detectDevice({ commit }) {
      const saved = readStorage('mobile_navigation');
      const ua = navigator.userAgent;
      const isMobileUA = /Mobi|Android/i.test(ua);

      // Пользовательский выбор (переключатель в меню) важнее user-agent
      commit('SET_MOBILE', saved !== null ? saved === 'true' : isMobileUA);

      let deviceType = 'desktop';
      if (isMobileUA) {
        const isTablet = /Tablet|iPad/i.test(ua)
          || (window.innerWidth >= 1024 && window.innerHeight >= 900);
        deviceType = isTablet ? 'tablet' : 'phone';
      }
      commit('SET_DEVICE_TYPE', deviceType);
    },

    /**
     * Запрашивает конфигурацию и ждёт её появления. Параллельные вызовы
     * разделяют один запрос; ожидание — через промис, а не через polling.
     */
    async requestConfig({ state, dispatch }, dID) {
      if (state.configs[dID]) return state.configs[dID];
      if (configWaiters.has(dID)) return configWaiters.get(dID).promise;

      const waiter = {};
      waiter.promise = new Promise((resolve, reject) => {
        waiter.resolve = resolve;
        waiter.reject = reject;
        waiter.timer = setTimeout(() => {
          configWaiters.delete(dID);
          reject(new Error(`Timeout: конфиг для ${dID} не получен за ${CONFIG_TIMEOUT} мс`));
        }, CONFIG_TIMEOUT);
      });
      waiter.promise.catch(() => {}); // чтобы не было unhandled rejection, если никто не ждёт
      configWaiters.set(dID, waiter);

      try {
        await dispatch('websocket/send', { type: 'get', request: 'config', name: dID }, { root: true });
      } catch (error) {
        clearTimeout(waiter.timer);
        configWaiters.delete(dID);
        waiter.reject(error);
        logger.error('[config] - requestConfig - ошибка отправки запроса:', error.message);
        throw error;
      }
      return waiter.promise;
    },

    // Перезапрос данных после переподключения (без ожидания ответа)
    async refreshConfig({ dispatch, rootGetters }) {
      const dID = rootGetters['dID'];
      if (!dID) return;
      try {
        await dispatch('websocket/send', { type: 'get', request: 'config', name: dID }, { root: true });
        for (const configType of SETTINGS_TYPES) {
          await dispatch('settingsConfig/requestToServer', { configType }, { root: true });
        }
      } catch (error) {
        logger.error('[config] - refreshConfig:', error.message);
      }
    },

    async handleConfigResponse({ commit, dispatch }, response) {
      try {
        const dID = response.name;
        const config = response.payload;
        const type = response.request;

        if (!dID || !config) throw new Error('Невалидный ответ конфигурации');
        logger.dev(`[config] - handleConfigResponse - <<< ${type} для ${dID}`);
        logger.dev('[config] - handleConfigResponse - payload:', config);

        if (type === 'config') {
          commit('SET_CONFIG', { name: dID, config });
          await dispatch('handleRoomsSet', config);
          await dispatch('handleParamsSet', config);
          await dispatch('handleDevicesSet', config);
          await dispatch('handleSetpointsSet', config);
          logger.info('[config] - конфигурация обновлена:', dID);

          const waiter = configWaiters.get(dID);
          if (waiter) {
            clearTimeout(waiter.timer);
            configWaiters.delete(dID);
            waiter.resolve(config);
          }
          return 'success';
        }
        if (type === 'schedules') commit('SET_SCHEDULE', { name: dID, config });
        else if (type === 'statistics') commit('SET_STATISTIC', { name: dID, config });
        else if (type === 'notifications') commit('SET_NOTIFICATION', { name: dID, config });
      } catch (error) {
        logger.error('[config] - handleConfigResponse:', error);
        throw error;
      }
    },

    updateScheduleLocally({ commit }, { dID, configName, configData }) {
      commit('UPDATE_CONFIGDATA_LOCALLY', { dID, configName, configData });
    },

    removeConfigItemsLocally({ commit, rootGetters }, { configName, room, param, ids }) {
      const dID = rootGetters['dID'];
      if (!dID) return;
      commit('REMOVE_CONFIG_ITEMS', { dID, configName, room, param, ids });
    },

    handleRoomsSet({ commit }, config) {
      const rooms = roomEntries(config)
        .filter(([, room]) => Object.keys(room).some((section) => {
          if (ROOM_EXCLUDED_SECTIONS.includes(section)) return false;
          const data = room[section];
          return data && typeof data === 'object' && Object.keys(data).length > 0;
        }))
        .map(([key]) => key);
      commit('SET_ALL_ROOMS', rooms);
    },

    handleParamsSet({ commit }, config) {
      const params = new Set();
      roomEntries(config).forEach(([, room]) => {
        if (room.sensors && typeof room.sensors === 'object') {
          Object.keys(room.sensors).forEach((k) => params.add(k.replace(/\d+$/, '')));
        }
      });
      commit('SET_ALL_PARAMS', Array.from(params));
    },

    handleDevicesSet({ commit }, config) {
      const devices = new Set();
      roomEntries(config).forEach(([, room]) => {
        Object.keys(room).forEach((section) => {
          if (DEVICE_EXCLUDED_SECTIONS.includes(section)) return;
          const data = room[section];
          if (data && typeof data === 'object') {
            Object.keys(data).forEach((deviceKey) => {
              const prefix = deviceKey.replace(/\d+$/, '');
              if (prefix) devices.add(prefix);
            });
          }
        });
      });
      commit('SET_ALL_DEVICES', Array.from(devices));
    },

    handleSetpointsSet({ commit }, config) {
      const setpoints = new Set();
      roomEntries(config).forEach(([, room]) => {
        if (room.setpoints && typeof room.setpoints === 'object') {
          Object.keys(room.setpoints).forEach((k) => {
            const prefix = k.replace(/\d+$/, '');
            if (prefix.startsWith('s')) setpoints.add(prefix);
          });
        }
      });
      commit('SET_ALL_SETPOINTS', Array.from(setpoints));
    },

    handleValueUpdate({ commit, rootGetters }, { dID, payload, type }) {
      const settingsData = rootGetters.getSetpointsManager?.settingsData;
      if (!dID || !payload || !type) {
        logger.error('[config] - handleValueUpdate - невалидные параметры:', { dID, payload, type });
        return;
      }

      if (type === 'sensors') {
        commit('UPDATE_CONFIG_VALUE', {
          dID,
          room: payload.room ?? settingsData?.payload?.room,
          type,
          name: payload.item_name,
          value: payload.item_value,
        });
        return;
      }

      // Всё ниже работает от выбранного пользователем элемента (settingsData)
      if (!settingsData) {
        logger.warn('[config] - handleValueUpdate - settingsData не инициализирован, тип:', type);
        return;
      }
      const sp = settingsData.payload;

      if (type === 'setpoints') {
        commit('UPDATE_CONFIG_VALUE', {
          dID,
          room: payload.room ?? sp.room,
          type,
          name: payload.item_name ?? `s${sp.key}`,
          // ?? вместо ||: значения 0 и false — валидные уставки
          value: payload.item_value ?? payload.value ?? sp.value,
        });
        return;
      }

      const listArgs = {
        dID: settingsData.name,
        room: sp.room,
        param: sp.param,
        id: sp.id,
        title: sp.value_name,
        value: sp.value,
      };
      if (type === 'schedules') commit('UPDATE_SCHEDULE_VALUE', { ...listArgs, config: sp.config });
      else if (type === 'notifications') commit('UPDATE_NOTIFICATION_VALUE', listArgs);
      else if (type === 'statistics') commit('UPDATE_STATISTIC_VALUE', listArgs);
    },

    async ensureConfig({ dispatch }, dID) {
      if (!dID) throw new Error('dID не определен');
      return dispatch('requestConfig', dID);
    },

    async ensureSortingKeys({ state, dispatch, rootGetters }) {
      const processKey = async (type, stateArrayName, getterName, storageKey, shouldStripNumbers = false) => {
        let currentKey = rootGetters[getterName] || readStorage(storageKey);
        if (currentKey && shouldStripNumbers) currentKey = currentKey.replace(/\d+$/, '');

        const arrayItems = state[stateArrayName] || [];

        // Невалидный ключ – сбрасываем
        if (currentKey && !arrayItems.includes(currentKey)) {
          logger.warn(`[config] - ensureSortingKeys - ${storageKey} невалиден (${currentKey}), сбрасываем`);
          localStorage.removeItem(storageKey);
          await dispatch('sortParams/updateSortKey', { type, newKey: null }, { root: true });
          currentKey = null;
        }

        // Ключа нет — берём первый из массива
        if (!currentKey && arrayItems.length > 0) {
          currentKey = arrayItems[0];
          await dispatch('sortParams/updateSortKey', { type, newKey: currentKey }, { root: true });
        }
        return currentKey;
      };

      const keyConfigs = [
        { type: 'rooms', stateArray: 'allRooms', getter: 'roomKey', storage: 'roomKey', strip: false, specialAction: 'updateRoomsTitle' },
        { type: 'params', stateArray: 'allParams', getter: 'paramKey', storage: 'paramKey', strip: true },
        { type: 'devices', stateArray: 'allDevices', getter: 'deviceKey', storage: 'deviceKey', strip: false },
        { type: 'setpoints', stateArray: 'allSetpoints', getter: 'setpointKey', storage: 'setpointKey', strip: true },
      ];

      for (const cfg of keyConfigs) {
        const key = await processKey(cfg.type, cfg.stateArray, cfg.getter, cfg.storage, cfg.strip);
        if (key && cfg.specialAction) {
          await dispatch(`sortParams/${cfg.specialAction}`, key, { root: true });
        }
      }
    },

    async updateSetpointServer({ dispatch, rootGetters }) {
      const settingsData = rootGetters['getSetpointsManager']?.settingsData;
      const dID = rootGetters.dID;

      if (!dID) throw new Error('dID не определен');
      if (!settingsData) throw new Error('Нет данных для отправки уставки');
      // Защита от устаревшего менеджера (например, после смены пользователя)
      if (settingsData.name !== dID) throw new Error('settingsData принадлежит другому dID');

      await dispatch('websocket/send', {
        type: 'post',
        request: settingsData.request,
        name: settingsData.name,
        payload: settingsData.payload,
      }, { root: true });
      logger.info('[config] - updateSetpointServer - отправлено на сервер');
    },

    // Отправка пользовательской конфигурации на сервер
    async userConfigRequest({ dispatch, rootGetters }, { configData, isEdit }) {
      const dID = rootGetters['dID'];
      if (!dID) throw new Error('dID не определён');

      const request = isEdit ? 'userConfigEdit' : 'userConfigRequest';
      // Не логируем configData: внутри лежит пароль
      logger.info('[config] - userConfigRequest - отправка:', request, 'dID:', dID);

      await dispatch('websocket/send', {
        type: 'post',
        request,
        name: dID,
        payload: configData,
      }, { root: true });
    },

    checkLimitBeforeAdd({ rootState, rootGetters }, configType) {
      const denied = { allowed: false, limit: 0, current: 0 };
      if (!SETTINGS_TYPES.includes(configType)) return denied;

      const settingsData = rootGetters['getSetpointsManager']?.settingsData;
      if (!settingsData) return denied;

      const dID = settingsData.name;
      const room = settingsData.payload?.room;
      const param = settingsData.payload?.param;
      if (!dID || !room || !param) return denied;

      const items = rootState.config[configType]?.[dID]?.[room]?.[param] || [];
      const limit = LIMITS[configType];
      return { allowed: items.length < limit, limit, current: items.length };
    },

    toggleMobileMode({ commit, dispatch, state }) {
      const newValue = !state.mobile;
      commit('SET_MOBILE', newValue);
      dispatch('popup/show', {
        message: newValue ? 'Включена мобильная навигация (свайпы)' : 'Включена десктопная навигация (стрелки)',
        type: 'info',
        duration: 3000,
      }, { root: true });
    },
  },

  getters: {
    // Очистка ключа: 'dTemp01' → 'Temp'
    clearKeySync: () => (key) => {
      if (!key) return '';
      return key.slice(1).replace(/\d+$/, '');
    },
    getConfig: (state) => (name) => state.configs[name] || {},
    isLoading: (state) => state.loading,
    error: (state) => state.error,
    allRooms: (state) => state.allRooms,
    allParams: (state) => state.allParams,
    allDevices: (state) => state.allDevices,
    allSetpoints: (state) => state.allSetpoints,
    getMobile: (state) => state.mobile,
    getDeviceType: (state) => state.deviceType,
  },
};
