<template>
  <div class="container" @touchstart="event => defineTouchComponent(event, 'start')">
      <!-- <div style="padding-top: 8vh;"></div> -->
    <div>
      <div class="roomTitle">
        <h1> {{ room_title }}</h1>
      </div>
      <div class="pointTitle">
        <h3> {{ point_title }}</h3>
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
    <div style="align-self: flex-end;">
      <div id="app_setpointblock" ref="setpointBlock"> 
        <BodySetpontBlock 
        :setPoint="setpoint" 
        :highLimit="highLimit" 
        :lowLimit="lowLimit"
        :secectedComponent="selectedComponent"
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
      room_title: '', //Наименование текущей комнаты
      point_title: '', //Наименование текущего датчика
      point_value: 0, //Значение текущего датчика

      lowLimit: 8, //Нижняя граница уставки
      highLimit: 32, //Верхняя граница уставки
      setpoint: 23, // Значение уставки

      controlState: false, // Параметр позволяет пользователю Включать / Отключать контроль параметра
      time_periodUpdated: 0,
      stateInfo: 2, // переменная отвечающая за визуализацию состояния связи с устройством в зависимости от времени последнего обновления
      //0 - не активно 9 - нет связи, 1 - есть связь 2 - есть связь, обнавлена не давно
    
      // Дополнительные (служебные) параметры
      setUpdateTime: 1000, // время перезапуска обновления данных в секундах
      flagReloadPage: false, // флаг перезагрузки страницы
      secectedComponent: null, // выбранный Пользователем компонент (тачем)
      
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
    },
    watch: {
      // Отслеживание изменений данных
      // id() {this.getConfigValues(this.id, this.id_point);},
    },
    mounted() {
      this.id = this.id_item;
      this.getConfigValues(this.id, this.id_point);
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
    // Получаем объект Config из localStorage
    const config = JSON.parse(localStorage.getItem('commonConfig'));
    if (!config) {
      console.error('Не удалось получить конфигурацию commonСonfig из localStorage');
      return;
    } else {
    // console.log('Конфигурация "commonConfig" получена из localStorage успешно');

    // Ищем объект с соответствующим id
    for (const key in config) {
        if (config[key].id === id) {
          // console.log('Найдена комната с запрашиваемым ID:', key);
            const roomKeys = Object.keys(config);
            // console.log('roomKey = ', roomKey);
            const check_id_room = this.checkId(id, roomKeys.length);
            this.id = check_id_room;

            const room = config[key];
            this.room_title = room.title;
            // console.log('Определили наименование комнаты = ', this.room_title);

            // Определяем point_title на основе id_point
            const sensorKeys = Object.keys(room.sensors);
            // console.log('sensorKeys = ', sensorKeys);
            const id_point = this.checkId(idPoint, sensorKeys.length);
            this.id_point = id_point;
            // console.log('Выполнена проверка на соответсвие значения id_point диапазону из конфигурационного файла - ', id_point);

            if (id_point > 0 && id_point <= sensorKeys.length) {
                this.point_title = sensorKeys[id_point - 1];
                console.log('Определили наименование датчика = ', this.point_title);
                this.point_value = room.sensors[this.point_title] || 99 ; //Если датчик не найден, то возвращаем значение по умолчанию
                // console.log('Время последнего обновления датчика = ', room.time[this.point_title], ' . и текущее время - ', new Date().toLocaleTimeString());
               
                this.time_periodUpdated = this.getPeriodMinutes(room.time[this.point_title]);// Определяем время последненго обновления
                this.getStateInfo(this.time_periodUpdated); // Задаем параметр визуализации состояния связи с устройством - stateInfo
                console.log('Определили значение датчика = ', this.point_value , 'и время обновления = ', this.time_periodUpdated);
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
    checkId(Point, Point_length) {
      if (Point > Point_length) {
        console.log('Переходим в начало списка');
        return 1;
      } if (Point < 1) {
        console.log('Переходим в конец списка');
        return Point_length;
      } else {
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
        console.log(' flagReloadPage = true  Обновление страницы разрешено');
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
      // const value = newState['incrementPoint'];
      // console.log('Обновляем индекс датчика в компоненте MainBody. updateState: ', newState['incrementPoint']);
      if (newState.incrementPoint !== undefined) this.id_point = this.id_point + newState['incrementPoint'];
      if (newState.icrementRoom !== undefined) this.id = this.id + newState['icrementRoom'];
      if (newState.controlState !== undefined) this.control_state = newState.control_state;
      console.log('Обновляем данные для текущей комнаты и датчика при помощи getConfigValues', this.id, this.id_point);
      this.getConfigValues(this.id, this.id_point);
    },
    // defineTouchComponent(event, type) {
    //   console.log('Приступили к обработке события', event);
    //   const touch = event.touches[0];
    //   const x = touch.clientX;
    //   const y = touch.clientY;
    //   console.log('Получены координаты x = ', x, 'y = ', y);

    //   const valueBlock = this.$refs.valueBlock.getBoundingClientRect();
    //   const setpointBlock = this.$refs.setpointBlock.getBoundingClientRect();

    //   if (x >= valueBlock.left && x <= valueBlock.right && y >= valueBlock.top && y <= valueBlock.bottom) {
    //     this.$refs.valueBlock.__vue__`handleTouch${type.charAt(0).toUpperCase() + type.slice(1)}`;
    //   } else if (x >= setpointBlock.left && x <= setpointBlock.right && y >= setpointBlock.top && y <= setpointBlock.bottom) {
    //     this.$refs.setpointBlock.__vue__`handleTouch${type.charAt(0).toUpperCase() + type.slice(1)}`;
    //   }
    // },
    
  //   defineTouchComponent(event, type) {
  //   console.log('Приступили к обработке события', event);
  //   const touch = event.touches[0];
  //   const x = touch.clientX;
  //   const y = touch.clientY;
  //   console.log('Получены координаты x = ', x, 'и y = ', y);

  //   const valueBlock = this.$refs.valueBlock;
  //   const setpointBlock = this.$refs.setpointBlock;

  //   if (valueBlock && setpointBlock) {
  //     const valueBlockRect = valueBlock.getBoundingClientRect();
  //     const setpointBlockRect = setpointBlock.getBoundingClientRect();

  //     if (x >= valueBlockRect.left && x <= valueBlockRect.right && y >= valueBlockRect.top && y <= valueBlockRect.bottom) {
  //       this.$refs.valueBlock.__vue__`handleTouch${type.charAt(0).toUpperCase() + type.slice(1)}`;
  //     } else if (x >= setpointBlockRect.left && x <= setpointBlockRect.right && y >= setpointBlockRect.top && y <= setpointBlockRect.bottom) {
  //       this.$refs.setpointBlock.__vue__`handleTouch${type.charAt(0).toUpperCase() + type.slice(1)}`;
  //     }
  //   } else {
  //     console.error('Элементы valueBlock или setpointBlock не найдены');
  //   }
  // },
  defineTouchComponent(event, type) {
  if (!type) {
    console.error('Параметр type не определен');
    return;
  }
  
  // console.log('Приступили к обработке события', event);
  const touch = event.touches[0];
  const x = touch.clientX;
  const y = touch.clientY;
  // console.log('Получены координаты x = ', x, 'и y = ', y);

  const valueBlock = this.$refs.valueBlock;
  // console.log('valueBlock = ', valueBlock);
  const setpointBlock = this.$refs.setpointBlock;
  // console.log('setpointBlock = ', setpointBlock);

  if (valueBlock && setpointBlock) {
    const valueBlockRect = valueBlock.getBoundingClientRect();
    const setpointBlockRect = setpointBlock.getBoundingClientRect();

    if (x >= (valueBlockRect.left-200) && x <= (valueBlockRect.right+200) && y >= (valueBlockRect.right-200) && y >= (valueBlockRect.top-200) && y <= (valueBlockRect.bottom+200)) {
      // this.$refs.valueBlock.__vue__`handleTouch${type.charAt(0).toUpperCase() + type.slice(1)}`;
      this.selectedComponent = 'valueBlock';
      // console.log('Выбран - valueBlockRect = ', valueBlockRect);
      return;
    } else if (x >= setpointBlockRect.left && x <= setpointBlockRect.right && y >= setpointBlockRect.top && y <= setpointBlockRect.bottom) {
      // this.$refs.setpointBlock.__vue__`handleTouch${type.charAt(0).toUpperCase() + type.slice(1)}`;
      // console.log('Выбран - setpointBlock = ', setpointBlock);
      this.selectedComponent = 'setpointBlock';
      return;
    }
  } else {
    console.error('Элементы valueBlock или setpointBlock не найдены');
  }

},
}
}
</script>

<style scoped>


</style>