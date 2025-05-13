import { createStore } from 'vuex';
import auth from './modules/auth';
import websocket from './modules/websocket';
import log from './modules/log';
import sortParams from './modules/sortParams';
import config from './modules/config';

const store = createStore({
  modules: {
    auth,
    websocket,
    log,
    sortParams,
    config
  },
  actions: {
    toLowerCase(_, str) {
      return str.toLowerCase();
    },
  },
  getters: {
    isAuthenticated: (state) => !!state.auth.token,
    authStatus: (state) => state.auth.status,
    user: (state) => state.auth.user.username || '',
    level: (state) => state.auth.level || 0,
    dID: (state) => state.auth.dID || null,

  }
});

export default store;
