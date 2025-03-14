import { createStore } from 'vuex';

const store = createStore({
  state: {
    token: localStorage.getItem('token') || '',
    user: {},
    status: '',
    socket: null, // Добавляем сокет в состояние
    level: null,
  },
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
    async sendWSMessage({ state }, { type, payload }) {
      return new Promise((resolve, reject) => {
        const socket = state.socket;
  
        if (!socket || socket.readyState !== WebSocket.OPEN) {
          reject(new Error('Соединение с сервером не установлено.'));
          return;
        }
        // Отправляем сообщение на сервер
        console.log('Отправляем сообщение на сервер (sendWSMessage в index.js):', type, payload);
        socket.send(
          JSON.stringify({
            type,
            ...payload, // Данные, которые нужно отправить
          })
        );
  
        // Обрабатываем ответ от сервера
        socket.onmessage = (event) => {
          const response = JSON.parse(event.data);
  
          if (response.type === `${type}Success`) {
            resolve(response.message); // Успешный ответ
          } else if (response.type === `${type}Error`) {
            reject(new Error(response.message)); // Ошибка
          }
        };
  
        socket.onerror = (error) => {
          reject(error);
        };
      });
    },
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
        try {
          await this.dispatch('connectWebSocket');
        } catch (error) {
          commit('AUTH_ERROR');
          return Promise.reject(new Error('Не удалось подключиться к серверу.'));
        }
      }

      const socket = state.socket;

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        commit('AUTH_ERROR');
        return Promise.reject(new Error('Соединение с сервером не установлено.'));
      }

      return new Promise((resolve, reject) => {
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
            const userData = { username: response.username, userlevel: response.userlevel };

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            
            commit('AUTH_SUCCESS', { token, user: userData });
            console.log('Логин и пароль приняты', userData);
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
    
    async initializeApp({ commit }) {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user')); // Восстанавливаем данные пользователя
  
      if (token && user) {
        commit('AUTH_SUCCESS', { token, user }); // Восстанавливаем состояние
      } else {
        commit('LOGOUT'); // Сбрасываем состояние, если данных нет
      }
    },
  },
  getters: {
    isAuthenticated: (state) => !!state.token,
    authStatus: (state) => state.status,
    user: (state) => state.user,
    level: (state) => state.level,
  },
});

export default store;