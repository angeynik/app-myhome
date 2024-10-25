<template>
  <div class="app">
            <header class="mainHeader">
              <MainHeader :location="location_title"/>
            </header>
            <div id="app_mainBody" class="mainBody">
              <MainBody 
              :id_item="id_title"
              :localStorageUpdated="localStorageUpdated"
              @AppNewSetpoint="messageFromMainBody"
              />
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
      mode_security: '', // Сценарий режима безопасность 
      mode_climat: '', // Сценарий режима управления климатом
      mode_season: '', // Cезон работы системы - Зима Лето Межсезонье
      mode_description: '', // Описание режима работы системы, какие функции выполняет, что в себя включает
      mode_selected: '', // Наименование или номер выбранного режима - пользователь в первую очередь увидит текущий выбранный режим
      mode_sorting: '', // Параметр отвечающий за сортировку (последовательность) отображения режимов

// Параметры для управления подключением через ws
      socket: null,
      WSconnected: false,
      messageFromServer: null,
      reconnectInterval: 2000, // Интервал переподключения в миллисекундах
      // setTemp: {
      //   temp1: 20,
      //   temp2: 10,
      //   temp3: 30,
      //   temp4: 15
      // },
      // testMessage: {
      //   request: "sensor",
      //   room03: { sensors: { key3: 'newValue' } },
      //   type: "post"
      // },
      // TestConfig: {
      //   room01: { sensors: { key1: 'value1' } },
      //   room02: { sensors: { key2: 'value2' } },
      //   room03: { sensors: { key3: 'value3' } },
      //   // другие комнаты
      // },
      isSending: true, // Флаг разрешающий отправку данных на сервер
      localStorageUpdated: false, // Флаг обновления конфигурации в localStorage
    };
  },
  created() {
        this.sendLogToServer('info', 'Client: Инициализация подключения логирования'); // отправка логов на сервер для сохранения в файл
        localStorage.setItem('flag_commonConfigUpdated', 'false');
  },
  mounted() {
    this.connectWebSocket();
    // this.sendServerRequest('get', 'config', 'name','manageConfig');
    // this.sendServerRequest('get', 'config', 'name','commonConfig');
    this.id_title = localStorage.getItem('id_title') || 3;
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
        this.WSconnected = true; // Устанавливаем флаг соединения
        if (this.isSending === true) {
        this.sendServerRequest('get', 'config', 'name','manageConfig');
        this.sendServerRequest('get', 'config', 'name','commonConfig');
      } else {
        this.isSending = false;
      }
      };

      this.socket.onmessage = async (event) => {
        try {
          const jsomMess = await this.blobToJson(event.data); // Преобразуем Blob в JSON из полученного сообщения
          // console.log('Получено сообщение:', jsomMess);
          this.messageFromServer = jsomMess;
          this.CheckMessage(jsomMess);
        } catch (error) {
          console.error(error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket ошибка:', error);
      };

      this.socket.onclose = () => {
      console.log('WebSocket соединение закрыто. Попытка переподключения через 5 секунд...');
      this.WSconnected = false; // Сбросьте флаг соединения
      setTimeout(() => {
        this.connectWebSocket();
      }, this.reconnectInterval);
    };

    },
  sendMessage(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.isSending) {
      this.isSending = false;
      this.socket.send(message);

      // console.log('Сообщение на сервер (WS) отправлено:', message);
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
// GetValue(n) {
//   console.log(`Функция GetValue приступила к обработке запроса на получение значения параметра ${n}`);
//     // const room = n[0];
//     // const groop = n[1];
//     // const sensor = n[2];
//     // console.log('room:', room, 'groop:', groop, 'sensor:', sensor);
//   var g_value = {type: 'responce', name: n, value: 99};
//   return g_value;
//   // return {"room": room, "groop": groop};
// },
  messageFromMainBody(n) {
    if (n !== undefined || n !== null) {
      try {
        if (n.setpointUpdate !== undefined) {
          console.log(' Получено сообщение n.setpointUpdate', n.setpointUpdate );
          // console.log(' 1 ---  Компонент APP.vue Функция messageFromMainBody приступила к обработке запроса на изменение значения параметра', n );
          this.id_title = n.id;
          // this.safeLocalSorage('manageConfig', data);
          // console.log('Функция messageFromMainBody: type:', n.type, 'request:', n.request, 'name:', n.name, 'data:', n.setpoint);
          if (n.getConfig !== undefined && n.getConfig === true) {
            this.localStorageUpdated = false;
          } 
          if (n.request === 'setpoint' && n.setpoint !== undefined) {
          this.sendServerRequest(n.type, n.request, n.name, n.setpoint);

          // console.log('messageFromMainBody Завершаем работу функции, проверяем localStorage:', JSON.parse(localStorage.getItem('manageConfig')));
          }
        }
        if (n.getConfig !== undefined) {
          console.log(' Получено сообщение n.getConfig', n.getConfig );
        }
        if (n.sendLogToServer !== undefined) {
          console.log(' Получено сообщение n.sendLogToServer', n.sendLogToServer );
          this.sendLogToServer(n.sendLogToServer.type, n.sendLogToServer.message);
        }
      } catch (error) {
        console.error('App Функция messageFromMainBody. Ошибка обработки сообщения от MainBody: ', error);
      this.sendLogToServer ('error', `App Функция messageFromMainBody. Ошибка обработки сообщения от MainBody: `+ error);
      }
    } else {
      console.error('App Функция messageFromMainBody. Value: undefined');
      this.sendLogToServer ('error', `App Функция messageFromMainBody. Value: undefined`);
    }

  },
  CheckMessage(n) {
  if (n.type) {
    switch (n.type) {
      case 'post':
        // console.log(`Получено cообщение с типом POST: ${n}`);
        switch (n.request) {
          case 'config':
            if (n.manageConfig) {
              // console.log('APP.vue CheckMessage - "config" ', n.manageConfig);
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
            // console.log('Начинаем работу с сообщением с Request = sensors', n);

            this.safeLocalSorage('commonConfig', n);

          break;
            default:
            break;
        }
      break;
      case 'get':
        // console.log(`Получено cообщение с типом Get: ${n}`);
      break;
        default:
        // console.log(`Получено cообщение с неизвестным типом`);
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
      // console.log ('Отправка на сервер лога: ', payload);
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

    sendServerRequest(type, request, name, data)  { //Формируем и оправляем сообщение на сервер
      // console.log ('  APP.vue sendServerRequest - request = ', request, 'data = ', data, 'type = ', type, 'name = ', name);
      if (request === 'config') {
        const Config = localStorage.getItem([data]);
        if (this.WSconnected && !Config) {

          const payload = {
          type: type,
          request: request,
          [name]: data,
          };
          this.sendLogToServer ('info', `Конфигурация ${data} отсутствует. Отправляем запрос на получение конфигурации`);
          this.isSending = true;
          this.sendMessage(JSON.stringify(payload));
          } else if (!this.WSconnected && Config) {
            // console.log('Конфигурация ', data, ' существует');
            this.isSending = false;
          } else {
            this.sendLogToServer ('error', `Проверка конфигурации ${data}. WebSocket соединение НЕ установлено.`);
            this.isSending = true;
          }
          return;
        } else if (request === 'setpoint') {
            // console.log (' 2 ---  APP.vue sendServerRequest - request = setpoint" ', data);
              const payload = {
                type: type,
                request: request,
                [name]: data,
                id: this.id_title,
              };
              this.safeLocalSorage('manageConfig', payload);
              // console.log (' 7 ---APP.vue sendServerRequest', payload, 'сохранен в localStorage');
              this.isSending = true;
              this.sendMessage(JSON.stringify(payload));
              // console.log ('APP.vue sendServerRequest Отправка на сервер - "setpoint" ', payload);
              return;
          } else {
            return;
          }
    },    
   
    safeLocalSorage(name, message) {
      this.localStorageUpdated = false;

    // console.log (' 3 --- входим в функцию  APP.vue safeLocalSorage Получено сообщение - ', name, message);
    // Получаем конфигурацию из localStorage
    let config = JSON.parse(localStorage.getItem([name]));
    // console.log(' 4 --- APP.vue safeLocalSorage Получаем конфигурацию из localStorage ', name, ', config:', config);
    let sensorKey, sensorValue, sensorKeyTime;
    const timeUpdated = new Date().toLocaleString();
    const roomKey = Object.keys(message).find(key => key.startsWith('room'));
    // console.log('safeLocalSorage - roomKey:', roomKey); // Логирование roomKey

      switch (name) {
        case 'manageConfig':
        if (!config[roomKey]) {
          // console.log(' 5 --- Конфигурация не найдена в localStorage для ключа:', name);
          // console.log(' APP SafeLocalSorage - id_title:', this.id_title);
          this.sendLogToServer('info', `Конфигурация не найдена в localStorage для ключа: ${name}`);
          config[roomKey] = {
                setpoint: {},
                manage: {},
                time: {},
                title: '',
                id: message.id,
              };
              // console.log('Создан новый объект комнаты:', roomKey, config);

              // localStorage.setItem([name], JSON.stringify(config));
        } else {
          // console.log(' 5 --- Конфигурация найдена в localStorage для ключа:', name);
        }
          sensorKey = Object.keys(message[roomKey])[0];
          sensorValue = message[roomKey][sensorKey];
          sensorKeyTime = sensorKey + '_time';
          // console.log('sensorKey:', sensorKey, 'sensorValue:', sensorValue, 'sensorKeyTime:', sensorKeyTime); // Логирование setpointKey
          // console.log(' 6 --- Переходим к сохранению значения в конфигурацию "manageConfig" в localStorage');
          config[roomKey].setpoint[sensorKey] = sensorValue;
          config[roomKey].time[sensorKeyTime] = timeUpdated;
          break;
          case 'commonConfig':
          if (!config[roomKey]) {
            // console.error('Датчик не найден в конфигурации');
            this.sendLogToServer ('error', 'Ошибка поиска ДАТЧИКА в файле конфигурации - датчик соответствующий идентификатору из сообщения Сервера не найден');
          } else {
            sensorKey = Object.keys(message[roomKey].sensors)[0];
              // console.log('sensorKey:', sensorKey); // Логирование sensorKey

              sensorValue = message[roomKey].sensors[sensorKey];
              // console.log('sensorValue:', sensorValue); // Логирование sensorValue
              sensorKeyTime = sensorKey + '_time';
              config[roomKey].sensors[sensorKey] = sensorValue;
              config[roomKey].time[sensorKeyTime] = timeUpdated;
              // console.log('Значение сенсора обновлено:', config[roomKey].sensors[sensorKey]);
          }

          break;

        default:
          break;
      }
      localStorage.setItem([name], JSON.stringify(config));
      this.localStorageUpdated = true;
      // console.log(`Конфигурация -- !!  ${name}  !! --  обновлена в localStorage`, config,  'localStorageUpdated: ', this.localStorageUpdated);
    },
    
    

  },
}
</script>

<style>

</style>
