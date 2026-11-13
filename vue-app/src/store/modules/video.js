// store/modules/video.js
import logger from './logger';

export default {
  namespaced: true,

  state: () => ({
    snapshot: null, // { image: string, mimeType: string, size: number, timestamp: number }
  }),

  getters: {
    // Компоненты будут брать картинку через этот геттер
    getSnapshot: (state) => state.snapshot,
    hasSnapshot: (state) => !!state.snapshot,
  },

  mutations: {
    SET_SNAPSHOT(state, payload) {
      // Сохраняем только нужные поля, чтобы не тянуть лишнее в память
      state.snapshot = {
        image: payload.image,
        mimeType: payload.mimeType,
        size: payload.size,
        timestamp: payload.timestamp,
      };
    },
    RESET(state) {
      state.snapshot = null;
    },
  },

  actions: {
    handleSnapshot({ commit }, payload) {
      if (!payload || !payload.image) {
        logger.warn('[video] - handleSnapshot - пустой payload');
        return;
      }
      // Логируем только размер, чтобы не спамить консоль гигабайтами base64
      logger.dev(`[video] - handleSnapshot - получен кадр, размер: ${payload.size} байт`);
      commit('SET_SNAPSHOT', payload);
    },
  },
};