// store/modules/scenarios.js
// Сценарии автоматизации (docs/scenarios.md): сервер хранит, Node-RED выполняет.
//   data   — файл сценариев dID: { settings, scenarios: { id: сценарий } } (response 'scenarios';
//            сервер присылает его на get/scenarios и всем вкладкам dID после каждой правки)
//   loaded — данные получены
//
// save() возвращает промис: resolve — response/scenariosSuccess { action, id, delivered },
// reject — error/scenariosError (Error с code) или TIMEOUT. Корреляционного id в протоколе нет,
// поэтому правки отправляются по одной: следующая ждёт ответа на предыдущую.
import logger from './logger';
import { DEFAULT_SETTINGS } from '@/utils/scenarioModel';

const SAVE_TIMEOUT_MS = 15000;
let waiter = null;   // { resolve, reject, timer } — ожидание ответа на post/scenarios
let chain = Promise.resolve();

function settle(fn, arg) {
  if (!waiter) return false;
  const w = waiter;
  waiter = null;
  clearTimeout(w.timer);
  fn === 'resolve' ? w.resolve(arg) : w.reject(arg);
  return true;
}

const initialState = () => ({
  data: { settings: { ...DEFAULT_SETTINGS }, scenarios: {} },
  loaded: false,
});

export default {
  namespaced: true,
  state: initialState,

  mutations: {
    SET_DATA(state, data) {
      const d = data && typeof data === 'object' ? data : {};
      state.data = {
        settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) },
        scenarios: d.scenarios && typeof d.scenarios === 'object' ? d.scenarios : {},
      };
      state.loaded = true;
    },
    RESET(state) {
      Object.assign(state, initialState());
      settle('reject', Object.assign(new Error('Сессия завершена'), { code: 'RESET' }));
    },
  },

  actions: {
    // Ответы сервера модуля сценариев; true — обработан здесь
    handleResponse({ commit }, response) {
      const request = response?.request;
      if (request === 'scenarios') {
        commit('SET_DATA', response.payload);
        return true;
      }
      if (request === 'scenariosSuccess') {
        settle('resolve', response.payload || {});
        return true;
      }
      return false;
    },

    // error/scenariosError — отклоняет ожидающую правку
    handleError({ dispatch, rootGetters }, payload = {}) {
      const err = Object.assign(new Error(payload.message || 'Сценарий не сохранён'), { code: payload.code || 'SCENARIO_ERROR' });
      if (!settle('reject', err)) {
        dispatch('popup/show', { message: err.message, type: 'error', duration: 4000 }, { root: true });
      }
      // Набор на экране мог разойтись с сервером (правка из другой вкладки): берём заново
      if (rootGetters.dID) dispatch('request').catch((e) => logger.warn('[scenarios] перезапрос:', e.message));
    },

    async request({ dispatch, rootGetters }) {
      const dID = rootGetters.dID;
      if (!dID) return;
      await dispatch('websocket/send', { type: 'get', request: 'scenarios', name: dID, payload: {} }, { root: true });
    },

    // action: create | edit | delete | enable | settings
    save({ dispatch, rootGetters }, { action, configData }) {
      const run = async () => {
        const dID = rootGetters.dID;
        if (!dID) throw Object.assign(new Error('Нет сессии'), { code: 'NO_SESSION' });
        const result = new Promise((resolve, reject) => {
          const timer = setTimeout(() => settle('reject', Object.assign(new Error('Сервер не ответил'), { code: 'TIMEOUT' })), SAVE_TIMEOUT_MS);
          waiter = { resolve, reject, timer };
        });
        try {
          await dispatch('websocket/send', {
            type: 'post', request: 'scenarios', name: dID, payload: { action, configData },
          }, { root: true });
        } catch (e) {
          settle('reject', e);
        }
        const r = await result;
        logger.info(`[scenarios] - ${action} ${r.id || ''}: Node-RED ${r.delivered ?? '—'}`);
        return r;
      };
      const p = chain.then(run, run);
      chain = p.catch(() => {});
      return p;
    },
  },

  getters: {
    loaded: (state) => state.loaded,
    settings: (state) => state.data.settings,
    // Список для экрана: старший приоритет выше, затем по названию
    list: (state) => Object.values(state.data.scenarios)
      .filter((s) => s && typeof s === 'object')
      .sort((a, b) => (b.priority ?? 50) - (a.priority ?? 50) || String(a.title).localeCompare(String(b.title), 'ru')),
    byId: (state) => (id) => (Object.prototype.hasOwnProperty.call(state.data.scenarios, id) ? state.data.scenarios[id] : null),
  },
};
