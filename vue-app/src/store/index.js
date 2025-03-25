import { createStore } from 'vuex';
import auth from './modules/auth';
import websocket from './modules/websocket';

const store = createStore({
  modules: {
    auth,
    websocket
  },
 
  state: { },

  mutations: { },

  getters: {
    isAuthenticated: (state) => !!state.auth.token,
    authStatus: (state) => state.auth.status,
    user: (state) => state.auth.user,
    level: (state) => state.auth.user.userlevel || 0,
    dID: (state) => state.auth.user.dID || ''
  }
});

export default store;
