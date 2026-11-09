<template>
  <div class="change-password">
    <h1>Смена пароля</h1>
    <p v-if="forced" class="hint">
      Для продолжения необходимо сменить пароль, выданный администратором.
    </p>
    <form @submit.prevent="submit">
      <input v-model="oldPassword" type="password" placeholder="Текущий пароль"
             required autocomplete="current-password" :disabled="loading" />
      <input v-model="newPassword" type="password" placeholder="Новый пароль (мин. 8 символов)"
             required autocomplete="new-password" :disabled="loading" />
      <input v-model="confirmPassword" type="password" placeholder="Повторите новый пароль"
             required autocomplete="new-password" :disabled="loading" />
      <button type="submit" :disabled="loading">
        {{ loading ? 'Сохраняем…' : 'Сменить пароль' }}
      </button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="success" class="success">Пароль изменён</p>
  </div>
</template>

<script>
import logger from '../store/modules/logger.js';

export default {
  name: 'ChangePassword',
  data() {
    return {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      loading: false,
      error: '',
      success: false,
    };
  },
  computed: {
    forced() { return this.$store.getters['auth/mustChangePassword']; },
  },
  methods: {
    async submit() {
      this.error = '';
      this.success = false;

      if (this.newPassword.length < 8) {
        this.error = 'Новый пароль должен быть не короче 8 символов';
        return;
      }
      if (this.newPassword !== this.confirmPassword) {
        this.error = 'Пароли не совпадают';
        return;
      }
      if (this.newPassword === this.oldPassword) {
        this.error = 'Новый пароль не должен совпадать с текущим';
        return;
      }

      this.loading = true;
      try {
        await this.$store.dispatch('auth/changePassword', {
          oldPassword: this.oldPassword,
          newPassword: this.newPassword,
        });
        this.success = true;
        logger.info('[ChangePassword] пароль успешно изменён');

        // Все поля чистим, идём на главную
        this.oldPassword = this.newPassword = this.confirmPassword = '';
        setTimeout(() => this.$router.push('/'), 600);
      } catch (e) {
        logger.error('[ChangePassword] ошибка:', e);
        const code = e?.code;
        if (code === 'BAD_PASSWORD') this.error = 'Текущий пароль неверен';
        else if (code === 'WEAK_PASSWORD') this.error = e.message || 'Слишком слабый пароль';
        else this.error = e.message || 'Не удалось сменить пароль';
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.change-password { max-width: 420px; margin: 40px auto; padding: 0 16px; }
.hint { color: var(--orange, #d97706); }
.error { color: red; margin-top: 10px; }
.success { color: green; margin-top: 10px; }
input, button { display: block; width: 100%; margin: 8px 0; padding: 10px; }
</style>