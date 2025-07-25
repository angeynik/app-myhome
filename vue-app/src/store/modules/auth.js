// export default {
//   namespaced: true,
//   state: () => ({
//     token: '',
//     user: {},
//     status: '',
//     level: 0,
//     dID: null
//   }),
//   mutations: {
//     AUTH_REQUEST(state) {
//       state.status = 'loading';
//     },
//     AUTH_SUCCESS(state, { token, user, dID, level}) {
//       state.token = token;
//       state.user = user;
//       state.dID = dID;
//       state.level = level;
//       state.status = 'success';
//       console.log('Обновленное состояние:', state);
//     },
//   AUTH_ERROR(state) {
//       state.status = 'error';
//     },
//     LOGOUT(state) {
//       state.status = '';
//       state.token = '';
//       state.user = {};
//     }
//   },

//   actions: {
//       async login({ commit, dispatch }, user) {
//         commit('AUTH_REQUEST');
       
//         try {
// // Устанавливаем соединение перед отправкой запроса
//           await dispatch('websocket/connect', null, { root: true });

//           const response = await dispatch('websocket/send', {
//             type: 'auth',
//             request: 'login',
//             name: '',
//             payload: {
//               username: user.username,
//               password: user.password
//             }
//           }, { root: true });
    
//           console.log('Полный ответ сервера:', response);
    
//           // Исправленная проверка ответа
//           if (response?.payload?.token && response?.payload?.userlevel && response?.request === 'loginSuccess') {
//             const userData = { 
//               username: response.payload.username,
//               userlevel: response.payload.userlevel,
//               dID: response.name // или response.payload.dID, в зависимости от сервера
//             };
    
//             // localStorage.setItem('token', response.payload.token);
//             // localStorage.setItem('user', JSON.stringify(userData));
//             console.log('localStorage user - ', userData.username, userData.dID);
            
//             commit('AUTH_SUCCESS', { 
//               token: response.payload.token, 
//               user: userData,
//               dID: userData.dID,
//               level: userData.userlevel
//             });
            
//             return userData;
//           }
//           throw new Error('Неверный формат ответа сервера');
//         } catch (error) {
//           console.error('Ошибка авторизации:', error);
//           commit('AUTH_ERROR');
//           localStorage.removeItem('token');
//           throw error;
//         }
//       },

//     logout({ commit}) {
//      //dispatch('websocket/disconnect', null, { root: true });
//       commit('LOGOUT');
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//     },

//     initializeApp({ commit }) {
//       const token = localStorage.getItem('token');
//       const user = JSON.parse(localStorage.getItem('user') || '{}');
      
//       if (token && user.username) {
//         commit('AUTH_SUCCESS', { token, user: user.username, dID:user.dID, level: user.userlevel });
//       } else {
//         commit('LOGOUT');
//       }
//     }
//   }
// };

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
    }
  }
};