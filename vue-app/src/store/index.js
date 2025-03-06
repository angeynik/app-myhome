import { createStore } from 'vuex';

const store = createStore({
  state: {
    token: localStorage.getItem('token') || '',
    user: {},
    status: '',
    socket: null, // Добавляем сокет в состояние
  },
  mutations: {
    AUTH_REQUEST(state) {
      state.status = 'loading';
    },
    AUTH_SUCCESS(state, { token, user }) {
      state.status = 'success';
      state.token = token;
      state.user = user;
    },
    AUTH_ERROR(state) {
      state.status = 'error';
    },
    LOGOUT(state) {
      state.status = '';
      state.token = '';
      state.user = {};
    },
    SET_SOCKET(state, socket) {
      state.socket = socket; // Сохраняем сокет в состоянии
    },
  },
  actions: {
    async connectWebSocket({ commit }) {
      return new Promise((resolve, reject) => {
        const socket = new WebSocket(`ws://${process.env.VUE_APP_HOST}:${process.env.VUE_APP_PORT}`);

        socket.onopen = () => {
          console.log('WebSocket соединение установлено');
          commit('SET_SOCKET', socket); // Сохраняем сокет в состоянии
          resolve(socket);
        };

        socket.onerror = (error) => {
          console.error('WebSocket ошибка:', error);
          reject(error);
        };

        socket.onclose = () => {
          console.log('WebSocket соединение закрыто');
        };
      });
    },
    async login({ commit, state }, user) {
      commit('AUTH_REQUEST');

      if (!state.socket) {
        await this.dispatch('connectWebSocket'); // Устанавливаем соединение, если сокет не создан
      }

      return new Promise((resolve, reject) => {
        const socket = state.socket;

        // Отправляем сообщение для авторизации
        socket.send(
          JSON.stringify({
            type: 'login',
            username: user.username,
            password: user.password,
          })
        );

        // Обрабатываем ответ от сервера
        socket.onmessage = (event) => {
          const response = JSON.parse(event.data);

          if (response.type === 'loginSuccess') {
            const token = response.token;
            const userData = response.user;

            localStorage.setItem('token', token);
            commit('AUTH_SUCCESS', { token, user: userData });
            console.log('Логин и пароль приняты');
            resolve(userData);
          } else if (response.type === 'loginError') {
            commit('AUTH_ERROR');
            localStorage.removeItem('token');
            console.log('Логин и пароль ОТКЛОНЕНЫ');
            reject(new Error(response.message));
          }
        };

        socket.onerror = (error) => {
          commit('AUTH_ERROR');
          localStorage.removeItem('token');
          reject(error);
        };
      });
    },
    logout({ commit, state }) {
      if (state.socket) {
        state.socket.close(); // Закрываем соединение
      }
      commit('LOGOUT');
      localStorage.removeItem('token');
    },
    async sendLogToServer( { type, message }) {
      try {
        const payload = { type, message };
        await fetch(`http://${process.env.VUE_APP_HOST}:${process.env.VUE_APP_SERVER_PORT}/log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.error('Failed to send log to server', error);
      }
    },
  },
  getters: {
    isAuthenticated: (state) => !!state.token,
    authStatus: (state) => state.status,
    user: (state) => state.user,
  },
});

export default store;