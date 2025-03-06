<template>
  <div>
    <h1>Login</h1>
    <form @submit.prevent="login">
      <input v-model="username" type="text" placeholder="Username" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script>
export default {
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
.error {
  color: red;
}
</style>