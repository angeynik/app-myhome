const generateRequestId = () => Date.now() + '-' + Math.random().toString(36).substr(2, 9);
const RECONNECT_DELAY = 3000; // Базовая задержка переподключения
const MAX_RECONNECT_ATTEMPTS = 8; // Максимальное количество попыток

export default {
  namespaced: true,
  state: {
    socket: null,
    pendingRequests: new Map(),
    reconnectAttempts: 0,
    explicitDisconnect: false
  },
  
  mutations: {
    SET_SOCKET(state, socket) {
      state.socket = socket;
    },
    ADD_PENDING_REQUEST(state, { requestId, resolve, reject }) {
      state.pendingRequests.set(requestId, { resolve, reject });
    },
    REMOVE_PENDING_REQUEST(state, requestId) {
      state.pendingRequests.delete(requestId);
    },
    SET_RECONNECT_ATTEMPTS(state, attempts) {
      state.reconnectAttempts = attempts;
    },
    SET_EXPLICIT_DISCONNECT(state, value) {
      state.explicitDisconnect = value;
    },
  },

  actions: {
    async connect({ state, commit, dispatch }) {
      if (state.socket && state.socket.readyState === WebSocket.OPEN) {
        return state.socket;
      }
      if (state.reconnectAttempts > 0) {
        await new Promise(resolve => 
          setTimeout(resolve, RECONNECT_DELAY * Math.pow(2, state.reconnectAttempts)));
          return dispatch('connect');
        //return this.connect({ state, commit, dispatch });
      }
      
      return new Promise((resolve, reject) => {
        const socket = new WebSocket(`ws://${process.env.VUE_APP_HOST}:${process.env.VUE_APP_PORT}`);
        
        socket.onopen = () => {
          console.log('WebSocket connected');
          commit('SET_RECONNECT_ATTEMPTS', 0); // Сброс счетчика
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
          if (state.explicitDisconnect) return;
          
          const delay = RECONNECT_DELAY * Math.pow(2, Math.min(state.reconnectAttempts, 5));
          console.log(`Reconnecting in ${delay}ms...`);
          
          setTimeout(() => {
            commit('SET_RECONNECT_ATTEMPTS', state.reconnectAttempts + 1);
            dispatch('connect').catch(console.error);
          }, delay);
        };
        socket.onclose = (event) => {
          console.log(`WebSocket closed: ${event.code} ${event.reason}`);
          commit('SET_SOCKET', null);
          
          if (!state.explicitDisconnect && state.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            const delay = RECONNECT_DELAY * Math.pow(2, state.reconnectAttempts);
            console.log(`Reconnecting in ${delay}ms...`);
            
            setTimeout(() => {
              commit('SET_RECONNECT_ATTEMPTS', state.reconnectAttempts + 1);
              dispatch('connect');
            }, delay);
          }
        };


      });
    },

    disconnect({ state }) {
      if (state.socket) {
        state.socket.close();
      }
    },

    async send({ state, commit }, { type, request, name, payload = {} }) {
      const socket = state.socket;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket connection not established');
      }

      const requestId = generateRequestId();
      
      return new Promise((resolve, reject) => {
        commit('ADD_PENDING_REQUEST', { requestId, resolve, reject });
        const message = {
          type,
          request,
          name,
          payload: {
            ...payload,
            requestId: requestId
          },
          
        };
        //console.log('Отправляем на сервер - ', message);
        socket.send(JSON.stringify(message));

        // Таймаут для обработки отсутствия ответа
        setTimeout(() => {
          commit('REMOVE_PENDING_REQUEST', requestId);
          reject(new Error('Request timeout'));
        }, 2000);
      });
    },

    handleMessage({ state, commit }, event) {
      try {
        console.log ('socket.onmessage - получено сообщение', event.data);
        

          const response = JSON.parse(event.data);
          const requestId = response.payload.requestId;
          console.log(`Ответ handleMessage: requestId=${requestId}, содержится ли в pendingRequests=${state.pendingRequests.has(requestId)}`);
          
          if (requestId && state.pendingRequests.has(requestId)) {
            console.log('requestId - совпал');
              const { resolve, reject } = state.pendingRequests.get(requestId);
              commit('REMOVE_PENDING_REQUEST', requestId);
              
              if (response.type === 'error' && response.request === 'configError') {
                  console.warn(`Ошибка от сервера: ${response.payload.message}`);
                  // Возвращаем оригинальную структуру ответа сервера
                  resolve(response); 
              } else if (response.type === 'error') {
                  reject(new Error(response.payload.message));
              } else {
                  resolve(response);
              }
          } else {
              console.log('Необработанное сообщение:', response.payload);
          }
      } catch (error) {
          console.error('Ошибка обработки сообщения:', error);
      }
  },
  




  },
  getters: {
    send: (state) => state.socket?.send.bind(state.socket),
    isConnected: (state) => state.socket?.readyState === WebSocket.OPEN
  },
};