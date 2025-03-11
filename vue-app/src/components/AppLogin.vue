<template>
  <div class="header-bottom">
    <nav>
              <router-link to="/login">Login</router-link> |
              <router-link to="/dashboard">Dashboard</router-link> |
              <router-link to="/smart-home">Smart Home</router-link> |
              <router-link to="/manufact-automatation">Automation</router-link> |
                  <!-- Profile (доступна для level 2 и 3) -->
              <router-link v-if="userLevel >= 2" to="/profile">Profile</router-link>
                  <!-- Users (доступна для level 3) -->
              <router-link v-if="userLevel >= 3" to="/users">Users</router-link>
        </nav>
</div>
<p style="width: 100%; height: 1px; background-color: var(--orange);"> </p>
<div style="padding: 0 10px 0 10px;">
    <h1>Авторизация</h1>
    <form @submit.prevent="login">
      <input v-model="username" type="text" placeholder="Имя пользователя" required />
      <input v-model="password" type="password" placeholder="Пароль" required />
      <button type="submit"> Вход </button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'; 
export default {
  name: 'AppLogin',
    computed: {
    ...mapGetters(['level']), // Получаем уровень доступа из Vuex
    userLevel() {
      console.log('Уровень доступа пользователя:', this.level);
      return this.level || 0; // Если уровень не задан, считаем его равным 0
    },
  },
  data() {
    return {
      username: '',
      password: '',
      error: '',
    };
  },
  methods: {
    async login() {
      try {
        const user = { username: this.username, password: this.password };
        await this.$store.dispatch('login', user); // Авторизация через WebSocket
        const redirectPath = localStorage.getItem('redirectPath') || '/dashboard';
        this.$router.push(redirectPath); // Перенаправляем на защищенный маршрут
      } catch (error) {
        this.error = 'Invalid username or password';
      }
    },
  },
};
</script>

<style scoped>

</style>