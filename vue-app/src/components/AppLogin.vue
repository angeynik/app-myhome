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
        <input ref="usernameInput" 
               type="text" 
               placeholder="Имя пользователя" 
               required 
               autocomplete="username" />
        <input ref="passwordInput" 
               type="password" 
               placeholder="Пароль" 
               required 
               autocomplete="current-password" />
        <button type="submit">Вход</button>
      </form>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppLogin',
  data() {
    return {
      error: '',
      loading: false
    };
  },
  computed: {
    userLevel() {
      return this.$store.getters.level;
    },
    dID() {
      return this.$store.getters.dID;
    }
  },
  mounted() {
    this.$refs.usernameInput?.focus();
  },
  methods: {
    async login() {
      this.error = '';
      this.loading = true;
      
      try {
        const username = this.$refs.usernameInput.value.toLowerCase();
        const password = this.$refs.passwordInput.value;

        if (!username || !password) {
          throw new Error('Имя пользователя и пароль обязательны');
        }

        console.log('Попытка входа для пользователя:', username);
        
        // Проверяем состояние WebSocket
        const isConnected = this.$store.getters.isConnected;
        console.log('WebSocket connected:', isConnected);
        
        if (!isConnected) {
          throw new Error('WebSocket не подключен');
        }

        const userData = await this.$store.dispatch('auth/login', { 
          username, 
          password 
        });

        console.log('Текущий уровень после логина:', this.$store.getters.level);
        console.log('Текущий dID после логина:', this.$store.getters.dID);

        if (userData) {
          // Добавляем проверку конфигурации
          try {
            await this.$store.dispatch('config/ensureConfig', this.dID);
          } catch (err) {
            console.error('Ошибка при загрузке конфигурации:', err);
            alert('⚠️ Конфигурация не загружена! Некоторые функции могут работать некорректно');
          }

          alert(`✅ Вход для Пользователя ${username} прошел успешно!\n Уровень доступа ${this.$store.getters.level}`);
          
          const redirectPath = localStorage.getItem('redirectPath') || '/';
          localStorage.removeItem('redirectPath');
          this.$router.push(redirectPath);
        } else {
          console.log('❌ Проблемы авторизации в AppLogin.vue');
        }
      } catch (err) {
        this.error = err.message || 'Ошибка авторизации';
        alert('❌ Ошибка авторизации Пользователя!');
        console.error('Ошибка входа:', err);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.error {
  color: red;
  margin-top: 10px;
}
</style>