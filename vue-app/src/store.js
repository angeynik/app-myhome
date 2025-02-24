import { reactive } from 'vue';

const state = reactive({
  isAuthenticated: false,
  user: null,
});

function login(user) {
  state.isAuthenticated = true;
  state.user = user;
}

function logout() {
  state.isAuthenticated = false;
  state.user = null;
}

export default {
  state,
  login,
  logout,
};
