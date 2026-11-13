// store/modules/appearance.js
import logger from './logger';

const LS_KEY = 'appearance';
const DEFAULT_THEME = 'default';
const DEFAULT_COLOR = '#1E1E31'; // Цвет совпадает с --background_color

export const BG_THEMES = {
  default: 'По умолчанию',
  field:   'Поле',
  city:   'Город',
  night:   'Ночь',
  forest:  'Лес',
  ocean:   'Океан',
  color:   'Свой цвет', // <--- НОВАЯ ТЕМА
};

export default {
  namespaced: true,
  
  state: () => ({ 
    bgTheme: DEFAULT_THEME,
    customColor: DEFAULT_COLOR, // <--- НОВОЕ ПОЛЕ
  }),
  
  getters: {
    bgTheme: (s) => s.bgTheme,
    customColor: (s) => s.customColor, // <--- НОВЫЙ ГЕТТЕР
    bgThemeClass: (s) => `bg-theme--${s.bgTheme}`,
  },
  
  mutations: {
    SET_THEME(state, theme) {
      state.bgTheme = BG_THEMES[theme] ? theme : DEFAULT_THEME;
    },
    SET_CUSTOM_COLOR(state, color) {
      state.customColor = color || DEFAULT_COLOR; // <--- НОВАЯ МУТАЦИЯ
    },
  },
  
  actions: {
    setTheme({ commit, dispatch }, theme) {
      commit('SET_THEME', theme);
      dispatch('persist');
    },
    setCustomColor({ commit, dispatch }, color) {
      commit('SET_CUSTOM_COLOR', color);
      commit('SET_THEME', 'color'); // Автоматически включаем тему "Свой цвет"
      dispatch('persist');
    },
    persist({ state }) {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({
          theme: state.bgTheme,
          color: state.customColor // <--- Сохраняем цвет
        }));
      } catch (e) {
        logger.warn('[appearance] - persist -', e.message);
      }
    },
    restore({ commit }) {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed.theme && BG_THEMES[parsed.theme]) {
          commit('SET_THEME', parsed.theme);
        }
        if (parsed.color) {
          commit('SET_CUSTOM_COLOR', parsed.color);
        }
        logger.info('[appearance] - restore - тема:', parsed.theme);
      } catch (e) {
        logger.warn('[appearance] - restore - повреждённые данные:', e.message);
      }
    },
  },
};