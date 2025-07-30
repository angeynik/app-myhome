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
      msg: 'Welcome to Your Vue.js App',
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
      
      // 3. Только после успешного подключения загружаем конфигурацию
      if (this.$store.getters.isAuthenticated) {
        await this.$store.dispatch('config/initialize');
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

<style lang="css" src="./assets/mainStyle.css"></style>