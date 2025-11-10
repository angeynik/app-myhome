<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      msg: 'Welcome to Your SmartHome App',
      host: process.env.VUE_APP_HOST,
      port: 9202,
      serverPort: process.env.VUE_APP_SERVER_PORT,
    };
  },
 
  async mounted() {
    try {
      // 1. Восстанавливаем сессию из localStorage
      await this.$store.dispatch('initializeStore');
      
      // 2. Устанавливаем WebSocket соединение
      await this.$store.dispatch('websocket/connect');
     
      // // 3. Если пользователь был восстановлен из localStorage, автоматически отправляем логин/пароль
      // if (this.$store.state.auth.user && this.$store.state.auth.user.username) {
      //   const { username, password } = this.$store.state.auth.user;
      //   console.log('Автоматическая отправка учетных данных из localStorage для пользователя:', username, password);
        
      //   // Используем существующий метод login из auth модуля
      //   await this.$store.dispatch('auth/login', { username, password });
      // }

      // 3. Если пользователь был восстановлен из localStorage, автоматически отправляем логин/пароль
      const user = this.$store.state.auth.user;
      if (user && user.username && user.password) {
        console.log('Автоматическая отправка учетных данных из localStorage для пользователя:', user.username);
        
        // Используем существующий метод login из auth модуля
        await this.$store.dispatch('auth/login', { 
          username: user.username, 
          password: user.password 
        });
      } else {
        console.log('Недостаточно данных для автоматического входа:', user);
      }

      // 4. После успешного подключения загружаем конфигурацию
      if (this.$store.getters.isAuthenticated) {
        await this.$store.dispatch('config/initialize');
      }
      if (this.$route.path === '/dashboard') {
        this.$router.push({ name: 'DashboardMain' });
      }
    } catch (error) {
      console.error('Ошибка инициализации приложения:', error);
    }
  },
  
  methods: {
    async sendLogToServer(type, message) {
      await this.$store.dispatch('sendLogToServer', { type, message });
    },
  },
};
</script>

<style lang="css" src="@/assets/mainStyle.css"></style>