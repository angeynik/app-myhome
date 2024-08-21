<template>
  <img alt="Vue logo" src="./assets/logo.png">
  <h1>"Это основная страница приложения пользовательского приложения управления Умным домом !!! "</h1>
<hr />
<SetParams />
<button v-on:click="sendMessage ('Тестируем соединение')"> Send Message </button>
<hr />
</template>

<script>
// import { createServer } from 'http';
import { WebSocket } from 'ws';

import SetParams from './components/SetParams.vue';
// onst wss = new WebSocketServer({ port: 9200 });

export default {
  name: 'App',
  components: {
    SetParams
  },
  data: function () {
    return {
      connection: null
    }
  },
  created: function () {
    console.log("Started Connection to WebSocket Node_RED");
    this.connection = new WebSocket("ws://129.47.1.60:1880/dashboard");

    this.connection.onopen = function (event) {
      console.log("Connection established", event);
    }

    this.connection.onmessage = function (event) {
      console.log("Received: %s", event.data);
    }
  },
  methods: {  
    sendMessage: function (message) {
      this.connection.send("Hello, Node-RED !", message);
    }
  },
}
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
