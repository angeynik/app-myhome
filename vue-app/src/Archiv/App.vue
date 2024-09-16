<template>
  <img alt="Vue logo" src="./assets/logo.png">
  <div id="app_setparams"> <SetParams /> </div>
  <!-- <div style="width: 110%; height: 200px">
    <SetParams />
  </div> -->
  <h1>"Это основная страница приложения пользовательского приложения управления Умным домом !!! "</h1>
<hr />
<!-- <button v-on:click="sendMessage ('Тестируем соединение')"> Send Message </button> -->
 <div id="id_sensor">
  <SensorValue />
 </div>
<div>
    <button @click="connectWebSocket">Подключиться к WebSocket</button>
    <p v-if="connected">Соединение установлено!</p>
    <p v-if="messageFromServer">Получено сообщение от сервера: {{ messageFromServer }}</p>
    <button @click="sendLogToServer('info', 'Тестирование сервиса отправки лога INFO с Клиента на Сервер')">INFO</button>
    <button @click="sendLogToServer('error', 'Тестирование сервиса отправки лога ERROR с Клиента на Сервер')">ERROR</button>
    <button @click="sendLogToServer('warn', 'Тестирование сервиса отправки лога WARNING с Клиента на Сервер')">WARNING</button>
    <button @click="sendLogToServer('fatal', 'Тестирование сервиса отправки лога FATAL с Клиента на Сервер')">FATAL</button>
    <button @click="sendLogToServer('new', 'Тестирование сервиса отправки НЕ определенного лога с Клиента на Сервер')">НЕ определен</button>
</div>

<hr />
</template>

<script>
import SetParams from './components/SetParams.vue';
import SensorValue from './components/SensorValue.vue';

export default {
  name: 'app',
  components: {
    SetParams,
    SensorValue
  },
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
        this.sendLogToServer('info', 'Инициализация подключения логирования'); // отправка логов на сервер для сохранения в файл
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
          const checkMess = this.CheckName(jsomMess.name);
          console.log('Проверка имени: ', checkMess);
          this.isSending = true;
          if (checkMess) {
            this.sendMessage(jsomMess.value);
          } else {
            this.sendMessage('Такого параметра нет');
          }
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
      this.isSending = false;
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
CheckName(n) {
  console.log(`Функция CheckName приступила к обработке запроса на проверку наличия параметра с именем ${n}`);
  const c_name = false;
  return c_name;
},
async sendLogToServer (type, message) {
  try {
    let payload;
    if (message) {
      payload = { type, message };
      console.log ('Отправка на сервер лога: ', payload);
    } else {
      payload = { type:'error', message: 'Ошибка отправки - Пустое сообщения'};
      console.log ('Ошибка отправки - Пустое сообщения' );
    }    
    //await fetch(`http://${process.env.VUE_APP_HOST}:${process.env.VUE_APP_SERVER_PORT}/logs`, {
    await fetch('http://localhost:3010/log', {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
      });
  } catch (error) {
    this.$log.error('Failed to send log to server', error);
  }
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
