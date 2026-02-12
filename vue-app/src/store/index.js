// index.js
import { createStore } from 'vuex';
import ManageSetpoints from './classes/manageSetpoints';
import auth from './modules/auth';
import websocket from './modules/websocket';
import log from './modules/log';
import sortParams from './modules/sortParams';
import config from './modules/config';
import settingsConfig from './modules/settingsConfig';
import logger from './modules/logger';


const store = createStore({
  state: {
    setpointsManager: null, // Экземпляр класса ManageSetpoints
    settingsData: null, // Текущие данные настроек

    roomKey: localStorage.getItem('roomKey') || null,
    paramKey: localStorage.getItem('paramKey') || null,
    deviceKey: localStorage.getItem('deviceKey') || null,
    setpointKey: localStorage.getItem('setpointKey') || null,
  },
  modules: {
    auth,
    websocket,
    log,
    sortParams,
    config,
    settingsConfig,
  },
  mutations: {
    INIT_SETPOINTS_MANAGER(state, { dID, config }) { // Инициализация менеджера сетпоинтов manageSetpoints
      logger.dev('[index] - INIT_SETPOINTS_MANAGER - Инициализация менеджера сетпоинтов manageSetpoints', dID, config);
      state.setpointsManager = new ManageSetpoints(dID, config);
    },
    UPDATE_SETTINGS_DATA(state, { field, value }) {
        if (state.setpointsManager) {
            if (field === 'request' || field === 'type') {
                state.setpointsManager.settingsData[field] = value;
            } else {
                state.setpointsManager.settingsData.payload[field] = value;
                state.setpointsManager.settingsData.payload.updated = 
                    new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
            }
            state.settingsData = { ...state.setpointsManager.settingsData };
        }
    },
    RESET_SETTINGS_DATA(state) { // Сброс settingsData manageSetpoints
      if (state.setpointsManager) {
        state.setpointsManager.resetPayload();
        state.settingsData = { ...state.setpointsManager.settingsData };
      }
    },
    SET_SETTINGS_DATA(state, data) { // Прямая установка settingsData manageSetpoints
      state.settingsData = data;
    },



    SET_ROOM_KEY(state, key) {
      if (typeof key === 'string' && state.roomKey !== key && key != null) {
        logger.dev(`[index] MUTATION SET_ROOM_KEY: ${state.roomKey} -> ${key}`);
        state.roomKey = key;
        localStorage.setItem('roomKey', key);
      }
    },
    SET_PARAM_KEY(state, key) {
      if (typeof key === 'string' && state.paramKey !== key && key != null) {
        logger.dev(`[index] MUTATION SET_PARAM_KEY: ${state.paramKey} -> ${key}`);
        state.paramKey = key;
        localStorage.setItem('paramKey', key);
      }
    },
    SET_DEVICE_KEY(state, key) {
      if (typeof key === 'string' && state.deviceKey !== key && key != null) {
        logger.dev(`[index] MUTATION SET_DEVICE_KEY: ${state.deviceKey} -> ${key}`);
        state.deviceKey = key;
        localStorage.setItem('deviceKey', key);
      }
    },
    SET_SETPOINT_KEY(state, key) {
      if (typeof key === 'string' && state.setpointKey !== key && key != null) {
        logger.dev(`[index] MUTATION SET_SETPOINT_KEY: ${state.setpointKey} -> ${key}`);
        state.setpointKey = key;
        localStorage.setItem('setpointKey', key);
      }
    },
    
  },
  actions: {
    toLowerCase(_, str) {
      return str.toLowerCase();
    },
    initializeStore({ commit }) {
      const authData = localStorage.getItem('authData');
      if (authData) {
        try {
          const parsedData = JSON.parse(authData);
          commit('auth/RESTORE_AUTH', parsedData);
        } catch (e) {
          localStorage.removeItem('authData');
          console.error('Ошибка восстановления сессии', e);
        }
      }
    },


// Работа с manageSetpoints ////////////////////////////////////////
    initializeSetpointsManager({ commit, getters }) {
      const dID = getters.dID;
      if (dID) {
        commit('INIT_SETPOINTS_MANAGER', { 
          dID, 
          config: 'setpoints' 
        });
      }
    },
    updateSettingsData({ commit }, { field, value }) { // Action для обновления данных настроек manageSetpoints
      commit('UPDATE_SETTINGS_DATA', { field, value });
    },
    resetSettingsData({ commit }) { // Action для сброса данных настроек manageSetpoints
      commit('RESET_SETTINGS_DATA');
    },


  },
  getters: {
    isAuthenticated: (state) => !!state.auth.token,
    authStatus: (state) => state.auth.status,
    user: (state) => state.auth.user.username || '',
    level: (state) => state.auth.level || 0,
    dID: (state) => state.auth.dID || null,
    roomKey: (state) => state.roomKey,
    paramKey: (state) => state.paramKey,
    deviceKey: (state) => state.deviceKey,
    setpointKey: (state) => state.setpointKey,
    typeSettingsKey: (state) => state.config.typeSettingsKey, // Тип конфигурации настроек 'schedule' 'notifications' 'statistics' 'setpoints'
    idSettingsKey: (state) => state.settingsConfig.idKey, // Идентификатор записи внутри конфигурации
    getSetpointsManager: (state) => state.setpointsManager, // Объект данных manageSetpoints
  }
});

export default store;
