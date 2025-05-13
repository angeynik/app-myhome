// store/modules/log.js
// const logModule = {
//     actions: {
//       async sendLogToServer({ state }, { type, message }) {
        
//         console.log('Нужна реализация отправки логов на сервер', state, type, message);
//         // if (!state.socket || state.socket.readyState !== WebSocket.OPEN) {
//         //   console.error('Соединение с сервером не установлено.');
//         //   return;
//         // }
//         // try {
//         //   await state.socket.send('log', 'sendLog', { type, message });
//         // } catch (error) {
//         //   console.error('Failed to send log to server', error);
//         // }
//       },
//     },
//     mutations: {
//       ADD_ERROR(state, error) {
//         // Логика сохранения ошибки
//       }
//     },
//   };
  
//   export default logModule;

// store/modules/log.js


export default {
  namespaced: true,
  state: () => ({
    errors: []
  }),
  actions: {
    async sendLogToServer({ rootState }, { type, message }) {
      try {
        if (rootState.websocket.socket?.readyState === WebSocket.OPEN) {
          await rootState.websocket.socket.send(
            JSON.stringify({
              type: 'log',
              request: 'add',
              payload: { type, message }
            })
          );
        }
      } catch (error) {
        console.error('Ошибка отправки лога:', error);
      }
    },

    addError({ commit, dispatch }, error) {
      commit('ADD_ERROR', error);
      dispatch('sendLogToServer', { 
        type: 'error',
        message: error.message || error.toString()
      });
    }
  },
  mutations: {
    ADD_ERROR(state, error) {
      state.errors.push({
        message: error.message || error.toString(),
        timestamp: new Date().toISOString()
      });
    }
  },
  getters: {
    getErrors: state => state.errors
  }
};