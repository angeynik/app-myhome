<template>
  <div class="app">
    <header class="mainHeader">
      <div class="icon" @click=this.resetSelection> back </div>
      
      <div><MainHeader :location="location_title" /></div>

      <div class="icon"> menu </div>
    </header>
   

      <div v-if="!selectedComponent" id="app_place" class="mainBody">
        <div class="app-place_body">
        <component :is="AppPlace" />
        <AppPlace class="app-place_module" title="Комнаты" @select="selectComponent('Rooms')" />
        <AppPlace class="app-place_module" title="Параметры" @select="selectComponent('Params')" />
        <AppPlace class="app-place_module"  title="Настройки" @select="selectComponent('MainSettings')" />
        <AppPlace class="app-place_module"  title="Уведомления" @select="selectComponent('MainAlarms')" />
        <AppPlace class="app-place_module"  title="Сценарии" @select="selectComponent('MainScenario')" />
        <AppPlace class="app-place_module"  title="Видео" @select="selectComponent('MainVideo')" />
        <AppPlace class="app-place_module"  title="Статистика" @select="selectComponent('MainStatistic')" />
      </div>
      </div>
      
      <div v-else id="app_component">
        <component :is="selectedComponent" :propsTitle="propsTitle"  @eventsComponent="getEventsComponent" />
      </div>

    <div class="mainFooter"> 
      <MainFooter />
    </div>
  </div>
</template>

<script>
import MainHeader from './components/MainHeader.vue'; 
import MainFooter from './components/MainFooter.vue'; 
import AppPlace from './components/AppPlace.vue'; 
import MainSettings from './components/MainSettings.vue';
import MainInfo from './components/MainInfo.vue';
import MainVideo from './components/MainVideo.vue';
import MainAlarms from './components/MainAlarms.vue';
import MainScenarios from './components/MainScenarios.vue';
import MainStatistic from './components/MainStatistic.vue';

export default { 
  name: 'App', 
  components: { 
    MainHeader, 
    MainFooter, 
    AppPlace, 
    MainSettings,
    MainInfo,
    MainVideo,
    MainAlarms,
    MainScenarios,
    MainStatistic,
  }, 
  data() { 
    return { 
      location_title: '',
      selectedComponent: null, // Состояние для выбранного компонента
      propsTitle: null, // Параметры передаваемые в компонент
  // Передаваемые переменные
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
    CheckMessage(n) {
        // console.log('Получено cообщение:', n);
      if (n.type !== undefined) {
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
      //  window.location.reload();
                break;
              case 'sensors':
                // console.log('Начинаем работу с сообщением с Request = sensors', n);

                this.safeLocalSorage('commonConfig', n);
      // window.location.reload();
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
          } else {
          console.error('App Функция CheckMessage. Тип:', n.type);
          this.sendLogToServer ('error', `App Функция CheckMessage.  Тип: ${n.type}`);
          }
          // console.log(`Функция CheckType приступила к обработке запроса на проверку наличия параметра с именем ${n}`);

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
    sendServerRequest(type, request, name, data)  { //Формируем и оправляем сообщение на сервер
      // console.log ('  APP.vue sendServerRequest - request = ', request, 'data = ', data, 'type = ', type, 'name = ', name);
      let payload = {};
      const Config = localStorage.getItem([data]);
      switch (request) {
        case 'config':
          if (this.WSconnected && !Config) {
            payload = {
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
          break;

          case 'setpoint':
                // console.log (' 2 ---  APP.vue sendServerRequest - request = setpoint" ', data);
                payload = {
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
          break;

        default:
          console.log(`Получено cообщение с неизвестным типом`, request);
          break;
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
              console.log('Создан новый объект комнаты:', roomKey, config);

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
            // console.error('Датчик не найден в конфигурации для комнаты ', roomKey);
            this.sendLogToServer ('error', 'Ошибка поиска ДАТЧИКА в файле конфигурации - датчик соответствующий идентификатору из сообщения Сервера не найден');
          } else {
            sensorKey = Object.keys(message[roomKey].sensors)[0];
              // console.log('sensorKey:', sensorKey); // Логирование sensorKey

              sensorValue = message[roomKey].sensors[sensorKey];
              // console.log('sensorValue:', sensorValue); // Логирование sensorValue
              sensorKeyTime = sensorKey + '_time';
              config[roomKey].sensors[sensorKey] = sensorValue;
              config[roomKey].time[sensorKeyTime] = new Date();
              // console.log('Значение сенсора ', sensorKey, ' обновлено:', config[roomKey].sensors[sensorKey]);
          }

          break;

        default:
          break;
      }
      localStorage.setItem([name], JSON.stringify(config));
      this.localStorageUpdated = true;
      console.log(`Конфигурация -- !!  ${name}  !! --  обновлена в localStorage`, config,  'localStorageUpdated: ', this.localStorageUpdated);
    },
    selectComponent(component) {
      // console.log('selectComponent - ', component);
      if (component === 'Rooms') {
        this.propsTitle = 'rooms';
        this.selectedComponent = 'MainInfo';
        console.log('selectComponent - ', this.selectedComponent, this.propsTitle);
      } else if (component === 'Params') {
        this.propsTitle = 'params';
        this.selectedComponent = 'MainInfo';
        console.log('selectComponent - ', this.selectedComponent, this.propsTitle);
      } else {
        this.selectedComponent = component;
      }
      // console.log('selectComponent - ', this.selectedComponent, this.propsTitle);
    },
    resetSelection() {
      // Возвращаемся к списку компонентов
      this.selectedComponent = null;
    },
    getEventsComponent(event) { // Обработка сообщений из компонентов
      // console.log('App.vue - из компонентов в функцию getEventsComponent получено сообщение - ', event);
      if (event.sendServerRequest) {
        // console.log('App.vue - из компонентов в функцию getEventsComponent получено сообщение - ', event.sendServerRequest);
        this.sendServerRequest(event.sendServerRequest.type, event.sendServerRequest.request, event.sendServerRequest.name, event.sendServerRequest.setpoint);
      }
      if (event.sendLogToServer) {
        // console.log('App.vue - из компонентов в функцию getEventsComponent получено сообщение sendLogToServer - ', event.sendLogToServer);
        this.sendLogToServer(event.sendLogToServer.type, event.sendLogToServer.message);
      }
      if (event.changeTitle && this.selectedComponent === 'MainInfo') {
        console.log('App.vue - из компонентов в функцию getEventsComponent получено сообщение changeTitle - ', event.changeTitle);
        this.location_title = event.changeTitle.title;      
      }
  },

  }
}; 
</script>

<style>
/* Ваши стили */
</style>
