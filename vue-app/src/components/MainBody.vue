<template>
    <div id="app_mainBody" class="mainBody">

                <MainBodyValue 
                class="mainBodyValue"
                  v-for="(param, index) in viewArray"
                  :key="index"
                  :id="param.id"
                  :title="param.title" 
                  :value="param.value"
                  :group="param.group"
                  :timeUpdated="param.timeDiff"
                  @action="ParamPlaceAction"
                  @touchstart="handleTouchStart($event, param.id)" 
                  @touchend="handleTouchEnd(param.id)" 
                  @touchmove="handleTouchMove($event)" 
                  :class="{ 'bordered': longPressId === param.id }"
                  /> 


    </div>
</template>

<script>
import MainBodyValue from './MainBodyValue.vue';
export default {
    name: 'MainBody',
    components: {
        MainBodyValue,
    },
    data() {
        return {
            commonConfig: {}, // Конфигурация выгруженная из localStorage
            viewArray: {}, // Список данных для вывода пользователю
    // Переменные сортировки по параметрам
            key: '', // Индекс сортировки
            keys: [], // Массив ключей для сортировки значений
            paramsList: [], // Список отсортированных парметров (по комнатам или по типу параметра)
            paramKeysArray: [],
            keyIndex: 0, // Индекс ключа сортировки получаем по значению param_key для комнаты с room_id (получены из App.vue)
            paramKey_value: this.param_key || '', 

    // Переменные сортировки по комнатам
           
        }
    },
    props: {
        propsTitle: String,
        room_id: Number,
        param_key: String,
    },
    created() {
        this.sendEmitMessage('sendLogToServer','customer_message', 'Открыт компонент MainBody -  сортировки данных');
        this.init();

        // this.selectSorting(this.propsTitle); // Выбор сортировки
        // this.commonConfig = JSON.parse(localStorage.getItem('commonConfig'));
        // console.log(localStorage.getItem('commonConfig'));
        // console.log(localStorage.getItem('manageConfig'));
        



        // this.paramKeysArray = Object.keys(this.commonConfig.room00.info);
        // console.log('mounted - paramKeysArray:', this.paramKeysArray);
        // this.key = this.paramKeysArray[this.keyIndex];
        // console.log('mounted - key:', this.key);
        // this.getSortedParams(this.commonConfig, this.key);



    },
    mounted() {


    },
    beforeUnmount() {
    },
    watch: {
        // param_key: function (newVal) {
        //     console.log(' -- watch -- Значение param_key изменено - ', newVal);
        //     console.log(' -- watch -- Читаем param_key - ', this.param_key);
        // }
    },
methods: {
init () {
        console.log('INIT - Инициализация');
            try {
                this.commonConfig = JSON.parse(localStorage.getItem('commonConfig'));
            if (!this.param_key) {
                this.sendEmitMessage('sendLogToServer','warning', 'INIT - Инициализация - Ключ параметра сортировки не определен');
                console.error('Init - Конфигурация ключ параметра сортировки не определен');
            } 
            
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
            this.$emit('eventsComponent',{
                [event]: {
                    type: name,
                    message: message
                }
            });
},
selectSorting(sort_type) {
        // console.log('MainBody.vue: Функция selectSorting. Выбор сортировки:', sort_type);
        try {
            const commonConfig = JSON.parse(localStorage.getItem('commonConfig'));
            const roomKey = localStorage.getItem('room_key');
            const paramKey = localStorage.getItem('param_key');
            if (commonConfig === null || roomKey === null || paramKey === null) {
                //console.log('Ошибка функция selectSorting. commonConfig:', commonConfig, 'roomKey:', roomKey, 'paramKey:', paramKey);
                this.sendEmitMessage('sendLogToServer','error', 'selectSorting(MainBody) - ошибка чтения данных из localStorage при выборе commonConfig - ${commonConfig}, roomKey - ${roomKey}, paramKey - ${paramKey}');
            } 
            let sortArray = [];
            switch (sort_type) {
                case 'rooms':
                    console.log('Sort Room 1      -     Функция selectSorting (MainBody.vue). Приступаем к сортировке по комнатам - Case: rooms');
                    sortArray = this.getSortedRooms(commonConfig, roomKey);
                    if (!sortArray) {
                        this.sendEmitMessage('sendLogToServer','error', 'selectSorting - Массив данных с утройств для отображения пользователю  viewArray не определен');
                    }
                    console.log('Sort Room 2      -     sortArray:', localStorage.getItem('room_title'));
                    this.viewArray = sortArray;
                    this.sendEmitMessage('changeTitle', sort_type, localStorage.getItem('room_title'));
                    break;

                case 'params':
                    console.log('MainBody.vue: Функция selectSorting. Case: params', this.paramsList);

                    sortArray = this.getSortedParams(commonConfig, paramKey);
                    if (!sortArray) {
                        this.sendEmitMessage('sendLogToServer','warning', 'selectSorting - Массив данных с утройств для отображения пользователюviewArray не определен');
                    }
                    this.viewArray = sortArray;
                    this.sendEmitMessage('changeTitle', sort_type, localStorage.getItem('param_title'));

                    break;
                default:
                    console.error('MainBody.vue: Функция selectSorting. Не опознаный тип сортировки:', sort_type);
                    break;
            }


            console.log('Результат функции selectSorting - viewArray  --- MainBody:', this.viewArray);
        } catch (error) {
            this.sendEmitMessage('sendLogToServer','error', 'selectSorting(MainBody) - ошибка сортировки данных для отображения пользователю ${error}');
        }    

},
getSortedParams(config, key) {
                // console.log('MainInfoParam функция getSortedParams получила config - ', config, 'key - ', key);
                // console.log('MainInfoParam функция getSortedParams получила key - ', key);
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

                            const timeDiff = this.calculateTime(new Date(room.time[`${sensorKey}_time`]));
                            const value = this.parceValue(room.sensors, sensorKey);
                            
                            params.push({
                            value: value,
                            title: room.title,
                            group: room.group,
                            timeDiff: timeDiff,
                            id: room.id,
                            key: sensorKey
                            });
                            // console.log('params - ', params);
                        }
                        });
                    }
                    const titleRoom = this.findParamTitleRu(config, key);
                    // console.log('titleRoom - ', titleRoom);
                    localStorage.setItem('param_title', titleRoom);
                } catch (error) {
                    this.sendEmitMessage('sendLogToServer','error', 'getSortedParams(MainBody) - ошибка сортировки данных для отображения пользователю ${error}');
                }
                if (!params) {
                    // console.error('Функция getSortedParams не нашел ни одного ключа в config - ', config);
                    this.sendEmitMessage('sendLogToServer','warning', 'getSortedParams(MainBody) -  не найден ни один ключ в config - ', params);
                } else {
                    return params;
                }
                    
},
getSortedRooms(config, room) {
    console.log ('Функция getSortedRooms --- MainInfoParam получила config - ', config, 'room - ', room);
    try {
        const dataArray = []; // массив для хранения данных сенсоров
        if (config[room].sensors && config[room]) {
            console.log('Проверяем условие  getSortedRooms получила config[room].sensors - ', config[room].sensors);

            Object.keys(config[room].sensors).forEach(sensorKey => {
                console.log('sensorKey - ', sensorKey);
                const timeDiff = this.calculateTime(new Date(config[room].time[`${sensorKey}_time`]));
                // console.log('timeDiff', timeDiff);
                const value = this.parceValue(config[room].sensors, sensorKey);

                    dataArray.push({
                        value: value,
                        title: this.findParamTitleRu(config, sensorKey),
                        group: config[room].group,
                        timeDiff: timeDiff,
                        id: config[room].id,
                        key: sensorKey
                    });
                });
                console.log('room_title - ', config[room].title);
            localStorage.setItem('room_title', config[room].title);
            } else {
                // console.error(' ---------   Функция getSortedRooms получила пустой массив sensors - ', config[room].sensors);
                this.sendEmitMessage('getSortedRooms','error', 'selectSorting(MainBody) - получила пустой массив sensors - ${config[room].sensors}');
            }

        // console.log('Результат функции getSortedRooms - dataArray  --- MainBody:', dataArray);
        return dataArray; 
    } catch (error) {
        this.sendEmitMessage('sendLogToServer','error', 'getSortedRooms(MainBody) - ошибка сортировки данных Комнаты для отображения пользователю ${error}');
    }   
},

        

        
    updateParamsList() { 
                while (this.paramsList.length === 0) { 
                    this.keyIndex = (this.keyIndex + 1) % this.paramKeysArray.length; 
                    this.key = this.paramKeysArray[this.keyIndex]; 
                    this.paramsList = this.getSortedParams(this.commonConfig, this.key); 
                } 
                this.paramKey_value = this.key; 
    },

    // findKeysParam(config, key) {
    //             // console.log('MainInfoParam функция findKeysParam получила key - ', key);
    //             const foundKeys = [];
    //             for (let roomKey in config) {
    //                 const room = config[roomKey];
    //                 // console.log('Функция findKeysParam получила room - ', room);
    //                 if (room.sensors) {
    //                 for (let sensorKey in room.sensors) {
                        
    //                     if (sensorKey.includes(key)) {
    //                         foundKeys.push(sensorKey);
    //                         }
    //                     }
    //                 }
    //             }
    //             return [...new Set(foundKeys)]; // Удаляем дубликаты
    // },

    findParamTitleRu(config, key) {
            // console.log('Функция findParamTitleRu Key - ', key);
            try {
                const sensorKey = (key.replace(/[^a-zA-Z]/g, '')).substring(1); // оставляем только буквы
            localStorage.setItem('param_key', sensorKey);
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
                        return n;
                    } 
                    return array[titleKey];
                } 
            }
            console.error ('Функция findParamTitleRu - Наименование параметра по ключу', sensorKey, ' не найдено');
            return 'NaN';
            } catch (error) {
                this.sendEmitMessage('sendLogToServer','error', 'findParamTitleRu(MainBody) - ошибка - ${error} - определения руского наименования параметра по ключу ${key}');
            }
    },

    parceValue(array, key) {
        let value = array[key];
        if (typeof value === 'number') { 
            value = parseFloat(value.toFixed(1));
            this.$emit('eventsComponent', {
            showSetpoint: true
            });
        } else if (typeof value === 'boolean') {
            value = value ? 'ON' : 'OFF'; 
            this.$emit('eventsComponent', {
            showSetpoint: false
            });
        } else if (value === null) {
            value = 'NaN';
            this.$emit('eventsComponent', {
            showSetpoint: false
            });
        } 
        return value;
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
    messageFromInfoRoom(n) {
            // console.log('MainInfo.vue: Функция messageFromInfo - Room: Получено ообщение', n);
            if (n !== undefined && n !== null) {
                if (n.customer_message) {
                    // console.log('MainInfo Функция messageFromInfo - Room. customer_message: ', n.customer_message);
                    this.sendEmitMessage('sendLogToServer','customer_message', n.customer_message);
                }
            } else {
                console.error('MainInfo Функция messageFromInfo - Room. Value: undefined');
                this.sendEmitMessage('sendLogToServer','error', `MainInfo Функция messageFromInfo - Room. Value: undefined`);
            }
    },
    messageFromInfoParam(n) {
            // console.log('MainInfo.vue: Функция messageFromInfo - Param: Получено ообщение', n);
            if (n !== undefined && n !== null) {
                if (n.customer_message) {
                    // console.log('MainInfo Функция messageFromInfo - Param. customer_message: ', n.customer_message);
                    this.sendEmitMessage('sendLogToServer','customer_message', n.customer_message);
                }
            } else {
                console.error('MainInfo Функция messageFromInfo - Param. Value: undefined');
                this.sendEmitMessage('sendLogToServer','error', `MainInfo Функция messageFromInfo - Param. Value: undefined`);
            }
    }, 
    },
}
</script>

<style>

</style>