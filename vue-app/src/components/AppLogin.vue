<!-- components/AppLogin.vue -->
<template>
  <div>
    <div class="header-bottom">
      <TopNav />
    </div>
    <p style="width: 100%; height: 1px; background-color: var(--orange);"></p>

    <div style="padding: 0 10px 0 10px;">
      <h1>Авторизация</h1>
      <p v-if="!isConnected" class="warning">Нет соединения с сервером — идёт подключение…</p>
      <form @submit.prevent="login">
        <input
          ref="usernameInput"
          type="text"
          placeholder="Имя пользователя"
          required
          autocomplete="username"
          :disabled="loading"
        />
        <input
          ref="passwordInput"
          type="password"
          placeholder="Пароль"
          required
          autocomplete="current-password"
          :disabled="loading"
        />
        <button type="submit" :disabled="loading">
          {{ loading ? 'Вход…' : 'Вход' }}
        </button>
      </form>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script>
import TopNav from '@/components/TopNav.vue';
import logger from '../store/modules/logger.js';

// Допускаем только внутренние пути ('/foo'), но не '//evil.com' и не 'https://…'
function safeRedirect(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') ? path : '/';
}

export default {
  name: 'AppLogin',
  components: { TopNav },

  data() {
    return {
      error: '',
      loading: false,
      redirectTimer: null,
    };
  },

  computed: {
    // Реактивный флаг (раньше проверялся readyState, который Vue не отслеживает)
    isConnected() {
      return this.$store.getters['websocket/isConnected'];
    },
  },

  mounted() {
    this.$refs.usernameInput?.focus();
  },

  beforeUnmount() {
    clearTimeout(this.redirectTimer);
  },

  methods: {
    async login() {
      if (this.loading) return;
      this.error = '';
      this.loading = true;

      try {
        const username = this.$refs.usernameInput.value.trim().toLowerCase();
        const password = this.$refs.passwordInput.value;
        if (!username || !password) throw new Error('Введите логин и пароль');

        // auth/login сам поднимет соединение при необходимости.
        // Конфигурацию и менеджер уставок загружает App.vue (watch на isAuthenticated).
        const userData = await this.$store.dispatch('auth/login', { username, password });
        logger.info('[AppLogin] вход:', userData.username, 'level', userData.userlevel);

        this.$store.dispatch('popup/show', {
          message: `Вход выполнен: ${userData.username}`,
          type: 'success',
          duration: 2000,
        });

        // Приоритет: принудительная смена пароля > redirectPath (из guard) > '/'
        const target = this.$store.getters['auth/mustChangePassword']
          ? '/change-password'
          : safeRedirect(localStorage.getItem('redirectPath'));
        localStorage.removeItem('redirectPath');

        this.redirectTimer = setTimeout(() => this.$router.push(target), 400);
      } catch (err) {
        this.error = this.mapErrorToText(err);
        logger.error('[AppLogin] ошибка входа:', err);
      } finally {
        this.loading = false;
      }
    },

    mapErrorToText(err) {
      const msg = err?.message || 'Ошибка авторизации';
      switch (err?.code) {
        case 'BAD_CREDENTIALS': return 'Неверный логин или пароль';
        case 'LOCKED':          return msg; // содержит «Повторите через N сек»
        case 'MISSING_FIELDS':  return 'Введите логин и пароль';
        case 'TIMEOUT':         return 'Сервер не отвечает. Проверьте соединение.';
        case 'NO_CONNECTION':   return 'Нет соединения с сервером';
        default:                return msg;
      }
    },
  },
};
</script>

<style scoped>
.error {
  color: red;
  margin-top: 10px;
}
.warning {
  color: var(--orange, #d97706);
}
</style>
