<template>
  <img alt="Vue logo" src="./assets/logo.png">
  <h1>"Это основная страница приложения пользовательского приложения управления Умным домом !!! "</h1>
<hr />
<SetParams />
<!-- <button v-on:click="sendMessage ('Тестируем соединение')"> Send Message </button> -->
<hr />
</template>

<script>
import SetParams from './components/SetParams.vue';
// import WSServer from './websocket.js';

import io from 'socket.io-client';
const socket = io('ws://129.47.1.60:1011');
//const socket = io('ws://localhost:1011');
//const socket = io('http://129.47.1.60:1011');
//const socket = io('http://localhost:1011');
// const socket = io(); // По умолчанию используется localhost:3000

socket.on('connect', () => {
  console.log('Соединение установлено');
});
socket.on("disconnect", () => {
  console.log("Соединение разорвано");
});
socket.send('first mess');

export default {
  name: 'App',
  components: {
    SetParams
  },
//   mounted: function () {
//       WSServer();
//       WSServer.on ('connection', ws => {
//    ws.on ('message', message => {
//        console.log (`Message:  ${message}`); 
//    // Устанавливаем соединение
//    const data = JSON.parse(message);
//         if (data.type === 'requestUuid') {
//         const uuid = '2343545cgreq234';
//         ws.send(JSON.stringify({ uuid }));
//         console.log(`Отправлен UUID: ${uuid}`);
//         }
//    });
//    ws.send ('first mess'); 
// });
//     },
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
