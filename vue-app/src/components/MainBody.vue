<template>
  <div id="app_mainBody" class="mainBody">
    <h1>{{ currentViewTitle }}</h1>
    <div v-if="isLoading" class="loading">Загрузка...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
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
    ...mapGetters('sortParams', ['currentSortType', 'getRoomId', 'getRoomKey', 'getParamKey']),
    ...mapGetters(['dID']),
    
    currentViewTitle() {
      if (this.currentSortType === 'rooms') {
        return `Комната: ${this.getRoomKey}`;
      } else {
        return `Параметр: ${this.getParamKey}`;
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
    ...mapMutations('sortParams', ['SET_SORT_TYPE', 'SET_ROOM_ID', 'SET_ROOM_KEY', 'SET_PARAM_KEY']),
    
    getUnit(key) {
      if (key.includes('temp')) return '°C';
      if (key.includes('hum')) return '%';
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
      } else {
        this.SET_SORT_TYPE('rooms');
        this.SET_ROOM_KEY(item.roomKey);
        this.SET_ROOM_ID(item.roomId);
      }
    },
    
    updateView() {
      const config = this.getCommonConfig(this.dID);
      if (!config) return;
      
      if (this.currentSortType === 'rooms') {
        this.viewArray = this.getSortedRooms(config, this.getRoomKey);
      } else {
        this.viewArray = this.getSortedParams(config, this.getParamKey);
      }
    },
    
    getSortedRooms(config, roomKey) {
      if (!config || !roomKey || !config[roomKey]) return [];
      
      const room = config[roomKey];
      return Object.entries(room.sensors).map(([sensorKey, value]) => {
        return {
          title: sensorKey,
          value,
          unit: this.getUnit(sensorKey),
          timeDiff: this.formatTime(room.time[`${sensorKey}_time`]),
          roomTitle: room.title,
          roomId: room.id,
          paramKey: sensorKey,
          roomKey
        };
      });
    },
    
    getSortedParams(config, paramKey) {
      if (!config || !paramKey) return [];
      
      const result = [];
      for (const roomKey in config) {
        const room = config[roomKey];
        if (room.sensors && room.sensors[paramKey] !== undefined) {
          result.push({
            title: room.title,
            value: room.sensors[paramKey],
            unit: this.getUnit(paramKey),
            timeDiff: this.formatTime(room.time[`${paramKey}_time`]),
            roomTitle: room.title,
            roomId: room.id,
            paramKey,
            roomKey
          });
        }
      }
      return result;
    },
    
    formatTime(timestamp) {
      if (!timestamp) return 'Неизвестно';
      const now = new Date();
      const time = new Date(timestamp);
      const diff = Math.floor((now - time) / 60000); // разница в минутах
      
      if (diff < 1) return 'Только что';
      if (diff < 60) return `${diff} мин назад`;
      return `${Math.floor(diff / 60)} ч назад`;
    }
  }
}
</script>

<style>
</style>

<!-- <template>
  <div id="app_mainBody" class="mainBody">
    <h1>{{ currentViewTitle }}</h1>
    <div v-if="isLoading" class="loading">Загрузка...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <MainBodyValue 
        v-for="(item, index) in viewArray"
        :key="index"
        :title="item.Title"
        :value="item.value"
        :unit="getUnit(item.paramKey)"
        :timeUpdated="item.timeDiff"
        :roomTitle="item.roomTitle"
        :isSelected="isSelected_(item.roomId, item.paramKey)"
        @click="selectItem(item)"
        @dblclick="sortingDoubleClick(item)"
      />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import MainBodyValue from './MainBodyValue.vue'

export default {
    name: 'MainBody',
    components: { MainBodyValue},
    data() {
        return {
            selectedItem: null,
            viewArray: [], // Массив для отображаемых элементов
            commonConfig: null, // Конфигурация
        }
    },
    mounted() {
        this.init();
    },
    beforeUnmount() {
    },
    computed: {
    ...mapGetters('config', ['getSensorData', 'isLoading', 'error']),
    ...mapGetters('sortParams', ['currentSortType', 'currentRoom', 'currentParam']),
    ...mapGetters(['dID']),

    currentViewTitle() {
      return this.currentSortType === 'rooms' 
        ? `Данные комнаты: ${this.currentRoom?.title || 'Не выбрана'}` 
        : `Параметр: ${this.currentParam?.title || 'Не выбран'}`
    },
    
    displayedItems() {
      if (this.currentSortType === 'rooms') {
        return this.getRoomItems(this.currentRoom?.id)
      } else {
        return this.getParamItems(this.currentParam?.key)
      }
    },
        // currentRoom() {
        //     const { sortType, roomId, roomKey, roomTitle, paramKey } = this.getAllParams
        //     return { sortType: sortType, roomId: roomId, roomKey: roomKey, roomTitle: roomTitle, paramKey: paramKey }
        // }
    },

    methods: {
    ...mapActions('config', ['initialize']),
    ...mapActions('sortParams', ['SET_ROOM_ID', 'SET_PARAM_KEY', 'SET_ROOM_KEY', 'SET_SORT_TYPE']),
    ...mapActions('log', ['sendLogToServer']),

    // getParamItems(paramKey) {
    //   if (!paramKey) return []
    //   // Логика для отображения одного параметра в разных комнатах
    //   return []
    // },
    
    // getParamTitle(key) {
    //   // Получаем человекочитаемое название параметра
    //   return key // Заменить на реальную логику
    // },
    
    // getParamUnit(key) {
    //   // Получаем единицы измерения
    //   if (key.includes('temp')) return '°C'
    //   if (key.includes('hum')) return '%'
    //   return ''
    // },
    
    // isSelected(item) {
    //   return this.selectedItem?.id === item.id
    // },
    
    // selectItem(item) {
    //   this.selectedItem = this.selectedItem?.id === item.id ? null : item
    // },

    getUnit(key) {
      if (key.includes('temp')) return '°C'
      if (key.includes('hum')) return '%'
      return ''
    },
    
    isSelected_(id, paramKey) {
      return this.selectedItem?.roomId === id && this.selectedItem?.paramKey === paramKey;
    },
    
    selectItem(item) {
      this.selectedItem = this.selectedItem?.roomId === item.roomId && 
                         this.selectedItem?.paramKey === item.paramKey 
                         ? null : item;
    },



    // async init () {
    //         console.log('INIT - Инициализация');
    //             try {
    //                 this.commonConfig = JSON.parse(localStorage.getItem('commonConfig'));
                
    //             if (!this.commonConfig) {
    //                 console.log('Конфигурация commonConfig не загружена');
    //                 await this.sendLogToServer({
    //                     type: 'warning',
    //                     message: `Конфигурация commonConfig не загружена`
    //                 });
    //             }
    //             this.selectSorting(this.currentRoom.sortType); // Выбор сортировки
    //             } catch (error) {
    //                 await this.sendLogToServer({
    //                 type: 'error',
    //                 message: `INIT - ошибка процесса инициализации параметров ${error}'`
    //                 });
    //             }

    // },

        async init() {
        try {
            // Инициализируем хранилище
            await this.initialize();
            
            // Получаем конфигурацию из Vuex
            this.commonConfig = this.getCommonConfig(this.dID);
            
            if (!this.commonConfig) {
                console.log('Конфигурация не загружена');
                await this.sendLogToServer({
                    type: 'warning',
                    message: `Конфигурация не загружена`
                });
                return;
            }
            
            // Применяем сортировку
            this.selectSorting(this.currentSortType);
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            await this.sendLogToServer({
                type: 'error',
                message: `Ошибка инициализации: ${error}`
            });
        }
    },
    selectSorting(sort_type) {
        console.log('Выбор сортировки:', sort_type);
        try {
            let sortArray = [];
            
            switch (sort_type) {
                case 'rooms':
                    sortArray = this.getSortedRooms(
                        this.commonConfig, 
                        this.getRoomKey
                    );
                    break;
                    
                case 'params':
                    sortArray = this.getSortedParams(
                        this.commonConfig, 
                        this.getParamKey
                    );
                    break;
                    
                default:
                    console.error('Неизвестный тип сортировки:', sort_type);
                    break;
            }
            
            this.viewArray = sortArray || [];
            
        } catch (error) {
            console.error('Ошибка сортировки:', error);
            this.sendLogToServer({
                type: 'error',
                message: `Ошибка сортировки: ${error}`
            });
        }
    },

    getSortedRooms(config, roomKey) {
        console.log('getSortedRooms - Функция getSortedRooms (MainBody) - Приступаем к сортировке по комнатам. Массив:', config, 'roomKey:', roomKey);
    try {
        // 1. Добавляем проверку входных параметров
        if (!config || typeof config !== 'object') {
            throw new Error('Некорректный конфиг')
        }

        const roomConfig = config[roomKey]
        if (!roomConfig || !roomConfig.sensors) {
            console.warn(`Комната ${roomKey} не найдена или нет сенсоров`)
            return []
        }

        // 2. Используем современный синтаксис с reduce
        return Object.entries(roomConfig.sensors).reduce((acc, [sensorKey, sensorValue]) => {
            try {
                // 3. Выносим повторяющиеся вычисления в отдельные переменные
                const sensorTime = roomConfig.time[`${sensorKey}_time`]
                const timeDiff = this.calculateTime(sensorTime ? new Date(sensorTime) : null)
                
                // 4. Добавляем проверку для findParamTitleRu
                const paramInfo = this.findParamTitleRu(config, sensorKey) || {}
                
                // 5. Собираем объект данных
                const sensorData = {
                    Title: paramInfo.titleRu || 'Неизвестный параметр',
                    value: sensorValue,
                    paramTitle: paramInfo.titleRu || 'Неизвестный параметр',
                    group: roomConfig.group || 'default',
                    timeDiff: timeDiff || 'Нет данных',
                    roomId: roomConfig.id,
                    roomTitle: roomConfig.title || 'Без названия',
                    paramKey: paramInfo.title || sensorKey,
                    roomKey: roomKey
                }
console.log('211 -sensorData:', sensorData);
                return [...acc, sensorData]
            } catch (error) {
                console.error(`Ошибка обработки сенсора ${sensorKey}:`, error)
                return acc
            }
        }, [])
    } catch (error) {
        console.error('Ошибка в getSortedRooms:', error)
        this.sendLogToServer({
            type: 'error',
            message: `getSortedRooms: ${error.message}`
        })
        return []
    }
},

    getSortedParams() {
        try {
            // 1. Получаем данные из Vuex
            const { getParamKey} = this.$store.getters['sortParams'];
            const config = this.$store.getters['config/getCommonConfig']; // Предполагаем существование модуля config
            
            // 2. Валидация входных данных
            if (!config || typeof config !== 'object') {
                throw new Error('Некорректный формат конфигурации');
            }

            const paramKey = getParamKey;
            if (!paramKey || typeof paramKey !== 'string') {
                throw new Error('Некорректный ключ параметра');
            }

            // 3. Поиск сенсоров с использованием современных методов
            const rooms = Object.values(config).filter(room => 
                room?.sensors && typeof room.sensors === 'object'
            );

            const foundSensors = rooms.flatMap(room => {
                return Object.entries(room.sensors)
                    .filter(([sensorKey]) => sensorKey.includes(paramKey))
                    .map(([sensorKey, sensorValue]) => ({
                        room,
                        sensorKey,
                        sensorValue
                    }));
            });

            // 4. Обработка и форматирование данных
            return foundSensors.map(({ room, sensorKey, sensorValue }) => {
                try {
                    const paramInfo = this.findParamTitleRu(config, sensorKey) || {
                        title: sensorKey,
                        titleRu: `Неизвестный параметр (${sensorKey})`
                    };

                    return {
                        Title: room.title || 'Без названия',
                        value: this.formatSensorValue(sensorValue),
                        roomTitle: room.title || 'Без названия',
                        group: room.group || 'Без группы',
                        timeDiff: this.calculateTimeSafe(room.time?.[`${sensorKey}_time`]),
                        roomId: room.id || 0,
                        paramKey: paramInfo.title,
                        paramTitle: paramInfo.titleRu,
                        roomKey: room.key || 'unknown'
                    };
                } catch (error) {
                    this.$store.dispatch('log/sendError', `Ошибка обработки сенсора ${sensorKey}: ${error.message}`);
                    return null;
                }
            }).filter(Boolean);

        } catch (error) {
            this.$store.dispatch('log/sendError', `getSortedParams: ${error.message}`);
            return [];
        }
    },
    sortingDoubleClick(item) {
        if (this.currentSortType === 'rooms') {
            // При двойном клике в режиме комнат переключаемся на параметры
            this.SET_SORT_TYPE('params');
            this.SET_PARAM_KEY(item.paramKey);
        } else {
            // При двойном клике в режиме параметров переключаемся на комнаты
            this.SET_SORT_TYPE('rooms');
            this.SET_ROOM_KEY(item.roomKey);
            this.SET_ROOM_ID(item.roomId);
        }
        
        // Применяем новую сортировку
        this.selectSorting(this.currentSortType);
    },


        // calculateTimeSafe(timestamp) {
        //     try {
        //         return timestamp ? this.calculateTime(new Date(timestamp)) : 'Нет данных';
        //     } catch {
        //         return 'Неверный формат времени';
        //     }
        // },

        // formatSensorValue(value) {
        //     if (typeof value === 'number') return value.toFixed(2);
        //     if (typeof value === 'string') return parseFloat(value).toFixed(2) || value;
        //     return 'Нет данных';
        // },

        // findParamTitleRu(config, sensorKey) {
        //     // Реализация метода должна быть защищена от ошибок
        //     try {
        //         return this.$options.provides.checkConfigs.getParamTitle(config, sensorKey);
        //     } catch (error) {
        //         console.error('Ошибка в findParamTitleRu:', error);
        //         return null;
        //     }
        // },

    // findParamTitleRu(config, key) {
    //         // console.log('Функция findParamTitleRu Key - ', key);
    //         try {
    //             // const sensorKey = (key.replace(/[^a-zA-Z]/g, '')).substring(1); // оставляем только буквы и убираем первый символ
    //             const sensorKey = key.replace(/[^a-zA-Z]/g, ''); // оставляем только буквы
    //         // console.log('Функция findParamTitleRu сохраняет в localStorage(param_key) значение из sensorKey - ', sensorKey);
    //         const array = config['room00'].info;
    //         // console.log('Функция findParamTitleRu получила sensorKey - ', sensorKey);
    //         // console.log('Функция findParamTitleRu получила array - ', array);

    //         for (let titleKey in array) {
    //             // console.log('titleKey - ', titleKey);
    //             if (titleKey.includes(sensorKey)) {
    //                 const sign = array[titleKey+'_sign'];
    //                 // console.log('sign - ', sign);
    //                 if (sign) {
    //                     const n = array[titleKey]+' '+sign;
    //                     return {
    //                         title: sensorKey, 
    //                         titleRu: n
    //                     };
    //                 } 
    //                 return {
    //                         title: sensorKey, 
    //                         titleRu: array[titleKey]
    //                     };
    //             } 
    //         }
    //         console.error ('Функция findParamTitleRu - Наименование параметра по ключу', sensorKey, ' не найдено');
    //         this.sendEmitMessage('sendLogToServer','error', 'findParamTitleRu(MainBody) - Наименование параметра по ключу ${sensorKey} не найдено');
    //         return 'NaN';
    //         } catch (error) {
    //             this.sendEmitMessage('sendLogToServer','error', 'findParamTitleRu(MainBody) - ошибка - ${error} - определения руского наименования параметра по ключу ${key}');
    //         }
    // },
    // calculateTime(time) {
    //     const currentTime = new Date(); 
    //     const sensorTime = new Date(time);
    //     const timeDiff = Math.abs(currentTime - sensorTime)/1000;
    //     if (timeDiff > 3600) {
    //         return 'более часа';
    //     } if (timeDiff < 60) {
    //         return 'менее минуты';
    //     } else {
    //         const timeDiffMin = parseFloat(Math.abs(timeDiff / 60).toFixed(0))+' мин.';
    //         return timeDiffMin;
    //     }
    // },







    },
    watch: {
        getSortParams(newVal) {
            this.$store.dispatch('data/updateViewArray', newVal)
        }
    }
}
</script>

<style>

</style> -->