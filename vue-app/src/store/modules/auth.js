// store/modules/auth.js
import logger from './logger';
import { getTokenExpiry } from '@/utils/jwt';

const STORAGE_KEY = 'authSession';

// Ключи localStorage, которые принадлежат конкретной сессии пользователя.
// При выходе их нужно чистить, иначе следующий пользователь на этом
// устройстве унаследует выбранную комнату/параметр.
const SESSION_BOUND_KEYS = ['roomKey', 'paramKey', 'deviceKey', 'setpointKey', 'clearKey'];

const MIN_REFRESH_DELAY = 60 * 1000;          // не чаще раза в минуту (защита от кривых часов)
const MAX_TIMER_DELAY = 2 ** 31 - 1;          // лимит setTimeout
const SESSION_ERROR_CODES = ['NO_SESSION', 'TIMEOUT', 'TOKEN_REVOKED'];
// Ошибки сети — НЕ повод разлогинивать: токен может быть валиден
const TRANSIENT_CODES = ['TIMEOUT', 'NO_CONNECTION', 'SUPERSEDED'];

let refreshTimer = null;

function isTransient(error) {
  return !error?.code || TRANSIENT_CODES.includes(error.code);
}

function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function writeSession(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    logger.warn('[auth] не удалось сохранить сессию:', e.message);
  }
}

function clearStoredSession() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('authData'); // старый ключ
  SESSION_BOUND_KEYS.forEach((k) => localStorage.removeItem(k));
}

export default {
  namespaced: true,

  state: () => ({
    token: '',
    user: {},
    status: '',           // '' | 'loading' | 'success' | 'error'
    level: 0,
    dID: null,
    mustChangePassword: false,
    error: null,
    expiresAt: null,
  }),

  mutations: {
    AUTH_REQUEST(state) {
      state.status = 'loading';
      state.error = null;
    },
    AUTH_SUCCESS(state, { token, user, dID, level, mustChangePassword }) {
      state.token = token;
      state.user = user;
      state.dID = dID;
      state.level = level;
      state.status = 'success';
      state.error = null;
      state.mustChangePassword = !!mustChangePassword;
      state.expiresAt = getTokenExpiry(token);
    },
    AUTH_ERROR(state, error) {
      state.status = 'error';
      state.error = error?.message || String(error);
    },
    RESTORE_AUTH(state, { token, user, dID, level, mustChangePassword }) {
      state.token = token || '';
      state.user = user || {};
      state.dID = dID || null;
      state.level = level || 0;
      state.status = token ? 'success' : '';
      state.mustChangePassword = !!mustChangePassword;
      state.expiresAt = token ? getTokenExpiry(token) : null;
    },
    LOGOUT(state) {
      state.status = '';
      state.token = '';
      state.user = {};
      state.dID = null;
      state.level = 0;
      state.error = null;
      state.mustChangePassword = false;
      state.expiresAt = null;
    },
  },

  actions: {
    // ── Логин ────────────────────────────────────────────────────────
    async login({ commit, dispatch }, { username, password }) {
      commit('AUTH_REQUEST');
      try {
        const response = await dispatch('websocket/send', {
          type: 'auth',
          request: 'login',
          name: '',
          payload: { username, password },
        }, { root: true });

        if (response?.request !== 'loginSuccess') {
          throw new Error(response?.payload?.message || 'Неверный ответ сервера');
        }

        const userData = await dispatch('applyLoginResponse', response.payload);
        logger.info('[auth] - login успешен:', userData.username, 'level', userData.userlevel);
        return userData;
      } catch (error) {
        commit('AUTH_ERROR', error);
        throw error;
      }
    },

    // Общая часть login/resume: сохранить сессию и запустить авто-refresh
    applyLoginResponse({ commit, dispatch }, payload) {
      const { token, username, userlevel, dID, mustChangePassword } = payload;
      const userData = { username, userlevel, dID };

      writeSession({
        token, user: userData, dID, level: userlevel, mustChangePassword: !!mustChangePassword,
      });
      commit('AUTH_SUCCESS', {
        token, user: userData, dID, level: userlevel, mustChangePassword,
      });
      dispatch('scheduleRefresh');
      return userData;
    },

    // ── Восстановление сессии по JWT ────────────────────────────────
    async resume({ dispatch }) {
      const saved = readSession();
      if (!saved?.token) return null;

      try {
        const response = await dispatch('websocket/send', {
          type: 'auth',
          request: 'resume',
          name: '',
          payload: { token: saved.token },
        }, { root: true });

        if (response?.request !== 'loginSuccess') {
          throw new Error(response?.payload?.message || 'Сессия недействительна');
        }
        const userData = await dispatch('applyLoginResponse', response.payload);
        logger.info('[auth] - resume успешен:', userData.username);
        return userData;
      } catch (error) {
        if (isTransient(error)) {
          // Сервер недоступен — сессию НЕ трогаем, resume повторится при реконнекте
          logger.warn('[auth] - resume отложен (нет связи):', error.code || error.message);
          return null;
        }
        logger.warn('[auth] - resume отклонён сервером:', error.code || error.message);
        await dispatch('clearSession');
        return null;
      }
    },

    // ── Продление JWT ───────────────────────────────────────────────
    async refresh({ commit, dispatch, state }) {
      if (!state.token) return null;
      try {
        const response = await dispatch('websocket/send', {
          type: 'auth', request: 'refresh', name: '', payload: {},
        }, { root: true });

        if (response?.request !== 'refreshSuccess') return null;

        const newToken = response.payload.token;
        const saved = readSession() || {};
        saved.token = newToken;
        writeSession(saved);

        commit('AUTH_SUCCESS', {
          token: newToken,
          user: saved.user ?? state.user,
          dID: saved.dID ?? state.dID,
          level: saved.level ?? state.level,
          mustChangePassword: saved.mustChangePassword ?? state.mustChangePassword,
        });
        return newToken;
      } catch (e) {
        logger.error('[auth] - refresh:', e.message);
        return null;
      }
    },

    // Планирует продление токена на ~75% оставшегося срока жизни
    scheduleRefresh({ state, dispatch }) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
      if (!state.token || !state.expiresAt) return;

      const remaining = state.expiresAt - Date.now();
      const delay = Math.min(Math.max(remaining * 0.75, MIN_REFRESH_DELAY), MAX_TIMER_DELAY);

      refreshTimer = setTimeout(async () => {
        refreshTimer = null;
        if (!state.token) return;
        const newToken = await dispatch('refresh');
        if (newToken) {
          dispatch('scheduleRefresh');
        } else if (state.token) {
          // не вышло (обрыв связи) — повторим через минуту
          refreshTimer = setTimeout(() => dispatch('scheduleRefresh'), MIN_REFRESH_DELAY);
        }
      }, delay);
    },

    // ── Смена собственного пароля ───────────────────────────────────
    async changePassword({ commit, dispatch, state }, { oldPassword, newPassword }) {
      const response = await dispatch('websocket/send', {
        type: 'auth',
        request: 'changePassword',
        name: '',
        payload: { oldPassword, newPassword },
      }, { root: true });

      if (response?.request !== 'changePasswordSuccess') {
        throw new Error(response?.payload?.message || 'Ошибка смены пароля');
      }

      const newToken = response.payload.token;
      const saved = readSession() || {};
      saved.token = newToken;
      saved.mustChangePassword = false;
      writeSession(saved);

      commit('AUTH_SUCCESS', {
        token: newToken,
        user: saved.user ?? state.user,
        dID: saved.dID ?? state.dID,
        level: saved.level ?? state.level,
        mustChangePassword: false,
      });
      dispatch('scheduleRefresh');
      return true;
    },

    // ── Выход ───────────────────────────────────────────────────────
    async logout({ dispatch, state }) {
      if (state.token) {
        // Не блокируем интерфейс, если сервер недоступен: максимум 2 c
        try {
          await Promise.race([
            dispatch('websocket/send', {
              type: 'auth', request: 'logout', name: '', payload: {},
            }, { root: true }),
            new Promise((resolve) => setTimeout(resolve, 2000)),
          ]);
        } catch (e) {
          logger.warn('[auth] - logout на сервере не удался:', e.message);
        }
      }
      await dispatch('clearSession');
    },

    // Полная очистка клиентской сессии (общая для logout / accessError / resume-reject)
    async clearSession({ commit, dispatch }) {
      clearTimeout(refreshTimer);
      refreshTimer = null;

      commit('LOGOUT');
      clearStoredSession();

      // Данные предыдущего пользователя не должны остаться в памяти
      commit('RESET_SESSION_DATA', null, { root: true });
      commit('config/RESET', null, { root: true });
      dispatch('dropdown/hide', null, { root: true });
    },

    // ── Обработка accessError, прилетевшего в WS ────────────────────
    async handleAccessError({ state, dispatch }, payload) {
      const code = payload?.code;
      logger.warn('[auth] - accessError:', payload);

      if (SESSION_ERROR_CODES.includes(code)) {
        if (!state.token) return; // уже вышли — повторный попап не нужен

        await dispatch('clearSession');
        dispatch('popup/show', {
          message: 'Сессия истекла. Войдите снова.',
          type: 'warning',
          duration: 2500,
        }, { root: true });

        // SPA-навигация вместо window.location: учитывает base '/app/'
        // и не перезагружает страницу.
        const { default: router } = await import('@/router/routes.js');
        if (router.currentRoute.value.name !== 'Login') {
          router.push('/login');
        }
      } else if (code === 'FORBIDDEN') {
        dispatch('popup/show', {
          message: payload?.message || 'Недостаточно прав для этой операции',
          type: 'error',
          duration: 3000,
        }, { root: true });
      }
    },
  },

  getters: {
    isAuthenticated: (state) => !!state.token,
    mustChangePassword: (state) => state.mustChangePassword,
    tokenExpiresAt: (state) => state.expiresAt,
  },
};
