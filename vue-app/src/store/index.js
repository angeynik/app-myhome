// store/index.js
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
import dropdown from './modules/dropdown';
import { nowMoscow } from '@/utils/timeUtils';

// Поля payload → ключи localStorage (выбор пользователя переживает перезагрузку)
const PERSISTED_PAYLOAD_KEYS = {
  room: 'roomKey',
  param: 'paramKey',
  clearKey: 'clearKey',
  setKey: 'setpointKey',
  device: 'deviceKey',
};

function persist(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { logger.warn('[store] localStorage:', e.message); }
}

const store = createStore({
  state: {
    setpointsManager: null, // экземпляр ManageSetpoints
    settingsData: null,     // копия settingsData менеджера (для реактивности)
    showSetpoint: false,
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
    INIT_SETPOINTS_MANAGER(state, { dID, config: configName }) {
      logger.dev('[store] - INIT_SETPOINTS_MANAGER', dID, configName);
      state.setpointsManager = new ManageSetpoints(dID, configName);
      state.settingsData = { ...state.setpointsManager.settingsData };
    },

    // Сброс всего, что связано с пользователем (вызывается из auth/clearSession)
    RESET_SESSION_DATA(state) {
      state.setpointsManager = null;
      state.settingsData = null;
      state.showSetpoint = false;
    },

    UPDATE_SETTINGS_DATA(state, { field, value }) {
      const manager = state.setpointsManager;
      if (!manager) return;

      if (field === 'request' || field === 'type' || field === 'limits') {
        // поле верхнего уровня — заменяем целиком
        manager.settingsData[field] = value;
      } else {
        manager.settingsData.payload[field] = value;
        manager.settingsData.payload.updated = nowMoscow();
      }
      state.settingsData = { ...manager.settingsData };
    },

    RESET_SETTINGS_DATA(state) {
      if (state.setpointsManager) {
        state.setpointsManager.resetPayload();
        state.settingsData = { ...state.setpointsManager.settingsData };
      }
    },

    SET_SETTINGS_DATA(state, data) {
      state.settingsData = data;
    },

    UPDATE_PAYLOAD_DATA(state, payload) {
      const manager = state.setpointsManager;
      if (manager) {
        // Частичное обновление — существующие поля сохраняются
        manager.settingsData.payload = {
          ...manager.settingsData.payload,
          ...payload,
          updated: nowMoscow(),
        };
        state.settingsData = { ...manager.settingsData };
      }
      Object.entries(PERSISTED_PAYLOAD_KEYS).forEach(([field, storageKey]) => {
        if (payload[field]) persist(storageKey, payload[field]);
      });
    },

    UPDATE_LIMITS_DATA(state, limits) {
      const manager = state.setpointsManager;
      if (!manager) return;
      manager.settingsData.limits = { ...manager.settingsData.limits, ...limits };
      state.settingsData = { ...manager.settingsData };
    },

    SHOW_SETPOINT(state, value) {
      state.showSetpoint = value;
    },
  },

  actions: {
    initializeStore({ commit }) {
      let raw = null;
      try { raw = localStorage.getItem('authSession'); } catch { /* приватный режим */ }

      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.token === 'string') {
            commit('auth/RESTORE_AUTH', {
              token: parsed.token,
              user: parsed.user,
              dID: parsed.dID,
              level: parsed.level,
              mustChangePassword: parsed.mustChangePassword,
            });
          }
        } catch (e) {
          localStorage.removeItem('authSession');
          logger.error('[store] не удалось восстановить сессию', e);
        }
      }
      // старый ключ — чистим
      if (localStorage.getItem('authData')) localStorage.removeItem('authData');
    },

    // Создаёт менеджер уставок для текущего dID (вызывается из App.vue после входа).
    // ВАЖНО: без этого вызова setpointsManager остаётся null, и выбор/изменение уставок не работает.
    initializeSetpointsManager({ commit, getters, state }) {
      const dID = getters.dID;
      if (!dID) return;
      // Уже создан для этого пользователя — не пересоздаём (иначе потеряем выбор)
      if (state.setpointsManager && state.setpointsManager.settingsData.name === dID) return;

      commit('INIT_SETPOINTS_MANAGER', { dID, config: 'setpoints' });

      Object.entries(PERSISTED_PAYLOAD_KEYS).forEach(([field, storageKey]) => {
        const saved = localStorage.getItem(storageKey);
        if (saved) commit('UPDATE_PAYLOAD_DATA', { [field]: saved });
      });
    },

    updateSettingsData({ commit }, { field, value }) {
      commit('UPDATE_SETTINGS_DATA', { field, value });
    },
    updatePayloadData({ commit }, payload) {
      commit('UPDATE_PAYLOAD_DATA', payload);
    },
    updateLimitsData({ commit }, limits) {
      commit('UPDATE_LIMITS_DATA', limits);
    },
    resetSettingsData({ commit }) {
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
    user: (state) => state.auth.user?.username || '',
    level: (state) => state.auth.level || 0,
    dID: (state) => state.auth.dID || null,

    // Тип настроек: 'schedules' | 'notifications' | 'statistics'
    typeSettingsKey: (state) => state.config.typeSettingsKey,
    getSetpointsManager: (state) => state.setpointsManager,
    settingsDataLimits: (state) => state.settingsData?.limits,
  },
});

export default store;
