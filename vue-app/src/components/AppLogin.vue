<template>
  <div>
    <div class="header-bottom">
      <nav>
        <router-link to="/login">Login</router-link> |
        <router-link to="/dashboard">Dashboard</router-link> |
        <router-link to="/smart-home">Smart Home</router-link> |
        <router-link to="/manufact-automatation">Automation</router-link> |
        <router-link v-if="userLevel >= 2" to="/profile">Profile</router-link>
        <router-link v-if="userLevel >= 3" to="/users">Users</router-link>
      </nav>
    </div>
    <p style="width: 100%; height: 1px; background-color: var(--orange);"></p>
    <div style="padding: 0 10px 0 10px;">
      <h1>Авторизация</h1>
      <form @submit.prevent="login">
        <input ref="usernameInput" type="text" placeholder="Имя пользователя"
               required autocomplete="username" :disabled="loading" />
        <input ref="passwordInput" type="password" placeholder="Пароль"
               required autocomplete="current-password" :disabled="loading" />
        <button type="submit" :disabled="loading">
          {{ loading ? 'Вход…' : 'Вход' }}
        </button>
      </form>
      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <PopupMenu
      :visible="showPopup"
      :message="popupMessage"
      :type="popupType"
      @close="closePopup"
    />
  </div>
</template>

<script>
import PopupMenu from './PopupMenu.vue';
import logger from '../store/modules/logger.js';

export default {
  name: 'AppLogin',
  components: { PopupMenu },
  data() {
    return {
      error: '',
      loading: false,
      showPopup: false,
      popupMessage: '',
      popupType: 'info',
      popupTimeout: null,
      autoCloseDelay: 6000,
    };
  },
  computed: {
    userLevel() { return this.$store.getters.level; },
    dID() { return this.$store.getters.dID; },
    isConnected() { return this.$store.getters['websocket/isConnected']; },
  },
  mounted() {
    this.$refs.usernameInput?.focus();
  },
  beforeUnmount() {
    if (this.popupTimeout) clearTimeout(this.popupTimeout);
  },
  methods: {
    async login() {
      this.error = '';
      this.loading = true;

      try {
        const username = this.$refs.usernameInput.value.trim().toLowerCase();
        const password = this.$refs.passwordInput.value;

        if (!username || !password) throw new Error('Введите логин и пароль');

        // Убедимся, что WS поднят (или поднимем)
        if (!this.isConnected) {
          try { await this.$store.dispatch('websocket/connect'); }
          catch { throw new Error('Нет соединения с сервером'); }
        }

        const userData = await this.$store.dispatch('auth/login', { username, password });
        logger.info('[AppLogin] вход:', userData.username, 'level', this.userLevel, 'dID', this.dID);

        this.showPopupMessage(`Вход выполнен: ${username}`, 'success');

        // Загружаем конфиг (best-effort, не блокируем)
        this.$store.dispatch('config/ensureConfig', this.dID).catch((err) => {
          logger.error('[AppLogin] конфиг не загружен:', err);
          this.showPopupMessage('Конфигурация не загружена — часть функций недоступна', 'warning');
        });

        // Если требуется смена пароля — роутер сам перекинет на /change-password
        // (guard смотрит на auth/mustChangePassword).
        const target = this.$store.getters['auth/mustChangePassword']
          ? '/change-password'
          : (localStorage.getItem('redirectPath') || '/');
        localStorage.removeItem('redirectPath');

        setTimeout(() => this.$router.push(target), 500);
      } catch (err) {
        this.error = this.mapErrorToText(err);
        this.showPopupMessage(`❌ ${this.error}`, 'error');
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

    showPopupMessage(message, type = 'info') {
      this.popupMessage = message;
      this.popupType = type;
      this.showPopup = true;
      if (this.popupTimeout) clearTimeout(this.popupTimeout);
      this.popupTimeout = setTimeout(() => this.closePopup(), this.autoCloseDelay);
    },
    closePopup() {
      this.showPopup = false;
      if (this.popupTimeout) { clearTimeout(this.popupTimeout); this.popupTimeout = null; }
    },
  },
};
</script>

<style scoped>
.error { color: red; margin-top: 10px; }
</style>