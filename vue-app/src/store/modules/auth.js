

export default {
  namespaced: true,
  state: () => ({
    token: '',
    user: {},
    status: '',
    level: 0,
    dID: null
  }),
  
  mutations: {
    AUTH_REQUEST(state) {
      state.status = 'loading';
    },
    AUTH_SUCCESS(state, { token, user, dID, level }) {
      state.token = token;
      state.user = user;
      state.dID = dID;
      state.level = level;
      state.status = 'success';
    },
  RESTORE_AUTH(state, data) {
    state.token = data.token;
    state.user = data.user;
    state.dID = data.dID;
    state.level = data.level;
    state.status = 'success';
  },
    AUTH_ERROR(state) {
      state.status = 'error';
    },
    LOGOUT(state) {
      state.status = '';
      state.token = '';
      state.user = {};
      state.dID = null;
    }
  },
  
  actions: {
    async login({ commit, dispatch }, user) {
      commit('AUTH_REQUEST');
      try {
        await dispatch('websocket/connect', null, { root: true });
        
        const response = await dispatch('websocket/send', {
          type: 'auth',
          request: 'login',
          name: '',
          payload: {
            username: user.username,
            password: user.password
          }
        }, { root: true });
        console.log('Ответ сервера:', response);

        if (response?.request === 'loginSuccess') {
          const userData = {
            username: response.payload.username,
            userlevel: response.payload.userlevel,
            dID: response.name
          };
        // Сохраняем данные в localStorage
          localStorage.setItem('authData', JSON.stringify({
            token: response.payload.token,
            user: userData,
            dID: userData.dID,
            level: userData.userlevel
          }));

          commit('AUTH_SUCCESS', {
            token: response.payload.token,
            user: userData,
            dID: userData.dID,
            level: userData.userlevel
          });

          
          return userData;
        }
        throw new Error(response?.payload?.message || 'Неверный формат ответа сервера');
      } catch (error) {
        commit('AUTH_ERROR');
        throw error;
      }
    },
    
    logout({ commit }) {
      commit('LOGOUT');
      localStorage.removeItem('authData'); // Очищаем хранилище
    }
  }
};