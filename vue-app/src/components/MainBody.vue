<template>
    <div id="app_mainBody" class="mainBody">
        <h1> Main - Body </h1>
                <MainBodyValue 
                class="mainBodyValue"
                  v-for="(param, index) in viewArray"
                  :key="index"
                  :id="param.roomId"
                  :paramKey="param.paramKey" 
                  :roomKey="param.roomKey"
                  :title="param.Title" 
                  :roomTitle="param.roomTitle" 
                  :value="param.value"
                  :group="param.group" 
                  :timeUpdated="param.timeDiff"
                  :resetSelected="resetSelected"
                  :isSelected="isSelected_(param.roomId, param.paramKey)"
                  @select="getEventsComponent"
                  @doubleclick="sortingDoubleClick"
                  @doubletouch="sortingDoubleClick"
                  :class="{ 'bordered': longPressId === param.id }"
                  /> 
                  
    </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import MainBodyValue from './MainBodyValue.vue'
// import checkConfigs from '../utils/transformConfigs'
export default {
    //inject: ['checkConfigs'],
    name: 'MainBody',
    components: { MainBodyValue},
    data() {
        return {
            commonConfig: {}, // Конфигурация выгруженная из localStorage
            viewArray: {}, // Список данных для вывода пользователю
    // Переменные сортировки по параметрам
            customerSorting: this.propsTitle, // Переменная используемая для смены сортировки при двойном клике
            id: null, // Идентификатор комнаты используется для промежуточных расчетов 

    // Управление экземплярами MainBodyValue
        // isSelected: null,
        // isSelectedID: null,
        // isSelectedParam: null,
        // isSelectedRoom: null,
        }
    },
    // props: {
    //     propsTitle: String,
    //     isMobile: Boolean,
    //     changeSorting: String,
    // },
    created() {
        //this.init();

    },
    mounted() {
        // this.checkConfigs = new checkConfigs(); // Создаемм объект класса checkConfigs
        this.init();
    },
    beforeUnmount() {
    },
    computed: {
        ...mapGetters('sortParams', ['getAllParams']),
        currentRoom() {
            const { sortType, roomId, roomKey, roomTitle, paramKey } = this.getAllParams
            return { sortType: sortType, roomId: roomId, roomKey: roomKey, roomTitle: roomTitle, paramKey: paramKey }
        }
    },

    methods: {
        updateRoom(id) {
      this.$store.commit('sortParams/SET_ROOM_ID', id)
    },
    ...mapActions('log', ['sendLogToServer']),
    ...mapActions('sortParams', ['updateSorting', 'setSelectedItem']),
    ...mapActions('log', ['sendLog']),

    async init () {
            console.log('INIT - Инициализация');
                try {
                    this.commonConfig = JSON.parse(localStorage.getItem('commonConfig'));
                
                if (!this.commonConfig) {
                    console.log('Конфигурация commonConfig не загружена');
                    await this.sendLogToServer({
                        type: 'warning',
                        message: `Конфигурация commonConfig не загружена`
                    });
                }
                this.selectSorting(this.currentRoom.sortType); // Выбор сортировки
                } catch (error) {
                    await this.sendLogToServer({
                    type: 'error',
                    message: `INIT - ошибка процесса инициализации параметров ${error}'`
                    });
                }

    },
    selectSorting(sort_type) {
            console.log(' Функция selectSorting (MainBody) - Выбор сортировки:', sort_type);
            try {
                const commonArray = JSON.parse(localStorage.getItem('commonConfig'));
                const commonConfig = commonArray.commonConfig;
                console.log(' 0 ---- Функция selectSorting (MainBody). Из localStorage получили commonConfig:', commonConfig);

                let roomKey = this.currentRoom.roomKey;
                let paramKey = this.currentRoom.paramKey;
                // console.log(' 0 ---- Функция selectSorting (MainBody). Из localStorage получили paramKey:', paramKey, 'roomKey:', roomKey);
                if (commonConfig === null || this.currentRoom.key === null || roomKey === null || paramKey === null) {
                    console.log('Ошибка функция selectSorting. commonConfig:', commonConfig, 'roomKey:', roomKey , 'paramKey:', this.currentRoom.paramKey);
                    this.sendLogToServer({
                    type: 'error',
                    message: `selectSorting(MainBody) - ошибка чтения данных из localStorage при выборе commonConfig - ${commonConfig}, roomKey - ${roomKey}, paramKey - ${paramKey}`
                    });
                } 
                let sortArray = [];
                switch (sort_type) {
                    case 'rooms':
                console.log(`Sort Room 1      -     Функция selectSorting (MainBody.vue). Приступаем к сортировке по комнатам - Case: ${sort_type}, roomKey: ${roomKey}`);
                sortArray = this.getSortedRooms(commonConfig, roomKey);
                        if (!sortArray) {
                            this.sendLogToServer({
                            type: 'error',
                            message: `selectSorting - Массив данных с утройств для отображения пользователю  viewArray не определен`
                            });
                        }
                    //console.log('Sort Room 2      -     sortArray:', sortArray);
                        this.viewArray = sortArray;
                        // this.sendEmitMessage('changeTitle', sort_type, sortArray[0].roomTitle);
                        // localStorage.setItem('room_title', sortArray[0].roomTitle);
                        break;

                    case 'params':
                        console.log('Sort Param 2      -     Функция selectSorting (MainBody.vue). Вызываем функцию getSortedParams с параметрамом paramKey - ', paramKey);
                        sortArray = this.getSortedParams(commonConfig, paramKey);
                        console.log('sortArray:', sortArray);
                        if (!sortArray) {
                            this.sendLogToServer({
                            type: 'warning',
                            message: `selectSorting - Массив данных с утройств для отображения пользователюviewArray не определен`
                            });
                        }
                        this.viewArray = sortArray;
                        //console.log(' Функция selectSorting (MainBody) Результат сортировки объекта - viewArray :', this.viewArray);
                        localStorage.setItem('param_title', sortArray[0].paramTitle);
                        this.sendEmitMessage('changeTitle', sort_type, sortArray[0].paramTitle);

                        break;
                    default:
                        console.error('MainBody.vue: Функция selectSorting. Не опознаный тип сортировки:', sort_type);
                        break;
                }

                //console.log(' Функция selectSorting (MainBody) Результат сортировки объекта - viewArray :', this.viewArray);
            } catch (error) {
                this.sendLogToServer({
                type: 'error',
                message: `selectSorting(MainBody) - ошибка сортировки данных для отображения пользователю ${error}`
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

// Вспомогательные методы
methods: {
    calculateTimeSafe(timestamp) {
        try {
            return timestamp ? this.calculateTime(new Date(timestamp)) : 'Нет данных';
        } catch {
            return 'Неверный формат времени';
        }
    },

    formatSensorValue(value) {
        if (typeof value === 'number') return value.toFixed(2);
        if (typeof value === 'string') return parseFloat(value).toFixed(2) || value;
        return 'Нет данных';
    },

    findParamTitleRu(config, sensorKey) {
        // Реализация метода должна быть защищена от ошибок
        try {
            return this.$options.provides.checkConfigs.getParamTitle(config, sensorKey);
        } catch (error) {
            console.error('Ошибка в findParamTitleRu:', error);
            return null;
        }
    }
},

    // getSortedParams(config, key) {
    //                 //console.log('MainInfoParam функция getSortedParams получила config - ', config, 'key - ', key);
    //                 // console.log('1   -------   Функция getSortedParams (MainBody) получила key - ', key);
    //                 const params = [];
    //                 let keys = [];
    //                 try {
    //                     const foundKeys = [];
    //                     for (let roomKey in config) {
    //                         const room = config[roomKey];
    //                         // console.log('Функция getSortedParams вычислила  room - ', room);
    //                         if (room.sensors) {
    //                         for (let sensorKey in room.sensors) {
    //                             // console.log('Функция getSortedParams вычислила  sensorKey - ', sensorKey);
    //                             if (sensorKey.includes(key)) {
    //                                 // console.log('Функция getSortedParams выявила в sensorKey  ключ - ', key);
    //                                 foundKeys.push(sensorKey);
    //                                 }
    //                             }
    //                         }
    //                     }
    //                     keys = [...new Set(foundKeys)]; // Удаляем дубликаты
    //                 } catch (error) {
    //                     this.sendEmitMessage('sendLogToServer','error', 'getSortedParams(MainBody) - ошибка сортировки данных для отображения пользователю ${error}');
    //                 }
    //                 try {
    //                     for (let roomKey in config) {
    //                         const room = config[roomKey];
    //                         // console.log('MainInfoParam функция getSortedParams получила room - ', room);
    //                         keys.forEach(sensorKey => {
    //                         if (room.sensors && room.sensors[sensorKey]) {
    //                             const paramKey = this.findParamTitleRu(config, sensorKey);
    //                             //console.log('MainInfoParam функция getSortedParams получила paramKey - ', paramKey);
    //                             const timeDiff = this.calculateTime(new Date(room.time[`${sensorKey}_time`]));
                               
    //                             params.push({
    //                             Title: room.title,
    //                             value: room.sensors[sensorKey],
    //                             roomTitle: room.title,
    //                             group: room.group,
    //                             timeDiff: timeDiff,
    //                             roomId: room.id,
    //                             paramKey: paramKey.title,
    //                             paramTitle: paramKey.titleRu,
    //                             roomKey: roomKey
    //                             });
    //                             // console.log('params - ', params);
    //                         }
    //                         });
    //                     }
    //                 } catch (error) {
    //                     this.sendEmitMessage('sendLogToServer','error', 'getSortedParams(MainBody) - ошибка сортировки данных для отображения пользователю ${error}');
    //                 }
    //                 if (!params) {
    //                     console.error('Функция getSortedParams не нашел ни одного ключа в config - ', config);
    //                     this.sendEmitMessage('sendLogToServer','warning', 'getSortedParams(MainBody) -  не найден ни один ключ в config - ', params);
    //                 } else {
    //                     return params;
    //                 }
                        
    // },
    // getSortedRooms(config, room) {
    //     console.log ('Функция getSortedRooms --- MainInfoParam получила config - ', config, 'room - ', room);
    //     try {
    //         const dataArray = []; // массив для хранения данных сенсоров
    //         if (config[room].sensors && config[room]) {
    //             console.log('Проверяем условие  getSortedRooms получила config[room].sensors - ', config[room].sensors);

    //             Object.keys(config[room].sensors).forEach(sensorKey => {
    //             //console.log('2 --- Функция getSortedRooms получила sensorKey - ', sensorKey);
    //                 const timeDiff = this.calculateTime(new Date(config[room].time[`${sensorKey}_time`]));
    //                 // console.log('timeDiff', timeDiff);

    //                 const paramKey = this.findParamTitleRu(config, sensorKey);

    //                     dataArray.push({
    //                         Title: paramKey.titleRu,
    //                         value: config[room].sensors[sensorKey],
    //                         paramTitle: paramKey.titleRu,
    //                         group: config[room].group,
    //                         timeDiff: timeDiff,
    //                         roomId: config[room].id,
    //                         roomTitle: config[room].title,
    //                         paramKey: paramKey.title,
    //                         roomKey: localStorage.getItem('room_key')
    //                     });
    //                 });
    //             } else {
    //                 console.error(' ---------   Функция getSortedRooms получила пустой массив sensors - ', config[room].sensors);
    //                 this.sendEmitMessage('sendLogToServer','error', 'selectSorting(MainBody) - получила пустой массив sensors - ${config[room].sensors}');
    //             }
    //         return dataArray; 
    //     } catch (error) {
    //         this.sendEmitMessage('sendLogToServer','error', 'getSortedRooms(MainBody) - ошибка сортировки данных Комнаты для отображения пользователю ${error}');
    //     }   
    // },  

    findParamTitleRu(config, key) {
            // console.log('Функция findParamTitleRu Key - ', key);
            try {
                // const sensorKey = (key.replace(/[^a-zA-Z]/g, '')).substring(1); // оставляем только буквы и убираем первый символ
                const sensorKey = key.replace(/[^a-zA-Z]/g, ''); // оставляем только буквы
            // console.log('Функция findParamTitleRu сохраняет в localStorage(param_key) значение из sensorKey - ', sensorKey);
            const array = config['room00'].info;
            // console.log('Функция findParamTitleRu получила sensorKey - ', sensorKey);
            // console.log('Функция findParamTitleRu получила array - ', array);

            for (let titleKey in array) {
                // console.log('titleKey - ', titleKey);
                if (titleKey.includes(sensorKey)) {
                    const sign = array[titleKey+'_sign'];
                    // console.log('sign - ', sign);
                    if (sign) {
                        const n = array[titleKey]+' '+sign;
                        return {
                            title: sensorKey, 
                            titleRu: n
                        };
                    } 
                    return {
                            title: sensorKey, 
                            titleRu: array[titleKey]
                        };
                } 
            }
            console.error ('Функция findParamTitleRu - Наименование параметра по ключу', sensorKey, ' не найдено');
            this.sendEmitMessage('sendLogToServer','error', 'findParamTitleRu(MainBody) - Наименование параметра по ключу ${sensorKey} не найдено');
            return 'NaN';
            } catch (error) {
                this.sendEmitMessage('sendLogToServer','error', 'findParamTitleRu(MainBody) - ошибка - ${error} - определения руского наименования параметра по ключу ${key}');
            }
    },
    calculateTime(time) {
        const currentTime = new Date(); 
        const sensorTime = new Date(time);
        const timeDiff = Math.abs(currentTime - sensorTime)/1000;
        if (timeDiff > 3600) {
            return 'более часа';
        } if (timeDiff < 60) {
            return 'менее минуты';
        } else {
            const timeDiffMin = parseFloat(Math.abs(timeDiff / 60).toFixed(0))+' мин.';
            return timeDiffMin;
        }
    },
    isSelected_(id, paramKey) {
        return id === this.isSelectedID && paramKey === this.isSelectedParam;
       
    },
    // getEventsComponent(event) {
    //     //console.log('MainBody - Функция getEventsComponent получила событие - ', event);
    //     try {
    //         const isSelectedNum = this.checkConfigs.typeofName(event.message.paramKey); // Проверка на возможность выбора Уставки 
    //         //console.log(' Функция getEventsComponent (MainBody) получила событие результат проверки на возможность выбора Уставки из checkConfigs.typeofName isSelectedNum - ', isSelectedNum);

    //         switch (event.type) {
    //         case 'select':  {
    //             //console.log(' -- 345 --- Функция getEventsComponent (MainBody) case - select получила событие - ', event);
    //             const { id, paramKey, roomKey} = event.message; 
    //                 if (this.isSelectedID === id && this.isSelectedParam === paramKey) { 
    //                     this.selectedId = null; // Снять выбор при повторном клике 
    //                     this.isSelectedParam = null;
    //                     this.isSelectedRoom = null;
    //                     this.sendEmitMessage('showSetpoint', 'isSelected', false);
    //                 } else { 
    //                     this.isSelectedID= id; // Установить выбор 
    //                     this.isSelectedParam = paramKey;
    //                     this.isSelectedRoom = roomKey;
    //                     localStorage.setItem('room_key', roomKey);
    //                     localStorage.setItem('param_key', this.checkConfigs.checkSymbol(paramKey, 0, 'd'));
    //                     localStorage.setItem('room_id', id);
    //                     localStorage.setItem('room_title', JSON.parse(localStorage.getItem('commonConfig'))[roomKey].title);
    //                     // localStorage.setItem('param_key', paramKey);
                      
    //                     //console.log('  ---- 357    ------  Функция getEventsComponent (MainBody) case - select получила наименование выбранной комнаты - ', id, paramKey, roomKey, localStorage.getItem('room_title'));
    //                     if (isSelectedNum === true) {
    //                         this.sendEmitMessage('showSetpoint', 'isSelected', true);
    //                     } else {
    //                         this.sendEmitMessage('showSetpoint', 'isSelected', false);
    //                     }
    //                     this.sendEmitMessage('selectedItem', 'isSelected', {id: id, paramKey: paramKey});
                       
    //                 } 
    //                 break;
    //             }
    //         default:
    //             break;
    //     }
    //     } catch (error) {
    //         this.sendEmitMessage('sendLogToServer','error', 'getEventsComponent(MainBody) - ошибка обработки сообщения от экземпляра компонента со значениями датчика');
    //     }

    // },
    // sortingDoubleClick(event) {
    //     console.log('Функция sortingDoubleClick (MainBody) получила событие - ', event);
    //     try {
    //     //console.log('Функция sortingDoubleClick (MainBody) получила roomKey и paramKey - ', event.roomKey, event.paramKey, 'event.roomId - ', event.roomId);
    //         if (event.paramKey === null || event.roomKey === null || event.roomId === null) {
    //             this.sendEmitMessage('sendLogToServer','warning', `sortingDoubleClick(MainBody) - Ошибка попытки изменить сортировку при двойном клике на область датчика - Не получены корректные значения roomId - ${event.roomId}, roomKey - ${event.roomKey}, paramKey - ${event.paramKey} `);
    //         } else  {
    //             console.log('Функция sortingDoubleClick (MainBody)  Собираемся сохранять в localStorage');
    //             localStorage.setItem('room_id', event.roomId);
    //             localStorage.setItem('room_key', event.roomKey);
    //             localStorage.setItem('param_key', event.paramKey);
    //             //console.log( 'Функция SortingDoubleClick - обновили локальные переменные: room_id - ', localStorage.getItem('room_id'), 'room_key - ', localStorage.getItem('room_key'), 'param_key - ', localStorage.getItem('param_key'));
    //             if (this.customerSorting === 'rooms') {
    //                 this.customerSorting = 'params';
    //                 //console.log('Функция sortingDoubleClick (MainBody) Наименование комнаты - ', localStorage.getItem('room_title'));
    //                 const currentRoomTitle = localStorage.getItem('room_title');
    //                 this.sendEmitMessage('changeTitle', this.customerSorting, currentRoomTitle);
    //             } else {
    //                 this.customerSorting = 'rooms'
    //                 //console.log('Функция sortingDoubleClick (MainBody) Наименование параметра - ', localStorage.getItem('param_title'));
    //                 const currentParamTitle = localStorage.getItem('param_title');
    //                 this.sendEmitMessage('changeTitle', this.customerSorting, currentParamTitle);
    //             }
                
    //             this.selectSorting(this.customerSorting); 
    //         }
    //     } catch (error) {
    //         console.error(`  Catch -------  DoubleClick      -------------    MainBody - Функция sortingDoubleClick - ошибка обработки события - ${error}`);
    //         this.sendEmitMessage('sendLogToServer', 'error', `sortingDoubleClick(MainBody) - Ошибка попытки изменить сортировку при двойном клике на область датчика - Общая ошибка ${error}`);
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

</style>