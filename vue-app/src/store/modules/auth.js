export default {
  namespaced: true,
  state: () => ({
    token: '',
    user: {},
    status: '',
    level: 0,
    dID: '',
  }),
  mutations: {
    AUTH_REQUEST(state) {
      state.status = 'loading';
    },
    AUTH_SUCCESS(state, { token, user }) {
      state.token = token;
      state.user = user;
      state.level = user.userlevel;
      state.dID = user.dID;
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
      state.level = 0;
      state.dID = '';
    }
  },

  actions: {
      async login({ commit, dispatch }, user) {
        commit('AUTH_REQUEST');
        
        try {
          const response = await dispatch('websocket/send', {
            type: 'auth',
            request: 'login',
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

    logout({ commit, dispatch }) {
      dispatch('websocket/disconnect', null, { root: true });
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

// export default {
//   namespaced: true,
//   state: () => ({
//     token: '',
//     user: {},
//     status: '',
//     level: 0,
//     dID: '',
//   }),
//   mutations: {
//     AUTH_REQUEST(state) {
//       state.status = 'loading';
//     },
//   AUTH_SUCCESS(state, { token, user }) {
//     console.log('Выполняется мутация AUTH_SUCCESS с данными:', { token, user });
//     state.status = 'success';
//     state.token = token;
//     state.user = user;
//     state.level = user.userlevel;
//     state.dID = user.dID;
//   },
//     AUTH_ERROR(state) {
//       state.status = 'error';
//     },
//     LOGOUT(state) {
//       state.status = '';
//       state.token = '';
//       state.user = {};
//       state.level = 0;
//       state.dID = '';
//     }
//   },

//   actions: {
//     // async login({ commit, dispatch }, user) {
//     //   commit('AUTH_REQUEST');
      
//     //   try {
//     //     const response = await dispatch('websocket/send', {
//     //       type: 'auth',
//     //       request: 'login',
//     //       name: '',
//     //       payload: {
//     //         username: user.username,
//     //         password: user.password
//     //       }
//     //     }, { root: true });
  
//     //     // Добавляем проверку структуры ответа
//     //     console.log('Ответ сервера:', response);
        
//     //     if (response && response.payload) {
//     //       const { token, username, userlevel, requestID } = response.payload;
          
//     //       const userData = { 
//     //         username,
//     //         userlevel,
//     //         dID: response.name || '',
//     //         requestID
//     //       };
  
//     //       localStorage.setItem('token', token);
//     //       localStorage.setItem('user', JSON.stringify(userData));
          
//     //       commit('AUTH_SUCCESS', { 
//     //         token, 
//     //         user: userData 
//     //       });
          
//     //       return userData;
//     //     }
//     //     throw new Error('Неверный формат ответа сервера');
//     //   } catch (error) {
//     //     console.error('Ошибка авторизации:', error);
//     //     commit('AUTH_ERROR');
//     //     localStorage.removeItem('token');
//     //     throw error;
//     //   }
//     // },
   
//       async login({ commit, dispatch }, user) {
//         commit('AUTH_REQUEST');
        
//         try {
//           const response = await dispatch('websocket/send', {
//             type: 'auth',
//             request: 'login',
//             payload: {
//               username: user.username,
//               password: user.password
//             }
//           }, { root: true });
    
//           // Добавляем логирование ответа
//           console.log('Получен ответ от сервера:', response);
    
//           if (response && response.payload) {
//             const userData = { 
//               username: response.payload.username,
//               userlevel: response.payload.userlevel,
//               dID: response.name // Берем dID из поля name ответа
//             };
    
//             localStorage.setItem('token', response.payload.token);
//             localStorage.setItem('user', JSON.stringify(userData));
            
//             commit('AUTH_SUCCESS', { 
//               token: response.payload.token, 
//               user: userData 
//             });
    
//             console.log('Данные после коммита:', store.state.auth); // Добавляем логирование
//             return userData;
//           }
//           throw new Error('Неверный формат ответа сервера');
//         } catch (error) {
//           console.error('Ошибка авторизации:', error);
//           commit('AUTH_ERROR');
//           throw error;
//         }
//       },
    
//     logout({ commit, dispatch }) {
//       dispatch('websocket/disconnect', null, { root: true });
//       commit('LOGOUT');
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//     },

//     initializeApp({ commit }) {
//       const token = localStorage.getItem('token');
//       const user = JSON.parse(localStorage.getItem('user') || '{}');
      
//       if (token && user.username) {
//         commit('AUTH_SUCCESS', { token, user });
//       } else {
//         commit('LOGOUT');
//       }
//     }
//   },
  
// };