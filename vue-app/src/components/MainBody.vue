<template>

    <div v-if="isLoading" class="loading">Загрузка...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else id="app_mainBody" class="mainBody"
     @touchstart.passive="handleTouchStart" 
    @touchend.passive="handleTouchEnd">
      <MainBodyValue 
        v-for="(item, index) in viewArray"
        :key="`${index}-${item.paramKey}-${item.roomKey}-${item.deviceKey}-${item.setpointKey}`"
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

  props: {
  initialSortType: {
    type: String,
    default: 'rooms'
  },
  sortType: {
    type: String,
    required: true
  }
},
  computed: {
    ...mapGetters('config', ['isLoading', 'error', 'getConfig', 'clearKeySync']),
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
      'getSetpointKey',
      'getSetpointTitle',
      'getUnit']),
    ...mapGetters(['dID']),
    
   
    // sortingSubtitle() {
    //   return this.currentSortType === 'rooms' 
    //     ? `Комната: ${this.getRoomTitle}`
    //     : `Параметр: ${this.getSensorTitle(this.getParamKey)}`;
    // },
  isRoomSort() {
    return this.currentSortType === 'rooms';
  },
  },

  watch: {
    // dID: {
    //   handler(newVal) {
    //     if (newVal) {
    //       console.log('[MainBody] dID изменен:', newVal);
    //       this.updateView();
    //     }
    //   },
    //   immediate: true,
    //   deep: true
    // },
    '$store.state.sortParams.forceUpdate': {
      handler(newTimestamp) {
        if (newTimestamp) {
          //console.log('[MainBody] - Принудительное обновление view');
          this.updateView();
        }
      },
      immediate: true
    },
    // initialSortType(newVal) {
    //   this.SET_SORT_TYPE(newVal);
    //   this.updateView();
    //   },
    // currentSortType(newVal, oldVal) {
    //   console.log(`[MainBody] Изменен тип сортировки: ${oldVal} -> ${newVal}`);
    //   this.updateView();
    // },
    // getRoomKey(newVal, oldVal) {
    //   console.log(`[MainBody] Изменен ключ комнаты: ${oldVal} -> ${newVal}`);
    //   if (this.currentSortType === 'rooms') this.updateView();
    // },
    // getParamKey(newVal, oldVal) {
    //   console.log(`[MainBody] Изменен ключ параметра: ${oldVal} -> ${newVal}`);
    //   if (this.currentSortType === 'params') this.updateView();
    // },
    // getDeviceKey(newVal, oldVal) {
    //     console.log(`[MainBody] Изменен ключ устройства: ${oldVal} -> ${newVal}`);
    //     if (this.currentSortType === 'devices') this.updateView();
    // },
    // getSetpointKey(newVal, oldVal) {
    //     console.log(`[MainBody] Изменен ключ сортировки: ${oldVal} -> ${newVal}`);
    //     if (this.currentSortType === 'setpoints') this.updateView();
    // },
    getConfig: {
      handler(newVal) {
        if (newVal) this.updateView();
      },
      deep: true
    },
    sortType(newSortType) {
    // Реагируем на изменение sortType извне
    this.$store.commit('sortParams/SET_SORT_TYPE', newSortType);
    // this.initializeComponent();
  }
  },
  // mounted() {
  //   this.viewArray = localStorage.getItem('viewArray') ? JSON.parse(localStorage.getItem('viewArray')) : [];
  //   console.log('[MainBody] - nounted - View array length:', this.viewArray.length);
  //   this.updateView();
  // },
  methods: {
    ...mapMutations('sortParams', [
      'SET_SORT_TYPE', 
      'SET_ROOM_ID', 
      'SET_ROOM_KEY', 
      'SET_PARAM_KEY', 
      'SET_ROOM_TITLE', 
      'SET_PARAM_TITLE', 
      'SET_SETPOINT_KEY', 
      'SET_DEVICE_KEY', 
      'SET_DEVICE_TITLE', 
      'SET_SETPOINT_TITLE'
    ]),

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
             this.selectedItem.paramKey === item.paramKey &&
             this.selectedItem.deviceKey === item.deviceKey &&
             this.selectedItem.setpointKey === item.setpointKey;
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
          this.SET_DEVICE_KEY(item.deviceKey);
          this.SET_SETPOINT_KEY(item.setpointKey);

          // Отправляем событие с данными в DashBoard
          this.$emit('eventsMainBody', {
            action: 'show',
            data: {
              value: item.value,
              setValue: item.setValue,
              unit: item.unit,
              paramKey: item.paramKey,
              roomKey: item.roomKey,
              sortType: item.sortType,
              deviceKey: item.deviceKey,
              setpointKey: item.setpointKey
            }
          });
          //console.log(`[MainBody] - selectItem - Выбран параметр: ${JSON.stringify(item.action)}`);
          }
    },
  
    toggleSorting(item) { // Меняем сортировку комнаты/параметры при двойном клике по выбранной плашке
      //console.log(`[MainBody] - toggleSorting - Выбран параметр: ${JSON.stringify(item)}`);
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
    async updateView() { // Формируем массив для отображения пользователю в соответствии с типом сортировки и текущим ключем
        try {
          //console.groupCollapsed('[MainBody] - updateView ');
          //console.log('[MainBody] - updateView - started');
          const config = this.getConfig(this.dID);
          if (!config) {
            console.warn('[MainBody] - updateView - Конфигурация не доступна');
            this.viewArray = [];
            return;
          }
          //console.log('Актуальный тип сортировки:', this.currentSortType);
          //console.log('для конфигурации', config);

          if (this.currentSortType === 'rooms') {
            //console.log(`[MainBody] - updateView - Режим: комнаты -(${this.getRoomKey})`);
            this.viewArray = this.getSortedRooms(config, this.getRoomKey);
          } else if (this.currentSortType === 'params') {
            //console.log(`[MainBody] - updateView - Режим: параметров -(${this.getParamKey})`);
          this.viewArray = this.getSortedParams(config, this.getParamKey);
          } else if (this.currentSortType === 'devices') {
            //console.log(`[MainBody] - updateView - Режим: Устройств -(${this.getDeviceKey})`);
            this.viewArray = this.getSortedDevices(config, this.getDeviceKey);
          } else if (this.currentSortType === 'setpoints') {
            //console.log(`[MainBody] - updateView - Режим: Уставки -(${this.getSetpointKey})`);
            this.viewArray = this.getSortedSetpoints(config, this.getSetpointKey);
          }
        
        
          console.log('Шаг 6 - [MainBody] updateView  Отображаемые элементы:', this.viewArray);
          localStorage.setItem('viewArray', JSON.stringify(this.viewArray));
          //console.log('[MainBody] View array length:', this.viewArray.length);
          console.groupEnd();
        } catch (error) {
          console.error('[MainBody] Ошибка обновления:', error);
          this.viewArray = [];
        }

    },

    getSortedRooms(config, roomKey) {

      //console.groupCollapsed('[MainBody] - getSortedRooms');
      const room = config[roomKey];
      if (!room) return [];
     
      const devicesArray = [];
      const excludedSections = ['init', 'id', 'group', 'title', 'setpoints'];

      // Проходим по всем разделам комнаты кроме исключенных
      Object.entries(room).forEach(([sectionKey, sectionData]) => {
        if (excludedSections.includes(sectionKey)) return;
        
        if (sectionData && typeof sectionData === 'object') {
          Object.entries(sectionData).forEach(([itemKey, itemData]) => {

            const cleanKey = this.clearKeySync(itemKey);
            //console.log('[MainBody] getSortedRooms - Item:', cleanKey);
            // Для каждого устройства ищем уставку
            let setValue = null;
            if (room.setpoints) {
              const setpointKey = Object.keys(room.setpoints).find(setKey => 
                cleanKey.includes(setKey) || setKey.includes(cleanKey)
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

            const cleanKey = this.clearKeySync(sensorKey);
            let setValue = null;
          if (room.setpoints) {
            // Ищем ключ уставки, который соответствует префиксу сенсора
            const setpointKey = Object.keys(room.setpoints).find(setKey => 
              cleanKey.includes(setKey) || setKey.includes(cleanKey)
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
      console.log('[MainBody] - getSortedDevices - Выполняем сортировку по deviceKey:', deviceKey);
      const devicesArray = [];
    
      Object.entries(config).forEach(([roomKey, room]) => {
        if (!room || typeof room !== 'object') {
          console.log('[MainBody] getSortedDevices Комната:', room, ' не содержит объекты');
          return

        }

        //console.log('Шаг 6 - [MainBody] getSortedDevices - Работаем с комнатой:', roomKey);
        // Ищем во всех разделах комнаты кроме исключенных
        Object.entries(room).forEach(([sectionKey, sectionData]) => {
          const excludedSections = ['init', 'id', 'group', 'title', 'setpoints'];
          if (excludedSections.includes(sectionKey)) return;
          
          if (sectionData && typeof sectionData === 'object') {
            //console.log('Шаг 9 - [MainBody] getSortedDevices - Processing section:', sectionKey);
            Object.entries(sectionData).forEach(([itemKey, itemData]) => {

              const baseItemKey = itemKey.replace(/\d+$/, '');
              console.log('Шаг 10 - [MainBody] getSortedDevices - Item:', itemKey, 'Base item key:', baseItemKey, 'Device key:', deviceKey);
              
              if (baseItemKey === deviceKey) {

                const cleanKey = this.clearKeySync(itemKey);
                console.log('Шаг 11 - [MainBody] getSortedDevices - Ищем совподение с утройством:', cleanKey);
                let setValue = null;
                
                // Поиск уставки
                if (room.setpoints) {
                  const setpointKey = Object.keys(room.setpoints).find(setKey => 
                    cleanKey.includes(setKey) || setKey.includes(cleanKey)
                  );
                  
                  if (setpointKey) {
                    setValue = room.setpoints[setpointKey]?.value != null 
                      ? parseFloat(room.setpoints[setpointKey].value) 
                      : null;
                  }
                }
                
                devicesArray.push({
                  sortType: 'devices',
                  paramTitle: this.getSensorTitle(deviceKey),
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

    getSortedSetpoints(config, setpointKey) {
      console.log('[MainBody] - getSortedSetpoints - Выполняем сортировку по setpointKey:', setpointKey, 'в config:', config);
      const setpointsArray = [];
      
      Object.entries(config).forEach(([roomKey, room]) => {
        if (!room || typeof room !== 'object') {
          console.log('[MainBody] getSortedSetpoints Комната:', room, ' не содержит объекты');
          return;
        }

        // Проверяем наличие setpoints в комнате
        if (!room.setpoints || typeof room.setpoints !== 'object') {
          console.log('[MainBody] getSortedSetpoints Комната:', roomKey, ' не содержит setpoints');
          return;
        }
        Object.entries(room.setpoints).forEach(([setKey, setpointData]) => {
          // Проверяем, что ключ уставки начинается с нужного префикса
          if (setKey.includes(setpointKey)) {
            let newValue, newSet;
            //console.log('[MainBody] getSortedSetpoints - Найдено совпадение с ключом Уставки:', setKey);
            
            if (setKey.startsWith('s')) {
              newValue = this.getSensorValue(setpointData?.type, setpointData);
              newSet = this.getSensorValue(setpointData?.type, setpointData);
            } else if (setKey.startsWith('d')) { 
              newValue = this.getSensorValue(setpointData?.type, setpointData);
              newSet = null;
            }
            
            setpointsArray.push({
              sortType: 'setpoints',
              paramTitle: this.getSensorTitle(setKey),
              paramType: setpointData?.type,
              paramKey: setKey,
              value: newValue,
              setValue: newSet,
              unit: this.getUnit(setKey),
              timeDiff: this.getTimeDiff(setpointData?.lastUpdate),
              roomTitle: room.title,
              roomId: room.id,
              roomKey
            });
          }
        });
      });
      console.log('setpointsArray:', setpointsArray);
      console.log('Setpoints found:', setpointsArray.length);
      return setpointsArray;
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