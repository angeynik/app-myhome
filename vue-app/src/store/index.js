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
import popup from './modules/popup';
import { nowMoscow } from '@/utils/timeUtils';
import dropdown from './modules/dropdown';


const store = createStore({
  state: {
    setpointsManager: null, // Экземпляр класса ManageSetpoints
    settingsData: null, // Текущие данные настроек

    showSetpoint: false,

    // roomKey: localStorage.getItem('roomKey') || null,
    // paramKey: localStorage.getItem('paramKey') || null, // Ключ вида dTemp используется для определения параметра при сортировке по параметрам
    // deviceKey: localStorage.getItem('deviceKey') || null, 
    // setpointKey: localStorage.getItem('setpointKey') || null, // Ключ вида sTemp используется при работе с Уставкой 
  },
  modules: {
    auth,
    websocket,
    log,
    sortParams,
    config,
    settingsConfig,
    popup,
    dropdown,
  },
  mutations: {
    INIT_SETPOINTS_MANAGER(state, { dID, config }) { // Инициализация менеджера сетпоинтов manageSetpoints
      logger.dev('[index] - INIT_SETPOINTS_MANAGER - Инициализация менеджера взаимодействия пользователя со значениями -  manageSetpoints', dID, config);
      state.setpointsManager = new ManageSetpoints(dID, config);
    },
    UPDATE_SETTINGS_DATA(state, { field, value }) { 
        if (state.setpointsManager) {
            if (field === 'request' || field === 'type' || field === 'limits' ) { // если поле field содержит имя объекта - заменяем весь объект иначе только параметр в payload
              console.log('[index] - UPDATE_SETTINGS_DATA -  Обновляем весь объект', field, 'value:', value);  
              state.setpointsManager.settingsData[field] = value;

            } else{
              console.log('[index] - UPDATE_SETTINGS_DATA -  Обновляем поле', field, 'в объекте payload значением:', value); 
                state.setpointsManager.settingsData.payload[field] = value;
                state.setpointsManager.settingsData.payload.updated = nowMoscow();
              }
            state.settingsData = { ...state.setpointsManager.settingsData };
            console.log('[index] - UPDATE_SETTINGS_DATA - ', state.setpointsManager.settingsData);
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
    UPDATE_PAYLOAD_DATA(state, payload) {
      //console.log('[index] - UPDATE_PAYLOAD_DATA - Обновляем payload:', payload);
      if (state.setpointsManager) {
        // Частичное обновление - сохраняем существующие поля
        state.setpointsManager.settingsData.payload = {
          ...state.setpointsManager.settingsData.payload, // существующие данные
          ...payload // новые/обновленные поля
        };
        state.setpointsManager.settingsData.payload.updated = nowMoscow();
        state.settingsData = { ...state.setpointsManager.settingsData };
        // Вернуть console.log
        //console.log('[index] - UPDATE_PAYLOAD_DATA - Обновили state.setpointsManager.settingsData:', state.setpointsManager.settingsData);
      }
      if (payload.room) localStorage.setItem('roomKey', payload.room);
      if (payload.param) localStorage.setItem('paramKey', payload.param);
      if (payload.clearKey) localStorage.setItem('clearKey', payload.clearKey);
      if (payload.setKey) localStorage.setItem('setpointKey', payload.setKey);
      if (payload.device) localStorage.setItem('deviceKey', payload.device);
    },
    UPDATE_LIMITS_DATA(state, limits) {
      //console.log('[index] - UPDATE_LIMITS_DATA - limits:', limits);
      if (state.setpointsManager) {
        //console.log('[index] - UPDATE_LIMITS_DATA - Before update:', JSON.stringify(state.setpointsManager.settingsData.limits));
        state.setpointsManager.settingsData.limits = {
          ...state.setpointsManager.settingsData.limits, // существующие данные лимитов
          ...limits // новые/обновленные поля лимитов
        };
        //console.log('[index] - UPDATE_LIMITS_DATA - After update:', JSON.stringify(state.setpointsManager.settingsData.limits));
        state.settingsData = { ...state.setpointsManager.settingsData };
        //console.log('[index] - UPDATE_LIMITS_DATA - state.settingsData.limits:', JSON.stringify(state.settingsData.limits));
      }
    },

    SHOW_SETPOINT(state, value) {
      state.showSetpoint = value;
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
        commit('INIT_SETPOINTS_MANAGER', { dID, config: 'setpoints' });
        const roomKey = localStorage.getItem('roomKey');
        const paramKey = localStorage.getItem('paramKey');
        const deviceKey = localStorage.getItem('deviceKey');
        const setpointKey = localStorage.getItem('setpointKey');
        const clearKey = localStorage.getItem('clearKey');
        if (roomKey) commit('UPDATE_PAYLOAD_DATA', { room: roomKey });
        if (paramKey) commit('UPDATE_PAYLOAD_DATA', { param: paramKey });
        if (deviceKey) commit('UPDATE_PAYLOAD_DATA', { device: deviceKey });
        if (setpointKey) commit('UPDATE_PAYLOAD_DATA', { setKey: setpointKey });
        if (clearKey) commit('UPDATE_PAYLOAD_DATA', { clearKey: clearKey });
      }
    },
    updateSettingsData({ commit }, { field, value }) { // Action для обновления данных настроек manageSetpoints
      console.log('[index] - updateSettingsData - Обновляем поле:', field, 'значением-', value);
      commit('UPDATE_SETTINGS_DATA', { field, value });
    },
    updatePayloadData({ commit }, payload) {
      //console.log('[index] - updatePayloadData - Обновляем payload:', payload);
      commit('UPDATE_PAYLOAD_DATA', payload);
    },
    updateLimitsData({ commit }, limits) {
      //console.log('[index] - updateLimitsData - limits:', limits);
      commit('UPDATE_LIMITS_DATA', limits);
    },
    resetSettingsData({ commit }) { // Action для сброса данных настроек manageSetpoints
      commit('RESET_SETTINGS_DATA');
    },
    setShowSetpoint({ commit }, value) {
      commit('SHOW_SETPOINT', value);
    },
    hideSetpoint({ commit }) {
      commit('SHOW_SETPOINT', false);
    },


  },
  getters: {
    key: (state) => state.settingsData?.payload?.key ?? null, 
    roomKey: (state) => state.settingsData?.payload?.room ?? null,
    paramKey: (state) => state.settingsData?.payload?.param ?? null,
    deviceKey: (state) => state.settingsData?.payload?.device ?? null,
    setpointKey: (state) => state.settingsData?.payload?.setKey ?? null,


    showSetpoint: (state) => state.showSetpoint,
    isAuthenticated: (state) => !!state.auth.token,
    authStatus: (state) => state.auth.status,
    user: (state) => state.auth.user.username || '',
    level: (state) => state.auth.level || 0,
    dID: (state) => state.auth.dID || null,
    // roomKey: (state) => state.roomKey,
    // paramKey: (state) => state.paramKey,
    // deviceKey: (state) => state.deviceKey,
    // setpointKey: (state) => state.setpointKey,
    typeSettingsKey: (state) => state.config.typeSettingsKey, // Тип конфигурации настроек 'schedule' 'notifications' 'statistics' 'setpoints'
    idSettingsKey: (state) => state.settingsConfig.idKey, // Идентификатор записи внутри конфигурации
    getSetpointsManager: (state) => state.setpointsManager, // Объект данных manageSetpoints
    settingsDataLimits: (state) => state.settingsData?.limits, // Лимиты из settingsData
  }
});

export default store;
