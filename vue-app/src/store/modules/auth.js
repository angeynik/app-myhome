// store/modules/auth.js
const authModule = {
    state: () => ({
      token: localStorage.getItem('token') || '',
      user: {},
      status: '',
      level: null,
    }),
    mutations: {
      AUTH_REQUEST(state) {
        state.status = 'loading';
      },
      AUTH_SUCCESS(state, { token, user }) {
        state.status = 'success';
        state.token = token;
        state.user = user;
        state.level = user.userlevel;
      },
      AUTH_ERROR(state) {
        state.status = 'error';
      },
      LOGOUT(state) {
        state.status = '';
        state.token = '';
        state.user = {};
        state.level = null;
      },
      SET_SOCKET(state, socket) {
        state.socket = socket; // Сохраняем сокет в состоянии
      },
    },
    actions: {
      async login({ commit, dispatch }, user) {
        commit('AUTH_REQUEST');
        try {
          await dispatch('connectWebSocket');
          const socket = this.state.socket.socket;
          if (!socket || socket.readyState !== WebSocket.OPEN) {
            commit('AUTH_ERROR');
            return Promise.reject(new Error('Соединение с сервером не установлено.'));
          }
          return new Promise((resolve, reject) => {
            socket.send(JSON.stringify({ type: 'login', ...user }));
            socket.onmessage = (event) => {
              const response = JSON.parse(event.data);
              if (response.type === 'loginSuccess') {
                const token = response.token;
                const userData = { username: response.username, userlevel: response.userlevel };
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(userData));
                commit('AUTH_SUCCESS', { token, user: userData });
                resolve(userData);
              } else if (response.type === 'loginError') {
                commit('AUTH_ERROR');
                localStorage.removeItem('token');
                reject(new Error(response.message));
              }
            };
            socket.onerror = (error) => {
              commit('AUTH_ERROR');
              localStorage.removeItem('token');
              reject(error);
            };
          });
        } catch (error) {
          commit('AUTH_ERROR');
          return Promise.reject(new Error('Не удалось подключиться к серверу.'));
        }
      },
      logout({ commit, state }) {
        if (state.socket.socket) {
          state.socket.socket.close();
        }
        commit('LOGOUT');
        localStorage.removeItem('token');
      },
    },
    getters: {
      isAuthenticated: (state) => !!state.token,
      authStatus: (state) => state.status,
      user: (state) => state.user,
      level: (state) => state.level || 0,
    },
  };
  
  export default authModule;