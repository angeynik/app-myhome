// main.js
import { createApp } from 'vue';
import App from './App.vue';
import store from './store/index.js';
import router from './router/routes.js';
import '@/assets/mainStyle.css';

const app = createApp(App);
app.use(store);
(async () => {
  try {
    await store.dispatch('initializeStore');

    // Поднимаем WS-соединение. При открытии сокета websocket/onConnected сам
    // восстанавливает сессию по JWT (auth/resume) — ждём его результата, чтобы
    // навигационный гард увидел актуальное состояние. Токена нет или он отклонён —
    // роутер отправит на /login.
    await store.dispatch('websocket/connect');
    await store.dispatch('websocket/whenSessionReady');
  } catch (e) {
    console.warn('[MAIN] bootstrap:', e.message);
    // Сервер недоступен — монтируем приложение всё равно; WS переподключится сам
    // и восстановит сессию при первом удачном подключении (websocket/onConnected).
  } finally {
    app.use(router);
    app.mount('#app');
  }
})();
