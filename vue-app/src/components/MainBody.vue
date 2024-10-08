<template>
  <div class="container">
      <!-- <div style="padding-top: 8vh;"></div> -->
      <div class="roomTitle">
        <h1> {{ room_title }}</h1>
      </div>
      <div class="pointTitle">
        <h3> {{ point_title }}</h3>
      </div>
        <!-- <h3> {{ id_item }}</h3> -->
        <!-- <h1> B O D Y </h1>  -->
            <div id="app_valueblock">
              <BodyValueBlock 
              :point_value="point_value" 
              :state="stateInfo" 
              :control_stateSelected="controlState" 
              @updateState="updateState"
              /> 
            </div>

            <!-- <div> room_title - {{ room_title }}</div>
            <div> point_title - {{ point_title }}</div> -->
            <div> point_value - {{ point_value }}</div>
            <!-- <div> Setpoint - {{ setpoint }}</div> -->
   
    <div> <BodySetpontBlock /> </div>
    <div class="time_periodUpdated"> Время с последнего обновления, минут - {{ time_periodUpdated }}</div>

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
      id: this.id_item, // ID текущей комнаты
      id_point: 1, // ID текущего датчика
      room_title: '', //Наименование текущей комнаты
      point_title: '', //Наименование текущего датчика
      point_value: 0, //Значение текущего датчика
      setpoint: 0, // Значение уставки
      controlState: false, // Состояние управления для текущего параметра
      time_periodUpdated: 0,
      stateInfo: 0, // переменная отвечающая за визуализацию состояния связи с устройством в зависимости от времени последнего обновления 0 - нет связи, 1 - есть связь 2 - есть связь, установлена не давно
    
      // Дополнительные (служебные) параметры
      setUpdateTime: 1000, // время перезапуска обновления данных в секундах
      flagReloadPage: false, // флаг перезагрузки страницы
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
      id() {this.getConfigValues(this.id, this.id_point);},
    },
    mounted() {
      this.getConfigValues(this.id, this.id_point);
    },
    beforeUnmount() {
    },
    methods: {
      reloadPage() {
        // Перезагрузка страницы
        if (this.flagReloadPage === true) {
        console.log('reloadPage    Обновление страницы разрешено flagReloadPage -', this.flagReloadPage);
        console.log('reloadPage    Запрос на обновление сформирован LocalStorage - flag_commonConfigUpdated: ', localStorage.getItem('flag_commonConfigUpdated'));
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
            const room = config[key];
            this.room_title = room.title;
            console.log('Определили наименование комнаты = ', this.room_title);

            // Определяем point_title на основе id_point
            const sensorKeys = Object.keys(room.sensors);
            const id_point = this.checkIdPoint(idPoint, sensorKeys.length);
            console.log('Выполнена проверка на соответсвие значения id_point диапазону из конфигурационного файла - ', id_point);

            if (id_point > 0 && id_point <= sensorKeys.length) {
                this.point_title = sensorKeys[id_point - 1];
                // console.log('Определили наименование датчика = ', this.point_title);
                this.point_value = room.sensors[this.point_title] || 43.2; //Если датчик не найден, то возвращаем значение по умолчанию
                // console.log('Время последнего обновления датчика = ', room.time[this.point_title], ' . и текущее время - ', new Date().toLocaleTimeString());
               
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
    checkIdPoint(idPoint, idPoint_length) {
      if (idPoint > idPoint_length) {
        return 1;
      } if (idPoint < 1) {
        return idPoint_length;
      } else {
        return idPoint;
      }
    },
    getPeriodMinutes(lastTime) {
      const lastDate = new Date(lastTime);
      const currentDate = new Date();
      const timeDifferenceMinutes = Math.floor((currentDate - lastDate) / 60000); // разница в минутах

      const timeDifference = currentDate - lastDate;
      const seconds = Math.floor(timeDifference / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      console.log(`Прошло времени: ${hours} часов, ${minutes % 60} минут, ${seconds % 60} секунд`);

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
      this.getConfigValues(this.id, this.id_point);
    },

  }
}
</script>

<style scoped>
  .roomTitle {
    text-align: center;
    height: 6vh;
    margin-top: 4vh;
  }
  .pointTitle {
    text-align: center;
    height: 2vh;
    margin-bottom: 6vh;
  }

</style>