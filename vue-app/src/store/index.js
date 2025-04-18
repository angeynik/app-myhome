import { createStore } from 'vuex';
import auth from './modules/auth';
import websocket from './modules/websocket';
import log from './modules/log';

const store = createStore({
  modules: {
    auth,
    websocket,
    log
  },
  actions: {
    toLowerCase(_, str) {
      return str.toLowerCase();
    },
  },
  getters: {
    isAuthenticated: (state) => !!state.auth.token,
    authStatus: (state) => state.auth.status,
    user: (state) => state.auth.user,
    level: (state) => state.auth.user.userlevel || 0,
    dID: (state) => state.auth.user.dID || null,
  }
});

export default store;
