<!-- components/AppLogin.vue -->
<template>
  <div>
    <div class="header-bottom">
      <TopNav />
    </div>
    <p style="width: 100%; height: 1px; background-color: var(--orange);"></p>

    <div style="padding: 0 10px 0 10px;">
      <h1>Авторизация</h1>
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

export default {
  name: 'AppLogin',
  components: { TopNav },

  data() {
    return {
      error: '',
      loading: false,
    };
  },

  computed: {
    userLevel() {
      return this.$store.getters.level;
    },
    dID() {
      return this.$store.getters.dID;
    },
    isConnected() {
      return this.$store.getters['websocket/isConnected'];
    },
  },

  mounted() {
    this.$refs.usernameInput?.focus();
  },

  methods: {
    async login() {
      this.error = '';
      this.loading = true;

      try {
        const username = this.$refs.usernameInput.value.trim().toLowerCase();
        const password = this.$refs.passwordInput.value;

        if (!username || !password) {
          throw new Error('Введите логин и пароль');
        }

        // WS обычно уже поднят в main.js, но после logout/resume может быть закрыт
        if (!this.isConnected) {
          try {
            await this.$store.dispatch('websocket/connect');
          } catch {
            throw new Error('Нет соединения с сервером');
          }
        }

        const userData = await this.$store.dispatch('auth/login', { username, password });
        logger.info('[AppLogin] вход:', userData.username, 'level', this.userLevel, 'dID', this.dID);

        this.showPopup(`Вход выполнен: ${username}`, 'success');

        // App.vue уже смонтирован — его mounted не сработает повторно.
        // Грузим конфиг здесь; best-effort, не блокируем редирект.
        this.$store.dispatch('config/ensureConfig', this.dID).catch((err) => {
          logger.error('[AppLogin] конфиг не загружен:', err);
          this.showPopup('Конфигурация не загружена — часть функций недоступна', 'warning');
        });

        // Приоритет: принудительная смена пароля > redirectPath (из guard) > '/'
        const target = localStorage.getItem('redirectPath') || '/';
        localStorage.removeItem('redirectPath');

        setTimeout(() => this.$router.push(target), 500);
      } catch (err) {
        this.error = this.mapErrorToText(err);
        this.showPopup(`❌ ${this.error}`, 'error');
        logger.error('[AppLogin] ошибка входа:', err);
      } finally {
        this.loading = false;
      }
    },

    mapErrorToText(err) {
      const code = err?.code;
      const msg = err?.message || 'Ошибка авторизации';
      switch (code) {
        case 'BAD_CREDENTIALS': return 'Неверный логин или пароль';
        case 'LOCKED':          return msg; // содержит «Повторите через N сек»
        case 'MISSING_FIELDS':  return 'Введите логин и пароль';
        case 'TIMEOUT':         return 'Сервер не отвечает. Проверьте соединение.';
        default:                return msg;
      }
    },

    /**
     * Показ popup через глобальный store (рендерит App.vue).
     * Если на форме быстро следуют два popup — таймер auto-close
     * второго считается от первого. Для формы логина это некритично:
     * пользователь жмёт OK или ждёт auto-close.
     */
    showPopup(message, type = 'info') {
      this.$store.dispatch('popup/show', {
        message,
        type,
        duration: 6000,
      });
    },
  },
};
</script>

<style scoped>
.error {
  color: red;
  margin-top: 10px;
}
</style>