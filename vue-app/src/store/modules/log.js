// store/modules/log.js
const MAX_ERRORS = 100; // защита от бесконечного роста массива в памяти

export default {
  namespaced: true,

  state: () => ({
    errors: [],
  }),

  mutations: {
    ADD_ERROR(state, error) {
      state.errors.push({
        message: error?.message || String(error),
        timestamp: new Date().toISOString(),
      });
      if (state.errors.length > MAX_ERRORS) {
        state.errors.splice(0, state.errors.length - MAX_ERRORS);
      }
    },
  },

  actions: {
    // Отправка лога напрямую в уже открытый сокет. Намеренно НЕ через
    // websocket/send: логирование не должно инициировать переподключение
    // и не должно само порождать ошибки.
    sendLogToServer({ rootState }, { type, message }) {
      try {
        const socket = rootState.websocket.socket;
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type,
            request: 'error',
            payload: { type, message },
          }));
        }
      } catch (error) {
        console.error('Ошибка отправки лога:', error);
      }
    },

    addError({ commit, dispatch }, error) {
      commit('ADD_ERROR', error);
      dispatch('sendLogToServer', {
        type: 'error',
        message: error?.message || String(error),
      });
    },
  },

  getters: {
    getErrors: (state) => state.errors,
  },
};
