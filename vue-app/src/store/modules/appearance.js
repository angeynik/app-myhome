// appearance.js
import logger from './logger';

const LS_KEY = 'appearance';
const DEFAULT_THEME = 'default';

export const BG_THEMES = {
  default: 'По умолчанию',
  field:   'Поле',
  night:   'Ночь',
  forest:  'Лес',
  custom:  'Свой цвет',
};

function applyCustomColor(color) {
  const root = document.documentElement;
  if (color && /^#[0-9a-f]{6}$/i.test(color)) {
    root.style.setProperty('--app-bg-color', color);
  } else {
    root.style.removeProperty('--app-bg-color');
  }
}

export default {
  namespaced: true,
  state: () => ({ bgTheme: DEFAULT_THEME, bgColor: null }),
  getters: {
    bgTheme:     (s) => s.bgTheme,
    bgColor:     (s) => s.bgColor,
    bgThemeClass: (s) => `bg-theme--${s.bgTheme}`,
    bgThemeLabel: (s) => BG_THEMES[s.bgTheme] || BG_THEMES[DEFAULT_THEME],
  },
  mutations: {
    SET_THEME(state, theme) {
      state.bgTheme = BG_THEMES[theme] ? theme : DEFAULT_THEME;
      if (state.bgTheme !== 'custom') {
        state.bgColor = null;
        applyCustomColor(null);
      }
    },
    SET_COLOR(state, color) {
      const ok = typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color);
      state.bgColor = ok ? color : null;
      state.bgTheme = 'custom';
      applyCustomColor(state.bgColor);
    },
  },
  actions: {
    setTheme({ commit, dispatch }, theme) {
      commit('SET_THEME', theme);
      dispatch('persist');
    },
    setColor({ commit, dispatch }, color) {
      commit('SET_COLOR', color);
      dispatch('persist');
    },
    persist({ state }) {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({ theme: state.bgTheme, color: state.bgColor }));
      } catch (e) {
        logger.warn('[appearance] - persist -', e.message);
      }
    },
    restore({ commit }) {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return;
        const p = JSON.parse(raw);
        commit('SET_THEME', p.theme || DEFAULT_THEME);
        if (p.theme === 'custom' && p.color) commit('SET_COLOR', p.color);
        logger.info('[appearance] - restore -', p.theme);
      } catch (e) {
        logger.warn('[appearance] - restore - повреждённые данные:', e.message);
      }
    },
  },
};