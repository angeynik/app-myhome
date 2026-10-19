// store/modules/websocket.js
import logger from './logger';

const RECONNECT_DELAY = 1000;
const MAX_RECONNECT_ATTEMPTS = 8;
const WS_URL = `ws://${process.env.VUE_APP_EXP}:${process.env.VUE_APP_PORT}`;

// Запрос → (какой ответ считать успехом, какой ошибкой)
const AWAIT_MAP = {
  login:          { success: 'loginSuccess',          error: 'loginError' },
  resume:         { success: 'loginSuccess',          error: 'resumeError' },
  refresh:        { success: 'refreshSuccess',        error: 'refreshError' },
  changePassword: { success: 'changePasswordSuccess', error: 'changePasswordError' },
};

export default {
  namespaced: true,

  state: {
    socket: null,
    reconnectAttempts: 0,
    explicitDisconnect: false,
    pendingResponse: null, // { type, resolve, reject, timer }
  },

  mutations: {
    SET_SOCKET(state, socket) { state.socket = socket; },
    SET_RECONNECT_ATTEMPTS(state, n) { state.reconnectAttempts = n; },
    SET_EXPLICIT_DISCONNECT(state, v) { state.explicitDisconnect = v; },
    SET_PENDING_RESPONSE(state, payload) { state.pendingResponse = payload; },
    CLEAR_PENDING_RESPONSE(state) { state.pendingResponse = null; },
  },

  actions: {
    async connect({ state, commit, dispatch }) {
      if (state.socket?.readyState === WebSocket.OPEN) return state.socket;

      if (state.reconnectAttempts > 0) {
        const delay = RECONNECT_DELAY * Math.pow(2, Math.min(state.reconnectAttempts, 5));
        await new Promise(r => setTimeout(r, delay));
        return dispatch('connect');
      }

      return new Promise((resolve, reject) => {
        const socket = new WebSocket(WS_URL);

        socket.onopen = () => {
          logger.info('[WebSocket] connected to ' + WS_URL);
          commit('SET_RECONNECT_ATTEMPTS', 0);
          socket.onmessage = (event) => dispatch('handleMessage', event);
          commit('SET_SOCKET', socket);
          resolve(socket);
        };

        socket.onerror = (error) => {
          logger.error('[WebSocket] error:', error);
          if (!state.explicitDisconnect) {
            setTimeout(() => dispatch('connect'), RECONNECT_DELAY);
          }
          reject(new Error('WebSocket connection error'));
        };

        socket.onclose = () => {
          logger.info('[WebSocket] closed');
          commit('SET_SOCKET', null);
          if (!state.explicitDisconnect && state.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            const delay = RECONNECT_DELAY * Math.pow(2, Math.min(state.reconnectAttempts, 5));
            setTimeout(() => {
              commit('SET_RECONNECT_ATTEMPTS', state.reconnectAttempts + 1);
              dispatch('connect');
            }, delay);
          }
        };
      });
    },

    disconnect({ state, commit }) {
      commit('SET_EXPLICIT_DISCONNECT', true);
      state.socket?.close();
    },

    /**
     * Отправка сообщения.
     * Для auth-запросов (login/resume/refresh/changePassword) возвращает Promise,
     * который резолвится ответом сервера (loginSuccess и т.п.) или реджектится
     * ошибкой (loginError и т.п.) с полем .code.
     * Для остальных типов — fire-and-forget, возвращает null.
     */
    async send({ state, commit, dispatch }, message) {
      if (!state.socket || state.socket.readyState !== WebSocket.OPEN) {
        await dispatch('connect');
      }
      if (!state.socket || state.socket.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket connection not established');
      }

      const awaits = message.type === 'auth' && AWAIT_MAP[message.request];

      if (!awaits) {
        state.socket.send(JSON.stringify(message));
        return null;
      }

      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          commit('CLEAR_PENDING_RESPONSE');
          const err = new Error(`Таймаут ожидания ответа на ${message.request}`);
          err.code = 'TIMEOUT';
          reject(err);
        }, 15000);

        commit('SET_PENDING_RESPONSE', {
          type: message.request,
          resolve,
          reject,
          timer,
        });
        state.socket.send(JSON.stringify(message));
      });
    },

    async handleMessage({ state, commit, dispatch, rootGetters }, event) {
      let response;
      try { response = JSON.parse(event.data); }
      catch { return; }

      const request = response?.request;
      const type = response?.type;

      // 1) Auth-ответ → резолвим/реджектим pending
      const pending = state.pendingResponse;
      if (pending) {
        const cfg = AWAIT_MAP[pending.type];
        if (cfg && request === cfg.success) {
          clearTimeout(pending.timer);
          commit('CLEAR_PENDING_RESPONSE');
          pending.resolve(response);
          return;
        }
        if (cfg && (request === cfg.error || request === 'authError')) {
          clearTimeout(pending.timer);
          commit('CLEAR_PENDING_RESPONSE');
          const err = new Error(response.payload?.message || 'Auth error');
          err.code = response.payload?.code;
          pending.reject(err);
          return;
        }
      }

      // 2) accessError → auth-модуль решает (разлогин / попап)
      if (request === 'accessError') {
        await dispatch('auth/handleAccessError', response.payload, { root: true });
        return;
      }

      // 3) Обычные ответы
      try {
        if (type === 'response') {
          await dispatch('config/handleConfigResponse', response, { root: true });
        }
        if (type === 'post') {
          const dID = response.name;
          const auth_dID = rootGetters['dID'];
          if (!response.payload || typeof response.payload !== 'object') return;
          if (dID === auth_dID) {
            await dispatch(
              'config/handleValueUpdate',
              { dID, payload: response.payload, type: request },
              { root: true }
            );
          }
        }
      } catch (error) {
        logger.error('[WebSocket] handleMessage error:', error);
        dispatch('log/addError', error, { root: true });
      }
    },
  },

  getters: {
    isConnected: (state) => state.socket?.readyState === WebSocket.OPEN,
  },
};