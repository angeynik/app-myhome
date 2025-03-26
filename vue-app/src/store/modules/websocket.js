const generateRequestId = () => Date.now() + '-' + Math.random().toString(36).substr(2, 9);

export default {
  namespaced: true,
  state: {
    socket: null,
    pendingRequests: new Map(),
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
  },

  actions: {
    async connect({ state, commit, dispatch }) {
      if (state.socket && state.socket.readyState === WebSocket.OPEN) {
        return state.socket;
      }

      return new Promise((resolve, reject) => {
        const socket = new WebSocket(`ws://${process.env.VUE_APP_HOST}:${process.env.VUE_APP_PORT}`);
        
        socket.onopen = () => {
          console.log('WebSocket connected');
          socket.onmessage = (event) => dispatch('handleMessage', event);
          commit('SET_SOCKET', socket);
          resolve(socket);
        };

        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        socket.onclose = () => {
          console.log('WebSocket disconnected');
          commit('SET_SOCKET', null);
        };
      });
    },

    disconnect({ state }) {
      if (state.socket) {
        state.socket.close();
      }
    },

    async send({ state, commit }, { type, name='', request, payload = {} }) {
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
            requestId // Переносим requestId в payload
          }
        };
        
        socket.send(JSON.stringify(message));

        // Таймаут для обработки отсутствия ответа
        setTimeout(() => {
          commit('REMOVE_PENDING_REQUEST', requestId);
          reject(new Error('Request timeout'));
        }, 10000);
      });
    },
      handleMessage({ state, commit }, event) {
        const response = JSON.parse(event.data);
        
        // Получаем requestId из payload
        const requestId = response.payload?.requestId;
        
        if (requestId && state.pendingRequests.has(requestId)) {
          const { resolve, reject } = state.pendingRequests.get(requestId);
          commit('REMOVE_PENDING_REQUEST', requestId);
          
          if (response.type === 'error') {
            reject(new Error(response.message));
          } else {
            resolve(response);
          }
        }
        
        // Обработка глобальных сообщений
        if (response.type === 'loginSuccess') {
          // Пример обработки имени из ответа
          const dataSourceName = response.name;
          console.log('Источник данных:', dataSourceName);
        }
      }

  }
};