<template>

            <div id="app_mainBody" class="mainBody">
              <MainInfoRoom 
              v-if="propsTitle == 'rooms'"
              :id_item="id_infoRoom"
              :localStorageUpdated="localStorageUpdated"
              @AppNewSetpoint="messageFromInfoRoom"
              />
              <MainInfoParam 
              v-if="propsTitle == 'params'"
              :id_item="id_infoParam"
              :localStorageUpdated="localStorageUpdated"
              @AppNewSetpoint="messageFromInfoParam"
              />
            </div>

</template>

<script>
// import MainManu from './components/MainManu.vue';
import MainInfoRoom from './MainInfoRoom.vue';
import MainInfoParam from './MainInfoParam.vue';
export default {
  name: 'App',
  components: {
    // MainManu,
    MainInfoRoom,
    MainInfoParam,

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
      isSending: true, // Флаг разрешающий отправку данных на сервер
      localStorageUpdated: false, // Флаг обновления конфигурации в localStorage
    };
  },
  props: {
    propsTitle: String,
  },
  created() {
    // console.log('MainInfo.vue: propsTitle', this.propsTitle);
    // this.testFunct();
        // this.sendLogToServer('info', 'Client: Инициализация подключения логирования'); // отправка логов на сервер для сохранения в файл
        // localStorage.setItem('flag_commonConfigUpdated', 'false');
  },
  mounted() {
    // this.connectWebSocket();
    // // this.sendServerRequest('get', 'config', 'name','manageConfig');
    // // this.sendServerRequest('get', 'config', 'name','commonConfig');
    // this.id_title = localStorage.getItem('id_title') || 3;
  },
  beforeUnmount() {
    // if (this.socket) {
    //   this.socket.close();
    // }
  },
  methods: {

  messageFromInfoRoom(n) {
    
    // console.log('App.vue: Функция messageFromMainBody: Получено ообщение', n);
        if (n.getConfig !== undefined && n.getConfig === true) { // При получении сообщения  getConfig (true) о завершении обновления  localStorage сбрасываем флаг запроса на обновления localStorage
            this.localStorageUpdated = false;
          } 
    if (n !== undefined && n !== null) {
      // console.log('Сообщение messageFromMainBody корректно', n);

      try {
        if (n.setpointUpdate !== undefined) {
          // console.log(' Получено сообщение n.setpointUpdate', n.setpointUpdate );
          // console.log(' 1 ---  Компонент APP.vue Функция messageFromMainBody приступила к обработке запроса на изменение значения параметра', n );
          this.id_title = n.setpointUpdate.id;
          // console.log('Функция messageFromMainBody: id_title:', n.setpointUpdate.id);
          // console.log('Функция messageFromMainBody: type:', n.setpointUpdate.type, 'request:', n.setpointUpdate.request, 'name:', n.setpointUpdate.name, 'data:', n.setpointUpdate.setpoint);
          
          if (n.setpointUpdate.request === 'setpoint') {
            // console.log('отправляем запрос в sendServerRequest на обнновление Уставок  ');
          this.$emit('eventsComponent', {
            sendServerRequest: {
              type: n.setpointUpdate.type, 
              request: n.setpointUpdate.request, 
              name: n.setpointUpdate.name, 
              setpoint: n.setpointUpdate.setpoint
            },
          });
          // console.log('messageFromMainBody Завершаем работу функции, проверяем localStorage:', JSON.parse(localStorage.getItem('manageConfig')));

          }
        
        } else if (n.sendLogToServer !== undefined) {
          // console.log(' MainInfo Получено сообщение n.sendLogToServer', n.sendLogToServer );
          this.$emit('eventsComponent', {
            sendLogToServer: {
              type: n.sendLogToServer.type, 
              message: n.sendLogToServer.message, 
            },
          });
        }
      } catch (error) {
        console.error('MainInfo Функция messageFromMainBody. Ошибка обработки сообщения от MainBody: ', error);
        this.$emit('eventsComponent', {
            sendLogToServer: {
              type: 'error', 
              message: `MainInfo Функция messageFromMainBody. Ошибка обработки сообщения от MainBody: `+ error, 
            },
          });
        }
    } else {
      console.error('MainInfo Функция messageFromMainBody. Value: undefined');
      this.$emit('eventsComponent', {
            sendLogToServer: {
              type: 'error', 
              message: `MainInfo Функция messageFromMainBody. Value: undefined`, 
            },
          });
    }

  },  
  messageFromInfoParam(n) {
    // console.log('MainInfo.vue: Функция messageFromInfoParam: Получено ообщение', n);
    if (n !== undefined && n !== null) {
      this.$emit('eventsComponent', {
        changeTitle: {
          title: n.changeTitle
        },
        showSetpoint: n.showSetpoint,
        key: n.keys,
      });
    }
  }, 
  // testFunct () {

  //   this.$emit('eventsComponent', {
  //           sendLogToServer: {
  //             type: 'error', 
  //             message: `MainInfo Функция messageFromMainBody. Ошибка обработки сообщения от MainBody: `, 
  //           },
  //         });
  // },

  },
}
</script>

<style>

</style>
