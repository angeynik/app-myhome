export default {
  namespaced: true,
  state: () => ({
    token: '',
    user: {},
    status: '',
  }),
  mutations: {
    AUTH_REQUEST(state) {
      state.status = 'loading';
    },
    AUTH_SUCCESS(state, { token, user }) {
      state.token = token;
      state.user = user;
      state.status = 'success';
      console.log('Обновленное состояние:', state);
    },
  AUTH_ERROR(state) {
      state.status = 'error';
    },
    LOGOUT(state) {
      state.status = '';
      state.token = '';
      state.user = {};
    }
  },

  actions: {
      async login({ commit, dispatch }, user) {
        commit('AUTH_REQUEST');
        
        try {
          const response = await dispatch('websocket/send', {
            type: 'auth',
            request: 'login',
            name: '',
            payload: {
              username: user.username,
              password: user.password
            }
          }, { root: true });
    
          console.log('Полный ответ сервера:', response);
    
          // Исправленная проверка ответа
          if (response?.payload?.token && response?.payload?.userlevel) {
            const userData = { 
              username: response.payload.username,
              userlevel: response.payload.userlevel,
              dID: response.name // или response.payload.dID, в зависимости от сервера
            };
    
            localStorage.setItem('token', response.payload.token);
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('localStorage user - ', localStorage.getItem('user'));
            
            commit('AUTH_SUCCESS', { 
              token: response.payload.token, 
              user: userData 
            });
            
            return userData;
          }
          throw new Error('Неверный формат ответа сервера');
        } catch (error) {
          console.error('Ошибка авторизации:', error);
          commit('AUTH_ERROR');
          localStorage.removeItem('token');
          throw error;
        }
      },

    logout({ commit}) {
     //dispatch('websocket/disconnect', null, { root: true });
      commit('LOGOUT');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },

    initializeApp({ commit }) {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (token && user.username) {
        commit('AUTH_SUCCESS', { token, user });
      } else {
        commit('LOGOUT');
      }
    }
  }
};