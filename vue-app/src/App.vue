<template>
  <img alt="Vue logo" src="./assets/logo.png">
  <h1>"Это основная страница приложения пользовательского приложения управления Умным домом !!! "</h1>
<hr />
<SetParams />
<!-- <button v-on:click="sendMessage ('Тестируем соединение')"> Send Message </button> -->
<div>
    <button @click="connectToWebSocket">Подключиться к WebSocket</button>
    <p v-if="connected">Соединение установлено!</p>
    <p v-if="messageFromServer">Получено сообщение от сервера: {{ messageFromServer }}</p>
  </div>
<hr />
</template>

<script>
// require('dotenv').config({ path: './conf.env' });
export default {
  data() {
    return {
      socket: null,
      connected: false,
      messageFromServer: null,
    };
  },
  created() {
    console.log(process.env.MY_SECRET_KEY); // Выведет значение из conf.env
  },
  methods: {
    connectToWebSocket() {
      this.socket = new WebSocket('ws://localhost:9202'); // Замени на адрес своего сервера

      this.socket.addEventListener('open', (event) => {
        console.log('Соединение установлено');
        this.connected = true;
        this.messageFromServer = event.data;
        this.socket.send('Привет, сервер! Это клиент.', this.messageFromServer);
      });

      this.socket.addEventListener('message', (event) => {
        //const message = JSON.parse(event.data);
        console.log(`Получено сообщение от сервера: ${event}`);
        this.messageFromServer = event;
      });

      this.socket.addEventListener('close', (event) => {
        this.messageFromServer = event.data;
        console.log('Соединение закрыто', this.messageFromServer);
        this.connected = false;
      });

      this.socket.addEventListener('error', (event) => {
        console.error('Произошла ошибка', event);
      });
    },
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
