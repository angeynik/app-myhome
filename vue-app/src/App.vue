<template>
  <img alt="Vue logo" src="./assets/logo.png">
  <h1>"Это основная страница приложения пользовательского приложения управления Умным домом !!! "</h1>
<hr />
<SetParams />
<!-- <button v-on:click="sendMessage ('Тестируем соединение')"> Send Message </button> -->
<div>
    <button @click="connectWebSocket">Подключиться к WebSocket</button>
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
      reconnectInterval: 2000, // Интервал переподключения в миллисекундах
      setTemp: {
        temp1: 20,
        temp2: 10,
        temp3: 30,
        temp4: 15
      },
      isSending: false
    };
  },
  created() {
    console.log(process.env.MY_SECRET_KEY); // Выведет значение из conf.env
  },
  mounted() {
    this.connectWebSocket();
  },

  beforeUnmount() {
    if (this.socket) {
      this.socket.close();
    }
  },
  methods: {
    connectWebSocket() {
    const host = process.env.VUE_APP_HOST || 'localhost';
    const port = process.env.VUE_APP_PORT || '9202';
      this.socket = new WebSocket(`ws://${host}:${port}`);

      this.socket.onopen = () => {
        console.log(`WebSocket соединение установлено на ${host}:${port}`);
        this.connected = true;
      };

      this.socket.onmessage = async (event) => {
        try {
          const jsomMess = await this.blobToJson(event.data); // Преобразуем Blob в JSON из полученного сообщения
          console.log('Получено сообщение:', jsomMess);
          this.messageFromServer = jsomMess;

          if (jsomMess.type === 'get') {
            console.log(`Получен запрос на значение параметра: ${jsomMess.name}`);
            //const currentValue = GetValue(jsomMess.name);
            //this.sendMessage(GetValue(jsomMess.name));
            this.sendMessage('ответ от GetValue');
          } else if (jsomMess.type === 'set') {
            console.log(`Получен запрос на изменение параметра: ${jsomMess.name}`);
            //const newValue = SetValue(jsomMess.name, jsomMess.value);
            //this.sendMessage(newValue);
            this.sendMessage('ответ от GetValue');
          }
          //this.isSending = false;
          this.sendMessage(this.setTemp.temp1);
        } catch (error) {
          console.error(error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket ошибка:', error);
      };

      this.socket.onclose = () => {
      console.log('WebSocket соединение закрыто. Попытка переподключения через 5 секунд...');
      this.connected = false; // Сбросьте флаг соединения
      setTimeout(() => {
        this.connectWebSocket();
      }, this.reconnectInterval);
    };

    },
  sendMessage(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN && !this.isSending) {
      this.isSending = true;
      this.socket.send(message);
      console.log('Сообщение отправлено:', message);
    } else {
      console.error('Не удалось отправить сообщение: соединение не установлено');
    }
  },
  blobToJson(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const jsonObject = JSON.parse(e.target.result);
        resolve(jsonObject);
      } catch (error) {
        reject('Ошибка при парсинге JSON: ' + error);
      }
    };

    reader.onerror = () => {
      reject('Ошибка при чтении Blob');
    };

    reader.readAsText(blob);
  });
},
GetValue(n) {
  console.log(`Функция GetValue приступила к обработке запроса на получение значения параметра ${n}`);
  var g_value = {type: 'responce', name: n, value: 99};
  return g_value;
},
SetValue(n, v) {
  console.log(`Функция SetValue приступила к обработке запроса на изменение значения параметра ${n}, ${v}`);
  var s_value = {type: 'confirm', name: n, value: true};
  return s_value;
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
