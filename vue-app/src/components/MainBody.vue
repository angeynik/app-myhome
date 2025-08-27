<template>

    <div v-if="isLoading" class="loading">Загрузка...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else id="app_mainBody" class="mainBody">
      <MainBodyValue 
        v-for="(item, index) in viewArray"
        :key="`${index}-${item.paramKey}-${item.roomKey}`"
        :value="item.value"
        :unit="item.unit"
        :sortType="item.sortType"
        :roomTitle="item.roomTitle"
        :paramTitle="item.paramTitle"
        :setValue="item.setValue"
        :timeUpdated="item.timeDiff"
        :isSelected="isSelected(item)"
        @click="selectItem(item)"
        @dblclick="toggleSorting(item)"
      /> 
    </div>

</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import MainBodyValue from './MainBodyValue.vue'

export default {
  name: 'MainBody',
  components: { MainBodyValue },
  data() {
    return {
      selectedItem: null,
      viewArray: [],
      initializationError: null
    }
  },
  async created() {
    try {
      await this.updateView();
      this.SET_SORT_TYPE(this.initialSortType);
    } catch (error) {
      console.error('Ошибка инициализации MainBody:', error);
      this.initializationError = 'Не удалось загрузить данные';
    }
  },
  props: {
  initialSortType: {
    type: String,
    default: 'rooms'
  }
},
  computed: {
    ...mapGetters('config', ['isLoading', 'error', 'getConfig']),
    ...mapGetters('sortParams', [
      'currentSortType', 
      'getRoomId', 
      'getRoomKey', 
      'getParamKey', 
      'getRoomTitle', 
      'getParamTitle',
      'getSensorTitle',
      'getUnit']),
    ...mapGetters(['dID']),
    
    sortingSubtitle() {
      return this.currentSortType === 'rooms' 
        ? `Комната: ${this.getRoomTitle}`
        : `Параметр: ${this.getSensorTitle(this.getParamKey)}`;
    },
  isRoomSort() {
    return this.currentSortType === 'rooms';
  },
  },
watch: {
  currentSortType(newVal, oldVal) {
    console.log(`[MainBody] Изменен тип сортировки: ${oldVal} -> ${newVal}`);
    this.updateView();
  },
  getRoomKey(newVal, oldVal) {
    console.log(`[MainBody] Изменен ключ комнаты: ${oldVal} -> ${newVal}`);
    if (this.currentSortType === 'rooms') this.updateView();
  },
  getParamKey(newVal, oldVal) {
    console.log(`[MainBody] Изменен ключ параметра: ${oldVal} -> ${newVal}`);
    if (this.currentSortType === 'params') this.updateView();
  },
  getConfig: {
    handler(newVal) {
      if (newVal) this.updateView();
    },
    deep: true
  }
},
  mounted() {
    this.updateView();
  },
  methods: {
    ...mapMutations('sortParams', ['SET_SORT_TYPE', 'SET_ROOM_ID', 'SET_ROOM_KEY', 'SET_PARAM_KEY', 'SET_ROOM_TITLE', 'SET_PARAM_TITLE']),
    

    getSensorValue(key, data) {
      switch (key) {
        case 'num':{
          const numValue = data?.value != null ? parseFloat(data.value) : 0;
          return numValue;
          }
        case 'bool':{
          const boolValue = data?.type != null ? data.value : null;
          if (boolValue === true) {
            return 'ON'
          }
          return 'OFF';
          }
        default:
          return null;

      }
    },
    isSelected(item) {
      return this.selectedItem && 
             this.selectedItem.roomId === item.roomId && 
             this.selectedItem.paramKey === item.paramKey;
    },
    
    selectItem(item) {
      //console.log(`[MainBody] - selectItem - Выбран параметр: ${JSON.stringify(item)}`);

       if (this.selectedItem === item) {
            // Если клик на уже выбранный элемент, то снимаем выделение
            this.selectedItem = null;
            // Отправляем событие, что нужно скрыть MainSetpoint
            this.$emit('eventsMainBody', { 
              action: 'hide' 
            });
            //console.log(`[MainBody] - selectItem - Выбран параметр: ${JSON.stringify(item.action)}`);
          } else {
            this.selectedItem = item;

        // Обновляем ключи в хранилище
          this.SET_ROOM_KEY(item.roomKey);
          this.SET_PARAM_KEY(item.paramKey);

          // Отправляем событие с данными в DashBoard
          this.$emit('eventsMainBody', {
            action: 'show',
            data: {
              value: item.value,
              setValue: item.setValue,
              unit: item.unit,
              paramKey: item.paramKey,
              roomKey: item.roomKey,
              sortType: item.sortType
            }
          });
          //console.log(`[MainBody] - selectItem - Выбран параметр: ${JSON.stringify(item.action)}`);
          }
    },
   
    toggleSorting(item) {
      if (this.currentSortType === 'rooms') {
        this.SET_SORT_TYPE('params');
        this.SET_PARAM_KEY(item.paramKey);
        this.$store.commit('sortParams/SET_PARAM_TITLE', this.getSensorTitle(item.paramKey));
      } else {
        this.SET_SORT_TYPE('rooms');
        this.SET_ROOM_KEY(item.roomKey);
        this.SET_ROOM_ID(item.roomId);
        this.$store.commit('sortParams/SET_ROOM_TITLE', item.roomTitle);
      }
    },
  async updateView() {
      try {
        //console.groupCollapsed('[MainBody] Обновление отображения');
        const config = this.getConfig(this.dID);
        if (!config) {
          console.warn('Конфигурация не доступна');
          this.viewArray = [];
          return;
        }

        if (this.currentSortType === 'rooms') {
          //console.log(`Режим: комнаты (${this.getRoomKey})`);
          this.viewArray = this.getSortedRooms(config, this.getRoomKey);
        } else {
          //console.log(`Режим: параметры (${this.getParamKey})`);
          this.viewArray = this.getSortedParams(config, this.getParamKey);
        }
        
        //console.log('Отображаемые элементы:', this.viewArray);
        console.groupEnd();
      } catch (error) {
        console.error('[MainBody] Ошибка обновления:', error);
        this.viewArray = [];
      }

  },
  
  getSortedRooms(config, roomKey) {
    const room = config[roomKey];
    if (!room?.sensors) return [];
    
    return Object.entries(room.sensors).map(([sensorKey, sensorData]) => {
      //const sensorSet = room.setpoints?.[sensorKey];
      // Ищем соответствующую уставку
    let setValue = null;
    if (room.setpoints) {
    // Ищем ключ уставки, который соответствует префиксу сенсора
      const setpointKey = Object.keys(room.setpoints).find(setKey => 
        sensorKey.includes(setKey) || setKey.includes(sensorKey)
      );
      
      if (setpointKey) {
        setValue = room.setpoints[setpointKey]?.value != null 
          ? parseFloat(room.setpoints[setpointKey].value) 
          : null;
      }
    }

      return {         
        sortType: 'rooms',
        paramTitle: this.getSensorTitle(sensorKey),
        paramType: sensorData?.type != null ? sensorData.type : null,
        paramKey: sensorKey,
        value: this.getSensorValue(sensorData?.type, sensorData),
        setValue: setValue,
        unit: this.getUnit(sensorKey),
        timeDiff: this.getTimeDiff(sensorData.lastUpdate),
        roomTitle: room.title,
        roomId: room.id,
        roomKey
      };
    });
  },
  
  getSortedParams(config, paramPrefix) {
    // Получаем все ключи сенсоров, которые начинаются с этого префикса
    const sensors = [];
    
    Object.entries(config).forEach(([roomKey, room]) => {
      if (!room.sensors) return;
      
      Object.entries(room.sensors).forEach(([sensorKey, sensorData]) => {
        // Проверяем, что ключ сенсора начинается с нужного префикса
        if (sensorKey.startsWith(paramPrefix)) {
          //const sensorSet = room.setpoints?.[sensorKey];
                  let setValue = null;
        if (room.setpoints) {
          // Ищем ключ уставки, который соответствует префиксу сенсора
          const setpointKey = Object.keys(room.setpoints).find(setKey => 
            sensorKey.includes(setKey) || setKey.includes(sensorKey)
          );
          
          if (setpointKey) {
            setValue = room.setpoints[setpointKey]?.value != null 
              ? parseFloat(room.setpoints[setpointKey].value) 
              : null;
          }
        }
          
          sensors.push({
            sortType: 'params',
            paramTitle: this.getSensorTitle(paramPrefix), // Название типа параметра
            paramType: sensorData?.type,
            paramKey: sensorKey, // Полный ключ сенсора
            value: this.getSensorValue(sensorData?.type, sensorData),
            setValue: setValue,
            unit: this.getUnit(paramPrefix),
            timeDiff: this.getTimeDiff(sensorData.lastUpdate),
            roomTitle: room.title,
            roomId: room.id,
            roomKey
          });
        }
      });
    });
    //console.log('[MainBody] - getSortedParams - Получен список сенсоров:', sensors);
    return sensors;
  },


    getTimeDiff(timestamp) {
      if (!timestamp) return 'Неизвестно';
    
      try {
        const now = Date.now();
        const time = new Date(timestamp).getTime();
        if (isNaN(time)) return 'Неизвестно';
        
        const diff = Math.floor((now - time) / 60000);
        if (diff < 1) return 'сейчас';
        if (diff < 60) return `${diff} мин назад`;
        if (diff < 1440) return `${Math.floor(diff / 60)} ч назад`;
        return `${Math.floor(diff / 1440)} дн назад`;
      } catch (e) {
        return 'Неизвестно';
      }
    }
  }
}
</script>

<style lang="css" src="@/assets/mainStyle.css"></style>