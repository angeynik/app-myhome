<!-- components/MainBody.vue -->
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
import logger from '../store/modules/logger.js';

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
    ...mapGetters(['dID', 'typeSettingsItem']),
    
  isRoomSort() {
    return this.currentSortType === 'rooms';
  },
  },
  watch: {

    // '$store.state.sortParams.forceUpdate': {
    //   handler(newTimestamp) {
    //     if (newTimestamp) {
    //       logger.dev('[MainBody] - Watch - handler - Принудительное обновление view');
    //       console.log('[MainBody] - Watch - handler - Принудительное обновление view');
    //       this.updateView();
    //     }
    //   },
    //   immediate: true
    // },
    '$store.state.sortParams.forceUpdate': {
        handler(newTimestamp) {
          if (newTimestamp) {
          
            // Очищаем предыдущий таймаут, если он есть
            if (this.updateViewTimeout) {
              clearTimeout(this.updateViewTimeout);
              //console.log('[MainBody] - Очищен предыдущий таймаут');
            }
            
            // Устанавливаем новый таймаут с задержкой 100 мс
            this.updateViewTimeout = setTimeout(() => {
              logger.dev('[MainBody] - Watch - handler - Принудительное обновление view');
              console.log('[MainBody] - Watch - handler - Принудительное обновление view');
              this.updateView();
            }, 350);
          }
        },
        immediate: true
      },
    sortType(newSortType) {
    // Реагируем на изменение sortType извне
    this.$store.commit('sortParams/SET_SORT_TYPE', newSortType);
    // this.initializeComponent();
  },
  },
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
      logger.info(`[MainBody] - selectItem - Выбран параметр: ${JSON.stringify(item)}`);
      console.log(` -- %%%%%%%%%%%% - [MainBody] - selectItem - setpointKey: ${item.setpointKey}, deviceKey: ${item.deviceKey}, paramKey: ${item.paramKey}, roomKey: ${item.roomKey}`);
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
          this.SET_DEVICE_KEY(item.deviceKey);
          this.SET_SETPOINT_KEY(item.setpointKey);

          console.log (` -- %%%%%%%%%%%% - [MainBody] - selectItem - Обновлены ключи выбранного элемента: ${JSON.stringify(item)}`);
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
          console.log(`[MainBody] - selectItem - Выбран параметр: ${JSON.stringify(item.action)}`);
          }
    },
 
    // toggleSorting(item) { // Меняем сортировку комнаты/параметры при двойном клике по выбранной плашке
    //   logger.info(`[MainBody] - toggleSorting - Выбран параметр: ${JSON.stringify(item)}`);
    //   //console.log(`[MainBody] - toggleSorting - Выбран параметр: ${JSON.stringify(item)}`);
    //   const newSortType = this.currentSortType === 'rooms' ? 'params' : 'rooms';
    //   this.SET_SORT_TYPE(newSortType);
      
    //   if (newSortType === 'params') {
    //     const baseParamKey = item.paramKey.replace(/\d+$/, '');
    //     this.SET_PARAM_KEY(baseParamKey);
    //     this.SET_ROOM_KEY(item.roomKey);
    //     this.$store.commit('sortParams/SET_PARAM_TITLE', this.getSensorTitle(baseParamKey));
    //   } else {
    //     this.SET_ROOM_KEY(item.roomKey);
    //     this.SET_ROOM_ID(item.roomId);
    //     this.$store.commit('sortParams/SET_ROOM_TITLE', item.roomTitle);
    //   }
      
    //   // Эмитируем событие для обновления навигации
    //   this.$emit('sorting-changed', newSortType);

    // },
    toggleSorting(item) {
      console.log('[MainBody] - toggleSorting - Ключ выбранного элемента:', item.setpointKey, ' и значение:', item.setValue);
      let settingsType = this.typeSettingsItem || 'schedule';
      if (settingsType === 'schedule') {
        // Установить state    permitSchedule = true     в settingsConfig.js
        console.log ('[MainBody] - toggleSorting - Устанавливаем флаг работы с расписанием: ', settingsType);
      }
      this.$router.push({
        name: 'DashboardSettings',
        params: { settingsType }
      });
    },
    async updateView() { // Формируем массив для отображения пользователю в соответствии с типом сортировки и текущим ключем
      //console.log('[MainBody] - updateView - started');
        try {
          logger.info('[MainBody] - updateView - started');
          console.groupCollapsed('[MainBody] - updateView ');
          //console.log('[MainBody] - updateView - started');
          const config = this.getConfig(this.dID);
          if (!config) {
            logger.error('[MainBody] - updateView - Конфигурация не доступна');
            //console.warn('[MainBody] - updateView - Конфигурация не доступна');
            this.viewArray = [];
            return;
          }
          logger.dev('[MainBody] - updateView - Актуальный тип сортировки:', this.currentSortType);
          //console.log('Актуальный тип сортировки:', this.currentSortType);
          //console.log('для конфигурации', config);

          if (this.currentSortType === 'rooms') {
            logger.dev('[MainBody] - updateView - Режим: комнаты -(', this.getRoomKey, ')');
            //console.log(`[MainBody] - updateView - Режим: комнаты -(${this.getRoomKey})`);
            this.viewArray = this.getSortedRooms(config, this.getRoomKey);
          } else if (this.currentSortType === 'params') {
            logger.dev('[MainBody] - updateView - Режим: параметров -(', this.getParamKey, ')');
            //console.log(`[MainBody] - updateView - Режим: параметров -(${this.getParamKey})`);
          this.viewArray = this.getSortedParams(config, this.getParamKey);
          } else if (this.currentSortType === 'devices') {
            logger.dev('[MainBody] - updateView - Режим: Устройств -(', this.getDeviceKey, ')');
            //console.log(`[MainBody] - updateView - Режим: Устройств -(${this.getDeviceKey})`);
            this.viewArray = this.getSortedDevices(config, this.getDeviceKey);
          } else if (this.currentSortType === 'setpoints') {
            logger.dev('[MainBody] - updateView - Режим: Уставки -(', this.getSetpointKey, ')');
            //console.log(`[MainBody] - updateView - Режим: Уставки -(${this.getSetpointKey})`);
            this.viewArray = this.getSortedSetpoints(config, this.getSetpointKey);
          }
        
          logger.dev('[MainBody] updateView  Отображаемые элементы:', this.viewArray);
          //console.log(' [MainBody] updateView  Отображаемые элементы:', this.viewArray);
          localStorage.setItem('viewArray', JSON.stringify(this.viewArray));
          logger.dev('[MainBody] View array length:', this.viewArray.length);
          //console.log('[MainBody] View array length:', this.viewArray.length);
          //console.groupEnd();
        } catch (error) {
          logger.error('[MainBody] - updateView - Ошибка обновления:', error);
          //console.error('[MainBody] Ошибка обновления:', error);
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
            logger.dev('[MainBody] getSortedRooms - Item:', cleanKey);
            //console.log('[MainBody] getSortedRooms - Item:', cleanKey);
            // Для каждого устройства ищем уставку
            let setValue = null;
            let setpointKey = null;

            if (room.setpoints) {
              // setpointKey = Object.keys(room.setpoints).find(setKey => 
              //   cleanKey.includes(setKey) || setKey.includes(cleanKey)
              // );

              //console.log('983627  -- %%%%%%%%%%%% - [MainBody] getSortedRooms - Доступные уставки в room.setpoints:', Object.keys(room.setpoints));
              //console.log('983627  -- %%%%%%%%%%%% - [MainBody] getSortedRooms - Ищем для cleanKey:', cleanKey);
                
                setpointKey = Object.keys(room.setpoints).find(setKey => {
                  const result = setKey.toLowerCase().includes(cleanKey.toLowerCase());
                  //console.log(`[MainBody] getSortedRooms - Проверяем ${setKey} на наличие ${cleanKey}: ${result}`);
                  return result;
                });

              //console.log('[MainBody] getSortedRooms - Ключ параметра уставки:', setpointKey);
              if (setpointKey) {
                setValue = room.setpoints[setpointKey]?.value != null 
                  ? parseFloat(room.setpoints[setpointKey].value) 
                  : null;
              } else if (!setpointKey) {
                setValue = null;
                setpointKey = null;
              }
            }

            devicesArray.push({
              sortType: 'rooms',
              paramTitle: this.getSensorTitle(itemKey),
              paramType: itemData?.type,
              paramKey: itemKey,
              value: this.getSensorValue(itemData?.type, itemData),
              setValue: setValue,
              setpointKey: setpointKey,
              unit: this.getUnit(itemKey),
              timeDiff: this.getTimeDiff(itemData.lastUpdate),
              roomTitle: room.title,
              roomId: room.id,
              roomKey
            });
          });
        }
      });
      logger.dev(`[MainBody] - getSortedRooms - Найдено устройств в комнате ${roomKey}:`, devicesArray.length);
      console.log(`[MainBody] - getSortedRooms - Найдено устройств в комнате ${roomKey}:`, devicesArray);
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
            let setpointKey = null;
          if (room.setpoints) {
            // Ищем ключ уставки, который соответствует префиксу сенсора
            setpointKey = Object.keys(room.setpoints).find(setKey => 
              cleanKey.includes(setKey) || setKey.includes(cleanKey)
            );
            console.log('[MainBody] getSortedParams - Ключ параметра уставки:', setpointKey);
            if (setpointKey) {
              setValue = room.setpoints[setpointKey]?.value != null 
                ? parseFloat(room.setpoints[setpointKey].value) 
                : null;
            } else if (!setpointKey) {
                setValue = null;
                setpointKey = null;
              }
          }
          console.log('[MainBody] getSortedParams - Уставка:', setValue);
            
            sensors.push({
              sortType: 'params',
              paramTitle: this.getSensorTitle(paramPrefix), // Название типа параметра
              paramType: sensorData?.type,
              paramKey: sensorKey, // Полный ключ сенсора
              value: this.getSensorValue(sensorData?.type, sensorData),
              setValue: setValue,
              setpointKey: setpointKey,
              unit: this.getUnit(paramPrefix),
              timeDiff: this.getTimeDiff(sensorData.lastUpdate),
              roomTitle: room.title,
              roomId: room.id,
              roomKey
            });
          }
        });
      });
      logger.dev('[MainBody] - getSortedParams - Получен список сенсоров:', sensors);
      console.log('[MainBody] - getSortedParams - Получен список сенсоров:', sensors);
      return sensors;
    },

    // Формируем массив для отображения сортировки по устройствам
    getSortedDevices(config, deviceKey) {
      logger.dev('[MainBody] - getSortedDevices - Выполняем сортировку по deviceKey:', deviceKey);
      //console.log('[MainBody] - getSortedDevices - Выполняем сортировку по deviceKey:', deviceKey);
      const devicesArray = [];
    
      Object.entries(config).forEach(([roomKey, room]) => {
        if (!room || typeof room !== 'object') {
          logger.dev('[MainBody] getSortedDevices Комната:', room, ' не содержит объекты');
          //console.log('[MainBody] getSortedDevices Комната:', room, ' не содержит объекты');
          return
        }
        logger.dev('[MainBody] getSortedDevices - Работаем с комнатой:', roomKey);
        //console.log('[MainBody] getSortedDevices - Работаем с комнатой:', roomKey);
        // Ищем во всех разделах комнаты кроме исключенных
        Object.entries(room).forEach(([sectionKey, sectionData]) => {
          const excludedSections = ['init', 'id', 'group', 'title', 'setpoints'];
          if (excludedSections.includes(sectionKey)) return;
          
          if (sectionData && typeof sectionData === 'object') {
            logger.dev('[MainBody] getSortedDevices - Processing section:', sectionKey);
            //console.log('[MainBody] getSortedDevices - Processing section:', sectionKey);
            Object.entries(sectionData).forEach(([itemKey, itemData]) => {

              const baseItemKey = itemKey.replace(/\d+$/, '');
              logger.dev('[MainBody] getSortedDevices - Item:', itemKey, 'Base item key:', baseItemKey, 'Device key:', deviceKey);
              //console.log('[MainBody] getSortedDevices - Item:', itemKey, 'Base item key:', baseItemKey, 'Device key:', deviceKey);
              
              if (baseItemKey === deviceKey) {

                const cleanKey = this.clearKeySync(itemKey);
                logger.dev('[MainBody] getSortedDevices - Ищем совподение с утройством:', cleanKey);
                //console.log('[MainBody] getSortedDevices - Ищем совподение с утройством:', cleanKey);
                let setValue = null;
                let setpointKey = null;
                // Поиск уставки
                if (room.setpoints) {
                  setpointKey = Object.keys(room.setpoints).find(setKey => 
                    cleanKey.includes(setKey) || setKey.includes(cleanKey)
                  );
                  
                  if (setpointKey) {
                    setValue = room.setpoints[setpointKey]?.value != null 
                      ? parseFloat(room.setpoints[setpointKey].value) 
                      : null;
                  } else if (!setpointKey) {
                      setValue = null;
                      setpointKey = null;
                    }
                }
                
                devicesArray.push({
                  sortType: 'devices',
                  paramTitle: this.getSensorTitle(deviceKey),
                  paramType: itemData?.type,
                  paramKey: itemKey,
                  value: this.getSensorValue(itemData?.type, itemData),
                  setValue: setValue,
                  setpointKey: setpointKey,
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
     
      console.log('[MainBody] getSortedDevices - Devices found:', devicesArray.length);
      console.log('[MainBody] getSortedDevices - Devices array:', devicesArray);
      return devicesArray;
    },

    getSortedSetpoints(config, setpointKey) {
      logger.dev('[MainBody] - getSortedSetpoints - Выполняем сортировку по setpointKey:', setpointKey, 'в config:', config);
      //console.log('[MainBody] - getSortedSetpoints - Выполняем сортировку по setpointKey:', setpointKey, 'в config:', config);
      const setpointsArray = [];
      Object.entries(config).forEach(([roomKey, room]) => {
        if (!room || typeof room !== 'object') {
          logger.dev('[MainBody] getSortedSetpoints Комната:', room, ' не содержит объекты');
          //console.log('[MainBody] getSortedSetpoints Комната:', room, ' не содержит объекты');
          return;
        }

        // Проверяем наличие setpoints в комнате
        if (!room.setpoints || typeof room.setpoints !== 'object') {
          logger.dev('[MainBody] getSortedSetpoints Комната:', roomKey, ' не содержит setpoints');
          //console.log('[MainBody] getSortedSetpoints Комната:', roomKey, ' не содержит setpoints');
          return;
        }
        Object.entries(room.setpoints).forEach(([setKey, setpointData]) => {
          // Проверяем, что ключ уставки начинается с нужного префикса
          if (setKey.includes(setpointKey)) {
            let newValue, newSet, newSetpointKey;
            logger.dev('[MainBody] getSortedSetpoints - Найдено совпадение с ключом Уставки:', setKey);
            //console.log('[MainBody] getSortedSetpoints - Найдено совпадение с ключом Уставки:', setKey);
            
            if (setKey.startsWith('s')) {
              newValue = this.getSensorValue(setpointData?.type, setpointData);
              newSet = this.getSensorValue(setpointData?.type, setpointData);
              newSetpointKey = setpointKey;
            } else if (setKey.startsWith('d')) { 
              newValue = this.getSensorValue(setpointData?.type, setpointData);
              newSet = null;
              newSetpointKey = null;
            } else {
              newSet = null;
              newSetpointKey = null;
            }
            
            setpointsArray.push({
              sortType: 'setpoints',
              paramTitle: this.getSensorTitle(setKey),
              paramType: setpointData?.type,
              paramKey: setKey,
              value: newValue,
              setValue: newSet,
              setpointKey: newSetpointKey,
              unit: this.getUnit(setKey),
              timeDiff: this.getTimeDiff(setpointData?.lastUpdate),
              roomTitle: room.title,
              roomId: room.id,
              roomKey
            });
          }
        });
      });
      logger.dev('[MainBody] - getSortedSetpoints - setpointsArray:', setpointsArray, 'setpointsArray.length:', setpointsArray.length);
      console.log('[MainBody] getSortedSetpoints - Setpoints found:', setpointsArray.length);
      console.log('[MainBody] getSortedSetpoints - setpointsArray:', setpointsArray);
      
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
      logger.dev('[MainBody] - handleTouchStart ', event.touches[0].clientX, event.touches[0].clientY);
      //console.log('[MainBody] - handleTouchStart ', event.touches[0].clientX, event.touches[0].clientY);
      this.touchStartX = event.touches[0].clientX;
      this.isSwiping = true;
    },
    handleTouchMove(event) {
      if (!this.isSwiping) return;
      
      const touchX = event.touches[0].clientX;
      const diffX = touchX - this.touchStartX;
      logger.dev('[MainBody] - handleTouchMove Смещение по Х', diffX);
      //console.log('[MainBody] - handleTouchMove Смещение по Х', diffX);
    },

    handleTouchEnd(event) {

      if (!this.isSwiping ) return;
      this.isSwiping = false;
      
      const touchEndX = event.changedTouches[0].clientX;
      const diffX = touchEndX - this.touchStartX;
      logger.dev('[MainBody] - handleTouchEnd Смещение по Х', diffX);
      //console.log('[MainBody] - handleTouchEnd Смещение по Х', diffX);
      // Определяем минимальную длину свайпа для активации
      
      if (Math.abs(diffX) > this.swipeThreshold) {
        if (diffX > 0) {
          logger.dev('[MainBody] - handleTouchEnd Свайп вправо');
          //console.log('Свайп вправо');
          // Свайп вправо - назад
          this.$emit('swipe-back', '');
        } else {
          logger.dev('[MainBody] - handleTouchEnd Свайп влево');
          //console.log('Свайп влево');
          // Свайп влево - вперед
          this.$emit('swipe-forward', '');
        }
      }
    },


  }
}
</script>

<style lang="css" src="@/assets/mainStyle.css"></style>