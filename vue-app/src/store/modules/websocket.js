// store/modules/websocket.js
import logger from './logger';

const RECONNECT_BASE = 1000;    // 1 c
const RECONNECT_MAX = 30000;    // потолок задержки 30 c
const CONNECT_TIMEOUT = 8000;   // сколько ждём открытия сокета
const REQUEST_TIMEOUT = 15000;  // сколько ждём ответ на auth-запрос

// wss:// на https-страницах — иначе браузер блокирует mixed content.
const WS_PROTOCOL =
  process.env.VUE_APP_WS_PROTOCOL
  || (window.location.protocol === 'https:' ? 'wss' : 'ws');
const WS_URL = `${WS_PROTOCOL}://${process.env.VUE_APP_EXP}:${process.env.VUE_APP_PORT}`;

// Запрос → (какой ответ считать успехом, какой ошибкой)
const AWAIT_MAP = {
  login:          { success: 'loginSuccess',          error: 'loginError' },
  resume:         { success: 'loginSuccess',          error: 'resumeError' },
  refresh:        { success: 'refreshSuccess',        error: 'refreshError' },
  changePassword: { success: 'changePasswordSuccess', error: 'changePasswordError' },
};

// Служебное состояние вне Vuex (не должно быть реактивным).
const pending = new Map();      // request → { resolve, reject, timer }
let connectPromise = null;      // защита от параллельных connect()
let reconnectTimer = null;
let hasConnectedBefore = false; // отличаем первое подключение от переподключения
let listenersInstalled = false;
// Восстановление сессии после последнего открытия сокета (ждёт main.js перед монтированием)
let sessionReady = Promise.resolve(null);

function makeError(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function rejectAllPending(code, message) {
  for (const [type, entry] of pending) {
    clearTimeout(entry.timer);
    pending.delete(type);
    entry.reject(makeError(message, code));
  }
}

// Находит ожидающий запрос, которому соответствует ответ сервера.
function settlePending(response) {
  const request = response?.request;
  for (const [type, entry] of pending) {
    const cfg = AWAIT_MAP[type];
    if (request === cfg.success) {
      clearTimeout(entry.timer);
      pending.delete(type);
      entry.resolve(response);
      return true;
    }
    if (request === cfg.error || request === 'authError') {
      clearTimeout(entry.timer);
      pending.delete(type);
      const err = makeError(response.payload?.message || 'Auth error', response.payload?.code);
      entry.reject(err);
      return true;
    }
  }
  return false;
}

export default {
  namespaced: true,

  state: () => ({
    socket: null,
    connected: false,        // реактивный флаг (readyState сам по себе не реактивен)
    reconnectAttempts: 0,
    explicitDisconnect: false,
  }),

  mutations: {
    SET_SOCKET(state, socket) { state.socket = socket; },
    SET_CONNECTED(state, v) { state.connected = !!v; },
    SET_RECONNECT_ATTEMPTS(state, n) { state.reconnectAttempts = n; },
    SET_EXPLICIT_DISCONNECT(state, v) { state.explicitDisconnect = v; },
  },

  actions: {
    /**
     * Открывает соединение. Параллельные вызовы получают один и тот же промис.
     * Если сокет не открылся за CONNECT_TIMEOUT — реджект (code NO_CONNECTION),
     * а фоновое переподключение продолжается само.
     */
    connect({ state, commit, dispatch }) {
      if (state.socket?.readyState === WebSocket.OPEN) {
        return Promise.resolve(state.socket);
      }
      if (connectPromise) return connectPromise;

      clearTimeout(reconnectTimer);
      reconnectTimer = null;
      commit('SET_EXPLICIT_DISCONNECT', false);
      dispatch('installNetworkListeners');

      connectPromise = new Promise((resolve, reject) => {
        let settled = false;
        let socket;

        try {
          socket = new WebSocket(WS_URL);
        } catch (e) {
          settled = true;
          dispatch('scheduleReconnect');
          reject(makeError(`Не удалось создать WebSocket: ${e.message}`, 'NO_CONNECTION'));
          return;
        }

        const connectTimer = setTimeout(() => {
          if (settled) return;
          settled = true;
          try { socket.close(); } catch { /* ignore */ }
          reject(makeError('Таймаут подключения к серверу', 'NO_CONNECTION'));
        }, CONNECT_TIMEOUT);

        socket.onopen = () => {
          clearTimeout(connectTimer);
          logger.info('[WebSocket] connected to', WS_URL);

          const isReconnect = hasConnectedBefore;
          hasConnectedBefore = true;

          socket.onmessage = (event) => dispatch('handleMessage', event);
          commit('SET_SOCKET', socket);
          commit('SET_CONNECTED', true);
          commit('SET_RECONNECT_ATTEMPTS', 0);

          // Сервер привязывает сессию к соединению: после ЛЮБОГО открытия сокета
          // (первого, повторного, первого удачного после недоступности сервера при загрузке)
          // её нужно восстановить по JWT. Раньше resume шёл только при переподключении и из
          // main.js — если сервер был недоступен при загрузке, сессия не восстанавливалась,
          // и через AUTH_TIMEOUT_MS сервер закрывал соединение с TIMEOUT.
          sessionReady = dispatch('onConnected', { isReconnect }).catch((e) => {
            logger.error('[WebSocket] - onopen - восстановление сессии:', e.message);
            return null;
          });

          if (!settled) {
            settled = true;
            resolve(socket);
          }
        };

        socket.onerror = (error) => {
          // За onerror всегда следует onclose — реконнект планируем там.
          logger.error('[WebSocket] error:', error?.message || 'ошибка соединения');
        };

        socket.onclose = () => {
          clearTimeout(connectTimer);
          logger.info('[WebSocket] closed');

          if (state.socket === socket) {
            commit('SET_SOCKET', null);
            commit('SET_CONNECTED', false);
          }
          rejectAllPending('NO_CONNECTION', 'Соединение с сервером потеряно');

          if (!settled) {
            settled = true;
            reject(makeError('Не удалось подключиться к серверу', 'NO_CONNECTION'));
          }
          dispatch('scheduleReconnect');
        };
      }).finally(() => { connectPromise = null; });

      return connectPromise;
    },

    // Экспоненциальная задержка с джиттером, без «сдачи» после N попыток —
    // для панели управления важнее вернуть связь, чем остановиться.
    scheduleReconnect({ state, commit, dispatch }) {
      if (state.explicitDisconnect || reconnectTimer) return;
      const attempt = state.reconnectAttempts;
      const delay = Math.min(RECONNECT_BASE * 2 ** attempt, RECONNECT_MAX) + Math.random() * 500;
      commit('SET_RECONNECT_ATTEMPTS', attempt + 1);
      logger.info(`[WebSocket] переподключение через ${Math.round(delay)} мс (попытка ${attempt + 1})`);

      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        dispatch('connect').catch(() => { /* следующую попытку планирует onclose */ });
      }, delay);
    },

    // Возврат сети / возврат на вкладку → не ждём таймер, подключаемся сразу.
    installNetworkListeners({ state, commit, dispatch }) {
      if (listenersInstalled) return;
      listenersInstalled = true;

      const retryNow = () => {
        if (state.explicitDisconnect || state.socket?.readyState === WebSocket.OPEN) return;
        commit('SET_RECONNECT_ATTEMPTS', 0);
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
        dispatch('connect').catch(() => {});
      };

      window.addEventListener('online', retryNow);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') retryNow();
      });
    },

    // Новое соединение не знает сессию — восстанавливаем её по JWT и подтягиваем данные:
    // конфигурация ещё не загружена (например, сервер был недоступен при старте) → config/initialize,
    // уже есть → перезапрос того, что могло измениться за время обрыва.
    async onConnected({ rootState, rootGetters, dispatch }, { isReconnect = false } = {}) {
      if (!rootState.auth?.token) return null;
      try {
        const user = await dispatch('auth/resume', null, { root: true });
        if (!user) {
          if (!rootState.auth?.token) await dispatch('auth/redirectToLogin', null, { root: true });
          return null;
        }
        const dID = rootGetters['dID'];
        const hasConfig = !!dID && Object.keys(rootGetters['config/getConfig'](dID)).length > 0;
        // Данные грузим в фоне: main.js ждёт только восстановления сессии, не конфигурацию
        const loadData = hasConfig
          ? dispatch('config/refreshConfig', null, { root: true })
          // Идемпотентно: App.vue (watch isAuthenticated) делает то же при старте —
          // запросы конфигурации объединяются, менеджер для того же dID не пересоздаётся
          : dispatch('initializeSetpointsManager', null, { root: true })
            .then(() => dispatch('config/initialize', null, { root: true }));
        loadData.catch((e) => logger.error('[WebSocket] - onConnected - загрузка данных:', e.message));
        // Подписка на кадры камер живёт на сервере в пределах соединения
        Promise.resolve(dispatch('video/resubscribe', null, { root: true }))
          .catch((e) => logger.error('[WebSocket] - onConnected - подписка на камеры:', e.message));
        // Список камер — сразу: от него зависит, показывать ли вкладку «Видеонаблюдение»
        Promise.resolve(dispatch('video/requestCameras', null, { root: true }))
          .catch((e) => logger.error('[WebSocket] - onConnected - список камер:', e.message));

        logger.dev(`[WebSocket] - onConnected - сессия восстановлена (${isReconnect ? 'переподключение' : 'подключение'})`);
        return user;
      } catch (e) {
        logger.error('[WebSocket] - onConnected -', e.message);
        return null;
      }
    },

    // Совместимость: прежнее имя действия
    onReconnected({ dispatch }) {
      return dispatch('onConnected', { isReconnect: true });
    },

    // Промис восстановления сессии после последнего открытия сокета
    whenSessionReady() {
      return sessionReady;
    },

    disconnect({ state, commit }) {
      commit('SET_EXPLICIT_DISCONNECT', true);
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
      state.socket?.close();
    },

    /**
     * Отправка сообщения.
     * Для auth-запросов (login/resume/refresh/changePassword) возвращает Promise
     * с ответом сервера; ошибки приходят с полем .code
     * (TIMEOUT, NO_CONNECTION, либо код сервера).
     * Для остальных типов — fire-and-forget, возвращает null.
     */
    async send({ state, dispatch }, message) {
      if (state.socket?.readyState !== WebSocket.OPEN) {
        await dispatch('connect');
      }
      const socket = state.socket;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        throw makeError('WebSocket connection not established', 'NO_CONNECTION');
      }

      const cfg = message.type === 'auth' ? AWAIT_MAP[message.request] : null;
      if (!cfg) {
        socket.send(JSON.stringify(message));
        return null;
      }

      return new Promise((resolve, reject) => {
        // Новый запрос того же типа вытесняет старый
        const prev = pending.get(message.request);
        if (prev) {
          clearTimeout(prev.timer);
          prev.reject(makeError('Запрос заменён новым', 'SUPERSEDED'));
        }

        const timer = setTimeout(() => {
          pending.delete(message.request);
          reject(makeError(`Таймаут ожидания ответа на ${message.request}`, 'TIMEOUT'));
        }, REQUEST_TIMEOUT);

        pending.set(message.request, { resolve, reject, timer });

        try {
          socket.send(JSON.stringify(message));
        } catch (e) {
          clearTimeout(timer);
          pending.delete(message.request);
          reject(makeError(e.message, 'NO_CONNECTION'));
        }
      });
    },

    async handleMessage({ dispatch, rootGetters }, event) {
      let response;
      try {
        response = JSON.parse(event.data);
      } catch {
        logger.warn('[WebSocket] получено не-JSON сообщение');
        return;
      }

      const request = response?.request;
      const type = response?.type;

      // 1) Ответ на auth-запрос → резолвим/реджектим ожидающий промис
      if (settlePending(response)) return;

      // 2) accessError → auth-модуль решает (разлогин / попап)
      if (request === 'accessError') {
        await dispatch('auth/handleAccessError', response.payload, { root: true });
        return;
      }

      // 3) Обычные ответы
      try {
        // Ошибки сервера (setpointError, modbusWriteError, configError, …): раньше терялись молча
        if (type === 'error') {
          await dispatch('config/handleServerError', response, { root: true });
          return;
        }
        if (type === 'response') {
          // videoCameras / videoSnapshot / videoSubscribeSuccess — модуль video,
          // notification / notificationStatus / notificationSnapshot / notificationSuccess — notifications,
          // scenarios / scenariosSuccess — scenarios, остальное — config
          const handled = await dispatch('video/handleResponse', response, { root: true })
            || await dispatch('notifications/handleResponse', response, { root: true })
            || await dispatch('scenarios/handleResponse', response, { root: true });
          if (!handled) await dispatch('config/handleConfigResponse', response, { root: true });
        }
        if (type === 'post') {
          if (!response.payload || typeof response.payload !== 'object') return;
          if (request === 'videoSnapshot') {
            // Кадр с камеры → сохраняем в store/video.js, чтобы компоненты могли его взять через геттер
            await dispatch('video/handleSnapshot', response.payload, { root: true });
            return; 
          }
          if (request === 'notificationEvent') {
            // Событие уведомления (ON) или сброс (OFF) → store/notifications.js
            if (response.name === rootGetters['dID']) {
              await dispatch('notifications/handleEvent', response.payload, { root: true });
            }
            return;
          }
          if (response.name === rootGetters['dID']) {
            await dispatch(
              'config/handleValueUpdate',
              { dID: response.name, payload: response.payload, type: request },
              { root: true },
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
    isConnected: (state) => state.connected,
  },
};
