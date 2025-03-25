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
      //port: process.env.VUE_APP_PORT,
      port: 9202,
      serverPort: process.env.VUE_APP_SERVER_PORT,
    };
  },
  // async mounted() {
  //   try {
  //     await this.$store.dispatch('connectWebSocket'); // Устанавливаем WebSocket-соединение
  //   } catch (error) {
  //     console.error('Ошибка при установке WebSocket-соединения:', error);
  //   }
  // },
 
  async mounted() {
    await this.$store.dispatch('initializeApp'); // Восстанавливаем состояние
    try {
      await this.$store.dispatch('websocket/connect'); // Устанавливаем WebSocket-соединение
    } catch (error) {
      console.error('Ошибка при установке WebSocket-соединения:', error);
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