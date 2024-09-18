<template>
  <div class="app">
      <div class="body_l0">
        <MainManu />
      </div>

      <div class="body_l1"> 
            <div class="mainHeader">
              <MainHeader />
            </div>
            <div id="app_mainBody" class="mainBody">
              <MainBody :title="title" />
            </div>
      </div>

  </div>
</template>

<script>
import MainManu from './components/MainManu.vue';
import MainBody from './components/MainBody.vue';
import MainHeader from './components/MainHeader.vue';
export default {
  name: 'App',
  components: {
    MainManu,
    MainBody,
    MainHeader
  },
  data() {
    return {
      title: ' Сообщение передано из App', // Наименование параметра например Гостиная, 1 этаж
      title_type: '', // Тип параметра например Температура
      value_current: 0, // Текущее значение параметра например 20
      value_set: 0, // Ожидаемое значение параметра например 22

      mode_title: '', // Наименование режима работы системы например Охрана, Все дома
      mode_description: '', // Описание режима работы системы, какие функции выполняет, что в себя включает
      mode_selected: '', // Наименование или номер выбранного режима - пользователь в первую очередь увидит текущий выбранный режим
      mode_sorting: '', // Параметр отвечающий за сортировку (последовательность) отображения режимов

// Параметры для управления подключением через ws
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

    connectWebSocket() { // Соединение WebSocket на порту 9202
    const host = process.env.VUE_APP_HOST || 'localhost';
    const port = process.env.VUE_APP_PORT || '9202';

    this.socket = new WebSocket(`ws://${host}:${port}`);
      this.socket.onopen = () => {
        console.log(`WebSocket соединение установлено на ${host}:${port}`);
        this.connected = true; // Устанавливаем флаг соединения
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
      console.log('Сообщение на сервер (WebSocket) отправлено:', message);
    } else {
      console.error('Не удалось отправить сообщение: соединение не установлено');
    }
  },
  blobToJson(blob) { // Функция преобразования Blob в JSON
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
}
</script>

<style>

</style>
