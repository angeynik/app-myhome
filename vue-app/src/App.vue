<template>
  
  <div class="app">
    <svg display="none"> // Задаем код для визуализации области скрола для изменения уставки
        <symbol id="arrowRight" 
        viewBox="0 0 34 64"  
        xmlns="http://www.w3.org/2000/svg" 
        stroke="white" 
        width="100%" 
        height="100%" 
        preserveAspectRatio="xMidYMid meet"
        >         
        <line y1="-2" x2="43.0756" y2="-2" transform="matrix(-0.684508 0.729005 -0.684508 -0.729005 30.4863 28.9999)" stroke="#E0DFE7" stroke-width="4"/>
        <line y1="-2" x2="43.0756" y2="-2" transform="matrix(-0.684508 -0.729005 0.684508 -0.729005 33 31.4023)" stroke="#E0DFE7" stroke-width="4"/>
        </symbol>
        <symbol id="arrowLeft" 
        viewBox="0 0 34 64"  
        xmlns="http://www.w3.org/2000/svg" 
        stroke="white" 
        width="100%" 
        height="100%" 
        preserveAspectRatio="xMidYMid meet"
        >         
        <line y1="-2" x2="43.0756" y2="-2" transform="matrix(0.684508 -0.729005 0.684508 0.729005 3.51367 34.4023)" stroke="#E0DFE7" stroke-width="4"/>
        <line y1="-2" x2="43.0756" y2="-2" transform="matrix(0.684508 0.729005 -0.684508 0.729005 1 31.9999)" stroke="#E0DFE7" stroke-width="4"/>
      </symbol>
    </svg>
      <header class="header">

          <div class="icon" @click=this.resetSelection> back </div>
        
          <svg 
          class="header_arrow"
          v-show="showHeaderArrow"
          @click="sortingBack"
          >
            <use href="#arrowLeft"></use>
          </svg>

          <div style="display: flex; justify-content: center; width: 86%;">
            <MainHeader 
            :title="headerTitle"
            :mobile="isMobile" 
          />
          </div>

          <svg 
          class="header_arrow"
          v-show="showHeaderArrow"
          @click="sortingForvard"
          >
            <use href="#arrowRight"></use>
          </svg>

          <div class="icon"> menu </div>
      </header>
   

      <div class="body"
      @touchstart="appTouchStart($event, 'body')" 
      @touchend="appTouchEnd($event, 'body')"
      >

        <div class="app-place_body" v-if="!selectedComponent" id="app_place" >
          <component :is="AppPlace" />
          <AppPlace class="app-place_module" title="Комнаты" @select="selectComponent('Rooms')" />
          <AppPlace class="app-place_module" title="Параметры" @select="selectComponent('Params')" />
          <AppPlace class="app-place_module"  title="Настройки" @select="selectComponent('MainSettings')" />
          <AppPlace class="app-place_module"  title="Уведомления" @select="selectComponent('MainAlarms')" />
          <AppPlace class="app-place_module"  title="Сценарии" @select="selectComponent('MainScenarios')" />
          <AppPlace class="app-place_module"  title="Видео" @select="selectComponent('MainVideo')" />
          <AppPlace class="app-place_module"  title="Статистика" @select="selectComponent('MainStatistic')" />
          <AppPlace class="app-place_module"  title="О продукте" @select="selectComponent('MainCompany')" />
        </div>
    
        <div v-else id="app_component">
          <component
          :is="selectedComponent" 
          :propsTitle="propsTitle"
          :changeSorting="changeSorting" 
          @eventsComponent="getEventsComponent" 
          />
        </div>
      </div>

      <footer class="footer"> 
        <MainFooter v-show="!showSetpoint"/>
        <MainSetpoint
          :setPoint="setpoint" 
          :highLimit="limHigh" 
          :lowLimit="limLow"
          :step="limStep"
          @eventsComponent="getEventsComponent"
          v-show="showSetpoint"/>
      </footer>
  </div>
</template>

<script>
import CheckConfigs from './utils/transformConfigs';
// import CalcTime from './utils/transformConfigs';

import MainHeader from './components/MainHeader.vue';
import MainFooter from './components/MainFooter.vue';
import MainSetpoint from './components/MainSetpoint.vue';
import AppPlace from './components/AppPlace.vue'; 
import MainBody from './components/MainBody.vue';
import MainSettings from './components/MainSettings.vue';
import MainAlarms from './components/MainAlarms.vue';
import MainScenarios from './components/MainScenarios.vue';
import MainVideo from './components/MainVideo.vue';
import MainStatistic from './components/MainStatistic.vue';
import MainCompany from './components/MainCompany.vue';

export default { 
  name: 'App', 
  provide() { 
    return { 
      checkConfigs: new CheckConfigs() 
    }; 
  },

  components: { 
    AppPlace,
    MainBody,
    MainHeader,
    MainFooter,
    MainSettings,
    MainAlarms,
    MainScenarios,
    MainVideo,
    MainStatistic,
    MainCompany,
    MainSetpoint,
  }, 

  data() { 
    return {
      checkConfigs: new CheckConfigs(), // Переменная инициализации класса checkConfigs

  // Ключи и флаги для обмена данными с сервером
      isSending: false, // Флаг разрешения отправки запроса на сервер
      WSconnected: false, // Флаг установленного соединения с сервером по WS
      reconnectInterval: 2000, // Интервал переподключения в миллисекундах
      localStorageUpdated: false, // Флаг обновления конфигурации в localStorage

  // Ключи для работы с устройством Пользователя
      isMobile: false, // Флаг мобильного устройства

  // Ключи для работы c Header - стрелки изменения параметров сортировки
      showHeaderArrow: false, // Флаг отображения стрелок выбора компонентов
      changeSorting: false, // Флаг изменения параметров сортировки (prew - предыдущий компонент, next - следующий компонент)

  // Данные с сервера
      messageFromServer: null, // Сообщение с сервера
      socket: null,
      manageConfig_val:{}, // Сохранение Конфигурации управления
      commonConfig_val:{}, // Сохранение Конфигурации общих параметров

  // Работа с меню выбора компонентов
      showSetpoint: false,
      propsTitle:'',// идентификатор параметра сортировки room или params
      selectedComponent: null, //  Имя выбранного компонента
      headerTitle: "",

  // Работа с тачем для смены параметров сортировки
      touchStartX: 0,
      touchStartTime: 0,
      touchArea: null,

  // Работа с компонентом Setpoint
      setpoint: localStorage.getItem('setpoint') || null,
      limHigh: null,
      limLow: null,
      limStep: null,
      setName: null,

  // Данные о выбранном объекте (id комнаты, id параметра, наименования параметра)
      header_title: '', // переменная для отображения в Header
      room_id: 1, // id выбранной комнаты
      room_key: 'room01', // ключ выбранной комнаты room01 и тд
      room_title: '', // наименование выбранной комнаты Гостинная, Кухня, Спальня, etc

      param_id: 0, // id выбранного параметра (температуры, влажности и т.д.)
      param_key: 'Temp', // ключ выбранного параметра Temp, Hum, Move, etc
      param_title: '', // наименование выбранного параметра Температура, Влажность, etc
      // param_sign: '', // знак единицы измерения (°C, %, мм, м, часы, мин, сек, мсек, мммсек, день, неделя, месяц, год)
      // group: '', // наменование группы параметров

    //Получаем данные из env
      //const host = process.env.VUE_APP_EXT || process.env.VUE_APP_HOST || 'localhost';
      //const host = '192.168.1.88';
      // host: '129.47.1.48',
      // port: '9202', 
      // serverPort: '3010',
      host: process.env.VUE_APP_EXT,
      port: process.env.VUE_APP_PORT,
      serverPort: process.env.VUE_APP_SERVER_PORT,

    }; 
  },
  created() {
        this.sendLogToServer('info', 'Client: Инициализация подключения логирования'); // отправка логов на сервер для сохранения в файл
  },
  mounted() {
    this.connectWebSocket();
    this.checkLocalStorage();
    // localStorage.setItem('flag_commonConfigUpdated', 'false');
    // this.manageConfig_val = JSON.parse(localStorage.getItem('manageConfig'));
    this.commonConfig_val = JSON.parse(localStorage.getItem('commonConfig'));
    this.initApp();
    this.detectDevice();
    //console.log(' --- 144 --- mounted - navigator.userAgent- ', navigator.userAgent);
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.close();
    }
  },
  methods: {
    initApp() {
      this.selectedComponent = null;
      this.headerTitle = 'Главное меню';
      localStorage.setItem('room_id', 1);
      localStorage.setItem('param_key', 'Temp');
      localStorage.setItem('room_key', 'room01');
      this.room_id = localStorage.getItem('room_id');
      this.room_key = localStorage.getItem('room_key');
      this.room_title = localStorage.getItem('room_title');
      this.param_id = localStorage.getItem('param_id');
      this.param_key = localStorage.getItem('param_key');
      this.param_title = localStorage.getItem('param_title');
      localStorage.setItem('isSelectedNum', false); // isSelectedNum - флаг выбора параметра имеющего числовое значение и соответственно Уставку
      this.setpoint = this.getManageValues(localStorage.getItem('room_id'), localStorage.getItem('param_key'));

      //console.log(' --- 165 --- Функция checkMessage - актуальный config из localStorage - ', JSON.parse(localStorage.getItem('commonConfig')));
    },

    connectWebSocket() { // Соединение WebSocket на порту 9202
    console.log('--- connectWebSocket - host - ', this.host, 'port - ', this.port); 

    this.socket = new WebSocket(`ws://${this.host}:${this.port}`);
      this.socket.onopen = () => {
        console.log(`WebSocket соединение установлено на ${this.host}:${this.port}`);
        this.sendLogToServer('info', `WebSocket соединение установлено на ${this.host}:${this.port}`); 
        this.WSconnected = true; // Устанавливаем флаг соединения
        if (this.isSending === true) {
        this.sendServerRequest('get', 'config', 'name','manageConfig');
        this.sendServerRequest('get', 'config', 'name','commonConfig');
        this.sendServerRequest('get', 'config', 'name','directoryConfig');
      } else {
        this.isSending = false;
      }
      };
      this.socket.onmessage = async (event) => {
        try {
          const jsomMess = await this.blobToJson(event.data); // Преобразуем Blob в JSON из полученного сообщения
          console.log('от Server Получено сообщение:', jsomMess);
          this.messageFromServer = jsomMess;
          this.checkMessage(jsomMess);
          
        } catch (error) {
          // console.error(error);
          this.sendLogToServer('error', `WebSocket Ошибка при получении сообщения с сервера ${error}`); 
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket ошибка:', error);
      };

      this.socket.onclose = () => {
      console.error('WebSocket соединение закрыто. Попытка переподключения через 5 секунд...');
      this.WSconnected = false; // Сбросьте флаг соединения
      setTimeout(() => {
        this.connectWebSocket();
      }, this.reconnectInterval);
    };

    },
    checkLocalStorage() { // Проверка наличия конфигурации в localStorage
      const commonData = JSON.parse(localStorage.getItem('commonConfig'));
      const manageData = JSON.parse(localStorage.getItem('manageConfig'));
      const directoryConfig = JSON.parse(localStorage.getItem('directoryConfig'));
      if (!commonData) {
        this.isSending = true;
        this.sendServerRequest('get', 'config', 'name','commonConfig');
      } else if (!manageData) {
        this.isSending = true;
        this.sendServerRequest('get', 'config', 'name','manageConfig');
      } else if (!directoryConfig) {
        this.isSending = true;
        this.sendServerRequest('get', 'config', 'name','directoryConfig');
      } else {
        this.isSending = false;
        //this.findRoom(commonData, localStorage.getItem('room_id'));
      }
    },
    sendMessage(message) { // Отправка сообщения на сервер
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
    checkMessage(n) {
        // console.log(' 1 --- Функция checkMessage - Получено cообщение:', n);
      if (n.type === undefined || n.type === null) {
        console.error('Функция checkMessage (App) По WS получено сообщение с пустым типом:', n);
        this.sendLogToServer ('error', `Функция checkMessage (App) По WS лучено пустое сообщение: ${n.type}`);
      }
      switch (n.type) {
          case 'post':
            console.log(`Получено cообщение с типом POST: ${n.type}`);
            switch (n.request) {
              case 'config':
                if (n.manageConfig) {
                  console.log(' 2 --- Функция checkMessage request = "config" manageConfig ', n.manageConfig);
                  //this.checkConfigs.setManageConfig(n.manageConfig);
                  this.checkConfigs.setConfig(CheckConfigs.manage, n.manageConfig); 

                  localStorage.setItem('manageConfig', JSON.stringify(n.manageConfig));
                  console.log('Конфигурация "manageConfig" сохранена в localStorage');
                  this.sendLogToServer('info', 'Конфигурация "manageConfig" сохранена в checkConfigs и в localStorage');
                } 
                if (n.commonConfig) {
                  console.log(' 2 --- Функция checkMessage request = "config" - commonConfig ', n.commonConfig);
                  //this.checkConfigs.setCommonConfig(n.commonConfig);
                  this.checkConfigs.setConfig(CheckConfigs.common, n.commonConfig); 
                  localStorage.setItem('commonConfig', JSON.stringify(n.commonConfig));
                  this.sensorKeys = this.checkConfigs.getUniqueSensorKeys(n.commonConfig);
                  console.log('Конфигурация "commonConfig" сохранена в localStorage Получен массив параметров:', this.sensorKeys);
                  // this.findRoom(n.commonData, localStorage.getItem('room_id'));
                  //console.log('Обновлено значение headerTitle:', this.headerTitle);
                  this.sendLogToServer('info', 'Конфигурация "commonConfig" сохранена в checkConfigs и в localStorage'); 
                } 
                if (n.directoryConfig) {
                  console.log(' 2 --- Функция checkMessage request = "config" directoryConfig ', n.directoryConfig);
                  this.checkConfigs.setConfig(CheckConfigs.directory, n.directoryConfig); 
      
                  localStorage.setItem('directoryConfig', JSON.stringify(n.directoryConfig));
                  console.log('Конфигурация "directoryConfig" сохранена в localStorage');
                  this.sendLogToServer('info', 'Конфигурация "directoryConfig" сохранена в checkConfigs и в localStorage');
                } else {
                  console.error('Функция checkMessage (App) сообщение полученное по WS имеет неизвестный тип конфигурации', n.request);
                  this.sendLogToServer('error', `Функция checkMessage (App) сообщение полученное по WS имеет неизвестный тип конфигурации ${n.request}`);
                }
               
                break;
              case 'sensors':
                //console.log('2 --- Функция checkMessage (App)-- Начинаем работу с сообщением полученным по WS с сервера  request = sensors, message:', n);

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
            // console.log(`Функция checkMessage (App) По WS Получено cообщение с неизвестным типом`);
            this.sendLogToServer ('error', ` Функция checkMessage (App) По WS Получено cообщение с неизвестным типом ${n.type}`);
            break;
            }
    },
    checkMassageValue (value) { // Проверяем и преобразуем значение переменной 20.5 On Off ??? (при пустом значении)
      //console.log('Функция checkMassageValue приступила к обработке значения:', value);
      if (value === null || value === undefined) {
        this.sendLogToServer('warning', `Функция checkMassageValue  Ошибка попытки проверки значения датчика полученного с сервера для сообщения ${this.messageFromServer} Значения не определено -  ${value} Определяем как ??? `); 
        return '???';
      } else {
          try {
            switch (value) {
                  case true:
                  return 'ON';
                  case false:
                    return 'OFF';
                  default:
                  return parseFloat(value).toFixed(1);
                }
          } catch (error) {
            this.sendLogToServer('error', `Функция checkMassageValue Общая ошибка при обработки значения датчика полученного с сервера ${error}`); 
          }
      }
    },
    async sendLogToServer (type, message) {
      try {
        let payload;
        if (message) {
          payload = { type, message };
          //console.log ('Отправка на сервер лога: ', payload);
        } else {
          payload = { type:'error', message: 'Ошибка отправки - Пустое сообщения'};
          //console.log ('Ошибка отправки - Пустое сообщения' );
        }    
        //await fetch(`http://${process.env.VUE_APP_HOST}:${process.env.VUE_APP_SERVER_PORT}/logs`, {
        console.log (`Путь к серверу ${this.host}:${this.serverPort}/log для отправки на сервер лога`);
        await fetch(`http://${this.host}:${this.serverPort}/log`, {
        //await fetch(`http://localhost:3010/log`, {
          method: 'POST',
          headers: {
          'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
          });
      } catch (error) {
        console.error('Failed to send log to server', error);
      }
    },
    // sendServerRequest
    // type - тип запроса post, get
    // request - причина (заголовок) запроса config, sensors, actuator
    // name - имя переменной 
    // data - значение переменной
    // запрос формируется как {"type": type, "request": request, name: data}  -  пример {"type": "get", "request": "config", "name": "commonConfig"}
    sendServerRequest(type, request, name, data)  { //Формируем и оправляем сообщение на сервер
      console.log ('1 Функция sendServerRequest (App.vue) - request = ', request, 'type = ', type, 'name = ', name, 'data = ', data);
      let payload = {};
      let Config = {};
      switch (request) {
        case 'config':
        Config = JSON.parse(localStorage.getItem([data]));
        //console.log ('--- Конфигурация ', data, ' существует', Config, 'name = ', name);
          if (this.WSconnected && !Config) {
            payload = {
            type: type,
            request: request,
            [name]: data,
            };
            this.sendLogToServer ('info', `Конфигурация ${data} отсутствует. Отправляем запрос на получение конфигурации`);
            this.isSending = true;
            this.sendMessage(JSON.stringify(payload));
            console.info('Функция sendServerRequest (App.vue) Отправка на запроса на получение конфигурации на сервер - ', payload);
            } else if (!this.WSconnected && Config) {
              // console.log('Конфигурация ', data, ' существует');
              this.isSending = false;
            } else {
              this.sendLogToServer ('error', `Проверка конфигурации ${data}. WebSocket соединение НЕ установлено.`);
              this.isSending = true;
            }
          break;

          case 'setpoint':
          //Config = JSON.parse(localStorage.getItem('manageConfig'));
          //console.log ('  --- 447 --- Конфигурация ', data, ' существует', Config, 'name = ', name);
                //console.log (' 2 ---  APP.vue sendServerRequest - request = setpoint" ', data);
                payload = {
                type: type,
                request: request,
                [name]: data,
                id: localStorage.getItem('room_id'),
                title: localStorage.getItem('room_title')
              };
              this.safeLocalSorage('manageConfig', payload);
              console.log (' 7 ---APP.vue sendServerRequest', payload, 'сохранен в localStorage');
              this.isSending = true;
              this.sendMessage(JSON.stringify(payload));
              console.log ('Функция sendServerRequest (App.vue) Отправка на сервер запроса на изменение уставки - "setpoint" ', payload);
          break;

        default:
          console.error(`Получено cообщение с неизвестным типом`, request);
          break;
      }
    },   
    // safeLocalSorage - сохраняем сообщение в localStorage
    safeLocalSorage(name, message) {
      this.localStorageUpdated = false;
      this.messageFromServer = message;
      console.log (' 3 --- Функция safeLocalSorage Получено сообщение - ', name, message);
      // Получаем конфигурацию из localStorage
      let config = JSON.parse(localStorage.getItem([name]));
      //console.log(' 4 --- APP.vue safeLocalSorage Получаем конфигурацию из localStorage ', name, ', config:', config);
      let roomKey, sensorKey, sensorValue, sensorKeyTime;
      const timeUpdated = new Date().toLocaleString();
      switch (name) {
        case 'manageConfig':

        roomKey = localStorage.getItem('room_key');
        sensorKey = 'set' + this.checkConfigs.checkSymbol(localStorage.getItem('param_key'), 0, 'd');

        if (!config[roomKey]) {
          console.error(' 5 --- Конфигурация не найдена в localStorage для ключа:', name);
          //console.log(' Функция safeLocalSorage - config по ключу', roomKey, 'для', name, ':', config[roomKey]);
          // console.log(' APP SafeLocalSorage - id_title:', this.id_title);
          this.sendLogToServer('warning', `Конфигурация не найдена в localStorage для ключа: ${name}`);
          config[roomKey] = {
                setpoint: message[roomKey],
                manage: {},
                time: {},
                title: localStorage.getItem('room_title'),
                id: Number(localStorage.getItem('room_id')),
              };
              //console.log('Создан новый объект комнаты:', config[roomKey]);

              this.sendLogToServer ('info', `Создан новый объект комнаты: ${roomKey}`);
              // localStorage.setItem([name], JSON.stringify(config));
        } else {
          //console.log(' 5 --- Конфигурация найдена в localStorage для ключа:', name, 'roomKey: ', roomKey);
        }
          sensorValue = message[roomKey][sensorKey];
          sensorKeyTime = sensorKey + '_time';
          //console.log('sensorKey:', sensorKey, 'sensorValue:', sensorValue, 'sensorKeyTime:', sensorKeyTime); // Логирование setpointKey
          //console.log(' 6 --- Переходим к сохранению значения в конфигурацию "manageConfig" в localStorage');
          
          config[roomKey].setpoint[sensorKey] = sensorValue;
          config[roomKey].time[sensorKey + '_time'] = timeUpdated;
          //console.log(' 6  --- Конфигурация сохранена в копию localStorage ', config[roomKey]);


          this.sendLogToServer ('info', `Обновили значение Уставки датчика ${sensorKey} в комнате ${roomKey} на ${sensorValue}`);
          break;
        case 'commonConfig':
        roomKey = Object.keys(message).find(key => key.startsWith('room'));
        //console.log(' Функция safeLocalSorage, request = ', name, ' определили roomKey:', roomKey); // Логирование roomKey
          if (!config[roomKey]) {
            console.error('Датчик не найден в конфигурации для комнаты ', roomKey);
            this.sendLogToServer ('error', 'Ошибка поиска ДАТЧИКА в файле конфигурации - датчик соответствующий идентификатору из сообщения Сервера не найден');
          } else {
            sensorKey = Object.keys(message[roomKey].sensors)[0];
            //console.log(' 5 --- Функция safeLocalSorage, request = ', name, ' определили sensorKey: ', sensorKey);
            if (sensorKey === undefined || sensorKey === null) {
              console.error('Функция safeLocalSorage - Ошибка поиска датчика в конфигурации', name,' для комнаты ', roomKey);
            } else {
              //console.log('sensorKey:', sensorKey); // Логирование sensorKey
              sensorValue = this.checkMassageValue(message[roomKey].sensors[sensorKey]);
              //console.log('sensorValue:', sensorValue); // Логирование sensorValue
              sensorKeyTime = sensorKey + '_time';
              config[roomKey].sensors[sensorKey] = sensorValue;
              config[roomKey].time[sensorKeyTime] = new Date();
              // console.log('Значение сенсора ', sensorKey, ' обновлено:', config[roomKey].sensors[sensorKey]);
              this.sendLogToServer ('info', `Значение сенсора ${sensorKey} обновлено на: ${config[roomKey].sensors[sensorKey]}`);
          }
        }
          break;
        default:
          break;
      }
      localStorage.setItem([name], JSON.stringify(config));
      this.localStorageUpdated = true;
console.log(`--- Функция safeLocalSorage (App.vue) - Конфигурация -- !!  ${name}  !! --  обновлена в localStorage`, config,  'localStorageUpdated: ', this.localStorageUpdated);
    },
    selectComponent(component) {
      // console.log('selectComponent - ', component);
      if (component === 'Rooms') {
        this.propsTitle = 'rooms';
        this.selectedComponent = 'MainBody';
        //console.log('selectComponent - ', this.selectedComponent, this.propsTitle);
        this.sendLogToServer('customer', `Меню выбора экрана Выбран: ${this.selectedComponent} - сортировка по Комнатам`);
        this.showHeaderArrow = this.isMobile ? false : true;
      } else if (component === 'Params') {
        this.propsTitle = 'params';
        this.selectedComponent = 'MainBody';
        //console.log('selectComponent - ', this.selectedComponent, this.propsTitle);
        this.sendLogToServer('customer', `Меню выбора экрана Выбран: ${this.selectedComponent} - сортировка по Параметрам`);
        this.showHeaderArrow = this.isMobile ? false : true;
        //console.log('Функция selectComponent - showHeaderArrow  -- ', this.showHeaderArrow, 'isMobile: ', this.isMobile);
      } else {
        this.selectedComponent = component;
        this.sendLogToServer('customer', `Меню выбора экрана Выбран: ${this.selectedComponent}`); 
        this.showHeaderArrow = false;
      }
      // console.log('selectComponent - ', this.selectedComponent, this.propsTitle);
    },
    resetSelection() {
      // Возвращаемся к списку компонентов
      this.selectedComponent = null;
      this.headerTitle = 'Главное меню';
      if (this.selectedComponent !== 'Params' || this.selectedComponent !== 'Rooms') {
        this.showHeaderArrow = false;
      }
      this.sendLogToServer('customer', `Меню выбора экрана сброшено по кнопке Back: ${this.selectedComponent} Пользователь вернулся на основной экран`); 
    },
    detectDevice() {
      // Проверка на мобильное устройство
      this.isMobile = /Mobi|Android/i.test(navigator.userAgent);
      // const mobile = navigator.userAgent.match(/mobile/i);
      // console.log('Используем мобильное устройство: ', !!mobile);
  },
    getManageValues(id_room, paramKey) {
        //console.log(' Функция getManageValues получила параметры room_id = ', id_room , ' и param_key = ', param_key);
      if (id_room === undefined || paramKey === undefined) {
        console.error('App.vue - Функция getManageValues получила пустое значение id_room или param_key');
        this.sendLogToServer ('warning', `Функция getManageValues получила не корректные пееременные id_room = ${id_room} или param_key = ${paramKey} - Значения для Setpoint и Limits НЕ определены `);
        return;
      } 
      try {
        
        // Получаем объект manageConfig из localStorage
      const Mconfig = JSON.parse(localStorage.getItem('manageConfig'));
      if (!Mconfig) {
        console.error('Не удалось получить конфигурацию manageConfig из localStorage');
        return;
      } else {
        //console.log('Функция getManageValues (App.vue) получила конфигурацию "manageConfig" для id - ', id_room, ' получена из localStorage успешно', Mconfig);

        // Значения граничных диапазонов всегда получаем из объекта common в manageConfig
        this.limLow = Mconfig.common.setpoint['limDown'+paramKey];
        this.limHigh = Mconfig.common.setpoint['limUp'+paramKey];
        this.limStep = Mconfig.common.setpoint['limStep'+paramKey];

        this.setName = 'set'+paramKey;
        const roomID = this.getManageValues_checkID(id_room, Mconfig);
        //console.log('roomID = ', roomID, 'setName = ', this.setName, ' lowLimit = ', this.limLow, ' highLimit = ', this.limHigh, ' step = ', this.limStep);
        return Mconfig[roomID].setpoint[this.setName];
      }
      } catch (error) {
        this.sendLogToServer ('error', `В ходе выполнения функции getManageValues для получения Setpoint и Limits возникла ошибка - ${error} - Значения для Setpoint и Limits НЕ определены `);   
      }
      
    },
    getManageValues_checkID(id, arr) {
      //console.log('App - Функция getManageValues_checkID (App) -- Получен массив ', arr);
      //console.log('App - Функция getManageValues_checkID (App) -- Приступили к выполнению функции с параметром id = ', id);
      const num_id = Number(id);
      let room_title = 'common';
      try {
        for (const key in arr) {
          //console.log('Функция getManageValues_checkID (App) -- Перебираем ключи - ', key, ' в массиве - ', arr[key]);
          if (arr[key].id === num_id) {
            //console.log('Функция getManageValues_checkID (App) -- Находим комнату с запрашиваемым ID:', key);
            room_title = key;
            break;
          } 
            //console.log('Функция getManageValues_checkID (App) -- Комната с запрашиваемым ID не найдена возвращаем common');
        } 
        return room_title;
      }
      catch (error) {
        this.sendLogToServer ('error', `Произошла ошибка при определении ключа для получения Setpoint и лемитов - ${error}`);
      }
    },
    sortingBack() {
      const propsTitle = this.propsTitle;
      //console.log('  --- 666 --- Функция sortingForvard (App) -- Параметр propsTitle - ', propsTitle);
      const commonConfig = JSON.parse(localStorage.getItem('commonConfig'));

      if (!propsTitle) {
        console.error('Функция sortingForvard (App) -- propsTitle не определен');
        return;
    }
      if (propsTitle === 'params') {
        //console.log(' Функция sortingBack (App) -- Получен массив ParamKey - ', localStorage.getItem('param_key'));
        if (!this.sensorKeys) {
            this.sensorKeys = this.checkConfigs.getUniqueSensorKeys(JSON.parse(localStorage.getItem('commonConfig')));
        }
        const param_key = this.checkConfigs.checkSymbol(localStorage.getItem('param_key'), 0, 'd');
        const paramKey = this.checkConfigs.updateParamKey(this.sensorKeys, param_key, false);
        const paramTitle = JSON.parse(localStorage.getItem('commonConfig')).room00.info['d' + paramKey];
        this.headerTitle = paramTitle;
        localStorage.setItem('param_key', paramKey);
        localStorage.setItem('param_title', paramTitle);
        this.changeSorting = true;
      } else if (propsTitle === 'rooms') {
        const updatedKey = this.checkConfigs.updateRoomId(commonConfig, Number(localStorage.getItem('room_id')), false);
        //console.log(' -- rooms --Функция sortingBack( (App) -- Обновлены ключи сортировки по Комнатам - ', updatedKey);
        if (!updatedKey) {
            console.error('Функция sortingBack (App) -- Ошибка обновления ключей комнаты при переходе вперед Сортировка - ', propsTitle);
            return;
        }
        this.headerTitle = updatedKey.title;
        localStorage.setItem('room_title', updatedKey.roomTitle);
        localStorage.setItem('room_id', updatedKey.roomId);
        localStorage.setItem('room_key', updatedKey.roomKey);
        this.changeSorting = true;
        //console.log('App - Функция sortingBack (App) -- Обновлены ключи сортировки по Комнатам - ', updatedKey);
      } else {
        console.error(' Функция sortingBack (App) -- Параметр propsTitle не определен', propsTitle); 
      }

    
    },

    sortingForvard() {
    // Проверка значения propsTitle перед началом выполнения функции
    const propsTitle = this.propsTitle;
    //console.log('Функция sortingForvard (App) -- Параметр propsTitle - ', propsTitle);
    const commonConfig = JSON.parse(localStorage.getItem('commonConfig'));
    
    if (!propsTitle) {
        console.error('Функция sortingForvard (App) -- propsTitle не определен');
        return;
    }
    
    if (propsTitle === 'params') {
        //console.log(' -- params --- 758 --- Функция sortingForvard (App) -- Получен массив ParamKey - ', localStorage.getItem('param_key'));
        if (!this.sensorKeys) {
            this.sensorKeys = this.checkConfigs.getUniqueSensorKeys(JSON.parse(localStorage.getItem('commonConfig')));
        }
        const param_key = this.checkConfigs.checkSymbol(localStorage.getItem('param_key'), 0, 'd');
        const paramKey = this.checkConfigs.updateParamKey(this.sensorKeys, param_key, true);
        const paramTitle = JSON.parse(localStorage.getItem('commonConfig')).room00.info['d' + paramKey];
        this.headerTitle = paramTitle;
        localStorage.setItem('param_key', paramKey);
        localStorage.setItem('param_title', paramTitle);
        this.changeSorting = true;
    } else if (propsTitle === 'rooms') {
        const room_id = Number(localStorage.getItem('room_id'));
        //console.log(' --- rooms -- 713 ----  Функция sortingForvard (App) -- Получен ID комнаты - ', room_id);
        const updatedKey = this.checkConfigs.updateRoomId(commonConfig, room_id, true);
        //console.log(' -- rooms --Функция sortingForvard( (App) -- Обновлены ключи сортировки по Комнатам - ', updatedKey);
        if (!updatedKey) {
            console.error('Функция sortingForvard (App) -- Ошибка обновления ключей комнаты при переходе вперед Сортировка - ', propsTitle);
            return;
        }
        this.headerTitle = updatedKey.roomTitle;
        localStorage.setItem('room_title', updatedKey.roomTitle);
        localStorage.setItem('room_id', updatedKey.roomId);
        localStorage.setItem('room_key', updatedKey.roomKey);
        this.changeSorting = true;
    } else {
        console.error('Функция sortingForvard (App) -- Параметр propsTitle не определен корректно', propsTitle);
    }
    },
    appTouchStart(event, area) {
      console.log('Функция appTouchStart (App) из компонентов получено сообщение - ', event, area);
      if (!this.selectedComponent && area !== 'body') {
        return;
      }
      this.touchStartX = event.changedTouches[0].clientX;
      this.touchArea = area;
      this.touchStartTime = new Date().getTime();
    },
    appTouchEnd(event,area) {
      //console.log('App.vue - из компонентов в функцию appTouchEnd получено сообщение - ', area);
      const touchEndTime = new Date().getTime(); // Время окончания тача 
      const touchDuration = touchEndTime - this.touchStartTime;
      if (!this.selectedComponent && area !== 'body' || touchDuration < 600) {
        return;
      }

      if (this.touchArea === area) { 
              const deltaX = event.changedTouches[0].clientX - this.touchStartX;
              if (deltaX > 100) {
                //console.log ('deltaX > 0', deltaX);
                this.sortingForvard();
              } else if (deltaX < -100) {
                //console.log ('deltaX < 0', deltaX);
                this.sortingBack();

            } 
            // else {
            //   console.log('Функция appTouchStart(MainBody) - Недостаточное смещение для смены параметра');
            // }
        } 
        // else {
        //   console.log('Функция appTouchStart(MainBody) - Смещение выполнено за пределами экрана');
        // }
    },

    //   // console.log('MainBody - Функция getPeriodMinutes Начинаем работу с lastTime = ', lastTime);
    //   if (lastTime !== null && lastTime !== undefined) {
    //     try {
    //       const lastDate = new Date(lastTime);
    //       // console.log('MainBody - Функция getPeriodMinutes lastDate = ', lastDate);
    //       const currentDate = new Date();
    //       const timeDifferenceMinutes = Math.floor((currentDate - lastDate) / 60000); // разница в минутах

    //       // const timeDifference = currentDate - lastDate;
    //       // const seconds = Math.floor(timeDifference / 1000);
    //       // const minutes = Math.floor(seconds / 60);
    //       // const hours = Math.floor(minutes / 60);
    //       // console.log(`Прошло времени: ${hours} часов, ${minutes % 60} минут, ${seconds % 60} секунд`);

    //       return timeDifferenceMinutes;
    //     } catch (error) {
    //       console.error('MainBody Функция getPeriodMinutes Ошибка расчета интервала времени', error);
    //       // В компоненте, который вызывает событие
    //      this.$emit('updateState', {
    //         sendLogToServer: 
    //         { type: 'error', 
    //         message: `MainBody Функция getPeriodMinutes Ошибка расчета интервала времени: ${error}` 
    //         }
    //       });
    //       // this.$emit('updateState', {sendLogToServer: ('Error in getPeriodMinutes: ', error)});
    //       // this.sendLogToServer('error', 'Client: Не удалось отправить сообщение: WS соединение не установлено');
    //     }
    //   } else {
    //     console.error('MainBody Функция getPeriodMinutes Значение времени переданное в функцию не определено');
    //       // В компоненте, который вызывает событие
    //      this.$emit('updateState', {
    //       sendLogToServer: 
    //       { type: 'error', 
    //       message: `MainBody Функция getPeriodMinutes Значение времени переданное в функцию не определено: ` 
    //     }
    //     });
    //   }
      
    // },





    // Обработка сообщений из компонентов
    getEventsComponent(event) { // Обработка сообщений из компонентов
      // console.log(' ------ 712 -----В функцию getEventsComponent () получено сообщение - ', event);

      if (event.sendServerRequest) {
        // console.log('App.vue - из компонентов в функцию getEventsComponent получено сообщение - ', event.sendServerRequest);
        this.sendServerRequest(event.sendServerRequest.type, event.sendServerRequest.request, event.sendServerRequest.name, event.sendServerRequest.setpoint);
      }
      if (event.sendLogToServer) {
        // console.log('App.vue - из компонентов в функцию getEventsComponent получено сообщение sendLogToServer - ', event.sendLogToServer);
        this.sendLogToServer(event.sendLogToServer.type, event.sendLogToServer.message);
      }
      if (this.selectedComponent === 'MainBody') {
        //console.log(' --- 806 --- App.vue - из компонентов в функцию getEventsComponent получено сообщение changeTitle - ', event);
          if (event.changeTitle)  {
            try {
              //console.log(' event.changeTitle ', event.changeTitle);
              this.headerTitle = event.changeTitle.message; 
              this.propsTitle = event.changeTitle.type;
              //console.log(' ------ getEventsComponent ------ changeTitle ---- Изменяем значение propsTitle: ', this.propsTitle, 'и headerTitle: ', this.headerTitle); 
            } catch (error) {
              this.sendLogToServer ('warning', `Ошибка ${error} обработки сообщения changeTitle - ${event.changeTitle}`);
            }
          }
          if (event.showSetpoint) {
            //console.log(' -- 731 --- В функцию getEventsComponent получено сообщение showSetpoint - ', event.showSetpoint);
            this.showSetpoint = event.showSetpoint.message;  
            //console.log(' ------ showSetpoint -----------   getEventsComponent  - Изменяем значение: ', this.showSetpoint);
          } if (event.selectedItem) {
            //console.log('App.vue - из компонентов в функцию getEventsComponent получено сообщение selectedItem - ', event.selectedItem);

// Доделать - работа через методы класса checkConfigs
// const {set, name} = this.checkConfigs.find('manageConfig', 'setpoint', event.selectedItem.message);
            const paramKey = this.checkConfigs.checkSymbol(event.selectedItem.message.paramKey, 0, 'd');
            //console.log('Из метода checkConfigs в функцию getEventsComponent получен сообщение param_key - ', paramKey);
            this.setpoint = this.getManageValues(event.selectedItem.message.id, paramKey);

            //console.log('App.vue - из компонентов в функцию getEventsComponent получено сообщение set - ', set, name);
          }
      }
      if (event.newSetPoint) {
        console.log(' ---- Из компонента MainSetpoint в функцию getEventsComponent (App.vue) получено сообщение newSetPoint - ', event.newSetPoint);
          if (event.newSetPoint.message === null || event.newSetPoint.message === undefined) {
          console.error('Попытка обновление Уставки пустым значением  - Функция getEventsComponent получила пустое значение newSetPoint', event.newSetPoint);
        } else {
          this.setpoint = event.newSetPoint.message;
        }
      }
      if (event.updatePermission) {
        console.log('-- 725 --Из компонентов в функцию getEventsComponent получено сообщение updatePermission - ', event.updatePermission);
          try {
            //  const roomId = localStorage.getItem('room_id');
            const roomKey = localStorage.getItem('room_key');
            const paramKey = this.checkConfigs.checkSymbol(localStorage.getItem('param_key'), 0, 'd');
              // console.log('Функция changeSetpoint (App.vue) получили значения Уставки - ', this.setpoint, ' для  - roomId:', roomId, ' - roomKey:', roomKey, ' - paramKey:', paramKey);
            console.log('Функция checkConfigs (App.vue) вернула значение paramKey- ', paramKey);
              
              const data = {
                ['set'+paramKey]: this.setpoint,
              };
              console.log(' --Функция getEventComponent - updatePermition (App.vue) сформированы данные для отправки на сервер - ', data);
              this.sendServerRequest('post', 'setpoint', roomKey, data);
          } catch (error) {
            console.error(`Ошибка ${error} обработки сообщения updatePermission - ${event.updatePermission}`);
          }
      }
      if (event.updatedSorting) {
        //console.log('App.vue - из компонентов в функцию getEventsComponent получено сообщение updatedSorting - ', event.updatedSorting);
        this.changeSorting = false;
      }
    },
    sortingDoubleClick(event) {
      console.log('App.vue - из компонентов в функцию handleDoubleClick получено сообщение - ', event);
    },
    sortingDoubleTouch(event) {
      console.log('App.vue - из компонентов в функцию handleDoubleTouch получено сообщение - ', event);
    },
  }
}; 
</script>

<style>
/* Ваши стили */
</style>
