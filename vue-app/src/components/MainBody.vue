<template>
  <div class="container">
      <!-- <div style="padding-top: 8vh;"></div> -->
      <div>
      <div class="roomTitle">
        <h1> {{ room_title }}</h1>
      </div>
      <div style="max-height: 1vh;">
        <t> {{ point_title }}</t>
      </div>
      <div class="pointTitle">
        <h3>{{ point_title_name }}, {{ point_title_sign }} </h3>
      </div>
    </div>
        <!-- <h3> {{ id_item }}</h3> -->
        <!-- <h1> B O D Y </h1>  -->
            <div id="app_valueblock" ref="valueBlock" >
              <BodyValueBlock 
              :point_value="point_value" 
              :state="stateInfo" 
              :control_stateSelected="controlState" 
              :secectedComponent="selectedComponent"
              @updateState="updateState"
              /> 
            </div>

            <!-- <div> room_title - {{ room_title }}</div>
            <div> point_title - {{ point_title }}</div>
            <div> point_value - {{ point_value }}</div>
            <div> Setpoint - {{ setpoint }}</div> -->
      <div style=" align-items: center; width: 100dvw;">
      <div id="app_setpointblock" ref="setpointBlock" v-show="showSetpoint"> 
        <BodySetpontBlock 
        :setPoint="setpoint" 
        :highLimit="limHigh" 
        :lowLimit="limLow"
        :step="limStep"
        :secectedComponent="selectedComponent"
        @updateState="updateState"
        /> </div>
      <div class="time_periodUpdated"> Время с последнего обновления, минут - {{ time_periodUpdated }}</div>
    </div>
  </div>
</template>

<script>
import BodyValueBlock from './BodyValueBlock.vue';
import BodySetpontBlock from './BodySetpontBlock.vue';
export default {
  name: 'MainBody',
  components: {
    BodyValueBlock,
    BodySetpontBlock
  },
  data() {
    return {
      id: 1, // ID текущей комнаты
      id_point: 1, // ID текущего датчика
      room_name: '', //Наименование текущей комнаты вида Room01
      room_title: '', //Наименование текущей комнаты вида Гостинная
      point_title: '', //Наименование текущего датчика вида dTemp01
      point_title_name: '', //Наименование текущего датчика вида Температура
      point_title_sign: '', //Единица измерения текущего датчика вида °C
      point_value: 0, //Значение текущего датчика

      limLow: 8, //Нижняя граница уставки
      limHigh: 32, //Верхняя граница уставки
      limStep: 0.1, //Шаг уставки
      setpoint: 23.0, // Значение уставки
      newSetPoint: 0, // Новое значение уставки (получено с компонента BodySetpontBlock)
      showSetpoint: true, // Флаг разрешающий отображение компонента BodySetpontBlock (с уставкой и шкалой)

      controlState: false, // Параметр позволяет пользователю Включать / Отключать контроль параметра
      time_periodUpdated: 0,
      stateInfo: 2, // переменная отвечающая за визуализацию состояния связи с устройством в зависимости от времени последнего обновления
      //0 - не активно 9 - нет связи, 1 - есть связь 2 - есть связь, обнавлена не давно
    
      // Дополнительные (служебные) параметры
      setUpdateTime: 1000, // время перезапуска обновления данных в секундах
      flagReloadPage: false, // флаг перезагрузки страницы
      secectedComponent: null, // выбранный Пользователем компонент (тачем)
      setpoint2: '', // Объект с данными для отправки измененной Уставки для отправки на сервер и локального сохранения

      setName: '',
      lowName: '',
      highName: '',
      stepName: '',
      
      };
    },
    computed: {
    propsValueBlock() {
      return {
        // id_title: this.id_title,
        // title: this.title, 
        // TYPES: this.types, 
        // FUNC: this.functions, 
        // CONFIG: this.config,
        // user: this.uuid,
        }
      },
    },
    props: {
    id_item: Number,
    isSending: Boolean,
    },
    watch: {
      // Отслеживание изменений данных
      d_item(newValue) {this.id = newValue;},
      id(newValue) {this.getConfigValues(newValue, this.id_point);},
      id_point(newValue) {this.getConfigValues(this.id, newValue);},
      isSending(newValue) {
        console.log('MainBody - флаг isSending = true. Обновляем параметры Уставок', newValue);
        if (newValue === true) {
          this.getManageValues(this.id, this.getInfo(this.point_title));
        }
      },
      // setpoint() {
      //   this.getConfigValues(this.id, this.id_point);
      //   this.debounceSetpoint(this.setpoint);
      // },
    },
    created() {
    // this.debounceSetpoint = this.debounce(this.setpointCollectMassage, 800);
    },
    mounted() {
      this.id = this.id_item;
      this.getConfigValues(this.id, this.id_point);
      this.detectDevice(); // Проверка на мобильное устройство
    },
    beforeUnmount() {
    },
    methods: {
      reloadPage() {
        // Перезагрузка страницы
        if (this.flagReloadPage === true) {
        // console.log('reloadPage    Обновление страницы разрешено flagReloadPage -', this.flagReloadPage);
        // console.log('reloadPage    Запрос на обновление сформирован LocalStorage - flag_commonConfigUpdated: ', localStorage.getItem('flag_commonConfigUpdated'));
        window.location.reload();
        this.flagReloadPage = false;
        } else {
          return;
        } 
        return;
      },
    getConfigValues(id, idPoint) {
      // console.log('Входим в getConfigValues с параметрами:', id, idPoint);
    // Получаем объект Config из localStorage
    const config = JSON.parse(localStorage.getItem('commonConfig'));
    if (!config) {
      console.error('Не удалось получить конфигурацию commonСonfig из localStorage');
      return;
    } else {
    // console.log('Конфигурация "commonConfig" получена из localStorage успешно');

      // Проверяем находится ли ID выбранной комнаты в диапазоне существующих комнат
    const roomKeys = Object.keys(config);
    // console.log('roomKeys.length = ', roomKeys.length);
    id = this.checkLength(id, roomKeys.length);
    this.id = id;

    // Ищем объект с соответствующим id
    for (const key in config) {
        if (config[key].id === id) {
          // console.log('Найдена комната с запрашиваемым ID:', key);
            this.room_name = key;
            const room = config[key];
            this.room_title = room.title;
            // console.log('Определили наименование комнаты = ', this.room_title);

            // Определяем point_title на основе id_point и проверяем idPoint на соответсвие массиву датчиков
            const sensorKeys = Object.keys(room.sensors);
            // console.log('sensorKeys = ', sensorKeys);
            const id_point = this.checkLength(idPoint, sensorKeys.length);
            this.id_point = id_point;
            // console.log('Выполнена проверка на соответсвие значения id_point диапазону из конфигурационного файла - ', id_point);

            if (id_point > 0 && id_point <= sensorKeys.length) {
                this.point_title = sensorKeys[id_point - 1];
                // console.log('Определили наименование датчика = ', this.point_title);
                this.point_value = room.sensors[this.point_title] || null ; //Если датчик не найден, то возвращаем значение по умолчанию
                // console.log('Время последнего обновления датчика = ', room.time[this.point_title], ' . и текущее время - ', new Date().toLocaleTimeString());
               

                  // Определяем значения Уставки и лимитов
                  const set_key = this.getInfo(this.point_title);
                  // console.log('Результат getInfo set_key = ', set_key);
                  if (this.showSetpoint === true) {
                    this.setpoint = this.getManageValues(this.id, set_key);
                  } else {
                    break;
                  }

                this.time_periodUpdated = this.getPeriodMinutes(room.time[this.point_title]);// Определяем время последненго обновления
                this.getStateInfo(this.time_periodUpdated); // Задаем параметр визуализации состояния связи с устройством - stateInfo
                // console.log('Определили значение датчика = ', this.point_value , 'и время обновления = ', this.time_periodUpdated);
            }
            break;
        }
        // this.reloadPage();
    }

    }
    // Возвращаем найденные значения
    // this.reloadPage();
    return;
    },

    getManageValues(id, name) {
      // console.log('Приступили к выполнению функции getManageValues с параметром id = ', id , ' и ключем = ', name);
      // Задаем ключи для получения параметров
      this.setName = 'set'+name;
      this.lowName = 'limDown'+name;
      this.highName = 'limUp'+name;
      this.stepName = 'limStep'+name;
      // console.log('set = ', this.setName, ' low = ', this.lowName, ' high = ',  this.highName, ' step = ', this.stepName);

      // Получаем объект manageConfig из localStorage
      const Mconfig = JSON.parse(localStorage.getItem('manageConfig'));
      // console.log('Получили manageConfig из localStorage', Mconfig);

      if (!Mconfig) {
        console.error('Не удалось получить конфигурацию manageConfig из localStorage');
        return;
      } else {
        // console.log('Конфигурация "manageConfig" для id -', id, ' получена из localStorage успешно', Mconfig);
      }
  
      const roomID = this.getManageValues_checkID(id, Mconfig);
      // console.log('roomID = ', roomID);

      this.limLow = Mconfig[roomID].setpoint[this.lowName];
      this.limHigh = Mconfig[roomID].setpoint[this.highName];
      this.limStep = Mconfig[roomID].setpoint[this.stepName];


      // console.log('roomID = ', roomID, 'setPoint = ', this.setpoint, ' lowLimit = ', this.lowLimit, ' highLimit = ', this.highLimit, ' step = ', this.step);

            // Устанавливаем setPoint для найденного или дефолтного roomID
        return Mconfig[roomID].setpoint[this.setName];
    },
    getManageValues_checkID(id, arr) {
      // console.log('Приступили к выполнению функции getManageValues_checkID с параметром id = ', id);
      let room = 'common';
      for (const key in arr) {
      if (arr[key].id === id) {
        room = key;
        // console.log('Найдена комната с запрашиваемым ID:', room);
        break;
      }
      }
      if (room === 'common') {
        // console.log('Комната с запрашиваемым ID не найдена');
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
      const lastDate = new Date(lastTime);
      const currentDate = new Date();
      const timeDifferenceMinutes = Math.floor((currentDate - lastDate) / 60000); // разница в минутах

      const timeDifference = currentDate - lastDate;
      const seconds = Math.floor(timeDifference / 1000);
      // const minutes = Math.floor(seconds / 60);
      // const hours = Math.floor(minutes / 60);
      // console.log(`Прошло времени: ${hours} часов, ${minutes % 60} минут, ${seconds % 60} секунд`);

      if (seconds > 20) {
        this.flagReloadPage = true;
        // console.log(' flagReloadPage = true  Обновление страницы разрешено');
      } else {
        this.flagReloadPage = false;
      }
      // return {
      //   hours: hours,
      //   minutes: minutes % 60,
      //   seconds: seconds % 60
      // };
      return timeDifferenceMinutes;
    },
    getStateInfo(time_period) {
      if (time_period && time_period < 5) {
        this.stateInfo = 2; // Недавно было выполнено обновление данных по этому датчику
      } else if (time_period && time_period < 60) {
        this.stateInfo = 1; // Данные о состоянии датчика получены в предалах 1 часа
      } else {
        this.stateInfo = 0; // Данные с датчика не обновляличь более 1 часа
      }
    },

    updateState(newState) {
      // console.log('В функцию updateState получено новое состояние', newState);
      // const value = newState['incrementPoint'];
      // console.log('Обновляем индекс датчика в компоненте MainBody. updateState: ', newState['incrementPoint']);
      if (newState.incrementPoint !== undefined) this.id_point = this.id_point + newState['incrementPoint'];
      if (newState.icrementRoom !== undefined) this.id = this.id + newState['icrementRoom'];
      if (newState.controlState !== undefined) this.control_state = newState.control_state;
      // console.log('Обновляем данные для текущей комнаты и датчика при помощи getConfigValues', this.id, this.id_point);

      if (newState.newSetPoint !== undefined) this.setpoint = newState.newSetPoint;

      if (newState.updatePermission !== undefined && this.setpoint !== undefined) this.$emit('newSetpoint', 
      { 
          setpoint: { //Сообщение о изменении Уставки Для каждой группы параметров нужно писать свой разработчик
            [this.setName] : this.setpoint
        }, 
        request: 'setpoint',
        type: 'post', 
        name: this.room_name
      }); 
      

    },
    
  detectDevice() {
      // Проверка на мобильное устройство
      this.isMobile = /Mobi|Android/i.test(navigator.userAgent);
      // console.log('Используем мобильное устройство: ', this.isMobile);
  },
  // debounce(func, wait) {
  //     // console.log('Активирована задержка выполнения функции', func, 'в', wait, 'мсек');
  //   let timeout;
  //   return function() {
  //     clearTimeout(timeout);
  //     timeout = setTimeout(() => func.apply(this, arguments), wait);
  //   };
  //   },

}
}
</script>

<style scoped>


</style>