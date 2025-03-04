<template>
    <div>
      <h1>Login</h1>
      <form @submit.prevent="userLogin">
        <input type="text" v-model="username" placeholder="Username" required autocomplete="username">
        <input type="password" v-model="password" placeholder="Password" required autocomplete="current-password">
        <button type="submit">Login</button>
      </form>
      <p v-if="authError">Error: {{ authError }}</p>
    </div>
  </template>
  
  <script>
  import { mapActions, mapGetters } from 'vuex';
  
  export default {
    data() {
      return {
        username: '',
        password: ''
      };
    },
    computed: {
      ...mapGetters(['authStatus']),
      authError() {
        return this.authStatus === 'error' ? 'Login failed. Check your credentials.' : '';
      }
    },
    methods: {
      ...mapActions(['login']),
      async userLogin() {
        try {
          const user = {
            username: this.username,
            password: this.password
          };
          console.log('Logging in with:', user); // Логируем данные
          await this.login(user);
  
          // Получаем сохраненный маршрут
          const redirectPath = localStorage.getItem('redirectPath');
          if (redirectPath) {
            localStorage.removeItem('redirectPath'); // Очищаем сохраненный маршрут
            this.$router.push(redirectPath); // Перенаправляем на запрашиваемый маршрут
          } else {
            this.$router.push('/profile'); // Перенаправляем на страницу по умолчанию
          }
        } catch (error) {
          console.error('Login failed:', error.response ? error.response.data : error.message); // Логируем ошибку
        }
      }
    }
  };
  </script>