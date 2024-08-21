<template>
  <img alt="Vue logo" src="./assets/logo.png">
  <h1>"Это основная страница приложения пользовательского приложения управления Умным домом !!! "</h1>
<hr />
<SetParams />
<!-- <button v-on:click="sendMessage ('Тестируем соединение')"> Send Message </button> -->
<hr />
</template>

<script>

export default {
     data() {
       return {
         socket: null,
         receivedMessage: ''
       };
     },
     created() {
       this.connectWebSocket();
     },
     methods: {
       connectWebSocket() {
        // this.socket = new WebSocket('ws://localhost:1880/ws');
	this.socket = new WebSocket('ws://localhost:8081/ws');
         this.socket.onopen = () => {
           console.log('WebSocket connection established');
         };

         this.socket.onmessage = (event) => {
           this.receivedMessage = event.data;
         };

         this.socket.onclose = () => {
           console.log('WebSocket connection closed');
         };

         this.socket.onerror = (error) => {
           console.error('WebSocket error:', error);
         };
       },
       sendMessage() {
         if (this.socket && this.socket.readyState === WebSocket.OPEN) {
           this.socket.send('Hello from Vue!');
         }
       }
     }
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
