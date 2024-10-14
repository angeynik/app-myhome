<template>
  <div class="app">
            <header class="mainHeader">
              <MainHeader :location="location_title"/>
            </header>

            <!-- Тест SVG  -->
              <!-- <svg display="none">
                <symbol id="iconTelegram" viewBox="0 0 24 24">
                    <path style="fill-rule:evenodd;clip-rule:evenodd;" d="M12,0C5.373,0,0,5.373,0,12s5.373,12,12,12s12-5.373,12-12S18.627,0,12,0z    M17.562,8.161c-0.18,1.897-0.962,6.502-1.359,8.627c-0.168,0.9-0.5,1.201-0.82,1.23c-0.697,0.064-1.226-0.461-1.901-0.903   c-1.056-0.692-1.653-1.123-2.678-1.799c-1.185-0.781-0.417-1.21,0.258-1.911c0.177-0.184,3.247-2.977,3.307-3.23   c0.007-0.032,0.015-0.15-0.056-0.212s-0.174-0.041-0.248-0.024c-0.106,0.024-1.793,1.139-5.062,3.345   c-0.479,0.329-0.913,0.489-1.302,0.481c-0.428-0.009-1.252-0.242-1.865-0.442c-0.751-0.244-1.349-0.374-1.297-0.788   c0.027-0.216,0.324-0.437,0.892-0.663c3.498-1.524,5.831-2.529,6.998-3.015c3.333-1.386,4.025-1.627,4.477-1.635   C17.472,7.214,17.608,7.681,17.562,8.161z"/>
                </symbol>
              </svg>
              <svg class="icon">
                <use href="#iconTelegram"></use>
              </svg> -->

            <div id="app_mainBody" class="mainBody">
              <MainBody :id_item="id_title" />
            </div>
            <!-- <div class="mainFooter"> 
              <MainFooter />
            </div> -->
  </div>
</template>

<script>
// import MainManu from './components/MainManu.vue';
import MainBody from './components/MainBody.vue';
import MainHeader from './components/MainHeader.vue';
// import MainFooter from './components/MainFooter.vue';
export default {
  name: 'App',
  components: {
    // MainManu,
    MainBody,
    MainHeader,
    // MainFooter
  },
  data() {
    return {
  // Компонент BodyValueBlock
      // Передаваемые переменные
      location_title: ' 1 ЭТАЖ ', // Наименование локации (группы помещений) например 1 этаж, Хозяйственные постройки
      id_title: 3, // Храним название ID ПОСЛЕДНЕЙ промсотренной локации например Гостиная, 1 этаж
      title_type: '', // Тип параметра например Температура
      value_current: 0, // Текущее значение параметра например 20
      value_set: 0, // Ожидаемое значение параметра например 22
      value_down: 10, // Минимальное значение параметра например 10
      value_up: 32, // Максимальное значение параметра например 32
      info_status: '', // Переменная помогает видеть статус работы устройств используемых в конкретной локации Norm, Info, Warning, Alarm
      time_period_updated: 0, // Интервал от последнего обновления значения параметра до текущего момента (в секундах) 
      // Принимаемые переменные
      

  // Компонент BodyInformBlock
      mode_title: '', // Наименование режима работы системы например Охрана, Все дома
      mode_season: '', // Cезон работы системы - Зима Лето Межсезонье
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
      testMessage: {
        request: "sensor",
        room03: { sensors: { key3: 'newValue' } },
        type: "post"
      },
      TestConfig: {
        room01: { sensors: { key1: 'value1' } },
        room02: { sensors: { key2: 'value2' } },
        room03: { sensors: { key3: 'value3' } },
        // другие комнаты
      },
      isSending: false
    };
  },
  created() {
        this.sendLogToServer('info', 'Client: Инициализация подключения логирования'); // отправка логов на сервер для сохранения в файл
        localStorage.setItem('flag_commonConfigUpdated', 'false');
  },
  mounted() {
    this.connectWebSocket();
    this.sendConfigRequest();
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.close();
    }
  },
  methods: {

    connectWebSocket() { // Соединение WebSocket на порту 9202
    const host = process.env.VUE_APP_EXT || process.env.VUE_APP_HOST || 'localhost';
    const port = process.env.VUE_APP_PORT || '9202';

    this.socket = new WebSocket(`ws://${host}:${port}`);
      this.socket.onopen = () => {
        console.log(`WebSocket соединение установлено на ${host}:${port}`);
        this.connected = true; // Устанавливаем флаг соединения
        this.sendConfigRequest(); // Отправляем запрос на получение конфигурации
      };

      this.socket.onmessage = async (event) => {
        try {
          const jsomMess = await this.blobToJson(event.data); // Преобразуем Blob в JSON из полученного сообщения
          console.log('Получено сообщение:', jsomMess);
          this.messageFromServer = jsomMess;
          // this.CheckMessage(jsomMess);
          const checkMess = this.CheckMessage(jsomMess);
          console.log('Проверка сообщения: ', checkMess);
          

          // this.isSending = true;
          // if (checkMess) {
          //   this.sendMessage(jsomMess.value);
          // } else {
          //   this.sendMessage('Такого параметра нет');
          // }
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
      console.log('Сообщение на сервер (WS) отправлено:', message);
    } else {
      console.error('Не удалось отправить сообщение: соединение не установлено');
      this.sendLogToServer('error', 'Client: Не удалось отправить сообщение: WS соединение не установлено'); // отправка логов на сервер для сохранения в файл
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
        this.sendLogToServer('error', 'Client: Ошибка при парсинге JSON: ' + error);
      }
    };

    reader.onerror = () => {
      reject('Ошибка при чтении Blob');
      this.sendLogToServer('error', 'Client: Ошибка при чтении Blob');
    };

    reader.readAsText(blob);
  });
},
GetValue(n) {
  console.log(`Функция GetValue приступила к обработке запроса на получение значения параметра ${n}`);
    // const room = n[0];
    // const groop = n[1];
    // const sensor = n[2];
    // console.log('room:', room, 'groop:', groop, 'sensor:', sensor);
  var g_value = {type: 'responce', name: n, value: 99};
  return g_value;
  // return {"room": room, "groop": groop};
},
SetValue(n, v) {
  console.log(`Функция SetValue приступила к обработке запроса на изменение значения параметра ${n}, ${v}`);
  var s_value = {type: 'confirm', name: n, value: true};
  return s_value;
},
CheckMessage(n) {
  if (n.type) {
switch (n.type) {
  case 'post':
    // console.log(`Получено cообщение с типом POST: ${n}`);
    switch (n.request) {
      case 'config':
        if (n.manageConfig) {
          localStorage.setItem('manageConfig', JSON.stringify(n.manageConfig));
          // console.log('Конфигурация "manageConfig" сохранена в localStorage');
          this.sendLogToServer('info', 'Конфигурация "manageConfig" сохранена в localStorage');
        } else if (n.commonConfig) {
          localStorage.setItem('commonConfig', JSON.stringify(n.commonConfig));
          // console.log('Конфигурация "commonConfig" сохранена в localStorage');
          this.sendLogToServer('info', 'Конфигурация "commonConfig" сохранена в localStorage');
        }
        break;
      case 'sensors':
        // console.log('Начинаем работу с сообщением с Request = sensors');

        this.findSensorName(n);

      break;
        default:
        break;
    }
  break;
  case 'get':
    console.log(`Получено cообщение с типом Get: ${n}`);
  break;
    default:
    console.log(`Получено cообщение с неизвестным типом`);
    this.sendLogToServer ('error', 'Получено cообщение с неизвестным типом');
    break;
    }
  } 
  // console.log(`Функция CheckType приступила к обработке запроса на проверку наличия параметра с именем ${n}`);
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

    sendConfigRequest()  { //Проверяем локальные данные о конфигурации системы 
      // console.log('Функция sendConfigRequest приступила к проверке необходимости запроса на получение конфигурации');
      const manageConfig = localStorage.getItem('manageConfig');
      const commonConfig = localStorage.getItem('commonConfig');
      if (this.connected) {
        if (!manageConfig) {
        // console.log('Конфигурация "manageConfig" отсутствует. Отправляем запрос на получение конфигурации');
        const payload = {
          type: 'get',
          request: 'config',
          name: 'manageConfig',
        };
        this.socket.send(JSON.stringify(payload));
        // console.log('Отправлен запрос на получение конфигурации "manageConfig"');
        this.sendLogToServer ('info', 'Конфигурация "manageConfig" отсутствует. Отправляем запрос на получение конфигурации');
      } else {
        console.log('Конфигурация manageConfig существует');
      }
      } else {
    //  console.error('WebSocket соединение не установлено.');
     this.sendLogToServer ('error', 'Конфигурация "commonConfig" отсутствует. WebSocket соединение не установлено.');
      }
      if (this.connected) {
        if (!commonConfig) {
        // console.log('Конфигурация "commonConfig" отсутствует. Отправляем запрос на получение конфигурации');
        const payload = {
          type: 'get',
          request: 'config',
          name: 'commonConfig',
        };
        this.socket.send(JSON.stringify(payload));
        // console.log('Отправлен запрос на получение конфигурации "commonConfig"');
        this.sendLogToServer ('info', 'Конфигурация "commonConfig" отсутствует. Отправляем запрос на получение конфигурации');
      } else {
        console.log('Конфигурация commonConfig существует');
      }
      } else {
      // console.error('WebSocket соединение не установлено.');
      this.sendLogToServer ('error', 'Конфигурация "commonConfig" отсутствует. ');
      }
    },

  findSensorName(message) {
    // Получаем конфигурацию из localStorage
    let config = JSON.parse(localStorage.getItem('commonConfig'));
    const timeUpdated = message.time;
    // console.log('config:', config);

    // Находим ключ комнаты в сообщении
    const roomKey = Object.keys(message).find(key => key.startsWith('room'));
    // console.log('roomKey:', roomKey); // Логирование roomKey

    if (roomKey) {
      // console.log('Комната найдена в конфигурации:', roomKey);

      const sensorKey = Object.keys(message[roomKey].sensors)[0];
      const sensorValue = message[roomKey].sensors[sensorKey];
      
      // console.log('sensorKey:', sensorKey); // Логирование sensorKey
      // console.log('sensorValue:', sensorValue); // Логирование sensorValue

      // Проверяем, существует ли сенсор в конфигурации
      if (config[roomKey] && config[roomKey].sensors && Object.prototype.hasOwnProperty.call(config[roomKey].sensors, sensorKey)) {
        // Обновляем значение сенсора в конфигурации
        config[roomKey].sensors[sensorKey] = sensorValue;
        config[roomKey].time[sensorKey] = timeUpdated;
        // console.log('Значение сенсора обновлено:', config[roomKey].sensors[sensorKey]);

        // Сохраняем обновленную конфигурацию в localStorage
        localStorage.setItem('commonConfig', JSON.stringify(config));
        localStorage.setItem('flag_commonConfigUpdated', 'true');
        const chechValue = JSON.parse(localStorage.getItem('commonConfig'))[roomKey].sensors[sensorKey];
        console.log(`Конфигурация "commonConfig" сохранена в localStorage, commonConfig.${roomKey}.sensors.${sensorKey} = ${chechValue},  commonConfig.${roomKey}.time.${sensorKey} = ${timeUpdated}  localStorage.getItem('flag_commonConfigUpdated') = ${localStorage.getItem('flag_commonConfigUpdated')}`);
        this.sendLogToServer ('info', `Конфигурация "commonConfig" сохранена в localStorage,  commonConfig.${roomKey}.sensors.${sensorKey} = ${chechValue}`);
      } else {
        // console.error('Датчик не найден в конфигурации');
        this.sendLogToServer ('error', 'Ошибка поиска ДАТЧИКА в файле конфигурации - датчик соответствующий идентификатору из сообщения Сервера не найден');
      }
    } else {
      // console.error('Комната не найдена в конфигурации');
      this.sendLogToServer ('error', 'Ошибка поиска КОМНАТЫ в файле конфигурации - комната соответствующая идентификатору из сообщения Сервера не найдена');
    }
  },














  },
}
</script>

<style>

</style>
