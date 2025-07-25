// // Добавляем константы в начале файла
// const RECONNECT_DELAY = 3000;
// const MAX_RECONNECT_ATTEMPTS = 8;

// export default {
//   namespaced: true,
//   state: {
//     socket: null,
//     reconnectAttempts: 0,
//     explicitDisconnect: false
//   },
  
//   mutations: {
//     SET_SOCKET(state, socket) {
//       state.socket = socket;
//     },
//     SET_RECONNECT_ATTEMPTS(state, attempts) {
//       state.reconnectAttempts = attempts;
//     },
//     SET_EXPLICIT_DISCONNECT(state, value) {
//       state.explicitDisconnect = value;
//     },
//   },

//   actions: {
//     async connect({ state, commit, dispatch }) {
//       if (state.socket && state.socket.readyState === WebSocket.OPEN) {
//         return state.socket;
//       }
      
//       if (state.reconnectAttempts > 0) {
//         await new Promise(resolve => 
//           setTimeout(resolve, RECONNECT_DELAY * Math.pow(2, state.reconnectAttempts)));
//         return dispatch('connect');
//       }
      
//       return new Promise((resolve, reject) => {
//         console.log(`WebSocket connecting to ws://${process.env.VUE_APP_EXP}:${process.env.VUE_APP_PORT}`);
//         const socket = new WebSocket(`ws://${process.env.VUE_APP_EXP}:${process.env.VUE_APP_PORT}`);
        
//         socket.onopen = () => {
//           console.log('WebSocket connected');
//           commit('SET_RECONNECT_ATTEMPTS', 0);
//           socket.onmessage = (event) => dispatch('handleMessage', event);
//           commit('SET_SOCKET', socket);
//           resolve(socket);
//         };

//         socket.onerror = (error) => {
//           console.error('WebSocket error:', error);
//           if (!state.explicitDisconnect) {
//             setTimeout(() => dispatch('connect'), RECONNECT_DELAY);
//           }
//           reject(error);
//         };

//         socket.onclose = (event) => {
//           console.log(`WebSocket closed: ${event.code} ${event.reason}`);
//           commit('SET_SOCKET', null);
          
//           if (!state.explicitDisconnect && state.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
//             const delay = RECONNECT_DELAY * Math.pow(2, state.reconnectAttempts);
//             console.log(`Reconnecting in ${delay}ms...`);
            
//             setTimeout(() => {
//               commit('SET_RECONNECT_ATTEMPTS', state.reconnectAttempts + 1);
//               dispatch('connect');
//             }, delay);
//           }
//         };
//       });
//     },

//     disconnect({ state, commit }) {
//       commit('SET_EXPLICIT_DISCONNECT', true);
//       if (state.socket) {
//         state.socket.close();
//       }
//     },

//     async send({ state }, message) {
//       if (!state.socket || state.socket.readyState !== WebSocket.OPEN) {
//         throw new Error('WebSocket connection not established');
//       }
      
//       console.log('[WebSocket] Отправка:', message);
//       state.socket.send(JSON.stringify(message));
//     },

//     async handleMessage({ dispatch }, event) {
//       try {
//         const response = JSON.parse(event.data);
//         console.log('[WebSocket] Получено:', response);

//         if (response.request === 'config') {
//           await dispatch('config/handleConfigResponse', response, { root: true });
//         }
        
//       } catch (error) {
//         console.error('[WebSocket] Ошибка обработки:', error);
//         dispatch('log/addError', error, { root: true });
//       }
//     }
//   },
  
//   getters: {
//     isConnected: (state) => state.socket?.readyState === WebSocket.OPEN
//   }
// };

const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 8;

export default {
  namespaced: true,
  state: {
    socket: null,
    reconnectAttempts: 0,
    explicitDisconnect: false,
    pendingResponse: null
  },
  
  mutations: {
    SET_SOCKET(state, socket) {
      state.socket = socket;
    },
    SET_RECONNECT_ATTEMPTS(state, attempts) {
      state.reconnectAttempts = attempts;
    },
    SET_EXPLICIT_DISCONNECT(state, value) {
      state.explicitDisconnect = value;
    },
    SET_PENDING_RESPONSE(state, { type, resolve }) {
      state.pendingResponse = { type, resolve };
    },
    CLEAR_PENDING_RESPONSE(state) {
      state.pendingResponse = null;
    }
  },

  actions: {
    async connect({ state, commit, dispatch }) {
      if (state.socket?.readyState === WebSocket.OPEN) {
        return state.socket;
      }
      
      if (state.reconnectAttempts > 0) {
        const delay = RECONNECT_DELAY * Math.pow(2, Math.min(state.reconnectAttempts, 5));
        await new Promise(resolve => setTimeout(resolve, delay));
        return dispatch('connect');
      }
      
      return new Promise((resolve, reject) => {
        const socket = new WebSocket(`ws://${process.env.VUE_APP_EXP}:${process.env.VUE_APP_PORT}`);
        
        socket.onopen = () => {
          console.log('WebSocket connected');
          commit('SET_RECONNECT_ATTEMPTS', 0);
          socket.onmessage = (event) => dispatch('handleMessage', event);
          commit('SET_SOCKET', socket);
          resolve(socket);
        };

        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (!state.explicitDisconnect) {
            setTimeout(() => dispatch('connect'), RECONNECT_DELAY);
          }
          reject(error);
        };

        socket.onclose = () => {
          console.log('WebSocket closed');
          commit('SET_SOCKET', null);
          if (!state.explicitDisconnect && state.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            const delay = RECONNECT_DELAY * Math.pow(2, Math.min(state.reconnectAttempts, 5));
            console.log(`Reconnecting in ${delay}ms...`);
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
      if (state.socket) {
        state.socket.close();
      }
    },

    async send({ state, commit }, message) {
      if (!state.socket || state.socket.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket connection not established');
      }
      
      return new Promise((resolve) => {
        if (message.type === 'auth') {
          commit('SET_PENDING_RESPONSE', {
            type: message.request,
            resolve
          });
        }
        
        console.log('[WebSocket] Sending:', message);
        state.socket.send(JSON.stringify(message));
      });
    },

    async handleMessage({ state, commit, dispatch }, event) {
      try {
        const response = JSON.parse(event.data);
        console.log('[WebSocket] Received:', response);

        if (response.request === 'loginSuccess' && state.pendingResponse?.type === 'login') {
          const { resolve } = state.pendingResponse;
          commit('CLEAR_PENDING_RESPONSE');
          resolve(response);
          return;
        }

        if (response.request === 'config') {
          await dispatch('config/handleConfigResponse', response, { root: true });
        }
        
      } catch (error) {
        console.error('[WebSocket] Message handling error:', error);
        dispatch('log/addError', error, { root: true });
      }
    }
  },
  
  getters: {
    isConnected: (state) => state.socket?.readyState === WebSocket.OPEN
  }
};