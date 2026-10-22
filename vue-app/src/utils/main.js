// main.js
import { createApp } from 'vue';
import App from './App.vue';
import store from './store/index.js';
import router from './router/routes.js';
import logger from './store/modules/logger.js';
import '@/assets/mainStyle.css'; // подключается ОДИН раз (раньше — в каждом компоненте через <style src>)

const BOOT_TIMEOUT = 6000; // мс: дольше не держим пользователя на пустом экране

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('bootstrap timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function bootstrap() {
  const app = createApp(App);
  app.use(store);

  // Ошибки в компонентах/хуках не должны оставаться незамеченными
  app.config.errorHandler = (err, instance, info) => {
    logger.error('[Vue] ошибка в', info, err);
    store.dispatch('log/addError', err);
  };
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('[Promise] необработанный reject:', event.reason);
    store.dispatch('log/addError', event.reason ?? new Error('unhandledrejection'));
  });

  try {
    await store.dispatch('initializeStore');

    // Есть сохранённая сессия — пробуем восстановить её по JWT.
    // Если токена нет, WS поднимется позже (при входе).
    // Если сервер недоступен, сессия сохраняется (auth/resume не разлогинивает
    // при ошибках сети), а WS переподключается в фоне и сам делает resume.
    if (store.state.auth.token) {
      await withTimeout((async () => {
        await store.dispatch('websocket/connect');
        await store.dispatch('auth/resume');
      })(), BOOT_TIMEOUT);
    }
  } catch (e) {
    logger.warn('[MAIN] bootstrap:', e.message);
  } finally {
    // Монтируем в любом случае: роутер сам отправит на /login, если нужно
    app.use(router);
    app.mount('#app');
  }
}

bootstrap();
