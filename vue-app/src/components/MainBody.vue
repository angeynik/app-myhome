<template>
  <div id="app_mainBody" class="mainBody">
    <!-- <h1> {{ currentViewTitle }}</h1> -->
    <div v-if="isLoading" class="loading">Загрузка...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else >
    <!-- <div class="subheader">
        {{ sortingSubtitle }}
    </div> -->
      <!-- <MainBodyValue 
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
      />  -->
    <MainBodyValue 
        v-for="(item, index) in viewArray"
        :key="`${index}-${item.paramKey}-${item.roomKey}`"
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
        return `Параметр: ${this.getParamTitle}`;
      }
    },
    sortingSubtitle() {
      if (this.currentSortType === 'rooms') {
        return `Комната: ${this.getRoomTitle}`;
      } else {
        return `Параметр: ${this.getParamTitle}`;
      }
    },
  humanParamTitle() {
    return this.getHumanParamTitle(this.getParamKey);
  },
  },
  watch: {
    currentSortType() {
    console.log('[MainBody] Смена типа сортировки:', this.currentSortType);
      this.updateView();
    },
    getRoomKey() {
      if (this.currentSortType === 'rooms') {
        console.log('[MainBody] Смена комнаты:', this.getRoomKey);
        this.updateView();
      }
    },
    getParamKey() {
      if (this.currentSortType === 'params') {
        console.log('[MainBody] Смена параметра:', this.getParamKey);
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
        console.log('[MainBody] Определение единиц измерения для:', key);
        if (key.includes('Temp')) return '°C';
        if (key.includes('Hum')) return '%';
        if (key.includes('Press')) return 'hPa';
        if (key.includes('Power')) return 'W';
        return '';
    },
  getSensorTitle(key) {
    // Убираем цифры из ключа для получения базового типа
    const baseKey = key.replace(/\d+/g, '');
    const mappings = {
      'dHum': 'Влажность',
      'dTemp': 'Температура',
      'dPress': 'Давление',
      'dPower': 'Потребление',
      // Добавьте другие маппинги по необходимости
    };
   
    // Ищем подходящее отображение
    // for (const [prefix, title] of Object.entries(mappings)) {
    //   if (key.includes(prefix)) {
    //     return title;
    //   }
    // }
    
    // Возвращаем оригинальный ключ, если не нашли соответствия
  return mappings[baseKey] || key;
  },
    isSelected(item) {
      if (!this.selectedItem) return false;
      const isSelected = this.selectedItem.roomId === item.roomId && 
             this.selectedItem.paramKey === item.paramKey;
      console.log(`[MainBody] Проверка выделения: ${item.paramKey} в ${item.roomKey} -> ${isSelected}`);
      return isSelected;
    },
    
    selectItem(item) {
      console.log(`[MainBody] Клик на элементе: ${item.paramKey} в ${item.roomKey}`);
      
      if (this.selectedItem && 
          this.selectedItem.roomId === item.roomId && 
          this.selectedItem.paramKey === item.paramKey) {
        this.selectedItem = null;
        console.log('[MainBody] Элемент снят с выделения');
      } else {
        this.selectedItem = { ...item };
        console.log('[MainBody] Элемент выделен:', this.selectedItem);
      }
    },
    
    toggleSorting(item) {
      if (this.currentSortType === 'rooms') {
        console.log('[MainBody] Переключение на сортировку по параметрам');
        this.SET_SORT_TYPE('params');
        this.SET_PARAM_KEY(item.paramKey);
        //this.$store.commit('sortParams/SET_PARAM_TITLE', item.paramTitle); // Устанавливаем заголовок
        this.$store.commit('sortParams/SET_PARAM_TITLE', this.getHumanParamTitle(item.paramKey));
      } else {
        console.log('[MainBody] Переключение на сортировку по комнатам');
        this.SET_SORT_TYPE('rooms');
        this.SET_ROOM_KEY(item.roomKey);
        this.SET_ROOM_ID(item.roomId);
        this.$store.commit('sortParams/SET_ROOM_TITLE', item.roomTitle); // Устанавливаем заголовок
      }
    },
    

    updateView() {
      console.log('[MainBody] Обновление вида...');
      try {
        const config = this.getCommonConfig(this.dID);
        console.log('[MainBody] Получена конфигурация:', config);
        
        if (!config) {
          console.warn('[MainBody] Конфигурация не загружена');
          this.viewArray = [];
          return;
        }

        // Автовыбор комнаты если текущая не существует
        if (this.currentSortType === 'rooms') {
          console.log('[MainBody] Режим: сортировка по комнатам');
          console.log('[MainBody] Текущая комната:', this.getRoomKey);
          
          if (!config[this.getRoomKey]) {
            console.log('[MainBody] Комната не найдена, ищем первую доступную');
            
            const validRooms = Object.keys(config).filter(key => 
              config[key]?.sensors && Object.keys(config[key].sensors).length > 0
            );
            
            if (validRooms.length > 0) {
              const firstRoomKey = validRooms[0];
              const room = config[firstRoomKey];
              console.log('[MainBody] Найдена комната:', firstRoomKey);
              
              this.SET_ROOM_KEY(firstRoomKey);
              this.SET_ROOM_TITLE(room.title || firstRoomKey);
              this.SET_ROOM_ID(room.id || 0);
            } else {
              console.warn('[MainBody] Не найдено ни одной комнаты с датчиками');
            }
          }
          
          this.viewArray = this.getSortedRooms(config, this.getRoomKey);
          console.log('[MainBody] Данные для комнаты:', this.viewArray);
        } 
        // Режим сортировки по параметрам
        else {
          console.log('[MainBody] Режим: сортировка по параметрам');
          console.log('[MainBody] Текущий параметр:', this.getParamKey);
          
          // Проверяем существует ли параметр хотя бы в одной комнате
          const paramExists = Object.values(config).some(room => 
            room.sensors?.[this.getParamKey] !== undefined
          );
          
          if (!paramExists) {
            console.log('[MainBody] Параметр не найден, ищем доступные');
            
            const allParams = new Set();
            Object.values(config).forEach(room => {
              if (room.sensors) {
                Object.keys(room.sensors).forEach(k => allParams.add(k));
              }
            });
            
            if (allParams.size > 0) {
              const firstParam = [...allParams][0];
              console.log('[MainBody] Выбран первый доступный параметр:', firstParam);
              
              this.SET_PARAM_KEY(firstParam);
              this.SET_PARAM_TITLE(firstParam);
            } else {
              console.warn('[MainBody] Не найдено ни одного параметра');
            }
          }
          
          this.viewArray = this.getSortedParams(config, this.getParamKey);
          console.log('[MainBody] Данные для параметра:', this.viewArray);
        }
      } catch (error) {
        console.error('[MainBody] Ошибка обновления вида:', error);
        this.viewArray = [];
      }
    },
  getSortedRooms(config, roomKey) {
    console.log(`[MainBody] Формирование данных для комнаты: ${roomKey}`);
    if (!config || !roomKey || !config[roomKey]) {
      console.warn(`[MainBody] Комната ${roomKey} не найдена`);
      return [];
    }
    
    const room = config[roomKey];
    console.log(`[MainBody] - getSortedRooms - Данные комнаты:`, room);
    if (!room.sensors || typeof room.sensors !== 'object' || Object.keys(room.sensors).length === 0) {
      console.warn(`[MainBody] В комнате ${roomKey} нет датчиков`);
      return [];
    }

    const result = Object.entries(room.sensors).map(([sensorKey, sensorData]) => {
        const item = {
          paramTitle: this.getSensorTitle(sensorKey),
          //title: this.getSensorTitle(sensorKey),
          title: room.title, // Информация о комнате
          paramKey: sensorKey,
          value: parseFloat(sensorData.value) || 0,
          unit: this.getUnit(sensorKey),
          timeDiff: this.getTimeDiff(sensorData.lastUpdate),
          roomTitle: room.title,
          roomId: room.id,

          roomKey
        };
        
        console.log(`[MainBody] Добавлен датчик: ${sensorKey} = ${sensorData.value}`);
        return item;
      });
      
      console.log(`[MainBody] Всего датчиков в комнате: ${result.length}`);
      return result;
  },
  
  getSortedParams(config, paramKey) {
    console.log(`[MainBody] Формирование данных для параметра: ${paramKey}`);
      if (!config || !paramKey) {
        console.warn('[MainBody] Неверные входные данные');
        return [];
      }
   
      console.log(`[MainBody] - getSortedParams - Данные комнаты:`, paramKey);
      const result = Object.entries(config)
        .filter(([roomKey, room]) => {
          const exists = room.sensors?.[paramKey] !== undefined;
          console.log(`[MainBody] Проверка комнаты ${roomKey}: ${exists ? 'есть' : 'нет'} параметра`);
          return exists;
        })
        .map(([roomKey, room]) => {
          const sensorData = room.sensors[paramKey];
          const item = {
            paramTitle: this.getSensorTitle(paramKey),
            title: this.getSensorTitle(paramKey),
            paramKey: paramKey,
            value: parseFloat(sensorData.value) || 0,
            unit: this.getUnit(paramKey),
            timeDiff: this.getTimeDiff(sensorData.lastUpdate),
            roomTitle: room.title,
            roomId: room.id,
            roomKey: roomKey
          };
          
          console.log(`---308--- [MainBody] Добавлена комната ${roomKey}: ${sensorData.value} paramTitle - ${this.getSensorTitle(paramKey)}`);
          return item;
        });
      
      console.log(`[MainBody] Всего комнат с параметром: ${result.length}`);
      return result;
  },
  getTimeDiff(timestamp) {
      if (!timestamp) {
        console.log('[MainBody] Время не указано');
        return 'Неизвестно';
      }
    
    try {
        console.log(`[MainBody] Форматирование времени: ${timestamp}`);
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