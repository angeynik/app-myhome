<template>
  <div class="app">
      <header class="header">

          <div class="icon" @click=this.resetSelection> back </div>
          
          <div style="display: flex; justify-content: center; width: 80%;">
            <MainHeader 
            :title="headerTitle" 
          />
          </div>

          <div class="icon"> menu </div>
      </header>
   

      <div class="body">

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
          @updateState="changeSetpoint"
          v-show="showSetpoint"/>
      </footer>
  </div>
</template>

<script>
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
  // Ключи и флаги для обмена данными с сервером
      isSending: false, // Флаг разрешения отправки запроса на сервер
      WSconnected: false, // Флаг установленного соединения с сервером по WS
      reconnectInterval: 2000, // Интервал переподключения в миллисекундах
      localStorageUpdated: false, // Флаг обновления конфигурации в localStorage

  // Ключи для работы с устройством Пользователя
      isMobile: false, // Флаг мобильного устройства

  // Данные с сервера
      messageFromServer: null, // Сообщение с сервера
      socket: null,
      manageConfig_val:{}, // Сохранение Конфигурации управления
      commonConfig_val:{}, // Сохранение Конфигурации общих параметров

  // Работа с меню выбора компонентов
      showSetpoint: true,
      propsTitle:'',// идентификатор параметра сортировки room или params
      selectedComponent: null, //  Имя выбранного компонента
      headerTitle: "",

  // Работа с компонентом Setpoint
      setpoint: localStorage.getItem('setpoint') || null,
      limHigh: null,
      limLow: null,
      limStep: null,
      setName: null,

  // Данные о выбранном объекте (id комнаты, id параметра, наименования параметра)
      header_title: '', // переменная для отображения в Header
      room_id: localStorage.getItem('room_id') || 1, // id выбранной комнаты
      room_key: localStorage.getItem('room_key') || 'room01', // ключ выбранной комнаты room01 и тд
      room_title: localStorage.getItem('room_title') || '', // наименование выбранной комнаты Гостинная, Кухня, Спальня, etc

      param_id: localStorage.getItem('param_id') || 0, // id выбранного параметра (температуры, влажности и т.д.)
      param_key: localStorage.getItem('param_key') || 'Temp', // ключ выбранного параметра Temp, Hum, Move, etc
      param_title: localStorage.getItem('param_title') || '', // наименование выбранного параметра Температура, Влажность, etc
      // param_sign: '', // знак единицы измерения (°C, %, мм, м, часы, мин, сек, мсек, мммсек, день, неделя, месяц, год)
      // group: '', // наменование группы параметров

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
      localStorage.setItem('room_key', localStorage.getItem('room_key') || 'room01');
      this.setpoint = this.getManageValues(localStorage.getItem('room_id'), localStorage.getItem('param_key'));
    },
    findRoom (config, id) {
      // console.log('Функция findRoom (App) config - ', config);
      const n = Number(id); // Преобразуем строку в число
      // const length = Object.keys(config).length;
      // console.log('Функция findRoom (App) id - ', n);
        for (let room in config) {
          // console.log('Функция findRoom (App)  Перебор ключей - ', room);
            if (config[room].id === n) {
              // console.log('Функция findRoom (App)  Ключ найден - ', room);
                localStorage.setItem('room_key', room);
                localStorage.setItem('room_title', config[room].title);
                // console.log('Функция findRoom (App)  - room - ', room, 'title - ',config[room].title);
                return room;
            } else {
              console.error('Функция findRoom (App)  Ключ -', id, ' не найден для - ', config[room].id);
            }
        }
    },
    connectWebSocket() { // Соединение WebSocket на порту 9202
    const host = process.env.VUE_APP_EXT || process.env.VUE_APP_HOST || 'localhost';
    const port = process.env.VUE_APP_PORT || '9202';

    this.socket = new WebSocket(`ws://${host}:${port}`);
      this.socket.onopen = () => {
        // console.log(`WebSocket соединение установлено на ${host}:${port}`);
        this.sendLogToServer('info', `WebSocket соединение установлено на ${host}:${port}`); 
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
          // console.error(error);
          this.sendLogToServer('error', `WebSocket Ошибка при получении сообщения с сервера ${error}`); 
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
    checkLocalStorage() { // Проверка наличия конфигурации в localStorage
      const commonData = JSON.parse(localStorage.getItem('commonConfig'));
      const manageData = JSON.parse(localStorage.getItem('manageConfig'));
      if (!commonData) {
        this.isSending = true;
        this.sendServerRequest('get', 'config', 'name','commonConfig');
      } else if (!manageData) {
        this.isSending = true;
        this.sendServerRequest('get', 'config', 'name','manageConfig');
      } else {
        this.isSending = false;
        this.findRoom(commonData, localStorage.getItem('room_id'));
      }
    },
    sendMessage(message) { // Отправка сообщения на сервер
      if (this.socket && this.socket.readyState === WebSocket.OPEN && this.isSending) {
        this.isSending = false;
        this.socket.send(message);
        // console.log('Сообщение на сервер (WS) отправлено:', message);
      } else {
        // console.error('Не удалось отправить сообщение: соединение не установлено');
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
                  // this.findRoom(n.commonData, localStorage.getItem('room_id'));
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
    checkMassageValue (value) { // Проверяем и преобразуем значение переменной 20.5 On Off ??? (при пустом значении)
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
      console.log ('1 ---  APP.vue sendServerRequest - request = ', request, 'data = ', data, 'type = ', type, 'name = ', name);
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
                console.log (' 2 ---  APP.vue sendServerRequest - request = setpoint" ', data);
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
      this.messageFromServer = message;
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
          this.sendLogToServer('warning', `Конфигурация не найдена в localStorage для ключа: ${name}`);
          config[roomKey] = {
                setpoint: {},
                manage: {},
                time: {},
                title: '',
                id: message.id,
              };
              // console.log('Создан новый объект комнаты:', roomKey, config);
              this.sendLogToServer ('info', `Создан новый объект комнаты: ${roomKey}`);
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
          this.sendLogToServer ('info', `Обновили значение Уставки датчика ${sensorKey} в комнате ${roomKey} на ${sensorValue}`);
          break;
        case 'commonConfig':
          if (!config[roomKey]) {
            // console.error('Датчик не найден в конфигурации для комнаты ', roomKey);
            this.sendLogToServer ('error', 'Ошибка поиска ДАТЧИКА в файле конфигурации - датчик соответствующий идентификатору из сообщения Сервера не найден');
          } else {
            sensorKey = Object.keys(message[roomKey].sensors)[0];
              // console.log('sensorKey:', sensorKey); // Логирование sensorKey
              sensorValue = this.checkMassageValue(message[roomKey].sensors[sensorKey]);
              // console.log('sensorValue:', sensorValue); // Логирование sensorValue
              sensorKeyTime = sensorKey + '_time';
              config[roomKey].sensors[sensorKey] = sensorValue;
              config[roomKey].time[sensorKeyTime] = new Date();
              // console.log('Значение сенсора ', sensorKey, ' обновлено:', config[roomKey].sensors[sensorKey]);
              this.sendLogToServer ('info', `Значение сенсора ${sensorKey} обновлено на: ${config[roomKey].sensors[sensorKey]}`);
          }

          break;

        default:
          break;
      }
      localStorage.setItem([name], JSON.stringify(config));
      this.localStorageUpdated = true;
// console.log(`Конфигурация -- !!  ${name}  !! --  обновлена в localStorage`, config,  'localStorageUpdated: ', this.localStorageUpdated);
    },
    selectComponent(component) {
      // console.log('selectComponent - ', component);
      if (component === 'Rooms') {
        this.propsTitle = 'rooms';
        this.selectedComponent = 'MainBody';
        console.log('selectComponent - ', this.selectedComponent, this.propsTitle);
        this.sendLogToServer('customer', `Меню выбора экрана Выбран: ${this.selectedComponent} - сортировка по Комнатам`); 
      } else if (component === 'Params') {
        this.propsTitle = 'params';
        this.selectedComponent = 'MainBody';
        console.log('selectComponent - ', this.selectedComponent, this.propsTitle);
        this.sendLogToServer('customer', `Меню выбора экрана Выбран: ${this.selectedComponent} - сортировка по Параметрам`); 
      } else {
        this.selectedComponent = component;
        this.sendLogToServer('customer', `Меню выбора экрана Выбран: ${this.selectedComponent}`); 
      }

      // console.log('selectComponent - ', this.selectedComponent, this.propsTitle);
    },
    resetSelection() {
      // Возвращаемся к списку компонентов
      this.selectedComponent = null;
      this.headerTitle = 'Главное меню';
      this.sendLogToServer('customer', `Меню выбора экрана сброшено по кнопке Back: ${this.selectedComponent} Пользователь вернулся на основной экран`); 
    },
    detectDevice() {
      // Проверка на мобильное устройство
      this.isMobile = /Mobi|Android/i.test(navigator.userAgent);
      // console.log('Используем мобильное устройство: ', this.isMobile);
  },



  changeSetpoint(newState) {
    console.log('App.vue - из компонентов в функцию changeSetpoint получено сообщение - ', newState);
    if (newState === null || newState.newSetPoint === undefined) {
      console.error('App.vue Функция changeSetpoint получила пустое значение setpoint', newState.newSetPoint);
      this.sendLogToServer('warning', 'App.vue Функция changeSetpoint получила пустое значение setpoint для параметра ${this.setName}');
      return;
    } else {
      try {
        console.log('App.vue Функция changeSetpoint получила значение setpoint - ', newState.newSetPoint);
        this.setpoint = newState.newSetPoint;
    // Отправляем на сервер сообщение вида {type, request, name, data}
    // type - тип сообщения, request - название функции, name - имя комнаты (room00), data - данные вида {setTemp: 22}
        const name = 'set'+localStorage.getItem('param_key');
        const data = {[name]: newState.newSetPoint};
        this.sendServerRequest('post', 'setpoint', localStorage.getItem('room_key'), data);
  // const TEST = {
  //       setpointUpdate:
  //     { 
  //         setpoint: { //Сообщение о изменении Уставки Для каждой группы параметров нужно писать свой разработчик
  //           [this.setName] : this.setpoint
  //       }, 
  //       request: 'setpoint',
  //       type: 'post', 
  //       name: localStorage.getItem('room_key'),
  //       id: localStorage.getItem('room_id'),
  //       }
  //     };
  //     console.log('TEST', TEST);
      } catch (error) {
        this.sendLogToServer('error', 'App.vue Функция changeSetpoint Ошибка выполнения функции обработки ${error} для параметра ${this.setName}');
      }
    }
  },




  // changeSetpoint(newState) {
  //   if (newState == null && newState !== undefined) {



  //     console.log('App.vue - из компонентов в функцию changeSetpoint получено сообщение - ', newState);
  //     if (newState.newSetPoint !== undefined) this.setpoint = newState.newSetPoint;
      
  //     if (newState.updatePermission !== undefined && this.setpoint !== undefined) this.$emit('AppNewSetpoint',{
  //       setpointUpdate:
  //     { 
  //         setpoint: { //Сообщение о изменении Уставки Для каждой группы параметров нужно писать свой разработчик
  //           [this.setName] : this.setpoint
  //       }, 
  //       request: 'setpoint',
  //       type: 'post', 
  //       name: this.room_name,
  //       id: this.id,
  //       }
  //     }); 
  //   } else {
  //     console.error('App.vue Функция changeSetpoint получила пустое значение setpoint', newState);
  //   }

  // },
  getManageValues(id_room, param_key) {
      console.log('App.vue - Приступили к выполнению функции getManageValues с параметром id = ', id_room , ' и ключем = ', param_key);
      if (id_room === undefined || param_key === undefined) {
        console.error('App.vue - Функция getManageValues получила пустое значение id_room или param_key');
        this.sendLogToServer ('warning', `Функция getManageValues получила не корректные пееременные id_room = ${id_room} или param_key = ${param_key} - Значения для Setpoint и Limits НЕ определены `);
        return;
      } 
      // Задаем ключи для получения параметров
      this.setName = 'set'+param_key;
      const lowName = 'limDown'+param_key;
      const highName = 'limUp'+param_key;
      const stepName = 'limStep'+param_key;
      // console.log('set = ', this.setName, ' low = ', lowName, ' high = ',  highName, ' step = ', stepName);
      try {
        // Получаем объект manageConfig из localStorage
      const Mconfig = JSON.parse(localStorage.getItem('manageConfig'));
      if (!Mconfig) {
        console.error('Не удалось получить конфигурацию manageConfig из localStorage');
        return;
      } else {
        // console.log('Конфигурация "manageConfig" для id -', id_room, ' получена из localStorage успешно', Mconfig);
        // Значения граничных диапазонов всегда получаем из объекта common в manageConfig
        this.limLow = Mconfig.common.setpoint[lowName];
        this.limHigh = Mconfig.common.setpoint[highName];
        this.limStep = Mconfig.common.setpoint[stepName];

        const roomID = this.getManageValues_checkID(id_room, Mconfig);
        // console.log('roomID = ', roomID, 'setPoint = ', Mconfig[roomID].setpoint[this.setName], ' lowLimit = ', this.limLow, ' highLimit = ', this.limHigh, ' step = ', this.limStep);

        return Mconfig[roomID].setpoint[this.setName];
      }
      } catch (error) {
        this.sendLogToServer ('error', `В ходе выполнения функции getManageValues для получения Setpoint и Limits возникла ошибка - ${error} - Значения для Setpoint и Limits НЕ определены `);   
      }
      
    },

    getManageValues_checkID(id, arr) {
      // console.log('App - Функция getManageValues_checkID  --- Приступили к выполнению функции с параметром id = ', id);
      const num_id = Number(id);
      try {
        for (const key in arr) {
          if (arr[key].id === num_id) {
            // console.log('App - getManageValues_checkID --- Находим комнату с запрашиваемым ID:', key);
            return key;
          } else {
            // console.log('App -  getManageValues_checkID --- Комната с запрашиваемым ID не найдена');
            return 'common';
          }
        } 
      }
      catch (error) {
        this.sendLogToServer ('error', `Произошла ошибка при определении ключа для получения Setpoint и лемитов - ${error}`);
      }
    },










    // getInfo (value) { // Получаем тип датчика по его наименованию
    //   // console.log('MainBody.vue - Приступили к выполнению функции getInfo с параметром value = ', value);
    //   if (value.includes('Temp')) {
    //     this.point_title_name = 'Температура';
    //     this.point_title_sign = '°C';
    //     this.showSetpoint = true;
    //     return 'Temp';
    //   } else if (value.includes('Hum')) {
    //     this.point_title_name = 'Влажность';
    //     this.point_title_sign = '%';
    //     this.showSetpoint = true;
    //     return 'Hum';
    //   } else if (value.includes('Lum')) {
    //     this.point_title_name = 'Освещенность';
    //     this.point_title_sign = 'lum';
    //     this.showSetpoint = false;
    //     return 'Lum';
    //   } else if (value.includes('Pres')) {
    //     this.point_title_name = 'Давление';
    //     this.point_title_sign = 'hPa';
    //     this.showSetpoint = false;
    //     return 'Pres';
    //   } else if (value.includes('Noise')) {
    //     this.point_title_name = 'Уровень шума';
    //     this.point_title_sign = 'dB';
    //     this.showSetpoint = false;
    //     return 'Noise';
    //   } else if (value.includes('Co2')) {
    //     this.point_title_name = 'CO2';
    //     this.point_title_sign = 'ppm';
    //     this.showSetpoint = true;
    //     return 'CO2';
    //   } else if (value.includes('Voc')) {
    //     this.point_title_name = 'VOC';
    //     this.point_title_sign = 'ppb';
    //     this.showSetpoint = false;
    //     return 'Voc';
    //   } else if (value.includes('Mov')) {
    //     this.point_title_name = 'Движение';
    //     this.point_title_sign = 'on/off';
    //     this.showSetpoint = false;
    //     return 'Mov';
    //   } else if (value.includes('Bat')) {
    //     this.point_title_name = 'Напряжение батареи';
    //     this.point_title_sign = 'V';
    //     this.showSetpoint = false;
    //     return 'Bat';
    //   } else if (value.includes('Switch')) {
    //     this.point_title_name = 'Переключатель';
    //     this.point_title_sign = 'on/off';
    //     this.showSetpoint = false;
    //     return 'Switch';
    //   } else if (value.includes('Relay')) {
    //     this.point_title_name = 'Реле';
    //     this.point_title_sign = 'on/off';
    //     this.showSetpoint = false;
    //     return 'Relay';
    //   } else if (value.includes('Power')) {
    //     this.point_title_name = 'Розетка';
    //     this.point_title_sign = 'on/off';
    //     this.showSetpoint = false;
    //     return 'Power';
    //   } else if (value.includes('Dimmer')) {
    //     this.point_title_name = 'Контроллер';
    //     this.point_title_sign = 'on/off';
    //     this.showSetpoint = false;
    //     return 'Dimmer';
    //   } else if (value.includes('Fire')) {
    //     this.point_title_name = 'Пожар';
    //     this.point_title_sign = 'on/off';
    //     this.showSetpoint = false;
    //     return 'Fire';
    //   } else if (value.includes('Leak')) {
    //     this.point_title_name = 'Протечка';
    //     this.point_title_sign = 'on/off';
    //     this.showSetpoint = false;
    //     return 'Leak';
    //   } else if (value.includes('Smoke')) {
    //     this.point_title_name = 'Дым';
    //     this.point_title_sign = 'on/off';
    //     this.showSetpoint = false;
    //     return 'Smoke';
    //   } else {
    //     this.point_title_name = 'Неизвестное';
    //     this.point_title_sign = '?';
    //     this.showSetpoint = false;
    //     return 'Unknown';
    //   }
    // },
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





    // Обработка сообщений из компонентов
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
      if (this.selectedComponent === 'MainBody') {
        console.log('App.vue - из компонентов в функцию getEventsComponent получено сообщение changeTitle - ', event);
          if (event.changeTitle)  {
            try {
              this.headerTitle = event.changeTitle.message; 
            } catch (error) {
              this.sendLogToServer ('warning', `Ошибка ${error} обработки сообщения changeTitle - ${event.changeTitle}`);
            }
          }
          if (event.showSetpoint) {
            console.log('App.vue - из компонентов в функцию getEventsComponent получено сообщение showSetpoint - ', event.showSetpoint);
            this.showSetpoint = event.showSetpoint;      
          }
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
