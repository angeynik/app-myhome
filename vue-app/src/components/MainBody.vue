<template>
  <div id="app_mainBody" class="mainBody">
    <h1> {{ currentViewTitle }}</h1>
    <div v-if="isLoading" class="loading">Загрузка...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
    <div class="subheader">
        {{ sortingSubtitle }}
    </div>
    <div class="sensors-grid">
      <MainBodyValue 
        v-for="(item, index) in viewArray"
        :key="index"
        :title="item.title"
        :value="item.value"
        :unit="item.unit"
        :timeUpdated="item.timeDiff"
        :roomTitle="item.roomTitle"
        :isSelected="isSelected(item)"
        @click="selectItem(item)"
        @dblclick="toggleSorting(item)"
      /> 
    </div>
    </div>
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
    
    currentViewTitle() {
      if (this.currentSortType === 'rooms') {
        return `Комната: ${this.getRoomKey}`;
      } else {
        return `Параметр: ${this.getParamKey}`;
      }
    },
    sortingSubtitle() {
      if (this.currentSortType === 'rooms') {
        return `Комната: ${this.getRoomTitle}`;
      } else {
        return `Параметр: ${this.getParamTitle}`;
      }
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
        if (key.includes('temp')) return '°C';
        if (key.includes('hum')) return '%';
        if (key.includes('press')) return 'hPa';
        if (key.includes('power')) return 'W';
        return '';
    },
    
    isSelected(item) {
      if (!this.selectedItem) return false;
      return this.selectedItem.roomId === item.roomId && 
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
        this.$store.commit('sortParams/SET_PARAM_TITLE', item.title); // Устанавливаем заголовок
      } else {
        this.SET_SORT_TYPE('rooms');
        this.SET_ROOM_KEY(item.roomKey);
        this.SET_ROOM_ID(item.roomId);
        this.$store.commit('sortParams/SET_ROOM_TITLE', item.roomTitle); // Устанавливаем заголовок
      }
    },
    
updateView() {
  try {
    const config = this.getCommonConfig(this.dID);
    if (!config) {
      console.warn('[MainBody] Конфигурация не загружена');
      this.viewArray = [];
      return;
    }

    // Автовыбор первой комнаты если текущая не существует
    if (this.currentSortType === 'rooms') {
      if (!config[this.getRoomKey]) {
        const firstRoomKey = Object.keys(config).find(key => config[key]?.sensors);
        if (firstRoomKey) {
          this.SET_ROOM_KEY(firstRoomKey);
          this.SET_ROOM_TITLE(config[firstRoomKey].title || `Комната ${firstRoomKey}`);
        }
      }
      this.viewArray = this.getSortedRooms(config, this.getRoomKey);
    } else {
      // Автовыбор первого параметра если текущий не существует
      const hasParam = Object.values(config).some(room => 
        room.sensors?.[this.getParamKey] !== undefined
      );
      
      if (!hasParam) {
        const allParams = new Set();
        Object.values(config).forEach(room => {
          if (room.sensors) Object.keys(room.sensors).forEach(k => allParams.add(k));
        });
        
        if (allParams.size > 0) {
          const firstParam = [...allParams][0];
          this.SET_PARAM_KEY(firstParam);
          this.$store.commit('sortParams/SET_PARAM_TITLE', firstParam);
        }
      }
      this.viewArray = this.getSortedParams(config, this.getParamKey);
    }
    
    console.log('[MainBody] Обновление viewArray:', this.viewArray);
  } catch (error) {
    console.error('[MainBody] Ошибка обновления вида:', error);
    this.viewArray = [];
  }
},
  getSortedRooms(config, roomKey) {
    if (!config || !roomKey || !config[roomKey]) {
      console.warn(`[MainBody] Комната ${roomKey} не найдена`);
      return [];
    }
    
    const room = config[roomKey];
    if (!room.sensors || typeof room.sensors !== 'object') {
      console.warn(`[MainBody] В комнате ${roomKey} нет датчиков`);
      return [];
    }

    return Object.entries(room.sensors).map(([sensorKey, sensorData]) => {
      return {
        title: sensorKey,
        value: parseFloat(sensorData.value) || 0,
        unit: this.getUnit(sensorKey),
        timeDiff: this.formatTime(sensorData.lastUpdate),
        roomTitle: room.title,
        roomId: room.id,
        paramKey: sensorKey,
        roomKey
      };
    });
  },
  
  getSortedParams(config, paramKey) {
    if (!config || !paramKey) return [];
    
    return Object.entries(config)
      .filter(([, room]) => room.sensors?.[paramKey] !== undefined)
      .map(([roomKey, room]) => {
        const sensorData = room.sensors[paramKey];
        return {
          title: room.title,
          value: parseFloat(sensorData.value) || 0,
          unit: this.getUnit(paramKey),
          timeDiff: this.formatTime(sensorData.lastUpdate),
          roomTitle: room.title,
          roomId: room.id,
          paramKey,
          roomKey
        };
      });
  },
  
  formatTime(timestamp) {
    if (!timestamp) return 'Неизвестно';
    
    try {
      const now = Date.now();
      const time = new Date(timestamp).getTime();
      
      if (isNaN(time)) return 'Неизвестно';
      
      const diff = Math.floor((now - time) / 60000); // разница в минутах
      
      if (diff < 1) return 'сейчас';
      if (diff < 60) return `${diff} мин назад`;
      if (diff < 1440) return `${Math.floor(diff / 60)} ч назад`;
      return `${Math.floor(diff / 1440)} дн назад`;
    } catch (e) {
      console.warn('Ошибка форматирования времени:', e);
      return 'Неизвестно';
    }
  }
  }
}
</script>

<style>
</style>