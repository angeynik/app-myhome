<template>
      <div> 
        <h3> {{ id_title }}</h3>
        <!-- <h1> B O D Y </h1>  -->
            <div id="app_valueblock"> <BodyValueBlock :title="id_title"  /> </div>
            <div> {{ room_title }}</div>
            <div> {{ point_title }}</div>
            <div> {{ point_value }}</div>
    </div>
</template>

<script>
import BodyValueBlock from './BodyValueBlock.vue';
export default {
  name: 'MainBody',
  components: {
    BodyValueBlock,
  },
  data() {
    return {
      id: this.id_title,
      id_point: 0,
      room_title: '',
      point_title: '',
      point_value: 0,
      setpoint: 0,
      time_periodUpdated: 0,
      state_info: 0,
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
    id_title: Number
    },
    created() {
      this.getConfigValues(1, 2);
    },
    methods: {
 
      getConfigValues(id, id_point) {
    // Получаем объект Config из localStorage
    const config = JSON.parse(localStorage.getItem('commonConfig'));
    console.log('Забрали конфигурацию системы из - commonСonfig');

    // Ищем объект с соответствующим id
    for (const key in config) {
        if (config[key].id === id) {
          console.log('Найдена комната с запрашиваемым ID:', key);
            const room = config[key];
            this.room_title = room.title;
            console.log('Определили наименование комнаты = ', this.room_title);

            // Определяем point_title на основе id_point
            const sensorKeys = Object.keys(room.sensors);
            if (id_point > 0 && id_point <= sensorKeys.length) {
                this.point_title = sensorKeys[id_point - 1];
                console.log('Определили наименование датчика = ', this.point_title);
                this.point_value = room.sensors[this.point_title];
                console.log('Определили значение датчика = ', this.point_value);
            }
            break;
        }
    }

    // Возвращаем найденные значения
    return;
    },



    }
}
</script>

<style>

</style>