<template>
    <div id="app_mainBody" class="mainBody">
        <!-- <MainBodyValue 
                class="mainBodyValue"
                  v-for="(param, index) in viewArray"
                  :key="index"
                  :id="param.id"
                  :paramKey="param.key" 
                  :roomKey="param.roomKey"
                  :title="param.title" 
                  :value="param.value"
                  :group="param.group" 
                  :timeUpdated="param.timeDiff"
                  :resetSelected="resetSelected"
                  :isSelected="isSelected_(param.id, param.key)"
                  @select="getEventsComponent"
                  @doubleclick="sortingDoubleClick"
                  @touchstart="handleTouchStart($event, param.id)" 
                  @touchend="handleTouchEnd(param.id)" 
                  @touchmove="handleTouchMove($event)" 
                  :class="{ 'bordered': longPressId === param.id }"
                  />  -->

                  <!-- :paramKey="(param.key).substring(1)"  -->

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
import MainBodyValue from './MainBodyValue.vue';
// import checkConfigs from '../utils/transformConfigs'
export default {
    inject: ['checkConfigs'],
    name: 'MainBody',
    components: {
        MainBodyValue,
    },
    data() {
        return {
            commonConfig: {}, // Конфигурация выгруженная из localStorage
            viewArray: {}, // Список данных для вывода пользователю
    // Переменные сортировки по параметрам
            customerSorting: this.propsTitle, // Переменная используемая для смены сортировки при двойном клике
            // key: '', // Индекс сортировки
            // keys: [], // Массив ключей для сортировки значений
            // paramsList: [], // Список отсортированных парметров (по комнатам или по типу параметра)
            // paramKeysArray: [],
            // keyIndex: 0, // Индекс ключа сортировки получаем по значению param_key для комнаты с room_id (получены из App.vue)
            // paramKey_value: this.param_key || '', 
            id: null, // Идентификатор комнаты используется для промежуточных расчетов 

    // Управление экземплярами MainBodyValue
        isSelected: null,
        isSelectedID: null,
        isSelectedParam: null,
        isSelectedRoom: null,
        }
    },
    props: {
        propsTitle: String,
        isMobile: Boolean,
        changeSorting: String,
    },
    created() {
        this.sendEmitMessage('sendLogToServer','customer_message', 'Открыт компонент MainBody -  сортировки данных');
        this.init();

    },
    mounted() {
        // this.checkConfigs = new checkConfigs(); // Создаемм объект класса checkConfigs

    },
    beforeUnmount() {
    },
    watch: {
        changeSorting: function(newValue) {
            //console.log('watch -  - changeSorting (MainBody) изменилось - ', newValue);
            if (newValue === undefined || newValue === null || newValue === false) {
                return;
            } if (newValue === true) {
                //console.log('watch -  - changeSorting (MainBody) инициируем обновление сортировки  selectSorting');
                this.selectSorting(this.propsTitle);
                //console.log('watch -  - changeSorting (MainBody) Отправляем в App сообщение updatedSorting с типом updated и значением true');
                this.sendEmitMessage('updatedSorting', 'updated', true);
            }

           
        }
    },
    methods: {
    init () {
            console.log('INIT - Инициализация');
                try {
                    this.commonConfig = JSON.parse(localStorage.getItem('commonConfig'));
                
                if (!this.commonConfig) {
                    this.sendEmitMessage('sendLogToServer','warning', 'Конфигурация commonConfig не загружена');
                }
                // console.log('INIT  - commonConfig:', this.commonConfig);

                // console.log('INIT  - title_room:', this.title_room);
                if (!this.propsTitle) {
                    this.sendEmitMessage('sendLogToServer','warning', 'INIT - propsTitle не определен');
                }
                this.selectSorting(this.propsTitle); // Выбор сортировки
                } catch (error) {
                    this.sendEmitMessage('sendLogToServer','error', 'INIT - ошибка процесса инициализации параметров ${error}');
                }

    },
    sendEmitMessage(event, name, message) {
                //console.log('MainBody - Функция sendEmitMessage формирует сообщение для отправки на сервер - ', event, name );    
                this.$emit('eventsComponent',{
                    [event]: {
                        type: name,
                        message: message
                    }
                });
    },
    selectSorting(sort_type) {
            //console.log(' Функция selectSorting (MainBody) - Выбор сортировки:', sort_type);
            try {
                const commonConfig = JSON.parse(localStorage.getItem('commonConfig'));
                let roomKey = localStorage.getItem('room_key');
                const paramKey = localStorage.getItem('param_key');
                // console.log(' 0 ---- Функция selectSorting (MainBody). Из localStorage получили paramKey:', paramKey, 'roomKey:', roomKey);
                if (commonConfig === null || roomKey === null || paramKey === null) {
                    //console.log('Ошибка функция selectSorting. commonConfig:', commonConfig, 'roomKey:', roomKey, 'paramKey:', paramKey);
                    this.sendEmitMessage('sendLogToServer','error', 'selectSorting(MainBody) - ошибка чтения данных из localStorage при выборе commonConfig - ${commonConfig}, roomKey - ${roomKey}, paramKey - ${paramKey}');
                } 
                let sortArray = [];
                switch (sort_type) {
                    case 'rooms':
                        //console.log('Sort Room 1      -     Функция selectSorting (MainBody.vue). Приступаем к сортировке по комнатам - Case: rooms');

                        sortArray = this.getSortedRooms(commonConfig, roomKey);
                        if (!sortArray) {
                            this.sendEmitMessage('sendLogToServer','error', 'selectSorting - Массив данных с утройств для отображения пользователю  viewArray не определен');
                        }
                        //console.log('Sort Room 2      -     sortArray:', localStorage.getItem('room_title'));
                        this.viewArray = sortArray;
                        this.sendEmitMessage('changeTitle', sort_type, sortArray[0].roomTitle);
                        localStorage.setItem('room_title', sortArray[0].roomTitle);
                        break;

                    case 'params':
                        //console.log('Sort Param 2      -     Функция selectSorting (MainBody.vue). Вызываем функцию getSortedParams с параметрамом paramKey - ', paramKey);
                        sortArray = this.getSortedParams(commonConfig, paramKey);
                        console.log('sortArray:', sortArray);
                        if (!sortArray) {
                            this.sendEmitMessage('sendLogToServer','warning', 'selectSorting - Массив данных с утройств для отображения пользователюviewArray не определен');
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
                this.sendEmitMessage('sendLogToServer','error', 'selectSorting(MainBody) - ошибка сортировки данных для отображения пользователю ${error}');
            }    

    },
    getSortedParams(config, key) {
                    //console.log('MainInfoParam функция getSortedParams получила config - ', config, 'key - ', key);
                    // console.log('1   -------   Функция getSortedParams (MainBody) получила key - ', key);
                    const params = [];
                    let keys = [];
                    try {
                        const foundKeys = [];
                        for (let roomKey in config) {
                            const room = config[roomKey];
                            // console.log('Функция getSortedParams вычислила  room - ', room);
                            if (room.sensors) {
                            for (let sensorKey in room.sensors) {
                                // console.log('Функция getSortedParams вычислила  sensorKey - ', sensorKey);
                                if (sensorKey.includes(key)) {
                                    // console.log('Функция getSortedParams выявила в sensorKey  ключ - ', key);
                                    foundKeys.push(sensorKey);
                                    }
                                }
                            }
                        }
                        keys = [...new Set(foundKeys)]; // Удаляем дубликаты
                    } catch (error) {
                        this.sendEmitMessage('sendLogToServer','error', 'getSortedParams(MainBody) - ошибка сортировки данных для отображения пользователю ${error}');
                    }
                    try {
                        for (let roomKey in config) {
                            const room = config[roomKey];
                            // console.log('MainInfoParam функция getSortedParams получила room - ', room);
                            keys.forEach(sensorKey => {
                            if (room.sensors && room.sensors[sensorKey]) {
                                const paramKey = this.findParamTitleRu(config, sensorKey);
                                //console.log('MainInfoParam функция getSortedParams получила paramKey - ', paramKey);
                                const timeDiff = this.calculateTime(new Date(room.time[`${sensorKey}_time`]));
                               
                                params.push({
                                Title: room.title,
                                value: room.sensors[sensorKey],
                                roomTitle: room.title,
                                group: room.group,
                                timeDiff: timeDiff,
                                roomId: room.id,
                                paramKey: paramKey.title,
                                paramTitle: paramKey.titleRu,
                                roomKey: roomKey
                                });
                                // console.log('params - ', params);
                            }
                            });
                        }
                    } catch (error) {
                        this.sendEmitMessage('sendLogToServer','error', 'getSortedParams(MainBody) - ошибка сортировки данных для отображения пользователю ${error}');
                    }
                    if (!params) {
                        console.error('Функция getSortedParams не нашел ни одного ключа в config - ', config);
                        this.sendEmitMessage('sendLogToServer','warning', 'getSortedParams(MainBody) -  не найден ни один ключ в config - ', params);
                    } else {
                        return params;
                    }
                        
    },
    getSortedRooms(config, room) {
        // console.log ('Функция getSortedRooms --- MainInfoParam получила config - ', config, 'room - ', room);
        try {
            const dataArray = []; // массив для хранения данных сенсоров
            if (config[room].sensors && config[room]) {
                // console.log('Проверяем условие  getSortedRooms получила config[room].sensors - ', config[room].sensors);

                Object.keys(config[room].sensors).forEach(sensorKey => {
                //console.log('2 --- Функция getSortedRooms получила sensorKey - ', sensorKey);
                    const timeDiff = this.calculateTime(new Date(config[room].time[`${sensorKey}_time`]));
                    // console.log('timeDiff', timeDiff);

                    const paramKey = this.findParamTitleRu(config, sensorKey);

                        dataArray.push({
                            Title: paramKey.titleRu,
                            value: config[room].sensors[sensorKey],
                            paramTitle: paramKey.titleRu,
                            group: config[room].group,
                            timeDiff: timeDiff,
                            roomId: config[room].id,
                            roomTitle: config[room].title,
                            paramKey: paramKey.title,
                            roomKey: localStorage.getItem('room_key')
                        });
                    });
                } else {
                    console.error(' ---------   Функция getSortedRooms получила пустой массив sensors - ', config[room].sensors);
                    this.sendEmitMessage('sendLogToServer','error', 'selectSorting(MainBody) - получила пустой массив sensors - ${config[room].sensors}');
                }
            return dataArray; 
        } catch (error) {
            this.sendEmitMessage('sendLogToServer','error', 'getSortedRooms(MainBody) - ошибка сортировки данных Комнаты для отображения пользователю ${error}');
        }   
    },  

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
    getEventsComponent(event) {
        //console.log('MainBody - Функция getEventsComponent получила событие - ', event);
        try {
            const isSelectedNum = this.checkConfigs.typeofName(event.message.paramKey); // Проверка на возможность выбора Уставки 
            //console.log(' Функция getEventsComponent (MainBody) получила событие результат проверки на возможность выбора Уставки из checkConfigs.typeofName isSelectedNum - ', isSelectedNum);

            switch (event.type) {
            case 'select':  {
                //console.log(' -- 345 --- Функция getEventsComponent (MainBody) case - select получила событие - ', event);
                const { id, paramKey, roomKey} = event.message; 
                    if (this.isSelectedID === id && this.isSelectedParam === paramKey) { 
                        this.selectedId = null; // Снять выбор при повторном клике 
                        this.isSelectedParam = null;
                        this.isSelectedRoom = null;
                        this.sendEmitMessage('showSetpoint', 'isSelected', false);
                    } else { 
                        this.isSelectedID= id; // Установить выбор 
                        this.isSelectedParam = paramKey;
                        this.isSelectedRoom = roomKey;
                        localStorage.setItem('room_key', roomKey);
                        localStorage.setItem('param_key', this.checkConfigs.checkSymbol(paramKey, 0, 'd'));
                        localStorage.setItem('room_id', id);
                        localStorage.setItem('room_title', JSON.parse(localStorage.getItem('commonConfig'))[roomKey].title);
                        // localStorage.setItem('param_key', paramKey);
                      
                        //console.log('  ---- 357    ------  Функция getEventsComponent (MainBody) case - select получила наименование выбранной комнаты - ', id, paramKey, roomKey, localStorage.getItem('room_title'));
                        if (isSelectedNum === true) {
                            this.sendEmitMessage('showSetpoint', 'isSelected', true);
                        } else {
                            this.sendEmitMessage('showSetpoint', 'isSelected', false);
                        }
                        this.sendEmitMessage('selectedItem', 'isSelected', {id: id, paramKey: paramKey});
                       
                    } 
                    break;
                }
            default:
                break;
        }
        } catch (error) {
            this.sendEmitMessage('sendLogToServer','error', 'getEventsComponent(MainBody) - ошибка обработки сообщения от экземпляра компонента со значениями датчика');
        }

    },
    sortingDoubleClick(event) {
        console.log('Функция sortingDoubleClick (MainBody) получила событие - ', event);
        try {
        //console.log('Функция sortingDoubleClick (MainBody) получила roomKey и paramKey - ', event.roomKey, event.paramKey, 'event.roomId - ', event.roomId);
            if (event.paramKey === null || event.roomKey === null || event.roomId === null) {
                this.sendEmitMessage('sendLogToServer','warning', `sortingDoubleClick(MainBody) - Ошибка попытки изменить сортировку при двойном клике на область датчика - Не получены корректные значения roomId - ${event.roomId}, roomKey - ${event.roomKey}, paramKey - ${event.paramKey} `);
            } else  {
                console.log('Функция sortingDoubleClick (MainBody)  Собираемся сохранять в localStorage');
                localStorage.setItem('room_id', event.roomId);
                localStorage.setItem('room_key', event.roomKey);
                localStorage.setItem('param_key', event.paramKey);
                //console.log( 'Функция SortingDoubleClick - обновили локальные переменные: room_id - ', localStorage.getItem('room_id'), 'room_key - ', localStorage.getItem('room_key'), 'param_key - ', localStorage.getItem('param_key'));
                if (this.customerSorting === 'rooms') {
                    this.customerSorting = 'params';
                    //console.log('Функция sortingDoubleClick (MainBody) Наименование комнаты - ', localStorage.getItem('room_title'));
                    const currentRoomTitle = localStorage.getItem('room_title');
                    this.sendEmitMessage('changeTitle', this.customerSorting, currentRoomTitle);
                } else {
                    this.customerSorting = 'rooms'
                    //console.log('Функция sortingDoubleClick (MainBody) Наименование параметра - ', localStorage.getItem('param_title'));
                    const currentParamTitle = localStorage.getItem('param_title');
                    this.sendEmitMessage('changeTitle', this.customerSorting, currentParamTitle);
                }
                
                this.selectSorting(this.customerSorting); 
            }
        } catch (error) {
            console.error(`  Catch -------  DoubleClick      -------------    MainBody - Функция sortingDoubleClick - ошибка обработки события - ${error}`);
            this.sendEmitMessage('sendLogToServer', 'error', `sortingDoubleClick(MainBody) - Ошибка попытки изменить сортировку при двойном клике на область датчика - Общая ошибка ${error}`);
        }
    },






    // updateParamsList() { 
    //             while (this.viewArray.length === 0) { 
    //                 this.keyIndex = (this.keyIndex + 1) % this.paramKeysArray.length; 
    //                 this.key = this.paramKeysArray[this.keyIndex]; 
    //                 this.viewArray = this.getSortedParams(localStorage.getItem('commonConfig'), localStorage.getItem('param_key')); 
    //             } 
    //             this.paramKey_value = this.key; 
    // },
    // messageFromInfoRoom(n) {
    //         // console.log('MainInfo.vue: Функция messageFromInfo - Room: Получено ообщение', n);
    //         if (n !== undefined && n !== null) {
    //             if (n.customer_message) {
    //                 // console.log('MainInfo Функция messageFromInfo - Room. customer_message: ', n.customer_message);
    //                 this.sendEmitMessage('sendLogToServer','customer_message', n.customer_message);
    //             }
    //         } else {
    //             console.error('MainInfo Функция messageFromInfo - Room. Value: undefined');
    //             this.sendEmitMessage('sendLogToServer','error', `MainInfo Функция messageFromInfo - Room. Value: undefined`);
    //         }
    // },
    // messageFromInfoParam(n) {
    //         // console.log('MainInfo.vue: Функция messageFromInfo - Param: Получено ообщение', n);
    //         if (n !== undefined && n !== null) {
    //             if (n.customer_message) {
    //                 // console.log('MainInfo Функция messageFromInfo - Param. customer_message: ', n.customer_message);
    //                 this.sendEmitMessage('sendLogToServer','customer_message', n.customer_message);
    //             }
    //         } else {
    //             console.error('MainInfo Функция messageFromInfo - Param. Value: undefined');
    //             this.sendEmitMessage('sendLogToServer','error', `MainInfo Функция messageFromInfo - Param. Value: undefined`);
    //         }
    // }, 
    },
}
</script>

<style>

</style>