<template>

    <div v-if="isLoading" class="loading">Загрузка...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else id="app_mainBody" class="mainBody"
     @touchstart.passive="handleTouchStart" 
    @touchend.passive="handleTouchEnd">
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
        @touchstart.passive="selectItem(item)"
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
      initializationError: null,
      touchStartX: 0,
      isSwiping: false,
      swipeThreshold: 50, // минимальное расстояние для определения свайпа
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
      'getDeviceKey',
      'getDeviceTitle',
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
  initialSortType(newVal) {
    this.SET_SORT_TYPE(newVal);
    this.updateView();
    },
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
  getDeviceKey(newVal, oldVal) {
      console.log(`[MainBody] Изменен ключ устройства: ${oldVal} -> ${newVal}`);
      if (this.currentSortType === 'devices') this.updateView();
  },
  getConfig: {
    handler(newVal) {
      if (newVal) this.updateView();
    },
    deep: true
  },

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
      console.log(`[MainBody] - selectItem - Выбран параметр: ${JSON.stringify(item)}`);

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
      console.log(`[MainBody] - toggleSorting - Выбран параметр: ${JSON.stringify(item)}`);
      const newSortType = this.currentSortType === 'rooms' ? 'params' : 'rooms';
      this.SET_SORT_TYPE(newSortType);
      
      if (newSortType === 'params') {
        const baseParamKey = item.paramKey.replace(/\d+$/, '');
        this.SET_PARAM_KEY(baseParamKey);
        this.SET_ROOM_KEY(item.roomKey);
        this.$store.commit('sortParams/SET_PARAM_TITLE', this.getSensorTitle(baseParamKey));
      } else {
        this.SET_ROOM_KEY(item.roomKey);
        this.SET_ROOM_ID(item.roomId);
        this.$store.commit('sortParams/SET_ROOM_TITLE', item.roomTitle);
      }
      
      // Эмитируем событие для обновления навигации
      this.$emit('sorting-changed', newSortType);

    },
    async updateView() {
        try {
          //console.groupCollapsed('[MainBody] Обновление отображения');
          console.log('Шаг 4 - [MainBody] updateView started');
          const config = this.getConfig(this.dID);
          if (!config) {
            console.warn('Конфигурация не доступна');
            this.viewArray = [];
            return;
          }
          console.log('Шаг 5 - [MainBody] updateView Актуальный тип сортировки:', this.currentSortType);

          if (this.currentSortType === 'rooms') {
            console.log(`Режим: комнаты (${this.getRoomKey})`);
            this.viewArray = this.getSortedRooms(config, this.getRoomKey);
          } else if (this.currentSortType === 'params') {
            console.log(`Режим: параметров (${this.getParamKey})`);
          this.viewArray = this.getSortedParams(config, this.getParamKey);
        } else if (this.currentSortType === 'devices') {
          console.log(`Режим: Устройств (${this.getDeviceKey})`);
          this.viewArray = this.getSortedDevices(config, this.getDeviceKey);
        }
          
          console.log('Шаг 6 - [MainBody] updateView  Отображаемые элементы:', this.viewArray);
          console.log('[MainBody] View array length:', this.viewArray.length);
          console.groupEnd();
        } catch (error) {
          console.error('[MainBody] Ошибка обновления:', error);
          this.viewArray = [];
        }

    },
    // Формируем массив для отображения сортировки по комнатам
    // getSortedRooms(config, roomKey) {
    //   const room = config[roomKey];
    //   if (!room?.sensors) return [];
      
    //   return Object.entries(room.sensors).map(([sensorKey, sensorData]) => {
    //     //const sensorSet = room.setpoints?.[sensorKey];
    //     // Ищем соответствующую уставку
    //   let setValue = null;
    //   if (room.setpoints) {
    //   // Ищем ключ уставки, который соответствует префиксу сенсора
    //     const setpointKey = Object.keys(room.setpoints).find(setKey => 
    //       sensorKey.includes(setKey) || setKey.includes(sensorKey)
    //     );
        
    //     if (setpointKey) {
    //       setValue = room.setpoints[setpointKey]?.value != null 
    //         ? parseFloat(room.setpoints[setpointKey].value) 
    //         : null;
    //     }
    //   }

    //     return {         
    //       sortType: 'rooms',
    //       paramTitle: this.getSensorTitle(sensorKey),
    //       paramType: sensorData?.type != null ? sensorData.type : null,
    //       paramKey: sensorKey,
    //       value: this.getSensorValue(sensorData?.type, sensorData),
    //       setValue: setValue,
    //       unit: this.getUnit(sensorKey),
    //       timeDiff: this.getTimeDiff(sensorData.lastUpdate),
    //       roomTitle: room.title,
    //       roomId: room.id,
    //       roomKey
    //     };
    //   });
    // },

    getSortedRooms(config, roomKey) {
  const room = config[roomKey];
  if (!room) return [];
  
  const devicesArray = [];
  const excludedSections = ['init', 'id', 'group', 'title', 'setpoints'];

  // Проходим по всем разделам комнаты кроме исключенных
  Object.entries(room).forEach(([sectionKey, sectionData]) => {
    if (excludedSections.includes(sectionKey)) return;
    
    if (sectionData && typeof sectionData === 'object') {
      Object.entries(sectionData).forEach(([itemKey, itemData]) => {
        // Для каждого устройства ищем уставку
        let setValue = null;
        if (room.setpoints) {
          const setpointKey = Object.keys(room.setpoints).find(setKey => 
            itemKey.includes(setKey) || setKey.includes(itemKey)
          );
          
          if (setpointKey) {
            setValue = room.setpoints[setpointKey]?.value != null 
              ? parseFloat(room.setpoints[setpointKey].value) 
              : null;
          }
        }

        devicesArray.push({
          sortType: 'rooms',
          paramTitle: this.getSensorTitle(itemKey),
          paramType: itemData?.type,
          paramKey: itemKey,
          value: this.getSensorValue(itemData?.type, itemData),
          setValue: setValue,
          unit: this.getUnit(itemKey),
          timeDiff: this.getTimeDiff(itemData.lastUpdate),
          roomTitle: room.title,
          roomId: room.id,
          roomKey
        });
      });
    }
  });

  console.log(`[MainBody] - getSortedRooms - Найдено устройств в комнате ${roomKey}:`, devicesArray.length);
  return devicesArray;
},

    // Формируем массив для отображения сортировки по параметрам
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

    // Формируем массив для отображения сортировки по устройствам
    getSortedDevices(config, deviceKey) {
      console.log('ШАГ 0 - [MainBody] getSortedDevices Выполняем сортировку по deviceKey:', deviceKey);
  const devicesArray = [];
 
  Object.entries(config).forEach(([roomKey, room]) => {
    if (!room || typeof room !== 'object') {
      console.log('[MainBody] getSortedDevices  Room is not an object:', room);
      return

    }

    console.log('Шаг 6 - [MainBody] getSortedDevices - Работаем с комнатой:', roomKey);
    // Ищем во всех разделах комнаты кроме исключенных
    Object.entries(room).forEach(([sectionKey, sectionData]) => {
      const excludedSections = ['init', 'id', 'group', 'title', 'setpoints'];
      if (excludedSections.includes(sectionKey)) return;
      
      if (sectionData && typeof sectionData === 'object') {
        console.log('Шаг 7 - [MainBody] getSortedDevices - Processing section:', sectionKey);
        Object.entries(sectionData).forEach(([itemKey, itemData]) => {
          // Более гибкое сравнение ключей устройств
          const baseItemKey = itemKey.replace(/^[a-z]/, '').replace(/\d+$/, '');
          console.log('Шаг 8 - [MainBody] getSortedDevices - Item:', itemKey, 'Base item key:', baseItemKey);
          
          if (baseItemKey === deviceKey) {
            console.log('Шаг 9 - [MainBody] getSortedDevices - Ищем совподение с утройством:', itemKey);
            let setValue = null;
            
            // Поиск уставки
            if (room.setpoints) {
              const setpointKey = Object.keys(room.setpoints).find(setKey => 
                itemKey.includes(setKey) || setKey.includes(itemKey)
              );
              
              if (setpointKey) {
                setValue = room.setpoints[setpointKey]?.value != null 
                  ? parseFloat(room.setpoints[setpointKey].value) 
                  : null;
              }
            }
            
            devicesArray.push({
              sortType: 'devices',
              paramTitle: this.getSensorTitle(itemKey),
              paramType: itemData?.type,
              paramKey: itemKey,
              value: this.getSensorValue(itemData?.type, itemData),
              setValue: setValue,
              unit: this.getUnit(itemKey),
              timeDiff: this.getTimeDiff(itemData.lastUpdate),
              roomTitle: room.title,
              roomId: room.id,
              roomKey
            });
          }
        });
      }
    });
  });
  
  console.log('Devices found:', devicesArray.length);
  return devicesArray;
},
    // getSortedDevices(config, deviceKey) {
    //   const devicesArray = [];
      
    //   Object.entries(config).forEach(([roomKey, room]) => {
    //     // Ищем устройство во всех разделах комнаты
    //     Object.keys(room).forEach(sectionKey => {
    //       if (sectionKey === 'init' || sectionKey === 'id' || sectionKey === 'group' || sectionKey === 'title') return;
          
    //       if (room[sectionKey] && typeof room[sectionKey] === 'object') {
    //         Object.entries(room[sectionKey]).forEach(([itemKey, itemData]) => {
    //           // Проверяем, соответствует ли устройство искомому
    //           const baseItemKey = itemKey.replace(/^[a-z]/, '').replace(/\d+$/, '');
    //           if (baseItemKey === deviceKey) {
    //             let setValue = null;
                
    //             // Ищем уставку для этого устройства
    //             if (room.setpoints) {
    //               const setpointKey = Object.keys(room.setpoints).find(setKey => 
    //                 itemKey.includes(setKey) || setKey.includes(itemKey)
    //               );
                  
    //               if (setpointKey) {
    //                 setValue = room.setpoints[setpointKey]?.value != null 
    //                   ? parseFloat(room.setpoints[setpointKey].value) 
    //                   : null;
    //               }
    //             }
                
    //             devicesArray.push({
    //               sortType: 'devices',
    //               paramTitle: this.getSensorTitle(itemKey),
    //               paramType: itemData?.type,
    //               paramKey: itemKey,
    //               value: this.getSensorValue(itemData?.type, itemData),
    //               setValue: setValue,
    //               unit: this.getUnit(itemKey),
    //               timeDiff: this.getTimeDiff(itemData.lastUpdate),
    //               roomTitle: room.title,
    //               roomId: room.id,
    //               roomKey
    //             });
    //           }
    //         });
    //       }
    //     });
    //   });
      
    //   console.log('[MainBody] - getSorted Devices found:', devicesArray.length);
    //   return devicesArray;
    // },

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
    },

    handleTouchStart(event) {
      //console.log('[MainBody] - handleTouchStart ', event.touches[0].clientX, event.touches[0].clientY);
      this.touchStartX = event.touches[0].clientX;
      this.isSwiping = true;
    },
    handleTouchMove(event) {
      if (!this.isSwiping) return;
      
      const touchX = event.touches[0].clientX;
      const diffX = touchX - this.touchStartX;
      console.log('[MainBody] - handleTouchMove Смещение по Х', diffX);
    },

    handleTouchEnd(event) {

      if (!this.isSwiping ) return;
      this.isSwiping = false;
      
      const touchEndX = event.changedTouches[0].clientX;
      const diffX = touchEndX - this.touchStartX;
      console.log('[MainBody] - handleTouchEnd Смещение по Х', diffX);
      // Определяем минимальную длину свайпа для активации
      
      if (Math.abs(diffX) > this.swipeThreshold) {
        if (diffX > 0) {
          console.log('Свайп вправо');
          // Свайп вправо - назад
          this.$emit('swipe-back', '');
        } else {
          console.log('Свайп влево');
          // Свайп влево - вперед
          this.$emit('swipe-forward', '');
        }
      }
    },


  }
}
</script>

<style lang="css" src="@/assets/mainStyle.css"></style>