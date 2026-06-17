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
      /> 
    </div>

</template>

<script>
import { mapGetters, mapMutations, mapActions} from 'vuex'
import MainBodyValue from './MainBodyValue.vue'
import logger from '../store/modules/logger.js';
import { parseMoscowDate } from '@/utils/timeUtils';
const EXCLUDED_SECTIONS = new Set(['init', 'id', 'group', 'title', 'setpoints']);
const STRIP_DIGITS = /\d+$/;

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
      doubleClickTimer: null, // Таймер для определения двойного клика
      pendingItem: null,
    }
  },

  props: {
    sortType: {
      type: String,
      required: true
    }
  },
  // async created() {
  //   // При создании компонента форсируем обновление view
  //   logger.dev('[MainBody] - created - Компонент создан');
  //   this.SET_ROOM_KEY(localStorage.getItem('roomKey'));
  //   this.SET_PARAM_KEY(localStorage.getItem('paramKey'));
  //   console.log('[MainBody] - created - roomKey:', this.getRoomKey, ' paramKey:', this.getParamKey);
  // },
  computed: {
    ...mapGetters('config', ['isLoading', 'error', 'getConfig', 'clearKeySync', 'clearKey_a']),
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
    ...mapGetters(['dID', 'typeSettingsKey']),
    
  },
  watch: {
    '$store.state.sortParams.forceUpdate': {
        handler(newTimestamp) {
          //console.log('[MainBody] - Watch - handler - Изменилась временная метка');
          if (newTimestamp) {
          
            // Очищаем предыдущий таймаут, если он есть
            if (this.updateViewTimeout) {
              clearTimeout(this.updateViewTimeout);
              //console.log('[MainBody] - Очищен предыдущий таймаут');
            }
            
            // Устанавливаем новый таймаут с задержкой 100 мс
            this.updateViewTimeout = setTimeout(() => {
              logger.dev('[MainBody] - Watch - handler - Принудительное обновление view');
              //console.log('[MainBody] - Watch - handler - Принудительное обновление view');
              this.updateView();
            }, 250);
          }
        },
        immediate: true
      },
    sortType(newSortType) {
      // Реагируем на изменение sortType извне
      this.$store.commit('sortParams/SET_SORT_TYPE', newSortType);
      // this.initializeComponent();
    },
    '$store.state.showSetpoint'(newVal) {
      if (newVal === false && this.selectedItem) {
        this.clearSelection();
      }
    },
  },
  methods: {
    ...mapMutations({
      SET_ROOM_KEY: 'SET_ROOM_KEY',
      SET_PARAM_KEY: 'SET_PARAM_KEY', 
      SET_DEVICE_KEY: 'SET_DEVICE_KEY', 
      SET_SETPOINT_KEY: 'SET_SETPOINT_KEY' 
    }),
    ...mapMutations('sortParams', ['SET_SORT_TYPE']),
    ...mapActions('sortParams', [
      'setLimits',
    ]),
    ...mapActions(['updateSettingsData', 'updatePayloadData']),

_resolveSetpoint(room, cleanKey) {
  if (!room?.setpoints || !cleanKey) return { setValue: null, setpointKey: null };

  // Строим ожидаемый ключ уставки: Temp → sTemp, Hum → sHum
  const sKey = 's' + cleanKey;

  // Точное совпадение — sTemp, sHum и т.д.
  let setpointKey = room.setpoints[sKey] ? sKey : null;

  if (!setpointKey) {
    // Partial match: ищем ключ который начинается с sKey (sTemp01, sHum02...)
    setpointKey = Object.keys(room.setpoints).find(k => k.startsWith(sKey)) ?? null;
  }

  if (!setpointKey) return { setValue: null, setpointKey: null };

  const spData = room.setpoints[setpointKey];
  
  // Для bool: null не показываем
  if (spData?.type === 'bool' && spData?.value === null) return { setValue: null, setpointKey: null };
  
  const spType = spData?.type ?? 'num';
  const setValue = this.getSensorValue(spType, { value: spData?.value });

  return { setValue, setpointKey };
},

// Строитель объекта элемента — единая схема для всех 4 функций
_buildItem(overrides) {
  return {
    key: null,
    sortType: null,
    paramTitle: null,
    paramType: null,
    paramKey: null,
    value: null,
    setValue: null,
    setpointKey: null,
    unit: null,
    timeDiff: null,
    roomTitle: null,
    roomId: null,
    roomKey: null,
    deviceKey: null,
    ...overrides,
  };
},
    

    getSensorValue(key, data) {
      switch (key) {
        case 'num':{
          const numValue = data?.value != null ? parseFloat(data.value) : 0;
          return numValue;
          }
        case 'bool':{
          const boolValue = data?.value != null ? data.value : null;
          //console.log('[MainBody] - getSensorValue - boolValue:', boolValue);
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
    // Если уже есть ожидающий элемент и это тот же – двойной тач
    if (this.doubleClickTimer && this.pendingItem === item) {
      clearTimeout(this.doubleClickTimer);
      this.doubleClickTimer = null;
      this.pendingItem = null;
      this.DclickSelectItem(item);  // вызываем двойное действие
      return;
    }
    
    // Первое нажатие – запоминаем элемент и запускаем таймер
    this.pendingItem = item;
    
    if (this.doubleClickTimer) {
      clearTimeout(this.doubleClickTimer);
    }
    
    this.doubleClickTimer = setTimeout(() => {
      this.singleClickAction(item);
      this.doubleClickTimer = null;
      this.pendingItem = null;
    }, 300); // 300 мс – типичный интервал для двойного тача
  },

  // singleClickAction(item) {
  //   // Вся логика, которая ранее была внутри setTimeout в selectItem
  //   const clearParam = 'd' + this.clearKeySync(item.paramKey);
  //   console.log('[MainBody] - singleClickAction - Исходный ключ:', item.paramKey, 'Очищенный:', clearParam);
    
  //   console.groupCollapsed('[MainBody] - selectItem (одинарный)');
  //   logger.dev(`[MainBody] - Выбран параметр: ${JSON.stringify(item, null, 2)}`);
    
  //   if (this.selectedItem === item) {
  //     // Скрыть панель уставки
  //     this.selectedItem = null;
  //     this.$emit('getComponentData', { 
  //       action: 'hide',
  //       updateState: {
  //         value: item.setValue,
  //         title: 'value',
  //         roomKey: clearParam,
  //         setpointKey: item.setpointKey
  //       }
  //     });
  //   } else {
  //     // Показать панель уставки
  //     this.selectedItem = item;
      
  //     this.updateSettingsData({ field: 'param', value: clearParam });
  //     this.updateSettingsData({ field: 'request', value: 'setpoints' });
  //     this.updatePayloadData({ 
  //       value: item.setValue,
  //       param: clearParam,
  //       setKey: item.setpointKey,
  //       id: item.roomId,
  //       room: item.roomKey
  //     });
      
  //     this.SET_ROOM_KEY(item.roomKey);
  //     this.SET_PARAM_KEY(clearParam);
  //     this.SET_DEVICE_KEY(item.deviceKey);
  //     this.SET_SETPOINT_KEY(item.setpointKey);
      
  //     this.setLimits({ param: clearParam, valueType: 'absolute' });
      
  //     if ((item.setValue !== undefined && item.setValue !== null) && clearParam && item.setpointKey) {
  //       this.$emit('getComponentData', {
  //         action: 'show',
  //         request: 'setpoints',
  //         updateState: {
  //           value: item.setValue,
  //           title: 'value',
  //           roomKey: clearParam,
  //           setpointKey: item.setpointKey
  //         }
  //       });
  //     } else {
  //       console.error(`Не определены значения уставки: ${item.setValue}, ключ параметра ${clearParam}, ключ уставки ${item.setpointKey}`);
  //     }
  //   }
  //   console.groupEnd();
  // },
singleClickAction(item) {
  const clearParam = this.clearKeySync(item.paramKey); // 'Temp', 'Switch' — без префикса, без цифр
  console.log('[MainBody] - singleClickAction - Исходный ключ:', item.paramKey, 'Очищенный:', clearParam);

    if (this.selectedItem === item) {
      // Скрыть панель уставки
      this.selectedItem = null;
      this.$emit('getComponentData', { 
        action: 'hide',
        updateState: {
          value: item.setValue,
          title: 'value',
          key:clearParam,
          roomKey: item.roomKey,
          paramKey: item.paramKey,
        }
      });
    } else {
      // Показать панель уставки
      this.selectedItem = item;
      this.updatePayloadData({ 
        value: item.setValue,
        param: item.paramKey,   // ← полный ключ из конфига
        key: clearParam,        // ← чистый базовый ключ
        setKey: item.setpointKey,
        id: item.roomId,
        room: item.roomKey
      });
      
      this.setLimits({ param: clearParam, valueType: 'absolute' });
      
      if ((item.setValue !== undefined && item.setValue !== null) && clearParam && item.setpointKey) {
        this.$emit('getComponentData', {
          action: 'show',
          request: 'setpoints',
          updateState: {
            value: item.setValue,
            title: 'value',
            key:clearParam,
            roomKey: item.roomKey,
            paramKey: item.paramKey,
          }
        });
      } else {
        console.error(`Не определены значения уставки: ${item.setValue}, ключ параметра ${clearParam}, ключ уставки ${item.setpointKey}`);
      }
    }
    this.SET_PARAM_KEY(item.paramKey);   // сохраняем полный ключ в localStorage/store
    console.groupEnd();
  },

  DclickSelectItem(item) {
      const clearParam = this.clearKeySync(item.paramKey);

      
      if (this.doubleClickTimer) {
        clearTimeout(this.doubleClickTimer);
        this.doubleClickTimer = null;
      }

      const config = this.getConfig(this.dID);
      if (!config) {
        console.error('Конфигурация не загружена');
        return;
      }
      const roomConfig = config[item.roomKey];
      console.log(roomConfig.setpoints , null, 2);

      if (!roomConfig || !roomConfig.setpoints || !item.setpointKey || !roomConfig.setpoints[item.setpointKey].value) {
        // Отображаем Уведомление для пользователя - PopupMenu.vue 
        this.$store.dispatch('popup/show', {
          message: `Уставка для параметра "${item.paramTitle}" в комнате "${item.roomTitle}" не настроена.`,
          type: 'warning',
          duration: 3000
        });
        return;
      }

      logger.dev('[MainBody] - DclickSelectItem - Ключ выбранного элемента:', clearParam, ' и значение:', item.setValue);
      console.groupCollapsed('[MainBody] - DclickSelectItem ');
      console.log('[MainBody] - DclickSelectItem - Ключ выбранного элемента:', clearParam, ' и значение:', item);
      if (!clearParam) {
        console.error (`[MainBody] - DclickSelectItem - Отсутствует ключ выбранного элемента:', ${clearParam}`);
        return; 
      }
      this.updatePayloadData({ 
        param: item.paramKey,
        key: clearParam,
        room: item.roomKey,
        config: this.typeSettingsKey,
        value: item.setValue
      });

      // this.updateSettingsData({ field: 'request', value: 'updateSchedules' });
      // this.updatePayloadData({ param: clearParam, room: item.roomKey, config: this.typeSettingsKey, value: item.setValue,});
      // console.log('[MainBody] - DclickSelectItem - ОБНОВИЛИ КЛЮЧ param в settingsData:',
      //   this.$store.state.setpointsManager?.settingsData?.payload?.param
      // );

      // Обновляем ключи в хранилище
          // this.SET_ROOM_KEY(item.roomKey);
          // this.SET_PARAM_KEY(clearParam);
          // this.SET_DEVICE_KEY(item.deviceKey);
          // this.SET_SETPOINT_KEY(item.setpointKey);

      let settingsType = this.typeSettingsKey || 'schedule';

      // Отправляем событие с данными в DashBoard
      console.log('[MainBody] - DclickSelectItem - Отправляем событие с данными в DashBoard, value: ', item.setValue, ', title: value');
          this.$emit('getComponentData', {
            action: 'hide',
            request: settingsType,
            updateState: {
              key: clearParam,
              value: item.setValue,
              title: 'value',
            }
          });

      this.$router.push({
        name: 'DashboardSettings',
        params: { settingsType }
      });
      console.groupEnd();
  },
  async updateView() { // Формируем массив для отображения пользователю в соответствии с типом сортировки и текущим ключем
      //console.log('[MainBody] - updateView - started');
        try {
          logger.info('[MainBody] - updateView - started');
          console.groupCollapsed('[MainBody] - updateView - Сортировка по - ', this.currentSortType);
          //console.log('[MainBody] - updateView - started');
          const config = this.getConfig(this.dID);
          if (!config) {
            logger.error('[MainBody] - updateView - Конфигурация не доступна');
            //console.warn('[MainBody] - updateView - Конфигурация не доступна');
            this.viewArray = [];
            return;
          }


          if (this.currentSortType === 'rooms') {
            logger.dev('[MainBody] - updateView - Сортировка по - ', this.currentSortType, ' - Режим: комнаты -(', this.getRoomKey, ')');
            //console.log(`[MainBody] - updateView - Сортировка по - ${this.currentSortType} - Режим: комнаты -(${this.getRoomKey})`);
            let checkKey = this.getRoomKey;

            if (!checkKey) {
              checkKey = 'room01';
            }
            // this.viewArray = this.getSortedRooms(config, this.getRoomKey);
            this.viewArray = this.getSortedRooms(config, checkKey);
          } else if (this.currentSortType === 'params') {
            logger.dev('[MainBody] - updateView - Сортировка по - ', this.currentSortType, ' - Режим: параметров -(', this.getParamKey, ')');
            console.log(`[MainBody] - updateView - Сортировка по - ${this.currentSortType} - Режим: параметров -(${this.getParamKey})`);
            let actualParam = this.getParamKey;
            if (actualParam.includes("Switch")) {
              actualParam = 'dTemp';
              this.SET_PARAM_KEY(actualParam);  // мутация из mapMutations
            }
            this.viewArray = this.getSortedParams(config, actualParam);
          } else if (this.currentSortType === 'devices') {
            logger.dev('[MainBody] - updateView - Сортировка по - ', this.currentSortType, ' - Режим: Устройств -(', this.getDeviceKey, ')');
            //console.log(`[MainBody] - updateView - Сортировка по - ${this.currentSortType} - Режим: Устройств -(${this.getDeviceKey})`);
            this.viewArray = this.getSortedDevices(config, this.getDeviceKey);
          } else if (this.currentSortType === 'setpoints') {
            logger.dev('[MainBody] - updateView - Сортировка по - ', this.currentSortType, ' - Режим: Уставки -(', this.getSetpointKey, ')');
            //console.log(`[MainBody] - updateView - Сортировка по - ${this.currentSortType} - Режим: Уставки -(${this.getSetpointKey})`);
            this.viewArray = this.getSortedSetpoints(config, this.getSetpointKey);
          }
        
          logger.dev('[MainBody] updateView  Отображаемые элементы:', this.viewArray);
          console.log(' [MainBody] updateView  Отображаемые элементы:', this.viewArray);
          localStorage.setItem('viewArray', JSON.stringify(this.viewArray));
          logger.dev('[MainBody] View array length:', this.viewArray.length);
          //console.log('[MainBody] View array length:', this.viewArray.length);
          //console.groupEnd();
        } catch (error) {
          logger.error('[MainBody] - updateView - Ошибка обновления:', error);
          //console.error('[MainBody] Ошибка обновления:', error);
          this.viewArray = [];
          console.groupEnd();
        }
        console.groupEnd();
  },


getSortedRooms(config, roomKey) {
  const room = config[roomKey];
  if (!room || typeof room !== 'object') return [];

  const result = [];

  for (const [sectionKey, sectionData] of Object.entries(room)) {
    if (EXCLUDED_SECTIONS.has(sectionKey)) continue;
    if (!sectionData || typeof sectionData !== 'object') continue;

    for (const [itemKey, itemData] of Object.entries(sectionData)) {
      const clearKey = this.clearKeySync(itemKey);
      // Вычисляем cleanKey один раз по чёткому правилу
      // const base = itemKey.slice(1).replace(STRIP_DIGITS, '');
      // const cleanKey = itemKey.startsWith('a')
      //   ? 's' + itemKey.slice(1)  // aSwitch01 → sSwitch01
      //   : 's' + base;             // dTemp01   → sTemp

      const { setValue, setpointKey } = this._resolveSetpoint(room, clearKey);

      result.push(this._buildItem({
        key: itemKey.slice(1).replace(STRIP_DIGITS, ''),
        sortType: 'rooms',
        paramTitle: this.getSensorTitle(itemKey),
        paramType: itemData?.type,
        paramKey: itemKey,
        value: this.getSensorValue(itemData?.type, itemData),
        setValue,
        setpointKey,
        unit: this.getUnit(itemKey),
        timeDiff: this.getTimeDiff(itemData?.lastUpdate),
        roomTitle: room.title,
        roomId: room.id,
        roomKey,
      }));
    }
  }

  return result;
},

//Формируем массив для отображения сортировки по параметрам
getSortedParams(config, paramPrefix) {
  const result = [];

  for (const [roomKey, room] of Object.entries(config)) {
    if (!room?.sensors || typeof room.sensors !== 'object') continue;

    for (const [sensorKey, sensorData] of Object.entries(room.sensors)) {
      if (!sensorKey.startsWith(paramPrefix)) continue;
      const clearKey = this.clearKeySync(sensorKey);
      // --- начало изменений ---
      // const base = sensorKey.slice(1).replace(STRIP_DIGITS, '');
      // const cleanKey = sensorKey.startsWith('a')
      //   ? 's' + sensorKey.slice(1)
      //   : 's' + base;
      // --- конец изменений ---

      const { setValue, setpointKey } = this._resolveSetpoint(room, clearKey);
      console.log('[MainBody] - getSortedParams - setpointKey:', setpointKey, 'setValue:', setValue);

      result.push(this._buildItem({
        key: sensorKey.slice(1).replace(STRIP_DIGITS, ''),
        sortType: 'params',
        paramTitle: this.getSensorTitle(paramPrefix),
        paramType: sensorData?.type,
        paramKey: sensorKey,
        value: this.getSensorValue(sensorData?.type, sensorData),
        setValue,
        setpointKey,
        unit: this.getUnit(paramPrefix),
        timeDiff: this.getTimeDiff(sensorData?.lastUpdate),
        roomTitle: room.title,
        roomId: room.id,
        roomKey,
      }));
    }
  }

  logger.dev('[MainBody] - getSortedParams - Получен список сенсоров:', result);
  console.log('[MainBody] - getSortedParams - Получен список сенсоров:', result);
  return result;
},


// Формируем массив для отображения сортировки по устройствам
getSortedDevices(config, deviceKey) {
  const result = [];

  for (const [roomKey, room] of Object.entries(config)) {
    if (!room || typeof room !== 'object') continue;

    for (const [sectionKey, sectionData] of Object.entries(room)) {
      if (EXCLUDED_SECTIONS.has(sectionKey)) continue;
      if (!sectionData || typeof sectionData !== 'object') continue;

      for (const [itemKey, itemData] of Object.entries(sectionData)) {
        const baseItemKey = itemKey.replace(STRIP_DIGITS, '');
        if (baseItemKey !== deviceKey) continue;
        const clearKey = this.clearKeySync(baseItemKey);

        // Вычисляем cleanKey по правилам из getSortedRooms
        // const base = itemKey.slice(1).replace(STRIP_DIGITS, '');
        // const cleanKey = itemKey.startsWith('a')
        //   ? 's' + itemKey.slice(1)
        //   : 's' + base;

        const { setValue, setpointKey } = this._resolveSetpoint(room, clearKey);

        result.push(this._buildItem({
          key: itemKey.slice(1).replace(STRIP_DIGITS, ''),
          sortType: 'devices',
          paramTitle: this.getSensorTitle(deviceKey),
          paramType: itemData?.type,
          paramKey: itemKey,
          value: this.getSensorValue(itemData?.type, itemData),
          setValue,
          setpointKey,
          unit: this.getUnit(itemKey),
          timeDiff: this.getTimeDiff(itemData?.lastUpdate),
          roomTitle: room.title,
          roomId: room.id,
          roomKey,
        }));
      }
    }
  }

  return result;
},

getSortedSetpoints(config, setpointKey) {
  const normalizedKey = setpointKey.replace(/\d+$/, '');
  console.log('[MainBody] - getSortedSetpoints - normalizedKey:', normalizedKey);
  const result = [];

  for (const [roomKey, room] of Object.entries(config)) {
    if (!room?.setpoints || typeof room.setpoints !== 'object') continue;

    for (const [setKey, spData] of Object.entries(room.setpoints)) {
      
      // ← ФИЛЬТР: оставляем только ключи совпадающие с normalizedKey
      const baseSetKey = setKey.replace(/\d+$/, '');
      if (baseSetKey !== normalizedKey) continue;

      if (!spData || spData.value === undefined) continue; // null разрешаем

      const spType = spData?.type ?? 'num';

      // Для bool: null/undefined → показываем как OFF (неинициализированный переключатель)
      let value;
      if (spType === 'bool') {
        value = this.getSensorValue('bool', { value: spData.value ?? false });
      } else {
        if (spData.value === null) continue; // для num null всё ещё пропускаем
        value = this.getSensorValue(spType, { value: spData.value });
        if (value === null || value === undefined) continue;
      }

      result.push(this._buildItem({
        key: setKey.slice(1).replace(STRIP_DIGITS, ''), // ← setKey вместо itemKey
        sortType: 'setpoints',
        paramTitle: this.getSensorTitle(normalizedKey),
        paramType: spType,
        paramKey: setKey,
        value: value,
        setValue: value,
        setpointKey: normalizedKey,
        unit: this.getUnit(normalizedKey),
        timeDiff: this.getTimeDiff(spData?.lastUpdate),
        roomTitle: room.title,
        roomId: room.id,
        roomKey,
      }));
    }
  }
  console.log('[MainBody] - getSortedSetpoints - Результат:', result);
  return result;
},


    getTimeDiff(timestamp) {
      if (!timestamp) return 'Неизвестно';
      //console.log('timestamp:', timestamp, '→ UTC:', new Date(timestamp).toISOString());
      let time;

      try {
        const now = Date.now();
        // const time = new Date(timestamp).getTime();
        // //console.log('[MainBody] getSortedSetpoints - getTimeDiff - Текущая дата', now, ' дата обновления - ', time);
        // if (isNaN(time)) return 'Неизвестно';

        if (typeof timestamp === 'number') {
          time = timestamp;
        } else if (typeof timestamp === 'string') {
          // Сначала пробуем распознать ваш московский формат
          time = parseMoscowDate(timestamp);
          // Если не удалось, пробуем стандартный парсинг
          if (isNaN(time)) {
            time = new Date(timestamp).getTime();
          }
        } else {
          return 'Неизвестно';
        }
        if (isNaN(time)) return 'Неизвестно';
        
        const diff = Math.floor((now - time) / 60000);
        //console.log('[MainBody] getSortedSetpoints - getTimeDiff - Результат -', diff);
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
      console.log('[MainBody] - handleTouchStart ', event.touches[0].clientX, event.touches[0].clientY);
      this.touchStartX = event.touches[0].clientX;
      this.isSwiping = true;
    },
    handleTouchMove(event) {
      if (!this.isSwiping) return;
      
      const touchX = event.touches[0].clientX;
      const diffX = touchX - this.touchStartX;
      logger.dev('[MainBody] - handleTouchMove Смещение по Х', diffX);
      console.log('[MainBody] - handleTouchMove Смещение по Х', diffX);
    },
    handleTouchEnd(event) {
      if (!this.isSwiping ) return;
      this.isSwiping = false;
      
      const touchEndX = event.changedTouches[0].clientX;
      const diffX = touchEndX - this.touchStartX;
      logger.dev('[MainBody] - handleTouchEnd Смещение по Х', diffX);
      console.log('[MainBody] - handleTouchEnd Смещение по Х', diffX);
      // Определяем минимальную длину свайпа для активации
      this.$emit('swipe', diffX);
    },
    clearSelection() {
      console.log('[MainBody] - clearSelection ВЫЗВАН, selectedItem =', this.selectedItem);
      if (this.selectedItem) {
        logger.dev('[MainBody] - clearSelection - сбрасываем выделение');
        console.log('[MainBody] - clearSelection - сбрасываем выделение');
        this.selectedItem = null;
        // Также сбрасываем ожидание двойного клика, чтобы не было артефактов
        if (this.doubleClickTimer) {
          clearTimeout(this.doubleClickTimer);
          this.doubleClickTimer = null;
        }
        this.pendingItem = null;
      }
    },


  }
}
</script>

<style lang="css" src="@/assets/mainStyle.css"></style>