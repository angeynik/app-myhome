// store/modules/auth.js
import logger from './logger';
import { getTokenExpiry } from '@/utils/jwt';

const STORAGE_KEY = 'authSession';

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
    SET_MUST_CHANGE_PASSWORD(state, value) {
      state.mustChangePassword = !!value;
    },
  },

  actions: {
    // ── Логин ────────────────────────────────────────────────────────
    async login({ commit, dispatch }, { username, password }) {
      commit('AUTH_REQUEST');
      try {
        await dispatch('websocket/connect', null, { root: true });
        const response = await dispatch('websocket/send', {
          type: 'auth',
          request: 'login',
          name: '',
          payload: { username, password },
        }, { root: true });

        if (response?.request !== 'loginSuccess') {
          throw new Error(response?.payload?.message || 'Неверный ответ сервера');
        }

        const { token, username: uname, userlevel, dID, mustChangePassword } = response.payload;
        const userData = { username: uname, userlevel, dID };

        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          token, user: userData, dID, level: userlevel, mustChangePassword: !!mustChangePassword,
        }));

        commit('AUTH_SUCCESS', {
          token, user: userData, dID, level: userlevel, mustChangePassword,
        });
        logger.info('[auth] - login успешен:', uname, 'level', userlevel);
        return userData;
      } catch (error) {
        commit('AUTH_ERROR', error);
        throw error;
      }
    },

    // ── Восстановление сессии по JWT ────────────────────────────────
    async resume({ commit, dispatch }) {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      let saved;
      try { saved = JSON.parse(raw); }
      catch { localStorage.removeItem(STORAGE_KEY); return null; }
      if (!saved?.token) return null;

      try {
        await dispatch('websocket/connect', null, { root: true });
        const response = await dispatch('websocket/send', {
          type: 'auth',
          request: 'resume',
          name: '',
          payload: { token: saved.token },
        }, { root: true });

        if (response?.request !== 'loginSuccess') {
          throw new Error(response?.payload?.message || 'Сессия недействительна');
        }

        const { token, username, userlevel, dID, mustChangePassword } = response.payload;
        const userData = { username, userlevel, dID };

        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          token, user: userData, dID, level: userlevel, mustChangePassword: !!mustChangePassword,
        }));

        commit('AUTH_SUCCESS', {
          token, user: userData, dID, level: userlevel, mustChangePassword,
        });
        logger.info('[auth] - resume успешен:', username);
        return userData;
      } catch (error) {
        logger.warn('[auth] - resume не удался:', error.code || error.message);
        localStorage.removeItem(STORAGE_KEY);
        commit('LOGOUT');
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
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        saved.token = newToken;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

        commit('AUTH_SUCCESS', {
          token: newToken,
          user: saved.user,
          dID: saved.dID,
          level: saved.level,
          mustChangePassword: saved.mustChangePassword,
        });
        return newToken;
      } catch (e) {
        logger.error('[auth] - refresh:', e.message);
        return null;
      }
    },

    // ── Смена собственного пароля ───────────────────────────────────
    async changePassword({ commit, dispatch }, { oldPassword, newPassword }) {
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
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      saved.token = newToken;
      saved.mustChangePassword = false;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

      commit('AUTH_SUCCESS', {
        token: newToken,
        user: saved.user,
        dID: saved.dID,
        level: saved.level,
        mustChangePassword: false,
      });
      return true;
    },

    // ── Выход ───────────────────────────────────────────────────────
    async logout({ commit, dispatch, state }) {
      try {
        if (state.token) {
          await dispatch('websocket/send', {
            type: 'auth', request: 'logout', name: '', payload: {},
          }, { root: true });
        }
      } catch (e) {
        logger.warn('[auth] - logout на сервере не удался:', e.message);
      }
      commit('LOGOUT');
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('authData'); // старый ключ
      dispatch('dropdown/hide', null, { root: true });
    },

    // ── Обработка accessError, прилетевшего в WS ────────────────────
    handleAccessError({ commit, dispatch }, payload) {
      const code = payload?.code;
      logger.warn('[auth] - accessError:', payload);

      if (code === 'NO_SESSION' || code === 'TIMEOUT' || code === 'TOKEN_REVOKED') {
        commit('LOGOUT');
        localStorage.removeItem(STORAGE_KEY);
        dispatch('popup/show', {
          message: 'Сессия истекла. Войдите снова.',
          type: 'warning',
          duration: 2500,
        }, { root: true });
        if (window.location.pathname !== '/login') {
          setTimeout(() => { window.location.href = '/login'; }, 800);
        }
      } else if (code === 'FORBIDDEN') {
        dispatch('popup/show', {
          message: payload.message || 'Недостаточно прав для этой операции',
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