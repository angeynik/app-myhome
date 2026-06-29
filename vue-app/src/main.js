// main.js
import { createApp } from 'vue';
import App from './App.vue';
import store from './store/index.js';
import router from './router/routes.js';

const app = createApp(App);
app.use(store);

store.dispatch('initializeStore').then(async () => {
  // Авто-логин ДО подключения роутера
  const user = store.state.auth.user;
  if (user && user.username && user.password) {
    await store.dispatch('auth/login', {
      username: user.username,
      password: user.password,
    });
    console.log('[MAIN] после auth/login, isAuthenticated:', store.getters.isAuthenticated);
  } else {
    console.log('[MAIN] нет данных для авто-логина, user:', user);
  }

  // Роутер подключаем ПОСЛЕ — guard увидит уже заполненный store
  app.use(router);
  app.mount('#app');
});
// store.dispatch('initializeStore').then(() => {
//   app.mount('#app');
// });