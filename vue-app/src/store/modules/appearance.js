// store/modules/appearance.js
import logger from './logger';

const LS_KEY = 'appearance';
const DEFAULT_THEME = 'default';

// Экспортируем для AppSettings.vue
export const BG_THEMES = {
  default: 'По умолчанию',
  field:   'Поле',
  night:   'Ночь',
  forest:  'Лес',
  ocean:   'Океан',
};

export default {
  namespaced: true,
  
  state: () => ({ 
    bgTheme: DEFAULT_THEME 
  }),
  
  getters: {
    bgTheme: (s) => s.bgTheme,
    bgThemeClass: (s) => `bg-theme--${s.bgTheme}`,
  },
  
  mutations: {
    SET_THEME(state, theme) {
      state.bgTheme = BG_THEMES[theme] ? theme : DEFAULT_THEME;
    },
  },
  
  actions: {
    setTheme({ commit, dispatch }, theme) {
      commit('SET_THEME', theme);
      dispatch('persist');
    },
    
    persist({ state }) {
      try {
        localStorage.setItem(LS_KEY, state.bgTheme);
      } catch (e) {
        logger.warn('[appearance] - persist -', e.message);
      }
    },
    
    restore({ commit }) {
      try {
        const savedTheme = localStorage.getItem(LS_KEY);
        if (savedTheme && BG_THEMES[savedTheme]) {
          commit('SET_THEME', savedTheme);
          logger.info('[appearance] - restore - восстановлена тема:', savedTheme);
        }
      } catch (e) {
        logger.warn('[appearance] - restore - повреждённые данные:', e.message);
      }
    },
  },
};