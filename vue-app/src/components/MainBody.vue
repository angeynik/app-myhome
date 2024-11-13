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
            title_room: '', // Идентификатор конаты Используется в функции findRoom
            title_roomRu: '', // Название комнаты на русском Используется для передачи в App Header
            title_param: '', // Идентификатор параметра Используется для передачи в App Header
            title_paramRu: '', // Название параметра на русском Используется для передачи в App Header
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
    methods: {
    init () {
            this.commonConfig = JSON.parse(localStorage.getItem('commonConfig'));
            if (!this.param_key) {
                this.sendEmitMessage('sendLogToServer','warning', 'INIT - Инициализация - Ключ параметра сортировки не определен');
                console.error('Init - Конфигурация ключ параметра сортировки не определен');
            } 
            
            if (!this.commonConfig) {
                this.sendEmitMessage('sendLogToServer','warning', 'Конфигурация commonConfig не загружена');
            }
            // console.log('INIT  - commonConfig:', this.commonConfig);

        // Ищем индекс комнаты соответствующей id полученному от App 
            const roomRes = this.findRoom (this.commonConfig, this.room_id);
            if (!roomRes) {
                this.sendEmitMessage('sendLogToServer','warning', 'INIT - Идентификатор комнаты title_room в функции findRoom  не найден');
            } else {
                this.title_room = roomRes;
            }
            console.log('INIT  - title_room:', this.title_room);
            if (!this.propsTitle) {
                this.sendEmitMessage('sendLogToServer','warning', 'INIT - propsTitle не определен');
            }
            this.selectSorting(this.propsTitle); // Выбор сортировки
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
            
            // console.log('MainBody.vue: Функция selectSorting. commonConfig:', commonConfig, 'roomKey:', roomKey, 'paramKey:', paramKey);

            switch (sort_type) {
                case 'rooms':
                    console.log('Функция selectSorting (MainBody.vue). Приступаем к сортировке по комнатам - Case: rooms');
                    // console.log('Rooms - MainBody.vue: Функция selectSorting. keys:', this.keys);
                    this.viewArray = this.getSortedRooms(this.commonConfig, this.title_room);
                    break;
                case 'params':
                    // console.log('MainBody.vue: Функция selectSorting. Case: params', this.paramsList);
                    this.keys = this.findKeysParam(this.commonConfig, this.key); // Получаем ключи, содержащие `key`
                    // console.log('Params - MainBody.vue: Функция selectSorting. keys:', this.keys);

                    this.viewArray = this.getSortedParams(this.commonConfig, this.param_key);
                    
                    console.log('viewArray  --- MainBody.vue: Функция selectSorting. viewArray:', this.viewArray);
                    break;
                default:
                    console.error('MainBody.vue: Функция selectSorting. Не опознаный тип сортировки:', sort_type);
                    break;
            }
            console.log('Результат функции selectSorting - viewArray  --- MainBody:', this.viewArray);
    },
getSortedParams(config, key) {
                console.log('MainInfoParam функция getSortedParams получила config - ', config, 'key - ', key);
                // console.log('MainInfoParam функция getSortedParams получила key - ', key);
                    const params = [];
                    const foundKeys = [];
                    for (let roomKey in config) {
                        const room = config[roomKey];
                        // console.log('Функция getSortedParams вычислила  room - ', room);
                        if (room.sensors) {
                        for (let sensorKey in room.sensors) {
                            // console.log('Функция getSortedParams вычислила  sensorKey - ', sensorKey);
                            if (sensorKey.includes(key)) {
                                console.log('Функция getSortedParams выявила в sensorKey  ключ - ', key);
                                foundKeys.push(sensorKey);
                                }
                            }
                        }
                    }
                    const keys = [...new Set(foundKeys)]; // Удаляем дубликаты


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
                        }
                        });
                    }

                    const title_param = {
                        param: 'Hum',
                        paramRu: 'Влажность',
                        room: this.title_room,
                        roomRu: this.title_roomRu,
                    };
                    this.title_param = title_param.param;
                    // console.log('titleParamRu - ', this.title_paramRu);

                    this.sendEmitMessage('changeTitle', this.propsTitle, title_param);
                    // return [...new Set(foundKeys)]; // Удаляем дубликаты
                    return params;
},
getSortedRooms(config, room) {
    console.log ('Функция getSortedRooms --- MainInfoParam получила config - ', config, 'room - ', room);
    const array = config;
    const dataArray = []; // массив для хранения данных сенсоров

    if (!array) {
        console.error('Функция getSortedRooms получила пустой массив config - ', array[room]);
    } else {
        console.log('Функция getSortedRooms успешно получила массив config - ', array[room]);
        if (array[room].sensors && array[room]) {
            this.title_roomRu = array[room].title;
            Object.keys(array[room].sensors).forEach(sensorKey => {
                // console.log('sensorKey - ', sensorKey);
                const timeDiff = this.calculateTime(new Date(array[room].time[`${sensorKey}_time`]));
                // console.log('timeDiff', timeDiff);
                const value = this.parceValue(array[room].sensors, sensorKey);

                dataArray.push({
                    value: value,
                    title: this.findParamTitleRu(config, sensorKey),
                    group: array[room].group,
                    timeDiff: timeDiff,
                    id: array[room].id,
                    key: sensorKey
                });
            })
        } else {
            console.error('Функция getSortedRooms получила пустой массив sensors - ', array[room].sensors);
        }
    }
    // console.log('dataArray - ', dataArray);
    const mess = {
        param: this.title_param,
        paramRu: this.title_paramRu,
        room: this.title_room,
        roomRu: this.title_roomRu,
    };
    this.sendEmitMessage('changeTitle', this.propsTitle, mess);
    return dataArray;         
},

        

        
    updateParamsList() { 
                while (this.paramsList.length === 0) { 
                    this.keyIndex = (this.keyIndex + 1) % this.paramKeysArray.length; 
                    this.key = this.paramKeysArray[this.keyIndex]; 
                    this.paramsList = this.getSortedParams(this.commonConfig, this.key); 
                } 
                this.paramKey_value = this.key; 
    },
    findRoom (config, id) {
        for (let room in config) {
            if (config[room].id === id) {
                this.title_room = room;
                this.title_roomRu = config[room].title; // Получаем название комнаты передачи в App в Header
                console.log('Функция findRoom  - room - ', this.title_room, this.title_roomRu);
                return room;
            } 
        }
    },
    findKeysParam(config, key) {
                // console.log('MainInfoParam функция findKeysParam получила key - ', key);
                const foundKeys = [];
                for (let roomKey in config) {
                    const room = config[roomKey];
                    // console.log('Функция findKeysParam получила room - ', room);
                    if (room.sensors) {
                    for (let sensorKey in room.sensors) {
                        
                        if (sensorKey.includes(key)) {
                            foundKeys.push(sensorKey);
                            }
                        }
                    }
                }
                return [...new Set(foundKeys)]; // Удаляем дубликаты
    },
    findParamTitleRu(config, key) {
            // console.log('Функция findParamTitleRu Key - ', key);
            const sensorKey = (key.replace(/[^a-zA-Z]/g, '')).substring(1); // оставляем только буквы
            this.title_param = sensorKey;
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
    },
    //     messageFromInfoRoom(n) {
    
    // // console.log('MainBody.vue: Функция messageFromMainBody: Получено ообщение', n);
    //     if (n.getConfig !== undefined && n.getConfig === true) { // При получении сообщения  getConfig (true) о завершении обновления  localStorage сбрасываем флаг запроса на обновления localStorage
    //         this.localStorageUpdated = false;
    //       } 
    //     if (n !== undefined && n !== null) {
    //     // console.log('Сообщение messageFromMainBody корректно', n);

    //     try {
    //         if (n.setpointUpdate !== undefined) {
    //         // console.log(' Получено сообщение n.setpointUpdate', n.setpointUpdate );
    //         // console.log(' 1 ---  Компонент APP.vue Функция messageFromMainBody приступила к обработке запроса на изменение значения параметра', n );
    //         this.id_title = n.setpointUpdate.id;
    //         // console.log('Функция messageFromMainBody: id_title:', n.setpointUpdate.id);
    //         // console.log('Функция messageFromMainBody: type:', n.setpointUpdate.type, 'request:', n.setpointUpdate.request, 'name:', n.setpointUpdate.name, 'data:', n.setpointUpdate.setpoint);
            
    //         if (n.setpointUpdate.request === 'setpoint') {
    //             // console.log('отправляем запрос в sendServerRequest на обнновление Уставок  ');
    //         this.$emit('eventsComponent', {
    //             sendServerRequest: {
    //             type: n.setpointUpdate.type, 
    //             request: n.setpointUpdate.request, 
    //             name: n.setpointUpdate.name, 
    //             setpoint: n.setpointUpdate.setpoint
    //             },
    //         });
    //         // console.log('messageFromMainBody Завершаем работу функции, проверяем localStorage:', JSON.parse(localStorage.getItem('manageConfig')));

    //         }
            
    //         } else if (n.sendLogToServer !== undefined) {
    //         // console.log(' MainInfo Получено сообщение n.sendLogToServer', n.sendLogToServer );
    //         this.$emit('eventsComponent', {
    //             sendLogToServer: {
    //             type: n.sendLogToServer.type, 
    //             message: n.sendLogToServer.message, 
    //             },
    //         });
    //         }
    //     } catch (error) {
    //         console.error('MainInfo Функция messageFromMainBody. Ошибка обработки сообщения от MainBody: ', error);
    //         this.$emit('eventsComponent', {
    //             sendLogToServer: {
    //             type: 'error', 
    //             message: `MainInfo Функция messageFromMainBody. Ошибка обработки сообщения от MainBody: `+ error, 
    //             },
    //         });
    //         }
    //     } else {
    //     console.error('MainInfo Функция messageFromMainBody. Value: undefined');
    //     this.$emit('eventsComponent', {
    //             sendLogToServer: {
    //             type: 'error', 
    //             message: `MainInfo Функция messageFromMainBody. Value: undefined`, 
    //             },
    //         });
    //     }

    //     },  
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