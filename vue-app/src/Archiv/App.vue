<template>
  <div class="app">
    <header class="mainHeader">
      <div class="icon" @click=this.resetSelection> back </div>
      
      <div><MainHeader 
        :location="point_title_name" 
        :location_sign="point_title_sign"
        />
      </div>

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
        <AppPlace class="app-place_module"  title="О продукте" @select="selectComponent('MainCompany')" />
      </div>
      </div>
      
      <div v-else id="app_component">
        <component :is="selectedComponent" :propsTitle="propsTitle"  @eventsComponent="getEventsComponent" />
      </div>

    <div class="mainFooter"> 
      <MainFooter v-show="!showSetpoint"/>
      <BodySetpontBlock 
        :setPoint="setpoint" 
        :highLimit="limHigh" 
        :lowLimit="limLow"
        :step="limStep"
        :secectedComponent="selectedComponent"
        @updateState="changeSetpoint"
        v-show="showSetpoint"/>
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
import BodySetpontBlock from './components/BodySetpontBlock.vue';
import MainCompany from './components/MainCompany.vue';

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
    BodySetpontBlock,
    MainCompany,
  }, 
  data() { 
    return { 
      point_title_name: '', // Тип параметра например Температура
      point_title_sign: '', // Знак параметра например °C
      selectedComponent: null, // Состояние для выбранного компонента
      propsTitle: null, // Параметры передаваемые в компонент
  // Передаваемые переменные
      id_title: 3, // Храним название ID ПОСЛЕДНЕЙ промсотренной локации например Гостиная, 1 этаж
      id_point: 1, // ID текущего датчика
      // title_type: '', 
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

// Параметры для работы с компонентов выбора уставки
      valManageConfig:[],
      key: 'Temp',
      showSetpoint: false, // Показывать или нет блок с установкой значений
      limLow: 8, //Нижняя граница уставки
      limHigh: 32, //Верхняя граница уставки
      limStep: 0.1, //Шаг уставки
      setpoint: localStorage.getItem('setpoint'), // Значение уставки
      newSetValue: 0, // Новое значение уставки (получено с компонента BodySetpontBlock)

    }; 
  },
  created() {
        this.sendLogToServer('info', 'Client: Инициализация подключения логирования'); // отправка логов на сервер для сохранения в файл
        localStorage.setItem('flag_commonConfigUpdated', 'false');
  },
  mounted() {
    this.connectWebSocket();
    this.valManageConfig = JSON.parse(localStorage.getItem('manageConfig'));
    // this.sendServerRequest('get', 'config', 'name','manageConfig');
    // this.sendServerRequest('get', 'config', 'name','commonConfig');
    this.id_title = localStorage.getItem('id_title') || 3;
    this.getManageValues(this.id_title, this.key);
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
      if (event.changeTitle.title !== undefined && this.selectedComponent === 'MainInfo') {
        console.log('App.vue - из компонентов в функцию getEventsComponent получено сообщение changeTitle - ', event);
        this.getInfo(event.changeTitle.title);
        this.point_title_name = event.changeTitle.key;     
      }
      if (event.showSetpoint !== undefined && this.selectedComponent === 'MainInfo') {
        console.log('App.vue - из компонентов в функцию getEventsComponent получено сообщение showSetpoint - ', event.showSetpoint);
        this.showSetpoint = event.showSetpoint;      
      }
  },
  changeSetpoint(newState) {
    if (newState !== null && newState !== undefined) {
      console.log('App.vue - из компонентов в функцию changeSetpoint получено сообщение - ', newState);
      if (newState.newSetPoint !== undefined) this.setpoint = newState.newSetPoint;

      if (newState.updatePermission !== undefined && this.setpoint !== undefined) this.$emit('AppNewSetpoint',{
        setpointUpdate:
      { 
          setpoint: { //Сообщение о изменении Уставки Для каждой группы параметров нужно писать свой разработчик
            [this.setName] : this.setpoint
        }, 
        request: 'setpoint',
        type: 'post', 
        name: this.room_name,
        id: this.id,
        }
      }); 
    } else {
      console.error('App.vue Функция changeSetpoint получила пустое значение setpoint', newState);
    }

  },
  getManageValues(id, name) {
      console.log('App.vue - Приступили к выполнению функции getManageValues с параметром id = ', id , ' и ключем = ', name);
      // Задаем ключи для получения параметров
      this.setName = 'set'+name;
      this.lowName = 'limDown'+name;
      console.log('MainBody Функция getManageValues Получили имя нижней границы lowName  ', this.lowName);
      this.highName = 'limUp'+name;
      this.stepName = 'limStep'+name;
      console.log('set = ', this.setName, ' low = ', this.lowName, ' high = ',  this.highName, ' step = ', this.stepName);

      // Получаем объект manageConfig из localStorage
      const Mconfig = this.valManageConfig;
      console.log('Получили manageConfig из valManageConfig', Mconfig);

      if (!Mconfig) {
        console.error('Не удалось получить конфигурацию manageConfig из localStorage');
        return;
      } else {
        console.log('Конфигурация "manageConfig" для id -', id, ' получена из localStorage успешно', Mconfig);
      }
  
      const roomID = this.getManageValues_checkID(id, Mconfig);
      console.log('roomID = ', roomID);
      // Значения граничных диапазонов всегда получаем из объекта common в manageConfig
      this.limLow = Mconfig.common.setpoint[this.lowName];
      console.log('MainBody Функция getManageValues Обновили значение нижней границы limLow = ', this.limLow);
      this.limHigh = Mconfig.common.setpoint[this.highName];
      this.limStep = Mconfig.common.setpoint[this.stepName];


      console.log('roomID = ', roomID, 'setPoint = ', this.setpoint, ' lowLimit = ', this.lowLimit, ' highLimit = ', this.highLimit, ' step = ', this.step);

      // Устанавливаем setPoint для найденного или дефолтного roomID
 
      if (roomID !== 'common') {
        this.stateInfo = 1;
      } else {
        this.stateInfo = 0;
      }
      // console.log('Определяем флаг StateInfo = ', this.stateInfo);
        return Mconfig[roomID].setpoint[this.setName];
    },
    getManageValues_checkID(id, arr) {
      // console.log(' getManageValues_checkID  --- Приступили к выполнению функции getManageValues_checkID с параметром id = ', id);
      let room = 'common';
      for (const key in arr) {
      if (arr[key].id === id) {
        room = key;
        this.stateSetpoint = 1;
        // console.log(' getManageValues_checkID --- Найдена комната с запрашиваемым ID:', room);
        break;
      }
      }
      if (room === 'common') {
        this.stateSetpoint = 0;
        // console.log(' getManageValues_checkID --- Комната с запрашиваемым ID не найдена', room);
      }
      return room;

    },

    getInfo (value) { // Получаем тип датчика по его наименованию
      // console.log('MainBody.vue - Приступили к выполнению функции getInfo с параметром value = ', value);
      if (value.includes('Temp')) {
        this.point_title_name = 'Температура';
        this.point_title_sign = '°C';
        this.showSetpoint = true;
        return 'Temp';
      } else if (value.includes('Hum')) {
        this.point_title_name = 'Влажность';
        this.point_title_sign = '%';
        this.showSetpoint = true;
        return 'Hum';
      } else if (value.includes('Lum')) {
        this.point_title_name = 'Освещенность';
        this.point_title_sign = 'lum';
        this.showSetpoint = false;
        return 'Lum';
      } else if (value.includes('Pres')) {
        this.point_title_name = 'Давление';
        this.point_title_sign = 'hPa';
        this.showSetpoint = false;
        return 'Pres';
      } else if (value.includes('Noise')) {
        this.point_title_name = 'Уровень шума';
        this.point_title_sign = 'dB';
        this.showSetpoint = false;
        return 'Noise';
      } else if (value.includes('Co2')) {
        this.point_title_name = 'CO2';
        this.point_title_sign = 'ppm';
        this.showSetpoint = true;
        return 'CO2';
      } else if (value.includes('Voc')) {
        this.point_title_name = 'VOC';
        this.point_title_sign = 'ppb';
        this.showSetpoint = false;
        return 'Voc';
      } else if (value.includes('Mov')) {
        this.point_title_name = 'Движение';
        this.point_title_sign = 'on/off';
        this.showSetpoint = false;
        return 'Mov';
      } else if (value.includes('Bat')) {
        this.point_title_name = 'Напряжение батареи';
        this.point_title_sign = 'V';
        this.showSetpoint = false;
        return 'Bat';
      } else if (value.includes('Switch')) {
        this.point_title_name = 'Переключатель';
        this.point_title_sign = 'on/off';
        this.showSetpoint = false;
        return 'Switch';
      } else if (value.includes('Relay')) {
        this.point_title_name = 'Реле';
        this.point_title_sign = 'on/off';
        this.showSetpoint = false;
        return 'Relay';
      } else if (value.includes('Power')) {
        this.point_title_name = 'Розетка';
        this.point_title_sign = 'on/off';
        this.showSetpoint = false;
        return 'Power';
      } else if (value.includes('Dimmer')) {
        this.point_title_name = 'Контроллер';
        this.point_title_sign = 'on/off';
        this.showSetpoint = false;
        return 'Dimmer';
      } else if (value.includes('Fire')) {
        this.point_title_name = 'Пожар';
        this.point_title_sign = 'on/off';
        this.showSetpoint = false;
        return 'Fire';
      } else if (value.includes('Leak')) {
        this.point_title_name = 'Протечка';
        this.point_title_sign = 'on/off';
        this.showSetpoint = false;
        return 'Leak';
      } else if (value.includes('Smoke')) {
        this.point_title_name = 'Дым';
        this.point_title_sign = 'on/off';
        this.showSetpoint = false;
        return 'Smoke';
      } else {
        this.point_title_name = 'Неизвестное';
        this.point_title_sign = '?';
        this.showSetpoint = false;
        return 'Unknown';
      }
    },
    checkLength(Point, Point_length) {
      // console.log('checkLength Начинаем проверку для ID', Point, ' ID_length = ', Point_length);
      if (Point > Point_length) {
        // console.log('Переходим в начало списка');
        return 1;
      } if (Point < 1) {
        // console.log('Переходим в конец списка');
        return Point_length;
      } else {
        // console.log('ID в диапазоне возвращаем Point = ', Point);
        return Point;
      }
    },
    getPeriodMinutes(lastTime) {
      // console.log('MainBody - Функция getPeriodMinutes Начинаем работу с lastTime = ', lastTime);
      if (lastTime !== null && lastTime !== undefined) {
        try {
          const lastDate = new Date(lastTime);
          // console.log('MainBody - Функция getPeriodMinutes lastDate = ', lastDate);
          const currentDate = new Date();
          const timeDifferenceMinutes = Math.floor((currentDate - lastDate) / 60000); // разница в минутах

          // const timeDifference = currentDate - lastDate;
          // const seconds = Math.floor(timeDifference / 1000);
          // const minutes = Math.floor(seconds / 60);
          // const hours = Math.floor(minutes / 60);
          // console.log(`Прошло времени: ${hours} часов, ${minutes % 60} минут, ${seconds % 60} секунд`);

          return timeDifferenceMinutes;
        } catch (error) {
          console.error('MainBody Функция getPeriodMinutes Ошибка расчета интервала времени', error);
          // В компоненте, который вызывает событие
         this.$emit('updateState', {
            sendLogToServer: 
            { type: 'error', 
            message: `MainBody Функция getPeriodMinutes Ошибка расчета интервала времени: ${error}` 
            }
          });
          // this.$emit('updateState', {sendLogToServer: ('Error in getPeriodMinutes: ', error)});
          // this.sendLogToServer('error', 'Client: Не удалось отправить сообщение: WS соединение не установлено');
        }
      } else {
        console.error('MainBody Функция getPeriodMinutes Значение времени переданное в функцию не определено');
          // В компоненте, который вызывает событие
         this.$emit('updateState', {
          sendLogToServer: 
          { type: 'error', 
          message: `MainBody Функция getPeriodMinutes Значение времени переданное в функцию не определено: ` 
        }
        });
      }
      
    },

  }
}; 
</script>

<style>
/* Ваши стили */
</style>
