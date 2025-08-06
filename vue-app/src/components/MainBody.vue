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
    }
  },
  computed: {
    ...mapGetters('config', ['isLoading', 'error', 'getCommonConfig']),
    ...mapGetters('sortParams', ['currentSortType', 'getRoomId', 'getRoomKey', 'getParamKey', 'getRoomTitle', 'getParamTitle']),
    ...mapGetters(['dID']),
    
    sortingSubtitle() {
      return this.currentSortType === 'rooms' 
        ? `Комната: ${this.getRoomTitle}`
        : `Параметр: ${this.getParamTitle}`;
    },
  isRoomSort() {
    return this.currentSortType === 'rooms';
  },
    humanParamTitle() {
      return this.getHumanParamTitle(this.getParamKey);
    },
  },
  watch: {
    currentSortType() {
      this.updateView();
    },
    getRoomKey() {
      if (this.currentSortType === 'rooms') {
        this.updateView();
      }
    },
    getParamKey() {
      if (this.currentSortType === 'params') {
        this.updateView();
      }
    }
  },
  mounted() {
    this.updateView();
  },
  methods: {
    ...mapMutations('sortParams', ['SET_SORT_TYPE', 'SET_ROOM_ID', 'SET_ROOM_KEY', 'SET_PARAM_KEY', 'SET_ROOM_TITLE', 'SET_PARAM_TITLE']),
    
    getUnit(key) {
        if (key.includes('Temp')) return '°C';
        if (key.includes('Hum')) return '%';
        if (key.includes('Press')) return 'hPa';
        if (key.includes('Power')) return 'W';
        return '';
    },
    getSensorTitle(key) {
      const baseKey = key.replace(/\d+/g, '');
      const mappings = {
        'dHum': 'Влажность',
        'dTemp': 'Температура',
        'dPress': 'Давление',
        'dPower': 'Потребление',
      };
      return mappings[baseKey] || key;
    },
    isSelected(item) {
      return this.selectedItem && 
             this.selectedItem.roomId === item.roomId && 
             this.selectedItem.paramKey === item.paramKey;
    },
    
    selectItem(item) {
      if (this.selectedItem && 
          this.selectedItem.roomId === item.roomId && 
          this.selectedItem.paramKey === item.paramKey) {
        this.selectedItem = null;
      } else {
        this.selectedItem = { ...item };
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
    

    updateView() {
      try {
        const config = this.getCommonConfig(this.dID);
        if (!config) {
          this.viewArray = [];
          return;
        }

        if (this.currentSortType === 'rooms') {
          if (!config[this.getRoomKey]) {
            const validRooms = Object.keys(config).filter(key => 
              config[key]?.sensors && Object.keys(config[key].sensors).length > 0
            );
            
            if (validRooms.length > 0) {
              const firstRoomKey = validRooms[0];
              const room = config[firstRoomKey];
              
              this.SET_ROOM_KEY(firstRoomKey);
              this.SET_ROOM_TITLE(room.title || firstRoomKey);
              this.SET_ROOM_ID(room.id || 0);
            }
          }
          
          this.viewArray = this.getSortedRooms(config, this.getRoomKey);
        } 
        else {
          const paramExists = Object.values(config).some(room => 
            room.sensors?.[this.getParamKey] !== undefined
          );
          
          if (!paramExists) {
            const allParams = new Set();
            Object.values(config).forEach(room => {
              if (room.sensors) {
                Object.keys(room.sensors).forEach(k => allParams.add(k));
              }
            });
            
            if (allParams.size > 0) {
              const firstParam = [...allParams][0];
              this.SET_PARAM_KEY(firstParam);
              this.SET_PARAM_TITLE(this.getSensorTitle(firstParam));
            }
          }
          
          this.viewArray = this.getSortedParams(config, this.getParamKey);
        }
        console.log('[MainBody] Результат сортировки:', this.viewArray);
      } catch (error) {
        console.error('[MainBody] Ошибка обновления вида:', error);
        this.viewArray = [];
      }
    },
    getSortedRooms(config, roomKey) {
      if (!config || !roomKey || !config[roomKey]) {
        return [];
      }
      
      const room = config[roomKey];
      if (!room.sensors || Object.keys(room.sensors).length === 0) {
        return [];
      }

      return Object.entries(room.sensors).
      map(([sensorKey, sensorData]) => {
      const sensorSet = room.setpoints?.[sensorKey];
      return {         
          sortType: 'rooms',
          paramTitle: this.getSensorTitle(sensorKey),
          // title: room.title,
          paramKey: sensorKey,
          value: sensorData?.value != null ? parseFloat(sensorData.value) : 0,
          setValue: sensorSet?.value != null ? parseFloat(sensorSet.value) : null,
          unit: this.getUnit(sensorKey),
          timeDiff: this.getTimeDiff(sensorData.lastUpdate),
          roomTitle: room.title,
          roomId: room.id,
          roomKey
      };
    })
  },
    getSortedParams(config, paramKey) {
      if (!config || !paramKey) {
        return [];
      }
   
      return Object.entries(config)
        .filter(([, room]) => room.sensors?.[paramKey] !== undefined)
        .map(([roomKey, room]) => {
          const sensorData = room.sensors[paramKey];
          const sensorSet = room.setpoints?.[paramKey];
          return {
            sortType: 'params',
            paramTitle: this.getSensorTitle(paramKey),
            // title: this.getSensorTitle(paramKey),
            paramKey: paramKey,
            value: sensorData?.value != null ? parseFloat(sensorData.value) : 0,
            setValue: sensorSet?.value != null ? parseFloat(sensorSet.value) : null,
            unit: this.getUnit(paramKey),
            timeDiff: this.getTimeDiff(sensorData.lastUpdate),
            roomTitle: room.title,
            roomId: room.id,
            roomKey: roomKey
          };
        });
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

<style>
</style>