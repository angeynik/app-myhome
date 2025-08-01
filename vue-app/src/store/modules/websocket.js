// // Добавляем константы в начале файла

const RECONNECT_DELAY = 1000;
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
          reject(new Error('WebSocket connection error'));
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
    // Попытаемся переподключиться перед ошибкой
      try {
        await this.dispatch('connect');
      } catch (err) {
        throw new Error('WebSocket connection not established');
      }
        //throw new Error('WebSocket connection not established');
      }
      
      return new Promise((resolve) => {
        if (message.type === 'auth') {
          commit('SET_PENDING_RESPONSE', {
            type: message.request,
            resolve
          });
        }
        
        //console.log('[WebSocket] Sending:', message);
        state.socket.send(JSON.stringify(message));
      });
    },

    async handleMessage({ state, commit, dispatch, rootGetters}, event) {

      try {
        const response = JSON.parse(event.data);
        //console.log('[WebSocket] Received:', response);
        const dID = response.name;
        const auth_dID = rootGetters['dID'];
        if (response.request === 'loginSuccess' && state.pendingResponse?.type === 'login') {
          const { resolve } = state.pendingResponse;
          commit('CLEAR_PENDING_RESPONSE');
          resolve(response);
          return;
        }

        if (response.request === 'config') {
          await dispatch('config/handleConfigResponse', response, { root: true });
        }
       
        if (response.type === 'post') {
          //console.log('[WebSocket] Обрабатываем сообщение type = post');
          //console.log('dID сообщения - ', dID, ' dID активного пользователя - ', auth_dID);
          // Обновляем значение датчика
            if (response.request === 'sensor' && dID === auth_dID) {
            //if (dID === auth_dID) {
              //console.log('[WebSocket] Обрабатываем сообщение request = sensor');
              

              // Валидация payload
              if (!response.payload || typeof response.payload !== 'object') {
                console.warn('[WebSocket] Невалидный payload сенсора');
                return;
              }
              await dispatch('config/handleSensorUpdate', {dID, payload: response.payload}, { root: true });
            } else {
                console.log('[WebSocket] dID сообщения запроса', dID, ' не соответствует dID текущего пользователя - ', auth_dID);
                return;
            }

            if (response.request === 'actuators') {
              console.log('[WebSocket] Received request === actuators', response);
              //await dispatch('config/updateSensorValue', response, { root: true });
            }

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