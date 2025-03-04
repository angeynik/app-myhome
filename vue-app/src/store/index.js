import { createStore } from 'vuex';
import axios from 'axios';
//const apiUrl = `${process.env.VUE_APP_HOST}:${process.env.VUE_APP_SERVER_PORT}/login`;
const apiUrl = 'http://localhost:3010/login';
console.log('apiUrl:', apiUrl); 

const store = createStore({
  state: {
    token: localStorage.getItem('token') || '',
    user: {},
    status: ''
  },
  mutations: {
    AUTH_REQUEST(state) {
      state.status = 'loading';
    },
    AUTH_SUCCESS(state, { token, user }) { // Принимаем объект с token и user
      state.status = 'success';
      state.token = token;
      state.user = user; // Сохраняем пользователя в состоянии
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
    async login({ commit }, user) {
      commit('AUTH_REQUEST');
      try {
        //const response = await axios.post('http://localhost:3010/login', user);
        console.log('Sending login request with data:', user); // Логируем данные
        //const response = await axios.post(apiUrl, user);
        const response = await axios.post(apiUrl, user, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
        const token = response.data.token;
        const userData = response.data.user;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['x-access-token'] = token;
        commit('AUTH_SUCCESS', { token, user: userData });
        return userData;
      } catch (error) {
        commit('AUTH_ERROR');
        localStorage.removeItem('token');
        throw error;
      }
    },
    logout({ commit }) {
      commit('LOGOUT');
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['x-access-token'];
    }
  },
  getters: {
    isAuthenticated: state => !!state.token,
    authStatus: state => state.status,
    user: state => state.user
  }
});

export default store;